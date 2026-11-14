import React, { useRef } from 'react';
import type { AnomalyRecord } from '../data/types';

interface TimelineSliderProps {
  years: number[];
  selectedYear: number;
  data: AnomalyRecord[];
  onChange: (year: number) => void;
}

// True Ed Hawkins-style warming stripes color palette
function getStripeColor(anomaly: number): string {
  // Normalize anomaly from -0.5 to +1.3
  const t = Math.max(0, Math.min(1, (anomaly + 0.5) / 1.8));

  if (t < 0.25) {
    // Deep navy/indigo to medium ocean blue
    const s = t / 0.25;
    const r = Math.round(8 + s * 16);
    const g = Math.round(48 + s * 70);
    const b = Math.round(135 + s * 75);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t < 0.45) {
    // Medium blue to pale cyan/light blue
    const s = (t - 0.25) / 0.2;
    const r = Math.round(24 + s * 140);
    const g = Math.round(118 + s * 80);
    const b = Math.round(210 + s * 30);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t < 0.55) {
    // Pale neutral / near zero
    const s = (t - 0.45) / 0.1;
    const r = Math.round(164 + s * 80);
    const g = Math.round(198 + s * 45);
    const b = Math.round(240 - s * 30);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t < 0.75) {
    // Light peach/amber to orange
    const s = (t - 0.55) / 0.2;
    const r = Math.round(244 + s * 11);
    const g = Math.round(243 - s * 110);
    const b = Math.round(210 - s * 150);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Warm orange to deep crimson/burgundy
    const s = (t - 0.75) / 0.25;
    const r = Math.round(255 - s * 40);
    const g = Math.round(133 - s * 110);
    const b = Math.round(60 - s * 40);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export default function TimelineSlider({
  years,
  selectedYear,
  data,
  onChange,
}: TimelineSliderProps) {
  const minYear = years[0] ?? 1880;
  const maxYear = years[years.length - 1] ?? 2025;
  const stripRef = useRef<HTMLDivElement>(null);

  const handleStripClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetYear = Math.round(minYear + ratio * (maxYear - minYear));
    onChange(targetYear);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Home':
        e.preventDefault();
        onChange(minYear);
        break;
      case 'End':
        e.preventDefault();
        onChange(maxYear);
        break;
      case 'PageUp':
        e.preventDefault();
        onChange(Math.min(maxYear, selectedYear + 10));
        break;
      case 'PageDown':
        e.preventDefault();
        onChange(Math.max(minYear, selectedYear - 10));
        break;
    }
  };

  return (
    <div
      className="glass"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      role="region"
      aria-label="Timeline and Warming Stripes Scrubber"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Timeline
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            color: '#38BDF8',
          }}
        >
          {selectedYear}
        </span>
      </div>

      {/* Main Range Slider */}
      <input
        type="range"
        min={minYear}
        max={maxYear}
        step={1}
        value={selectedYear}
        onChange={(e) => onChange(Number(e.target.value))}
        onKeyDown={handleKeyDown}
        aria-label="Year slider from 1880 to 2025"
        aria-valuemin={minYear}
        aria-valuemax={maxYear}
        aria-valuenow={selectedYear}
        style={{
          width: '100%',
          accentColor: '#FC3D21',
          cursor: 'pointer',
          height: 6,
        }}
      />

      {/* Warming Stripes Visual Scrubber */}
      <div
        ref={stripRef}
        onClick={handleStripClick}
        title="Warming stripes scrubber. Click anywhere to jump to that year."
        style={{
          display: 'flex',
          height: 26,
          borderRadius: 6,
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}
        role="slider"
        aria-label="Warming stripes scrubber"
        aria-valuemin={minYear}
        aria-valuemax={maxYear}
        aria-valuenow={selectedYear}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onChange(Math.min(maxYear, selectedYear + 1));
          if (e.key === 'ArrowLeft') onChange(Math.max(minYear, selectedYear - 1));
        }}
      >
        {data.map((rec) => {
          const isSelected = rec.year === selectedYear;
          return (
            <div
              key={rec.year}
              style={{
                flex: 1,
                backgroundColor: getStripeColor(rec.anomaly),
                opacity: isSelected ? 1 : 0.88,
                position: 'relative',
                transition: 'opacity 0.15s ease',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.9)',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Slider endpoints */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#64748B',
        }}
      >
        <span>{minYear}</span>
        <span>1951 (Baseline Start)</span>
        <span>{maxYear}</span>
      </div>

      {/* Sonification Mapping Rule in UI */}
      <div
        style={{
          marginTop: 2,
          padding: '6px 8px',
          background: 'rgba(11, 29, 58, 0.5)',
          borderRadius: 6,
          border: '1px solid rgba(0, 212, 255, 0.1)',
          fontFamily: 'var(--font-mono)',
          fontSize: 9.5,
          color: '#94A3B8',
          lineHeight: 1.4,
        }}
      >
        <span style={{ color: '#00D4FF' }}>Rule:</span> Higher temp = Higher pitch (linear mapping).
        <br />
        −0.5 °C → 220 Hz (A3) &nbsp;|&nbsp; +1.3 °C → 880 Hz (A5)
      </div>
    </div>
  );
}
