import { describe, it, expect } from 'vitest';
import { validateDataset, computeRank, computePreIndustrialBaseline, computeDecadeAverage } from '../src/data/validate';
import { parseAndValidateGISTEMP } from '../scripts/fetch-data.mjs';
import type { GistempDataset } from '../src/data/types';

describe('Data Validator & Parser', () => {
  const sampleCSV = `NASA GISS Surface Temperature Analysis
Year,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON
1880,-.18,-.24,-.09,-.16,-.10,-.21,-.18,-.10,-.14,-.23,-.21,-.18,-.18,-.18,***,-.12,-.16,-.19
1881,-.19,-.14,.03,.05,.05,-.18,-.02,-.04,-.15,-.22,-.18,-.06,-.09,-.10,-.17,.04,-.08,-.18
2024,1.21,1.40,1.36,1.32,1.18,1.20,1.26,1.35,1.24,1.32,1.28,1.22,1.28,1.28,1.32,1.29,1.27,1.28
2025,1.25,1.20,1.15,1.18,1.14,1.19,1.22,1.21,1.16,1.20,1.19,1.18,1.19,1.19,1.21,1.16,1.21,1.18
`;

  it('parses real NASA CSV formatting correctly', () => {
    const records = parseAndValidateGISTEMP(sampleCSV);
    expect(records.length).toBe(4);
    expect(records[0]).toEqual({ year: 1880, anomaly: -0.18 });
    expect(records[2]).toEqual({ year: 2024, anomaly: 1.28 });
    expect(records[3]).toEqual({ year: 2025, anomaly: 1.19 });
  });

  it('validates correct GISTEMP dataset object', () => {
    const dummyDataset: GistempDataset = {
      source: 'NASA GISS GISTEMP v4',
      citation: 'Test citation',
      url: 'https://data.giss.nasa.gov',
      fetchedAt: new Date().toISOString(),
      baseline: '1951-1980',
      unit: '°C',
      data: Array.from({ length: 146 }, (_, i) => ({
        year: 1880 + i,
        anomaly: Number((-0.3 + i * 0.01).toFixed(2))
      }))
    };

    const report = validateDataset(dummyDataset);
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.count).toBe(146);
    expect(report.minYear).toBe(1880);
    expect(report.maxYear).toBe(2025);
  });

  it('catches duplicate years', () => {
    const datasetWithDups: GistempDataset = {
      source: 'NASA',
      citation: 'Test',
      url: 'https://data.giss.nasa.gov',
      fetchedAt: new Date().toISOString(),
      baseline: '1951-1980',
      unit: '°C',
      data: [
        { year: 1990, anomaly: 0.44 },
        { year: 1990, anomaly: 0.45 }
      ]
    };
    const report = validateDataset(datasetWithDups);
    expect(report.valid).toBe(false);
    expect(report.errors.some(e => e.includes('Duplicate'))).toBe(true);
  });

  it('computes rank accurately (1 = highest anomaly)', () => {
    const testData = [
      { year: 2016, anomaly: 1.02 },
      { year: 2020, anomaly: 1.01 },
      { year: 2023, anomaly: 1.17 },
      { year: 2024, anomaly: 1.28 }
    ];
    expect(computeRank(testData, 2024)).toBe(1);
    expect(computeRank(testData, 2023)).toBe(2);
    expect(computeRank(testData, 2016)).toBe(3);
    expect(computeRank(testData, 2020)).toBe(4);
    expect(computeRank(testData, 1999)).toBe(-1);
  });

  it('computes pre-industrial baseline (1880-1900)', () => {
    const data = [
      { year: 1880, anomaly: -0.20 },
      { year: 1881, anomaly: -0.10 },
      { year: 1900, anomaly: -0.09 },
      { year: 2024, anomaly: 1.28 }
    ];
    const base = computePreIndustrialBaseline(data);
    expect(base).toBeCloseTo((-0.20 + -0.10 + -0.09) / 3, 4);
  });

  it('computes decade averages', () => {
    const data = [
      { year: 2020, anomaly: 1.00 },
      { year: 2021, anomaly: 1.10 },
      { year: 2022, anomaly: 1.20 },
      { year: 2019, anomaly: 0.90 } // previous decade
    ];
    const decadeAvg = computeDecadeAverage(data, 2021);
    expect(decadeAvg).toBeCloseTo((1.00 + 1.10 + 1.20) / 3, 4);
  });
});
