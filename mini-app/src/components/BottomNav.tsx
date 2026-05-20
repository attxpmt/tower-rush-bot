import React from 'react';
import { Home, BookOpen, Zap, User, Settings } from 'lucide-react';
import { Tab, UserStatus } from '../types';

interface Props {
  active: Tab;
  onTabChange: (tab: Tab) => void;
  status: UserStatus;
}

const LEFT_TABS: { id: Tab; label: string; Icon: React.FC<any> }[] = [
  { id: 'dashboard', label: 'Главная', Icon: Home },
  { id: 'training', label: 'Обучение', Icon: BookOpen },
];

const RIGHT_TABS: { id: Tab; label: string; Icon: React.FC<any> }[] = [
  { id: 'profile', label: 'Профиль', Icon: User },
  { id: 'settings', label: 'Настройки', Icon: Settings },
];

export default function BottomNav({ active, onTabChange, status }: Props) {
  const isUnlocked = status === 'DEPOSITED' || status === 'VIP';
  const signalsLocked = !isUnlocked;

  return (
    <nav style={navStyle}>
      {LEFT_TABS.map(({ id, label, Icon }) => (
        <button key={id} style={btnStyle(active === id)} onClick={() => onTabChange(id)}>
          <Icon size={20} strokeWidth={active === id ? 2.5 : 1.8} />
          <span style={{ fontSize: 10, marginTop: 3 }}>{label}</span>
        </button>
      ))}

      {/* Signals — центральная увеличенная кнопка */}
      <button
        style={signalsBtnStyle(active === 'signals', signalsLocked)}
        onClick={() => onTabChange('signals')}
      >
        {signalsLocked
          ? <Settings size={22} strokeWidth={1.8} />
          : <Zap size={26} strokeWidth={2.5} fill={active === 'signals' ? '#050b18' : 'none'} />
        }
        <span style={{ fontSize: 10, marginTop: 3, fontWeight: 700 }}>
          {signalsLocked ? 'Заблок.' : 'Сигналы'}
        </span>
      </button>

      {RIGHT_TABS.map(({ id, label, Icon }) => (
        <button key={id} style={btnStyle(active === id)} onClick={() => onTabChange(id)}>
          <Icon size={20} strokeWidth={active === id ? 2.5 : 1.8} />
          <span style={{ fontSize: 10, marginTop: 3 }}>{label}</span>
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

function btnStyle(isActive: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 0',
    background: 'transparent',
    border: 'none',
    borderTop: isActive ? '2px solid #f5a623' : '2px solid transparent',
    color: isActive ? '#f5a623' : '#6b7fa3',
    cursor: 'pointer',
    transition: 'color 0.2s',
    boxSizing: 'border-box',
    filter: isActive ? 'drop-shadow(0 0 6px rgba(245,166,35,0.5))' : 'none',
  };
}

function signalsBtnStyle(isActive: boolean, locked: boolean): React.CSSProperties {
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
    background: isActive
      ? 'linear-gradient(135deg, #f5a623, #ffc84a)'
      : locked
        ? '#0d1b3e'
        : 'linear-gradient(135deg, #1a2d5a, #0f1e3a)',
    border: isActive
      ? '2px solid #ffc84a'
      : locked
        ? '2px solid #2a3d6a'
        : '2px solid #f5a623',
    boxShadow: isActive
      ? '0 0 28px rgba(245,166,35,0.8)'
      : locked
        ? 'none'
        : '0 0 16px rgba(245,166,35,0.35)',
    color: isActive ? '#050b18' : locked ? '#3a5080' : '#f5a623',
    cursor: 'pointer',
    transition: 'all 0.2s',
    filter: !isActive && !locked ? 'drop-shadow(0 0 8px rgba(245,166,35,0.3))' : 'none',
  };
}
