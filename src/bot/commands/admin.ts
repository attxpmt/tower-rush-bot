import { Context, Telegraf } from 'telegraf';
import { cfg } from '../../config';
import { getAdminStats } from '../../services/userService';
import { getSettings, updateSettings } from '../../services/settingsService';
import { adminKeyboard } from '../keyboards/main';

function isAdmin(ctx: Context): boolean {
  return cfg.adminIds.includes(ctx.from?.id ?? 0);
}

export async function handleAdmin(ctx: Context) {
  if (!isAdmin(ctx)) {
    return ctx.reply('⛔ Доступ запрещён');
  }

  await ctx.reply('🛠 <b>Панель администратора</b>\n\nВыбери действие:', {
    parse_mode: 'HTML',
    ...adminKeyboard(),
  });
}

export function registerAdminCallbacks(bot: Telegraf) {
  // Stats
  bot.action('admin:stats', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();

    const stats = await getAdminStats();
    await ctx.editMessageText(
      `📊 <b>Статистика</b>\n\n` +
      `👥 Всего пользователей: <b>${stats.totalUsers}</b>\n` +
      `✅ Зарегистрировано: <b>${stats.registered}</b>\n` +
      `💰 Сделали депозит: <b>${stats.deposited}</b>\n` +
      `🎯 Сигналов выдано: <b>${stats.signalsCount}</b>\n` +
      `🔥 Активных за 24ч: <b>${stats.activeToday}</b>\n` +
      `📈 Конверсия: <b>${stats.conversionRate}%</b>`,
      { parse_mode: 'HTML', ...adminKeyboard() }
    );
  });

  // Referral URL
  bot.action('admin:referral', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    await ctx.reply('Введи новую реферальную ссылку 1win:');
    // State handled via session below
    (ctx as any).session = { awaitingField: 'referralUrl' };
  });

  // Channel URL
  bot.action('admin:channel', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    await ctx.reply('Введи новую ссылку на Telegram-канал:');
    (ctx as any).session = { awaitingField: 'channelUrl' };
  });

  // Promo code
  bot.action('admin:promo', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    await ctx.reply('Введи новый промокод:');
    (ctx as any).session = { awaitingField: 'promoCode' };
  });

  // Bot name
  bot.action('admin:botname', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    await ctx.reply('Введи новое название бота для Mini App:');
    (ctx as any).session = { awaitingField: 'botName' };
  });

  // Handle text replies for admin settings
  bot.on('text', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();

    const field = (ctx as any).session?.awaitingField;
    if (!field) return next();

    const value = ctx.message.text;
    (ctx as any).session = null;

    const fieldMap: Record<string, string> = {
      referralUrl: 'Реферальная ссылка',
      channelUrl: 'Ссылка на канал',
      promoCode: 'Промокод',
      botName: 'Название бота',
    };

    await updateSettings({ [field]: value });
    await ctx.reply(`✅ ${fieldMap[field] ?? field} обновлено:\n<code>${value}</code>`, {
      parse_mode: 'HTML',
    });

    return;
  });
}

export async function sendAdminNotification(
  bot: Telegraf,
  message: string
) {
  for (const adminId of cfg.adminIds) {
    try {
      await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
    } catch (_) {}
  }
}
