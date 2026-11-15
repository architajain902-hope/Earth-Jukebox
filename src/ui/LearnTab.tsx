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
      role="region"
      aria-label="Educational Hub: Understanding Earth's changing climate through sound"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg-solid, #050B1A)',
        zIndex: 20,
        overflowY: 'auto',
        paddingTop: 'calc(var(--header-height, 68px) + 24px)',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        scrollPaddingTop: 'calc(var(--header-height, 68px) + 24px)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: '#00D4FF',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Educational Hub
            </div>
            <h1
              style={{
                fontSize: 'clamp(24px, 4vw, 34px)',
                fontWeight: 800,
                color: 'var(--text-primary, #FFFFFF)',
                margin: '6px 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              Understanding Earth's changing climate through sound
            </h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Back to 3D Earth Globe view"
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'rgba(11, 29, 58, 0.6)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              ← Back to Earth View
            </button>
          )}
        </div>

        {/* 3 Core Learning Cards - Equal Height */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'stretch',
            gap: 24,
            marginBottom: 36,
          }}
        >
          {/* Card 1: 5-step classroom lesson */}
          <div
            className="glass"
            style={{
              padding: 28,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 44 }} aria-hidden="true">🎓</span>
                <span
                  style={{
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: '#00D4FF',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Start here
                </span>
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary, #FFFFFF)',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}
              >
                5-step classroom lesson
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary, #CBD5E1)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                A guided walk through baselines, anomalies and key years, with a quick quiz after each step.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('classroom')}
              aria-label="Start 5-step classroom lesson"
              style={actionBtnStyle}
            >
              Start lesson
            </button>
          </div>

          {/* Card 2: What am I hearing? (<selectedYear>) */}
          <div
            className="glass"
            style={{
              padding: 28,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 44, marginBottom: 16 }} aria-hidden="true">🎧</div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary, #FFFFFF)',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}
              >
                What am I hearing? ({selectedYear})
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary, #CBD5E1)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                A plain-language explanation of the selected year: its pitch, how it ranks among all 146 years, and how it compares with the baseline. In English and Hindi.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('explainer')}
              aria-label={`Explain sound for year ${selectedYear} in English and Hindi`}
              style={actionBtnStyle}
            >
              Explain this year
            </button>
          </div>

          {/* Card 3: How we made this */}
          <div
            className="glass"
            style={{
              padding: 28,
              borderRadius: 16,
              border: '1px solid rgba(0, 212, 255, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 44, marginBottom: 16 }} aria-hidden="true">📐</div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary, #FFFFFF)',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}
              >
                How we made this
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary, #CBD5E1)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                The data source, the baseline, the exact pitch formula, the NASA citations and the limits of this method.
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('method')}
              aria-label="Open Method and Limitations documentation"
              style={actionBtnStyle}
            >
              Open Method and Limitations
            </button>
          </div>
        </div>

        {/* Challenge Alignment Highlight Card */}
        <div
          className="glass"
          style={{
            padding: 28,
            borderRadius: 16,
            border: '1px solid rgba(0, 212, 255, 0.3)',
            background: 'linear-gradient(135deg, rgba(11,61,145,0.25) 0%, rgba(5,11,26,0.65) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }} aria-hidden="true">🏛️</span>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              How SONIX answers The Earth Information Jukebox challenge
            </h2>
          </div>
          <p
            style={{
              fontSize: 16,
              color: 'var(--text-secondary, #CBD5E1)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            NASA's Earth visualizations are powerful but mostly visual, which leaves out people who cannot see them. SONIX turns NASA temperature data and NASA visualization frames into live sound made in your browser, so people can hear Earth's changes as well as see them. Exact mode plays the true pitch. Musical mode rounds notes to a scale so it sounds pleasant. The mode is always shown on screen.
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
  padding: '12px 20px',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
  border: 'none',
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
