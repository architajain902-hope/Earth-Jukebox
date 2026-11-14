import React, { useRef, useState, useCallback, useMemo } from 'react';
import type { AnomalyRecord } from '../data/types';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';

interface TemperatureChartProps {
  data: AnomalyRecord[];
  selectedYear: number;
  onYearClick: (year: number) => void;
}

const PADDING = { top: 16, right: 16, bottom: 26, left: 38 };

export default function TemperatureChart({
  data,
  selectedYear,
  onYearClick,
}: TemperatureChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<AnomalyRecord | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const width = 310;
  const height = 180;
  const innerW = width - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  const minYear = data[0]?.year ?? 1880;
  const maxYear = data[data.length - 1]?.year ?? 2025;

  // Find min and max anomalies
  const { minAnom, maxAnom } = useMemo(() => {
    const vals = data.map((d) => d.anomaly);
    return {
      minAnom: Math.min(-0.5, ...vals),
      maxAnom: Math.max(1.3, ...vals),
    };
  }, [data]);

  const scaleX = useCallback(
    (year: number) => ((year - minYear) / (maxYear - minYear)) * innerW,
    [minYear, maxYear, innerW]
  );

  const scaleY = useCallback(
    (val: number) => innerH - ((val - minAnom) / (maxAnom - minAnom)) * innerH,
    [minAnom, maxAnom, innerH]
  );

  const zeroY = scaleY(0);

  // Generate SVG path points
  const points = useMemo(() => {
    return data.map((d) => ({
      x: scaleX(d.year),
      y: scaleY(d.anomaly),
      rec: d,
    }));
  }, [data, scaleX, scaleY]);

  const lineD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce(
      (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      ''
    );
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    const base = zeroY.toFixed(1);
    return `${lineD} L ${lastX} ${base} L ${firstX} ${base} Z`;
  }, [lineD, points, zeroY]);

  // Current selected point
  const currentPt = points.find((p) => p.rec.year === selectedYear);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const clientY = e.clientY - svgRect.top;
    const chartX = clientX - PADDING.left;

    const ratio = Math.max(0, Math.min(1, chartX / innerW));
    const targetYear = Math.round(minYear + ratio * (maxYear - minYear));
    const matched = data.find((d) => d.year === targetYear);
    if (matched) {
      setHovered(matched);
      setHoverCoords({ x: clientX, y: clientY });
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setHoverCoords(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const chartX = e.clientX - svgRect.left - PADDING.left;
    const ratio = Math.max(0, Math.min(1, chartX / innerW));
    const targetYear = Math.round(minYear + ratio * (maxYear - minYear));
    onYearClick(Math.max(minYear, Math.min(maxYear, targetYear)));
  };

  return (
    <div
      ref={containerRef}
      className="glass"
      style={{
        padding: '12px 14px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="region"
      aria-label="Temperature Anomaly Line Chart"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          Global Anomaly (1880–2025)
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#64748B', whiteSpace: 'nowrap' }}>
          °C vs 1951–80 Baseline
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', cursor: 'crosshair', overflow: 'visible' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          role="img"
          aria-label="Interactive temperature anomaly line chart. Click to choose year."
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="anomAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC3D21" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="65%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#FC3D21" />
            </linearGradient>
          </defs>

          <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
            {/* Horizontal Grid lines */}
            {[-0.4, 0.0, 0.4, 0.8, 1.2].map((val) => {
              const y = scaleY(val);
              const isZero = val === 0;
              return (
                <g key={val}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerW}
                    y2={y}
                    stroke={isZero ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth={isZero ? 1.2 : 1}
                    strokeDasharray={isZero ? 'none' : '3,3'}
                  />
                  <text
                    x={-6}
                    y={y + 3}
                    textAnchor="end"
                    fill={isZero ? '#E2E8F0' : '#64748B'}
                    fontSize={9}
                    fontFamily="var(--font-mono)"
                  >
                    {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* X Axis milestones */}
            {[1880, 1920, 1960, 2000, 2025].map((yr) => (
              <text
                key={yr}
                x={scaleX(yr)}
                y={innerH + 16}
                textAnchor="middle"
                fill="#64748B"
                fontSize={9}
                fontFamily="var(--font-mono)"
              >
                {yr}
              </text>
            ))}

            {/* Shaded Area */}
            <path d={areaD} fill="url(#anomAreaGrad)" />

            {/* Line chart */}
            <path
              d={lineD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Current Selected Playhead */}
            {currentPt && (
              <g>
                {/* Vertical playhead line */}
                <line
                  x1={currentPt.x}
                  y1={0}
                  x2={currentPt.x}
                  y2={innerH}
                  stroke="#FC3D21"
                  strokeWidth={1.5}
                  strokeDasharray="2,2"
                />
                {/* Outer halo */}
                <circle
                  cx={currentPt.x}
                  cy={currentPt.y}
                  r={7}
                  fill="rgba(252, 61, 33, 0.25)"
                />
                {/* Core dot */}
                <circle
                  cx={currentPt.x}
                  cy={currentPt.y}
                  r={4}
                  fill="#FC3D21"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              </g>
            )}

            {/* Hovered point */}
            {hovered && (
              <circle
                cx={scaleX(hovered.year)}
                cy={scaleY(hovered.anomaly)}
                r={4}
                fill="#00D4FF"
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            )}
          </g>
        </svg>

        {/* Hover Tooltip */}
        {hovered && hoverCoords && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(hoverCoords.x + 10, width - 130),
              top: Math.max(8, hoverCoords.y - 70),
              background: 'rgba(11, 29, 58, 0.95)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: 6,
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ color: '#E2E8F0', fontWeight: 700 }}>Year {hovered.year}</div>
            <div
              style={{
                color: hovered.anomaly >= 0 ? '#FC3D21' : '#38BDF8',
                fontWeight: 600,
              }}
            >
              {hovered.anomaly > 0 ? '+' : ''}{hovered.anomaly.toFixed(2)} °C
            </div>
            <div style={{ color: '#94A3B8', fontSize: 10 }}>
              {Math.round(anomalyToFrequency(hovered.anomaly))} Hz ({frequencyToNoteName(anomalyToFrequency(hovered.anomaly))})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
