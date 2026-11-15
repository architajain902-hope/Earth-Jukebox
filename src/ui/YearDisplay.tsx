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
  // 4-tier climate anomaly color
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
        padding: '20px 22px',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 16,
        background: 'var(--surface-glass, rgba(7, 18, 38, 0.85))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--surface-border, rgba(0, 212, 255, 0.25))',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      role="region"
      aria-label="Now Playing Earth Data Card"
    >
      {/* Top Header: Equalizer & Sentence case label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Animated Equalizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 14,
              width: 16,
            }}
            title={isPlaying ? 'Audio active' : 'Audio standby'}
          >
            {[0.5, 1.0, 0.35, 0.85].map((h, i) => (
              <span
                key={i}
                style={{
                  width: 3,
                  height: isPlaying ? '100%' : `${h * 100}%`,
                  background: anomalyColor,
                  borderRadius: 1.5,
                  animation: isPlaying ? `eqBar 0.7s ease-in-out infinite alternate ${i * 0.15}s` : 'none',
                  transition: 'height 0.2s ease',
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary, #FFFFFF)',
              letterSpacing: 0.2,
            }}
          >
            Now playing
          </span>
        </div>

        {/* Sound mode indicator / toggle */}
        {onToggleSoundMode ? (
          <button
            onClick={onToggleSoundMode}
            title="Click to toggle between Exact linear formula and Musical scale mode"
            style={{
              background: soundMode === 'musical' ? 'rgba(0, 212, 255, 0.18)' : 'rgba(255, 176, 32, 0.18)',
              border: `1px solid ${soundMode === 'musical' ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255, 176, 32, 0.4)'}`,
              color: soundMode === 'musical' ? '#38BDF8' : '#FBBF24',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {soundMode === 'musical' ? 'Musical mode' : 'Exact mode'}
          </button>
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary, #CBD5E1)',
            }}
          >
            {soundMode === 'musical' ? 'Musical mode' : 'Exact mode'}
          </span>
        )}
      </div>

      {/* Main Year Display: 72px big as specified in Stage 2 */}
      <div style={{ overflow: 'hidden', minHeight: 76, display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={year}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -32, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 72,
              fontWeight: 800,
              color: 'var(--text-primary, #FFFFFF)',
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {year}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Temperature Anomaly: 32px big, with no-break hyphen to avoid awkward wrap */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'nowrap' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 32,
            fontWeight: 800,
            color: anomalyColor,
            textShadow: `0 0 20px ${anomalyColor}40`,
            lineHeight: 1,
          }}
        >
          {sign}{anomaly.toFixed(2)} °C
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary, #CBD5E1)',
            whiteSpace: 'nowrap',
          }}
        >
          anomaly vs 1951&#8209;1980
        </span>
      </div>

      {/* Synthesized Pitch Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(0, 212, 255, 0.12)',
          border: '1px solid rgba(0, 212, 255, 0.28)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {noteName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              color: '#38BDF8',
            }}
          >
            {Math.round(frequency)} Hz
          </span>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary, #CBD5E1)',
          }}
        >
          {soundMode === 'musical' ? 'Harmonic scale' : 'Scientific linear'}
        </span>
      </div>

      {/* Baseline reference footer */}
      <div
        style={{
          marginTop: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13.5,
          color: 'var(--text-secondary, #CBD5E1)',
        }}
      >
        <span>Observed data, 1880 to 2025</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          220 Hz → 880 Hz
        </span>
      </div>
    </div>
  );
}
