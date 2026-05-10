import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { spawn } from 'child_process';
import { cfg } from './config';
import apiRouter from './api';
import postbackRouter from './postback';
import { createBot } from './bot';
import prisma from './prisma';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use('/postback', postbackRouter);

// Serve Mini App static files
const miniAppDist = path.join(__dirname, '..', 'mini-app', 'dist');
app.use(express.static(miniAppDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(miniAppDist, 'index.html'));
});

function pushDbSchema(): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');
    const proc = spawn(bin, ['db', 'push', '--accept-data-loss', '--skip-generate'], {
      stdio: 'inherit',
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`prisma db push exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function applyDbSchema(): Promise<void> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`[startup] prisma db push (attempt ${attempt}/5)...`);
      await pushDbSchema();
      console.log('[startup] DB schema ready');
      return;
    } catch (err) {
      if (attempt === 5) {
        console.error('[startup] prisma db push failed after 5 attempts');
        throw err;
      }
      console.error(`[startup] attempt ${attempt} failed, retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function bootstrap() {
  // Start HTTP server first — health check passes immediately
  await new Promise<void>((resolve) => {
    app.listen(cfg.port, () => {
      console.log(`Server running on port ${cfg.port}`);
      resolve();
    });
  });

  // Apply DB schema with retries (non-blocking for HTTP server)
  await applyDbSchema();

  await prisma.$connect();

  const bot = createBot();

  if (cfg.isProduction && cfg.webhookUrl) {
    try {
      await bot.telegram.setWebhook(cfg.webhookUrl, {
        secret_token: cfg.webhookSecret || undefined,
      });

      // Explicit POST route is more reliable than app.use(webhookCallback)
      app.post('/bot-webhook', (req: Request, res: Response) => {
        if (cfg.webhookSecret) {
          const header = req.headers['x-telegram-bot-api-secret-token'];
          if (header !== cfg.webhookSecret) {
            res.sendStatus(403);
            return;
          }
        }
        bot.handleUpdate(req.body, res).catch((e) => {
          console.error('[webhook] handleUpdate error:', e);
          if (!res.headersSent) res.sendStatus(500);
        });
      });

      console.log('Bot running in webhook mode:', cfg.webhookUrl);
    } catch (err) {
      console.error('Webhook setup failed, falling back to long-polling:', err);
      bot.launch();
    }
  } else {
    bot.launch();
    console.log('Bot running in long-polling mode');
  }

  process.once('SIGINT', () => { bot.stop('SIGINT'); prisma.$disconnect(); });
  process.once('SIGTERM', () => { bot.stop('SIGTERM'); prisma.$disconnect(); });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
