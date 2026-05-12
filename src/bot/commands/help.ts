import { Context } from 'telegraf';
import { getSettings } from '../../services/settingsService';
import { cfg } from '../../config';
import { helpKeyboard } from '../keyboards/main';
import { E } from '../emoji';
import path from 'path';
import fs from 'fs';

const helpImagePath = path.join(__dirname, '..', '..', '..', 'assets', 'help.jpg');

const HELP_TEXT =
  `${E.pin} <b>ПОМОЩЬ</b>\n\n` +
  `Здесь найдёшь всё необходимое для работы с ботом.\n\n` +
  `<b>📋 КАК НАЧАТЬ</b>\n` +
  `<blockquote expandable>` +
  `1️⃣ <b>Открой мини-приложение</b>\n` +
  `Нажми кнопку «Открыть» внизу сообщения\n\n` +
  `2️⃣ <b>Зарегистрируйся и введи ID</b>\n` +
  `Создай аккаунт по ссылке и укажи свой 1win ID в профиле\n\n` +
  `3️⃣ <b>Сделай первый депозит</b>\n` +
  `Пополни баланс — бот получит уведомление автоматически\n\n` +
  `4️⃣ <b>Получай сигналы</b> 🚀\n` +
  `После подтверждения депозита раздел «Сигналы» разблокируется` +
  `</blockquote>\n\n` +
  `<b>❓ ЧАСТЫЕ ВОПРОСЫ</b>\n\n` +
  `<b>Зачем боту нужен новый аккаунт?</b>\n` +
  `<blockquote expandable>Для корректной работы нейросети требуется «чистый» аккаунт без предыстории. Алгоритм анализирует поведение аккаунта с момента регистрации: статистику раундов, динамику ставок и паттерны результатов. На основе этих данных модель точнее предсказывает вероятности. Если использовать старый аккаунт — в анализ попадёт посторонняя история, что снизит точность сигналов.</blockquote>\n\n` +
  `<b>Почему сигналы недоступны?</b>\n` +
  `<blockquote expandable>Бот ещё не видит твой аккаунт. Для разблокировки необходимо: зарегистрировать аккаунт по ссылке бота, ввести свой ID в разделе «Профиль» мини-приложения и сделать первый депозит. Как только депозит будет подтверждён, раздел «Сигналы» откроется автоматически — ты получишь уведомление.</blockquote>\n\n` +
  `<b>Мой ID не подтверждается</b>\n` +
  `<blockquote expandable>Убедись, что выполнены все условия: ① регистрация пройдена именно по ссылке бота, ② ID введён корректно — только цифры, без букв и пробелов. Найти ID можно в личном кабинете 1win в разделе профиля. Если проблема остаётся — обратись в поддержку.</blockquote>\n\n` +
  `<b>Как работают сигналы?</b>\n` +
  `<blockquote expandable>Нейросеть прошла тысячи тестовых итераций на реальных данных игры Tower Rush. Она анализирует текущую статистику раундов, историю коэффициентов и вероятностные паттерны, после чего рассчитывает оптимальное количество этажей, коэффициент и уровень риска для следующей ставки. Это не гарантия выигрыша, но статистически обоснованная рекомендация.</blockquote>`;

export async function handleHelp(ctx: Context) {
  const settings = await getSettings();
  const miniAppUrl = cfg.miniAppUrl;
  const supportContact = settings.supportContact;
  const keyboard = helpKeyboard(miniAppUrl, supportContact);

  // Big emoji first (renders large in Telegram)
  await ctx.reply('📌', {
    entities: [{ type: 'custom_emoji' as any, offset: 0, length: 2, custom_emoji_id: '5397782960512444700' }],
  });

  if (fs.existsSync(helpImagePath)) {
    await ctx.replyWithPhoto({ source: fs.createReadStream(helpImagePath) });
  }

  await ctx.reply(HELP_TEXT, { parse_mode: 'HTML', ...keyboard });
}
