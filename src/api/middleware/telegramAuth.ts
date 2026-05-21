import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { cfg } from '../../config';

// Расширяем тип запроса — сюда кладём проверенный Telegram ID
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      telegramId?: number;
    }
  }
}

const MAX_AGE_SECONDS = 86400; // initData считается валидной сутки

/**
 * Проверяет подпись Telegram WebApp initData.
 * Возвращает telegramId пользователя или null, если подпись неверна / данные просрочены.
 * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): number | null {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(cfg.botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Сравнение, устойчивое к атакам по времени
  const a = Buffer.from(computedHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    return typeof user?.id === 'number' ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * Middleware: пускает запрос дальше только если заголовок X-Telegram-Init-Data
 * содержит корректно подписанные Telegram данные. telegramId кладётся в req.
 */
export function telegramAuth(req: Request, res: Response, next: NextFunction) {
  const initData = (req.headers['x-telegram-init-data'] as string) || '';
  const telegramId = validateInitData(initData);
  if (!telegramId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.telegramId = telegramId;
  return next();
}
