import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../audio/engine';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

export default function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
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

      // Subtle background grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
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
          // Draw real-time oscilloscope wave
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = '#00D4FF';
          ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
          ctx.shadowBlur = 8;
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

      // Idle breathing wave (ambient undulating sine wave)
      idlePhase += 0.04;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * width;
        // Dual sine wave breathing effect
        const envelope = Math.sin((i / numPoints) * Math.PI); // Taper at edges
        const y =
          midY +
          Math.sin(idlePhase + (i / numPoints) * 6.28 * 2) * 6 * envelope +
          Math.sin(idlePhase * 0.5 + (i / numPoints) * 6.28) * 3 * envelope;

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
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderRadius: 10,
        position: 'relative',
      }}
      role="region"
      aria-label="Real-time Audio Oscilloscope Visualizer"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isPlaying ? '#22C55E' : '#64748B',
              boxShadow: isPlaying ? '0 0 8px #22C55E' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Oscilloscope {isPlaying ? '(Live Signal)' : '(Standby)'}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#64748B',
          }}
        >
          Web Audio Synth
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 48 }}>
        <canvas
          ref={canvasRef}
          width={320}
          height={48}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            borderRadius: 6,
            background: 'rgba(4, 10, 24, 0.45)',
          }}
        />

        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                color: 'rgba(148, 163, 184, 0.75)',
                background: 'rgba(7, 18, 38, 0.65)',
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: 0.5,
              }}
            >
              Press ▶ Play or select a year to hear Earth
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
