import React from 'react';
import { UserStatus } from '../types';

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; glow: string }> = {
  NEW:        { label: 'NEW',        color: '#888',    glow: '#888' },
  REGISTERED: { label: 'REGISTERED', color: '#4fc3f7', glow: '#4fc3f7' },
  DEPOSITED:  { label: 'DEPOSITED',  color: '#00ff88', glow: '#00ff88' },
  VIP:        { label: 'VIP',        color: '#ff6600', glow: '#ff6600' },
};

export default function StatusBadge({ status }: { status: UserStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1,
      color: cfg.color,
      border: `1px solid ${cfg.color}`,
      boxShadow: `0 0 8px ${cfg.glow}40`,
    }}>
      {cfg.label}
    </span>
  );
}
