import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="About Earth 616 Jukebox"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 600,
          padding: 28,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🌍</span>
            <h2 style={{ fontSize: 20, color: '#FFFFFF', margin: 0 }}>
              Earth 616: The Earth Information Jukebox
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13.5, lineHeight: 1.6, color: '#CBD5E1' }}>
          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Mission Statement & Scientific Honesty
            </h3>
            <p>
              Built for the <strong>NASA International Space Apps Challenge 2026</strong> under the challenge <em>"The Earth Information Jukebox"</em>.
              Our core principle is <strong>strict scientific honesty</strong>: every audible tone and visible hue is synthesized mathematically directly from verified NASA satellite and surface observation records.
              We never fabricate, extrapolate, or randomize climate data.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              NASA Data Source
            </h3>
            <p>
              NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis (<strong>GISTEMP v4</strong>), Land-Ocean Temperature Index (GLB.Ts+dSST.csv), 1880 to 2025.
              <br />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8' }}>
                Baseline: 1951–1980 climatological normal. Citation: Lenssen et al. (2019) J. Geophys. Res. Atmos., 124(12), 6307–6326.
              </span>
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Exact Sonification Formula
            </h3>
            <p>
              Linear frequency mapping with limiter compression:
              <br />
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>
                freq = 220 + ((anomaly - (-0.5)) / (1.3 - (-0.5))) * (880 - 220) Hz
              </code>
              <br />
              −0.50 °C maps to 220.0 Hz (A3), +0.90 °C produces 733.3 Hz, and +1.30 °C maps to 880.0 Hz (A5).
              Tones are shaped with a 60ms attack, smooth exponential decay, and a subtle second harmonic for warmth.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Scientific Scope & Limitations
            </h3>
            <p>
              The data represents <strong>annual global mean surface temperature anomalies</strong>. It measures long-term global energy imbalance, not localized daily weather variations or single extreme weather events.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Team & AI Disclosure
            </h3>
            <p>
              <strong>Team Earth 616</strong>. This web application was built with the assistance of Antigravity AI coding tools. All scientific values, formulas, and data pipelines were verified against official NASA GISS sources.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Open Source License
            </h3>
            <p>
              Licensed under the <strong>MIT License</strong>. 3D Earth textures courtesy of NASA Visible Earth / Three.js examples (Public Domain / MIT).
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              background: '#0B3D91',
              border: '1px solid #00D4FF',
              borderRadius: 6,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
