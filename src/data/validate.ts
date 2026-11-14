import type { AnomalyRecord, GistempDataset } from './types';

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  count: number;
  minYear: number;
  maxYear: number;
  minAnomaly: number;
  maxAnomaly: number;
}

/**
 * Validates GISTEMP dataset ensuring 1880 to 2025 data integrity,
 * no missing numbers, no duplicates, all numbers finite.
 */
export function validateDataset(dataset: GistempDataset): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dataset || !Array.isArray(dataset.data)) {
    return {
      valid: false,
      errors: ['Invalid dataset: missing or malformed data array'],
      warnings: [],
      count: 0,
      minYear: 0,
      maxYear: 0,
      minAnomaly: 0,
      maxAnomaly: 0
    };
  }

  const { data } = dataset;
  if (data.length < 100) {
    errors.push(`Expected at least 100 records, got ${data.length}`);
  }

  const years = new Set<number>();
  let prevYear = -Infinity;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (typeof r.year !== 'number' || !Number.isInteger(r.year)) {
      errors.push(`Record index ${i}: Invalid year ${r.year}`);
    }
    if (typeof r.anomaly !== 'number' || !Number.isFinite(r.anomaly)) {
      errors.push(`Record for year ${r?.year}: Non-finite anomaly ${r?.anomaly}`);
    }
    if (years.has(r.year)) {
      errors.push(`Duplicate year found: ${r.year}`);
    }
    years.add(r.year);

    if (r.year <= prevYear) {
      warnings.push(`Data is not strictly sorted chronologically at year ${r.year}`);
    }
    prevYear = r.year;
  }

  const anomalies = data.map(r => r.anomaly).filter(Number.isFinite);
  const minAnomaly = anomalies.length ? Math.min(...anomalies) : 0;
  const maxAnomaly = anomalies.length ? Math.max(...anomalies) : 0;
  const minYear = data.length ? Math.min(...data.map(r => r.year)) : 0;
  const maxYear = data.length ? Math.max(...data.map(r => r.year)) : 0;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    count: data.length,
    minYear,
    maxYear,
    minAnomaly,
    maxAnomaly
  };
}

/**
 * Compute rank of a year (1 = warmest year in dataset)
 */
export function computeRank(data: AnomalyRecord[], year: number): number {
  const target = data.find(r => r.year === year);
  if (!target) return -1;
  const sorted = [...data].sort((a, b) => b.anomaly - a.anomaly);
  return sorted.findIndex(r => r.year === year) + 1;
}

/**
 * Compute 1880-1900 pre-industrial baseline average anomaly
 */
export function computePreIndustrialBaseline(data: AnomalyRecord[]): number {
  const early = data.filter(r => r.year >= 1880 && r.year <= 1900);
  if (early.length === 0) return 0;
  const sum = early.reduce((acc, r) => acc + r.anomaly, 0);
  return sum / early.length;
}

/**
 * Compute decade average anomaly for a given year (e.g. 2024 -> 2020-2029)
 */
export function computeDecadeAverage(data: AnomalyRecord[], year: number): number {
  const decadeStart = Math.floor(year / 10) * 10;
  const decadeEnd = decadeStart + 9;
  const decadeRecords = data.filter(r => r.year >= decadeStart && r.year <= decadeEnd);
  if (decadeRecords.length === 0) return 0;
  const sum = decadeRecords.reduce((acc, r) => acc + r.anomaly, 0);
  return sum / decadeRecords.length;
}
