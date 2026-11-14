/**
 * engine.ts
 * Web Audio API engine for "Earth 616: The Earth Information Jukebox".
 * All sound is mathematically synthesized in real time.
 */

import { anomalyToFrequency } from './sonify';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  public analyser: AnalyserNode | null = null;

  private currentOsc1: OscillatorNode | null = null;
  private currentOsc2: OscillatorNode | null = null;
  private currentEnvelope: GainNode | null = null;

  private _volume = 0.65;
  private _muted = false;

  /** Must be invoked after user interaction (e.g. click "Start Experience") */
  init(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Visualizer analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // Safety limiter / compressor to prevent clipping and harsh loud tones
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12; // dB
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume;

    // Routing graph: Source Nodes -> Analyser -> Compressor -> Master Gain -> Speakers
    this.analyser.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  get isInitialized(): boolean {
    return this.ctx !== null;
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  set volume(val: number) {
    this._volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this._muted) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.03);
    }
  }

  get volume(): number {
    return this._volume;
  }

  set muted(m: boolean) {
    this._muted = m;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : this._volume, this.ctx.currentTime, 0.03);
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  /** Stop currently playing notes smoothly to avoid clicks */
  stopCurrent(fadeTime = 0.03): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.currentEnvelope) {
      this.currentEnvelope.gain.cancelScheduledValues(now);
      this.currentEnvelope.gain.setTargetAtTime(0.0001, now, fadeTime / 3);
    }

    const osc1 = this.currentOsc1;
    const osc2 = this.currentOsc2;
    const env = this.currentEnvelope;

    setTimeout(() => {
      try {
        osc1?.stop();
        osc1?.disconnect();
      } catch {}
      try {
        osc2?.stop();
        osc2?.disconnect();
      } catch {}
      try {
        env?.disconnect();
      } catch {}
    }, (fadeTime + 0.05) * 1000);

    this.currentOsc1 = null;
    this.currentOsc2 = null;
    this.currentEnvelope = null;
  }

  /**
   * Play a full single-year tone (1.2 seconds)
   * Warm sine + soft 2nd harmonic (octave higher, -14dB)
   */
  playTone(anomaly: number, duration = 1.2): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser) return 0;

    this.resume();
    this.stopCurrent(0.02);

    const freq = anomalyToFrequency(anomaly);
    const now = this.ctx.currentTime;
    const attack = 0.06;
    const release = 0.18;
    const peak = 0.55;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + attack);
    envelope.gain.setValueAtTime(peak, Math.max(now + attack, now + duration - release));
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Fundamental sine
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Second harmonic (warmth)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.16; // 16% second harmonic

    // Connect
    osc1.connect(envelope);
    osc2.connect(harmGain);
    harmGain.connect(envelope);
    envelope.connect(this.analyser);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.02);
    osc2.stop(now + duration + 0.02);

    this.currentOsc1 = osc1;
    this.currentOsc2 = osc2;
    this.currentEnvelope = envelope;

    return freq;
  }

  /**
   * Play a short note during time-lapse playback.
   * Can smoothly glide (portamento) from previous pitch if enabled.
   */
  playNote(anomaly: number, noteDurationMs = 220, prevAnomaly?: number, glide = false): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser) return 0;

    this.resume();
    this.stopCurrent(0.015);

    const targetFreq = anomalyToFrequency(anomaly);
    const startFreq = prevAnomaly !== undefined ? anomalyToFrequency(prevAnomaly) : targetFreq;
    const durSec = noteDurationMs / 1000;
    const attack = Math.min(0.025, durSec * 0.15);
    const release = Math.min(0.06, durSec * 0.25);
    const now = this.ctx.currentTime;
    const peak = 0.5;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + attack);
    const sustainEnd = Math.max(now + attack, now + durSec - release);
    envelope.gain.setValueAtTime(peak, sustainEnd);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.15;

    if (glide && prevAnomaly !== undefined && Math.abs(targetFreq - startFreq) > 2) {
      osc1.frequency.setValueAtTime(startFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, now + durSec * 0.45);
      osc2.frequency.setValueAtTime(startFreq * 2, now);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq * 2, now + durSec * 0.45);
    } else {
      osc1.frequency.setValueAtTime(targetFreq, now);
      osc2.frequency.setValueAtTime(targetFreq * 2, now);
    }

    osc1.connect(envelope);
    osc2.connect(harmGain);
    harmGain.connect(envelope);
    envelope.connect(this.analyser);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durSec + 0.02);
    osc2.stop(now + durSec + 0.02);

    this.currentOsc1 = osc1;
    this.currentOsc2 = osc2;
    this.currentEnvelope = envelope;

    return targetFreq;
  }

  /**
   * Play a decade chord:
   * Sustained warm chord based on decade average anomaly,
   * with the 10 individual yearly records arpeggiated across 2.5s.
   */
  playDecadeChord(
    decadeRecords: { year: number; anomaly: number }[],
    onArpYear?: (year: number) => void
  ): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser || decadeRecords.length === 0) return 0;

    this.resume();
    this.stopCurrent(0.02);

    const avgAnomaly =
      decadeRecords.reduce((acc, r) => acc + r.anomaly, 0) / decadeRecords.length;
    const baseFreq = anomalyToFrequency(avgAnomaly);
    const now = this.ctx.currentTime;
    const totalDuration = 2.8;

    // Sustained pad envelope
    const padEnv = this.ctx.createGain();
    padEnv.gain.setValueAtTime(0.0001, now);
    padEnv.gain.linearRampToValueAtTime(0.35, now + 0.3);
    padEnv.gain.setValueAtTime(0.35, now + totalDuration - 0.5);
    padEnv.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    // Root tone
    const oscRoot = this.ctx.createOscillator();
    oscRoot.type = 'sine';
    oscRoot.frequency.setValueAtTime(baseFreq, now);

    // Sub octave for depth
    const oscSub = this.ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(baseFreq * 0.5, now);
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.25;

    // 2nd harmonic
    const oscHarm = this.ctx.createOscillator();
    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(baseFreq * 2, now);
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.15;

    oscRoot.connect(padEnv);
    oscSub.connect(subGain);
    subGain.connect(padEnv);
    oscHarm.connect(harmGain);
    harmGain.connect(padEnv);
    padEnv.connect(this.analyser);

    oscRoot.start(now);
    oscSub.start(now);
    oscHarm.start(now);
    oscRoot.stop(now + totalDuration + 0.05);
    oscSub.stop(now + totalDuration + 0.05);
    oscHarm.stop(now + totalDuration + 0.05);

    // Arpeggiate the 10 years across the pad
    const stepDur = (totalDuration - 0.4) / decadeRecords.length;
    decadeRecords.forEach((rec, idx) => {
      const arpTime = now + 0.1 + idx * stepDur;
      const arpFreq = anomalyToFrequency(rec.anomaly);

      const arpEnv = this.ctx!.createGain();
      arpEnv.gain.setValueAtTime(0.0001, arpTime);
      arpEnv.gain.exponentialRampToValueAtTime(0.3, arpTime + 0.02);
      arpEnv.gain.exponentialRampToValueAtTime(0.0001, arpTime + stepDur * 0.95);

      const arpOsc = this.ctx!.createOscillator();
      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, arpTime);

      arpOsc.connect(arpEnv);
      arpEnv.connect(this.analyser!);

      arpOsc.start(arpTime);
      arpOsc.stop(arpTime + stepDur);

      setTimeout(() => {
        onArpYear?.(rec.year);
      }, (0.1 + idx * stepDur) * 1000);
    });

    return avgAnomaly;
  }

  dispose(): void {
    this.stopCurrent(0);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Global singleton instance
export const audioEngine = new AudioEngine();
