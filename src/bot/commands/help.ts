import { Context } from 'telegraf';
import { getSettings } from '../../services/settingsService';
import { cfg } from '../../config';
import { helpKeyboard } from '../keyboards/main';
import { E } from '../emoji';
import path from 'path';
import fs from 'fs';

const helpImagePath = path.join(__dirname, '..', '..', '..', 'assets', 'help.jpg');

const HELP_TEXT =
  `${E.shield} <b>ПОМОЩЬ</b>\n\n` +
  `Здесь всё необходимое для старта работы с ботом.\n\n` +
  `${E.chart} <b>КАК НАЧАТЬ?</b>\n` +
  `<blockquote expandable>` +
  `— <b>Открой мини-приложение</b>\n` +
  `Нажми кнопку «Открыть» внизу сообщения\n\n` +
  `— <b>Зарегистрируйся и введи ID</b>\n` +
  `Создай аккаунт по ссылке и укажи свой 1win ID в разделе «Профиль»\n\n` +
  `— <b>Сделай первый депозит</b>\n` +
  `Пополни баланс — бот получит уведомление автоматически\n\n` +
  `— <b>Получай сигналы</b>\n` +
  `После подтверждения депозита раздел «Сигналы» разблокируется` +
  `</blockquote>\n\n` +
  `${E.pen} <b>ЧАСТЫЕ ВОПРОСЫ:</b>\n` +
  `<blockquote expandable>` +
  `— <b>Зачем боту нужен новый аккаунт?</b>\n` +
  `Для корректной работы алгоритма требуется «чистый» аккаунт без предыстории. Система анализирует поведение аккаунта с момента регистрации: статистику раундов, динамику ставок и паттерны результатов. На основе этих данных модель точнее предсказывает вероятности. Старый аккаунт вносит посторонний шум и снижает точность сигналов.\n\n` +
  `— <b>Почему сигналы недоступны?</b>\n` +
  `Бот ещё не видит твой аккаунт. Для разблокировки: зарегистрируйся по ссылке бота, введи свой ID в разделе «Профиль» и сделай первый депозит. Как только он будет подтверждён — раздел «Сигналы» откроется автоматически, придёт уведомление.\n\n` +
  `— <b>Мой ID не подтверждается</b>\n` +
  `Проверь: ① регистрация пройдена именно по ссылке бота, ② ID введён корректно — только цифры, без пробелов. Найти ID можно в личном кабинете 1win в разделе профиля. Если проблема остаётся — обратись в поддержку.\n\n` +
  `— <b>Как работают сигналы?</b>\n` +
  `Алгоритм прошёл тысячи итераций на реальных данных Tower Rush. Он анализирует текущую статистику раундов, историю коэффициентов и вероятностные паттерны, после чего рассчитывает оптимальное количество этажей, коэффициент и уровень риска. Это не гарантия выигрыша, но статистически обоснованная рекомендация.` +
  `</blockquote>`;

export async function handleHelp(ctx: Context) {
  const settings = await getSettings();
  const miniAppUrl = cfg.miniAppUrl;
  const supportContact = settings.supportContact;
  const keyboard = helpKeyboard(miniAppUrl, supportContact);

  await ctx.reply('📌', {
    entities: [{ type: 'custom_emoji' as any, offset: 0, length: 2, custom_emoji_id: '5397782960512444700' }],
  });

  if (fs.existsSync(helpImagePath)) {
    await ctx.replyWithPhoto({ source: fs.createReadStream(helpImagePath) });
  }

  await ctx.reply(HELP_TEXT, { parse_mode: 'HTML', ...keyboard });
}
