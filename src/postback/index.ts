import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { cfg } from '../config';
import { asyncHandler } from '../api/asyncHandler';
import { updateUserFromPostback, autoLinkViaRegistration } from '../services/userService';

const router = Router();

// 1win cabinet → PR-инструменты → Ссылки
// Регистрация:   https://your-domain.com/postback?user_id={user_id}&event=registration&sub1={sub1}&txid={click_id}&token=SECRET
// Все депозиты:  https://your-domain.com/postback?user_id={user_id}&amount={amount}&event=deposit&sub1={sub1}&txid={transaction_id}&token=SECRET
//
// {sub1} = telegramId пользователя, вставляется ботом в реферальную ссылку.
// Именно наличие registration-постбэка с sub1 даёт registeredViaReferral = true
// и открывает доступ к сигналам после депозита.

const postbackSchema = z.object({
  token: z.string(),
  user_id: z.string().min(1).optional(),
  uid: z.string().min(1).optional(),
  event: z.string().min(1),
  amount: z.coerce.number().nonnegative().optional(),
  txid: z.string().min(1).max(128).optional(),
  sub1: z.string().min(1).max(64).optional(),
});

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = postbackSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).send('Invalid parameters');
  }
  const q = parsed.data;

  if (q.token !== cfg.postbackSecret) {
    return res.status(403).send('Forbidden');
  }

  const onewinId = q.user_id ?? q.uid;
  if (!onewinId) {
    return res.status(400).send('Missing parameters: user_id is required');
  }

  const eventType = normalizeEvent(q.event);
  if (!eventType) {
    return res.status(400).send(`Unknown event type: ${q.event}`);
  }

  // Защита от дублей
  if (q.txid) {
    const existing = await prisma.postback.findUnique({ where: { txId: q.txid } });
    if (existing) {
      return res.status(200).send('OK (duplicate)');
    }
  }

  const { token: _token, ...rawParams } = req.query as Record<string, unknown>;

  try {
    await prisma.postback.create({
      data: {
        eventType,
        onewinId,
        amount: q.amount,
        txId: q.txid ?? null,
        raw: rawParams as object,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(200).send('OK (duplicate)');
    }
    throw err;
  }

  try {
    // Registration + sub1: авто-привязка через реферальную ссылку
    if (eventType === 'registration' && q.sub1) {
      const linked = await autoLinkViaRegistration(q.sub1, onewinId);
      if (linked) {
        (process.emit as any)('postback', { user: linked, eventType, amount: q.amount });
        return res.status(200).send('OK');
      }
    }

    // Стандартный путь: пользователь уже привязал onewinId вручную
    const updatedUser = await updateUserFromPostback(onewinId, eventType, q.amount);
    if (updatedUser) {
      (process.emit as any)('postback', { user: updatedUser, eventType, amount: q.amount });
    }
  } catch (_) {
    // Пользователь ещё не привязал ID — постбэк сохранён, применится при linkOnewinId
  }

  return res.status(200).send('OK');
}));

function normalizeEvent(event: string): 'registration' | 'deposit' | null {
  const e = event.toLowerCase();
  if (e === 'registration' || e === 'reg' || e === 'lead') return 'registration';
  if (e === 'deposit' || e === 'sale' || e === 'ftd' || e === 'dep') return 'deposit';
  return null;
}

export default router;
