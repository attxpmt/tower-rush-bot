import React from 'react';
import { radius } from '../theme';

interface Props {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export default function Shimmer({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: Props) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #0a1628 25%, #1a2d5a 50%, #0a1628 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

// Готовые скелетон-блоки
export function ShimmerText({ lines = 1, style }: { lines?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} height={14} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function ShimmerCard({ height = 80, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <Shimmer
      height={height}
      borderRadius={radius.lg}
      style={{
        border: '1px solid #1a2d5a',
        ...style,
      }}
    />
  );
}
