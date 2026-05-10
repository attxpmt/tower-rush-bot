import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SignalStats } from '../types';
import { fetchSignalStats } from '../api';

interface Props {
  telegramId: number;
}

export default function StatsPage({ telegramId }: Props) {
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignalStats(telegramId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [telegramId]);

  if (loading) return <Center><Spinner /></Center>;
  if (!stats) return <Center><p style={{ color: '#888' }}>Нет данных</p></Center>;

  return (
    <div style={pageStyle}>
      <h2 style={titleStyle}>Статистика</h2>

      <div style={gridStyle}>
        <StatCard value={stats.total} label="Всего раундов" color="#4fc3f7" />
        <StatCard value={stats.wins} label="Побед" color="#00ff88" />
        <StatCard value={stats.losses} label="Проигрышей" color="#ff4444" />
        <StatCard value={`${stats.winrate}%`} label="Winrate" color="#ff6600" />
      </div>

      {stats.signals.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>Последние раунды</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.signals.slice(0, 20).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={signalRowStyle}
              >
                <span style={{ color: '#888', fontSize: 12 }}>
                  {new Date(s.createdAt).toLocaleDateString('ru')}
                </span>
                <span style={{ color: '#aaa', fontSize: 13 }}>
                  {s.dominoes} 🎲 ×{s.coefficient}
                </span>
                <span style={{ color: strategyColor(s.strategy), fontSize: 12 }}>
                  {s.strategy}
                </span>
                <span style={{ fontSize: 14 }}>
                  {s.result === 'win' ? '✅' : s.result === 'lose' ? '❌' : '—'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f2a, #1a1a3a)',
      border: `1px solid ${color}33`,
      borderRadius: 14,
      padding: '16px 12px',
      textAlign: 'center',
      boxShadow: `0 0 12px ${color}20`,
    }}>
      <div style={{ color, fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>{children}</div>;
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#00ff88', borderRadius: '50%' }}
    />
  );
}

function strategyColor(s: string) {
  if (s === 'stable') return '#4fc3f7';
  if (s === 'moderate') return '#00ff88';
  return '#ff6600';
}

const pageStyle: React.CSSProperties = { padding: '16px 16px 100px' };
const titleStyle: React.CSSProperties = { color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 20 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const signalRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px',
};
