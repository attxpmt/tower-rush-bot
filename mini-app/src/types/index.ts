export type UserStatus = 'NEW' | 'REGISTERED' | 'DEPOSITED' | 'VIP';
export type Strategy = 'stable' | 'moderate' | 'aggressive';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  telegramId: string;
  onewinId: string | null;
  status: UserStatus;
  hasDeposit: boolean;
  totalDeposit: string;
  depositCount: number;
  signalsUsed: number;
  createdAt: string;
}

export interface Signal {
  id: number;
  userId: number;
  strategy: Strategy;
  dominoes: number;
  coefficient: string;
  riskLevel: RiskLevel;
  betAmount: string;
  result: string | null;
  createdAt: string;
}

export interface SignalStats {
  signals: Signal[];
  total: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface AdminStats {
  totalUsers: number;
  registered: number;
  deposited: number;
  signalsCount: number;
  activeToday: number;
  conversionRate: string;
}
