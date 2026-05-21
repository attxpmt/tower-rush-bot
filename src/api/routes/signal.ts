import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Strategy } from '@prisma/client';
import { generateSignal, getUserSignalStats } from '../../services/signalService';
import { asyncHandler } from '../asyncHandler';

const router = Router();

// telegramId всегда берётся из проверенной подписи (req.telegramId).

const generateSchema = z.object({
  strategy: z.enum(['stable', 'moderate', 'aggressive']),
});

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const signal = await generateSignal(req.telegramId!, parsed.data.strategy as Strategy);
    return res.json(signal);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
}));

router.get('/stats/me', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await getUserSignalStats(req.telegramId!);
    return res.json(stats);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
}));

export default router;
