import { describe, it, expect } from 'vitest';
import { rgbToHsl } from '../src/vision/frameAnalyzer';

describe('Vision Frame Analysis: Color conversion math', () => {
  it('converts pure red (255, 0, 0) to HSL [0, 1, 0.5]', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 1);
    expect(s).toBeCloseTo(1, 1);
    expect(l).toBeCloseTo(0.5, 1);
  });

  it('converts pure ocean blue (0, 100, 255) to cool hue in range 200°-230°', () => {
    const [h, s, l] = rgbToHsl(0, 100, 255);
    expect(h).toBeGreaterThanOrEqual(210);
    expect(h).toBeLessThanOrEqual(220);
    expect(s).toBeGreaterThan(0.9);
  });

  it('converts grayscale neutral (128, 128, 128) to saturation 0', () => {
    const [h, s, l] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    expect(l).toBeCloseTo(0.502, 2);
  });
});
