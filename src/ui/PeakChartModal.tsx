import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PeakChart } from '@/components/ui/peak-chart';
import type { GistempDataset } from '../data/types';

interface PeakChartModalProps {
  dataset: GistempDataset;
  selectedYear: number;
  onClose: () => void;
}

export default function PeakChartModal({
  dataset,
  selectedYear,
  onClose,
}: PeakChartModalProps) {
  const [viewMode, setViewMode] = useState<'climate' | 'demo'>('climate');
  const [accentColor, setAccentColor] = useState<string>('#00D4FF');

  // Compute climate series from the dataset
  // Let's extract the last 12 years (2013 - 2024) for the main curve
  const climateData = useMemo(() => {
    const recent = dataset.data.slice(-12);
    // Convert temperature anomalies (-0.5 to +1.3) into positive chart units
    const values = recent.map((d) => Math.round((d.anomaly + 0.5) * 150));
    const labels = recent.map((d) => String(d.year));
    const latest = dataset.data[dataset.data.length - 1];
    const selectedRec = dataset.data.find((d) => d.year === selectedYear);
    return {
      values,
      labels,
      latestYear: latest ? latest.year : 2024,
      latestAnomaly: latest ? latest.anomaly : 1.28,
      selectedAnomaly: selectedRec ? selectedRec.anomaly : (latest ? latest.anomaly : 1.28),
    };
  }, [dataset, selectedYear]);

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Peak Climate Trends and Anomaly Chart"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 17, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          overflowY: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 580,
            background: 'var(--panel-bg, #050B1A)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            boxShadow: '0 24px 64px rgba(0, 212, 255, 0.15), 0 12px 32px rgba(0,0,0,0.8)',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(11, 29, 58, 0.5)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: '#00D4FF',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  fontWeight: 600,
                }}
              >
                Interactive Peak Spline
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: '4px 0 0',
                }}
              >
                {viewMode === 'climate' ? 'NASA Temperature Anomaly Peaks' : 'Peak Chart Interactive Demo'}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mode Toggle */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(0,0,0,0.35)',
                  borderRadius: 20,
                  padding: 3,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <button
                  onClick={() => setViewMode('climate')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'climate' ? '#00D4FF' : 'transparent',
                    color: viewMode === 'climate' ? '#050B1A' : '#94A3B8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  NASA Data
                </button>
                <button
                  onClick={() => setViewMode('demo')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'demo' ? '#00D4FF' : 'transparent',
                    color: viewMode === 'demo' ? '#050B1A' : '#94A3B8',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Demo Series
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close peak chart modal"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#CBD5E1',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div
            style={{
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#01050e',
            }}
          >
            {viewMode === 'climate' ? (
              <PeakChart
                title="WARMING ANOMALY"
                value={climateData.latestAnomaly}
                valueSuffix="°C"
                decimals={2}
                caption={`GISTEMP Anomaly Peak (${climateData.latestYear}) vs 1951-1980 baseline`}
                updatedText="NASA GISTEMP v4"
                trend="up"
                data={climateData.values}
                labels={climateData.labels}
                accent={accentColor}
                formatValue={(v) => {
                  const anomaly = ((v / 150) - 0.5).toFixed(2);
                  return `${anomaly > '0' ? '+' : ''}${anomaly}°C`;
                }}
                periods={['2013-2024', 'Last 12 Years']}
                defaultPeriod="2013-2024"
              />
            ) : (
              <PeakChart
                accent="#2e85ff"
              />
            )}
          </div>

          {/* Footer controls & info */}
          <div
            style={{
              padding: '14px 24px',
              background: 'rgba(5, 11, 26, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
              color: '#94A3B8',
            }}
          >
            <div>
              Interactive Steffen cubic spline with real-time gradient glow field.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Glow:</span>
              {['#00D4FF', '#1678ff', '#FF4D2E', '#22C55E'].map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: c,
                    border: accentColor === c ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                  }}
                  aria-label={`Set glow accent to ${c}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
