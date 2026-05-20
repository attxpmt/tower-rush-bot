import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, radius } from '../theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let counter = 0;

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                background: toastBg(t.type),
                border: `1px solid ${toastBorder(t.type)}`,
                borderRadius: radius.md,
                padding: '10px 16px',
                color: colors.text,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: toastShadow(t.type),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{toastIcon(t.type)}</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function toastBg(type: ToastType) {
  if (type === 'success') return 'rgba(0,20,10,0.97)';
  if (type === 'error')   return 'rgba(20,5,5,0.97)';
  return 'rgba(5,11,24,0.97)';
}

function toastBorder(type: ToastType) {
  if (type === 'success') return 'rgba(0,230,118,0.4)';
  if (type === 'error')   return 'rgba(255,68,68,0.4)';
  return 'rgba(245,166,35,0.4)';
}

function toastShadow(type: ToastType) {
  if (type === 'success') return '0 0 16px rgba(0,230,118,0.2)';
  if (type === 'error')   return '0 0 16px rgba(255,68,68,0.2)';
  return '0 0 16px rgba(245,166,35,0.2)';
}

function toastIcon(type: ToastType) {
  if (type === 'success') return '✓';
  if (type === 'error')   return '✕';
  return 'i';
}
