import type { AnomalyRecord } from './types';

export interface ComputedMilestone {
  year: number;
  label: string;
  anomaly: number;
  formattedAnomaly: string; // e.g. "-0.5°C" or "+1.3°C"
}

/**
 * Dynamically computes verified historical climate milestones from loaded NASA GISTEMP data.
 * Zero hard-coded claims, peaks, or invented numbers.
 * Every milestone label is mathematically derived from the real dataset.
 */
export function computeTimelineMilestones(data: AnomalyRecord[]): ComputedMilestone[] {
  if (!data || data.length === 0) return [];

  const firstRec = data[0];
  const latestRec = data[data.length - 1];

  let coolestRec = data[0];
  let warmestRec = data[0];

  for (const r of data) {
    if (r.anomaly < coolestRec.anomaly) coolestRec = r;
    if (r.anomaly > warmestRec.anomaly) warmestRec = r;
  }

  const baselineStartRec = data.find((r) => r.year === 1951);
  const baselineEndRec = data.find((r) => r.year === 1980);

  const formatAnom = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}°C`;

  const map = new Map<number, ComputedMilestone>();

  // 1. First year
  map.set(firstRec.year, {
    year: firstRec.year,
    label: `${firstRec.year} First year`,
    anomaly: firstRec.anomaly,
    formattedAnomaly: formatAnom(firstRec.anomaly),
  });

  // 2. Coolest year (minimum recorded anomaly)
  map.set(coolestRec.year, {
    year: coolestRec.year,
    label: `${coolestRec.year} Coolest year`,
    anomaly: coolestRec.anomaly,
    formattedAnomaly: formatAnom(coolestRec.anomaly),
  });

  // 3. Baseline period start
  if (baselineStartRec) {
    map.set(baselineStartRec.year, {
      year: baselineStartRec.year,
      label: `${baselineStartRec.year} Baseline starts`,
      anomaly: baselineStartRec.anomaly,
      formattedAnomaly: formatAnom(baselineStartRec.anomaly),
    });
  }

  // 4. Baseline period end
  if (baselineEndRec) {
    map.set(baselineEndRec.year, {
      year: baselineEndRec.year,
      label: `${baselineEndRec.year} Baseline ends`,
      anomaly: baselineEndRec.anomaly,
      formattedAnomaly: formatAnom(baselineEndRec.anomaly),
    });
  }

  // 5. Warmest year (maximum recorded anomaly)
  map.set(warmestRec.year, {
    year: warmestRec.year,
    label: `${warmestRec.year} Warmest year`,
    anomaly: warmestRec.anomaly,
    formattedAnomaly: formatAnom(warmestRec.anomaly),
  });

  // 6. Latest year
  map.set(latestRec.year, {
    year: latestRec.year,
    label: `${latestRec.year} Latest year`,
    anomaly: latestRec.anomaly,
    formattedAnomaly: formatAnom(latestRec.anomaly),
  });

  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}
