import api from './client';
import { User, Signal, Settings } from '../types';

export async function fetchUser(): Promise<User> {
  const res = await api.get('/user/me');
  return res.data;
}

export async function verifyOnewinId(onewinId: string): Promise<User> {
  const res = await api.post('/user/verify', { onewinId });
  return res.data;
}

export async function refreshUserStats(): Promise<User> {
  const res = await api.post('/user/refresh-stats');
  return res.data;
}

export async function getUserAvatar(): Promise<string | null> {
  const res = await api.get('/user/avatar/me');
  return res.data.url ?? null;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await api.get('/settings/public');
  return res.data;
}

export async function generateSignal(
  strategy: 'stable' | 'moderate' | 'aggressive'
): Promise<Signal> {
  const res = await api.post('/signal', { strategy });
  return res.data;
}
