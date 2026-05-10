import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const user = WebApp.initDataUnsafe?.user;
    if (user?.id) {
      setTelegramId(user.id);
    }
  }, []);

  return { telegramId, webApp: WebApp };
}
