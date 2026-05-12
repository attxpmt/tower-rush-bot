import { Telegraf, session } from 'telegraf';
import { cfg } from '../config';
import { handleStart } from './commands/start';
import { handleHelp } from './commands/help';
import { handleAdmin, registerAdminCallbacks, sendAdminNotification } from './commands/admin';
import { startBroadcastScheduler } from '../services/broadcastService';

export { sendAdminNotification };

let postbackListenerRegistered = false;

export function createBot() {
  const bot = new Telegraf(cfg.botToken);

  bot.use(session());

  bot.catch((err: any, ctx) => {
    console.error('[bot:error]', err?.message ?? err, 'update_id:', ctx.update.update_id);
    ctx.reply('Произошла ошибка. Попробуй позже.').catch(() => {});
  });

  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('admin', handleAdmin);

  registerAdminCallbacks(bot);

  startBroadcastScheduler(bot);

  // Guard against duplicate listeners on retry (startBotWithRetry calls createBot again)
  if (!postbackListenerRegistered) {
    postbackListenerRegistered = true;
    process.on('postback' as any, async ({ user, eventType, amount }: any) => {
      if (eventType === 'registration') {
        await sendAdminNotification(
          bot,
          `✅ <b>Новая регистрация!</b>\n` +
          `1win ID: <code>${user.onewinId}</code>\n` +
          `Telegram ID: <code>${user.telegramId}</code>`
        );
      } else if (eventType === 'deposit') {
        const isFirst = user.depositCount === 1;
        await sendAdminNotification(
          bot,
          `${isFirst ? '🎉 <b>Первый депозит!</b>' : '💵 <b>Повторный депозит</b>'}\n` +
          `1win ID: <code>${user.onewinId}</code>\n` +
          `Сумма: <b>${amount ?? '—'}</b>\n` +
          `Всего депозитов: ${user.depositCount}`
        );

        try {
          await bot.telegram.sendMessage(
            user.telegramId.toString(),
            `🎉 <b>Депозит подтверждён!</b>\n\nТеперь тебе доступны сигналы Tower Rush. Открой Mini App и начни!`,
            { parse_mode: 'HTML' }
          );
        } catch (_) {}
      }
    });
  }

  return bot;
}
