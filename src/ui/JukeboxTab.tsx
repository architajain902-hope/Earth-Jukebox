import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GistempDataset } from '../data/types';
import { analyzeFrame, type FrameAnalysisResult, SCALE_MOODS } from '../vision/frameAnalyzer';
import { frameSonifier } from '../vision/frameSonifier';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';
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
}: JukeboxTabProps) {
  const [frames, setFrames] = useState<FrameManifestItem[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>('night-lights');
  const [analysis, setAnalysis] = useState<FrameAnalysisResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeColumn, setActiveColumn] = useState<number>(0);
  const [activeFreq, setActiveFreq] = useState<number>(440);
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const currentRecord =
    dataset?.data?.find((d) => d.year === selectedYear) ?? dataset?.data?.[dataset?.data?.length - 1];
  const currentAnomaly = currentRecord?.anomaly ?? 0;
  const rootHz = anomalyToFrequency(currentAnomaly);

  // Load frames manifest
  useEffect(() => {
    fetch('/frames/frames.json')
      .then((res) => res.json())
      .then((data: FrameManifestItem[]) => {
        // Filter out any frames whose source is not verified
        const verified = data.filter((f) => f.sourceId && !f.sourceId.toLowerCase().includes('unverified'));
        setFrames(verified);
        if (verified.length > 0 && !verified.some((f) => f.id === selectedFrameId)) {
          setSelectedFrameId(verified[0].id);
        }
      })
      .catch((err) => console.error('Failed to load frames manifest:', err));
  }, []);

  const activeItem = frames.find((f) => f.id === selectedFrameId) || frames[0];

  // Process frame with computer vision
  const processFrame = useCallback(
    (source: HTMLImageElement | HTMLCanvasElement) => {
      try {
        const res = analyzeFrame(source, 96, 48, activeItem?.description);
        setAnalysis(res);

        // Render to preview canvas at high quality
        const canvas = previewCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
          }
        }
      } catch (err) {
        console.error('Frame analysis failed:', err);
      }
    },
    [activeItem]
  );

  // Load active image
  useEffect(() => {
    if (!activeItem) return;

    if (isPlaying) {
      frameSonifier.stop();
      setIsPlaying(false);
    }

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
  }, [activeItem, processFrame]);

  // Sonification playhead
  const togglePlay = useCallback(() => {
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
  }, [isPlaying, analysis, currentAnomaly]);

  // Keyboard navigation across filmstrip
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (frames.length === 0) return;
    const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % frames.length;
      setSelectedFrameId(frames[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + frames.length) % frames.length;
      setSelectedFrameId(frames[prevIndex].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      togglePlay();
    }
  };

  const scrollFilmstrip = (direction: 'left' | 'right') => {
    if (filmstripRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      filmstripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const currentMood = analysis?.recommendedScale ? SCALE_MOODS[analysis.recommendedScale] : null;
  const noteName = frequencyToNoteName(activeFreq);

  return (
    <div
      role="region"
      aria-label="NASA Visual Frames & Computer Vision Sonifier"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg-solid, #050B1A)',
        zIndex: 20,
        overflowY: 'auto',
        paddingTop: 'calc(var(--header-height, 68px) + 24px)',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        scrollPaddingTop: 'calc(var(--header-height, 68px) + 24px)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top Header */}
        <div
          className="scroll-reveal"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: '#00D4FF',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              NASA Earth Information Center Visual Frames
            </div>
            <h1
              style={{
                fontSize: 'clamp(24px, 4vw, 32px)',
                fontWeight: 800,
                color: 'var(--text-primary, #FFFFFF)',
                margin: '6px 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              Computer Vision Frame Sonifier
            </h1>
            <p
              style={{
                fontSize: 16,
                color: 'var(--text-secondary, #CBD5E1)',
                margin: '8px 0 0',
                lineHeight: 1.5,
              }}
            >
              Pick a NASA frame. SONIX measures its colours and brightness and turns them into music.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowSourcesModal(true)}
              aria-label="Open NASA Sources and Credits modal"
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                color: '#00D4FF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              🏛️ Sources & Credits
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Back to 3D Earth Globe view"
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'rgba(11, 29, 58, 0.6)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                ← Back to Earth
              </button>
            )}
          </div>
        </div>

        {/* Filmstrip of Verified NASA SVS Frames */}
        <div className="scroll-reveal-delay-1" style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-secondary, #CBD5E1)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              NASA Visualization Filmstrip ({frames.length} verified frames):
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => scrollFilmstrip('left')}
                aria-label="Scroll filmstrip left"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(11, 29, 58, 0.6)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ◀
              </button>
              <button
                onClick={() => scrollFilmstrip('right')}
                aria-label="Scroll filmstrip right"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(11, 29, 58, 0.6)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ▶
              </button>
            </div>
          </div>

          <div
            ref={filmstripRef}
            className="filmstrip-scroll"
            tabIndex={0}
            aria-label="Filmstrip selection (use arrow keys to browse, Enter to sonify)"
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 12,
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'thin',
            }}
          >
            {frames.map((item) => {
              const isSelected = selectedFrameId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedFrameId(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`${item.title} (${item.sourceId})`}
                  className={isSelected ? '' : 'neon-border-interactive'}
                  style={{
                    flex: '0 0 260px',
                    scrollSnapAlign: 'start',
                    padding: 10,
                    borderRadius: 12,
                    border: isSelected ? '2px solid #00D4FF' : '1px solid rgba(0, 212, 255, 0.22)',
                    background: isSelected ? 'rgba(0, 212, 255, 0.2)' : 'rgba(11, 29, 58, 0.55)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected
                      ? '0 0 24px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(0, 212, 255, 0.2)'
                      : '0 4px 14px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div
                    style={{
                      height: 130,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 10,
                      background: '#040A14',
                    }}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.altText || item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isSelected ? '#00D4FF' : '#FFFFFF',
                      lineHeight: 1.3,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(0, 212, 255, 0.15)',
                        color: '#00D4FF',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {item.sourceId.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 13, color: '#94A3B8' }}>{item.category}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Frame Viewer & Metrics (At least 60% viewer on desktop) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(340px, 1fr)',
            gap: 24,
            marginBottom: 24,
          }}
          className="nasa-frames-main-grid scroll-reveal-delay-2"
        >
          {/* Visual Display with Scanline Playhead (16:9 Aspect Ratio) */}
          <div
            className="glass neon-border"
            style={{
              padding: 20,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#040A14',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                width={800}
                height={450}
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
                    width: 3,
                    background: '#00D4FF',
                    boxShadow: '0 0 12px #00D4FF, 0 0 24px #38BDF8',
                    pointerEvents: 'none',
                    transition: 'left 0.04s linear',
                    zIndex: 5,
                  }}
                />
              )}
            </div>

            {/* Playback Controls & Live Note display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 16,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Stop sonification' : 'Play this frame'}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  background: isPlaying
                    ? 'linear-gradient(135deg, #FC3D21 0%, #B91C1C 100%)'
                    : 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 44,
                }}
              >
                <span>{isPlaying ? '⏹ Stop' : '▶ Play this frame'}</span>
              </button>

              <div
                style={{
                  textAlign: 'right',
                  fontSize: 15,
                  color: 'var(--text-secondary, #CBD5E1)',
                }}
              >
                <span>Now playing note: </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: '#00D4FF',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                  }}
                >
                  {noteName} {Math.round(activeFreq)} Hz
                </span>
              </div>
            </div>
          </div>

          {/* Computer Vision Metrics & Analysis Breakdown */}
          <div
            className="glass neon-border"
            style={{
              padding: 20,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text-primary, #FFFFFF)',
                  margin: '0 0 16px',
                }}
              >
                Frame Measurements
              </h2>

              {analysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary, #CBD5E1)' }}>Main colour</span>
                    <span style={{ fontWeight: 600, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                      {analysis.dominantHueName} ({Math.round(analysis.dominantHue)}°)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary, #CBD5E1)' }}>Warm vs cool</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(analysis.warmCoolRatio * 100)}% warm, {100 - Math.round(analysis.warmCoolRatio * 100)}% cool
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary, #CBD5E1)' }}>Brightness</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(analysis.averageBrightness * 100)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary, #CBD5E1)' }}>Detail level</span>
                    <span style={{ fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      {(analysis.edgeDensity * 100).toFixed(1)}% edge density
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                    title={currentMood?.tooltip}
                  >
                    <span style={{ color: 'var(--text-secondary, #CBD5E1)' }}>Music mood</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#00D4FF',
                      }}
                    >
                      {currentMood?.label || analysis.recommendedScale}
                    </span>
                  </div>
                  {currentMood && (
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: -4 }}>
                      💡 {currentMood.tooltip}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      Accessible Audio Description
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.5 }}>
                      {analysis.accessibleDescription}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: 15 }}>Analyzing frame pixels...</div>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: 13, color: '#64748B' }}>
              Pixel columns sweep from left to right: brightness sets pitch, edge density sets harmonics, and spatial height sets stereo panning.
            </div>
          </div>
        </div>

        {/* Compact Verified NASA Credit Line Under Every Frame (14px min text) */}
        {activeItem && (
          <div
            className="glass neon-border scroll-reveal-delay-3"
            style={{
              padding: '18px 24px',
              borderRadius: 12,
              background: 'rgba(11, 29, 58, 0.65)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <a
                  href={activeItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#38BDF8',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginBottom: 6,
                  }}
                >
                  {activeItem.sourceTitle} ↗
                </a>

                {/* Line 1: Credit, Visualizer, Released, Dataset */}
                <div style={{ fontSize: 14, color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.6 }}>
                  <strong>Credit:</strong> {activeItem.credit} • <strong>Visualizer:</strong> {activeItem.visualizers} • <strong>Released:</strong> {activeItem.releaseDate} • <strong>Dataset:</strong> {activeItem.datasetCredits}
                </div>

                {/* Line 2: Independent project disclaimer */}
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
                  Independent student project using NASA data and imagery. Not endorsed by NASA.
                </div>
              </div>

              {activeItem.sourceUrl && (
                <a
                  href={activeItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid rgba(0, 212, 255, 0.35)',
                    color: '#00D4FF',
                    fontSize: 14,
                    textDecoration: 'none',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
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
