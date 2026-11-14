import { describe, it, expect } from 'vitest';
import { checkSourcesIntegrity } from '../scripts/check-sources.mjs';

describe('NASA Sources & Attribution Integrity', () => {
  it('validates all frames, sources, and documentation URLs', () => {
    const report = checkSourcesIntegrity();
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.sourceCount).toBeGreaterThanOrEqual(4);
    expect(report.frameCount).toBeGreaterThanOrEqual(4);
  });
});
