import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, RefreshCw, RotateCcw } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { User, Signal, Strategy, Settings } from '../types';
import { generateSignal, fetchSettings } from '../api';
import { useToast } from '../components/Toast';
import { colors, glow, gradient, radius } from '../theme';

interface Props {
  user: User;
  telegramId: number;
}

type Phase = 'locked' | 'prepare' | 'playing' | 'analyzing' | 'result';

const STRATEGIES: { id: Strategy; label: string; desc: string; color: string }[] = [
  { id: 'stable',     label: 'Стабильная',  desc: '×1.2–2.0', color: '#00d4ff' },
  { id: 'moderate',   label: 'Умеренная',   desc: '×1.5–4.0', color: '#f5a623' },
  { id: 'aggressive', label: 'Агрессивная', desc: '×2.0–9.0', color: '#ff4444' },
];

const ANALYSIS_LINES = [
  '🔍 Анализирую статистику раундов...',
  '📊 Вычисляю паттерны игры...',
  '⚡ Калибрую коэффициент...',
];

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export default function SignalsPage({ user, telegramId }: Props) {
  const isUnlocked = user.status === 'DEPOSITED' || user.status === 'VIP';

  const [phase, setPhase] = useState<Phase>(isUnlocked ? 'prepare' : 'locked');
  const [strategy, setStrategy] = useState<Strategy>('moderate');
  const [signal, setSignal] = useState<Signal | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionRounds, setSessionRounds] = useState(0);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [confidence, setConfidence] = useState(85);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
  }, []);

  async function runAnalysis(): Promise<void> {
    setAnalysisStep(0);
    setAnalysisProgress(0);
    for (let i = 1; i <= 3; i++) {
      await delay(700);
      setAnalysisStep(i);
    }
    const start = Date.now();
    const duration = 900;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
        setAnalysisProgress(pct);
        if (pct < 100) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    await delay(300);
  }

  async function handleGetSignal() {
    setPhase('analyzing');
    try {
      const [result] = await Promise.all([
        generateSignal(telegramId, strategy),
        runAnalysis(),
      ]);
      setSignal(result);
      setConfidence(70 + (result.id % 26));
      setPhase('result');
    } catch {
      showToast('Ошибка получения сигнала', 'error');
      setPhase('playing');
    }
  }

  function startSession() {
    setSessionRounds(0);
    setSessionWins(0);
    setSessionLosses(0);
    setSignal(null);
    setPhase('playing');
  }

  function recordResult(won: boolean) {
    if (won) setSessionWins((w) => w + 1);
    else setSessionLosses((l) => l + 1);
    setSessionRounds((r) => r + 1);
    setSignal(null);
    setPhase('playing');
    showToast(won ? 'Победа записана! 🏆' : 'Поражение записано', won ? 'success' : 'error');
  }

  function endSession() {
    setSignal(null);
    setPhase('prepare');
  }

  const blockCount = Math.min(sessionRounds, 6);

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* ── Game Scene (always visible) ── */}
      <GameScene blockCount={blockCount} phase={phase} />

      {/* ── Top Panel ── */}
      {(phase === 'playing' || phase === 'analyzing' || phase === 'result') && (
        <TopPanel wins={sessionWins} losses={sessionLosses} rounds={sessionRounds} />
      )}

      {/* ── Overlays ── */}
      <AnimatePresence>
        {phase === 'locked' && (
          <LockedOverlay
            key="locked"
            onOpen={() => settings?.referralUrl && WebApp.openLink(settings.referralUrl)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'prepare' && (
          <PrepareOverlay
            key="prepare"
            strategy={strategy}
            onStrategyChange={setStrategy}
            onStart={startSession}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'analyzing' && (
          <AnalyzingOverlay key="analyzing" step={analysisStep} progress={analysisProgress} />
        )}
      </AnimatePresence>

      {/* ── Get Signal Button ── */}
      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            key="play-btns"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
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
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            >
              <Zap size={20} fill="#000" /> ПОЛУЧИТЬ СИГНАЛ
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={endSession}
              style={{
                width: '100%', padding: '10px',
                background: 'rgba(0,0,0,0.45)',
                border: `1px solid rgba(255,255,255,0.12)`,
                borderRadius: radius.md,
                color: colors.textMuted, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
              }}
            >
              Завершить сессию
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result Card ── */}
      <AnimatePresence>
        {phase === 'result' && signal && (
          <ResultCard
            key="result"
            signal={signal}
            confidence={confidence}
            onWin={() => recordResult(true)}
            onLoss={() => recordResult(false)}
            onNew={handleGetSignal}
            onEnd={endSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Game Scene ───────────────────────────────────────────────────────────────

function GameScene({ blockCount, phase }: { blockCount: number; phase: Phase }) {
  const isShaking = phase === 'analyzing';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Sky */}
      <img src="/background-back.webp" alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover',
      }} />

      {/* Cloud 1 */}
      <motion.img
        src="/cloud-1.webp" alt=""
        style={{ position: 'absolute', top: '6%', left: '-8%', width: '50%', opacity: 0.9 }}
        animate={{ x: [0, 18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cloud 2 */}
      <motion.img
        src="/cloud-2.webp" alt=""
        style={{ position: 'absolute', top: '14%', right: '-6%', width: '42%', opacity: 0.8 }}
        animate={{ x: [0, -14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Yellow glow (ambient) */}
      <img src="/yellow-glow.webp" alt="" style={{
        position: 'absolute', top: '-8%', left: '50%',
        transform: 'translateX(-50%)',
        width: '70%', opacity: 0.3, mixBlendMode: 'screen',
      }} />

      {/* Kran (crane with block) */}
      <motion.img
        src="/kran.webp" alt=""
        style={{
          position: 'absolute', top: '-1%', left: '50%',
          transform: 'translateX(-50%)',
          width: '52%',
          transformOrigin: '50% 0%',
        }}
        animate={isShaking
          ? { rotate: [-4, 4, -4, 4, 0] }
          : { rotate: [-2, 2, -2] }
        }
        transition={isShaking
          ? { duration: 0.4, repeat: 4 }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Tower base */}
      <img src="/basis-tower.webp" alt="" style={{
        position: 'absolute',
        bottom: '28%',
        left: '50%', transform: 'translateX(-50%)',
        width: '52%',
      }} />

      {/* Stacked blocks */}
      {Array.from({ length: blockCount }).map((_, i) => (
        <motion.img
          key={i}
          src="/block.webp" alt=""
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 18 }}
          style={{
            position: 'absolute',
            bottom: `calc(28% + 14% + ${i * 9}%)`,
            left: '50%', transform: 'translateX(-50%)',
            width: '28%',
          }}
        />
      ))}

      {/* Street foreground */}
      <img src="/background-front.webp" alt="" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        width: '100%', height: '30%',
        objectFit: 'cover', objectPosition: 'center bottom',
      }} />
    </div>
  );
}

// ─── Top Panel ────────────────────────────────────────────────────────────────

function TopPanel({ wins, losses, rounds }: { wins: number; losses: number; rounds: number }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: '12px 16px 20px',
      background: 'linear-gradient(to bottom, rgba(5,11,24,0.85) 60%, transparent)',
      display: 'flex', gap: 8, justifyContent: 'center',
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
      padding: '5px 12px',
      background: 'rgba(5,11,24,0.7)',
      border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: radius.full,
      display: 'flex', alignItems: 'center', gap: 5,
      backdropFilter: 'blur(4px)',
    }}>
      <span style={{ color: colors.textMuted, fontSize: 11 }}>{label}:</span>
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
        position: 'absolute', inset: 0,
        background: 'rgba(5,11,24,0.86)',
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
          Зарегистрируйся на 1win по нашей ссылке и сделай первый депозит — сигналы разблокируются автоматически
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onOpen}
        style={{
          padding: '14px 28px',
          background: gradient.amber,
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

function PrepareOverlay({ strategy, onStrategyChange, onStart }: {
  strategy: Strategy;
  onStrategyChange: (s: Strategy) => void;
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(5,11,24,0.99) 75%, rgba(5,11,24,0.5) 100%)',
        padding: '28px 16px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      <div>
        <div style={{ color: colors.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Выбери стратегию
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {STRATEGIES.map((s) => (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onStrategyChange(s.id)}
              style={{
                flex: 1, padding: '12px 6px',
                background: strategy === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${strategy === s.id ? s.color : colors.border}`,
                borderRadius: radius.lg,
                color: strategy === s.id ? s.color : colors.textMuted,
                cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                boxShadow: strategy === s.id ? `0 0 14px ${s.color}35` : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 13 }}>{s.label}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>{s.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        style={{
          width: '100%', padding: '16px',
          background: gradient.amber,
          border: 'none', borderRadius: radius.lg,
          color: '#000', fontWeight: 800, fontSize: 16,
          cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: glow.amber,
        }}
      >
        <Zap size={18} fill="#000" /> Начать сессию
      </motion.button>
    </motion.div>
  );
}

// ─── Analyzing Overlay ────────────────────────────────────────────────────────

function AnalyzingOverlay({ step, progress }: { step: number; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(5,11,24,0.9)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, gap: 28,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(245,166,35,0.12)',
          border: `2px solid rgba(245,166,35,0.45)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: glow.amber,
        }}
      >
        <Zap size={34} color={colors.amber} fill={colors.amber} />
      </motion.div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ANALYSIS_LINES.map((line, i) => (
          <AnimatePresence key={i}>
            {step > i && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: i === step - 1 ? colors.amber : colors.textMuted,
                  fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: i === step - 1 ? colors.amber : colors.success,
                  boxShadow: `0 0 6px ${i === step - 1 ? colors.amber : colors.success}`,
                }} />
                {line}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      <AnimatePresence>
        {step >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%' }}>
            <div style={{
              height: 6, background: 'rgba(255,255,255,0.08)',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: gradient.amber,
                borderRadius: 3, boxShadow: glow.amberSoft,
                transition: 'width 0.08s linear',
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ signal, confidence, onWin, onLoss, onNew, onEnd }: {
  signal: Signal;
  confidence: number;
  onWin: () => void;
  onLoss: () => void;
  onNew: () => void;
  onEnd: () => void;
}) {
  const floors = signal.dominoes;
  const coef = parseFloat(signal.coefficient);
  const bet = parseFloat(signal.betAmount);
  const profit = bet * (coef - 1);
  const riskColor = { low: colors.success, medium: colors.amber, high: colors.danger }[signal.riskLevel];
  const riskLabel = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[signal.riskLevel];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, #050b18 0%, #0a1628 100%)',
        border: `1px solid rgba(245,166,35,0.2)`,
        borderRadius: '20px 20px 0 0',
        padding: '16px 16px 24px',
        boxShadow: '0 -10px 50px rgba(0,0,0,0.7)',
      }}
    >
      {/* Handle */}
      <div style={{
        width: 40, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.15)',
        margin: '0 auto 14px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ color: colors.amber, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          Сигнал готов
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
          <span style={{
            color: colors.amber, fontSize: 56, fontWeight: 900, lineHeight: 1,
            textShadow: `0 0 24px rgba(245,166,35,0.65)`,
          }}>
            {floors}
          </span>
          <span style={{ color: colors.textMuted, fontSize: 18, fontWeight: 600 }}>этажей</span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <InfoChip label="Коэффициент" value={`×${coef.toFixed(1)}`} valueColor={colors.amber} />
        <InfoChip label="Риск" value={riskLabel} valueColor={riskColor} />
        <InfoChip label="Рек. ставка" value={`${bet.toFixed(0)} ₽`} valueColor={colors.text} />
        <InfoChip label="Ожид. прибыль" value={`+${profit.toFixed(0)} ₽`} valueColor={colors.success} />
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: colors.textMuted, fontSize: 11 }}>Уверенность алгоритма</span>
          <span style={{ color: colors.amber, fontWeight: 700, fontSize: 11 }}>{confidence}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ height: '100%', background: gradient.amber, borderRadius: 3, boxShadow: glow.amberSoft }}
          />
        </div>
      </div>

      {/* Record result */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onWin} style={resultBtn('rgba(0,230,118,0.12)', 'rgba(0,230,118,0.4)', colors.success)}>
          ✓ Победа
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onLoss} style={resultBtn('rgba(255,68,68,0.1)', 'rgba(255,68,68,0.35)', colors.danger)}>
          ✕ Поражение
        </motion.button>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={onNew}
          style={{
            flex: 1, padding: '10px',
            background: 'rgba(245,166,35,0.08)', border: `1px solid rgba(245,166,35,0.3)`,
            borderRadius: radius.md, color: colors.amber,
            fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <RefreshCw size={12} /> Новый сигнал
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={onEnd}
          style={{
            flex: 1, padding: '10px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors.border}`,
            borderRadius: radius.md, color: colors.textMuted,
            fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <RotateCcw size={12} /> Завершить
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

function resultBtn(bg: string, border: string, color: string): React.CSSProperties {
  return {
    flex: 1, padding: '13px',
    background: bg, border: `1px solid ${border}`,
    borderRadius: radius.md, color,
    fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
  };
}
