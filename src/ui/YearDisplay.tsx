import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface YearDisplayProps {
  year: number;
  anomaly: number;
  frequency: number;
  noteName: string;
  isPlaying?: boolean;
  soundMode?: 'scientific' | 'musical';
  onToggleSoundMode?: () => void;
}

export default function YearDisplay({
  year,
  anomaly,
  frequency,
  noteName,
  isPlaying = false,
  soundMode = 'musical',
  onToggleSoundMode,
}: YearDisplayProps) {
  // Anomaly color mapping based on 4-tier climate scale
  const anomalyColor =
    anomaly < -0.15
      ? 'var(--color-cool, #3AA0FF)'
      : anomaly < 0.25
      ? 'var(--color-neutral, #9FE8FF)'
      : anomaly < 0.85
      ? 'var(--color-warm, #FFB020)'
      : 'var(--color-hot, #FF4D2E)';

  const sign = anomaly > 0 ? '+' : '';

  return (
    <div
      className="glass"
      style={{
        padding: '16px 18px',
        minWidth: 240,
        maxWidth: 280,
        pointerEvents: 'auto',
        borderRadius: 14,
        background: 'rgba(7, 18, 38, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid rgba(255, 255, 255, 0.12)`,
        boxShadow: `0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
      role="region"
      aria-label="Now Playing Earth Data Card"
    >
      {/* Top Header: Now Playing badge + Sound Mode Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Animated Equalizer or Vinyl Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 2,
              height: 12,
              width: 14,
            }}
            title={isPlaying ? 'Audio playing' : 'Audio idle'}
          >
            {[0.6, 1.0, 0.4, 0.8].map((h, i) => (
              <span
                key={i}
                style={{
                  width: 2.5,
                  height: isPlaying ? '100%' : `${h * 100}%`,
                  background: anomalyColor,
                  borderRadius: 1,
                  animation: isPlaying ? `eqBar 0.7s ease-in-out infinite alternate ${i * 0.15}s` : 'none',
                  transition: 'height 0.2s ease',
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: '#94A3B8',
            }}
          >
            Now Playing
          </span>
        </div>

        {/* Sound mode toggle pill */}
        {onToggleSoundMode ? (
          <button
            onClick={onToggleSoundMode}
            title={`Current mode: ${soundMode === 'musical' ? 'Harmonic Scale (Musically Pleasing)' : 'Scientific Linear (Exact Pitch)'}. Click to switch.`}
            style={{
              background: soundMode === 'musical' ? 'rgba(0, 212, 255, 0.18)' : 'rgba(255, 176, 32, 0.18)',
              border: `1px solid ${soundMode === 'musical' ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 176, 32, 0.4)'}`,
              color: soundMode === 'musical' ? '#38BDF8' : '#FBBF24',
              borderRadius: 12,
              padding: '2px 7px',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {soundMode === 'musical' ? 'Harmonic' : 'Exact Hz'}
          </button>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#64748B',
              textTransform: 'uppercase',
            }}
          >
            NASA GISTEMP
          </span>
        )}
      </div>

      {/* Main Year Display */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ overflow: 'hidden', height: 44, display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={year}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 40,
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {year}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Musical Note & Pitch Pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'rgba(0, 212, 255, 0.18)',
              border: '1px solid rgba(0, 212, 255, 0.35)',
              borderRadius: 6,
              padding: '2px 7px',
            }}
          >
            {noteName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#38BDF8',
            }}
          >
            {Math.round(frequency)} Hz
          </span>
        </div>
      </div>

      {/* Temperature Anomaly */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 21,
            fontWeight: 800,
            color: anomalyColor,
            textShadow: `0 0 16px ${anomalyColor}40`,
          }}
        >
          {sign}{anomaly.toFixed(2)} °C
        </span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>anomaly vs 1951-80</span>
      </div>

      {/* Baseline reference footer */}
      <div
        style={{
          marginTop: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: '#64748B',
          letterSpacing: 0.5,
        }}
      >
        <span>1880–2025 OBSERVED</span>
        <span>A3 (220Hz) → A5 (880Hz)</span>
      </div>
    </div>
  );
}
