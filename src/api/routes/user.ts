import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getOrCreateUser, linkOnewinId } from '../../services/userService';
import { asyncHandler } from '../asyncHandler';
import { cfg } from '../../config';

const router = Router();

// telegramId всегда берётся из проверенной подписи (req.telegramId), не из запроса.

// Кеш аватарок: без него каждая загрузка профиля = 2 запроса в Telegram API.
const AVATAR_TTL_MS = 86_400_000; // 24 часа
const avatarCache = new Map<number, { url: string | null; at: number }>();

router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const user = await getOrCreateUser(req.telegramId!);
  return res.json(serializeUser(user));
}));

const verifySchema = z.object({
  onewinId: z.string().min(1).max(50),
});

router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const user = await linkOnewinId(req.telegramId!, parsed.data.onewinId);
    return res.json(serializeUser(user));
  } catch (err: any) {
    return res.status(409).json({ error: err.message });
  }
}));

// Force-refresh user data (used by Profile refresh button)
router.post('/refresh-stats', asyncHandler(async (req: Request, res: Response) => {
  const user = await getOrCreateUser(req.telegramId!);
  return res.json(serializeUser(user));
}));

// Get Telegram profile photo URL
router.get('/avatar/me', asyncHandler(async (req: Request, res: Response) => {
  const telegramId = req.telegramId!;

  const cached = avatarCache.get(telegramId);
  if (cached && Date.now() - cached.at < AVATAR_TTL_MS) {
    return res.json({ url: cached.url });
  }

  const setAndReturn = (url: string | null) => {
    avatarCache.set(telegramId, { url, at: Date.now() });
    return res.json({ url });
  };

  try {
    const token = cfg.botToken;
    const photosRes = await fetch(
      `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
    );
    const photosData = await photosRes.json() as any;

    if (!photosData.ok || photosData.result.total_count === 0) {
      return setAndReturn(null);
    }

    const fileId = photosData.result.photos[0][0].file_id;
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json() as any;

    if (!fileData.ok) return setAndReturn(null);

    const url = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    return setAndReturn(url);
  } catch {
    return res.json({ url: null });
  }
}));

// Явный белый список полей — наружу уходит только то, что нужно мини-аппе.
function serializeUser(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    onewinId: user.onewinId,
    status: user.status,
    hasDeposit: user.hasDeposit,
    totalDeposit: user.totalDeposit.toString(),
    depositCount: user.depositCount,
    signalsUsed: user.signalsUsed,
    balance: user.balance.toString(),
    withdrawalTotal: user.withdrawalTotal.toString(),
    lastBalanceAt: user.lastBalanceAt?.toISOString() ?? null,
    onewinRegisteredAt: user.onewinRegisteredAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
