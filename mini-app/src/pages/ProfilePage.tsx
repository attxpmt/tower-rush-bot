import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { verifyOnewinId } from '../api';
import StatusBadge from '../components/StatusBadge';
import GlowButton from '../components/GlowButton';

interface Props {
  user: User;
  telegramId: number;
  onUserUpdate: (user: User) => void;
}

export default function ProfilePage({ user, telegramId, onUserUpdate }: Props) {
  const [onewinInput, setOnewinInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleVerify() {
    if (!onewinInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updated = await verifyOnewinId(telegramId, onewinInput.trim());
      onUserUpdate(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Ошибка привязки');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
          <StatusBadge status={user.status} />
        </div>

        <Row label="Telegram ID" value={user.telegramId} />
        <Row label="1win ID" value={user.onewinId ?? '—'} />
        <Row label="Депозитов" value={String(user.depositCount)} />
        <Row label="Сумма депозитов" value={`$${parseFloat(user.totalDeposit).toFixed(2)}`} />
        <Row label="Сигналов получено" value={String(user.signalsUsed)} />

        {!user.onewinId && (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>
              Введи свой ID с 1win для подтверждения:
            </p>
            <input
              value={onewinInput}
              onChange={(e) => setOnewinInput(e.target.value)}
              placeholder="Твой 1win ID"
              style={inputStyle}
            />
            {error && <p style={{ color: '#ff4444', fontSize: 13, marginTop: 6 }}>{error}</p>}
            {success && <p style={{ color: '#00ff88', fontSize: 13, marginTop: 6 }}>✅ ID подтверждён!</p>}
            <div style={{ marginTop: 12 }}>
              <GlowButton onClick={handleVerify} disabled={loading} fullWidth>
                {loading ? 'Проверяем...' : 'Подтвердить ID'}
              </GlowButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#888', fontSize: 14 }}>{label}</span>
      <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const pageStyle: React.CSSProperties = { padding: '16px 16px 100px' };

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f0f2a, #1a1a3a)',
  border: '1px solid rgba(0,255,136,0.15)',
  borderRadius: 20,
  padding: 24,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(0,255,136,0.3)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 16,
  fontFamily: "'Exo 2', sans-serif",
  outline: 'none',
};
