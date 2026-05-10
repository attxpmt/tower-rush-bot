import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: 1,
    icon: '📝',
    title: 'Зарегистрируйся на 1win',
    desc: 'Перейди по реферальной ссылке из раздела "1win" и создай аккаунт. Используй промокод для получения бонуса.',
  },
  {
    num: 2,
    icon: '🔑',
    title: 'Подтверди свой ID',
    desc: 'Перейди в раздел "Профиль", найди свой ID в личном кабинете 1win и введи его. Бот проверит регистрацию автоматически.',
  },
  {
    num: 3,
    icon: '💰',
    title: 'Сделай депозит',
    desc: 'Пополни баланс на 1win на любую сумму. После подтверждения транзакции доступ к сигналам разблокируется.',
  },
  {
    num: 4,
    icon: '🎯',
    title: 'Получай сигналы',
    desc: 'Перейди в раздел "Сигналы", выбери стратегию и нажми "Получить сигнал". Используй рекомендации для игры в Tower Rush.',
  },
];

export default function TrainingPage() {
  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 24 }}>📚 Обучение</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            style={stepCardStyle}
          >
            <div style={stepNumStyle}>{step.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{step.icon}</span>
                <span style={{ color: '#00ff88', fontWeight: 700, fontSize: 15 }}>{step.title}</span>
              </div>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const stepCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  background: 'linear-gradient(135deg, #0f0f2a, #1a1a3a)',
  border: '1px solid rgba(0,255,136,0.15)',
  borderRadius: 16,
  padding: 16,
};

const stepNumStyle: React.CSSProperties = {
  width: 36, height: 36, minWidth: 36,
  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
  color: '#000', fontWeight: 800, fontSize: 16,
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
