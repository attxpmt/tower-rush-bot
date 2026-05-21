import { Router, Request, Response } from 'express';
import { getSettings } from '../../services/settingsService';
import { asyncHandler } from '../asyncHandler';

const router = Router();

// Public settings — only safe fields, no auth required
router.get('/public', asyncHandler(async (_req: Request, res: Response) => {
  const s = await getSettings();
  return res.json({
    referralUrl: s.referralUrl,
    channelUrl: s.channelUrl,
    promoCode: s.promoCode,
    botName: s.botName,
    supportContact: s.supportContact,
    botVersion: s.botVersion,
  });
}));

export default router;
