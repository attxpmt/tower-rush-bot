import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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

async function bootstrap() {
  await prisma.$connect();

  const bot = createBot();

  // Start listening first so healthcheck passes immediately
  await new Promise<void>((resolve) => {
    app.listen(cfg.port, () => {
      console.log(`Server running on port ${cfg.port}`);
      resolve();
    });
  });

  if (cfg.isProduction && cfg.webhookUrl) {
    try {
      await bot.telegram.setWebhook(cfg.webhookUrl, {
        secret_token: cfg.webhookSecret,
      });
      app.use(
        bot.webhookCallback('/bot-webhook', { secretToken: cfg.webhookSecret })
      );
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
