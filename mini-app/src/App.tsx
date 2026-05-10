import React, { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useUser } from './hooks/useUser';
import BottomNav from './components/BottomNav';
import Popup from './components/Popup';
import ProfilePage from './pages/ProfilePage';
import SignalsPage from './pages/SignalsPage';
import StatsPage from './pages/StatsPage';
import TrainingPage from './pages/TrainingPage';
import ChannelPage from './pages/ChannelPage';
import RegisterPage from './pages/RegisterPage';

type Tab = 'profile' | 'signals' | 'stats' | 'training' | 'channel' | 'register';

const REFERRAL_URL = (import.meta as any).env?.VITE_REFERRAL_URL ?? '';
const CHANNEL_URL = (import.meta as any).env?.VITE_CHANNEL_URL ?? '';
const PROMO_CODE = (import.meta as any).env?.VITE_PROMO_CODE ?? '';

export default function App() {
  const { telegramId } = useTelegram();
  const { user, loading, setUser } = useUser(telegramId);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showOnboardPopup, setShowOnboardPopup] = useState(false);

  // Show onboarding popup 3s after first open if user is new
  useEffect(() => {
    if (!user) return;
    if (user.status === 'NEW' && !user.onewinId) {
      const timer = setTimeout(() => setShowOnboardPopup(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  function handleTabChange(tab: Tab) {
    if (!user) return;
    const isUnlocked = user.status === 'DEPOSITED' || user.status === 'VIP';
    if ((tab === 'signals' || tab === 'stats') && !isUnlocked) {
      setShowOnboardPopup(true);
      return;
    }
    setActiveTab(tab);
  }

  if (loading || !user || !telegramId) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', paddingTop: 0 }}>
      {/* Header */}
      <Header />

      {/* Onboarding popup */}
      <Popup
        visible={showOnboardPopup}
        title="Нужен доступ?"
        message="Чтобы получить доступ к сигналам, зарегистрируйся на 1win и подтверди свой ID. Так бот сможет анализировать твой аккаунт и играть на нём."
        buttonText="Зарегистрироваться"
        onButton={() => { setShowOnboardPopup(false); setActiveTab('register'); }}
        onClose={() => setShowOnboardPopup(false)}
      />

      {/* Pages */}
      {activeTab === 'profile' && (
        <ProfilePage user={user} telegramId={telegramId} onUserUpdate={setUser} />
      )}
      {activeTab === 'signals' && <SignalsPage user={user} telegramId={telegramId} />}
      {activeTab === 'stats' && <StatsPage telegramId={telegramId} />}
      {activeTab === 'training' && <TrainingPage />}
      {activeTab === 'channel' && <ChannelPage channelUrl={CHANNEL_URL} />}
      {activeTab === 'register' && <RegisterPage referralUrl={REFERRAL_URL} promoCode={PROMO_CODE} />}

      <BottomNav active={activeTab} onTabChange={handleTabChange} status={user.status} />
    </div>
  );
}

function Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 20px 12px',
      borderBottom: '1px solid rgba(0,255,136,0.1)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
        boxShadow: '0 0 12px rgba(0,255,136,0.4)',
      }}>
        🏰
      </div>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>
        Tower Rush
      </span>
      <div style={{ marginLeft: 'auto' }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: '#00ff88',
          boxShadow: '0 0 6px #00ff88',
          animation: 'pulse 2s infinite',
        }} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ fontSize: 56 }}>🏰</div>
      <div style={{
        width: 40, height: 40, border: '3px solid #222',
        borderTopColor: '#00ff88', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
