import React from 'react';

interface FutureEarthModalProps {
  onClose: () => void;
}

export default function FutureEarthModal({ onClose }: FutureEarthModalProps) {
  const FUTURE_DATASETS = [
    {
      title: 'Global Wind Velocity Vectors',
      source: 'NASA MERRA-2 (Modern-Era Retrospective analysis for Research and Applications, Version 2)',
      soundConcept:
        'Dual-channel stereo spatialization: Zonal (east-west) and meridional (north-south) wind velocities drive binaural panning angles, with jet stream turbulence modulating white/pink noise filter resonance.',
      status: 'Planned Future Work (Not Yet Implemented)',
      icon: '💨',
    },
    {
      title: 'Global Precipitation Measurement (GPM)',
      source: 'NASA/JAXA GPM Integrated Multi-satellitE Retrievals for GPM (IMERG)',
      soundConcept:
        'Granular synthesis: Precipitation rainfall rates map to acoustic droplet density and strike velocity; monsoon intensities trigger multi-harmonic tuned chime cascades.',
      status: 'Planned Future Work (Not Yet Implemented)',
      icon: '🌧️',
    },
    {
      title: 'Active Wildfire & Thermal Anomalies',
      source: 'NASA FIRMS (Fire Information for Resource Management System) / MODIS & VIIRS',
      soundConcept:
        'Crackling stochastic noise generators: Fire Radiative Power (FRP) megawatts map to high-frequency spectral density bursts and burning envelope dynamics.',
      status: 'Planned Future Work (Not Yet Implemented)',
      icon: '🔥',
    },
    {
      title: 'Ocean Heat Content (OHC) & Sea Level Anomalies',
      source: 'NASA/JPL Integrated Multi-Mission Ocean Altimeter Topography',
      soundConcept:
        'Deep sub-bass acoustic pressure drone (40 Hz to 110 Hz): Reflects heat absorbed by upper 2,000 meters of oceans, grounding the Earth 616 acoustic orchestration.',
      status: 'Planned Future Work (Not Yet Implemented)',
      icon: '🌊',
    },
  ];

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
      aria-label="Future Earth Datasets Roadmap"
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🚀</span>
            <div>
              <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
                Future Earth: The Multi-Sensory Planet
              </h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F97316' }}>
                Planned Future Datasets & Acoustic Design Roadmap
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

        <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16, lineHeight: 1.5 }}>
          Earth 616 establishes the temperature sonification foundation. Our long-term vision is a full planetary symphony pairing visual frames from the NASA Earth Information Center across four key Earth system dynamics:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FUTURE_DATASETS.map((ds) => (
            <div
              key={ds.title}
              style={{
                background: 'rgba(11, 29, 58, 0.6)',
                border: '1px solid rgba(0, 212, 255, 0.15)',
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{ds.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{ds.title}</span>
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: 'var(--font-mono)',
                    color: '#F97316',
                    background: 'rgba(249, 115, 22, 0.15)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ds.status}
                </span>
              </div>

              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#00D4FF', marginBottom: 6 }}>
                Source: {ds.source}
              </div>

              <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                <strong style={{ color: '#E2E8F0' }}>Sonification Concept: </strong>
                {ds.soundConcept}
              </div>
            </div>
          ))}
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
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
