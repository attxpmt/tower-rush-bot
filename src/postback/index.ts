import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { cfg } from '../config';
import { asyncHandler } from '../api/asyncHandler';
import { updateUserFromPostback } from '../services/userService';

const router = Router();

// 1win cabinet → PR-инструменты → Ссылки
// Поле "Регистрация":     https://your-domain.com/postback?user_id={user_id}&event=registration&txid={click_id}&token=SECRET
// Поле "Первый депозит":  https://your-domain.com/postback?user_id={user_id}&amount={amount}&event=deposit&txid={transaction_id}&token=SECRET
// Поле "Депозит":         https://your-domain.com/postback?user_id={user_id}&amount={amount}&event=deposit&txid={transaction_id}&token=SECRET
//
// Макросы 1win: {user_id} → ID аккаунта, {amount} → сумма депозита,
//               {transaction_id}/{click_id} → уникальный ID (нужен для защиты от дублей)

const postbackSchema = z.object({
  token: z.string(),
  user_id: z.string().min(1).optional(),
  uid: z.string().min(1).optional(),
  event: z.string().min(1),
  amount: z.coerce.number().nonnegative().optional(),
  txid: z.string().min(1).max(128).optional(),
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

  // Accept both {user_id} (1win macro) and legacy uid
  const onewinId = q.user_id ?? q.uid;
  if (!onewinId) {
    return res.status(400).send('Missing parameters: user_id is required');
  }

  const eventType = normalizeEvent(q.event);
  if (!eventType) {
    return res.status(400).send(`Unknown event type: ${q.event}`);
  }

  // Защита от дублей: 1win при сбое сети повторяет постбэк.
  // Если txId уже встречался — постбэк обработан, депозит повторно не считаем.
  if (q.txid) {
    const existing = await prisma.postback.findUnique({ where: { txId: q.txid } });
    if (existing) {
      return res.status(200).send('OK (duplicate)');
    }
  }

  // В raw сохраняем параметры запроса без секретного token
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
    // P2002 — гонка двух одинаковых постбэков: txId уже записан, это дубль
    if (err?.code === 'P2002') {
      return res.status(200).send('OK (duplicate)');
    }
    throw err;
  }

  try {
    const updatedUser = await updateUserFromPostback(onewinId, eventType, q.amount);
    if (updatedUser) {
      (process.emit as any)('postback', { user: updatedUser, eventType, amount: q.amount });
    }
  } catch (_) {
    // User hasn't linked their ID yet — postback saved, will be applied on linkOnewinId
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
