import { Context, Telegraf, Markup } from 'telegraf';
import { getOrCreateUser } from '../../services/userService';
import { getSettings } from '../../services/settingsService';
import { cfg } from '../../config';
import { mainKeyboard } from '../keyboards/main';
import { E } from '../emoji';
import path from 'path';
import fs from 'fs';

const startImagePath = path.join(__dirname, '..', '..', '..', 'assets', 'start.jpg');

const START_TEXT =
  `${E.house} <b>TOWER RUSH SIGNALS</b>\n\n` +
  `${E.shield} Этот бот создан для тех, кто играет в Tower Rush и хочет принимать решения на основе данных, а не интуиции.\n\n` +
  `<b>${E.chart} Что делает бот:</b>\n` +
  `<blockquote>▸ Выдаёт сигналы — сколько этажей строить и с каким коэффициентом\n` +
  `▸ Подбирает стратегию под твой стиль игры\n` +
  `▸ Ведёт статистику раундов и считает винрейт\n` +
  `▸ Обучает правильному входу и выходу из раунда</blockquote>\n\n` +
  `${E.starStruck} <b>В основе</b> — алгоритм, прошедший тысячи итераций на реальных данных игры.\n\n` +
  `<tg-spoiler>Сигналы открываются после регистрации и первого депозита на 1win.</tg-spoiler>\n\n` +
  `<b><i>${E.pin} Вопросы? Напиши /help</i></b>`;

const SUBSCRIBE_TEXT =
  `${E.shield} <b>ДОСТУП К БОТУ</b>\n\n` +
  `${E.pin} Прежде чем начать — подпишись на официальный канал <b>Tower Rush</b>.\n\n` +
  `<blockquote>Там выходит свежая аналитика, статистика раундов и обновления алгоритма — всё что нужно для игры.</blockquote>\n\n` +
  `${E.lightning} Подпишись и нажми кнопку «Проверить» — сразу открою доступ.`;

type SubStatus = 'subscribed' | 'not_subscribed' | 'check_failed';

function extractChannelId(channelUrl: string): string | null {
  const s = channelUrl.trim();
  if (!s) return null;
  // @username или числовой ID напрямую
  if (s.startsWith('@') || s.startsWith('-')) return s;
  // https://t.me/username — только публичные каналы с username
  // joinchat/ и /+ (инвайт-ссылки) — НЕ подходят для getChatMember
  if (s.includes('/joinchat/') || s.includes('/+') || s.includes('t.me/+')) return null;
  const match = s.match(/t\.me\/([a-zA-Z0-9_]{3,})/);
  if (match) return '@' + match[1];
  return null;
}

async function checkSubscription(telegram: Telegraf['telegram'], userId: number, channelId: string): Promise<SubStatus> {
  try {
    const member = await telegram.getChatMember(channelId, userId);
    return ['member', 'administrator', 'creator'].includes(member.status)
      ? 'subscribed'
      : 'not_subscribed';
  } catch (err: any) {
    console.error(`[subscription] check failed for channel "${channelId}":`, err?.message ?? err);
    return 'check_failed';
  }
}

// Отправляет алерт всем администраторам бота
async function alertAdmins(telegram: Telegraf['telegram'], text: string) {
  for (const adminId of cfg.adminIds) {
    try {
      await telegram.sendMessage(adminId, text, { parse_mode: 'HTML' });
    } catch (_) {}
  }
}

export async function sendMainMessage(ctx: Context, settings?: Awaited<ReturnType<typeof getSettings>>) {
  if (!settings) settings = await getSettings();
  const referralUrl = settings.referralUrl || cfg.referralUrl;
  const keyboard = mainKeyboard(cfg.miniAppUrl, referralUrl);

  await ctx.reply('⚡️', {
    entities: [{ type: 'custom_emoji' as any, offset: 0, length: 2, custom_emoji_id: '5258203794772085854' }],
  });

  if (fs.existsSync(startImagePath)) {
    await ctx.replyWithPhoto(
      { source: fs.createReadStream(startImagePath) },
      { caption: START_TEXT, parse_mode: 'HTML', ...keyboard }
    );
  } else {
    await ctx.reply(START_TEXT, { parse_mode: 'HTML', ...keyboard });
  }
}

export async function handleStart(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await getOrCreateUser(userId);
  const settings = await getSettings();

  const channelUrl = settings.channelUrl;
  const channelId = channelUrl ? extractChannelId(channelUrl) : null;

  // channelUrl задан, но формат не распознан → блокируем и алертим
  if (channelUrl && !channelId) {
    console.error(`[subscription] Cannot parse channelUrl: "${channelUrl}"`);
    await alertAdmins(
      (ctx as any).telegram,
      `⚠️ <b>Неверный формат ссылки на канал!</b>\n\n` +
      `Текущее значение: <code>${channelUrl}</code>\n\n` +
      `Допустимые форматы:\n` +
      `• <code>https://t.me/channel_name</code>\n` +
      `• <code>@channel_name</code>\n` +
      `• <code>-100123456789</code> (ID закрытого канала)\n\n` +
      `Смени ссылку в настройках бота — /admin → Данные → Канал`
    );
    return ctx.reply('⚠️ Временная ошибка доступа. Попробуй через минуту.');
  }

  if (channelId) {
    const status = await checkSubscription((ctx as any).telegram, userId, channelId);

    if (status === 'check_failed') {
      await alertAdmins(
        (ctx as any).telegram,
        `⚠️ <b>Ошибка проверки подписки!</b>\n\nБот не может проверить членство в канале <code>${channelId}</code>.\nПроверь, что бот является <b>администратором</b> канала — иначе гейт не работает.`
      );
      return ctx.reply('⚠️ Не могу проверить подписку на канал. Попробуй через минуту.');
    }

    if (status === 'not_subscribed') {
      await ctx.reply('⚡️', {
        entities: [{ type: 'custom_emoji' as any, offset: 0, length: 2, custom_emoji_id: '5258203794772085854' }],
      });
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('📢 Перейти в канал', channelUrl)],
        [Markup.button.callback('✅ Я подписался — проверить', 'check_sub')],
      ]);
      return ctx.reply(SUBSCRIBE_TEXT, { parse_mode: 'HTML', ...keyboard });
    }
  }

  await sendMainMessage(ctx, settings);
}

export function registerSubscriptionCallbacks(bot: Telegraf) {
  bot.action('check_sub', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return ctx.answerCbQuery();

    const settings = await getSettings();
    const channelUrl = settings.channelUrl;
    const channelId = channelUrl ? extractChannelId(channelUrl) : null;

    if (channelUrl && !channelId) {
      await alertAdmins(
        bot.telegram,
        `⚠️ <b>Неверный формат ссылки на канал!</b>\n\nТекущее значение: <code>${channelUrl}</code>\n\nИспользуй @username или числовой ID канала.`
      );
      return ctx.answerCbQuery('⚠️ Ошибка настройки. Свяжись с администратором.', { show_alert: true });
    }

    if (!channelId) {
      await ctx.answerCbQuery('✅ Доступ открыт!');
      return sendMainMessage(ctx, settings);
    }

    const status = await checkSubscription(bot.telegram, userId, channelId);

    if (status === 'check_failed') {
      await alertAdmins(
        bot.telegram,
        `⚠️ <b>Ошибка проверки подписки!</b>\n\nБот не может проверить членство в канале <code>${channelId}</code>.\nПроверь, что бот является <b>администратором</b> канала.`
      );
      return ctx.answerCbQuery('⚠️ Ошибка проверки. Попробуй через минуту.', { show_alert: true });
    }

    if (status === 'not_subscribed') {
      return ctx.answerCbQuery('❌ Подписка не найдена. Подпишись и попробуй снова.', { show_alert: true });
    }

    await ctx.answerCbQuery('✅ Подписка подтверждена!');
    await sendMainMessage(ctx, settings);
  });
}
