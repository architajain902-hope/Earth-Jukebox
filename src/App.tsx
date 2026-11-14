import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadGistempData } from './data/loadData';
import type { GistempDataset } from './data/types';
import { audioEngine } from './audio/engine';
import MainExperience from './ui/MainExperience';

type ScreenState = 'loading' | 'start' | 'experience' | 'error';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('loading');
  const [dataset, setDataset] = useState<GistempDataset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGistempData()
      .then((data) => {
        setDataset(data);
        setScreen('start');
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Unknown data initialization error');
        setScreen('error');
      });
  }, []);

  const handleStartExperience = useCallback(() => {
    // AudioContext must be initialized on explicit user gesture
    audioEngine.init();
    setScreen('experience');
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={fullscreenCenter}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 54,
                  marginBottom: 16,
                  display: 'inline-block',
                  animation: 'pulse 1.8s infinite ease-in-out',
                }}
              >
                🌍
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                Earth 616
              </h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00D4FF' }}>
                Verifying NASA GISTEMP v4 Dataset...
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={fullscreenCenter}
          >
            <div
              className="glass"
              style={{
                maxWidth: 460,
                padding: 32,
                textAlign: 'center',
                border: '1px solid #FC3D21',
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ color: '#FC3D21', fontSize: 18, marginBottom: 8 }}>
                Initialization Error
              </h3>
              <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                {errorMessage}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 20px',
                  background: '#0B3D91',
                  border: '1px solid #00D4FF',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {screen === 'start' && dataset && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            style={fullscreenCenter}
          >
            <StartOverlay dataset={dataset} onStart={handleStartExperience} />
          </motion.div>
        )}

        {screen === 'experience' && dataset && (
          <motion.div
            key="experience"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%' }}
          >
            <MainExperience dataset={dataset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StartOverlay({
  dataset,
  onStart,
}: {
  dataset: GistempDataset;
  onStart: () => void;
}) {
  const latest = dataset.data[dataset.data.length - 1];

  return (
    <div
      style={{
        maxWidth: 620,
        textAlign: 'center',
        padding: '36px 28px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Background Star gradient */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 40%, #0B2A56 0%, #0B1D3A 60%, #040A14 100%)',
          zIndex: -1,
        }}
      />

      <div style={{ fontSize: 72, marginBottom: 16 }}>🌍</div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          color: '#00D4FF',
          fontSize: 12,
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        NASA Space Apps Challenge 2026
      </div>

      <h1
        style={{
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1.1,
          marginBottom: 10,
          color: '#FFFFFF',
        }}
      >
        Earth 616
      </h1>

      <h2
        style={{
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          fontWeight: 500,
          color: '#94A3B8',
          marginBottom: 20,
        }}
      >
        The Earth Information Jukebox
      </h2>

      <p
        style={{
          fontSize: 15,
          color: '#CBD5E1',
          lineHeight: 1.6,
          maxWidth: 520,
          margin: '0 auto 28px',
        }}
      >
        Hear and see 146 years of NASA surface temperature records (1880–2025).
        Every musical pitch is mathematically generated from real temperature anomaly measurements.
        <strong> Higher temperature = Higher pitch.</strong>
      </p>

      {/* Dataset Verification Tag */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'rgba(11, 29, 58, 0.7)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: '#94A3B8',
          marginBottom: 32,
        }}
      >
        <span>📊 {dataset.data.length} Years Verified</span>
        <span>·</span>
        <span>Baseline: {dataset.baseline}</span>
        <span>·</span>
        <span style={{ color: latest?.anomaly && latest.anomaly > 0 ? '#FC3D21' : '#38BDF8' }}>
          Latest ({latest?.year}): {latest?.anomaly && latest.anomaly > 0 ? '+' : ''}{latest?.anomaly.toFixed(2)} °C
        </span>
      </div>

      <div>
        <button
          onClick={onStart}
          style={{
            padding: '16px 44px',
            fontSize: 17,
            fontWeight: 700,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #0B3D91 0%, #FC3D21 100%)',
            border: 'none',
            borderRadius: 50,
            cursor: 'pointer',
            boxShadow: '0 0 32px rgba(252, 61, 33, 0.45)',
            letterSpacing: 0.5,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        >
          🎵 Start Experience
        </button>
      </div>
    </div>
  );
}

const fullscreenCenter: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  background: '#040A14',
  zIndex: 50,
};
