import React from 'react';
import type { AnomalyRecord } from '../data/types';
import { getRecordForYear } from '../data/loadData';

interface QuickJumpsProps {
  data: AnomalyRecord[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

const KEY_YEARS = [1880, 1940, 1976, 1998, 2016, 2023, 2024, 2025];

export default function QuickJumps({
  data,
  selectedYear,
  onSelectYear,
}: QuickJumpsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
      role="group"
      aria-label="Quick jump milestones"
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginRight: 4,
        }}
      >
        Key Milestones:
      </span>
      {KEY_YEARS.map((yr) => {
        const rec = getRecordForYear(data, yr);
        if (!rec) return null;
        const isSelected = yr === selectedYear;
        const sign = rec.anomaly > 0 ? '+' : '';

        return (
          <button
            key={yr}
            onClick={() => onSelectYear(yr)}
            aria-label={`Jump to year ${yr}, anomaly ${sign}${rec.anomaly.toFixed(2)} °C`}
            aria-pressed={isSelected}
            style={{
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              border: `1px solid ${isSelected ? '#FC3D21' : 'rgba(0, 212, 255, 0.25)'}`,
              background: isSelected ? 'rgba(252, 61, 33, 0.3)' : 'rgba(11, 29, 58, 0.6)',
              color: isSelected ? '#FFFFFF' : '#94A3B8',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontWeight: 600 }}>{yr}</span>
            <span
              style={{
                fontSize: 9.5,
                color: rec.anomaly >= 0 ? '#F97316' : '#38BDF8',
              }}
            >
              ({sign}{rec.anomaly.toFixed(2)}°)
            </span>
          </button>
        );
      })}
    </div>
  );
}
