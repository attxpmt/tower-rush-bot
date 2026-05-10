import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onButton: () => void;
  onClose?: () => void;
}

export default function Popup({ visible, title, message, buttonText, onButton, onClose }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={overlayStyle}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
            <h3 style={{ color: '#00ff88', marginBottom: 10, fontSize: 18 }}>{title}</h3>
            <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              {message}
            </p>
            <button style={btnStyle} onClick={onButton}>
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: 24,
};

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f0f2a, #1a1a3a)',
  border: '1px solid rgba(0,255,136,0.3)',
  borderRadius: 20,
  padding: 28,
  textAlign: 'center',
  maxWidth: 340,
  width: '100%',
  boxShadow: '0 0 40px rgba(0,255,136,0.15)',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
  color: '#000',
  fontWeight: 700,
  fontSize: 16,
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  fontFamily: "'Exo 2', sans-serif",
};
