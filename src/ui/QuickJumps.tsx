import React, { useMemo } from 'react';
import type { AnomalyRecord } from '../data/types';
import { computeTimelineMilestones } from '../data/milestones';

interface QuickJumpsProps {
  data: AnomalyRecord[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

export default function QuickJumps({
  data,
  selectedYear,
  onSelectYear,
}: QuickJumpsProps) {
  const milestones = useMemo(() => computeTimelineMilestones(data), [data]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
      role="group"
      aria-label="Quick jump milestones"
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary, #CBD5E1)',
          marginRight: 2,
        }}
      >
        Verified Milestones:
      </span>
      {milestones.map((m) => {
        const isSelected = m.year === selectedYear;

        return (
          <button
            key={m.year}
            onClick={() => onSelectYear(m.year)}
            aria-label={`Jump to year ${m.year}, ${m.label}`}
            aria-pressed={isSelected}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              border: `1px solid ${isSelected ? '#00D4FF' : 'rgba(0, 212, 255, 0.25)'}`,
              background: isSelected ? 'rgba(0, 212, 255, 0.28)' : 'rgba(11, 29, 58, 0.6)',
              color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #CBD5E1)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontWeight: 600 }}>{m.label}</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: m.anomaly >= 0 ? '#F97316' : '#38BDF8',
              }}
            >
              ({m.formattedAnomaly})
            </span>
          </button>
        );
      })}
    </div>
  );
}
