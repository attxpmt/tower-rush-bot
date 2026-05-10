import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Strategy } from '@prisma/client';
import { generateSignal, getUserSignalStats } from '../../services/signalService';

const router = Router();

const generateSchema = z.object({
  telegramId: z.number().int().positive(),
  strategy: z.enum(['stable', 'moderate', 'aggressive']),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const signal = await generateSignal(parsed.data.telegramId, parsed.data.strategy as Strategy);
    return res.json(signal);
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

router.get('/stats/:telegramId', async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId, 10);
  if (isNaN(telegramId)) return res.status(400).json({ error: 'Invalid telegramId' });

  try {
    const stats = await getUserSignalStats(telegramId);
    return res.json(stats);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

export default router;
