import React, { useState } from 'react';
import { audioEngine, type ArrangementType, type InstrumentLevels } from '../audio/engine';
import type { MusicalScaleType } from '../audio/sonify';

interface SoundMixerModalProps {
  onClose: () => void;
  soundMode: 'scientific' | 'musical';
  onSoundModeChange: (mode: 'scientific' | 'musical') => void;
  musicalScale: MusicalScaleType;
  onScaleChange: (scale: MusicalScaleType) => void;
}

export default function SoundMixerModal({
  onClose,
  soundMode,
  onSoundModeChange,
  musicalScale,
  onScaleChange,
}: SoundMixerModalProps) {
  const [levels, setLevels] = useState<InstrumentLevels>({ ...audioEngine.instrumentLevels });
  const [arrangement, setArrangement] = useState<ArrangementType>(audioEngine.arrangement);
  const [soundChecked, setSoundChecked] = useState(false);

  const handleLevelChange = (inst: keyof InstrumentLevels, val: number) => {
    const updated = { ...levels, [inst]: val };
    setLevels(updated);
    audioEngine.instrumentLevels[inst] = val;
  };

  const handlePresetChange = (preset: ArrangementType) => {
    setArrangement(preset);
    audioEngine.applyArrangementPreset(preset);
    setLevels({ ...audioEngine.instrumentLevels });
  };

  const handleSoundCheck = () => {
    audioEngine.playTestChime();
    setSoundChecked(true);
    setTimeout(() => setSoundChecked(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 17, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Sound Mixer & Synthesizer Controls"
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 540,
          padding: '24px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎛️</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Synthesizer & Sound Mixer
              </h2>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                Web Audio API • Real-Time Dual Oscillator Engine
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Close sound mixer"
          >
            ✕
          </button>
        </div>

        {/* Exact vs Musical Segmented Toggle */}
        <div style={{ marginBottom: 20, padding: 14, background: 'rgba(11, 29, 58, 0.55)', borderRadius: 10, border: '1px solid rgba(0, 212, 255, 0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Tonal Mapping Mode:</span>
            <div style={{ display: 'inline-flex', background: 'rgba(2, 6, 17, 0.7)', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => onSoundModeChange('scientific')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: soundMode === 'scientific' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                  color: soundMode === 'scientific' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                Exact (Raw Hz)
              </button>
              <button
                onClick={() => onSoundModeChange('musical')}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: soundMode === 'musical' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                  color: soundMode === 'musical' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                Musical Scale
              </button>
            </div>
          </div>

          {soundMode === 'musical' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Quantization Scale:</span>
              <select
                value={musicalScale}
                onChange={(e) => onScaleChange(e.target.value as MusicalScaleType)}
                style={{
                  padding: '4px 10px',
                  background: '#040A14',
                  border: '1px solid rgba(0, 212, 255, 0.35)',
                  borderRadius: 6,
                  color: '#00D4FF',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                <option value="dorian">A Dorian (Hopeful & Cinematic)</option>
                <option value="pentatonic">A Minor Pentatonic (Contemplative)</option>
                <option value="lydian">A Lydian (Bright & Radiant)</option>
                <option value="aeolian">A Aeolian (Urgent Climate Minor)</option>
              </select>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
              Deterministic linear pitch: −0.5 °C (220 Hz) to +1.3 °C (880 Hz). Clamped outside range.
            </div>
          )}
        </div>

        {/* Dynamic Arrangement Presets */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
            Acoustic Presets (Preserves exact data pitch):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['calm', 'cinematic', 'urgent'] as ArrangementType[]).map((p) => {
              const isActive = arrangement === p;
              const labels: Record<ArrangementType, { title: string; desc: string }> = {
                calm: { title: 'Calm', desc: 'Gentle attack, warm reverb' },
                cinematic: { title: 'Cinematic', desc: 'Harmonic depth & space' },
                urgent: { title: 'Urgent', desc: 'Crisp presence & resonance' },
              };
              return (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    textAlign: 'left',
                    border: isActive ? '1px solid #00D4FF' : '1px solid rgba(255,255,255,0.12)',
                    background: isActive ? 'rgba(0, 212, 255, 0.15)' : 'rgba(11, 29, 58, 0.4)',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#00D4FF' : '#FFFFFF' }}>
                    {labels[p].title}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                    {labels[p].desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Instrument Volume Faders */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>
            Multi-Voice Instrument Levels:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'pad', label: 'Soft Pad (Dual Detuned Body)', val: levels.pad },
              { id: 'bell', label: 'Plucked Bell (Crystalline Attack)', val: levels.bell },
              { id: 'drone', label: 'Sub Drone (55 Hz Foundation)', val: levels.drone },
              { id: 'arp', label: 'Harmonic Shimmer (High Octave)', val: levels.arp },
            ].map(({ id, label, val }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 220, fontSize: 12, color: '#CBD5E1' }}>{label}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={val}
                  onChange={(e) => handleLevelChange(id as keyof InstrumentLevels, parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#00D4FF', cursor: 'pointer' }}
                  aria-label={label}
                />
                <span style={{ width: 40, textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#00D4FF' }}>
                  {Math.round(val * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions: Sound Check & Done */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleSoundCheck}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: soundChecked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 212, 255, 0.12)',
              border: soundChecked ? '1px solid #22C55E' : '1px solid rgba(0, 212, 255, 0.35)',
              color: soundChecked ? '#4ADE80' : '#00D4FF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🔔</span>
            <span>{soundChecked ? 'Auditioning 440 Hz...' : 'Sound Check'}</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              borderRadius: 8,
              background: '#0B3D91',
              border: '1px solid #00D4FF',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
