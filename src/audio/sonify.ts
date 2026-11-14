/**
 * sonify.ts
 * Exact sonification rules:
 * - Anomaly range: -0.5 °C to +1.3 °C maps linearly to 220 Hz to 880 Hz (A3 to A5).
 * - Clamped outside the range.
 * - Higher temperature anomaly gives higher pitch.
 * - Test check: +0.90 °C produces ~733.33 Hz.
 *
 * Musical Mode:
 * Quantizes exact frequency to an emotionally resonant, harmonious scale
 * while strictly maintaining monotonicity (higher anomaly never produces lower note).
 */

export const ANOMALY_MIN = -0.5; // °C
export const ANOMALY_MAX = 1.3;  // °C
export const FREQ_MIN = 220.0;   // Hz (A3)
export const FREQ_MAX = 880.0;   // Hz (A5)

export type MusicalScaleType = 'pentatonic' | 'dorian' | 'lydian' | 'aeolian';

// Scale interval definitions relative to root note A (A3 = MIDI 57)
// A3=57, B3=59, C4=60, D4=62, E4=64, F#4=66, G4=67, A4=69, ...
const SCALE_INTERVALS: Record<MusicalScaleType, number[]> = {
  // A Minor Pentatonic: A, C, D, E, G (spacious, contemplative, beautiful)
  pentatonic: [0, 3, 5, 7, 10],
  // A Dorian: A, B, C, D, E, F#, G (hopeful, cinematic, ethereal)
  dorian: [0, 2, 3, 5, 7, 9, 10],
  // A Lydian: A, B, C#, D#, E, F#, G# (bright, majestic)
  lydian: [0, 2, 4, 6, 7, 9, 11],
  // A Aeolian / Natural Minor: A, B, C, D, E, F, G (poignant, urgent climate narrative)
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};

/** Precomputes allowed MIDI notes across A3 (57) to A5 (81) for each scale */
function buildScaleNotes(scaleType: MusicalScaleType): number[] {
  const rootMidi = 57; // A3
  const intervals = SCALE_INTERVALS[scaleType];
  const notes: number[] = [];

  for (let octave = 0; octave <= 2; octave++) {
    for (const interval of intervals) {
      const midi = rootMidi + octave * 12 + interval;
      if (midi <= 81) {
        notes.push(midi);
      }
    }
  }
  return notes.sort((a, b) => a - b);
}

const SCALE_NOTES: Record<MusicalScaleType, number[]> = {
  pentatonic: buildScaleNotes('pentatonic'),
  dorian: buildScaleNotes('dorian'),
  lydian: buildScaleNotes('lydian'),
  aeolian: buildScaleNotes('aeolian'),
};

/**
 * Maps temperature anomaly in °C to frequency in Hz.
 * Linear mapping with hard clamping.
 * Fixed, never-changing mapping:
 * -0.5 °C -> 220 Hz
 * +1.3 °C -> 880 Hz
 * +0.90 °C -> ~733.33 Hz
 */
export function anomalyToFrequency(anomaly: number): number {
  const clamped = Math.max(ANOMALY_MIN, Math.min(ANOMALY_MAX, anomaly));
  const t = (clamped - ANOMALY_MIN) / (ANOMALY_MAX - ANOMALY_MIN);
  return FREQ_MIN + t * (FREQ_MAX - FREQ_MIN);
}

/**
 * Quantizes an exact linear frequency to a musical scale.
 * Strictly monotonic: if a1 <= a2, then anomalyToMusicalFrequency(a1) <= anomalyToMusicalFrequency(a2).
 */
export function anomalyToMusicalFrequency(
  anomaly: number,
  scaleType: MusicalScaleType = 'dorian'
): number {
  const rawFreq = anomalyToFrequency(anomaly);
  // Continuous MIDI note number: A4 (440 Hz) is MIDI 69
  const continuousMidi = 69 + 12 * Math.log2(rawFreq / 440);

  const notes = SCALE_NOTES[scaleType] || SCALE_NOTES.dorian;

  // Monotonic step search: find closest scale note without inversions
  let closestMidi = notes[0];
  let minDiff = Math.abs(continuousMidi - notes[0]);

  for (let i = 1; i < notes.length; i++) {
    const diff = Math.abs(continuousMidi - notes[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestMidi = notes[i];
    }
  }

  // Convert MIDI note back to Hz: 440 * 2^((midi - 69) / 12)
  return 440 * Math.pow(2, (closestMidi - 69) / 12);
}

/**
 * Find the nearest musical note name (e.g. A3, C♯4, G5) from frequency in Hz.
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
