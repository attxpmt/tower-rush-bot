import { Context } from 'telegraf';
import { getOrCreateUser } from '../../services/userService';
import { getSettings } from '../../services/settingsService';
import { cfg } from '../../config';
import { mainKeyboard } from '../keyboards/main';
import { E } from '../emoji';
import path from 'path';
import fs from 'fs';

const startImagePath = path.join(__dirname, '..', '..', '..', 'assets', 'start.jpg');

const START_TEXT =
  `<b>👋 ПРИВЕТСТВУЮ!</b>\n\n` +
  `${E.house} Этот бот создан для тех, кто хочет получать точные сигналы для игры <b>Tower Rush</b>.\n\n` +
  `<b>В основе работы</b> — <i>нейросеть, обученная на тысячах раундов и способная предугадывать вероятности на основе актуальной статистики.</i>\n\n` +
  `<b>🎯 Что умеет бот:</b>\n` +
  `<blockquote>▸ Выдавать сигналы по тому, сколько этажей строить\n` +
  `▸ Вести статистику твоих раундов\n` +
  `▸ Обучать правильной игровой стратегии\n` +
  `▸ Вовремя останавливать тебя от игры и вовремя рекомендовать начинать</blockquote>\n\n` +
  `<b>⚡ Чтобы начать</b> — нажми кнопку «Открыть» ниже.\n\n` +
  `<tg-spoiler>Доступ к сигналам открывается после регистрации и первого депозита.</tg-spoiler>\n\n` +
  `<b><i>${E.pin} Остались вопросы? Напиши /help</i></b>`;

export async function handleStart(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await getOrCreateUser(userId);
  const settings = await getSettings();

  const referralUrl = settings.referralUrl || cfg.referralUrl;
  const miniAppUrl = cfg.miniAppUrl;
  const keyboard = mainKeyboard(miniAppUrl, referralUrl);

  if (fs.existsSync(startImagePath)) {
    await ctx.replyWithPhoto(
      { source: fs.createReadStream(startImagePath) },
      { caption: START_TEXT, parse_mode: 'HTML', ...keyboard }
    );
  } else {
    await ctx.reply(START_TEXT, { parse_mode: 'HTML', ...keyboard });
  }
}
