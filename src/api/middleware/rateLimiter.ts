import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Ограничение на генерацию сигналов: 1 запрос в 8 секунд на пользователя.
// Ключ — telegramId (устанавливается telegramAuth до этого middleware).
export const signalRateLimiter = rateLimit({
  windowMs: 8 * 1000,
  max: 1,
  keyGenerator: (req: Request) => String(req.telegramId ?? req.ip),
  message: { error: 'Подождите немного перед следующим сигналом' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
});
