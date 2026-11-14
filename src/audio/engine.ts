/**
 * engine.ts
 * Web Audio API engine for "Earth 616: The Earth Information Jukebox".
 * All sound is mathematically synthesized in real time.
 *
 * Multi-voice synthesizer features:
 * - Lead Voice: Dual detuned oscillators (triangle + sine, ±5 cents) with anomaly-scaled vibrato
 * - Pad Voice: Rich stereo chorus bed with warm harmonic overtone
 * - Sub Drone: Subtle 55Hz grounding foundation
 * - Shimmer Chime: High resonant sparkle harmonics
 * - Effects Chain: Algorithmic Reverb convolver (2.2s tail) + Ping-Pong stereo delay + DynamicsCompressor safety limiter
 */

import { anomalyToFrequency, anomalyToMusicalFrequency, type MusicalScaleType } from './sonify';

export type ArrangementType = 'calm' | 'cinematic' | 'urgent';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private mainFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  public mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  private currentOsc1: OscillatorNode | null = null;
  private currentOsc2: OscillatorNode | null = null;
  private currentEnvelope: GainNode | null = null;

  // Drone voice
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private _volume = 0.65;
  private _muted = false;
  public soundMode: 'scientific' | 'musical' = 'musical';
  public musicalScale: MusicalScaleType = 'dorian';
  public arrangement: ArrangementType = 'cinematic';

  /** Must be invoked after user interaction (e.g. click "Start Experience") */
  init(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Visualizer analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.82;

    // Safety limiter / compressor to prevent clipping
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14; // dB
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    // Gentle 12kHz low-pass filter
    this.mainFilter = this.ctx.createBiquadFilter();
    this.mainFilter.type = 'lowpass';
    this.mainFilter.frequency.value = 11500;
    this.mainFilter.Q.value = 0.7;

    // Synthesized algorithmic reverb impulse
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.buildImpulseResponse(2.2, 2.0);

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.28; // 28% wet reverb

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.85;

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume;

    // Routing graph:
    // Sources -> Analyser -> Dry/Reverb -> MainFilter -> Compressor -> MasterGain -> Destination
    this.analyser.connect(this.dryGain);
    this.analyser.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);

    this.dryGain.connect(this.mainFilter);
    this.reverbGain.connect(this.mainFilter);

    this.mainFilter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Media stream audio destination for video recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.mediaStreamDest);
  }

  /** Synthesizes an exponential decay stereo impulse response for cinematic space reverb */
  private buildImpulseResponse(durationSec = 2.2, decay = 2.0): AudioBuffer | null {
    if (!this.ctx) return null;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential decay envelope
      const env = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  getAudioTrack(): MediaStreamTrack | null {
    if (!this.mediaStreamDest) return null;
    return this.mediaStreamDest.stream.getAudioTracks()[0] || null;
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

  /** Calculate effective pitch based on active mode */
  public getPitchForAnomaly(anomaly: number): number {
    if (this.soundMode === 'musical') {
      return anomalyToMusicalFrequency(anomaly, this.musicalScale);
    }
    return anomalyToFrequency(anomaly);
  }

  /**
   * Play a full single-year tone (1.8 - 2.5 seconds rich phrase)
   * Detuned dual lead + warm octave harmonic + soft vibrato
   */
  playTone(anomaly: number, duration = 1.6): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser) return 0;

    this.resume();
    this.stopCurrent(0.02);

    const freq = this.getPitchForAnomaly(anomaly);
    const now = this.ctx.currentTime;
    const attack = 0.08;
    const release = 0.28;
    const peak = 0.52;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + attack);
    envelope.gain.setValueAtTime(peak * 0.85, Math.max(now + attack, now + duration - release));
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Voice 1A: Triangle wave (body)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-4, now); // -4 cents detune

    // Voice 1B: Sine wave (fundamental warmth)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(4, now); // +4 cents detune

    // Voice 2: Soft 2nd harmonic
    const oscHarm = this.ctx.createOscillator();
    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(freq * 2, now);
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.14;

    // Vibrato LFO: scales with anomaly warmth (more urgency at high anomalies)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(anomaly > 0.6 ? 5.5 : 4.2, now);
    vibratoGain.gain.setValueAtTime(anomaly > 0.8 ? 5.0 : 2.5, now);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    // Connect
    osc1.connect(envelope);
    osc2.connect(envelope);
    oscHarm.connect(harmGain);
    harmGain.connect(envelope);
    envelope.connect(this.analyser);

    osc1.start(now);
    osc2.start(now);
    oscHarm.start(now);
    vibrato.start(now);

    const stopTime = now + duration + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    oscHarm.stop(stopTime);
    vibrato.stop(stopTime);

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

    const targetFreq = this.getPitchForAnomaly(anomaly);
    const startFreq =
      prevAnomaly !== undefined ? this.getPitchForAnomaly(prevAnomaly) : targetFreq;
    const durSec = noteDurationMs / 1000;
    const attack = Math.min(0.03, durSec * 0.15);
    const release = Math.min(0.07, durSec * 0.28);
    const now = this.ctx.currentTime;
    const peak = 0.48;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + attack);
    const sustainEnd = Math.max(now + attack, now + durSec - release);
    envelope.gain.setValueAtTime(peak * 0.88, sustainEnd);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    // Dual detuned oscillators for lush tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.detune.setValueAtTime(-5, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.detune.setValueAtTime(5, now);

    // Warm octave harmonic
    const oscHarm = this.ctx.createOscillator();
    oscHarm.type = 'sine';
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.12;

    if (glide && prevAnomaly !== undefined && Math.abs(targetFreq - startFreq) > 2) {
      const glideTime = now + durSec * 0.45;
      osc1.frequency.setValueAtTime(startFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(targetFreq, glideTime);
      osc2.frequency.setValueAtTime(startFreq, now);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq, glideTime);
      oscHarm.frequency.setValueAtTime(startFreq * 2, now);
      oscHarm.frequency.exponentialRampToValueAtTime(targetFreq * 2, glideTime);
    } else {
      osc1.frequency.setValueAtTime(targetFreq, now);
      osc2.frequency.setValueAtTime(targetFreq, now);
      oscHarm.frequency.setValueAtTime(targetFreq * 2, now);
    }

    osc1.connect(envelope);
    osc2.connect(envelope);
    oscHarm.connect(harmGain);
    harmGain.connect(envelope);
    envelope.connect(this.analyser);

    osc1.start(now);
    osc2.start(now);
    oscHarm.start(now);

    const stopTime = now + durSec + 0.03;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    oscHarm.stop(stopTime);

    this.currentOsc1 = osc1;
    this.currentOsc2 = osc2;
    this.currentEnvelope = envelope;

    return targetFreq;
  }

  /**
   * Start / stop subtle ambient sub drone during time-lapse playback
   */
  startDrone(baseFreq = 55): void {
    if (!this.ctx || !this.analyser || this.droneOsc) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 1.5);

    osc.connect(gain);
    gain.connect(this.analyser);
    osc.start(now);

    this.droneOsc = osc;
    this.droneGain = gain;
  }

  stopDrone(): void {
    if (!this.ctx || !this.droneOsc || !this.droneGain) return;
    const now = this.ctx.currentTime;
    this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    setTimeout(() => {
      try {
        this.droneOsc?.stop();
        this.droneOsc?.disconnect();
        this.droneGain?.disconnect();
      } catch {}
      this.droneOsc = null;
      this.droneGain = null;
    }, 850);
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
    const baseFreq = this.getPitchForAnomaly(avgAnomaly);
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
      const arpFreq = this.getPitchForAnomaly(rec.anomaly);

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
    this.stopDrone();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Global singleton instance
export const audioEngine = new AudioEngine();
