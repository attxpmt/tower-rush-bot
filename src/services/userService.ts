import { Status } from '@prisma/client';
import prisma from '../prisma';

export async function getOrCreateUser(telegramId: number) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: {},
    create: { telegramId: BigInt(telegramId) },
  });
}

export async function getUserByTelegramId(telegramId: number) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
}

export async function getUserByOnewinId(onewinId: string) {
  return prisma.user.findUnique({ where: { onewinId } });
}

export async function linkOnewinId(telegramId: number, onewinId: string) {
  const existing = await prisma.user.findUnique({ where: { onewinId } });
  if (existing && existing.telegramId !== BigInt(telegramId)) {
    throw new Error('Этот 1win ID уже привязан к другому аккаунту');
  }

  const hasPostback = await prisma.postback.findFirst({ where: { onewinId } });

  let status: Status = 'NEW';
  if (hasPostback) {
    const hasDeposit = await prisma.postback.findFirst({
      where: { onewinId, eventType: 'deposit' },
    });
    status = hasDeposit ? 'DEPOSITED' : 'REGISTERED';
  }

  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { onewinId, status },
  });
}

export async function updateUserFromPostback(
  onewinId: string,
  eventType: 'registration' | 'deposit',
  amount?: number
) {
  const user = await prisma.user.findUnique({ where: { onewinId } });
  if (!user) return null;

  if (eventType === 'registration') {
    return prisma.user.update({
      where: { onewinId },
      data: { status: user.status === 'NEW' ? 'REGISTERED' : user.status },
    });
  }

  if (eventType === 'deposit') {
    return prisma.user.update({
      where: { onewinId },
      data: {
        hasDeposit: true,
        status: user.status !== 'VIP' ? 'DEPOSITED' : 'VIP',
        depositCount: { increment: 1 },
        totalDeposit: { increment: amount ?? 0 },
      },
    });
  }

  return null;
}

export async function getAdminStats() {
  const [totalUsers, registered, deposited, signalsCount, activeToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: { in: ['REGISTERED', 'DEPOSITED', 'VIP'] } } }),
    prisma.user.count({ where: { hasDeposit: true } }),
    prisma.signal.count(),
    prisma.user.count({
      where: {
        signals: {
          some: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
      },
    }),
  ]);

  const conversionRate = totalUsers > 0 ? ((registered / totalUsers) * 100).toFixed(1) : '0';

  return { totalUsers, registered, deposited, signalsCount, activeToday, conversionRate };
}
