import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, User as UserIcon, BookOpen, Copy, Lock, ExternalLink } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { User, Tab, Settings } from '../types';
import { fetchSettings, getUserAvatar } from '../api';
import { useToast } from '../components/Toast';
import GlowCard from '../components/GlowCard';
import StatusBadge from '../components/StatusBadge';
import { ShimmerCard } from '../components/Shimmer';
import { colors, glow, gradient, radius } from '../theme';

interface Props {
  user: User;
  telegramId: number;
  onTabChange: (tab: Tab) => void;
  onShowOnboard: () => void;
}

export default function DashboardPage({ user, telegramId, onTabChange, onShowOnboard }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [online, setOnline] = useState(() => Math.floor(Math.random() * 400) + 100);
  const { showToast } = useToast();

  const tgUser = WebApp.initDataUnsafe?.user;
  const displayName = tgUser
    ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
    : `User ${telegramId}`;

  const isUnlocked = user.status === 'DEPOSITED' || user.status === 'VIP';

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
    getUserAvatar(telegramId).then(setAvatarUrl).catch(() => {});

    const interval = setInterval(() => {
      setOnline(Math.floor(Math.random() * 400) + 100);
    }, 30000);
    return () => clearInterval(interval);
  }, [telegramId]);

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  function getBalanceDisplay() {
    const bal = parseFloat(user.balance);
    const dep = parseFloat(user.totalDeposit);
    if (bal > 0) return { value: bal.toLocaleString('ru-RU'), label: 'Баланс' };
    if (dep > 0) return { value: dep.toLocaleString('ru-RU'), label: 'Пополнено' };
    return null;
  }

  async function copyPromo() {
    if (!settings?.promoCode) return;
    try {
      await navigator.clipboard.writeText(settings.promoCode);
      showToast('Промокод скопирован!', 'success');
    } catch {
      showToast('Не удалось скопировать', 'error');
    }
  }

  function openReferral() {
    if (settings?.referralUrl) WebApp.openLink(settings.referralUrl);
  }

  const balanceDisplay = getBalanceDisplay();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: colors.bg,
        paddingBottom: 90,
        overflowY: 'auto',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '24px 20px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}>
        <motion.img
          src="/logo.webp"
          alt="Tower Rush"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            width: 150,
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 24px rgba(245,166,35,0.5)) drop-shadow(0 0 48px rgba(245,166,35,0.2))',
          }}
        />
      </div>

      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Player Card ── */}
        <GlowCard variant="navy" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                border: `2px solid ${colors.amber}`,
                boxShadow: glow.amberSoft,
                overflow: 'hidden',
                flexShrink: 0,
                background: colors.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <UserIcon size={24} color={colors.textMuted} />
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: colors.text, fontWeight: 700, fontSize: 15,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </div>
                {tgUser?.username && (
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>@{tgUser.username}</div>
                )}
                <div style={{ marginTop: 5 }}>
                  <StatusBadge status={user.status} />
                </div>
              </div>
            </div>

            {/* Balance / Lock */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {isUnlocked && balanceDisplay ? (
                <>
                  <div style={{
                    color: colors.amber, fontSize: 22, fontWeight: 800,
                    textShadow: `0 0 12px rgba(245,166,35,0.5)`,
                    letterSpacing: -0.5, lineHeight: 1,
                  }}>
                    {balanceDisplay.value} ₽
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    {balanceDisplay.label}
                  </div>
                </>
              ) : !isUnlocked ? (
                <div style={{ fontSize: 28 }}>🔒</div>
              ) : null}

              {/* Online */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                justifyContent: 'flex-end', marginTop: 10,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: colors.success,
                  boxShadow: `0 0 6px ${colors.success}`,
                }} />
                <span style={{ color: colors.textMuted, fontSize: 11 }}>
                  {online} онлайн
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            marginTop: 14, paddingTop: 14,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
          }}>
            <StatItem label="1win ID" value={user.onewinId || '—'} />
            <div style={{ width: 1, background: colors.border, flexShrink: 0 }} />
            <StatItem label="В боте с" value={formatDate(user.createdAt)} />
            <div style={{ width: 1, background: colors.border, flexShrink: 0 }} />
            <StatItem label="Депозитов" value={String(user.depositCount)} />
          </div>
        </GlowCard>

        {/* ── 1win Banner ── */}
        {settings ? (
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
        ) : (
          <ShimmerCard height={72} />
        )}

        {/* ── Navigation ── */}
        <div>
          <div style={{
            color: colors.amber, fontSize: 11, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 10, paddingLeft: 2,
          }}>
            Навигация
          </div>

          {/* Signals — full width */}
          <NavCard
            icon={<Zap size={20} fill={isUnlocked ? colors.amber : 'none'} color={isUnlocked ? colors.amber : colors.textMuted} />}
            label="Сигналы"
            desc={isUnlocked ? 'Получай точные сигналы' : 'Доступно после пополнения баланса'}
            locked={!isUnlocked}
            amber
            onClick={() => isUnlocked ? onTabChange('signals') : onShowOnboard()}
            style={{ marginBottom: 8 }}
          />

          {/* Profile + Training */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <NavCard
              icon={<UserIcon size={18} color={colors.cyan} />}
              label="Профиль"
              desc="Твои данные"
              onClick={() => onTabChange('profile')}
            />
            <NavCard
              icon={<BookOpen size={18} color={colors.cyan} />}
              label="Обучение"
              desc="Как начать"
              onClick={() => onTabChange('training')}
            />
          </div>
        </div>

        {/* ── Promo Code ── */}
        {settings?.promoCode && (
          <GlowCard variant="default" onClick={copyPromo} glowOnHover>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: colors.textMuted, fontSize: 12 }}>
                  Промокод при регистрации
                </div>
                <div style={{
                  color: colors.amber, fontWeight: 800, fontSize: 20,
                  letterSpacing: 2, marginTop: 4,
                  textShadow: `0 0 10px rgba(245,166,35,0.4)`,
                }}>
                  {settings.promoCode}
                </div>
              </div>
              <div style={{
                width: 42, height: 42, borderRadius: radius.md,
                background: 'rgba(245,166,35,0.1)',
                border: `1px solid rgba(245,166,35,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Copy size={18} color={colors.amber} />
              </div>
            </div>
          </GlowCard>
        )}

      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
      <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 3 }}>{label}</div>
      <div style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

interface NavCardProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  locked?: boolean;
  amber?: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

function NavCard({ icon, label, desc, locked, amber, onClick, style }: NavCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: amber ? gradient.cardAmber : gradient.card,
        border: `1px solid ${amber ? 'rgba(245,166,35,0.3)' : colors.border}`,
        borderRadius: radius.lg,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: amber ? glow.amberSoft : 'none',
        ...style,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: radius.md,
        background: amber ? 'rgba(245,166,35,0.12)' : 'rgba(0,212,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {locked ? <Lock size={18} color={colors.textMuted} /> : icon}
      </div>
      <div>
        <div style={{ color: locked ? colors.textMuted : colors.text, fontWeight: 700, fontSize: 14 }}>
          {label}
        </div>
        <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{desc}</div>
      </div>
    </motion.div>
  );
}
