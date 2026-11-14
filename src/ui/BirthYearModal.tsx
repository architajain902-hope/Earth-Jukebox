import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/types';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';
import { audioEngine } from '../audio/engine';

interface BirthYearModalProps {
  data: AnomalyRecord[];
  onSelectYear: (year: number) => void;
  onClose: () => void;
}

export default function BirthYearModal({
  data,
  onSelectYear,
  onClose,
}: BirthYearModalProps) {
  const minYear = data[0]?.year ?? 1880;
  const latestRecord = data[data.length - 1] ?? { year: 2025, anomaly: 1.19 };
  const latestYear = latestRecord.year;

  const [inputYear, setInputYear] = useState<number>(2000);
  const [playingState, setPlayingState] = useState<'idle' | 'birth' | 'latest'>('idle');

  const birthRecord = data.find((d) => d.year === inputYear) ?? data[0];
  const birthFreq = anomalyToFrequency(birthRecord.anomaly);
  const latestFreq = anomalyToFrequency(latestRecord.anomaly);

  const diffTemp = latestRecord.anomaly - birthRecord.anomaly;
  const diffFreq = latestFreq - birthFreq;

  const playExperience = () => {
    onSelectYear(birthRecord.year);
    setPlayingState('birth');
    audioEngine.playTone(birthRecord.anomaly, 1.4);

    setTimeout(() => {
      onSelectYear(latestYear);
      setPlayingState('latest');
      audioEngine.playTone(latestRecord.anomaly, 1.4);

      setTimeout(() => {
        setPlayingState('idle');
      }, 1500);
    }, 1600);
  };

  // Plain-language personalized message
  const age = latestYear - inputYear;
  const isWarmer = diffTemp > 0;
  const plainLanguageMessage =
    age > 0
      ? `In the ${age} years since ${inputYear}, Earth has warmed by ${isWarmer ? '+' : ''}${diffTemp.toFixed(2)} °C, raising the acoustic pitch by ${Math.round(diffFreq)} Hz (${frequencyToNoteName(birthFreq)} → ${frequencyToNoteName(latestFreq)}).`
      : `Year ${inputYear} is our latest observation record.`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Hear Your Birth Year Experience"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 540,
          padding: 26,
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🎂</span>
            <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
              Hear Your Birth Year
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close birth year modal"
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

        <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16, lineHeight: 1.5 }}>
          Enter the year you were born (or any meaningful year). Hear what Earth sounded like then, compare it immediately to today, and listen to the planetary shift in pitch during your lifetime.
        </p>

        {/* Input Form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <label
            htmlFor="birth-year-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94A3B8' }}
          >
            Birth Year:
          </label>
          <input
            id="birth-year-input"
            type="number"
            min={minYear}
            max={latestYear}
            value={inputYear}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setInputYear(Math.max(minYear, Math.min(latestYear, val)));
              }
            }}
            style={{
              width: 110,
              padding: '6px 10px',
              background: '#0B1D3A',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
            }}
          />
          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            ({minYear}–{latestYear})
          </span>
        </div>

        {/* Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Birth Year Box */}
          <div
            style={{
              background: playingState === 'birth' ? 'rgba(0, 212, 255, 0.25)' : 'rgba(11, 29, 58, 0.6)',
              border: `1px solid ${playingState === 'birth' ? '#00D4FF' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 8,
              padding: 12,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
              Your Year ({inputYear})
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: birthRecord.anomaly >= 0 ? '#FC3D21' : '#38BDF8',
                marginTop: 4,
              }}
            >
              {birthRecord.anomaly > 0 ? '+' : ''}{birthRecord.anomaly.toFixed(2)} °C
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00D4FF', marginTop: 2 }}>
              {Math.round(birthFreq)} Hz ({frequencyToNoteName(birthFreq)})
            </div>
          </div>

          {/* Latest Year Box */}
          <div
            style={{
              background: playingState === 'latest' ? 'rgba(252, 61, 33, 0.25)' : 'rgba(11, 29, 58, 0.6)',
              border: `1px solid ${playingState === 'latest' ? '#FC3D21' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: 8,
              padding: 12,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
              Latest Year ({latestYear})
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: latestRecord.anomaly >= 0 ? '#FC3D21' : '#38BDF8',
                marginTop: 4,
              }}
            >
              {latestRecord.anomaly > 0 ? '+' : ''}{latestRecord.anomaly.toFixed(2)} °C
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#00D4FF', marginTop: 2 }}>
              {Math.round(latestFreq)} Hz ({frequencyToNoteName(latestFreq)})
            </div>
          </div>
        </div>

        {/* Personalized Message Callout */}
        <div
          style={{
            background: 'rgba(11, 29, 58, 0.75)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 18,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#E0F2FE',
          }}
        >
          <strong>Lifetime Impact: </strong> {plainLanguageMessage}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={playExperience}
            disabled={playingState !== 'idle'}
            style={{
              padding: '10px 22px',
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
              boxShadow: '0 0 16px rgba(252, 61, 33, 0.3)',
            }}
          >
            <span>🎵</span>
            <span>
              {playingState === 'birth'
                ? `Playing ${inputYear}...`
                : playingState === 'latest'
                ? `Playing ${latestYear}...`
                : 'Play Birth Year vs Today'}
            </span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: '#FFFFFF',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
