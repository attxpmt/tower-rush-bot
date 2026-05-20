import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock } from 'lucide-react';
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

const MAX_SIGNALS = 6;

const STRATEGIES: { id: Strategy; label: string; desc: string; color: string }[] = [
  { id: 'stable',     label: 'Стабильная',  desc: 'Крупная ставка · мало этажей',    color: '#00d4ff' },
  { id: 'moderate',   label: 'Умеренная',   desc: 'Средняя ставка · средне этажей',  color: '#f5a623' },
  { id: 'aggressive', label: 'Агрессивная', desc: 'Малая ставка · много этажей',     color: '#ff4444' },
];

const BET_MULT: Record<Strategy, number> = { stable: 0.5, moderate: 0.35, aggressive: 0.25 };

const ANALYSIS_STEPS = [
  { emoji: '🔍', label: 'Анализирую статистику раундов' },
  { emoji: '📊', label: 'Вычисляю паттерны игры' },
  { emoji: '⚡', label: 'Калибрую коэффициент' },
];

function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export default function SignalsPage({ user, telegramId }: Props) {
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
  const { showToast } = useToast();

  useEffect(() => { fetchSettings().then(setSettings).catch(() => {}); }, []);

  const blockCount = sessionRounds;
  const canGetSignal = blockCount < MAX_SIGNALS;

  async function runAnalysis(): Promise<void> {
    const progs = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      await delay(i === 0 ? 100 : 250);
      const start = Date.now();
      const dur = 750 + i * 150;
      await new Promise<void>((resolve) => {
        const tick = () => {
          const pct = Math.min(100, ((Date.now() - start) / dur) * 100);
          progs[i] = pct;
          setAnalysisProgress([...progs]);
          if (pct < 100) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    }
    await delay(300);
  }

  async function handleGetSignal() {
    if (!canGetSignal) return;
    // 1. Crane hoists up
    setIsHoisting(true);
    await delay(600);
    // 2. Block falls — wait for spring to settle before showing analysis
    setIsBlockFalling(true);
    await delay(1100);
    // 3. Now show analysis panel
    setAnalysisProgress([0, 0, 0]);
    setPhase('analyzing');
    try {
      const [result] = await Promise.all([generateSignal(telegramId, strategy), runAnalysis()]);
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
    <div style={{ position: 'relative', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Game area ── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <GameScene
          phase={phase}
          isHoisting={isHoisting}
          isBlockFalling={isBlockFalling}
        />

        {(phase === 'playing' || phase === 'analyzing' || phase === 'result') && (
          <TopPanel wins={sessionWins} losses={sessionLosses} rounds={sessionRounds} />
        )}

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
      </div>

      {/* ── Button strip — only during playing ── */}
      <AnimatePresence>
        {phase === 'playing' && (
          <motion.div
            key="play-btns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              background: colors.bg,
              padding: '12px 16px 16px',
              display: 'flex', flexDirection: 'column', gap: 8,
              flexShrink: 0, zIndex: 10,
            }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result card — slides up over everything ── */}
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
          width: '65%',
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

      {/* Tower base — stands on road */}
      <img src="/basis-tower.webp" alt="" style={{
        position: 'absolute',
        bottom: '32%',
        left: '50%', transform: 'translateX(-50%)',
        width: '48%',
        zIndex: 3,
      }} />

      {/* dom.webp — falls from top, lands at ~80% tower height */}
      <AnimatePresence>
        {isBlockFalling && (
          <motion.img
            key="falling-dom"
            src="/dom.webp" alt=""
            style={{
              position: 'absolute',
              bottom: '53%',
              left: '50%',
              width: '32%',
              x: '-50%',
              zIndex: 5,
            }}
            initial={{ y: -700 }}
            animate={{ y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
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
      padding: '16px 16px 32px',
      background: 'linear-gradient(to bottom, rgba(5,11,24,0.92) 50%, transparent)',
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
      padding: '7px 14px',
      background: 'rgba(5,11,24,0.8)',
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
        <div style={{ color: colors.amber, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Сумма для риска (₽)</div>
        <input
          type="number"
          value={riskAmount}
          onChange={(e) => onRiskAmountChange(e.target.value)}
          placeholder="Введите сумму..."
          style={{
            width: '100%', padding: '13px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${riskAmount ? 'rgba(245,166,35,0.5)' : colors.border}`,
            borderRadius: radius.md,
            color: colors.text, fontSize: 16, fontWeight: 700,
            fontFamily: "'Exo 2', sans-serif",
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
          Сумма, которую тебе не жалко потерять за сессию
        </div>
      </div>

      {/* Strategy */}
      <div>
        <div style={{ color: colors.amber, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Стиль игры</div>
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
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {[
          '⚡ Нажми "Получить сигнал" — бот укажет сколько этажей строить',
          '🏗 Чем выше башня — тем больше коэффициент и риск',
          '🛑 Фиксируй результат после каждого раунда',
        ].map((rule, i) => (
          <div key={i} style={{ color: colors.textMuted, fontSize: 12, lineHeight: 1.5 }}>{rule}</div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

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
        <Zap size={18} fill="#000" /> Начать играть
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
                <span style={{ fontSize: 16 }}>{item.emoji}</span>
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
  const confLabel = confidence >= 85 ? '🔥 Высокий' : confidence >= 75 ? '⚡ Средний' : '⚠️ Умеренный';
  const confColor = confidence >= 85 ? colors.success : confidence >= 75 ? colors.amber : colors.danger;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(to top, #050b18 0%, #0a1628 100%)',
        border: `1px solid rgba(245,166,35,0.25)`,
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
          <span style={{
            color: colors.amber, fontSize: 80, fontWeight: 900, lineHeight: 1,
            textShadow: `0 0 30px rgba(245,166,35,0.75), 0 0 70px rgba(245,166,35,0.35)`,
          }}>
            {floors}
          </span>
          <span style={{ color: colors.textMuted, fontSize: 22, fontWeight: 600 }}>этажей</span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <InfoChip label="Коэффициент" value={`×${coef.toFixed(1)}`} valueColor={colors.amber} />
        <InfoChip label="Риск" value={riskLabel} valueColor={riskColor} />
        <InfoChip label="Рек. ставка" value={`${bet.toFixed(0)} ₽`} valueColor={colors.text} />
        <InfoChip label="Ожид. прибыль" value={`+${profit.toFixed(0)} ₽`} valueColor={colors.success} />
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
          <span style={{ color: colors.amber, fontWeight: 900, fontSize: 20 }}>{confidence}%</span>
        </div>
        <div style={{ height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{
              height: '100%', background: gradient.amber, borderRadius: 5,
              boxShadow: `0 0 10px rgba(245,166,35,0.5)`,
            }}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: confColor, fontWeight: 700 }}>{confLabel}</span>
        </div>
      </div>

      {/* Record result */}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onWin} style={resultBtn('rgba(0,230,118,0.12)', 'rgba(0,230,118,0.4)', colors.success)}>
          ✓ Победа
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onLoss} style={resultBtn('rgba(255,68,68,0.1)', 'rgba(255,68,68,0.35)', colors.danger)}>
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

function resultBtn(bg: string, border: string, color: string): React.CSSProperties {
  return {
    flex: 1, padding: '14px',
    background: bg, border: `1px solid ${border}`,
    borderRadius: radius.md, color,
    fontWeight: 700, fontSize: 15,
    cursor: 'pointer', fontFamily: "'Exo 2', sans-serif",
  };
}
