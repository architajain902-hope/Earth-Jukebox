import { describe, it, expect } from 'vitest';
import { rgbToHsl, analyzePixelData } from '../src/vision/frameAnalyzer';

describe('Vision Frame Analysis: Color conversion math', () => {
  it('converts pure red (255, 0, 0) to HSL [0, 1, 0.5]', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 1);
    expect(s).toBeCloseTo(1, 1);
    expect(l).toBeCloseTo(0.5, 1);
  });

  it('converts cool blue (0, 100, 255) to cool hue in range 200°-230°', () => {
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

describe('Vision Frame Analysis: Known Synthetic Images', () => {
  it('correctly analyzes a fully dark image', () => {
    const width = 96;
    const height = 48;
    const darkPixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < darkPixels.length; i += 4) {
      darkPixels[i] = 0;     // R
      darkPixels[i + 1] = 0; // G
      darkPixels[i + 2] = 0; // B
      darkPixels[i + 3] = 255; // A
    }

    const result = analyzePixelData(darkPixels, width, height, 'Fully black test frame.');
    expect(result.averageBrightness).toBe(0);
    expect(result.edgeDensity).toBe(0);
    expect(result.accessibleDescription).toContain('Fully black test frame.');
    expect(result.accessibleDescription).toContain('0%');
  });

  it('correctly analyzes a bright warm image (pure orange)', () => {
    const width = 96;
    const height = 48;
    const warmPixels = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < warmPixels.length; i += 4) {
      warmPixels[i] = 255;   // R
      warmPixels[i + 1] = 128; // G
      warmPixels[i + 2] = 0;   // B
      warmPixels[i + 3] = 255; // A
    }

    const sourceDesc = 'A world map of night lights. Purple shows where light increased, orange where it decreased, between 2012 and 2023.';
    const result = analyzePixelData(warmPixels, width, height, sourceDesc);

    expect(result.averageBrightness).toBeGreaterThan(0.4);
    expect(result.warmCoolRatio).toBe(1); // 100% warm
    expect(result.recommendedScale).toBe('aeolian'); // Warm palette maps to aeolian
    expect(result.dominantHueName).toMatch(/Orange|Amber/);
    expect(result.accessibleDescription).toContain(sourceDesc);
    expect(result.accessibleDescription).toContain('100% warm');
    expect(result.accessibleDescription).not.toContain('oceans, ice, atmosphere');
  });
});
