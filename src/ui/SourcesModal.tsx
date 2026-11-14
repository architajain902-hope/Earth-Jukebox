import React, { useEffect, useState } from 'react';

export interface SourceInfo {
  id: string;
  title: string;
  sourceUrl: string;
  credit: string;
  visualizers: string;
  scientists: string;
  releaseDate: string;
  datasetCredits: string;
  description: string;
  notes?: string;
  resourcesUrl?: string;
}

interface SourcesModalProps {
  onClose: () => void;
}

export default function SourcesModal({ onClose }: SourcesModalProps) {
  const [sources, setSources] = useState<Record<string, SourceInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/frames/sources.json')
      .then((res) => res.json())
      .then((data: Record<string, SourceInfo>) => {
        setSources(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load sources.json:', err);
        setLoading(false);
      });
  }, []);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-dialog-title"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 720,
          padding: 24,
          maxHeight: '88vh',
          overflowY: 'auto',
          border: '1px solid rgba(0, 212, 255, 0.4)',
          borderRadius: 12,
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          color: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📜</span>
            <h2 id="sources-dialog-title" style={{ fontSize: 18, color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
              NASA Media Sources, Citations & Credits
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sources dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: 22,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
          All NASA Earth Information Center (EIC) visual frames and Scientific Visualization Studio (SVS) media used in Earth 616 are verified directly from NASA servers. We followed each page's explicit credit request (see the NASA Reproduction Guidelines linked on each SVS page). Exported soundscapes are our own derived work from NASA media and data.
        </p>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>Loading sources...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.values(sources).map((src) => (
              <div
                key={src.id}
                style={{
                  background: 'rgba(11, 29, 58, 0.65)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {/* Title & Link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#00D4FF',
                      textDecoration: 'none',
                    }}
                  >
                    {src.title} ↗
                  </a>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(0, 212, 255, 0.15)',
                      color: '#38BDF8',
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {src.releaseDate}
                  </span>
                </div>

                {/* Credit */}
                <div style={{ fontSize: 11.5, color: '#E2E8F0' }}>
                  <strong style={{ color: '#94A3B8' }}>Credit: </strong>
                  {src.credit}
                </div>

                {/* Visualizers & Scientists */}
                <div style={{ fontSize: 11, color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div>
                    <strong style={{ color: '#94A3B8' }}>Visualizers: </strong>
                    {src.visualizers}
                  </div>
                  <div>
                    <strong style={{ color: '#94A3B8' }}>Scientists: </strong>
                    {src.scientists}
                  </div>
                  <div>
                    <strong style={{ color: '#94A3B8' }}>Datasets: </strong>
                    {src.datasetCredits}
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                  {src.description}
                </div>

                {/* Notes / Color Legend */}
                {src.notes && (
                  <div style={{ fontSize: 10.5, color: '#FCD34D', background: 'rgba(251, 191, 36, 0.08)', padding: '6px 8px', borderRadius: 4 }}>
                    <strong>Visual Encoding: </strong>
                    {src.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            NASA Reproduction Guidelines apply.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#0B3D91',
              border: '1px solid #00D4FF',
              borderRadius: 6,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 12,
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
