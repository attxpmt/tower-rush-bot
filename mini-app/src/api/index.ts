import api from './client';
import { User, Signal, Settings } from '../types';

export async function fetchUser(telegramId: number): Promise<User> {
  const res = await api.get(`/user/${telegramId}`);
  return res.data;
}

export async function verifyOnewinId(telegramId: number, onewinId: string): Promise<User> {
  const res = await api.post('/user/verify', { telegramId, onewinId });
  return res.data;
}

export async function refreshUserStats(telegramId: number): Promise<User> {
  const res = await api.post('/user/refresh-stats', { telegramId });
  return res.data;
}

export async function getUserAvatar(telegramId: number): Promise<string | null> {
  const res = await api.get(`/user/avatar/${telegramId}`);
  return res.data.url ?? null;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await api.get('/settings/public');
  return res.data;
}

export async function generateSignal(
  telegramId: number,
  strategy: 'stable' | 'moderate' | 'aggressive'
): Promise<Signal> {
  const res = await api.post('/signal', { telegramId, strategy });
  return res.data;
}
