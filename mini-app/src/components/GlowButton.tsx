import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export default function GlowButton({ children, onClick, disabled, variant = 'primary', fullWidth }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.96 }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      onClick={disabled ? undefined : onClick}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '16px 24px',
        background: disabled
          ? '#333'
          : isPrimary
          ? 'linear-gradient(135deg, #00ff88, #00cc6a)'
          : 'transparent',
        border: isPrimary ? 'none' : '1px solid rgba(0,255,136,0.4)',
        color: disabled ? '#666' : isPrimary ? '#000' : '#00ff88',
        fontWeight: 700,
        fontSize: 16,
        borderRadius: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Exo 2', sans-serif",
        boxShadow: disabled || !isPrimary ? 'none' : '0 0 20px rgba(0,255,136,0.4)',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </motion.button>
  );
}
