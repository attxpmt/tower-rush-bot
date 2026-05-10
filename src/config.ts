import { config } from 'dotenv';
config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const cfg = {
  botToken: required('BOT_TOKEN'),
  adminIds: required('ADMIN_IDS').split(',').map((id) => parseInt(id.trim(), 10)),
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  miniAppUrl: optional('MINI_APP_URL', 'https://your-domain.com'),
  webhookUrl: optional('WEBHOOK_URL'),
  webhookSecret: optional('WEBHOOK_SECRET'),
  postbackSecret: required('POSTBACK_SECRET'),
  referralUrl: optional('REFERRAL_URL'),
  channelUrl: optional('CHANNEL_URL'),
  isProduction: optional('NODE_ENV') === 'production',
};
