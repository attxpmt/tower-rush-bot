import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminAuth } from '../middleware/auth';
import { getAdminStats } from '../../services/userService';
import { getSettings, updateSettings } from '../../services/settingsService';

const router = Router();

router.use(adminAuth);

router.get('/stats', async (_req: Request, res: Response) => {
  const stats = await getAdminStats();
  return res.json(stats);
});

router.get('/settings', async (_req: Request, res: Response) => {
  const settings = await getSettings();
  return res.json(settings);
});

const settingsSchema = z.object({
  referralUrl: z.string().url().optional(),
  channelUrl: z.string().optional(),
  promoCode: z.string().max(50).optional(),
  botName: z.string().min(1).max(100).optional(),
  supportContact: z.string().max(100).optional(),
});

router.patch('/settings', async (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const settings = await updateSettings(parsed.data);
  return res.json(settings);
});

export default router;
