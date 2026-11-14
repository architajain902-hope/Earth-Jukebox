import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/types';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';
import { audioEngine } from '../audio/engine';

interface CompareModalProps {
  data: AnomalyRecord[];
  initialYear1: number;
  initialYear2: number;
  onClose: () => void;
}

export default function CompareModal({
  data,
  initialYear1,
  initialYear2,
  onClose,
}: CompareModalProps) {
  const [year1, setYear1] = useState(initialYear1);
  const [year2, setYear2] = useState(initialYear2);
  const [playingState, setPlayingState] = useState<'idle' | 'year1' | 'year2'>('idle');

  const rec1 = data.find((d) => d.year === year1) ?? data[0];
  const rec2 = data.find((d) => d.year === year2) ?? data[data.length - 1];

  const freq1 = anomalyToFrequency(rec1.anomaly);
  const freq2 = anomalyToFrequency(rec2.anomaly);

  const diffTemp = rec2.anomaly - rec1.anomaly;
  const diffFreq = freq2 - freq1;

  const playSequence = () => {
    setPlayingState('year1');
    audioEngine.playTone(rec1.anomaly, 1.2);

    setTimeout(() => {
      setPlayingState('year2');
      audioEngine.playTone(rec2.anomaly, 1.2);

      setTimeout(() => {
        setPlayingState('idle');
      }, 1300);
    }, 1400);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Compare Two Years"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 24,
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
            ⚖️ Compare Two Years
          </h2>
          <button
            onClick={onClose}
            aria-label="Close compare modal"
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

        {/* Dual Year Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Year 1 Card */}
          <div
            style={{
              background: playingState === 'year1' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(11, 29, 58, 0.6)',
              border: `1px solid ${playingState === 'year1' ? '#00D4FF' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 8,
              padding: 12,
              transition: 'all 0.2s ease',
            }}
          >
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
              First Year
            </label>
            <select
              value={year1}
              onChange={(e) => setYear1(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#0B1D3A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 4,
                marginTop: 4,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {data.map((d) => (
                <option key={d.year} value={d.year}>
                  {d.year} ({d.anomaly > 0 ? '+' : ''}{d.anomaly.toFixed(2)} °C)
                </option>
              ))}
            </select>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <div style={{ color: rec1.anomaly >= 0 ? '#FC3D21' : '#38BDF8', fontWeight: 700 }}>
                {rec1.anomaly > 0 ? '+' : ''}{rec1.anomaly.toFixed(2)} °C
              </div>
              <div style={{ color: '#00D4FF', fontSize: 11 }}>
                {Math.round(freq1)} Hz ({frequencyToNoteName(freq1)})
              </div>
            </div>
          </div>

          {/* Year 2 Card */}
          <div
            style={{
              background: playingState === 'year2' ? 'rgba(252, 61, 33, 0.2)' : 'rgba(11, 29, 58, 0.6)',
              border: `1px solid ${playingState === 'year2' ? '#FC3D21' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 8,
              padding: 12,
              transition: 'all 0.2s ease',
            }}
          >
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
              Second Year
            </label>
            <select
              value={year2}
              onChange={(e) => setYear2(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#0B1D3A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 4,
                marginTop: 4,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {data.map((d) => (
                <option key={d.year} value={d.year}>
                  {d.year} ({d.anomaly > 0 ? '+' : ''}{d.anomaly.toFixed(2)} °C)
                </option>
              ))}
            </select>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <div style={{ color: rec2.anomaly >= 0 ? '#FC3D21' : '#38BDF8', fontWeight: 700 }}>
                {rec2.anomaly > 0 ? '+' : ''}{rec2.anomaly.toFixed(2)} °C
              </div>
              <div style={{ color: '#00D4FF', fontSize: 11 }}>
                {Math.round(freq2)} Hz ({frequencyToNoteName(freq2)})
              </div>
            </div>
          </div>
        </div>

        {/* Delta Summary */}
        <div
          style={{
            background: 'rgba(11, 29, 58, 0.7)',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            marginBottom: 16,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <div style={{ color: '#94A3B8', marginBottom: 4 }}>
            Net Scientific Difference ({year2} vs {year1}):
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              Temperature Shift:{' '}
              <strong style={{ color: diffTemp >= 0 ? '#FC3D21' : '#38BDF8' }}>
                {diffTemp > 0 ? '+' : ''}{diffTemp.toFixed(2)} °C
              </strong>
            </span>
            <span>
              Pitch Shift:{' '}
              <strong style={{ color: diffFreq >= 0 ? '#FC3D21' : '#38BDF8' }}>
                {diffFreq > 0 ? '+' : ''}{Math.round(diffFreq)} Hz
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={playSequence}
            disabled={playingState !== 'idle'}
            style={{
              padding: '10px 20px',
              background: playingState !== 'idle' ? '#4A5568' : 'linear-gradient(135deg, #0B3D91, #FC3D21)',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: playingState !== 'idle' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>▶</span>
            <span>
              {playingState === 'year1'
                ? `Playing ${year1}...`
                : playingState === 'year2'
                ? `Playing ${year2}...`
                : 'Play Back-to-Back'}
            </span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
