import { describe, it, expect } from 'vitest';
import { anomalyToFrequency, frequencyToNoteName, ANOMALY_MIN, ANOMALY_MAX, FREQ_MIN, FREQ_MAX } from '../src/audio/sonify';

describe('Sonification Mapping', () => {
  it('maps +0.90 °C to approximately 733.33 Hz', () => {
    // Exact formula check:
    // t = (0.90 - (-0.5)) / (1.3 - (-0.5)) = 1.4 / 1.8 = 7/9
    // freq = 220 + (7/9) * (880 - 220) = 220 + 513.333... = 733.333... Hz
    const freq = anomalyToFrequency(0.90);
    expect(freq).toBeCloseTo(733.33, 1);
  });

  it('maps minimum anomaly (-0.5 °C) to 220 Hz (A3)', () => {
    expect(anomalyToFrequency(-0.5)).toBeCloseTo(220.0, 4);
    expect(frequencyToNoteName(220)).toBe('A3');
  });

  it('maps maximum anomaly (+1.3 °C) to 880 Hz (A5)', () => {
    expect(anomalyToFrequency(1.3)).toBeCloseTo(880.0, 4);
    expect(frequencyToNoteName(880)).toBe('A5');
  });

  it('clamps values below -0.5 °C to 220 Hz', () => {
    expect(anomalyToFrequency(-1.5)).toBe(220.0);
    expect(anomalyToFrequency(-0.51)).toBe(220.0);
  });

  it('clamps values above +1.3 °C to 880 Hz', () => {
    expect(anomalyToFrequency(1.31)).toBe(880.0);
    expect(anomalyToFrequency(2.5)).toBe(880.0);
  });

  it('strictly increases frequency as temperature anomaly increases', () => {
    const temps = [-0.5, -0.2, 0.0, 0.4, 0.7, 0.9, 1.1, 1.3];
    for (let i = 1; i < temps.length; i++) {
      expect(anomalyToFrequency(temps[i])).toBeGreaterThan(anomalyToFrequency(temps[i - 1]));
    }
  });

  it('converts common frequencies to nearest note names', () => {
    expect(frequencyToNoteName(440)).toBe('A4');
    expect(frequencyToNoteName(880)).toBe('A5');
    expect(frequencyToNoteName(220)).toBe('A3');
    expect(frequencyToNoteName(261.63)).toBe('C4');
  });
});
