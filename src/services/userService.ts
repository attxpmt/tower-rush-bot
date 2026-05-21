import { Status } from '@prisma/client';
import prisma from '../prisma';

export type StatsPeriod = 'all' | 'day' | 'week' | 'month';
export type BroadcastCategory = 'new' | 'registered' | 'deposited';

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

  const [depositAgg, hasRegistration] = await Promise.all([
    prisma.postback.aggregate({
      where: { onewinId, eventType: 'deposit' },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.postback.findFirst({ where: { onewinId } }),
  ]);

  const depositCount = depositAgg._count;
  const totalDeposit = depositAgg._sum.amount ?? 0;
  const hasDeposit = depositCount > 0;

  let status: Status = 'NEW';
  if (hasDeposit) status = 'DEPOSITED';
  else if (hasRegistration) status = 'REGISTERED';

  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { onewinId, status, hasDeposit, depositCount, totalDeposit },
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
      data: {
        status: user.status === 'NEW' ? 'REGISTERED' : user.status,
        onewinRegisteredAt: user.onewinRegisteredAt ?? new Date(),
      },
    });
  }

  if (eventType === 'deposit') {
    const newDepositCount = user.depositCount + 1;
    const newStatus = newDepositCount >= 10 ? 'VIP' : (user.status === 'VIP' ? 'VIP' : 'DEPOSITED');
    return prisma.user.update({
      where: { onewinId },
      data: {
        hasDeposit: true,
        status: newStatus,
        depositCount: { increment: 1 },
        totalDeposit: { increment: amount ?? 0 },
      },
    });
  }

  return null;
}

const MS_DAY = 86_400_000;
const MS_WEEK = 7 * MS_DAY;
const MS_MONTH = 30 * MS_DAY;

function periodSince(period: StatsPeriod): Date | undefined {
  if (period === 'all') return undefined;
  const ms = { day: MS_DAY, week: MS_WEEK, month: MS_MONTH }[period];
  return new Date(Date.now() - ms);
}

export async function getAdminStats() {
  return getAdminStatsWithPeriod('all');
}

export async function getAdminStatsWithPeriod(period: StatsPeriod) {
  const since = periodSince(period);
  const createdFilter = since ? { createdAt: { gte: since } } : {};

  const [
    totalUsers,
    periodUsers,
    registeredTotal,
    depositedTotal,
    vipTotal,
    blockedTotal,
    periodRegistrations,
    periodDeposits,
    depositAgg,
    signalsCount,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    since ? prisma.user.count({ where: { createdAt: { gte: since } } }) : prisma.user.count(),
    prisma.user.count({ where: { status: { in: ['REGISTERED', 'DEPOSITED', 'VIP'] } } }),
    prisma.user.count({ where: { hasDeposit: true } }),
    prisma.user.count({ where: { status: 'VIP' } }),
    prisma.user.count({ where: { blockedAt: { not: null } } }),
    prisma.postback.count({ where: { eventType: 'registration', ...createdFilter } }),
    prisma.postback.count({ where: { eventType: 'deposit', ...createdFilter } }),
    prisma.postback.aggregate({
      where: { eventType: 'deposit', ...createdFilter },
      _sum: { amount: true },
    }),
    prisma.signal.count({ where: createdFilter }),
    prisma.user.count({
      where: {
        signals: {
          some: {
            createdAt: { gte: new Date(Date.now() - MS_DAY) },
          },
        },
      },
    }),
  ]);

  const base = period === 'all' ? totalUsers : periodUsers;
  const registrations = period === 'all' ? registeredTotal : periodRegistrations;
  const deposits = period === 'all' ? depositedTotal : periodDeposits;

  const visit2reg = base > 0 ? ((registrations / base) * 100).toFixed(1) : '0';
  const reg2dep = registrations > 0 ? ((deposits / registrations) * 100).toFixed(1) : '0';
  const totalDepositAmount = depositAgg._sum.amount
    ? Number(depositAgg._sum.amount).toFixed(2)
    : '0.00';

  return {
    period,
    totalUsers,
    periodUsers,
    registeredTotal,
    depositedTotal,
    vipTotal,
    blockedTotal,
    registrations,
    deposits,
    totalDepositAmount,
    signalsCount,
    activeUsers,
    visit2reg,
    reg2dep,
  };
}

export async function markUserBlocked(telegramId: bigint) {
  try {
    await prisma.user.update({
      where: { telegramId },
      data: { blockedAt: new Date() },
    });
  } catch (_) {}
}

export async function getUsersByCategory(category: BroadcastCategory) {
  if (category === 'new') {
    return prisma.user.findMany({
      where: { status: 'NEW', blockedAt: null },
      select: { telegramId: true },
    });
  }
  if (category === 'registered') {
    return prisma.user.findMany({
      where: { status: 'REGISTERED', blockedAt: null },
      select: { telegramId: true },
    });
  }
  return prisma.user.findMany({
    where: { hasDeposit: true, blockedAt: null },
    select: { telegramId: true },
  });
}

export async function getAllUsersForExport() {
  return prisma.user.findMany({
    select: {
      id: true,
      telegramId: true,
      onewinId: true,
      status: true,
      hasDeposit: true,
      totalDeposit: true,
      depositCount: true,
      signalsUsed: true,
      blockedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
