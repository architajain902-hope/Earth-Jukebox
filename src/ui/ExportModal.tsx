import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/types';
import { renderTimelapseToWav } from '../audio/exportWav';

interface ExportModalProps {
  data: AnomalyRecord[];
  onClose: () => void;
}

export default function ExportModal({ data, onClose }: ExportModalProps) {
  const [isExportingWav, setIsExportingWav] = useState<boolean>(false);
  const [wavSuccess, setWavSuccess] = useState<boolean>(false);
  const [pngSuccess, setPngSuccess] = useState<boolean>(false);

  // Export time-lapse as WAV using OfflineAudioContext
  const handleExportWav = async () => {
    try {
      setIsExportingWav(true);
      const blob = await renderTimelapseToWav(data, 160);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sonix-earth-jukebox-1880-2025-timelapse.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setWavSuccess(true);
      setTimeout(() => setWavSuccess(false), 3000);
    } catch (err) {
      console.error('WAV export error:', err);
      alert('Failed to generate WAV audio in browser.');
    } finally {
      setIsExportingWav(false);
    }
  };

  // Export Temperature Chart SVG as PNG
  const handleExportPng = () => {
    try {
      const svgEl = document.querySelector('svg[aria-label*="temperature anomaly"]') as SVGSVGElement | null;
      if (!svgEl) {
        alert('Chart element not found on page.');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark background
      ctx.fillStyle = '#0B1D3A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SONIX: The Earth Information Jukebox (1880–2025)', 40, 50);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px monospace';
      ctx.fillText('Data Source: NASA GISS GISTEMP v4 | Baseline: 1951–1980 Global Mean', 40, 80);

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 40, 110, 1120, 540);
        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'sonix-earth-jukebox-temperature-anomaly-chart.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setPngSuccess(true);
        setTimeout(() => setPngSuccess(false), 3000);
      };

      img.src = url;
    } catch (err) {
      console.error('PNG export error:', err);
      alert('Failed to export chart as PNG.');
    }
  };

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
      aria-label="Export Media and Audio"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 540,
          padding: 26,
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>💾</span>
            <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
              Export Sonification & Media
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export modal"
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

        <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 18, lineHeight: 1.5 }}>
          Export synthesized scientific audio and visualizations directly from your browser. Ideal for educational slide decks, classroom lessons, podcasts, and research presentations.
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {/* WAV Export Card */}
          <div
            style={{
              background: 'rgba(11, 29, 58, 0.65)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                🎵 146-Year Time-Lapse Audio (WAV)
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8', marginTop: 2 }}>
                44.1 kHz, 16-bit PCM uncompressed stereo audio (~24s duration)
              </div>
            </div>
            <button
              onClick={handleExportWav}
              disabled={isExportingWav}
              style={{
                padding: '8px 16px',
                background: wavSuccess ? '#22C55E' : 'linear-gradient(135deg, #0B3D91, #00D4FF)',
                border: 'none',
                borderRadius: 6,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 12,
                cursor: isExportingWav ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isExportingWav ? 'Rendering...' : wavSuccess ? 'Downloaded ✓' : 'Download WAV'}
            </button>
          </div>

          {/* PNG Export Card */}
          <div
            style={{
              background: 'rgba(11, 29, 58, 0.65)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                📊 Temperature Anomaly Chart (PNG)
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8', marginTop: 2 }}>
                High-resolution 1200×700 raster image with NASA GISTEMP provenance
              </div>
            </div>
            <button
              onClick={handleExportPng}
              style={{
                padding: '8px 16px',
                background: pngSuccess ? '#22C55E' : 'rgba(11, 61, 145, 0.6)',
                border: '1px solid #00D4FF',
                borderRadius: 6,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {pngSuccess ? 'Saved ✓' : 'Download PNG'}
            </button>
          </div>
        </div>

        {/* Derived Work Notice */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 11,
            color: '#94A3B8',
            lineHeight: 1.4,
          }}
        >
          <em>Attribution Note:</em> All exported audio and charts are derived works synthesized by Team SONIX from authentic NASA GISTEMP v4 records. Permitted for open educational and research reuse under the MIT License.
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: '#FFFFFF',
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
