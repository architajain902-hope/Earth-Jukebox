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

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (audioEngine.analyser && audioEngine.isInitialized) {
        if (timeData.length !== audioEngine.analyser.fftSize) {
          timeData = new Uint8Array(audioEngine.analyser.fftSize);
        }
        audioEngine.analyser.getByteTimeDomainData(timeData);

        // Draw oscilloscope wave
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00D4FF';
        ctx.shadowColor = '#00D4FF';
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

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle flat line
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
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
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      role="region"
      aria-label="Real-time Audio Oscilloscope Visualizer"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Live Synthesizer Waveform
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#00D4FF' }}>
          {isPlaying ? 'ACTIVE' : 'READY'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={280}
        height={42}
        style={{
          width: '100%',
          height: 42,
          borderRadius: 4,
          background: 'rgba(4, 10, 20, 0.6)',
        }}
      />
    </div>
  );
}
