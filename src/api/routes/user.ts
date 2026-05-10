import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getOrCreateUser, getUserByTelegramId, linkOnewinId } from '../../services/userService';

const router = Router();

router.get('/:telegramId', async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId, 10);
  if (isNaN(telegramId)) return res.status(400).json({ error: 'Invalid telegramId' });

  const user = await getOrCreateUser(telegramId);
  return res.json(serializeUser(user));
});

const verifySchema = z.object({
  telegramId: z.number().int().positive(),
  onewinId: z.string().min(1).max(50),
});

router.post('/verify', async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { telegramId, onewinId } = parsed.data;

  try {
    const user = await linkOnewinId(telegramId, onewinId);
    return res.json(serializeUser(user));
  } catch (err: any) {
    return res.status(409).json({ error: err.message });
  }
});

function serializeUser(user: any) {
  return { ...user, telegramId: user.telegramId.toString() };
}

export default router;
