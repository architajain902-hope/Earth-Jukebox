import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { computeTimelineMilestones } from '../src/data/milestones';
import type { AnomalyRecord } from '../src/data/types';

describe('Timeline Milestones & Scientific Validity (Stage 3)', () => {
  const jsonPath = join(process.cwd(), 'public', 'data', 'gistemp.json');
  const raw = readFileSync(jsonPath, 'utf8');
  const dataset = JSON.parse(raw);
  const data: AnomalyRecord[] = dataset.data;

  it('computes milestones strictly from dataset with zero hard-coded anomalies', () => {
    const milestones = computeTimelineMilestones(data);
    expect(milestones.length).toBeGreaterThanOrEqual(4);

    // Verify each milestone exists in the loaded data
    milestones.forEach((m) => {
      const match = data.find((r) => r.year === m.year);
      expect(match).toBeDefined();
      expect(m.anomaly).toBe(match!.anomaly);

      // Verify label matches computed fact format (e.g. "<year> <Fact>")
      expect(m.label).toMatch(/^\d{4}\s+(First year|Coolest year|Baseline starts|Baseline ends|Warmest year|Latest year)$/);

      // Verify no unscientific/unverified event claims exist in the label
      expect(m.label).not.toContain('Peak');
      expect(m.label).not.toContain('Super El Niño');
      expect(m.label).not.toContain('Last Cool');
      expect(m.label).not.toContain('+1.45');
    });
  });

  it('correctly identifies coolest and warmest years mathematically', () => {
    const milestones = computeTimelineMilestones(data);

    let min = data[0];
    let max = data[0];
    data.forEach((r) => {
      if (r.anomaly < min.anomaly) min = r;
      if (r.anomaly > max.anomaly) max = r;
    });

    const coolestMilestone = milestones.find((m) => m.label.includes('Coolest year'));
    expect(coolestMilestone).toBeDefined();
    expect(coolestMilestone!.year).toBe(min.year);
    expect(coolestMilestone!.anomaly).toBe(min.anomaly);

    const warmestMilestone = milestones.find((m) => m.label.includes('Warmest year'));
    expect(warmestMilestone).toBeDefined();
    expect(warmestMilestone!.year).toBe(max.year);
    expect(warmestMilestone!.anomaly).toBe(max.anomaly);
  });

  it('first year and latest year align with data bounds', () => {
    const milestones = computeTimelineMilestones(data);
    expect(milestones[0].year).toBe(data[0].year);
    expect(milestones[milestones.length - 1].year).toBe(data[data.length - 1].year);
  });
});
