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

const spring = { type: 'spring', stiffness: 340, damping: 28 } as const;

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
    getUserAvatar().then(setAvatarUrl).catch(() => {});

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
        padding: '20px 20px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 80 }}>
          <div style={{
            position: 'absolute',
            width: 100, height: 50,
            background: 'rgba(245,166,35,0.45)',
            borderRadius: '50%',
            filter: 'blur(22px)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }} />
          <motion.img
            src="/logo.webp"
            alt="Tower Rush"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ width: 110, height: 'auto', objectFit: 'contain', position: 'relative' }}
          />
        </div>
      </div>

      <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Player Card — shimmer-border вместо pulse-glow ── */}
        <GlowCard variant="navy" style={{ animation: 'shimmer-border 2.5s ease-in-out infinite' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
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
                  <StatusBadge status={user.status} depositCount={user.depositCount} />
                </div>
              </div>
            </div>

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

              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                justifyContent: 'flex-end', marginTop: 10,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: colors.success,
                  boxShadow: `0 0 6px ${colors.success}`,
                }} />
                <span style={{ color: colors.textMuted, fontSize: 11 }}>{online} онлайн</span>
              </div>
            </div>
          </div>

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

        {/* ── 1win Banner — всегда рендерится, не ждёт settings ── */}
        <OnewinBanner onClick={openReferral} />

        {/* ── Navigation ── */}
        <div>
          <div style={{
            color: colors.amber, fontSize: 11, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 10, paddingLeft: 2,
          }}>
            Навигация
          </div>

          <NavCard
            icon={<Zap size={20} fill={isUnlocked ? colors.amber : 'none'} color={isUnlocked ? colors.amber : colors.textMuted} />}
            label="Сигналы"
            desc={isUnlocked ? 'Играть по сигналам' : 'Доступно после пополнения баланса'}
            locked={!isUnlocked}
            amber
            onClick={() => isUnlocked ? onTabChange('signals') : onShowOnboard()}
            style={{ marginBottom: 8 }}
          />

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
        {settings === null ? (
          <div style={{
            height: 72, borderRadius: radius.lg,
            background: 'linear-gradient(90deg, #0a1628 25%, #1a2d5a 50%, #0a1628 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            border: `1px solid ${colors.border}`,
          }} />
        ) : settings.promoCode ? (
          <PromoBlock promoCode={settings.promoCode} onCopy={copyPromo} />
        ) : null}

      </div>
    </motion.div>
  );
}

// ─── 1win Banner ──────────────────────────────────────────────────────────────

function OnewinBanner({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      variants={{
        rest: { scale: 1, boxShadow: '0 4px 28px rgba(245,166,35,0.28)' },
        hover: { scale: 1.02, boxShadow: '0 8px 48px rgba(245,166,35,0.58)' },
      }}
      transition={spring}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: radius.lg,
        padding: '18px 20px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #f5a623 0%, #ffd055 45%, #e8920a 100%)',
        border: '1px solid rgba(255,210,80,0.5)',
      }}
    >
      {/* Shimmer sweep on hover */}
      <motion.div
        variants={{
          rest: { x: '-130%' },
          hover: { x: '300%', transition: { duration: 0.55, ease: 'easeIn' } },
        }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, width: '50%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          transform: 'skewX(-18deg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ color: '#000', fontWeight: 900, fontSize: 19, letterSpacing: -0.3, lineHeight: 1.15 }}>
            ИГРАТЬ НА 1WIN
          </div>
          <div style={{ color: 'rgba(0,0,0,0.58)', fontSize: 12, marginTop: 4 }}>
            Перейти на официальный сайт
          </div>
        </div>
        <motion.div
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.08 },
          }}
          transition={spring}
          style={{
            background: 'rgba(0,0,0,0.18)',
            borderRadius: radius.md,
            padding: '9px 15px',
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#000', fontWeight: 800, fontSize: 14,
            flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <ExternalLink size={15} strokeWidth={2.5} />
          Перейти
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────

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
      onClick={onClick}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      variants={{
        rest: { scale: 1, boxShadow: amber ? glow.amberSoft : 'none' },
        hover: {
          scale: 1.025,
          boxShadow: amber ? '0 0 24px rgba(245,166,35,0.38)' : '0 0 16px rgba(0,212,255,0.18)',
        },
      }}
      transition={spring}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: amber ? gradient.cardAmber : gradient.card,
        border: `1px solid ${amber ? 'rgba(245,166,35,0.3)' : colors.border}`,
        borderRadius: radius.lg,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...style,
      }}
    >
      {/* Shimmer sweep on hover */}
      <motion.div
        variants={{
          rest: { x: '-130%' },
          hover: { x: '350%', transition: { duration: 0.5, ease: 'easeIn' } },
        }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.065), transparent)',
          transform: 'skewX(-15deg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
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
      </div>
    </motion.div>
  );
}

// ─── Promo Block ──────────────────────────────────────────────────────────────

function PromoBlock({ promoCode, onCopy }: { promoCode: string; onCopy: () => void }) {
  return (
    <motion.div
      onClick={onCopy}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      variants={{
        rest: { scale: 1, boxShadow: '0 0 0px rgba(245,166,35,0)' },
        hover: { scale: 1.025, boxShadow: '0 0 28px rgba(245,166,35,0.38)' },
      }}
      transition={spring}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(55,22,0,0.95) 0%, rgba(35,13,0,0.98) 100%)',
        border: '1px solid rgba(245,166,35,0.38)',
        borderRadius: radius.lg,
        padding: 16,
        cursor: 'pointer',
      }}
    >
      {/* Shimmer sweep on hover */}
      <motion.div
        variants={{
          rest: { x: '-130%' },
          hover: { x: '350%', transition: { duration: 0.5, ease: 'easeIn' } },
        }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0, width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.12), transparent)',
          transform: 'skewX(-15deg)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            color: colors.amber, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
          }}>
            Промокод — бонус +500%
          </div>
          <div style={{
            color: '#ffd86a', fontWeight: 900, fontSize: 22,
            letterSpacing: 3,
            textShadow: '0 0 14px rgba(245,166,35,0.55)',
          }}>
            {promoCode}
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: radius.md,
          background: 'rgba(245,166,35,0.14)',
          border: '1px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Copy size={18} color={colors.amber} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>
      <div style={{ color: colors.textMuted, fontSize: 10, marginBottom: 3 }}>{label}</div>
      <div style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
