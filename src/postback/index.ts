import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { cfg } from '../config';
import { updateUserFromPostback } from '../services/userService';

const router = Router();

// 1win cabinet → PR-инструменты → Ссылки
// Поле "Регистрация":     https://your-domain.com/postback?user_id={user_id}&event=registration&token=SECRET
// Поле "Первый депозит":  https://your-domain.com/postback?user_id={user_id}&amount={amount}&event=deposit&token=SECRET
// Поле "Депозит":         https://your-domain.com/postback?user_id={user_id}&amount={amount}&event=deposit&token=SECRET
//
// Макросы 1win: {user_id} → ID аккаунта, {amount} → сумма депозита

router.get('/', async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;

  if (q.token !== cfg.postbackSecret) {
    return res.status(403).send('Forbidden');
  }

  // Accept both {user_id} (1win macro) and legacy uid
  const onewinId = q.user_id ?? q.uid;
  const event = q.event;

  if (!onewinId || !event) {
    return res.status(400).send('Missing parameters: user_id and event are required');
  }

  const eventType = normalizeEvent(event);
  if (!eventType) {
    return res.status(400).send(`Unknown event type: ${event}`);
  }

  const parsedAmount = q.amount ? parseFloat(q.amount) : undefined;

  await prisma.postback.create({
    data: {
      eventType,
      onewinId,
      amount: parsedAmount,
      raw: q as object,
    },
  });

  try {
    const updatedUser = await updateUserFromPostback(onewinId, eventType, parsedAmount);
    if (updatedUser) {
      process.emit('postback' as any, { user: updatedUser, eventType, amount: parsedAmount });
    }
  } catch (_) {
    // User hasn't linked their ID yet — postback saved, will be applied on linkOnewinId
  }

  return res.status(200).send('OK');
});

function normalizeEvent(event: string): 'registration' | 'deposit' | null {
  const e = event.toLowerCase();
  if (e === 'registration' || e === 'reg' || e === 'lead') return 'registration';
  if (e === 'deposit' || e === 'sale' || e === 'ftd' || e === 'dep') return 'deposit';
  return null;
}

export default router;
