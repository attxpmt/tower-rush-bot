import React from 'react';
import { Tab, UserStatus } from '../types';

interface Props {
  active: Tab;
  onTabChange: (tab: Tab) => void;
  status: UserStatus;
}

const LEFT_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Главная', icon: '🏠' },
  { id: 'training', label: 'Обучение', icon: '📚' },
];

const RIGHT_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile', label: 'Профиль', icon: '👤' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

export default function BottomNav({ active, onTabChange, status }: Props) {
  const isUnlocked = status === 'DEPOSITED' || status === 'VIP';
  const signalsLocked = !isUnlocked;

  return (
    <nav style={navStyle}>
      {/* Left tabs */}
      {LEFT_TABS.map((tab) => (
        <button
          key={tab.id}
          style={btnStyle(active === tab.id, false)}
          onClick={() => onTabChange(tab.id)}
        >
          <span style={{ fontSize: 20, display: 'block' }}>{tab.icon}</span>
          <span style={{ fontSize: 10, marginTop: 2 }}>{tab.label}</span>
        </button>
      ))}

      {/* Center — Signals (bigger) */}
      <button
        style={signalsBtnStyle(active === 'signals', signalsLocked)}
        onClick={() => onTabChange('signals')}
      >
        <span style={{ fontSize: 26, display: 'block' }}>
          {signalsLocked ? '🔒' : '⚡'}
        </span>
        <span style={{ fontSize: 10, marginTop: 2, fontWeight: 700 }}>Сигналы</span>
      </button>

      {/* Right tabs */}
      {RIGHT_TABS.map((tab) => (
        <button
          key={tab.id}
          style={btnStyle(active === tab.id, false)}
          onClick={() => onTabChange(tab.id)}
        >
          <span style={{ fontSize: 20, display: 'block' }}>{tab.icon}</span>
          <span style={{ fontSize: 10, marginTop: 2 }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(5,11,24,0.97)',
  borderTop: '1px solid #1a2d5a',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 100,
  paddingBottom: 'env(safe-area-inset-bottom)',
  height: 60,
};

function btnStyle(active: boolean, locked: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 0',
    background: 'transparent',
    border: 'none',
    color: active ? '#f5a623' : locked ? '#444' : '#6b7fa3',
    cursor: 'pointer',
    transition: 'color 0.2s',
    textShadow: active ? '0 0 8px rgba(245,166,35,0.6)' : 'none',
    borderTop: active ? '2px solid #f5a623' : '2px solid transparent',
    boxSizing: 'border-box',
  };
}

function signalsBtnStyle(active: boolean, locked: boolean): React.CSSProperties {
  return {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    flexShrink: 0,
    background: active
      ? 'linear-gradient(135deg, #f5a623, #ffc84a)'
      : locked
        ? 'linear-gradient(135deg, #1a2d5a, #0d1b3e)'
        : 'linear-gradient(135deg, #1a2d5a, #0f1e3a)',
    border: active
      ? '2px solid #ffc84a'
      : locked
        ? '2px solid #2a3d6a'
        : '2px solid #f5a623',
    boxShadow: active
      ? '0 0 24px rgba(245,166,35,0.7)'
      : locked
        ? 'none'
        : '0 0 16px rgba(245,166,35,0.3)',
    color: active ? '#050b18' : locked ? '#444' : '#f5a623',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
}
