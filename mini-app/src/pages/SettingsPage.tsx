import React from 'react';

export default function SettingsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050b18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 80,
    }}>
      <div style={{ fontSize: 48 }}>⚙️</div>
      <div style={{ color: '#f5a623', fontSize: 20, fontWeight: 700, marginTop: 12 }}>
        Настройки
      </div>
      <div style={{ color: '#6b7fa3', fontSize: 14, marginTop: 8 }}>
        Phase 7 — в разработке
      </div>
    </div>
  );
}
