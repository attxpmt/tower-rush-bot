import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Signal, Strategy } from '../types';
import { generateSignal } from '../api';
import GlowButton from '../components/GlowButton';
import Popup from '../components/Popup';

interface Props {
  user: User;
  telegramId: number;
}

const STRATEGIES: { id: Strategy; label: string; desc: string; color: string }[] = [
  { id: 'stable',     label: 'Стабильная',  desc: '×1.2–2.0 | Низкий риск',    color: '#4fc3f7' },
  { id: 'moderate',   label: 'Умеренная',   desc: '×1.5–4.0 | Средний риск',   color: '#00ff88' },
  { id: 'aggressive', label: 'Агрессивная', desc: '×2.0–9.0 | Высокий риск',   color: '#ff6600' },
];

type AnimState = 'idle' | 'analyzing' | 'loading' | 'falling' | 'result';

export default function SignalsPage({ user, telegramId }: Props) {
  const [strategy, setStrategy] = useState<Strategy>('moderate');
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [signal, setSignal] = useState<Signal | null>(null);
  const [showDepositPopup, setShowDepositPopup] = useState(false);

  const canUseSignals = user.hasDeposit;

  async function handleGetSignal() {
    if (!canUseSignals) {
      setShowDepositPopup(true);
      return;
    }

    setAnimState('analyzing');
    await delay(1200);
    setAnimState('loading');
    await delay(1000);
    setAnimState('falling');

    const result = await generateSignal(telegramId, strategy);
    await delay(1500);
    setSignal(result);
    setAnimState('result');
  }

  function reset() {
    setAnimState('idle');
    setSignal(null);
  }

  return (
    <div style={pageStyle}>
      <Popup
        visible={showDepositPopup}
        title="Нет доступа"
        message="Сигналы доступны только после пополнения баланса на 1win."
        buttonText="Пополнить баланс"
        onButton={() => { setShowDepositPopup(false); }}
        onClose={() => setShowDepositPopup(false)}
      />

      <h2 style={titleStyle}>Сигналы Tower Rush</h2>

      {/* Strategy selector */}
      {animState === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Выбери стратегию:</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStrategy(s.id)}
                style={stratCardStyle(strategy === s.id, s.color)}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                <span style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{s.desc}</span>
              </button>
            ))}
          </div>

          <GlowButton onClick={handleGetSignal} fullWidth>
            🎯 Получить сигнал
          </GlowButton>
        </motion.div>
      )}

      {/* Animations */}
      <AnimatePresence mode="wait">
        {animState === 'analyzing' && (
          <AnimCard key="analyzing">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: '#00ff88', fontSize: 18, fontWeight: 700 }}>Анализ игры...</p>
            <LoadingDots />
          </AnimCard>
        )}

        {animState === 'loading' && (
          <AnimCard key="loading">
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <p style={{ color: '#ff6600', fontSize: 18, fontWeight: 700 }}>Вычисляем параметры...</p>
            <LoadingBar />
          </AnimCard>
        )}

        {animState === 'falling' && (
          <AnimCard key="falling">
            <DominoFall />
            <p style={{ color: '#4fc3f7', fontSize: 16, fontWeight: 600, marginTop: 16 }}>
              Генерируем сигнал...
            </p>
          </AnimCard>
        )}

        {animState === 'result' && signal && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={resultCardStyle}
          >
            <p style={{ color: '#00ff88', fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
              🎯 Сигнал готов!
            </p>
            <SignalRow icon="🎲" label="Домино" value={`${signal.dominoes} шт`} />
            <SignalRow icon="✖️" label="Коэффициент" value={`×${signal.coefficient}`} highlight />
            <SignalRow icon="⚠️" label="Риск" value={riskLabel(signal.riskLevel)} />
            <SignalRow icon="💵" label="Рек. ставка" value={`$${parseFloat(signal.betAmount).toFixed(2)}`} />
            <div style={{ marginTop: 20 }}>
              <GlowButton onClick={reset} fullWidth variant="secondary">
                Получить новый сигнал
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimCard({ children, key: _ }: { children: React.ReactNode; key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ textAlign: 'center', padding: '40px 0' }}
    >
      {children}
    </motion.div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: 4, background: '#00ff88' }}
        />
      ))}
    </div>
  );
}

function LoadingBar() {
  return (
    <div style={{ width: '100%', height: 4, background: '#222', borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, ease: 'linear' }}
        style={{ height: '100%', background: 'linear-gradient(90deg, #ff6600, #ffaa00)', borderRadius: 2 }}
      />
    </div>
  );
}

function DominoFall() {
  const dominos = [0, 1, 2, 3, 4];
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', height: 60, alignItems: 'flex-end' }}>
      {dominos.map((i) => (
        <motion.div
          key={i}
          initial={{ rotate: 0, y: 0 }}
          animate={{ rotate: -80, y: 20 }}
          transition={{ delay: i * 0.15, duration: 0.3, ease: 'easeIn' }}
          style={{
            width: 14, height: 40,
            background: `linear-gradient(135deg, #1a1a3a, #2a2a5a)`,
            border: '1px solid rgba(0,255,136,0.4)',
            borderRadius: 3,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 8px rgba(0,255,136,0.3)',
          }}
        />
      ))}
    </div>
  );
}

function SignalRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#888', fontSize: 14 }}>{icon} {label}</span>
      <span style={{ color: highlight ? '#00ff88' : '#fff', fontSize: 14, fontWeight: highlight ? 800 : 600 }}>{value}</span>
    </div>
  );
}

function riskLabel(risk: string) {
  if (risk === 'low') return '🟢 Низкий';
  if (risk === 'medium') return '🟡 Средний';
  return '🔴 Высокий';
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const pageStyle: React.CSSProperties = { padding: '16px 16px 100px' };
const titleStyle: React.CSSProperties = { color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 20 };

function stratCardStyle(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 8px',
    background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12,
    color: active ? color : '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: active ? `0 0 12px ${color}40` : 'none',
    fontFamily: "'Exo 2', sans-serif",
  };
}

const resultCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f0f2a, #1a1a3a)',
  border: '1px solid rgba(0,255,136,0.3)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 0 40px rgba(0,255,136,0.15)',
};
