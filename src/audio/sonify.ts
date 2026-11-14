/**
 * sonify.ts
 * Exact sonification rules:
 * - Anomaly range: -0.5 °C to +1.3 °C maps linearly to 220 Hz to 880 Hz (A3 to A5).
 * - Clamped outside the range.
 * - Higher temperature anomaly gives higher pitch.
 * - Test check: +0.90 °C produces ~733.33 Hz.
 */

export const ANOMALY_MIN = -0.5; // °C
export const ANOMALY_MAX = 1.3;  // °C
export const FREQ_MIN = 220.0;   // Hz (A3)
export const FREQ_MAX = 880.0;   // Hz (A5)

/**
 * Maps temperature anomaly in °C to frequency in Hz.
 * Linear mapping with hard clamping.
 */
export function anomalyToFrequency(anomaly: number): number {
  const clamped = Math.max(ANOMALY_MIN, Math.min(ANOMALY_MAX, anomaly));
  const t = (clamped - ANOMALY_MIN) / (ANOMALY_MAX - ANOMALY_MIN);
  return FREQ_MIN + t * (FREQ_MAX - FREQ_MIN);
}

/**
 * Find the nearest musical note name (e.g. A3, C#4, G5) from frequency in Hz.
 * Standard 12-TET with A4 = 440 Hz.
 */
export function frequencyToNoteName(freq: number): string {
  if (!Number.isFinite(freq) || freq <= 0) return 'A3';
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  // MIDI note 69 is A4 (440 Hz)
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}
