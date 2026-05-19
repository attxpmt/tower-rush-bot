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

function extractChannelId(channelUrl: string): string | null {
  const match = channelUrl.match(/t\.me\/([a-zA-Z0-9_]+)/);
  if (match) return '@' + match[1];
  if (channelUrl.startsWith('@') || channelUrl.startsWith('-')) return channelUrl;
  return null;
}

async function checkSubscription(telegram: Telegraf['telegram'], userId: number, channelId: string): Promise<boolean> {
  try {
    const member = await telegram.getChatMember(channelId, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch {
    return true;
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

  if (channelId) {
    const subscribed = await checkSubscription((ctx as any).telegram, userId, channelId);
    if (!subscribed) {
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

    if (!channelId) {
      await ctx.answerCbQuery('✅ Доступ открыт!');
      return sendMainMessage(ctx, settings);
    }

    const subscribed = await checkSubscription(bot.telegram, userId, channelId);
    if (!subscribed) {
      return ctx.answerCbQuery('❌ Подписка не найдена. Подпишись и попробуй снова.', { show_alert: true });
    }

    await ctx.answerCbQuery('✅ Подписка подтверждена!');
    await sendMainMessage(ctx, settings);
  });
}
