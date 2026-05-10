import { Router } from 'express';
import userRouter from './routes/user';
import signalRouter from './routes/signal';
import adminRouter from './routes/admin';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/user', userRouter);
router.use('/signal', signalRouter);
router.use('/admin', adminRouter);

export default router;
