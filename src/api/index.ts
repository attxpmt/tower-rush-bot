import { Router } from 'express';
import userRouter from './routes/user';
import signalRouter from './routes/signal';
import adminRouter from './routes/admin';
import settingsRouter from './routes/settings';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/user', userRouter);
router.use('/signal', signalRouter);
router.use('/admin', adminRouter);
router.use('/settings', settingsRouter);

export default router;
