import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getOrCreateUser, linkOnewinId } from '../../services/userService';
import { cfg } from '../../config';

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

// Force-refresh user data (used by Profile refresh button)
router.post('/refresh-stats', async (req: Request, res: Response) => {
  const { telegramId } = req.body;
  const id = parseInt(telegramId, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid telegramId' });

  const user = await getOrCreateUser(id);
  return res.json(serializeUser(user));
});

// Get Telegram profile photo URL
router.get('/avatar/:telegramId', async (req: Request, res: Response) => {
  const telegramId = parseInt(req.params.telegramId, 10);
  if (isNaN(telegramId)) return res.status(400).json({ error: 'Invalid telegramId' });

  try {
    const token = cfg.botToken;
    const photosRes = await fetch(
      `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
    );
    const photosData = await photosRes.json() as any;

    if (!photosData.ok || photosData.result.total_count === 0) {
      return res.json({ url: null });
    }

    const fileId = photosData.result.photos[0][0].file_id;
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json() as any;

    if (!fileData.ok) return res.json({ url: null });

    const url = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    return res.json({ url });
  } catch {
    return res.json({ url: null });
  }
});

function serializeUser(user: any) {
  return {
    ...user,
    telegramId: user.telegramId.toString(),
    totalDeposit: user.totalDeposit.toString(),
    balance: user.balance.toString(),
    withdrawalTotal: user.withdrawalTotal.toString(),
    onewinRegisteredAt: user.onewinRegisteredAt?.toISOString() ?? null,
  };
}

export default router;
