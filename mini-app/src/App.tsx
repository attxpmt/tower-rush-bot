import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkIcon } from 'lucide-react';
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
import { verifyOnewinId } from './api';
import { colors, gradient, radius, glow } from './theme';

export default function App() {
  const { telegramId } = useTelegram();
  const { user, loading, setUser } = useUser(telegramId);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showOnboardPopup, setShowOnboardPopup] = useState(false);

  // 1win ID sheet
  const [showIdSheet, setShowIdSheet] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const sheetShownRef = useRef(false);

  // Показываем sheet один раз если нет onewinId
  useEffect(() => {
    if (!user || sheetShownRef.current) return;
    if (!user.onewinId) {
      sheetShownRef.current = true;
      const timer = setTimeout(() => setShowIdSheet(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  async function handleSheetVerify() {
    if (!sheetInput.trim() || sheetLoading) return;
    setSheetLoading(true);
    setSheetError('');
    try {
      const updated = await verifyOnewinId(sheetInput.trim());
      setUser(updated);
      setShowIdSheet(false);
      setSheetInput('');
    } catch (err: any) {
      setSheetError(err.response?.data?.error ?? 'Ошибка привязки');
    } finally {
      setSheetLoading(false);
    }
  }

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

      {/* ── 1win ID Bottom Sheet ── */}
      <AnimatePresence>
        {showIdSheet && (
          <>
            <motion.div
              key="sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIdSheet(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 150,
                background: 'rgba(0,0,0,0.65)',
              }}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 151,
                background: 'linear-gradient(to top, #050b18 60%, #0a1628 100%)',
                border: '1px solid rgba(245,166,35,0.28)',
                borderRadius: '22px 22px 0 0',
                padding: '16px 20px 44px',
                boxShadow: '0 -16px 60px rgba(0,0,0,0.7)',
              }}
            >
              {/* Handle */}
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
                margin: '0 auto 22px',
              }} />

              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(245,166,35,0.12)',
                border: `1.5px solid rgba(245,166,35,0.35)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                boxShadow: glow.amberSoft,
              }}>
                <LinkIcon size={24} color="#f5a623" strokeWidth={2} />
              </div>

              <div style={{ color: colors.text, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                Привяжи 1win ID
              </div>
              <div style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
                Скопируй свой ID в профиле на 1win. Это нужно чтобы твой депозит попал в систему и открыл сигналы.
              </div>

              {/* Input */}
              <input
                value={sheetInput}
                onChange={(e) => { setSheetInput(e.target.value); setSheetError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSheetVerify()}
                placeholder="Введи 1win ID (только цифры)"
                inputMode="numeric"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${sheetError ? colors.danger : sheetInput ? 'rgba(245,166,35,0.5)' : colors.border}`,
                  borderRadius: radius.md,
                  color: colors.text,
                  fontSize: 16, fontWeight: 700,
                  fontFamily: "'Exo 2', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              {sheetError && (
                <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{sheetError}</div>
              )}

              {/* Confirm button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSheetVerify}
                disabled={sheetLoading || !sheetInput.trim()}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '15px',
                  background: sheetInput.trim() && !sheetLoading ? gradient.amber : 'rgba(255,255,255,0.07)',
                  border: 'none',
                  borderRadius: radius.lg,
                  color: sheetInput.trim() && !sheetLoading ? '#000' : colors.textMuted,
                  fontWeight: 800, fontSize: 16,
                  cursor: sheetInput.trim() && !sheetLoading ? 'pointer' : 'default',
                  fontFamily: "'Exo 2', sans-serif",
                  boxShadow: sheetInput.trim() && !sheetLoading ? glow.amber : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {sheetLoading ? 'Проверяем...' : 'Подтвердить'}
              </motion.button>

              {/* Skip */}
              <button
                onClick={() => setShowIdSheet(false)}
                style={{
                  width: '100%', marginTop: 12,
                  padding: '10px',
                  background: 'none', border: 'none',
                  color: colors.textMuted, fontSize: 13,
                  cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                }}
              >
                Пропустить
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {activeTab === 'dashboard' && (
        <DashboardPage
          user={user}
          telegramId={telegramId}
          onTabChange={handleTabChange}
          onShowOnboard={() => setShowOnboardPopup(true)}
        />
      )}
      {activeTab === 'signals' && <SignalsPage user={user} />}
      {activeTab === 'profile' && (
        <ProfilePage user={user} telegramId={telegramId} onUserUpdate={setUser} />
      )}
      {activeTab === 'training' && <TrainingPage />}
      {activeTab === 'settings' && <SettingsPage />}

      <BottomNav
        active={activeTab}
        onTabChange={handleTabChange}
        status={user.status}
        hasOnewinId={!!user.onewinId}
      />
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
    </div>
  );
}
