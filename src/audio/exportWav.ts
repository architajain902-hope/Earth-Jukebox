/**
 * exportWav.ts
 * In-browser synthesis of time-lapse audio into a standard 44.1 kHz 16-bit PCM WAV file
 * using Web Audio API's OfflineAudioContext.
 * Zero external dependencies.
 */

import type { AnomalyRecord } from '../data/types';
import { anomalyToFrequency } from './sonify';

/**
 * Generate a WAV audio file from an array of temperature records
 * @param records Anomaly records to render
 * @param noteDurationMs Duration of each yearly note in ms (default 180ms)
 * @returns Blob representing the WAV audio
 */
export async function renderTimelapseToWav(
  records: AnomalyRecord[],
  noteDurationMs = 180
): Promise<Blob> {
  const sampleRate = 44100;
  const noteDurationSec = noteDurationMs / 1000;
  const totalDurationSec = records.length * noteDurationSec + 0.5; // padding for decay
  const totalFrames = Math.ceil(totalDurationSec * sampleRate);

  // Create OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(1, totalFrames, sampleRate);

  // Limiter / Compressor in offline rendering
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -10;
  compressor.knee.value = 4;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.1;
  compressor.connect(offlineCtx.destination);

  // Master Gain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(compressor);

  // Schedule each year's synthesized note
  records.forEach((rec, idx) => {
    const startTime = idx * noteDurationSec;
    const freq = anomalyToFrequency(rec.anomaly);

    const attack = Math.min(0.02, noteDurationSec * 0.15);
    const release = Math.min(0.05, noteDurationSec * 0.25);

    const env = offlineCtx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.exponentialRampToValueAtTime(0.5, startTime + attack);
    const sustainEnd = Math.max(startTime + attack, startTime + noteDurationSec - release);
    env.gain.setValueAtTime(0.5, sustainEnd);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDurationSec);

    // Fundamental Sine
    const osc1 = offlineCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Soft 2nd harmonic
    const osc2 = offlineCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const harmGain = offlineCtx.createGain();
    harmGain.gain.value = 0.16;

    osc1.connect(env);
    osc2.connect(harmGain);
    harmGain.connect(env);
    env.connect(masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + noteDurationSec + 0.02);
    osc2.stop(startTime + noteDurationSec + 0.02);
  });

  // Render audio buffer
  const audioBuffer = await offlineCtx.startRendering();

  // Convert AudioBuffer to 16-bit PCM WAV Blob
  return audioBufferToWavBlob(audioBuffer);
}

/** Convert AudioBuffer to 16-bit PCM WAV formatted Blob */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = buffer.getChannelData(0);
  const dataByteLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataByteLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');

  // fmt Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk1Size (16 for PCM)
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < data.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
