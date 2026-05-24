import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, ExternalLink, CheckCircle, BookOpen } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { Settings } from '../types';
import { fetchSettings } from '../api';
import { useToast } from '../components/Toast';
import GlowCard from '../components/GlowCard';
import { colors, glow, gradient, radius } from '../theme';

const spring = { type: 'spring', stiffness: 340, damping: 28 } as const;

const STEPS = [
  {
    num: 1,
    title: 'Регистрация на 1win',
    desc: 'Перейди по ссылке бота и создай аккаунт на 1win. Обязательно используй промокод при регистрации — получишь бонус на первый депозит.',
  },
  {
    num: 2,
    title: 'Привяжи свой ID',
    desc: 'Зайди в раздел Профиль и введи свой 1win ID. Найдёшь его в личном кабинете 1win → раздел "Профиль". Бот проверит регистрацию автоматически.',
  },
  {
    num: 3,
    title: 'Сделай депозит',
    desc: 'Пополни баланс на 1win. Минимальная рекомендуемая сумма — 500 ₽. После зачисления депозита доступ к сигналам разблокируется автоматически.',
  },
  {
    num: 4,
    title: 'Получай сигналы',
    desc: 'Открой раздел Сигналы, выбери стратегию и нажми "Получить сигнал". Следуй рекомендациям — сколько этажей строить и с какой ставкой.',
  },
];

const FAQ = [
  {
    q: 'Как получить доступ к сигналам?',
    a: 'Зарегистрируйся на 1win по нашей ссылке, привяжи свой ID в разделе Профиль и пополни баланс. После этого сигналы разблокируются автоматически.',
  },
  {
    q: 'Где найти мой 1win ID?',
    a: 'Зайди в личный кабинет 1win → нажми на аватарку в верхнем правом углу → твой ID будет отображён под именем профиля.',
  },
  {
    q: 'Почему сигналы всё ещё заблокированы после депозита?',
    a: 'Подтверждение депозита занимает до 15 минут. Если прошло больше — проверь правильность привязанного 1win ID в разделе Профиль.',
  },
  {
    q: 'Что такое промокод и зачем он нужен?',
    a: 'Промокод даёт бонус при первом депозите на 1win. Вводится при регистрации или в разделе "Бонусы" личного кабинета. Используй его до пополнения баланса.',
  },
  {
    q: 'Какая минимальная ставка?',
    a: 'Рекомендуем начинать с небольших ставок — от 100 ₽ за раунд. Это позволит протестировать стратегию без большого риска.',
  },
  {
    q: 'Что делать при проигрыше?',
    a: 'Не пытайся отыграться сразу — это основная ошибка. Сделай паузу 10–15 минут и продолжи со свежей головой. Соблюдай стоп-лосс.',
  },
];

const TIPS = [
  'Начинай с минимальных ставок, пока не освоишь стратегию',
  'Никогда не ставь больше 10–15% баланса за один раунд',
  'Соблюдай стоп-лосс: потерял 30% сессии — остановись',
  'Не гонись за отыгрышем — это ловушка',
  'Фиксируй прибыль при достижении цели сессии',
];

export default function TrainingPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', background: colors.bg, paddingBottom: 90, overflowY: 'auto' }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '28px 16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: radius.md,
            background: 'rgba(245,166,35,0.12)',
            border: `1px solid rgba(245,166,35,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={18} color={colors.amber} />
          </div>
          <div>
            <div style={{
              color: colors.amber, fontSize: 11, fontWeight: 700,
              letterSpacing: 2, textTransform: 'uppercase',
            }}>
              Раздел
            </div>
            <div style={{ color: colors.text, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              Обучение
            </div>
          </div>
        </div>

        {settings?.referralUrl && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openReferral}
            style={{
              padding: '9px 14px',
              background: gradient.amber,
              border: 'none', borderRadius: radius.full,
              color: '#000', fontWeight: 800, fontSize: 12,
              cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: glow.amberSoft,
              flexShrink: 0,
            }}
          >
            <ExternalLink size={13} />
            На 1win
          </motion.button>
        )}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

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
          <motion.div
            onClick={copyPromo}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            variants={{
              rest: { scale: 1, boxShadow: '0 0 0px rgba(245,166,35,0)' },
              hover: { scale: 1.025, boxShadow: '0 0 28px rgba(245,166,35,0.38)' },
            }}
            transition={spring}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(55,22,0,0.95) 0%, rgba(35,13,0,0.98) 100%)',
              border: '1px solid rgba(245,166,35,0.38)',
              borderRadius: radius.lg, padding: 16, cursor: 'pointer',
            }}
          >
            <motion.div
              variants={{
                rest: { x: '-130%' },
                hover: { x: '350%', transition: { duration: 0.5, ease: 'easeIn' } },
              }}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '45%',
                background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.12), transparent)',
                transform: 'skewX(-15deg)', pointerEvents: 'none', zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: colors.amber, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  Промокод — бонус +500%
                </div>
                <div style={{ color: '#ffd86a', fontWeight: 900, fontSize: 22, letterSpacing: 3, textShadow: '0 0 14px rgba(245,166,35,0.55)' }}>
                  {settings.promoCode}
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: radius.md,
                background: 'rgba(245,166,35,0.14)', border: '1px solid rgba(245,166,35,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Copy size={18} color={colors.amber} />
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* ── Steps ── */}
        <div>
          <SectionLabel>Пошаговый план</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS.map((step, i) => (
              <AccordionItem
                key={step.num}
                isOpen={openStep === i}
                onToggle={() => setOpenStep(openStep === i ? null : i)}
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: openStep === i ? gradient.amber : 'rgba(245,166,35,0.12)',
                      border: `1px solid rgba(245,166,35,0.4)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: openStep === i ? '#000' : colors.amber,
                      fontWeight: 800, fontSize: 13,
                      transition: 'all 0.2s',
                    }}>
                      {step.num}
                    </div>
                    <span style={{
                      color: openStep === i ? colors.amber : colors.text,
                      fontWeight: 700, fontSize: 14,
                      transition: 'color 0.2s',
                    }}>
                      {step.title}
                    </span>
                  </div>
                }
              >
                <p style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </AccordionItem>
            ))}
          </div>
        </div>

        {/* ── Tips ── */}
        <GlowCard variant="navy">
          <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Советы
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle size={15} color={colors.success} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* ── FAQ ── */}
        <div>
          <SectionLabel>FAQ</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                header={
                  <span style={{
                    color: openFaq === i ? colors.amber : colors.text,
                    fontWeight: 600, fontSize: 14,
                    transition: 'color 0.2s',
                  }}>
                    {item.q}
                  </span>
                }
              >
                <p style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {item.a}
                </p>
              </AccordionItem>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: colors.amber, fontSize: 11, fontWeight: 700,
      letterSpacing: 2, textTransform: 'uppercase',
      marginBottom: 10, paddingLeft: 2,
    }}>
      {children}
    </div>
  );
}

interface AccordionItemProps {
  isOpen: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}

function AccordionItem({ isOpen, onToggle, header, children }: AccordionItemProps) {
  return (
    <div style={{
      background: gradient.card,
      border: `1px solid ${isOpen ? 'rgba(245,166,35,0.3)' : colors.border}`,
      borderRadius: radius.lg,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={onToggle}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0, lineHeight: 0 }}
        >
          <ChevronDown size={16} color={isOpen ? colors.amber : colors.textMuted} />
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 14px',
              borderTop: `1px solid ${colors.border}`,
              paddingTop: 12,
            }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
