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
  const botName = settings.botName;

  await ctx.reply(
    `🎮 <b>Добро пожаловать в ${botName}!</b>\n\n` +
    `Я помогу тебе получать сигналы для игры <b>Tower Rush</b> на 1win.\n\n` +
    `<b>Как получить доступ:</b>\n` +
    `1️⃣ Зарегистрируйся на 1win по моей реферальной ссылке\n` +
    `2️⃣ Подтверди свой ID в приложении\n` +
    `3️⃣ Сделай первый депозит\n` +
    `4️⃣ Получай сигналы 🚀\n\n` +
    `Нажми кнопку ниже, чтобы начать:`,
    {
      parse_mode: 'HTML',
      ...mainKeyboard(miniAppUrl, referralUrl),
    }
  );
}
