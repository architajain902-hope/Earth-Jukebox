import React from 'react';

interface EICModalProps {
  onClose: () => void;
}

export default function EICModal({ onClose }: EICModalProps) {
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
      aria-label="NASA Earth Information Center Connection"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 620,
          padding: 26,
          maxHeight: '92vh',
          overflowY: 'auto',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            <div>
              <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
                NASA Earth Information Center (EIC)
              </h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00D4FF' }}>
                Connecting Visual Frames to Real-Time Sound
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Challenge Alignment Card */}
        <div
          style={{
            background: 'rgba(11, 61, 145, 0.35)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Direct Challenge Response
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: '#E0F2FE', lineHeight: 1.5 }}>
            The NASA Space Apps Challenge <em>"The Earth Information Jukebox"</em> asks us to pair NASA Earth Information Center (EIC) visual frames with dynamic real-time sonification, translating sight into sound to enhance accessibility and public understanding.
          </p>
        </div>

        {/* How Earth 616 pairs with EIC frames */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
          <div>
            <h3 style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 4 }}>
              How Earth 616 Translates EIC Visualizations into Sound
            </h3>
            <p>
              At NASA's physical and online Earth Information Center (at NASA HQ in Washington, D.C. and at <strong>earth.gov</strong>), visitors view large-format animated displays of Earth's surface temperature anomalies from the NASA Goddard Institute for Space Studies (GISS).
              <br />
              Earth 616 directly pairs these visual frames with mathematically synthesized frequencies:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>
                <strong>Cool Visual Frames (Blue):</strong> Represent negative anomalies (&lt; 0.0 °C) in EIC displays, producing lower acoustic frequencies (220 Hz to 403 Hz).
              </li>
              <li>
                <strong>Baseline Visual Frames (White/Cyan):</strong> Represent 1951–1980 baseline normal (0.0 °C), producing standard 403.3 Hz pitch.
              </li>
              <li>
                <strong>Warming Visual Frames (Orange/Red):</strong> Represent high positive anomalies (&gt; +1.0 °C), producing ascending frequencies up to 880 Hz.
              </li>
            </ul>
          </div>

          {/* Official EIC Links */}
          <div
            style={{
              background: 'rgba(11, 29, 58, 0.7)',
              borderRadius: 8,
              padding: 14,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
              Official NASA Earth Information Center Portals:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href="https://earth.gov"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(11, 61, 145, 0.4)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <span>🌍 Visit NASA Earth Information Center (earth.gov)</span>
                <span style={{ color: '#00D4FF', fontSize: 11 }}>Open ↗</span>
              </a>

              <a
                href="https://earth.gov/explore"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(11, 29, 58, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  fontSize: 12.5,
                }}
              >
                <span>📊 NASA EIC Interactive Climate & Atmosphere Dashboard</span>
                <span style={{ color: '#00D4FF', fontSize: 11 }}>Open ↗</span>
              </a>

              <a
                href="https://svs.gsfc.nasa.gov/5190/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(11, 29, 58, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  color: '#CBD5E1',
                  textDecoration: 'none',
                  fontSize: 12.5,
                }}
              >
                <span>🎥 NASA SVS GISTEMP Global Temperature Anomaly Visual Frames</span>
                <span style={{ color: '#00D4FF', fontSize: 11 }}>Open ↗</span>
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
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
