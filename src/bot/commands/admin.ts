import { Context, Telegraf, Markup } from 'telegraf';
import { cfg } from '../../config';
import { E } from '../emoji';
import { getAdminStatsWithPeriod, getAllUsersForExport, StatsPeriod } from '../../services/userService';
import { getSettings, updateSettings } from '../../services/settingsService';
import {
  runBroadcast,
  scheduleBroadcast,
  progressBar,
  formatDuration,
  categoryLabel,
  BroadcastCategory,
} from '../../services/broadcastService';

// ─── types ───────────────────────────────────────────────────────────────────

interface BroadcastSetup {
  category?: BroadcastCategory;
  message?: string;
  photoFileId?: string;
  scheduledAt?: Date | null; // null = send now
  step?: 'awaiting_message' | 'awaiting_schedule_text';
  setupMsgId?: number;
  chatId?: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isAdmin(ctx: Context): boolean {
  return cfg.adminIds.includes(ctx.from?.id ?? 0);
}

function s(ctx: Context): any {
  if (!(ctx as any).session) (ctx as any).session = {};
  return (ctx as any).session;
}

function bcSetup(ctx: Context): BroadcastSetup {
  if (!s(ctx).broadcastSetup) s(ctx).broadcastSetup = {};
  return s(ctx).broadcastSetup;
}

function periodLabel(p: StatsPeriod): string {
  return { all: 'Все время', day: '24 часа', week: 'Неделя', month: 'Месяц' }[p];
}

// ─── text builders ────────────────────────────────────────────────────────────

function adminPanelText() {
  return (
    `${E.shield} <b>АДМИН ПАНЕЛЬ</b>\n\n` +
    `Управляй ботом, отслеживай статистику и запускай рассылки.`
  );
}

function adminPanelKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Статистика', 'admin:stats:all'),
      Markup.button.callback('⚙️ Данные', 'admin:data'),
      Markup.button.callback('📣 Рассылка', 'admin:broadcast'),
    ],
  ]);
}

async function statsText(period: StatsPeriod) {
  const st = await getAdminStatsWithPeriod(period);
  const label = periodLabel(period);

  const periodBlock = period === 'all'
    ? `👥 Пользователей всего: <b>${st.totalUsers}</b>\n` +
      `├ ✅ Зарегистрировались: <b>${st.registeredTotal}</b> (${st.visit2reg}%)\n` +
      `├ ${E.moneybag} Сделали депозит: <b>${st.depositedTotal}</b> (${st.reg2dep}%)\n` +
      `└ 👑 VIP: <b>${st.vipTotal}</b>`
    : `👥 Новых пользователей: <b>${st.periodUsers}</b>\n` +
      `├ ✅ Регистраций: <b>${st.registrations}</b>\n` +
      `└ ${E.moneybag} Депозитов: <b>${st.deposits}</b>`;

  return (
    `${E.chart} <b>СТАТИСТИКА</b>  ·  <i>${label}</i>\n\n` +
    `${periodBlock}\n\n` +
    `📈 <b>Конверсия</b>\n` +
    `├ Переход → Регистрация: <b>${st.visit2reg}%</b>\n` +
    `└ Регистрация → Депозит: <b>${st.reg2dep}%</b>\n\n` +
    `${E.dollar} <b>Финансы</b>\n` +
    `└ Сумма депозитов: <b>$${st.totalDepositAmount}</b>\n\n` +
    `🎯 <b>Активность</b>\n` +
    `├ Сигналов выдано: <b>${st.signalsCount}</b>\n` +
    `├ Активных за 24ч: <b>${st.activeUsers}</b>\n` +
    `└ 🚫 Заблокировали бота: <b>${st.blockedTotal}</b>`
  );
}

function statsKeyboard(active: StatsPeriod) {
  const btn = (p: StatsPeriod) => {
    const label = periodLabel(p);
    return Markup.button.callback(active === p ? `✔ ${label}` : label, `admin:stats:${p}`);
  };
  return Markup.inlineKeyboard([
    [btn('all'), btn('day'), btn('week'), btn('month')],
    [Markup.button.callback('◀️ Назад', 'admin:back')],
  ]);
}

async function dataText() {
  const settings = await getSettings();
  return (
    `⚙️ <b>ДАННЫЕ БОТА</b>\n\n` +
    `🔗 Реф. ссылка: ${settings.referralUrl || '<i>не задана</i>'}\n` +
    `📢 Телеграм-канал: ${settings.channelUrl || '<i>не задан</i>'}\n` +
    `🎁 Промокод: ${settings.promoCode || '<i>не задан</i>'}\n` +
    `✏️ Название бота: <b>${settings.botName}</b>\n` +
    `👤 Поддержка: ${settings.supportContact || '<i>не задана</i>'}`
  );
}

function dataKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🔗 Реф. ссылка', 'admin:set:referralUrl'),
      Markup.button.callback('📢 Канал', 'admin:set:channelUrl'),
    ],
    [
      Markup.button.callback('🎁 Промокод', 'admin:set:promoCode'),
      Markup.button.callback('✏️ Название', 'admin:set:botName'),
    ],
    [Markup.button.callback('👤 Поддержка', 'admin:set:supportContact')],
    [Markup.button.callback('◀️ Назад', 'admin:back')],
  ]);
}

function msgDone(bc: BroadcastSetup): boolean {
  return bc.message !== undefined && (bc.message.trim().length > 0 || !!bc.photoFileId);
}

function broadcastText(bc: BroadcastSetup) {
  const catDone = !!bc.category;
  const timeDone = bc.scheduledAt !== undefined;
  const allDone = catDone && msgDone(bc) && timeDone;

  let body = `📣 <b>РАССЫЛКА</b>\n\n`;
  if (allDone) {
    const timeStr = bc.scheduledAt === null
      ? 'Сейчас'
      : bc.scheduledAt!.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    const rawPreview = bc.photoFileId && !bc.message?.trim()
      ? '📷 [Фото]'
      : (bc.message!.length > 60 ? bc.message!.slice(0, 60) + '…' : bc.message!);
    const preview = rawPreview;
    body += `✅ Все параметры настроены, рассылка готова к запуску!\n\n` +
      `🎯 Аудитория: <b>${categoryLabel(bc.category!)}</b>\n` +
      `💬 Сообщение: <i>${preview}</i>\n` +
      `⏰ Время: <b>${timeStr}</b>`;
  } else {
    body += `Настрой 3 параметра, чтобы запустить рассылку выбранной аудитории.`;
  }

  return body;
}

function broadcastKeyboard(bc: BroadcastSetup) {
  const catDone = !!bc.category;
  const timeDone = bc.scheduledAt !== undefined;
  const allDone = catDone && msgDone(bc) && timeDone;

  return Markup.inlineKeyboard([
    [
      Markup.button.callback(`${catDone ? '✅' : '◽'} Категория`, 'admin:bc:category'),
      Markup.button.callback(`${msgDone(bc) ? '✅' : '◽'} Сообщение`, 'admin:bc:message'),
      Markup.button.callback(`${timeDone ? '✅' : '◽'} Время`, 'admin:bc:schedule'),
    ],
    [Markup.button.callback(allDone ? '🚀 Запустить' : '⚪ Запустить (настрой всё)', 'admin:bc:send')],
    [Markup.button.callback('◀️ Назад', 'admin:back')],
  ]);
}

// ─── main command ─────────────────────────────────────────────────────────────

export async function handleAdmin(ctx: Context) {
  if (!isAdmin(ctx)) return ctx.reply('⛔ Доступ запрещён');
  s(ctx).broadcastSetup = null;
  s(ctx).awaitingField = null;
  await ctx.reply(adminPanelText(), { parse_mode: 'HTML', ...adminPanelKeyboard() });
}

// ─── callbacks ────────────────────────────────────────────────────────────────

export function registerAdminCallbacks(bot: Telegraf) {

  // ── back ──────────────────────────────────────────────────────────────────
  bot.action('admin:back', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    s(ctx).broadcastSetup = null;
    s(ctx).awaitingField = null;
    try {
      await ctx.editMessageText(adminPanelText(), { parse_mode: 'HTML', ...adminPanelKeyboard() });
    } catch (_) {
      await ctx.reply(adminPanelText(), { parse_mode: 'HTML', ...adminPanelKeyboard() });
    }
  });

  // ── stats ─────────────────────────────────────────────────────────────────
  for (const period of ['all', 'day', 'week', 'month'] as StatsPeriod[]) {
    bot.action(`admin:stats:${period}`, async (ctx) => {
      if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageText(await statsText(period), {
          parse_mode: 'HTML',
          ...statsKeyboard(period),
        });
      } catch (_) {
        await ctx.reply(await statsText(period), {
          parse_mode: 'HTML',
          ...statsKeyboard(period),
        });
      }
    });
  }

  // ── data panel ────────────────────────────────────────────────────────────
  bot.action('admin:data', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageText(await dataText(), {
        parse_mode: 'HTML',
        ...dataKeyboard(),
      });
    } catch (_) {
      await ctx.reply(await dataText(), { parse_mode: 'HTML', ...dataKeyboard() });
    }
  });

  const FIELD_LABELS: Record<string, string> = {
    referralUrl:    'реферальную ссылку',
    channelUrl:     'ссылку на Telegram-канал',
    promoCode:      'промокод',
    botName:        'название бота',
    supportContact: 'контакт поддержки (@username или ссылку)',
  };

  for (const field of Object.keys(FIELD_LABELS)) {
    bot.action(`admin:set:${field}`, async (ctx) => {
      if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
      await ctx.answerCbQuery();
      s(ctx).awaitingField = field;
      await ctx.reply(`${E.pen} Введи ${FIELD_LABELS[field]}:`, { parse_mode: 'HTML' });
    });
  }

  // ── broadcast: open panel ─────────────────────────────────────────────────
  bot.action('admin:broadcast', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    s(ctx).broadcastSetup = {};
    const bc = bcSetup(ctx);
    bc.setupMsgId = (ctx.callbackQuery?.message as any)?.message_id;
    bc.chatId = ctx.chat?.id;
    try {
      await ctx.editMessageText(broadcastText(bc), {
        parse_mode: 'HTML',
        ...broadcastKeyboard(bc),
      });
    } catch (_) {
      const msg = await ctx.reply(broadcastText(bc), {
        parse_mode: 'HTML',
        ...broadcastKeyboard(bc),
      });
      bc.setupMsgId = msg.message_id;
    }
  });

  // ── broadcast: category selection ─────────────────────────────────────────
  bot.action('admin:bc:category', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageText(
        `📣 <b>РАССЫЛКА</b>  ·  Выбери аудиторию\n\nКому отправить сообщение?`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('👋 Новые пользователи', 'admin:bc:cat:new')],
            [Markup.button.callback('✅ Зарегистрировались (без депозита)', 'admin:bc:cat:registered')],
            [Markup.button.callback('💰 Сделали депозит', 'admin:bc:cat:deposited')],
            [Markup.button.callback('◀️ Отмена', 'admin:bc:back')],
          ]),
        }
      );
    } catch (_) {}
  });

  for (const cat of ['new', 'registered', 'deposited'] as BroadcastCategory[]) {
    bot.action(`admin:bc:cat:${cat}`, async (ctx) => {
      if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
      await ctx.answerCbQuery(`✅ Выбрано: ${categoryLabel(cat)}`);
      bcSetup(ctx).category = cat;
      const bc = bcSetup(ctx);
      try {
        await ctx.editMessageText(broadcastText(bc), {
          parse_mode: 'HTML',
          ...broadcastKeyboard(bc),
        });
      } catch (_) {}
    });
  }

  // ── broadcast: message ────────────────────────────────────────────────────
  bot.action('admin:bc:message', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    bcSetup(ctx).step = 'awaiting_message';
    await ctx.reply(
      `✏️ Отправь текст сообщения для рассылки.\n` +
      `К нему можно прикрепить фото — отправь фото с подписью.\n\n` +
      `<i>Поддерживается HTML-форматирование: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // ── broadcast: schedule ───────────────────────────────────────────────────
  bot.action('admin:bc:schedule', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageText(
        `📣 <b>РАССЫЛКА</b>  ·  Время отправки\n\nВыбери, когда отправить рассылку:`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⚡ Отправить сейчас', 'admin:bc:sched:now')],
            [
              Markup.button.callback('⏰ Через 1 час', 'admin:bc:sched:1h'),
              Markup.button.callback('⏰ Через 6 часов', 'admin:bc:sched:6h'),
            ],
            [Markup.button.callback('📅 Завтра (то же время)', 'admin:bc:sched:tomorrow')],
            [Markup.button.callback('✏️ Указать вручную', 'admin:bc:sched:custom')],
            [Markup.button.callback('◀️ Отмена', 'admin:bc:back')],
          ]),
        }
      );
    } catch (_) {}
  });

  const scheduleOptions: Record<string, () => Date | null> = {
    now:      () => null as any,
    '1h':     () => new Date(Date.now() + 3600000),
    '6h':     () => new Date(Date.now() + 21600000),
    tomorrow: () => new Date(Date.now() + 86400000),
  };

  for (const [key, getter] of Object.entries(scheduleOptions)) {
    bot.action(`admin:bc:sched:${key}`, async (ctx) => {
      if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
      await ctx.answerCbQuery(key === 'now' ? '⚡ Отправить сейчас' : '⏰ Время установлено');
      const bc = bcSetup(ctx);
      bc.scheduledAt = getter() as any;
      try {
        await ctx.editMessageText(broadcastText(bc), {
          parse_mode: 'HTML',
          ...broadcastKeyboard(bc),
        });
      } catch (_) {}
    });
  }

  bot.action('admin:bc:sched:custom', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    bcSetup(ctx).step = 'awaiting_schedule_text';
    await ctx.reply(
      `📅 Введи дату и время в формате:\n<code>ДД.ММ.ГГГГ ЧЧ:ММ</code>\n\n<i>Пример: 25.12.2025 15:30</i>`,
      { parse_mode: 'HTML' }
    );
  });

  // ── broadcast: back to setup ──────────────────────────────────────────────
  bot.action('admin:bc:back', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery();
    bcSetup(ctx).step = undefined;
    const bc = bcSetup(ctx);
    try {
      await ctx.editMessageText(broadcastText(bc), {
        parse_mode: 'HTML',
        ...broadcastKeyboard(bc),
      });
    } catch (_) {}
  });

  // ── broadcast: send ───────────────────────────────────────────────────────
  bot.action('admin:bc:send', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    const bc = bcSetup(ctx);
    if (!bc.category || !msgDone(bc) || bc.scheduledAt === undefined) {
      return ctx.answerCbQuery('⚠️ Настрой все параметры перед запуском', { show_alert: true });
    }
    await ctx.answerCbQuery();

    // Scheduled for future
    if (bc.scheduledAt !== null) {
      await scheduleBroadcast({
        category: bc.category,
        message: bc.message ?? '',
        photoFileId: bc.photoFileId,
        scheduledAt: bc.scheduledAt,
        adminId: BigInt(ctx.from!.id),
      });
      s(ctx).broadcastSetup = null;
      const timeStr = bc.scheduledAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
      try {
        await ctx.editMessageText(
          `✅ <b>Рассылка запланирована!</b>\n\n` +
          `🎯 Аудитория: <b>${categoryLabel(bc.category)}</b>\n` +
          `⏰ Запуск: <b>${timeStr}</b>`,
          { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback('◀️ Меню', 'admin:back')]]) }
        );
      } catch (_) {}
      return;
    }

    // Send now
    const category = bc.category;
    const message = bc.message ?? '';
    const photoFileId = bc.photoFileId;
    s(ctx).broadcastSetup = null;

    const chatId = ctx.chat!.id;
    const msgId = (ctx.callbackQuery?.message as any)?.message_id;
    const startTime = Date.now();

    try {
      await ctx.telegram.editMessageText(
        chatId, msgId, undefined,
        `📣 <b>Рассылка запущена...</b>\n\nАудитория: <b>${categoryLabel(category)}</b>\n\n⏳ Подготовка...`,
        { parse_mode: 'HTML' }
      );
    } catch (_) {}

    const { sentCount, failCount, totalCount } = await runBroadcast(
      ctx.telegram,
      category,
      message,
      photoFileId,
      async (done, total) => {
        const bar = progressBar(done, total);
        const pct = total > 0 ? Math.floor((done / total) * 100) : 0;
        try {
          await ctx.telegram.editMessageText(
            chatId, msgId, undefined,
            `📣 <b>Рассылка запущена...</b>\n\n` +
            `Аудитория: <b>${categoryLabel(category)}</b>\n\n` +
            `Прогресс: <code>[${bar}]</code> ${pct}%\n` +
            `Отправлено: <b>${done}</b> / ${total}\n\n` +
            `⏳ Подождите...`,
            { parse_mode: 'HTML' }
          );
        } catch (_) {}
      }
    );

    const elapsed = formatDuration(Date.now() - startTime);

    try {
      await ctx.telegram.editMessageText(
        chatId, msgId, undefined,
        `✅ <b>Рассылка завершена!</b>\n\n` +
        `${E.chart} <b>Итоги</b>\n` +
        `🎯 Аудитория: <b>${categoryLabel(category)}</b>\n` +
        `✅ Доставлено: <b>${sentCount}</b> сообщений\n` +
        `❌ Не доставлено: <b>${failCount}</b> сообщений\n` +
        `   └ Заблокировали бота: ${failCount}\n\n` +
        `${E.stopwatch} Время выполнения: <b>${elapsed}</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📁 База пользователей', 'admin:export')],
            [Markup.button.callback('◀️ Меню', 'admin:back')],
          ]),
        }
      );
    } catch (_) {}
  });

  // ── export users ──────────────────────────────────────────────────────────
  bot.action('admin:export', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Нет доступа');
    await ctx.answerCbQuery('⏳ Формирую файл...');

    const users = await getAllUsersForExport();
    const header = 'ID,Telegram ID,1win ID,Статус,Депозит,Сумма депозитов,Кол-во депозитов,Сигналов,Заблокирован,Дата регистрации\n';
    const rows = users.map((u) =>
      [
        u.id,
        u.telegramId.toString(),
        u.onewinId ?? '',
        u.status,
        u.hasDeposit ? 'Да' : 'Нет',
        u.totalDeposit.toString(),
        u.depositCount,
        u.signalsUsed,
        u.blockedAt ? 'Да' : 'Нет',
        u.createdAt.toISOString(),
      ].join(',')
    ).join('\n');

    const csv = Buffer.from('﻿' + header + rows, 'utf-8');
    const date = new Date().toISOString().split('T')[0];

    await ctx.replyWithDocument(
      { source: csv, filename: `users_${date}.csv` },
      { caption: `📁 База пользователей · ${users.length} чел. · ${date}` }
    );
  });

  // ─── text/photo input handler ─────────────────────────────────────────────

  async function handleBroadcastMessage(
    ctx: Context,
    text: string,
    photoFileId?: string
  ) {
    const bc = bcSetup(ctx);
    bc.message = text;
    bc.photoFileId = photoFileId;
    bc.step = undefined;

    const sent = await (ctx as any).reply(
      broadcastText(bc),
      { parse_mode: 'HTML', ...broadcastKeyboard(bc) }
    );
    bc.setupMsgId = sent.message_id;
    bc.chatId = (ctx as any).chat?.id;
  }

  bot.on('text', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();

    const sess = s(ctx);
    const text = (ctx.message as any).text as string;

    // broadcast message text
    if (sess.broadcastSetup?.step === 'awaiting_message') {
      await handleBroadcastMessage(ctx, text);
      return;
    }

    // broadcast custom schedule
    if (sess.broadcastSetup?.step === 'awaiting_schedule_text') {
      const parts = text.trim().split(/[\s./:]+/);
      if (parts.length >= 5) {
        const [d, m, y, h, min] = parts.map(Number);
        const date = new Date(y, m - 1, d, h, min);
        if (!isNaN(date.getTime()) && date > new Date()) {
          bcSetup(ctx).scheduledAt = date;
          bcSetup(ctx).step = undefined;
          const bc = bcSetup(ctx);
          const sent = await (ctx as any).reply(
            broadcastText(bc),
            { parse_mode: 'HTML', ...broadcastKeyboard(bc) }
          );
          bc.setupMsgId = sent.message_id;
          return;
        }
      }
      await ctx.reply('❌ Неверный формат. Используй: <code>ДД.ММ.ГГГГ ЧЧ:ММ</code>', {
        parse_mode: 'HTML',
      });
      return;
    }

    // settings field update
    const field = sess.awaitingField as string | null;
    if (!field) return next();

    sess.awaitingField = null;
    const FIELD_LABELS: Record<string, string> = {
      referralUrl: 'Реферальная ссылка',
      channelUrl: 'Ссылка на канал',
      promoCode: 'Промокод',
      botName: 'Название бота',
      supportContact: 'Контакт поддержки',
    };
    await updateSettings({ [field]: text });
    await ctx.reply(
      `✅ <b>${FIELD_LABELS[field] ?? field}</b> обновлено:\n<code>${text}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  bot.on('photo', async (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    const sess = s(ctx);
    if (sess.broadcastSetup?.step !== 'awaiting_message') return next();

    const photos = (ctx.message as any).photo as Array<{ file_id: string }>;
    const fileId = photos[photos.length - 1].file_id;
    const caption = (ctx.message as any).caption ?? '';
    await handleBroadcastMessage(ctx, caption, fileId);
  });
}

// ─── admin notification ────────────────────────────────────────────────────────

export async function sendAdminNotification(bot: Telegraf, message: string) {
  for (const adminId of cfg.adminIds) {
    try {
      await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
    } catch (_) {}
  }
}
