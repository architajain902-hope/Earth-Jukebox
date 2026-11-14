import React, { useEffect, useState, useRef } from 'react';
import type { AnomalyRecord } from '../data/types';
import { audioEngine } from '../audio/engine';

interface AutoTourProps {
  data: AnomalyRecord[];
  onSetYear: (year: number) => void;
  onOpenExplainer: () => void;
  onClose: () => void;
}

interface TourStep {
  timeMs: number;
  caption: string;
  action: () => void;
}

export default function AutoTour({
  data,
  onSetYear,
  onOpenExplainer,
  onClose,
}: AutoTourProps) {
  const [currentCaption, setCurrentCaption] = useState<string>('Initializing Guided Scientific Tour...');
  const [progress, setProgress] = useState<number>(0);
  const [showFutureTeaser, setShowFutureTeaser] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const totalDuration = 75000; // ~75-80s scripted run
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, (elapsed / totalDuration) * 100));
    }, 200);

    const schedule = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      timerRef.current.push(t);
    };

    // Step 1: Camera fly-in & Welcome
    schedule(1000, () => {
      setCurrentCaption('Welcome to Earth 616: The Earth Information Jukebox. 146 years of real NASA climate measurements.');
      onSetYear(1880);
    });

    // Step 2: 1880 Early Baseline Tone
    schedule(6000, () => {
      setCurrentCaption('Year 1880: Planet Earth at the dawn of meteorological observations. Pitch is low (A3 at 220 Hz), cooling anomaly.');
      onSetYear(1880);
      const rec = data.find((d) => d.year === 1880);
      if (rec) audioEngine.playTone(rec.anomaly, 2.5);
    });

    // Step 3: Scrubbing to 1940
    schedule(15000, () => {
      setCurrentCaption('Scrubbing to 1940: Mid-century warm spell. Listen to the subtle rise in synthesized pitch.');
      onSetYear(1940);
      const rec = data.find((d) => d.year === 1940);
      if (rec) audioEngine.playTone(rec.anomaly, 2.0);
    });

    // Step 4: Rapid time-lapse 1976 to 2025
    schedule(24000, () => {
      setCurrentCaption('Accelerating time-lapse (1976–2025): Notice the dramatic pitch ascent corresponding to rapid warming.');
    });

    const startTimelapseMs = 26000;
    const yearsToPlay = data.filter((d) => d.year >= 1976 && d.year <= 2025);
    const stepDuration = 700; // ms per year

    yearsToPlay.forEach((rec, idx) => {
      schedule(startTimelapseMs + idx * stepDuration, () => {
        onSetYear(rec.year);
        audioEngine.playNote(rec.anomaly, stepDuration * 0.9, undefined, true);
        if (rec.year === 1998) {
          setCurrentCaption('1998: Super El Niño heat anomaly spikes pitch significantly.');
        } else if (rec.year === 2016) {
          setCurrentCaption('2016: Global temperatures breach +1.0 °C anomaly.');
        } else if (rec.year === 2024) {
          setCurrentCaption('2024: Record-breaking anomaly (+1.28 °C), high pitch near 880 Hz.');
        }
      });
    });

    // Step 5: Explainer trigger
    const explainerTime = startTimelapseMs + yearsToPlay.length * stepDuration + 2000;
    schedule(explainerTime, () => {
      setCurrentCaption('Scientific Explainer: Breaking down how anomaly, frequency, and baseline relate.');
      onOpenExplainer();
    });

    // Step 6: Future teaser card
    const teaserTime = explainerTime + 7000;
    schedule(teaserTime, () => {
      setCurrentCaption('Future Datasets: Wind vectors, precipitation anomalies, wildfire soundscapes, and ocean heat.');
      setShowFutureTeaser(true);
    });

    return () => {
      clearInterval(interval);
      timerRef.current.forEach((t) => clearTimeout(t));
    };
  }, [data, onSetYear, onOpenExplainer]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: 720,
        zIndex: 150,
      }}
      role="region"
      aria-label="Auto Tour Subtitles and Progress"
    >
      <div
        className="glass"
        style={{
          padding: '14px 20px',
          border: '1px solid #FC3D21',
          boxShadow: '0 8px 32px rgba(252, 61, 33, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FC3D21', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              ● DEMO AUTO-TOUR ACTIVE
            </span>
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              ({Math.round(progress)}%)
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 4,
              color: '#FFFFFF',
              fontSize: 11,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Exit Tour ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #00D4FF, #FC3D21)', transition: 'width 0.2s ease' }} />
        </div>

        {/* Captions */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.4,
            minHeight: 38,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {currentCaption}
        </div>
      </div>

      {/* Future datasets teaser popup */}
      {showFutureTeaser && (
        <div
          className="glass"
          style={{
            marginTop: 12,
            padding: 18,
            border: '1px solid #00D4FF',
            boxShadow: '0 12px 36px rgba(0, 212, 255, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h4 style={{ margin: 0, color: '#00D4FF', fontSize: 14 }}>
              🚀 Next Stage Teaser: The Multi-Sensory Earth
            </h4>
            <button
              onClick={() => setShowFutureTeaser(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
            Expanding Earth 616 to global wind velocity vector synthesizers, multi-frequency precipitation harmonics,
            wildfire spectral density envelopes, and ocean heat content basslines.
          </p>
        </div>
      )}
    </div>
  );
}
