import React from 'react';
import { UserStatus } from '../types';

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string }> = {
  NEW:        { label: 'Новый',      color: '#6b7fa3', bg: 'rgba(107,127,163,0.1)' },
  REGISTERED: { label: 'Аккаунт',   color: '#00d4ff', bg: 'rgba(0,212,255,0.1)'   },
  DEPOSITED:  { label: 'Активный',  color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
  VIP:        { label: 'VIP',       color: '#ffc84a', bg: 'rgba(255,200,74,0.15)' },
};

export default function StatusBadge({ status }: { status: UserStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
      boxShadow: `0 0 8px ${cfg.color}20`,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.color,
        boxShadow: `0 0 4px ${cfg.color}`,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
