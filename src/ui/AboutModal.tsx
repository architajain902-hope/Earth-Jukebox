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
          maxWidth: 640,
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: 1.6, color: '#CBD5E1' }}>
          {/* How this answers the challenge card */}
          <div
            style={{
              background: 'rgba(11, 61, 145, 0.4)',
              border: '1px solid rgba(0, 212, 255, 0.35)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <h3 style={{ color: '#00D4FF', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 1, margin: 0, marginBottom: 6 }}>
              🎯 How This Answers the Challenge
            </h3>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 12.5, color: '#E0F2FE' }}>
              <strong>Challenge:</strong> The Earth Information Jukebox (NASA Space Apps Challenge 2026).
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#CBD5E1' }}>
              <li>
                <strong>Pairs Visual Frames with Dynamic Sound:</strong> Synchronizes NASA Earth Information Center (EIC) temperature anomaly visual frames with a real-time Web Audio synthesizer.
              </li>
              <li>
                <strong>Translates Sight into Sound:</strong> Converts 146 years of planetary thermal data into exact musical frequencies (220 Hz to 880 Hz), enabling users to hear Earth's warming.
              </li>
              <li>
                <strong>Accessibility First:</strong> Designed from the ground up for blind and low-vision users via full keyboard navigation, `aria-live` screen-reader pipelines, and speech synthesis.
              </li>
              <li>
                <strong>Zero Pre-recorded Media:</strong> 100% synthesized in real time directly from authentic NASA GISTEMP v4 numbers.
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Mission Statement & Scientific Honesty
            </h3>
            <p>
              Our core principle is <strong>strict scientific honesty</strong>: every audible tone and visible hue is synthesized mathematically directly from verified NASA satellite and surface observation records. We never fabricate, extrapolate, or randomize climate data.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              NASA Data Source & Citations
            </h3>
            <p>
              NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis (<strong>GISTEMP v4</strong>), Land-Ocean Temperature Index (`GLB.Ts+dSST.csv`), 1880 to 2025.
              <br />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8' }}>
                Baseline: 1951–1980 climatological normal. Citation: Lenssen et al. (2019) J. Geophys. Res. Atmos., 124(12), 6307–6326.
              </span>
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Exact Deterministic Sonification Formula
            </h3>
            <p>
              Linear frequency mapping with limiter compression:
              <br />
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>
                freq = 220.0 + ((clamp(anomaly, −0.5, +1.3) − (−0.5)) / 1.8) × 660.0 Hz
              </code>
              <br />
              −0.50 °C maps to 220.0 Hz (A3), +0.90 °C produces 733.3 Hz, and +1.30 °C maps to 880.0 Hz (A5).
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Team & AI Assistance Disclosure
            </h3>
            <p>
              <strong>Team Earth 616</strong> (NASA Space Apps Challenge 2026, Bhopal Event). This web application was built with AI coding assistance (Antigravity by Google DeepMind). All scientific values, formulas, and data pipelines were verified against official NASA GISS sources.
            </p>
          </div>

          <div>
            <h3 style={{ color: '#00D4FF', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Open Source License
            </h3>
            <p>
              Licensed under the <strong>MIT License</strong>. 3D Earth textures courtesy of NASA Visible Earth / Three.js examples (Public Domain / MIT).
            </p>
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
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
