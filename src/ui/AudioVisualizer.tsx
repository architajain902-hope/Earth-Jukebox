import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../audio/engine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  noteName?: string;
  frequency?: number;
  soundMode?: 'scientific' | 'musical';
  musicalScale?: string;
}

export default function AudioVisualizer({
  isPlaying,
  noteName = 'G4',
  frequency = 403,
  soundMode = 'scientific',
  musicalScale = 'dorian',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeData = new Uint8Array(512);
    let idlePhase = 0;

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle horizontal center line & audio grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      const hasLiveAudio = audioEngine.analyser && audioEngine.isInitialized && isPlaying;

      if (hasLiveAudio && audioEngine.analyser) {
        if (timeData.length !== audioEngine.analyser.fftSize) {
          timeData = new Uint8Array(audioEngine.analyser.fftSize);
        }
        audioEngine.analyser.getByteTimeDomainData(timeData);

        // Check if there is actual non-flat signal
        let isSilent = true;
        for (let i = 0; i < timeData.length; i += 8) {
          if (Math.abs(timeData[i] - 128) > 2) {
            isSilent = false;
            break;
          }
        }

        if (!isSilent) {
          // Draw real-time dynamic glowing waveform
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = '#00D4FF';
          ctx.shadowColor = 'rgba(0, 212, 255, 0.85)';
          ctx.shadowBlur = 12;
          ctx.beginPath();

          const sliceWidth = width / timeData.length;
          let x = 0;

          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0; // 0 to 2
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
          return;
        }
      }

      // Idle animated undulating harmonic wave (taller & expressive)
      idlePhase += 0.04;
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.shadowColor = 'rgba(0, 212, 255, 0.45)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const numPoints = 80;
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * width;
        const envelope = Math.sin((i / numPoints) * Math.PI); // Smooth edge taper
        const y =
          midY +
          Math.sin(idlePhase + (i / numPoints) * 6.28 * 2.5) * 16 * envelope +
          Math.sin(idlePhase * 0.6 + (i / numPoints) * 6.28 * 1.2) * 8 * envelope;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div
      className="glass"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderRadius: 16,
        background: 'var(--surface-glass, rgba(7, 18, 38, 0.85))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--surface-border, rgba(0, 212, 255, 0.25))',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
        width: '100%',
        boxSizing: 'border-box',
      }}
      role="region"
      aria-label="Live sound wave visualizer"
    >
      {/* Title & Mode Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isPlaying ? '#22C55E' : '#38BDF8',
              boxShadow: isPlaying ? '0 0 10px #22C55E' : '0 0 6px #38BDF8',
            }}
          />
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary, #FFFFFF)',
              margin: 0,
            }}
          >
            Live sound wave
          </h3>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--text-secondary, #CBD5E1)',
          }}
        >
          {soundMode === 'musical' ? `Musical (${musicalScale})` : 'Exact mode'}
        </span>
      </div>

      {/* Large Numbers: Note & Hz display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(0, 212, 255, 0.08)',
          borderRadius: 8,
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 26,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: 0.5,
          }}
        >
          {noteName}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 700,
            color: '#00D4FF',
          }}
        >
          {Math.round(frequency)} Hz
        </span>
      </div>

      {/* Taller Canvas (128px high) as specified in Stage 6 */}
      <div style={{ position: 'relative', width: '100%', height: 128 }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={128}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            borderRadius: 8,
            background: 'rgba(2, 6, 17, 0.75)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
          }}
        />

        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: 'var(--text-secondary, #CBD5E1)',
                background: 'rgba(5, 11, 26, 0.85)',
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Press Play to see the sound
            </span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary, #CBD5E1)', lineHeight: 1.4 }}>
        Real-time audio synthesis from NASA GISTEMP records.
      </div>
    </div>
  );
}
