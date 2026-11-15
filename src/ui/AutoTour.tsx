import React, { useEffect, useState, useRef } from 'react';
import type { AnomalyRecord } from '../data/types';
import { audioEngine } from '../audio/engine';

interface AutoTourProps {
  data: AnomalyRecord[];
  onSetYear: (year: number) => void;
  onOpenExplainer: () => void;
  onClose: () => void;
}

export default function AutoTour({
  data,
  onSetYear,
  onOpenExplainer,
  onClose,
}: AutoTourProps) {
  const [currentCaption, setCurrentCaption] = useState<string>(
    'What if we could not only see, but hear how Earth is changing?'
  );
  const [progress, setProgress] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [showFutureTeaser, setShowFutureTeaser] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const totalDurationMs = 100000; // Exactly 100 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, (elapsed / totalDurationMs) * 100));
      setElapsedSec(Math.min(100, Math.floor(elapsed / 1000)));
    }, 250);

    const schedule = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      timerRef.current.push(t);
    };

    // [0:00 - 0:12] Hook
    schedule(1000, () => {
      setCurrentCaption(
        'Welcome to SONIX: The Earth Information Jukebox. 146 years of real NASA climate measurements.'
      );
      onSetYear(1880);
    });

    schedule(6000, () => {
      setCurrentCaption(
        'Built for the NASA Space Apps Challenge 2026: Pairing Earth Information Center visualizations with dynamic real-time sonification.'
      );
    });

    // [0:12 - 0:30] Scientific Rule & 1880 Baseline
    schedule(12000, () => {
      setCurrentCaption(
        'Scientific Honesty: Higher temperature anomaly produces a strictly higher musical pitch. Zero fake or randomized sound.'
      );
      onSetYear(1880);
      const rec = data.find((d) => d.year === 1880);
      if (rec) audioEngine.playTone(rec.anomaly, 2.5);
    });

    schedule(20000, () => {
      setCurrentCaption(
        'Year 1880: Baseline anomaly is −0.18 °C. The pitch is deep (E4 at 337 Hz) and Earth’s atmosphere glows cool blue.'
      );
    });

    // [0:30 - 0:45] Mid-Century Transition (1940)
    schedule(30000, () => {
      setCurrentCaption(
        'Scrubbing to 1940: Mid-century warm spell (+0.12 °C). Notice the audible rise in synthesized pitch to 447 Hz.'
      );
      onSetYear(1940);
      const rec = data.find((d) => d.year === 1940);
      if (rec) audioEngine.playTone(rec.anomaly, 2.2);
    });

    schedule(38000, () => {
      setCurrentCaption(
        'Notice our real-time oscilloscope visualizer reacting in sync with every synthesized harmonic wave.'
      );
    });

    // [0:45 - 1:10] The Rapid Ascent: 1976–2025 Time-Lapse
    schedule(45000, () => {
      setCurrentCaption(
        'Accelerating Chronological Time-Lapse (1976–2025): Decades pass in seconds as pitch climbs dramatically.'
      );
    });

    const startTimelapseMs = 47000;
    const yearsToPlay = data.filter((d) => d.year >= 1976 && d.year <= 2025);
    const stepDuration = 480; // ms per year

    yearsToPlay.forEach((rec, idx) => {
      schedule(startTimelapseMs + idx * stepDuration, () => {
        onSetYear(rec.year);
        audioEngine.playNote(rec.anomaly, stepDuration * 0.9, undefined, true);

        if (rec.year === 1998) {
          setCurrentCaption('1998: Super El Niño heat anomaly spikes pitch significantly (+0.61 °C, 627 Hz).');
        } else if (rec.year === 2016) {
          setCurrentCaption('2016: Global anomaly breaches +1.0 °C (770 Hz); atmosphere turns intense amber.');
        } else if (rec.year === 2024) {
          setCurrentCaption(
            '2024: All-time record warmth (+1.28 °C, 873 Hz near top of A5 scale). Atmospheric glow blazes fiery red.'
          );
        }
      });
    });

    // [1:10 - 1:30] "What Am I Hearing?" & Accessibility
    const explainerTime = startTimelapseMs + yearsToPlay.length * stepDuration + 1500;
    schedule(explainerTime, () => {
      setCurrentCaption(
        'Curious users can open "What Am I Hearing?" for an instant, offline scientific breakdown of rank, baselines, and bilingual English/Hindi text.'
      );
      onOpenExplainer();
    });

    schedule(explainerTime + 9000, () => {
      setCurrentCaption(
        'Universal Accessibility: Screen-reader aria-live announcements, Web Speech narration, and full keyboard navigation.'
      );
    });

    // [1:30 - 1:45] Validity & Future Roadmap
    schedule(explainerTime + 18000, () => {
      setCurrentCaption(
        'Scientific Rigor: All 146 consecutive years validated from NASA GISTEMP v4 with zero missing data and 13 passing unit tests.'
      );
    });

    schedule(explainerTime + 24000, () => {
      setCurrentCaption(
        'Future Datasets: Planned roadmap expanding to wind vectors (MERRA-2), precipitation (GPM), and wildfire acoustic densities (FIRMS).'
      );
      setShowFutureTeaser(true);
    });

    // [1:45 - 2:00] Closing (Ends at 100s)
    schedule(95000, () => {
      setCurrentCaption(
        'SONIX: The Earth Information Jukebox · Team SONIX · NASA International Space Apps Challenge 2026.'
      );
    });

    schedule(totalDurationMs, () => {
      onClose();
    });

    return () => {
      clearInterval(interval);
      timerRef.current.forEach((t) => clearTimeout(t));
    };
  }, [data, onSetYear, onOpenExplainer, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: 760,
        zIndex: 150,
      }}
      role="region"
      aria-label="Auto Tour Subtitles and Progress"
    >
      <div
        className="glass"
        style={{
          padding: '16px 22px',
          border: '1px solid #FC3D21',
          boxShadow: '0 8px 36px rgba(252, 61, 33, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                color: '#FC3D21',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ animation: 'pulse 1s infinite' }}>●</span>
              <span>100-SECOND GUIDED TOUR</span>
            </span>
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              {elapsedSec}s / 100s ({Math.round(progress)}%)
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Skip guided tour"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              color: '#FFFFFF',
              fontSize: 11,
              padding: '3px 10px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Skip Tour ✕
          </button>
        </div>

        {/* Linear Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00D4FF 0%, #FC3D21 100%)',
              transition: 'width 0.25s linear',
            }}
          />
        </div>

        {/* Captions Display */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.45,
            minHeight: 42,
            display: 'flex',
            alignItems: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
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
            padding: 16,
            border: '1px solid #00D4FF',
            boxShadow: '0 12px 36px rgba(0, 212, 255, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h4 style={{ margin: 0, color: '#00D4FF', fontSize: 13.5 }}>
              🚀 Multi-Sensory Earth Roadmap (Planned)
            </h4>
            <button
              onClick={() => setShowFutureTeaser(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
            Expanding to global wind vectors (MERRA-2 binaural panning), precipitation harmonics (GPM IMERG),
            wildfire spectral density (FIRMS), and ocean heat basslines.
          </p>
        </div>
      )}
    </div>
  );
}
