import { describe, it, expect } from 'vitest';
import {
  anomalyToFrequency,
  anomalyToMusicalFrequency,
  frequencyToNoteName,
  ANOMALY_MIN,
  ANOMALY_MAX,
  FREQ_MIN,
  FREQ_MAX,
} from '../src/audio/sonify';
import { audioEngine } from '../src/audio/engine';

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

  it('never outputs NaN or non-finite numbers', () => {
    const edgeValues = [-999, -0.5, 0, 1.3, 999];
    edgeValues.forEach((val) => {
      const f = anomalyToFrequency(val);
      expect(Number.isFinite(f)).toBe(true);
      expect(isNaN(f)).toBe(false);
      expect(f).toBeGreaterThanOrEqual(FREQ_MIN);
      expect(f).toBeLessThanOrEqual(FREQ_MAX);
    });
  });

  it('converts common frequencies to nearest note names', () => {
    expect(frequencyToNoteName(440)).toBe('A4');
    expect(frequencyToNoteName(880)).toBe('A5');
    expect(frequencyToNoteName(220)).toBe('A3');
    expect(frequencyToNoteName(261.63)).toBe('C4');
  });

  describe('Musical Mode Quantization', () => {
    const scales: Array<'pentatonic' | 'dorian' | 'lydian' | 'aeolian'> = [
      'pentatonic',
      'dorian',
      'lydian',
      'aeolian',
    ];

    it.each(scales)(
      'is strictly monotonic for scale %s: higher anomaly never produces lower pitch',
      (scale) => {
        const temps = [-0.5, -0.4, -0.25, -0.1, 0.0, 0.15, 0.35, 0.6, 0.85, 1.0, 1.25, 1.3];
        for (let i = 1; i < temps.length; i++) {
          const prevFreq = anomalyToMusicalFrequency(temps[i - 1], scale);
          const currFreq = anomalyToMusicalFrequency(temps[i], scale);
          expect(currFreq).toBeGreaterThanOrEqual(prevFreq);
        }
      }
    );

    it('quantizes to valid frequencies within the 220Hz - 880Hz envelope', () => {
      expect(anomalyToMusicalFrequency(-0.5, 'pentatonic')).toBeCloseTo(220.0, 1);
      expect(anomalyToMusicalFrequency(1.3, 'pentatonic')).toBeCloseTo(880.0, 1);
      const midFreq = anomalyToMusicalFrequency(0.4, 'pentatonic');
      expect(midFreq).toBeGreaterThanOrEqual(220.0);
      expect(midFreq).toBeLessThanOrEqual(880.0);
    });

    it('never produces NaN for extreme inputs in musical scales', () => {
      scales.forEach((s) => {
        const low = anomalyToMusicalFrequency(-50, s);
        const high = anomalyToMusicalFrequency(50, s);
        expect(Number.isFinite(low)).toBe(true);
        expect(Number.isFinite(high)).toBe(true);
      });
    });
  });

  describe('Sound Engine & Gain Ceiling', () => {
    it('enforces safe master volume bounds [0, 1]', () => {
      audioEngine.volume = 2.5;
      expect(audioEngine.volume).toBeLessThanOrEqual(1.0);
      audioEngine.volume = -0.5;
      expect(audioEngine.volume).toBeGreaterThanOrEqual(0.0);
      audioEngine.volume = 0.65; // restore normal
    });

    it('preserves instrument level ranges between 0 and 1', () => {
      const levels = audioEngine.instrumentLevels;
      expect(levels.pad).toBeGreaterThanOrEqual(0);
      expect(levels.pad).toBeLessThanOrEqual(1);
      expect(levels.bell).toBeGreaterThanOrEqual(0);
      expect(levels.bell).toBeLessThanOrEqual(1);
      expect(levels.drone).toBeGreaterThanOrEqual(0);
      expect(levels.drone).toBeLessThanOrEqual(1);
      expect(levels.arp).toBeGreaterThanOrEqual(0);
      expect(levels.arp).toBeLessThanOrEqual(1);
    });

    it('supports presets without throwing or altering pitch logic', () => {
      audioEngine.applyArrangementPreset('calm');
      expect(audioEngine.arrangement).toBe('calm');
      audioEngine.applyArrangementPreset('urgent');
      expect(audioEngine.arrangement).toBe('urgent');
      audioEngine.applyArrangementPreset('cinematic');
      expect(audioEngine.arrangement).toBe('cinematic');

      // Test pitch invariance under presets
      const pitch1 = audioEngine.getPitchForAnomaly(0.5);
      audioEngine.applyArrangementPreset('calm');
      const pitch2 = audioEngine.getPitchForAnomaly(0.5);
      expect(pitch1).toBe(pitch2);
    });
  });
});
