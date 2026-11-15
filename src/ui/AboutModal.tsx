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
        background: 'rgba(2, 6, 17, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="About SONIX: The Earth Information Jukebox"
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 620,
          padding: 28,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/branding/sonix-logo.png"
              alt="SONIX logo"
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                border: '1px solid rgba(0, 212, 255, 0.4)',
                objectFit: 'cover',
              }}
            />
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                SONIX: The Earth Information Jukebox
              </h2>
              <div style={{ fontSize: 11, color: '#00D4FF', fontFamily: 'var(--font-mono)' }}>
                Team SONIX • NASA International Space Apps Challenge 2026
              </div>
              <div style={{ fontSize: 9.5, color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                Logo: AI-generated
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
              fontSize: 22,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Mandatory Independent Project Disclaimer */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            color: '#38BDF8',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Independent student project using NASA data and imagery. Not endorsed by NASA.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: 1.6, color: '#CBD5E1' }}>
          {/* Mission alignment */}
          <div
            style={{
              background: 'rgba(11, 61, 145, 0.35)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h3 style={{ color: '#00D4FF', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 1, margin: 0, marginBottom: 8 }}>
              🎯 How SONIX Answers the Challenge
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#E0F2FE' }}>
              <li>
                <strong>Pairs Visuals with Dynamic Sonification:</strong> Connects NASA Earth Information Center (EIC) visual frames with real-time Web Audio API synthesis.
              </li>
              <li>
                <strong>Translates Sight into Sound:</strong> Maps 146 years (1880–2025) of empirical NASA GISTEMP v4 anomaly records to deterministic audio frequencies (220 to 880 Hz).
              </li>
              <li>
                <strong>Strict Scientific Honesty:</strong> 100% mathematically generated in real time in the user's browser—zero pre-recorded audio, zero randomized notes.
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: 14, margin: '0 0 6px 0' }}>Data Sources & Provenance</h4>
            <p style={{ margin: 0 }}>
              Surface Temperature Analysis (GISTEMP v4) is curated by the NASA Goddard Institute for Space Studies (GISS).
              Satellite textures and visual frames originate from NASA Earth Observatory (Blue Marble) and NASA Scientific Visualization Studio (SVS #5313, #3912, #5425).
            </p>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: 14, margin: '0 0 6px 0' }}>Universal Accessibility (WCAG 2.1 AA)</h4>
            <p style={{ margin: 0 }}>
              Designed for visual and auditory inclusivity with native keyboard navigation, ARIA live region announcements, Web Speech API speech synthesis, high-contrast palette toggle, and reduced motion modes.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: 8,
              background: '#0B3D91',
              border: '1px solid #00D4FF',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
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
