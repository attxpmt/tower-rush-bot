import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, MessageCircle, ExternalLink, Star, LogOut, Server, Code2 } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { Settings } from '../types';
import { fetchSettings } from '../api';
import api from '../api/client';
import GlowCard from '../components/GlowCard';
import { colors, glow, gradient, radius } from '../theme';

const I18N = {
  ru: {
    section: 'Раздел',
    title: 'Настройки',
    language: 'Язык',
    appInfo: 'О приложении',
    version: 'Версия',
    server: 'Статус сервера',
    developer: 'Разработчик',
    online: 'Онлайн',
    offline: 'Офлайн',
    devName: 'Tower Rush Team',
    support: 'Поддержка',
    supportBtn: 'Написать в поддержку',
    onewinBtn: 'Перейти на 1win',
    rating: 'Оценка приложения',
    close: 'Закрыть приложение',
    disclaimer: 'Бот предоставляет информационные сигналы на основе статистического анализа. Автор не несёт ответственности за финансовые решения пользователя. Игра на реальные деньги — ваш личный выбор и риск.',
  },
  en: {
    section: 'Section',
    title: 'Settings',
    language: 'Language',
    appInfo: 'About app',
    version: 'Version',
    server: 'Server status',
    developer: 'Developer',
    online: 'Online',
    offline: 'Offline',
    devName: 'Tower Rush Team',
    support: 'Support',
    supportBtn: 'Contact support',
    onewinBtn: 'Go to 1win',
    rating: 'App rating',
    close: 'Close app',
    disclaimer: 'The bot provides informational signals based on statistical analysis. The author is not responsible for the user\'s financial decisions. Playing for real money is your personal choice and risk.',
  },
};

type Lang = 'ru' | 'en';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const t = I18N['ru'];

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
    api.get('/health')
      .then(() => setServerOk(true))
      .catch(() => setServerOk(false));
  }, []);

  function openSupport() {
    if (!settings?.supportContact) return;
    let url = settings.supportContact.trim();
    if (url.startsWith('@')) url = `https://t.me/${url.slice(1)}`;
    else if (!/^https?:\/\//.test(url)) url = `https://t.me/${url}`;
    // openTelegramLink открывает t.me ссылки внутри Telegram
    // но на некоторых клиентах молча не работает — страхуемся window.open
    try {
      if (url.startsWith('https://t.me/')) {
        WebApp.openTelegramLink(url);
      } else {
        WebApp.openLink(url);
      }
    } catch {
      window.open(url, '_blank');
    }
  }

  function openReferral() {
    if (settings?.referralUrl) WebApp.openLink(settings.referralUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', background: colors.bg, paddingBottom: 90, overflowY: 'auto' }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '28px 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: radius.md,
          background: 'rgba(245,166,35,0.12)',
          border: `1px solid rgba(245,166,35,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Settings2 size={18} color={colors.amber} />
        </div>
        <div>
          <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            {t.section}
          </div>
          <div style={{ color: colors.text, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
            {t.title}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── App Info ── */}
        <GlowCard variant="navy" padding="0">
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t.appInfo}
            </div>
          </div>
          <InfoRow
            icon={<Code2 size={15} color={colors.cyan} />}
            label={t.version}
            value="2.71.0"
          />
          <InfoRow
            icon={<Server size={15} color={serverOk === null ? colors.textMuted : serverOk ? colors.success : colors.danger} />}
            label={t.server}
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: serverOk === null ? colors.textMuted : serverOk ? colors.success : colors.danger,
                  boxShadow: serverOk ? `0 0 6px ${colors.success}` : 'none',
                }} />
                <span style={{ color: serverOk === null ? colors.textMuted : serverOk ? colors.success : colors.danger, fontWeight: 700, fontSize: 13 }}>
                  {serverOk === null ? '...' : serverOk ? t.online : t.offline}
                </span>
              </div>
            }
          />
          <InfoRow
            icon={<Star size={15} color={colors.amber} />}
            label={t.developer}
            value={t.devName}
            last
          />
        </GlowCard>

        {/* ── Rating ── */}
        <GlowCard variant="default" padding="14px 16px">
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>{t.rating}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} fill={colors.amber} color={colors.amber} />
              ))}
            </div>
            <span style={{ color: colors.amber, fontWeight: 800, fontSize: 20 }}>4.9</span>
            <span style={{ color: colors.textMuted, fontSize: 13 }}>/ 5.0</span>
          </div>
        </GlowCard>

        {/* ── Support ── */}
        <GlowCard variant="default" padding="0">
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t.support}
            </div>
          </div>
          {settings?.supportContact && (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={openSupport}
              style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle size={16} color={colors.cyan} />
                <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{t.supportBtn}</span>
              </div>
              <ExternalLink size={14} color={colors.textMuted} />
            </motion.div>
          )}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={openReferral}
            style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ExternalLink size={16} color={colors.amber} />
              <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{t.onewinBtn}</span>
            </div>
            <ExternalLink size={14} color={colors.textMuted} />
          </motion.div>
        </GlowCard>

        {/* ── Close Button ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => WebApp.close()}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            border: `1px solid rgba(245,166,35,0.35)`,
            borderRadius: radius.lg,
            color: colors.amber,
            fontWeight: 700, fontSize: 14,
            cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: glow.amberSoft,
          }}
        >
          <LogOut size={16} />
          {t.close}
        </motion.button>

        {/* ── Disclaimer ── */}
        <div style={{
          color: colors.textDim,
          fontSize: 11,
          lineHeight: 1.6,
          textAlign: 'center',
          padding: '4px 8px 8px',
        }}>
          {t.disclaimer}
        </div>

      </div>
    </motion.div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  last?: boolean;
}

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <div style={{
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: last ? 'none' : `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <span style={{ color: colors.textMuted, fontSize: 13 }}>{label}</span>
      </div>
      {typeof value === 'string'
        ? <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>{value}</span>
        : value
      }
    </div>
  );
}
