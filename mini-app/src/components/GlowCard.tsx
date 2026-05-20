import React from 'react';
import { motion } from 'framer-motion';
import { colors, glow, gradient, radius } from '../theme';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Усиленный amber glow при hover */
  glowOnHover?: boolean;
  /** Янтарный градиентный вариант фона */
  variant?: 'default' | 'amber' | 'navy';
  padding?: number | string;
  className?: string;
}

export default function GlowCard({
  children,
  onClick,
  style,
  glowOnHover = true,
  variant = 'default',
  padding = 16,
}: Props) {
  const bg = {
    default: gradient.card,
    amber: gradient.cardAmber,
    navy: gradient.navy,
  }[variant];

  const base: React.CSSProperties = {
    background: bg,
    border: `1px solid rgba(245,166,35,0.2)`,
    borderRadius: radius.lg,
    padding,
    position: 'relative',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  if (onClick) {
    return (
      <motion.div
        style={base}
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        whileHover={glowOnHover ? {
          boxShadow: glow.amber,
          borderColor: 'rgba(245,166,35,0.5)',
        } : undefined}
        transition={{ duration: 0.15 }}
      >
        <ShimmerOverlay />
        {children}
      </motion.div>
    );
  }

  return (
    <div style={base}>
      <ShimmerOverlay />
      {children}
    </div>
  );
}

// Тонкая декоративная полоса блика в углу карточки
function ShimmerOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)',
      pointerEvents: 'none',
    }} />
  );
}
