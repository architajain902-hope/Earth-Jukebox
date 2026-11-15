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
    dataset?.data?.find((d) => d.year === selectedYear) ?? dataset?.data?.[dataset?.data?.length - 1];
  const currentAnomaly = currentRecord?.anomaly ?? 0;
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
  }, [selectedFrameId]);

  const activeItem = frames.find((f) => f.id === selectedFrameId);

  // Process and analyze active frame
  const processFrame = useCallback(
    (source: HTMLImageElement | HTMLCanvasElement) => {
      try {
        const result = analyzeFrame(source, 96, 48);
        setAnalysis(result);

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

    if (customImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageElementRef.current = img;
        processFrame(img);
      };
      img.src = customImageSrc;
      return;
    }

    if (activeItem) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageElementRef.current = img;
        processFrame(img);
      };
      img.onerror = () => {
        console.warn(`Could not load frame asset: ${activeItem.file}`);
      };
      img.src = activeItem.file;
    }
  }, [selectedFrameId, activeItem, customImageSrc, getCanvasElement, processFrame]);

  // Sonification playhead
  const togglePlay = () => {
    if (isPlaying) {
      frameSonifier.stop();
      setIsPlaying(false);
      return;
    }

    if (!analysis) return;

    setIsPlaying(true);
    frameSonifier.start(
      analysis,
      currentAnomaly,
      (colIdx: number, freq: number) => {
        setActiveColumn(colIdx);
        setActiveFreq(freq);
      }
    );
  };

  // Custom frame upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomImageSrc(event.target.result);
        setSelectedFrameId('custom-upload');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg-solid, #050B1A)',
        zIndex: 20,
        overflowY: 'auto',
        padding: '20px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#00D4FF', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              NASA Earth Information Center (EIC) Visual Frames
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, color: 'var(--text-primary, #FFFFFF)', margin: '4px 0 0' }}>
              Computer Vision Frame Sonifier
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowSourcesModal(true)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                color: '#00D4FF',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🏛️ Sources & Credits
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'rgba(11, 29, 58, 0.6)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Back to Earth
              </button>
            )}
          </div>
        </div>

        {/* Filmstrip of NASA SVS Frames */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>
            Select Visual Frame (Filmstrip):
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollbarWidth: 'thin',
            }}
          >
            {frames.map((item) => {
              const isSelected = selectedFrameId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedFrameId(item.id);
                    setCustomImageSrc(null);
                  }}
                  style={{
                    flex: '0 0 200px',
                    padding: 8,
                    borderRadius: 12,
                    border: isSelected ? '2px solid #00D4FF' : '1px solid rgba(255,255,255,0.12)',
                    background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(11, 29, 58, 0.45)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      height: 100,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 8,
                      background: '#040A14',
                    }}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#00D4FF' : '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                    {item.sourceId.toUpperCase()} • {item.category}
                  </div>
                </button>
              );
            })}

            {/* Custom File Upload Card */}
            <label
              style={{
                flex: '0 0 160px',
                padding: 8,
                borderRadius: 12,
                border: '1px dashed rgba(0, 212, 255, 0.35)',
                background: 'rgba(11, 29, 58, 0.25)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 24, marginBottom: 4 }}>📤</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#00D4FF' }}>Upload Frame</span>
              <span style={{ fontSize: 10, color: '#64748B' }}>PNG / JPG</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Main Frame Viewer & Scanline Sonifier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Visual Display with Scanline Playhead */}
          <div
            className="glass"
            style={{
              padding: 16,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 580,
                aspectRatio: '2 / 1',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#040A14',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                width={576}
                height={288}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />

              {/* Vertical Scanline Indicator */}
              {isPlaying && analysis && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${(activeColumn / (analysis.width || 96)) * 100}%`,
                    width: 2,
                    background: '#00D4FF',
                    boxShadow: '0 0 12px #00D4FF, 0 0 24px #38BDF8',
                    pointerEvents: 'none',
                    transition: 'left 0.04s linear',
                  }}
                />
              )}
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 14 }}>
              <button
                onClick={togglePlay}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: isPlaying ? 'linear-gradient(135deg, #FC3D21 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{isPlaying ? '⏹ Stop Sonification' : '▶ Sonify Visual Frame'}</span>
              </button>

              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Frequency: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>
                  {Math.round(activeFreq)} Hz
                </span>
              </div>
            </div>
          </div>

          {/* Computer Vision Metrics & Analysis Breakdown */}
          <div
            className="glass"
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>
                Computer Vision Analysis (96 × 48 Matrix)
              </h3>

              {analysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Dominant Hue:</span>
                    <span style={{ fontWeight: 600, color: '#38BDF8' }}>{analysis.dominantHueName} ({Math.round(analysis.dominantHue)}°)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Warm / Cool Ratio:</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{Math.round(analysis.warmCoolRatio * 100)}% warm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Sobel Edge Gradient:</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{Math.round(analysis.edgeDensity * 100)}% detail density</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Average Brightness:</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{Math.round(analysis.averageBrightness * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Recommended Musical Scale:</span>
                    <span style={{ fontWeight: 700, color: '#00D4FF', textTransform: 'capitalize' }}>{analysis.recommendedScale}</span>
                  </div>

                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Accessible Audio Description
                    </div>
                    <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                      {analysis.accessibleDescription}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: 13 }}>Analyzing frame...</div>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              Scanline sweep sonifies pixel brightness into pitch, edge density into harmonics, and spatial centroid into stereo panning.
            </div>
          </div>
        </div>

        {/* Sticky Verified NASA Credit Line Under Every Frame */}
        {activeItem && (
          <div
            className="glass"
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              background: 'rgba(11, 29, 58, 0.55)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                  {activeItem.sourceTitle}
                </div>
                <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.5 }}>
                  <strong>Credit:</strong> {activeItem.credit} • <strong>Visualizers:</strong> {activeItem.visualizers} • <strong>Scientists:</strong> {activeItem.scientists}
                </div>
                {activeItem.datasetCredits && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    <strong>Dataset:</strong> {activeItem.datasetCredits}
                  </div>
                )}
              </div>

              {activeItem.sourceUrl && (
                <a
                  href={activeItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid rgba(0, 212, 255, 0.35)',
                    color: '#00D4FF',
                    fontSize: 11.5,
                    textDecoration: 'none',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  View on NASA SVS ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {showSourcesModal && <SourcesModal onClose={() => setShowSourcesModal(false)} />}
    </div>
  );
}
