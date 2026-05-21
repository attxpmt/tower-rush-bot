import { Request, Response, NextFunction } from 'express';
import { cfg } from '../../config';
import { telegramAuth } from './telegramAuth';

/**
 * Admin-доступ: сначала проверяем подпись Telegram initData,
 * затем сверяем telegramId со списком админов.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  telegramAuth(req, res, () => {
    if (!req.telegramId || !cfg.adminIds.includes(req.telegramId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  });
}
