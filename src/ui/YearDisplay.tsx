import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface YearDisplayProps {
  year: number;
  anomaly: number;
  frequency: number;
  noteName: string;
}

export default function YearDisplay({
  year,
  anomaly,
  frequency,
  noteName,
}: YearDisplayProps) {
  // Anomaly color scale:
  // negative -> crisp cyan-blue (#38BDF8)
  // ~zero -> cool neutral white-cyan (#E0F2FE)
  // positive low -> warm amber (#FBBF24)
  // positive high -> burning red-orange (#EF4444 / #FC3D21)
  const anomalyColor =
    anomaly < -0.15
      ? '#38BDF8'
      : anomaly < 0.15
      ? '#BAE6FD'
      : anomaly < 0.7
      ? '#F59E0B'
      : '#FC3D21';

  const sign = anomaly > 0 ? '+' : '';

  return (
    <div
      className="glass"
      style={{
        padding: '16px 20px',
        minWidth: 220,
        pointerEvents: 'auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      role="region"
      aria-label="Current Year and Temperature Information"
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        {/* Animated Year Number */}
        <div style={{ overflow: 'hidden', height: 48, display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={year}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -28, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 44,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {year}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Note tag */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(0, 212, 255, 0.15)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            color: '#00D4FF',
          }}
        >
          {noteName}
        </div>
      </div>

      {/* Temperature Anomaly */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 700,
            color: anomalyColor,
            textShadow: `0 0 16px ${anomalyColor}40`,
          }}
        >
          {sign}{anomaly.toFixed(2)} °C
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>anomaly</span>
      </div>

      {/* Audio Frequency in Hz */}
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>🎵</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 600,
            color: '#38BDF8',
          }}
        >
          {Math.round(frequency)} Hz
        </span>
        <span style={{ fontSize: 11, color: '#64748B' }}>pitch</span>
      </div>

      {/* Baseline reference subtitle */}
      <div
        style={{
          marginTop: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 9.5,
          color: '#64748B',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Relative to 1951–1980 Baseline
      </div>
    </div>
  );
}
