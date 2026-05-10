import { Request, Response, NextFunction } from 'express';
import { cfg } from '../../config';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminId = parseInt(req.headers['x-admin-id'] as string ?? '', 10);
  if (!adminId || !cfg.adminIds.includes(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}
