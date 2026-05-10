import React from 'react';
import { motion } from 'framer-motion';
import GlowButton from '../components/GlowButton';

interface Props {
  channelUrl: string;
}

export default function ChannelPage({ channelUrl }: Props) {
  return (
    <div style={{ padding: '60px 24px 100px', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📢</div>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          Наш Telegram-канал
        </h2>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Подпишись на канал, чтобы получать актуальные новости, сигналы и советы по игре Tower Rush.
        </p>
        <GlowButton
          fullWidth
          onClick={() => { if (channelUrl) window.open(channelUrl, '_blank'); }}
          disabled={!channelUrl}
        >
          Перейти в канал
        </GlowButton>
      </motion.div>
    </div>
  );
}
