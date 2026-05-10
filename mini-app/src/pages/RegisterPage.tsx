import React from 'react';
import { motion } from 'framer-motion';
import GlowButton from '../components/GlowButton';

interface Props {
  referralUrl: string;
  promoCode: string;
}

export default function RegisterPage({ referralUrl, promoCode }: Props) {
  function copyPromo() {
    navigator.clipboard.writeText(promoCode).catch(() => {});
  }

  return (
    <div style={{ padding: '24px 24px 100px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎰</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Регистрация на 1win
          </h2>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6 }}>
            Зарегистрируйся по нашей ссылке и получи бонус на первый депозит
          </p>
        </div>

        {promoCode && (
          <div style={promoCardStyle} onClick={copyPromo}>
            <p style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Промокод (нажми чтобы скопировать)</p>
            <p style={{ color: '#ff6600', fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>{promoCode}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          <GlowButton
            fullWidth
            onClick={() => { if (referralUrl) window.open(referralUrl, '_blank'); }}
            disabled={!referralUrl}
          >
            Зарегистрироваться на 1win
          </GlowButton>

          <div style={bonusCardStyle}>
            <p style={{ color: '#00ff88', fontWeight: 700, marginBottom: 4 }}>🎁 Бонус за регистрацию</p>
            <p style={{ color: '#aaa', fontSize: 13 }}>
              Используй промокод при регистрации для получения дополнительного бонуса на первый депозит
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const promoCardStyle: React.CSSProperties = {
  background: 'rgba(255,102,0,0.1)',
  border: '1px solid rgba(255,102,0,0.4)',
  borderRadius: 14,
  padding: '16px 20px',
  textAlign: 'center',
  cursor: 'pointer',
  boxShadow: '0 0 20px rgba(255,102,0,0.15)',
};

const bonusCardStyle: React.CSSProperties = {
  background: 'rgba(0,255,136,0.05)',
  border: '1px solid rgba(0,255,136,0.2)',
  borderRadius: 14,
  padding: '16px 20px',
};
