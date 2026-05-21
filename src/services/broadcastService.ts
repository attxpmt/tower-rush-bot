import { Telegraf } from 'telegraf';
import prisma from '../prisma';
import { getUsersByCategory, markUserBlocked, BroadcastCategory } from './userService';

export type { BroadcastCategory };

export function progressBar(done: number, total: number): string {
  const pct = total > 0 ? Math.min(Math.floor((done / total) * 10), 10) : 0;
  return '█'.repeat(pct) + '░'.repeat(10 - pct);
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function categoryLabel(category: BroadcastCategory): string {
  return { new: 'Новые пользователи', registered: 'Зарегистрировались (без депозита)', deposited: 'Сделали депозит' }[category];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Одна отправка сообщения. При 429 (превышен лимит Telegram) ждёт
// retry_after секунд и повторяет один раз.
async function sendToUser(
  telegram: Telegraf['telegram'],
  chatId: string,
  message: string,
  photoFileId: string | undefined
): Promise<void> {
  const send = () => {
    if (photoFileId) {
      return telegram.sendPhoto(chatId, photoFileId, {
        caption: message || undefined,
        parse_mode: 'HTML',
      });
    }
    return telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
  };

  try {
    await send();
  } catch (err: any) {
    if (err?.response?.error_code === 429) {
      const retryAfter = err.response.parameters?.retry_after ?? 1;
      await sleep((retryAfter + 1) * 1000);
      await send();
    } else {
      throw err;
    }
  }
}

export async function runBroadcast(
  telegram: Telegraf['telegram'],
  category: BroadcastCategory,
  message: string,
  photoFileId: string | undefined,
  onProgress: (done: number, total: number) => Promise<void>
): Promise<{ sentCount: number; failCount: number; totalCount: number }> {
  const users = await getUsersByCategory(category);
  const total = users.length;
  let sentCount = 0;
  let failCount = 0;

  // Нечего отправлять (пустое сообщение без фото) — выходим сразу
  if (!photoFileId && !message.trim()) {
    return { sentCount: total, failCount: 0, totalCount: total };
  }

  for (let i = 0; i < users.length; i++) {
    const telegramId = users[i].telegramId.toString();
    try {
      await sendToUser(telegram, telegramId, message, photoFileId);
      sentCount++;
    } catch (err: any) {
      failCount++;
      if (err?.response?.error_code === 403) {
        await markUserBlocked(users[i].telegramId);
      }
    }

    if ((i + 1) % 10 === 0 || i === users.length - 1) {
      try { await onProgress(i + 1, total); } catch (_) {}
    }

    // Rate limit: pause every 25 messages
    if (i > 0 && (i + 1) % 25 === 0 && i < users.length - 1) {
      await sleep(1000);
    }
  }

  return { sentCount, failCount, totalCount: total };
}

export async function scheduleBroadcast(data: {
  category: BroadcastCategory;
  message: string;
  photoFileId?: string;
  scheduledAt: Date;
  adminId: bigint;
}) {
  return prisma.broadcast.create({
    data: {
      category: data.category,
      message: data.message,
      photoFileId: data.photoFileId ?? null,
      scheduledAt: data.scheduledAt,
      adminId: data.adminId,
    },
  });
}

export function startBroadcastScheduler(bot: Telegraf) {
  // При старте процесса ни одна рассылка не может выполняться (они идут
  // в этом же процессе). Значит processing:true — это «зависшая» рассылка
  // после краша/передеплоя. Сбрасываем, чтобы она запустилась снова.
  prisma.broadcast
    .updateMany({ where: { processing: true, sentAt: null }, data: { processing: false } })
    .catch((err) => console.error('[broadcast] reset stuck failed:', err));

  setInterval(async () => {
    try {
    const pending = await prisma.broadcast.findMany({
      where: {
        scheduledAt: { lte: new Date() },
        sentAt: null,
        processing: false,
      },
    });

    for (const bc of pending) {
      await prisma.broadcast.update({ where: { id: bc.id }, data: { processing: true } });

      try {
        const { sentCount, failCount } = await runBroadcast(
          bot.telegram,
          bc.category as BroadcastCategory,
          bc.message,
          bc.photoFileId ?? undefined,
          async () => {}
        );
        await prisma.broadcast.update({
          where: { id: bc.id },
          data: { sentAt: new Date(), sentCount, failCount, processing: false },
        });
      } catch (err) {
        await prisma.broadcast.update({
          where: { id: bc.id },
          data: { processing: false },
        });
      }
    }
    } catch (err) {
      console.error('[broadcast] scheduler tick failed:', err);
    }
  }, 60000);
}
