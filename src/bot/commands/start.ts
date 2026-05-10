import { Context } from 'telegraf';
import { getOrCreateUser } from '../../services/userService';
import { getSettings } from '../../services/settingsService';
import { cfg } from '../../config';
import { mainKeyboard } from '../keyboards/main';

export async function handleStart(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  await getOrCreateUser(userId);
  const settings = await getSettings();

  const referralUrl = settings.referralUrl || cfg.referralUrl;
  const miniAppUrl = cfg.miniAppUrl;

  await ctx.reply(
    `🎰 <b>Приветствуем!</b>\n\n` +
    `Этот бот создан для тех, кто хочет получать точные сигналы для игры <b>Tower Rush</b>. ` +
    `В основе работы — нейросеть, обученная на тысячах раундов и способная предугадывать вероятности на основе актуальной статистики.\n\n` +
    `<b>🎯 Что умеет бот:</b>\n` +
    `▸ Выдавать сигналы с коэффициентом и уровнем риска\n` +
    `▸ Вести статистику твоих раундов\n` +
    `▸ Обучать правильной игровой стратегии\n` +
    `▸ Уведомлять о подтверждении аккаунта и депозита\n\n` +
    `⚡ <b>Чтобы начать</b> — нажми кнопку <b>«Открыть»</b> ниже.\n` +
    `Доступ к сигналам открывается после регистрации и первого депозита.\n\n` +
    `📌 <i>Остались вопросы? Напиши</i> /help`,
    {
      parse_mode: 'HTML',
      ...mainKeyboard(miniAppUrl, referralUrl),
    }
  );
}
