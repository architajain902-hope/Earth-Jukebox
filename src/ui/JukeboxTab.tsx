import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GistempDataset } from '../data/types';
import { analyzeFrame, type FrameAnalysisResult } from '../vision/frameAnalyzer';
import { frameSonifier } from '../vision/frameSonifier';
import { anomalyToFrequency } from '../audio/sonify';
import SourcesModal from './SourcesModal';

interface FrameManifestItem {
  id: string;
  title: string;
  sourceId: string;
  file: string;
  thumbnail: string;
  sourceTitle: string;
  sourceUrl: string;
  credit: string;
  visualizers: string;
  scientists: string;
  releaseDate: string;
  datasetCredits: string;
  description: string;
  altText: string;
  agency?: string;
  notes?: string;
  category: string;
  defaultScale: string;
}

interface JukeboxTabProps {
  dataset: GistempDataset;
  selectedYear: number;
  onClose?: () => void;
  getCanvasElement?: () => HTMLCanvasElement | null;
}

export default function JukeboxTab({
  dataset,
  selectedYear,
  onClose,
  getCanvasElement,
}: JukeboxTabProps) {
  const [frames, setFrames] = useState<FrameManifestItem[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>('night-lights');
  const [analysis, setAnalysis] = useState<FrameAnalysisResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeColumn, setActiveColumn] = useState<number>(0);
  const [activeFreq, setActiveFreq] = useState<number>(440);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const currentRecord =
    dataset.data.find((d) => d.year === selectedYear) ?? dataset.data[dataset.data.length - 1];
  const currentAnomaly = currentRecord.anomaly;
  const rootHz = anomalyToFrequency(currentAnomaly);

  // Load frames manifest
  useEffect(() => {
    fetch('/frames/frames.json')
      .then((res) => res.json())
      .then((data: FrameManifestItem[]) => {
        setFrames(data);
        if (data.length > 0 && !data.some((f) => f.id === selectedFrameId)) {
          setSelectedFrameId(data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load frames manifest:', err);
      });
  }, []);

  const activeItem = frames.find((f) => f.id === selectedFrameId);

  // Warn in console if frame has unknown source
  useEffect(() => {
    if (activeItem && activeItem.sourceId === 'unknown') {
      console.warn(
        `[Frame Source Warning] Frame "${activeItem.id}" has no verified SVS source (sourceId: "unknown"). Marked as source TODO.`
      );
    }
  }, [activeItem]);

  // Process and analyze active frame
  const processFrame = useCallback(
    (source: HTMLImageElement | HTMLCanvasElement) => {
      try {
        const result = analyzeFrame(source, 96, 48);
        setAnalysis(result);

        // Draw preview onto display canvas
        const canvas = previewCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
          }
        }
      } catch (err) {
        console.error('Frame analysis failed:', err);
      }
    },
    []
  );

  // Trigger analysis when selected frame changes
  useEffect(() => {
    if (selectedFrameId === 'live-globe') {
      const liveCanvas = getCanvasElement?.();
      if (liveCanvas) {
        processFrame(liveCanvas);
      }
      return;
    }

    if (selectedFrameId === 'custom' && customImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => processFrame(img);
      img.src = customImageSrc;
      return;
    }

    const frameItem = frames.find((f) => f.id === selectedFrameId);
    if (!frameItem) return;

    if (frameItem.thumbnail === 'synthetic-stripes') {
      // Generate warming stripes canvas dynamically
      const cvs = document.createElement('canvas');
      cvs.width = 192;
      cvs.height = 96;
      const ctx = cvs.getContext('2d')!;
      const data = dataset.data;
      const stripeW = cvs.width / data.length;

      data.forEach((d, i) => {
        const t = Math.max(0, Math.min(1, (d.anomaly + 0.5) / 1.8));
        const r = Math.round(t * 255);
        const b = Math.round((1 - t) * 255);
        const g = Math.round(Math.sin(t * Math.PI) * 120);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * stripeW, 0, Math.ceil(stripeW), cvs.height);
      });

      processFrame(cvs);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      processFrame(img);
    };
    img.src = frameItem.thumbnail;
  }, [selectedFrameId, frames, customImageSrc, dataset, getCanvasElement, processFrame]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      frameSonifier.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      frameSonifier.stop();
      setIsPlaying(false);
    } else {
      if (!analysis) return;
      setIsPlaying(true);
      frameSonifier.start(analysis, currentAnomaly, (col, freq) => {
        setActiveColumn(col);
        setActiveFreq(freq);
      });
    }
  };

  const handleExportWav = async () => {
    if (!analysis) return;
    setIsExporting(true);
    try {
      const wavBlob = await frameSonifier.exportSoundscapeWav(analysis, currentAnomaly);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NASA-EIC-Soundscape-${selectedFrameId}-${selectedYear}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WAV export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImageSrc(event.target?.result as string);
      setSelectedFrameId('custom');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minHeight: 0,
        width: '100%',
        overflowY: 'auto',
        background: 'rgba(5, 12, 28, 0.95)',
        backdropFilter: 'blur(20px)',
        color: '#FFFFFF',
        padding: '16px 20px',
        boxSizing: 'border-box',
        gap: 14,
      }}
      role="region"
      aria-label="NASA Earth Information Center Frame Sonification Jukebox"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            <h1
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                letterSpacing: 0.5,
              }}
            >
              Earth Information Jukebox: Frame Sonifier
            </h1>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: 11.5, color: '#94A3B8' }}>
            Pairing NASA Earth Information Center (EIC) visual frames with real-time dynamic soundscapes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowSourcesModal(true)}
            style={{
              background: 'rgba(0, 212, 255, 0.15)',
              border: '1px solid #00D4FF',
              borderRadius: 6,
              color: '#00D4FF',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="View verified NASA SVS sources, visualizers, datasets, and credits"
          >
            <span>📜</span>
            <span>Sources & Credits</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                color: '#FFFFFF',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              ✕ Back to 3D Globe
            </button>
          )}
        </div>
      </div>

      {/* Frame Selection Gallery */}
      <div
        className="snap-scroll-x"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 4,
          flexShrink: 0,
          minHeight: 62,
        }}
      >
        {frames.map((item) => {
          const isSelected = item.id === selectedFrameId;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isPlaying) frameSonifier.stop();
                setIsPlaying(false);
                setSelectedFrameId(item.id);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 12px',
                borderRadius: 8,
                background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(11, 29, 58, 0.5)',
                border: isSelected ? '1px solid #00D4FF' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 180,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? '#00D4FF' : '#E0F2FE' }}>
                  {item.title}
                </span>
                {import.meta.env.DEV && item.sourceId === 'unknown' && (
                  <span
                    style={{
                      background: '#DC2626',
                      color: '#FFF',
                      fontSize: 8.5,
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    TODO
                  </span>
                )}
              </div>
              <span style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>
                {item.credit || item.agency}
              </span>
            </button>
          );
        })}

        {/* Upload Custom NASA Frame */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px dashed rgba(0, 212, 255, 0.4)',
            background: 'rgba(0, 212, 255, 0.05)',
            cursor: 'pointer',
            minWidth: 140,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16 }}>📤</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#00D4FF', marginTop: 4 }}>
            Upload Frame
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Main Interactive Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(280px, 1fr)', gap: 18 }}>
        {/* Left Column: Visual Frame with Sweeping Playhead */}
        <div
          className="glass"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>
              Computer Vision Scan & Playhead
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#38BDF8' }}>
              Column {activeColumn + 1} / 96
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '2 / 1',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#040A18',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={384}
              height={192}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            />

            {/* Sweeping Vertical Scanline */}
            {isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${(activeColumn / 96) * 100}%`,
                  width: 2,
                  background: '#00D4FF',
                  boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
                  pointerEvents: 'none',
                  transition: 'left 0.04s linear',
                }}
              />
            )}
          </div>

          {/* SVS Source Citation & Credit Line */}
          {activeItem && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(4, 10, 24, 0.75)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                fontSize: 11,
                lineHeight: 1.5,
                color: '#CBD5E1',
              }}
              role="contentinfo"
              aria-label="Image frame citation"
            >
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>Source:</span>
                <a
                  href={activeItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38BDF8',
                    textDecoration: 'underline',
                    fontWeight: 600,
                  }}
                  title={`Open official NASA page for ${activeItem.sourceTitle || activeItem.title}`}
                >
                  {activeItem.sourceTitle || activeItem.title} ↗
                </a>
                {import.meta.env.DEV && activeItem.sourceId === 'unknown' && (
                  <span
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.5,
                    }}
                    title="Dev Mode Warning: this frame has no verified SVS source entry"
                  >
                    source TODO
                  </span>
                )}
              </div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: '#94A3B8' }}>
                <span><strong>Credit:</strong> {activeItem.credit}. </span>
                {activeItem.visualizers && (
                  <span><strong>Visualizer:</strong> {activeItem.visualizers}.</span>
                )}
              </div>
              {activeItem.notes && (
                <div style={{ marginTop: 4, fontSize: 10, color: '#FCD34D', background: 'rgba(251, 191, 36, 0.08)', padding: '4px 6px', borderRadius: 4 }}>
                  <strong>Notes:</strong> {activeItem.notes}
                </div>
              )}
            </div>
          )}

          {/* Transport Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleTogglePlay}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                background: isPlaying ? 'rgba(252, 61, 33, 0.4)' : 'rgba(0, 212, 255, 0.25)',
                border: isPlaying ? '1px solid #FC3D21' : '1px solid #00D4FF',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span>{isPlaying ? 'Stop Soundscape' : 'Play Frame Soundscape'}</span>
            </button>

            <button
              onClick={handleExportWav}
              disabled={isExporting}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(11, 29, 58, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#E0F2FE',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title="Synthesizes a 24-second high-fidelity WAV soundscape"
            >
              {isExporting ? '⏳ Rendering...' : '💾 Export WAV'}
            </button>
          </div>

          {/* Current Acoustic Output Pill */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(4, 10, 24, 0.5)',
              border: '1px solid rgba(0, 212, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#94A3B8',
            }}
          >
            <span>Live Scan Pitch: <strong style={{ color: '#00D4FF' }}>{Math.round(activeFreq)} Hz</strong></span>
            <span>Scale: <strong style={{ color: '#FBBF24' }}>{analysis?.recommendedScale.toUpperCase() ?? 'DORIAN'}</strong></span>
          </div>
        </div>

        {/* Right Column: Computer Vision Analysis & Educational Split Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Analysis Metrics */}
          <div className="glass" style={{ padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase' }}>
              Extracted Visual Parameters
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'rgba(4, 10, 24, 0.4)', padding: '6px 10px', borderRadius: 6 }}>
                <div style={{ fontSize: 9.5, color: '#64748B' }}>Dominant Hue</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                  {analysis?.dominantHueName ?? 'Ocean Blue'} (~{analysis?.dominantHue ?? 210}°)
                </div>
              </div>

              <div style={{ background: 'rgba(4, 10, 24, 0.4)', padding: '6px 10px', borderRadius: 6 }}>
                <div style={{ fontSize: 9.5, color: '#64748B' }}>Edge Density (Detail)</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24', marginTop: 2 }}>
                  {((analysis?.edgeDensity ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Warm vs Cool Palette Bar */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#64748B', marginBottom: 3 }}>
                <span>Cool Tones (Oceans/Atmosphere): {Math.round((1 - (analysis?.warmCoolRatio ?? 0.5)) * 100)}%</span>
                <span>Warm Tones (Land/Thermal): {Math.round((analysis?.warmCoolRatio ?? 0.5) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: '#0F172A' }}>
                <div style={{ width: `${(1 - (analysis?.warmCoolRatio ?? 0.5)) * 100}%`, background: '#38BDF8' }} />
                <div style={{ width: `${(analysis?.warmCoolRatio ?? 0.5) * 100}%`, background: '#FC3D21' }} />
              </div>
            </div>
          </div>

          {/* The Split Educational Card */}
          <div
            className="glass"
            style={{
              padding: 14,
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              border: '1px solid rgba(0, 212, 255, 0.25)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Scientific Sonification Architecture
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '8px 10px', background: 'rgba(11, 29, 58, 0.6)', borderRadius: 6, borderLeft: '3px solid #38BDF8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E0F2FE' }}>1. What the DATA Decides (Unyielding Ground Truth)</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                  NASA GISTEMP {selectedYear} anomaly ({currentAnomaly >= 0 ? '+' : ''}{currentAnomaly.toFixed(2)} °C) anchors the fundamental tonal root at {Math.round(rootHz)} Hz. Higher temperature = higher pitch, never distorted.
                </div>
              </div>

              <div style={{ padding: '8px 10px', background: 'rgba(11, 29, 58, 0.6)', borderRadius: 6, borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E0F2FE' }}>2. What the FRAME Decides (Harmonic Atmosphere)</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                  Computer vision extracts the dominant hue to select scale mode ({analysis?.recommendedScale.toUpperCase()}), edge density to drive arpeggio tempo, and vertical centroid to pan chimes across stereo space.
                </div>
              </div>
            </div>
          </div>

          {/* Accessible Natural-Language Description for Judges & Screen Readers */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(4, 10, 24, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 10.5,
              lineHeight: 1.5,
              color: '#CBD5E1',
            }}
            role="status"
            aria-live="polite"
          >
            <span style={{ fontWeight: 700, color: '#00D4FF' }}>Accessibility Synthesis: </span>
            {analysis?.accessibleDescription ?? 'Loading frame description...'}
          </div>
        </div>
      </div>

      {/* Sources & Credits Modal */}
      {showSourcesModal && (
        <SourcesModal onClose={() => setShowSourcesModal(false)} />
      )}
    </div>
  );
}
