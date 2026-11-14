import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/types';
import {
  computeRank,
  computePreIndustrialBaseline,
  computeDecadeAverage,
} from '../data/validate';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';

interface ExplainerModalProps {
  year: number;
  data: AnomalyRecord[];
  onClose: () => void;
}

type Lang = 'en' | 'hi';

export default function ExplainerModal({
  year,
  data,
  onClose,
}: ExplainerModalProps) {
  const [lang, setLang] = useState<Lang>('en');

  const rec = data.find((d) => d.year === year) ?? data[data.length - 1];
  const anomaly = rec.anomaly;
  const freq = anomalyToFrequency(anomaly);
  const note = frequencyToNoteName(freq);
  const rank = computeRank(data, year);
  const totalYears = data.length;
  const preIndustrialBase = computePreIndustrialBaseline(data);
  const diffPreInd = anomaly - preIndustrialBase;
  const decadeAvg = computeDecadeAverage(data, year);

  const sign = anomaly > 0 ? '+' : '';
  const preIndSign = diffPreInd > 0 ? '+' : '';

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
      aria-label="What Am I Hearing Explainer"
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 540,
          padding: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          border: '1px solid rgba(0, 212, 255, 0.35)',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎧</span>
            <h2 style={{ fontSize: 18, color: '#FFFFFF', margin: 0 }}>
              {lang === 'en' ? 'What Am I Hearing?' : 'आप क्या सुन रहे हैं?'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language toggle English / Hindi */}
            <div style={{ display: 'flex', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: 6, overflow: 'hidden' }}>
              <button
                onClick={() => setLang('en')}
                style={{
                  padding: '3px 8px',
                  background: lang === 'en' ? 'rgba(0, 212, 255, 0.3)' : 'transparent',
                  color: lang === 'en' ? '#00D4FF' : '#94A3B8',
                  border: 'none',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                style={{
                  padding: '3px 8px',
                  background: lang === 'hi' ? 'rgba(0, 212, 255, 0.3)' : 'transparent',
                  color: lang === 'hi' ? '#00D4FF' : '#94A3B8',
                  border: 'none',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close explainer"
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
        </div>

        {/* Dynamic Computed Content */}
        {lang === 'en' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5, lineHeight: 1.6, color: '#CBD5E1' }}>
            <p>
              You are listening to the year <strong style={{ color: '#FFFFFF' }}>{year}</strong>.
              The scientific temperature anomaly for this year is{' '}
              <strong style={{ color: anomaly >= 0 ? '#FC3D21' : '#38BDF8' }}>
                {sign}{anomaly.toFixed(2)} °C
              </strong>{' '}
              above the 1951–1980 baseline.
            </p>

            <div
              style={{
                background: 'rgba(11, 29, 58, 0.6)',
                borderRadius: 8,
                padding: '12px 16px',
                border: '1px solid rgba(0, 212, 255, 0.15)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>Synthesized Pitch:</span>
                <div style={{ color: '#00D4FF', fontWeight: 700, fontSize: 14 }}>
                  {Math.round(freq)} Hz ({note})
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Warmth Rank:</span>
                <div style={{ color: rank <= 10 ? '#FC3D21' : '#E2E8F0', fontWeight: 700, fontSize: 14 }}>
                  #{rank} of {totalYears}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Vs Pre-Industrial (1880–1900):</span>
                <div style={{ color: diffPreInd > 0 ? '#F97316' : '#38BDF8', fontWeight: 600 }}>
                  {preIndSign}{diffPreInd.toFixed(2)} °C
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Decade Average:</span>
                <div style={{ color: '#E2E8F0', fontWeight: 600 }}>
                  {decadeAvg > 0 ? '+' : ''}{decadeAvg.toFixed(2)} °C
                </div>
              </div>
            </div>

            <p>
              <strong style={{ color: '#00D4FF' }}>Why does this tone sound like this?</strong>
              <br />
              Earth 616 uses a direct scientific mapping: higher planetary temperature anomaly produces a strictly higher musical pitch.
              At −0.5 °C the pitch is a deep 220 Hz (musical note A3). As global temperatures rise up to +1.3 °C, the pitch rises linearly to 880 Hz (A5).
            </p>

            <p style={{ fontStyle: 'italic', color: '#94A3B8' }}>
              Every note is mathematically calculated from NASA Goddard Institute for Space Studies (GISTEMP v4) records. There is no artistic improvisation, approximation, or random generation.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5, lineHeight: 1.6, color: '#CBD5E1' }}>
            <p>
              आप वर्ष <strong style={{ color: '#FFFFFF' }}>{year}</strong> का स्वर सुन रहे हैं।
              इस वर्ष का वास्तविक तापमान विसंगति (Anomaly){' '}
              <strong style={{ color: anomaly >= 0 ? '#FC3D21' : '#38BDF8' }}>
                {sign}{anomaly.toFixed(2)} °C
              </strong>{' '}
              है (1951–1980 के आधार वर्ष की तुलना में)।
            </p>

            <div
              style={{
                background: 'rgba(11, 29, 58, 0.6)',
                borderRadius: 8,
                padding: '12px 16px',
                border: '1px solid rgba(0, 212, 255, 0.15)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>संश्लेषित पिच (Pitch):</span>
                <div style={{ color: '#00D4FF', fontWeight: 700, fontSize: 14 }}>
                  {Math.round(freq)} Hz ({note})
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>गर्माहट रैंक:</span>
                <div style={{ color: rank <= 10 ? '#FC3D21' : '#E2E8F0', fontWeight: 700, fontSize: 14 }}>
                  #{rank} / {totalYears}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>पूर्व-औद्योगिक (1880–1900) से अंतर:</span>
                <div style={{ color: diffPreInd > 0 ? '#F97316' : '#38BDF8', fontWeight: 600 }}>
                  {preIndSign}{diffPreInd.toFixed(2)} °C
                </div>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>दशक का औसत:</span>
                <div style={{ color: '#E2E8F0', fontWeight: 600 }}>
                  {decadeAvg > 0 ? '+' : ''}{decadeAvg.toFixed(2)} °C
                </div>
              </div>
            </div>

            <p>
              <strong style={{ color: '#00D4FF' }}>यह ध्वनि ऐसी क्यों सुनाई देती है?</strong>
              <br />
              अर्थ 616 प्रत्यक्ष वैज्ञानिक नियमों पर आधारित है: तापमान जितना अधिक होता है, ध्वनि की पिच (आवृत्ति) उतनी ही ऊंची हो जाती है।
              −0.5 °C पर यह 220 हर्ट्ज़ (संगीत स्वर A3) होती है, और +1.3 °C पर बढ़कर 880 हर्ट्ज़ (A5) तक पहुँचती है।
            </p>

            <p style={{ fontStyle: 'italic', color: '#94A3B8' }}>
              प्रत्येक ध्वनि नासा (NASA GISTEMP v4) के वास्तविक डेटा से सीधे तैयार की गई है। इसमें कोई काल्पनिक या मनमाना संगीत नहीं है।
            </p>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #0B3D91, #FC3D21)',
              border: 'none',
              borderRadius: 6,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {lang === 'en' ? 'Close' : 'बंद करें'}
          </button>
        </div>
      </div>
    </div>
  );
}
