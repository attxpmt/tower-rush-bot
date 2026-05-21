import { Router } from 'express';
import userRouter from './routes/user';
import signalRouter from './routes/signal';
import adminRouter from './routes/admin';
import settingsRouter from './routes/settings';
import { telegramAuth } from './middleware/telegramAuth';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/user', telegramAuth, userRouter);
router.use('/signal', telegramAuth, signalRouter);
router.use('/admin', adminRouter);
router.use('/settings', settingsRouter);

export default router;
