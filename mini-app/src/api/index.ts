import api from './client';
import { User, Signal, SignalStats, AdminStats } from '../types';

export async function fetchUser(telegramId: number): Promise<User> {
  const res = await api.get(`/user/${telegramId}`);
  return res.data;
}

export async function verifyOnewinId(telegramId: number, onewinId: string): Promise<User> {
  const res = await api.post('/user/verify', { telegramId, onewinId });
  return res.data;
}

export async function generateSignal(
  telegramId: number,
  strategy: 'stable' | 'moderate' | 'aggressive'
): Promise<Signal> {
  const res = await api.post('/signal', { telegramId, strategy });
  return res.data;
}

export async function fetchSignalStats(telegramId: number): Promise<SignalStats> {
  const res = await api.get(`/signal/stats/${telegramId}`);
  return res.data;
}
