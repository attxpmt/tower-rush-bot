import React from 'react';
import { User, Tab } from '../types';

interface Props {
  user: User;
  telegramId: number;
  onTabChange: (tab: Tab) => void;
  onShowOnboard: () => void;
}

export default function DashboardPage({ user, telegramId, onTabChange, onShowOnboard }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050b18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
    }}>
      <div style={{ fontSize: 48 }}>🏠</div>
      <div style={{ color: '#f5a623', fontSize: 20, fontWeight: 700, marginTop: 12 }}>
        Дашборд
      </div>
      <div style={{ color: '#6b7fa3', fontSize: 14, marginTop: 8 }}>
        Phase 3 — в разработке
      </div>
    </div>
  );
}
