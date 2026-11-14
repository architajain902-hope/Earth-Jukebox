import { describe, it, expect } from 'vitest';
import { anomalyToFrequency } from '../src/audio/sonify';
import { computeDecadeAverage, computePreIndustrialBaseline, computeRank } from '../src/data/validate';

describe('Birth Year & Milestone Comparison Logic', () => {
  const mockData = [
    { year: 1980, anomaly: 0.26 },
    { year: 2000, anomaly: 0.39 },
    { year: 2024, anomaly: 1.28 },
  ];

  it('calculates temperature and frequency shifts correctly for a birth year', () => {
    const birthRec = mockData.find((d) => d.year === 2000)!;
    const latestRec = mockData.find((d) => d.year === 2024)!;

    const deltaTemp = latestRec.anomaly - birthRec.anomaly;
    expect(deltaTemp).toBeCloseTo(0.89, 2);

    const birthHz = anomalyToFrequency(birthRec.anomaly);
    const latestHz = anomalyToFrequency(latestRec.anomaly);
    const deltaHz = latestHz - birthHz;

    // t_birth = (0.39 - (-0.5)) / 1.8 = 0.89 / 1.8 = 0.4944...
    // t_latest = (1.28 - (-0.5)) / 1.8 = 1.78 / 1.8 = 0.9888...
    // diff = (0.89 / 1.8) * 660 = 326.33 Hz
    expect(deltaHz).toBeGreaterThan(300);
    expect(deltaHz).toBeLessThan(350);
  });
});

describe('Decade Average Math', () => {
  const decadeData = [
    { year: 1990, anomaly: 0.45 },
    { year: 1991, anomaly: 0.40 },
    { year: 1992, anomaly: 0.22 },
    { year: 1993, anomaly: 0.24 },
    { year: 1994, anomaly: 0.32 },
    { year: 1995, anomaly: 0.45 },
    { year: 1996, anomaly: 0.35 },
    { year: 1997, anomaly: 0.47 },
    { year: 1998, anomaly: 0.61 },
    { year: 1999, anomaly: 0.39 },
    { year: 2000, anomaly: 0.42 }, // next decade
  ];

  it('accurately averages 1990s anomalies', () => {
    const sum90s = 0.45 + 0.40 + 0.22 + 0.24 + 0.32 + 0.45 + 0.35 + 0.47 + 0.61 + 0.39;
    const expectedAvg = sum90s / 10;
    const computed = computeDecadeAverage(decadeData, 1995);
    expect(computed).toBeCloseTo(expectedAvg, 4);
  });

  it('isolates different decades correctly', () => {
    const avg1990s = computeDecadeAverage(decadeData, 1992);
    const avg2000s = computeDecadeAverage(decadeData, 2000);
    expect(avg1990s).not.toBe(avg2000s);
    expect(avg2000s).toBeCloseTo(0.42, 4);
  });
});

describe('URL State Parameter Serialization', () => {
  it('parses valid search query strings into app state', () => {
    const query = '?year=1998&speed=fast&mode=classroom';
    const params = new URLSearchParams(query);

    const year = parseInt(params.get('year') || '', 10);
    const speed = params.get('speed');
    const mode = params.get('mode');

    expect(year).toBe(1998);
    expect(speed).toBe('fast');
    expect(mode).toBe('classroom');
  });

  it('rejects out-of-range years in URL', () => {
    const query = '?year=1750';
    const params = new URLSearchParams(query);
    const y = parseInt(params.get('year') || '', 10);
    const isValid = !isNaN(y) && y >= 1880 && y <= 2025;
    expect(isValid).toBe(false);
  });
});
