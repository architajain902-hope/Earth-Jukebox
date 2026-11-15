import React, { useState } from 'react';
import type { GistempDataset } from '../data/types';
import ClassroomModal from './ClassroomModal';
import ExplainerModal from './ExplainerModal';
import DataMethodModal from './DataMethodModal';

interface LearnTabProps {
  dataset: GistempDataset;
  selectedYear: number;
  onSetYear: (year: number) => void;
  onClose?: () => void;
}

export default function LearnTab({
  dataset,
  selectedYear,
  onSetYear,
  onClose,
}: LearnTabProps) {
  const [activeSubView, setActiveSubView] = useState<'overview' | 'classroom' | 'explainer' | 'method'>('overview');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg-solid, #050B1A)',
        zIndex: 20,
        overflowY: 'auto',
        padding: '24px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: '#00D4FF', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Educational Hub
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary, #FFFFFF)', margin: '4px 0 0' }}>
              Understanding Earth's Acoustic Climate
            </h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(11, 29, 58, 0.6)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ← Back to Earth View
            </button>
          )}
        </div>

        {/* 3 Core Learning Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 36 }}>
          {/* Card 1: Classroom Guided Lesson */}
          <div
            className="glass"
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: 8 }}>
                5-Step Guided Classroom Lesson
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: 20 }}>
                Interactive walk-through on baselines, anomaly departures, historical inflection years (1880, 1976), and instant-feedback quizzes.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('classroom')}
              style={actionBtnStyle}
            >
              Start Guided Lesson →
            </button>
          </div>

          {/* Card 2: What Am I Hearing? (Bilingual) */}
          <div
            className="glass"
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎧</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: 8 }}>
                "What Am I Hearing?" (Bilingual)
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: 20 }}>
                Plain-language breakdown of year {selectedYear}'s pitch, historical rank (#1 to #146), pre-industrial delta, and decade average in English & हिन्दी.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('explainer')}
              style={actionBtnStyle}
            >
              Explain Current Pitch (EN / HI) →
            </button>
          </div>

          {/* Card 3: Scientific Methodology */}
          <div
            className="glass"
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📐</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: 8 }}>
                Data & Scientific Methodology
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.6, marginBottom: 20 }}>
                Rigorous mathematical documentation of the deterministic 220 Hz to 880 Hz formula, NASA GISTEMP v4 citations, and uncertainty disclosure.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('method')}
              style={actionBtnStyle}
            >
              View Mathematical Proof →
            </button>
          </div>
        </div>

        {/* Challenge Alignment Highlight Banner */}
        <div
          className="glass"
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid rgba(0, 212, 255, 0.3)',
            background: 'linear-gradient(135deg, rgba(11,61,145,0.3) 0%, rgba(5,11,26,0.6) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              How Earth 616 Answers "The Earth Information Jukebox" Challenge
            </h3>
          </div>
          <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
            Earth observation visualizations created by NASA are visually stunning, but they can feel abstract on 2D charts and remain inaccessible to visually impaired audiences. Earth 616 translates visual satellite anomaly maps into synchronized Web Audio synthesis—pairing sight with sound so that planetary change can be heard as well as seen, with zero pre-recorded audio or subjective distortion.
          </p>
        </div>
      </div>

      {/* Sub-view Modals */}
      {activeSubView === 'classroom' && (
        <ClassroomModal
          data={dataset.data}
          onSetYear={(yr) => {
            onSetYear(yr);
            setActiveSubView('overview');
          }}
          onClose={() => setActiveSubView('overview')}
        />
      )}

      {activeSubView === 'explainer' && (
        <ExplainerModal
          year={selectedYear}
          data={dataset.data}
          onClose={() => setActiveSubView('overview')}
        />
      )}

      {activeSubView === 'method' && (
        <DataMethodModal
          dataset={dataset}
          selectedYear={selectedYear}
          onClose={() => setActiveSubView('overview')}
        />
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
  border: 'none',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
};
