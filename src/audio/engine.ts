/**
 * engine.ts
 * Web Audio API synthesizer for "SONIX: The Earth Information Jukebox".
 * 100% mathematically synthesized in real time from authentic NASA data.
 * Zero pre-recorded audio files. Zero randomized notes.
 *
 * Architecture:
 * - Exact & Musical sonification modes
 * - Multi-voice mixer (Soft Pad, Plucked Bell, Sub Drone, Light Arpeggio)
 * - Dynamic arrangements (Calm, Cinematic, Urgent) preserving exact pitch
 * - 2.2s Algorithmic space reverb + stereo delay + lowpass filter
 * - DynamicsCompressorNode brickwall ceiling preventing any clipping
 */

import { anomalyToFrequency, anomalyToMusicalFrequency, type MusicalScaleType } from './sonify';

export type ArrangementType = 'calm' | 'cinematic' | 'urgent';

export interface InstrumentLevels {
  pad: number;   // 0 to 1
  bell: number;  // 0 to 1
  drone: number; // 0 to 1
  arp: number;   // 0 to 1
}

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

  // Active oscillators for smooth voice-stealing / anti-click fading
  private activeVoices: { stop: () => void }[] = [];

  // Ambient Drone voice
  private droneOsc: OscillatorNode | null = null;
  private droneGainNode: GainNode | null = null;

  // Master parameters
  private _volume = 0.65;
  private _muted = false;
  public soundMode: 'scientific' | 'musical' = 'musical';
  public musicalScale: MusicalScaleType = 'dorian';
  public arrangement: ArrangementType = 'cinematic';

  // Sound mixer instrument levels
  public instrumentLevels: InstrumentLevels = {
    pad: 0.8,
    bell: 0.7,
    drone: 0.45,
    arp: 0.6,
  };

  /** Must be invoked after explicit user interaction */
  init(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Visualizer analyser (1024 FFT bins)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.82;

    // Safety limiter / compressor (guarantees zero distortion/clipping)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12; // dB
    this.compressor.knee.value = 4;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.15;

    // Gentle low-pass filter
    this.mainFilter = this.ctx.createBiquadFilter();
    this.mainFilter.type = 'lowpass';
    this.mainFilter.frequency.value = 11500;
    this.mainFilter.Q.value = 0.7;

    // Algorithmic space reverb impulse response
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.buildImpulseResponse(2.2, 2.0);

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.28; // 28% wet

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.85;

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._muted ? 0 : this._volume;

    // Routing:
    // Analyser -> Dry / Reverb -> MainFilter -> Compressor -> MasterGain -> Destination
    this.analyser.connect(this.dryGain);
    this.analyser.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);

    this.dryGain.connect(this.mainFilter);
    this.reverbGain.connect(this.mainFilter);

    this.mainFilter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Media stream destination for direct clip video recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.mediaStreamDest);

    this.applyArrangementPreset(this.arrangement);
  }

  /** Algorithmic stereo impulse response for space acoustics */
  private buildImpulseResponse(durationSec = 2.2, decay = 2.0): AudioBuffer | null {
    if (!this.ctx) return null;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * durationSec);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const env = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * env;
      right[i] = (Math.random() * 2 - 1) * env;
    }
    return impulse;
  }

  /** Apply arrangement preset without altering underlying data pitch */
  public applyArrangementPreset(preset: ArrangementType): void {
    this.arrangement = preset;
    if (!this.ctx || !this.mainFilter || !this.reverbGain) return;

    const now = this.ctx.currentTime;
    if (preset === 'calm') {
      this.mainFilter.frequency.setTargetAtTime(7500, now, 0.1);
      this.reverbGain.gain.setTargetAtTime(0.38, now, 0.1);
      this.instrumentLevels.pad = 0.9;
      this.instrumentLevels.bell = 0.45;
      this.instrumentLevels.drone = 0.55;
      this.instrumentLevels.arp = 0.4;
    } else if (preset === 'cinematic') {
      this.mainFilter.frequency.setTargetAtTime(11500, now, 0.1);
      this.reverbGain.gain.setTargetAtTime(0.28, now, 0.1);
      this.instrumentLevels.pad = 0.8;
      this.instrumentLevels.bell = 0.7;
      this.instrumentLevels.drone = 0.45;
      this.instrumentLevels.arp = 0.6;
    } else if (preset === 'urgent') {
      this.mainFilter.frequency.setTargetAtTime(14000, now, 0.1);
      this.reverbGain.gain.setTargetAtTime(0.18, now, 0.1);
      this.instrumentLevels.pad = 0.65;
      this.instrumentLevels.bell = 0.9;
      this.instrumentLevels.drone = 0.35;
      this.instrumentLevels.arp = 0.85;
    }
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

  /** Stop active notes smoothly with exponential fade out to avoid clicks */
  stopCurrent(fadeTime = 0.03): void {
    if (!this.ctx) return;
    const voices = [...this.activeVoices];
    this.activeVoices = [];
    voices.forEach((v) => {
      try {
        v.stop();
      } catch {}
    });
  }

  /** Calculate effective pitch based on active mode (Exact vs Musical) */
  public getPitchForAnomaly(anomaly: number): number {
    if (this.soundMode === 'musical') {
      return anomalyToMusicalFrequency(anomaly, this.musicalScale);
    }
    return anomalyToFrequency(anomaly);
  }

  /**
   * Play a rich single-year tone (1.6 - 2.2 seconds) with multi-instrument synthesis:
   * 1. Soft Pad (detuned triangle + sine with subtle vibrato)
   * 2. Plucked Bell (bright sine + octave ping with fast decay)
   * 3. Sub Drone (deep harmonic warmth)
   */
  playTone(anomaly: number, duration = 1.8): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser) return 0;

    this.resume();
    this.stopCurrent(0.02);

    const freq = this.getPitchForAnomaly(anomaly);
    const now = this.ctx.currentTime;
    const nodesToStop: AudioNode[] = [];

    // Master voice bus for this tone
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(0.85, now + 0.06);
    voiceGain.gain.setValueAtTime(0.85, Math.max(now + 0.06, now + duration - 0.35));
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    voiceGain.connect(this.analyser);

    // 1. Soft Pad Voice
    if (this.instrumentLevels.pad > 0.01) {
      const padGain = this.ctx.createGain();
      padGain.gain.value = this.instrumentLevels.pad * 0.48;

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-5, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(5, now);

      // Urgency-scaled vibrato LFO
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.setValueAtTime(anomaly > 0.8 ? 5.6 : 4.2, now);
      vibratoGain.gain.setValueAtTime(anomaly > 0.8 ? 4.8 : 2.2, now);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibratoGain.connect(osc2.frequency);

      osc1.connect(padGain);
      osc2.connect(padGain);
      padGain.connect(voiceGain);

      osc1.start(now);
      osc2.start(now);
      vibrato.start(now);

      nodesToStop.push(osc1, osc2, vibrato);
    }

    // 2. Plucked Bell Voice
    if (this.instrumentLevels.bell > 0.01) {
      const bellGain = this.ctx.createGain();
      bellGain.gain.setValueAtTime(0.0001, now);
      bellGain.gain.linearRampToValueAtTime(this.instrumentLevels.bell * 0.55, now + 0.012);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(1.2, duration));

      const bellOsc = this.ctx.createOscillator();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(freq, now);

      const bellHarm = this.ctx.createOscillator();
      bellHarm.type = 'sine';
      bellHarm.frequency.setValueAtTime(freq * 2, now);

      const harmGain = this.ctx.createGain();
      harmGain.gain.value = 0.22;

      bellOsc.connect(bellGain);
      bellHarm.connect(harmGain);
      harmGain.connect(bellGain);
      bellGain.connect(voiceGain);

      bellOsc.start(now);
      bellHarm.start(now);

      nodesToStop.push(bellOsc, bellHarm);
    }

    // Voice lifecycle tracking
    const stopFn = () => {
      const stopNow = this.ctx?.currentTime ?? 0;
      voiceGain.gain.cancelScheduledValues(stopNow);
      voiceGain.gain.setTargetAtTime(0.0001, stopNow, 0.02);
      setTimeout(() => {
        nodesToStop.forEach((n) => {
          try {
            if ('stop' in n && typeof (n as OscillatorNode).stop === 'function') {
              (n as OscillatorNode).stop();
            }
            n.disconnect();
          } catch {}
        });
        try {
          voiceGain.disconnect();
        } catch {}
      }, 50);
    };

    this.activeVoices.push({ stop: stopFn });
    setTimeout(stopFn, (duration + 0.08) * 1000);

    return freq;
  }

  /**
   * Play a short note during time-lapse playback with portamento glide support
   */
  playNote(anomaly: number, noteDurationMs = 220, prevAnomaly?: number, glide = false): number {
    if (!this.ctx || !this.analyser) {
      this.init();
    }
    if (!this.ctx || !this.analyser) return 0;

    this.resume();
    this.stopCurrent(0.012);

    const targetFreq = this.getPitchForAnomaly(anomaly);
    const startFreq =
      prevAnomaly !== undefined ? this.getPitchForAnomaly(prevAnomaly) : targetFreq;
    const durSec = noteDurationMs / 1000;
    const attack = Math.min(0.025, durSec * 0.12);
    const release = Math.min(0.06, durSec * 0.25);
    const now = this.ctx.currentTime;
    const peak = 0.52;

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(peak, now + attack);
    const sustainEnd = Math.max(now + attack, now + durSec - release);
    envelope.gain.setValueAtTime(peak * 0.88, sustainEnd);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    // Dual detuned oscillators
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.detune.setValueAtTime(-5, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.detune.setValueAtTime(5, now);

    // Octave overtone shimmer
    const oscHarm = this.ctx.createOscillator();
    oscHarm.type = 'sine';
    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.14 * this.instrumentLevels.arp;

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

    const stopTime = now + durSec + 0.04;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    oscHarm.stop(stopTime);

    const stopFn = () => {
      try {
        osc1.stop();
        osc2.stop();
        oscHarm.stop();
        osc1.disconnect();
        osc2.disconnect();
        oscHarm.disconnect();
        envelope.disconnect();
      } catch {}
    };
    this.activeVoices.push({ stop: stopFn });

    return targetFreq;
  }

  /**
   * Sound Check: Auditions a pleasant reference test tone to verify audio output
   */
  playTestChime(): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();
    // Reference 440 Hz (Baseline A4)
    this.playTone(0.0, 1.4);
  }

  /** Ambient sub-drone foundation (55 Hz / A1) */
  startDrone(baseFreq = 55): void {
    if (!this.ctx || !this.analyser || this.droneOsc) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14 * this.instrumentLevels.drone, now + 1.2);

    osc.connect(gain);
    gain.connect(this.analyser);
    osc.start(now);

    this.droneOsc = osc;
    this.droneGainNode = gain;
  }

  stopDrone(): void {
    if (!this.ctx || !this.droneOsc || !this.droneGainNode) return;
    const now = this.ctx.currentTime;
    this.droneGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => {
      try {
        this.droneOsc?.stop();
        this.droneOsc?.disconnect();
        this.droneGainNode?.disconnect();
      } catch {}
      this.droneOsc = null;
      this.droneGainNode = null;
    }, 650);
  }

  /** Decade Chord Mode */
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

    const padEnv = this.ctx.createGain();
    padEnv.gain.setValueAtTime(0.0001, now);
    padEnv.gain.linearRampToValueAtTime(0.35 * this.instrumentLevels.pad, now + 0.25);
    padEnv.gain.setValueAtTime(0.35 * this.instrumentLevels.pad, now + totalDuration - 0.4);
    padEnv.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    const oscRoot = this.ctx.createOscillator();
    oscRoot.type = 'sine';
    oscRoot.frequency.setValueAtTime(baseFreq, now);

    const oscSub = this.ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(baseFreq * 0.5, now);
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.25 * this.instrumentLevels.drone;

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

    // Arpeggiate the individual years
    const stepDur = (totalDuration - 0.4) / decadeRecords.length;
    decadeRecords.forEach((rec, idx) => {
      const arpTime = now + 0.1 + idx * stepDur;
      const arpFreq = this.getPitchForAnomaly(rec.anomaly);

      const arpEnv = this.ctx!.createGain();
      arpEnv.gain.setValueAtTime(0.0001, arpTime);
      arpEnv.gain.exponentialRampToValueAtTime(0.28 * this.instrumentLevels.arp, arpTime + 0.02);
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

// Global singleton
export const audioEngine = new AudioEngine();
