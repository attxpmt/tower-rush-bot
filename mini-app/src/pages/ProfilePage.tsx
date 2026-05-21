import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Hash, Gamepad2, Wallet, TrendingUp, DollarSign,
  Zap, Shield, Calendar, RefreshCw, User as UserIcon,
  ExternalLink, Edit3,
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { User, Settings } from '../types';
import { verifyOnewinId, refreshUserStats, fetchSettings, getUserAvatar } from '../api';
import { useToast } from '../components/Toast';
import GlowCard from '../components/GlowCard';
import StatusBadge from '../components/StatusBadge';
import { colors, glow, gradient, radius } from '../theme';

interface Props {
  user: User;
  telegramId: number;
  onUserUpdate: (user: User) => void;
}

export default function ProfilePage({ user, telegramId, onUserUpdate }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [onewinInput, setOnewinInput] = useState('');
  const [editingOnewin, setEditingOnewin] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { showToast } = useToast();

  const tgUser = WebApp.initDataUnsafe?.user;
  const displayName = tgUser
    ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
    : `User ${telegramId}`;

  useEffect(() => {
    getUserAvatar().then(setAvatarUrl).catch(() => {});
    fetchSettings().then(setSettings).catch(() => {});
  }, [telegramId]);

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  function getBalanceValue() {
    const bal = parseFloat(user.balance);
    const dep = parseFloat(user.totalDeposit);
    if (bal > 0) return `${bal.toLocaleString('ru-RU')} ₽`;
    if (dep > 0) return `${dep.toLocaleString('ru-RU')} ₽`;
    return '—';
  }

  async function handleRefresh() {
    if (refreshCooldown || refreshing) return;
    setRefreshing(true);
    setRotation((r) => r + 360);
    try {
      const updated = await refreshUserStats();
      onUserUpdate(updated);
      showToast('Данные обновлены', 'success');
    } catch {
      showToast('Ошибка обновления', 'error');
    } finally {
      setRefreshing(false);
      setRefreshCooldown(true);
      setTimeout(() => setRefreshCooldown(false), 30000);
    }
  }

  async function handleVerify() {
    if (!onewinInput.trim()) return;
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const updated = await verifyOnewinId(onewinInput.trim());
      onUserUpdate(updated);
      setEditingOnewin(false);
      setOnewinInput('');
      showToast('1win ID привязан!', 'success');
    } catch (err: any) {
      setVerifyError(err.response?.data?.error ?? 'Ошибка привязки');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function copyReferral() {
    if (!settings?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(settings.referralUrl);
      showToast('Ссылка скопирована!', 'success');
    } catch {
      showToast('Не удалось скопировать', 'error');
    }
  }

  function openReferral() {
    if (settings?.referralUrl) WebApp.openLink(settings.referralUrl);
  }

  const showOnewinForm = editingOnewin || !user.onewinId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', background: colors.bg, paddingBottom: 90, overflowY: 'auto' }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '28px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
      }}>
        {/* Refresh button */}
        <motion.button
          animate={{ rotate: rotation }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={handleRefresh}
          style={{
            position: 'absolute', right: 20, top: 28,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(245,166,35,0.1)',
            border: `1px solid rgba(245,166,35,0.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: refreshCooldown ? 'not-allowed' : 'pointer',
            opacity: refreshCooldown ? 0.35 : 1,
          }}
        >
          <RefreshCw size={16} color={colors.amber} />
        </motion.button>

        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: `2px solid ${colors.amber}`,
          boxShadow: glow.amber,
          overflow: 'hidden',
          background: colors.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <UserIcon size={36} color={colors.textMuted} />
          }
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: 18 }}>{displayName}</div>
          {tgUser?.username && (
            <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>@{tgUser.username}</div>
          )}
        </div>

        <StatusBadge status={user.status} depositCount={user.depositCount} />
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Info Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

          <InfoCard icon={<Hash size={15} color={colors.cyan} />} label="Telegram ID" value={user.telegramId} />

          {/* 1win ID */}
          <div style={{
            background: gradient.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Gamepad2 size={15} color={colors.amber} />
              <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600 }}>1win ID</span>
            </div>
            {user.onewinId ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text, fontSize: 14, fontWeight: 700 }}>{user.onewinId}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingOnewin(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
                >
                  <Edit3 size={13} color={colors.textMuted} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditingOnewin(true)}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(245,166,35,0.12)',
                  border: `1px solid rgba(245,166,35,0.3)`,
                  borderRadius: radius.full,
                  color: colors.amber,
                  fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                }}
              >
                + Привязать
              </motion.button>
            )}
          </div>

          {/* Balance */}
          <div style={{
            background: gradient.cardAmber,
            border: `1px solid rgba(245,166,35,0.25)`,
            borderRadius: radius.lg,
            padding: '12px 14px',
            gridColumn: '1 / -1',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Wallet size={15} color={colors.success} />
              <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600 }}>Баланс / Пополнено</span>
            </div>
            <div style={{
              color: colors.amber, fontSize: 24, fontWeight: 800,
              textShadow: `0 0 12px rgba(245,166,35,0.4)`,
              letterSpacing: -0.5,
            }}>
              {getBalanceValue()}
            </div>
          </div>

          <InfoCard icon={<TrendingUp size={15} color={colors.cyan} />} label="Депозитов" value={String(user.depositCount)} />
          <InfoCard
            icon={<DollarSign size={15} color={colors.amber} />}
            label="Пополнено"
            value={`${parseFloat(user.totalDeposit).toLocaleString('ru-RU')} ₽`}
          />
          <InfoCard icon={<Zap size={15} color={colors.amber} />} label="Сигналов" value={String(user.signalsUsed)} />
          <div style={{
            background: gradient.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Shield size={15} color={colors.cyan} />
              <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600 }}>Статус</span>
            </div>
            <StatusBadge status={user.status} depositCount={user.depositCount} />
          </div>

          <InfoCard
            icon={<Calendar size={15} color={colors.textMuted} />}
            label="В боте с"
            value={formatDate(user.createdAt)}
            small
          />
          <InfoCard
            icon={<Calendar size={15} color={colors.amber} />}
            label="На 1win с"
            value={user.onewinRegisteredAt ? formatDate(user.onewinRegisteredAt) : '—'}
            small
          />
        </div>

        {/* ── 1win ID Form ── */}
        {showOnewinForm && (
          <GlowCard variant="default">
            <div style={{ color: colors.text, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              {user.onewinId ? 'Изменить 1win ID' : 'Привязать 1win ID'}
            </div>
            <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
              Найди ID в личном кабинете 1win → Профиль
            </div>
            <input
              value={onewinInput}
              onChange={(e) => setOnewinInput(e.target.value)}
              placeholder="Введи 1win ID"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${verifyError ? colors.danger : colors.border}`,
                borderRadius: radius.md,
                color: colors.text,
                fontSize: 16,
                fontFamily: "'Exo 2', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {verifyError && (
              <div style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{verifyError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVerify}
                disabled={verifyLoading}
                style={{
                  flex: 1, padding: '12px',
                  background: verifyLoading ? colors.border : gradient.amber,
                  border: 'none', borderRadius: radius.md,
                  color: '#000', fontWeight: 700, fontSize: 14,
                  cursor: verifyLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Exo 2', sans-serif",
                }}
              >
                {verifyLoading ? 'Проверяем...' : 'Подтвердить'}
              </motion.button>
              {editingOnewin && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setEditingOnewin(false); setVerifyError(''); setOnewinInput(''); }}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${colors.border}`, borderRadius: radius.md,
                    color: colors.textMuted, fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  Отмена
                </motion.button>
              )}
            </div>
          </GlowCard>
        )}

        {/* ── 1win Banner ── */}
        {settings?.referralUrl && (
          <GlowCard variant="amber" onClick={openReferral}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: colors.text, fontWeight: 700, fontSize: 15 }}>
                  Играй на 1win
                </div>
                <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  Переходи по нашей ссылке
                </div>
              </div>
              <div style={{
                background: gradient.amber,
                color: '#000',
                fontWeight: 800, fontSize: 13,
                padding: '9px 16px',
                borderRadius: radius.full,
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: glow.amber,
                flexShrink: 0,
              }}>
                <ExternalLink size={14} />
                Перейти
              </div>
            </div>
          </GlowCard>
        )}

      </div>
    </motion.div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}

function InfoCard({ icon, label, value, small }: InfoCardProps) {
  return (
    <div style={{
      background: gradient.card,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{
        color: colors.text,
        fontSize: small ? 11 : 14,
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}
