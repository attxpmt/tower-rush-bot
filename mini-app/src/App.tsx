import React, { useEffect, useState } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useUser } from './hooks/useUser';
import { Tab } from './types';
import BottomNav from './components/BottomNav';
import Popup from './components/Popup';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SignalsPage from './pages/SignalsPage';
import TrainingPage from './pages/TrainingPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { telegramId } = useTelegram();
  const { user, loading, setUser } = useUser(telegramId);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showOnboardPopup, setShowOnboardPopup] = useState(false);

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
    if (tab === 'signals' && !isUnlocked) {
      setShowOnboardPopup(true);
      return;
    }
    setActiveTab(tab);
  }

  if (loading || !user || !telegramId) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050b18' }}>
      <Popup
        visible={showOnboardPopup}
        title="Нужен доступ?"
        message="Зарегистрируйся на 1win по нашей ссылке, введи ID в профиле и сделай первый депозит — сигналы разблокируются автоматически."
        buttonText="Зарегистрироваться"
        onButton={() => { setShowOnboardPopup(false); setActiveTab('training'); }}
        onClose={() => setShowOnboardPopup(false)}
      />

      {activeTab === 'dashboard' && (
        <DashboardPage
          user={user}
          telegramId={telegramId}
          onTabChange={handleTabChange}
          onShowOnboard={() => setShowOnboardPopup(true)}
        />
      )}
      {activeTab === 'signals' && <SignalsPage user={user} telegramId={telegramId} />}
      {activeTab === 'profile' && (
        <ProfilePage user={user} telegramId={telegramId} onUserUpdate={setUser} />
      )}
      {activeTab === 'training' && <TrainingPage />}
      {activeTab === 'settings' && <SettingsPage />}

      <BottomNav active={activeTab} onTabChange={handleTabChange} status={user.status} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: '#050b18',
    }}>
      <div style={{ fontSize: 56 }}>⚡</div>
      <div style={{
        width: 40, height: 40, border: '3px solid #1a2d5a',
        borderTopColor: '#f5a623', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
