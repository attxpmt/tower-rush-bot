import React from 'react';
import { UserStatus } from '../types';

type Tab = 'profile' | 'signals' | 'stats' | 'training' | 'channel' | 'register';

interface Props {
  active: Tab;
  onTabChange: (tab: Tab) => void;
  status: UserStatus;
}

const tabs: { id: Tab; label: string; icon: string; requiresDeposit?: boolean }[] = [
  { id: 'profile', label: 'Профиль', icon: '👤' },
  { id: 'signals', label: 'Сигналы', icon: '🎯', requiresDeposit: true },
  { id: 'stats', label: 'Стата', icon: '📊', requiresDeposit: true },
  { id: 'training', label: 'Обучение', icon: '📚' },
  { id: 'channel', label: 'Канал', icon: '📢' },
  { id: 'register', label: '1win', icon: '🎰' },
];

export default function BottomNav({ active, onTabChange, status }: Props) {
  const isUnlocked = status === 'DEPOSITED' || status === 'VIP';

  return (
    <nav style={navStyle}>
      {tabs.map((tab) => {
        const locked = tab.requiresDeposit && !isUnlocked;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            style={btnStyle(isActive, locked)}
            onClick={() => onTabChange(tab.id)}
          >
            <span style={{ fontSize: 20, display: 'block' }}>
              {locked ? '🔒' : tab.icon}
            </span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  background: 'rgba(10,10,30,0.97)',
  borderTop: '1px solid rgba(0,255,136,0.2)',
  zIndex: 100,
  paddingBottom: 'env(safe-area-inset-bottom)',
};

function btnStyle(active: boolean, locked: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    color: active ? '#00ff88' : locked ? '#444' : '#888',
    cursor: locked ? 'default' : 'pointer',
    transition: 'color 0.2s',
    textShadow: active ? '0 0 8px #00ff88' : 'none',
  };
}
