/**
 * frameSonifier.ts
 * Real-time synthesis engine marrying NASA GISTEMP numerical data with
 * NASA Earth Information Center (EIC) visual frame analysis.
 *
 * The Core Architectural Rule:
 * 1. WHAT THE DATA DECIDES: The fundamental pitch center (A3 to A5) is anchored strictly
 *    to the NASA GISTEMP temperature anomaly. Science is never distorted.
 * 2. WHAT THE FRAME DECIDES: Musical scale mode, harmonic voicings, filter brightness,
 *    stereo panning, arpeggio speed, and texture shimmer are extracted by computer vision
 *    from the visual frame.
 */

import { audioEngine } from '../audio/engine';
import { anomalyToFrequency, anomalyToMusicalFrequency } from '../audio/sonify';
import type { FrameAnalysisResult } from './frameAnalyzer';

export interface SonifierState {
  isPlaying: boolean;
  playheadColumn: number; // 0 to 95
  currentFrequency: number;
  scaleMode: string;
}

export class FrameSonifier {
  private isRunning = false;
  private currentColumn = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private analysis: FrameAnalysisResult | null = null;
  private currentAnomaly = 0;
  private onTickCallback: ((col: number, freq: number) => void) | null = null;

  public setAnalysis(analysis: FrameAnalysisResult, anomaly: number): void {
    this.analysis = analysis;
    this.currentAnomaly = anomaly;
  }

  public start(
    analysis: FrameAnalysisResult,
    anomaly: number,
    onTick: (col: number, freq: number) => void
  ): void {
    this.stop();
    this.analysis = analysis;
    this.currentAnomaly = anomaly;
    this.onTickCallback = onTick;
    this.isRunning = true;
    this.currentColumn = 0;

    audioEngine.init();
    audioEngine.resume();

    // Edge density sets tempo / step interval: 50ms (fast/complex) to 140ms (smooth/spacious)
    const stepIntervalMs = Math.round(140 - analysis.edgeDensity * 80);

    // Fundamental root from NASA data
    const rootFreq = anomalyToFrequency(this.currentAnomaly);

    // Play initial foundation pad
    audioEngine.playTone(this.currentAnomaly, 2.0);

    this.timerId = setInterval(() => {
      if (!this.isRunning || !this.analysis) return;

      const cols = this.analysis.columnProfiles;
      if (!cols || cols.length === 0) return;

      const col = cols[this.currentColumn];
      // Note frequency derived from column hue + vertical centroid within scale
      const noteFreq = this.calculateColumnFrequency(col, rootFreq, this.analysis.recommendedScale);

      // Play short column chime
      this.playColumnChime(col, noteFreq);

      this.onTickCallback?.(this.currentColumn, noteFreq);

      this.currentColumn = (this.currentColumn + 1) % cols.length;
    }, stepIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  get isPlaying(): boolean {
    return this.isRunning;
  }

  private calculateColumnFrequency(
    col: { hue: number; verticalCentroid: number; brightness: number },
    rootFreq: number,
    scaleType: 'pentatonic' | 'dorian' | 'lydian' | 'aeolian'
  ): number {
    // Quantize into scale steps around the data root
    const normalizedPitch = Math.max(-0.5, Math.min(1.3, this.currentAnomaly + (0.5 - col.verticalCentroid) * 0.6));
    return anomalyToMusicalFrequency(normalizedPitch, scaleType);
  }

  private playColumnChime(
    col: { saturation: number; brightness: number; edgeEnergy: number },
    freq: number
  ): void {
    const ctx = (audioEngine as any).ctx;
    const analyser = audioEngine.analyser;
    if (!ctx || !analyser) return;

    const now = ctx.currentTime;
    const durSec = 0.12;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.24 * Math.max(0.2, col.brightness), now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    // Stereo Panner (maps column position horizontally)
    let pannerNode: StereoPannerNode | null = null;
    if ('createStereoPanner' in ctx) {
      pannerNode = ctx.createStereoPanner();
      if (pannerNode) {
        const panVal = (this.currentColumn / 96) * 1.8 - 0.9; // -0.9 (left) to +0.9 (right)
        pannerNode.pan.setValueAtTime(panVal, now);
      }
    }

    const osc = ctx.createOscillator();
    osc.type = col.edgeEnergy > 0.3 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    if (pannerNode) {
      osc.connect(env);
      env.connect(pannerNode);
      pannerNode.connect(analyser);
    } else {
      osc.connect(env);
      env.connect(analyser);
    }

    osc.start(now);
    osc.stop(now + durSec + 0.02);
  }

  /**
   * Generates a complete 30-second offline WAV soundscape for download
   */
  public async exportSoundscapeWav(
    analysis: FrameAnalysisResult,
    anomaly: number
  ): Promise<Blob> {
    const sampleRate = 44100;
    const duration = 24.0; // 24 seconds loop
    const totalSamples = Math.floor(sampleRate * duration);

    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    // Root pad tone
    const rootFreq = anomalyToFrequency(anomaly);
    const padOsc = offlineCtx.createOscillator();
    padOsc.type = 'triangle';
    padOsc.frequency.setValueAtTime(rootFreq, 0);

    const padEnv = offlineCtx.createGain();
    padEnv.gain.setValueAtTime(0.0001, 0);
    padEnv.gain.linearRampToValueAtTime(0.3, 2.0);
    padEnv.gain.setValueAtTime(0.3, duration - 3.0);
    padEnv.gain.exponentialRampToValueAtTime(0.0001, duration);

    padOsc.connect(padEnv);
    padEnv.connect(offlineCtx.destination);
    padOsc.start(0);
    padOsc.stop(duration);

    // Iterate through columns as arpeggiated chimes
    const cols = analysis.columnProfiles;
    const stepDur = duration / (cols.length * 2);

    for (let loop = 0; loop < 2; loop++) {
      cols.forEach((col, idx) => {
        const time = (loop * cols.length + idx) * stepDur;
        if (time >= duration - 0.2) return;

        const chimeFreq = this.calculateColumnFrequency(col, rootFreq, analysis.recommendedScale);
        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(chimeFreq, time);

        const env = offlineCtx.createGain();
        env.gain.setValueAtTime(0.0001, time);
        env.gain.linearRampToValueAtTime(0.18 * Math.max(0.3, col.brightness), time + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

        osc.connect(env);
        env.connect(offlineCtx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      });
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWavBlob(renderedBuffer);
  }

  private bufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF chunk
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // fmt subchunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // 16 for PCM
    setUint16(1); // PCM format
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // 16-bit

    // data subchunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out], { type: 'audio/wav' });
  }
}

export const frameSonifier = new FrameSonifier();
