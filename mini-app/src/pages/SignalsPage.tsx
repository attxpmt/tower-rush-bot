import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Search, BarChart2, Layers, CheckSquare, DollarSign } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { User, Signal, Strategy, Settings } from '../types';
import { generateSignal, fetchSettings } from '../api';
import { useToast } from '../components/Toast';
import { colors, glow, gradient, radius } from '../theme';

interface Props {
  user: User;
}

type Phase = 'locked' | 'prepare' | 'playing' | 'analyzing' | 'result';

const MAX_SIGNALS = 6;

const STRATEGIES: { id: Strategy; label: string; desc: string; color: string }[] = [
  { id: 'stable',     label: 'Стабильная',  desc: 'Крупная ставка · мало этажей',    color: '#00d4ff' },
  { id: 'moderate',   label: 'Умеренная',   desc: 'Средняя ставка · средне этажей',  color: '#f5a623' },
  { id: 'aggressive', label: 'Агрессивная', desc: 'Малая ставка · много этажей',     color: '#ff4444' },
];

const BET_MULT: Record<Strategy, number> = { stable: 0.5, moderate: 0.35, aggressive: 0.25 };

const ANALYSIS_STEPS = [
  { icon: Search,   label: 'Анализирую статистику раундов' },
  { icon: BarChart2, label: 'Вычисляю паттерны игры' },
  { icon: Zap,      label: 'Калибрую коэффициент' },
];

function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export default function SignalsPage({ user }: Props) {
  const isUnlocked = user.status === 'DEPOSITED' || user.status === 'VIP';

  const [phase, setPhase] = useState<Phase>(isUnlocked ? 'prepare' : 'locked');
  const [strategy, setStrategy] = useState<Strategy>('moderate');
  const [riskAmount, setRiskAmount] = useState('');
  const [signal, setSignal] = useState<Signal | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionRounds, setSessionRounds] = useState(0);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState([0, 0, 0]);
  const [confidence, setConfidence] = useState(85);
  const [isHoisting, setIsHoisting] = useState(false);
  const [isBlockFalling, setIsBlockFalling] = useState(false);
  const [stableHeight, setStableHeight] = useState(() => WebApp.viewportStableHeight || window.innerHeight);
  const { showToast } = useToast();

  useEffect(() => { fetchSettings().then(setSettings).catch(() => {}); }, []);

  useEffect(() => {
    const update = () => setStableHeight(WebApp.viewportStableHeight || window.innerHeight);
    update();
    WebApp.onEvent('viewportChanged', update);
    return () => WebApp.offEvent('viewportChanged', update);
  }, []);

  const blockCount = sessionRounds;
  const canGetSignal = blockCount < MAX_SIGNALS;

  async function runAnalysis(): Promise<void> {
    const progs = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      if (i > 0) await delay(150 + Math.random() * 200);
      let current = 0;
      while (current < 100) {
        const chunk = 4 + Math.random() * 14;
        current = Math.min(100, current + chunk);
        progs[i] = current;
        setAnalysisProgress([...progs]);
        // случайная пауза "думает" в середине
        if (current > 35 && current < 80 && Math.random() < 0.28) {
          await delay(350 + Math.random() * 450);
        } else {
          await delay(50 + Math.random() * 110);
        }
      }
    }
    await delay(200);
  }

  async function handleGetSignal() {
    if (!canGetSignal) return;
    // 1. Crane hoists up
    setIsHoisting(true);
    await delay(600);
    // 2. Block falls — wait for spring to settle before showing analysis
    setIsBlockFalling(true);
    await delay(1500);
    // 3. Now show analysis panel — block has fully landed
    setAnalysisProgress([0, 0, 0]);
    setPhase('analyzing');
    try {
      const [result] = await Promise.all([generateSignal(strategy), runAnalysis()]);
      setSignal(result);
      setConfidence(70 + (result.id % 26));
      await delay(200);
      setPhase('result');
    } catch {
      showToast('Ошибка получения сигнала', 'error');
      setIsHoisting(false);
      setIsBlockFalling(false);
      setPhase('playing');
    }
  }

  function startSession() {
    setSessionRounds(0);
    setSessionWins(0);
    setSessionLosses(0);
    setSignal(null);
    setIsHoisting(false);
    setIsBlockFalling(false);
    setPhase('playing');
  }

  function recordResult(won: boolean) {
    if (won) setSessionWins((w) => w + 1);
    else setSessionLosses((l) => l + 1);
    setSessionRounds((r) => r + 1);
    setIsBlockFalling(false);
    setIsHoisting(false);
    setSignal(null);
    setPhase('playing');
    showToast(won ? 'Победа записана! 🏆' : 'Поражение записано', won ? 'success' : 'error');
  }

  function endSession() {
    setSignal(null);
    setIsHoisting(false);
    setIsBlockFalling(false);
    setPhase('prepare');
  }

  const riskNum = parseFloat(riskAmount) || 0;
  const calculatedBet = riskNum > 0 ? Math.round(riskNum * BET_MULT[strategy]) : null;

  return (
    // Outer container — position: relative so fullscreen overlays anchor here
    <div style={{ position: 'relative', height: stableHeight - 80, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Game area — flex:1, height is STABLE (always total minus 136px) ── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <GameScene
          phase={phase}
          isHoisting={isHoisting}
          isBlockFalling={isBlockFalling}
        />
        {(phase === 'playing' || phase === 'analyzing' || phase === 'result') && (
          <TopPanel wins={sessionWins} losses={sessionLosses} rounds={sessionRounds} />
        )}
      </div>

      {/* ── Button strip — fixed 136px, ALWAYS rendered, keeps game area height stable ── */}
      <div style={{
        flexShrink: 0, height: 136,
        background: colors.bg,
        padding: '12px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {phase === 'playing' && (
          <>
            {canGetSignal ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGetSignal}
                style={{
                  width: '100%', padding: '18px',
                  background: gradient.amber,
                  border: 'none', borderRadius: radius.lg,
                  color: '#000', fontWeight: 800, fontSize: 17,
                  cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `${glow.amberStrong}, 0 4px 24px rgba(0,0,0,0.6)`,
                }}
              >
                <Zap size={20} fill="#000" /> ПОЛУЧИТЬ СИГНАЛ
              </motion.button>
            ) : (
              <div style={{
                textAlign: 'center', padding: '14px',
                color: colors.amber, fontSize: 13, fontWeight: 600,
                background: 'rgba(245,166,35,0.08)', borderRadius: radius.lg,
                border: `1px solid rgba(245,166,35,0.25)`,
              }}>
                Лимит {MAX_SIGNALS} сигналов за сессию достигнут
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={endSession}
              style={{
                width: '100%', padding: '11px',
                background: 'rgba(140,80,0,0.3)',
                border: `1px solid rgba(200,120,0,0.45)`,
                borderRadius: radius.md,
                color: '#c88010', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
              }}
            >
              Завершить игру
            </motion.button>
          </>
        )}
      </div>

      {/* ── Fullscreen overlays — anchored to outer container, cover game+buttons ── */}
      <AnimatePresence>
        {phase === 'locked' && (
          <LockedOverlay key="locked" onOpen={() => settings?.referralUrl && WebApp.openLink(settings.referralUrl)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'prepare' && (
          <PrepareOverlay
            key="prepare"
            strategy={strategy}
            riskAmount={riskAmount}
            onRiskAmountChange={setRiskAmount}
            onStrategyChange={setStrategy}
            onStart={startSession}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'analyzing' && (
          <AnalyzingOverlay key="analyzing" progress={analysisProgress} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'result' && signal && (
          <ResultCard
            key="result"
            signal={signal}
            confidence={confidence}
            calculatedBet={calculatedBet}
            onWin={() => recordResult(true)}
            onLoss={() => recordResult(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Game Scene ────────────────────────────────────────────────────────────────

function GameScene({ phase, isHoisting, isBlockFalling }: {
  phase: Phase; isHoisting: boolean; isBlockFalling: boolean;
}) {
  const isSwinging = phase === 'playing';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Sky */}
      <img src="/background-back.webp" alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover',
      }} />

      {/* Cloud 1 */}
      <motion.img src="/cloud-1.webp" alt=""
        style={{ position: 'absolute', top: '6%', left: '-8%', width: '50%', opacity: 0.9 }}
        animate={{ x: [0, 18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cloud 2 */}
      <motion.img src="/cloud-2.webp" alt=""
        style={{ position: 'absolute', top: '14%', right: '-6%', width: '42%', opacity: 0.8 }}
        animate={{ x: [0, -14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Yellow glow */}
      <img src="/yellow-glow.webp" alt="" style={{
        position: 'absolute', top: '-8%', left: '50%',
        transform: 'translateX(-50%)',
        width: '70%', opacity: 0.3, mixBlendMode: 'screen',
      }} />

      {/* Crane — center top, swings; hoists up on signal */}
      <motion.img
        src="/kran-new.webp" alt=""
        style={{
          position: 'absolute', top: 0, left: '50%',
          width: '50%',
          transformOrigin: '50% 0%',
          x: '-50%',
          zIndex: 4,
        }}
        animate={
          isHoisting
            ? { y: '-120%', rotate: 0 }
            : isSwinging
              ? { y: 0, rotate: [-20, 20, -20] }
              : { y: 0, rotate: [-3, 3, -3] }
        }
        transition={
          isHoisting
            ? { duration: 0.5, ease: 'easeIn' }
            : isSwinging
              ? { rotate: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.4, ease: 'easeOut' } }
              : { rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.4, ease: 'easeOut' } }
        }
      />

      {/* City foreground — sits at bottom of game area */}
      <img src="/background-front.webp" alt="" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        width: '100%', height: '32%',
        objectFit: 'cover', objectPosition: 'center bottom',
        zIndex: 2,
      }} />

      {/* Tower base — stands on road (30% of foreground height from bottom = ~10% of game area) */}
      <img src="/basis-tower.webp" alt="" style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%', transform: 'translateX(-50%)',
        width: '48%',
        zIndex: 3,
      }} />

      {/* dom.webp — falls from top, bounces on landing */}
      <AnimatePresence>
        {isBlockFalling && (
          <motion.img
            key="falling-dom"
            src="/dom.webp" alt=""
            style={{
              position: 'absolute',
              bottom: '28%',
              left: '50%',
              width: '52%',
              x: '-50%',
              zIndex: 5,
              transformOrigin: '50% 100%',
            }}
            initial={{ y: -750, scaleY: 1 }}
            animate={{ y: [null, 0, -18, 6, -4, 0], scaleY: [1, 0.82, 1.06, 0.95, 1.02, 1] }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 1.3, ease: ['easeIn', 'easeOut', 'easeOut', 'easeOut', 'easeOut', 'easeOut'], times: [0, 0.55, 0.68, 0.78, 0.88, 1] }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Top Panel ────────────────────────────────────────────────────────────────

function TopPanel({ wins, losses, rounds }: { wins: number; losses: number; rounds: number }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: '16px 16px 0',
      display: 'flex', gap: 8, justifyContent: 'center',
      zIndex: 10,
    }}>
      <StatChip label="Раундов" value={String(rounds)} color={colors.textMuted} />
      <StatChip label="Побед" value={String(wins)} color={colors.success} />
      <StatChip label="Поражений" value={String(losses)} color={colors.danger} />
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '6px 12px 6px 10px',
      background: 'rgba(10,22,40,0.85)',
      borderRadius: radius.full,
      display: 'flex', alignItems: 'center', gap: 6,
      backdropFilter: 'blur(8px)',
      borderLeft: `2.5px solid ${color}`,
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeftColor: color,
      boxShadow: `0 2px 12px rgba(0,0,0,0.4)`,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{label}</span>
      <span style={{ color, fontWeight: 800, fontSize: 13 }}>{value}</span>
    </div>
  );
}

// ─── Locked Overlay ───────────────────────────────────────────────────────────

function LockedOverlay({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(5,11,24,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 28, gap: 18,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'rgba(245,166,35,0.1)',
          border: `2px solid rgba(245,166,35,0.35)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: glow.amber,
        }}
      >
        <Lock size={38} color={colors.amber} />
      </motion.div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
          Сигналы заблокированы
        </div>
        <div style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.65 }}>
          Зарегистрируйся на 1win и сделай первый депозит — сигналы разблокируются автоматически
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onOpen}
        style={{
          padding: '14px 28px', background: gradient.amber,
          border: 'none', borderRadius: radius.full,
          color: '#000', fontWeight: 800, fontSize: 15,
          cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
          boxShadow: glow.amber, width: '100%',
        }}
      >
        Зарегистрироваться на 1win
      </motion.button>
    </motion.div>
  );
}

// ─── Prepare Overlay ──────────────────────────────────────────────────────────

function PrepareOverlay({ strategy, riskAmount, onRiskAmountChange, onStrategyChange, onStart }: {
  strategy: Strategy;
  riskAmount: string;
  onRiskAmountChange: (v: string) => void;
  onStrategyChange: (s: Strategy) => void;
  onStart: () => void;
}) {
  const [showError, setShowError] = useState(false);
  const riskValid = parseFloat(riskAmount) > 0;

  function handleStart() {
    if (!riskValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
      return;
    }
    onStart();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: colors.bg,
        display: 'flex', flexDirection: 'column',
        padding: '28px 16px 24px',
        gap: 20, overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          Подготовка
        </div>
        <div style={{ color: colors.text, fontWeight: 800, fontSize: 22 }}>
          Формируем стратегию
        </div>
      </div>

      {/* Risk amount input */}
      <div>
        <div style={{ color: showError ? colors.danger : colors.amber, fontSize: 13, fontWeight: 800, marginBottom: 8, transition: 'color 0.2s' }}>
          Сумма для риска (₽){showError && ' — обязательное поле'}
        </div>
        <motion.div animate={showError ? { x: [-6, 6, -5, 5, -3, 0] } : {}} transition={{ duration: 0.35 }}>
          <input
            type="number"
            value={riskAmount}
            onChange={(e) => { onRiskAmountChange(e.target.value); setShowError(false); }}
            placeholder="Введите сумму..."
            style={{
              width: '100%', padding: '13px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${showError ? colors.danger : riskAmount ? 'rgba(245,166,35,0.5)' : colors.border}`,
              borderRadius: radius.md,
              color: colors.text, fontSize: 16, fontWeight: 700,
              fontFamily: "'Exo 2', sans-serif",
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </motion.div>
        {showError && (
          <div style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
            Укажи сумму перед началом игры
          </div>
        )}
      </div>

      {/* Strategy */}
      <div>
        <div style={{ color: colors.amber, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Стратегия</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STRATEGIES.map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onStrategyChange(s.id)}
              style={{
                flex: 1, padding: '14px 4px',
                background: strategy === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${strategy === s.id ? s.color : colors.border}`,
                borderRadius: radius.lg,
                color: strategy === s.id ? s.color : colors.textMuted,
                cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                fontWeight: 800, fontSize: 13,
                boxShadow: strategy === s.id ? `0 0 14px ${s.color}35` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Brief rules */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(245,166,35,0.04)',
        border: '1px solid rgba(245,166,35,0.2)',
        borderRadius: radius.md,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {[
          { Icon: DollarSign, text: 'Введи сумму, которой готов рискнуть за сессию' },
          { Icon: Layers,     text: 'Выбери стратегию игры' },
          { Icon: Zap,        text: 'Нажми «Начать» — бот укажет сколько этажей строить' },
          { Icon: CheckSquare, text: 'Фиксируй результат после каждого раунда' },
        ].map(({ Icon, text }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: colors.amber, fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingTop: 4 }}>
              <Icon size={13} color={colors.amber} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 12, lineHeight: 1.4 }}>{text}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <motion.button
        initial="rest"
        whileHover={riskValid ? 'hover' : 'rest'}
        whileTap={{ scale: 0.97 }}
        variants={{
          rest: { scale: 1, boxShadow: glow.amber },
          hover: { scale: 1.02, boxShadow: glow.amberStrong },
        }}
        onClick={handleStart}
        style={{
          position: 'relative', overflow: 'hidden',
          width: '100%', padding: '16px',
          background: riskValid ? gradient.amber : 'rgba(255,255,255,0.08)',
          border: riskValid ? 'none' : `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          color: riskValid ? '#000' : colors.textMuted,
          fontWeight: 800, fontSize: 16,
          cursor: riskValid ? 'pointer' : 'default',
          fontFamily: "'Exo 2', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {riskValid && (
          <motion.div
            variants={{
              rest: { x: '-130%' },
              hover: { x: '350%', transition: { duration: 0.45, ease: 'easeIn' } },
            }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '45%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
        )}
        <Zap size={18} fill={riskValid ? '#000' : colors.textMuted} /> Начать играть
      </motion.button>
    </motion.div>
  );
}

// ─── Analyzing Overlay ────────────────────────────────────────────────────────

function AnalyzingOverlay({ progress }: { progress: number[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 15,
        background: 'rgba(5,11,24,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', gap: 28,
      }}
    >
      <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
        Анализ данных
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ANALYSIS_STEPS.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <item.icon size={16} color={progress[i] >= 100 ? colors.success : colors.amber} />
                <span style={{
                  color: progress[i] >= 100 ? colors.text : colors.textMuted,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                color: progress[i] >= 100 ? colors.success : colors.amber,
                fontWeight: 800, fontSize: 13, minWidth: 38, textAlign: 'right',
              }}>
                {Math.round(progress[i])}%
              </span>
            </div>
            <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress[i]}%`,
                background: progress[i] >= 100
                  ? `linear-gradient(90deg, ${colors.success}, #80ffb0)`
                  : gradient.amber,
                borderRadius: 4,
                boxShadow: progress[i] >= 100 ? `0 0 8px ${colors.success}` : glow.amberSoft,
                transition: 'width 0.05s linear',
              }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

const resultSpring = { type: 'spring', stiffness: 340, damping: 28 } as const;

function ResultCard({ signal, confidence, calculatedBet, onWin, onLoss }: {
  signal: Signal;
  confidence: number;
  calculatedBet: number | null;
  onWin: () => void;
  onLoss: () => void;
}) {
  const floors = signal.dominoes;
  const coef = parseFloat(signal.coefficient);
  const bet = calculatedBet ?? parseFloat(signal.betAmount);
  const profit = bet * (coef - 1);
  const riskColor = { low: colors.success, medium: colors.amber, high: colors.danger }[signal.riskLevel];
  const riskLabel = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[signal.riskLevel];
  const confColor = confidence >= 85 ? colors.success : confidence >= 75 ? colors.amber : colors.danger;
  const SEGMENTS = 10;
  const filledSegments = Math.round((confidence / 100) * SEGMENTS);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(to top, #050b18 0%, #0a1628 100%)',
        borderTop: `1px solid rgba(245,166,35,0.25)`,
        borderRadius: '20px 20px 0 0',
        padding: '14px 16px 24px',
        boxShadow: '0 -12px 50px rgba(0,0,0,0.8)',
      }}
    >
      {/* Handle */}
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />

      {/* Header — floors number */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ color: colors.amber, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
          Сигнал готов
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <motion.span
            animate={{ textShadow: [
              '0 0 20px rgba(245,166,35,0.5)',
              '0 0 60px rgba(245,166,35,0.95)',
              '0 0 20px rgba(245,166,35,0.5)',
            ]}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: colors.amber, fontSize: 80, fontWeight: 900, lineHeight: 1 }}
          >
            {floors}
          </motion.span>
          <span style={{ color: colors.textMuted, fontSize: 22, fontWeight: 600 }}>этажей</span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <InfoChip label="Примерный множитель" value={`×${coef.toFixed(1)}`} valueColor={colors.amber} />
        <InfoChip label="Риск" value={riskLabel} valueColor={riskColor} />
        <InfoChip label="Ставка" value={`${bet.toFixed(0)} ₽`} valueColor={colors.text} />
        <InfoChip label="Примерная прибыль" value={`+${profit.toFixed(0)} ₽`} valueColor={colors.success} />
      </div>

      {/* Confidence block */}
      <div style={{
        marginBottom: 14, padding: '12px 14px',
        background: 'rgba(245,166,35,0.06)',
        border: `1px solid rgba(245,166,35,0.2)`,
        borderRadius: radius.md,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ color: colors.text, fontSize: 14, fontWeight: 800 }}>Уверенность алгоритма</span>
          <span style={{ color: confColor, fontWeight: 900, fontSize: 20 }}>{confidence}%</span>
        </div>
        {/* Segmented bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.06 * i, duration: 0.3, ease: 'easeOut' }}
              style={{
                flex: 1, height: 10, borderRadius: 3,
                background: i < filledSegments
                  ? (i >= 8 ? colors.success : i >= 5 ? colors.amber : colors.amberDim)
                  : 'rgba(255,255,255,0.07)',
                boxShadow: i === filledSegments - 1
                  ? `0 0 8px ${confColor}`
                  : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textDim, fontSize: 10 }}>Низкая</span>
          <span style={{ color: colors.textDim, fontSize: 10 }}>Средняя</span>
          <span style={{ color: colors.textDim, fontSize: 10 }}>Высокая</span>
        </div>
      </div>

      {/* Record result */}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          initial="rest"
          whileHover="hover"
          whileTap={{ scale: 0.97 }}
          variants={{
            rest: { scale: 1, boxShadow: '0 0 0px rgba(0,230,118,0)' },
            hover: { scale: 1.02, boxShadow: `0 0 20px rgba(0,230,118,0.35)` },
          }}
          transition={resultSpring}
          onClick={onWin}
          style={{
            position: 'relative', overflow: 'hidden',
            flex: 1, padding: '14px',
            background: 'rgba(0,230,118,0.12)', border: `1px solid rgba(0,230,118,0.4)`,
            borderRadius: radius.md, color: colors.success,
            fontWeight: 700, fontSize: 15,
            cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
          }}
        >
          <motion.div
            variants={{
              rest: { x: '-130%' },
              hover: { x: '350%', transition: { duration: 0.45, ease: 'easeIn' } },
            }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '45%',
              background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.2), transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          ✓ Победа
        </motion.button>
        <motion.button
          initial="rest"
          whileHover="hover"
          whileTap={{ scale: 0.97 }}
          variants={{
            rest: { scale: 1, boxShadow: '0 0 0px rgba(255,68,68,0)' },
            hover: { scale: 1.02, boxShadow: `0 0 20px rgba(255,68,68,0.35)` },
          }}
          transition={resultSpring}
          onClick={onLoss}
          style={{
            position: 'relative', overflow: 'hidden',
            flex: 1, padding: '14px',
            background: 'rgba(255,68,68,0.1)', border: `1px solid rgba(255,68,68,0.35)`,
            borderRadius: radius.md, color: colors.danger,
            fontWeight: 700, fontSize: 15,
            cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
          }}
        >
          <motion.div
            variants={{
              rest: { x: '-130%' },
              hover: { x: '350%', transition: { duration: 0.45, ease: 'easeIn' } },
            }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '45%',
              background: 'linear-gradient(90deg, transparent, rgba(255,68,68,0.18), transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          ✕ Поражение
        </motion.button>
      </div>
    </motion.div>
  );
}

function InfoChip({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`,
      borderRadius: radius.md, padding: '10px 12px',
    }}>
      <div style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: valueColor, fontWeight: 800, fontSize: 15 }}>{value}</div>
    </div>
  );
}
