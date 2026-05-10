import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { fetchUser } from '../api';

export function useUser(telegramId: number | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!telegramId) return;
    setLoading(true);
    try {
      const data = await fetchUser(telegramId);
      setUser(data);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => { load(); }, [load]);

  return { user, loading, refetch: load, setUser };
}
