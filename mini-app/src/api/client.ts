import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Каждый запрос несёт подписанные Telegram-данные — по ним сервер
// проверяет, что запрос реально пришёл из мини-аппы, и достаёт telegramId.
api.interceptors.request.use((config) => {
  config.headers['X-Telegram-Init-Data'] = WebApp.initData || '';
  return config;
});

export default api;
