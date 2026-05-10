import { Strategy, RiskLevel } from '@prisma/client';
import prisma from '../prisma';

const STRATEGY_CONFIG: Record<
  Strategy,
  { minCoeff: number; maxCoeff: number; risk: RiskLevel; minDom: number; maxDom: number }
> = {
  stable:     { minCoeff: 1.2, maxCoeff: 2.0, risk: 'low',    minDom: 3, maxDom: 5 },
  moderate:   { minCoeff: 1.5, maxCoeff: 4.0, risk: 'medium', minDom: 4, maxDom: 7 },
  aggressive: { minCoeff: 2.0, maxCoeff: 9.0, risk: 'high',   minDom: 5, maxDom: 9 },
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

export async function generateSignal(telegramId: number, strategy: Strategy) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) throw new Error('Пользователь не найден');
  if (!user.hasDeposit) throw new Error('Для получения сигналов необходим депозит на 1win');

  const cfg = STRATEGY_CONFIG[strategy];
  const dominoes = randInt(cfg.minDom, cfg.maxDom);
  const coefficient = parseFloat(rand(cfg.minCoeff, cfg.maxCoeff).toFixed(2));
  const betAmount = parseFloat(rand(5, 50).toFixed(2));

  const signal = await prisma.signal.create({
    data: {
      userId: user.id,
      strategy,
      dominoes,
      coefficient,
      riskLevel: cfg.risk,
      betAmount,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { signalsUsed: { increment: 1 } },
  });

  return signal;
}

export async function getUserSignalStats(telegramId: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
  if (!user) throw new Error('Пользователь не найден');

  const signals = await prisma.signal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const total = signals.length;
  const wins = signals.filter((s) => s.result === 'win').length;
  const losses = signals.filter((s) => s.result === 'lose').length;
  const winrate = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0;

  return { signals, total, wins, losses, winrate };
}
