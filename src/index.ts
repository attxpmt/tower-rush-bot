import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { cfg } from './config';
import apiRouter from './api';
import postbackRouter from './postback';
import { createBot } from './bot';
import prisma from './prisma';

const app = express();

// CSP под мини-аппу: разрешаем только нужные источники
// (Telegram-скрипт, Google Fonts, аватарки с api.telegram.org).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://telegram.org'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://api.telegram.org'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(cors({ origin: cfg.miniAppUrl }));
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

// Глобальный обработчик ошибок — ловит всё, что упало в async-роутах,
// и сразу отдаёт 500, не оставляя запрос висеть до таймаута.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api:error]', err?.message ?? err);
  if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
});

async function startBot(): Promise<void> {
  // Схема БД накатывается миграциями (prisma migrate deploy) в start.sh
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

  process.once('SIGINT', () => { try { bot.stop('SIGINT'); } catch (_) {} prisma.$disconnect(); });
  process.once('SIGTERM', () => { try { bot.stop('SIGTERM'); } catch (_) {} prisma.$disconnect(); });
}

async function startBotWithRetry(): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await startBot();
      return;
    } catch (err) {
      console.error(`[startup] Bot init attempt ${attempt} failed, retrying in 10s:`, err);
      await new Promise(r => setTimeout(r, 10000));
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

  // Run bot setup in the background — doesn't block health check
  startBotWithRetry();
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
