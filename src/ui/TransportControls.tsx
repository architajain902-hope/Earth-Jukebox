import React from 'react';

export type SpeedOption = 'slow' | 'normal' | 'fast';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayTone: () => void;
  onPlayDecadeChord?: () => void;
  speed: SpeedOption;
  onSpeedChange: (speed: SpeedOption) => void;
  glide: boolean;
  onGlideChange: (glide: boolean) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  muted: boolean;
  onMuteChange: (muted: boolean) => void;
  looping: boolean;
  onLoopingChange: (loop: boolean) => void;
}

export default function TransportControls({
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onPlayTone,
  onPlayDecadeChord,
  speed,
  onSpeedChange,
  glide,
  onGlideChange,
  volume,
  onVolumeChange,
  muted,
  onMuteChange,
  looping,
  onLoopingChange,
}: TransportControlsProps) {
  return (
    <div
      className="glass"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      role="region"
      aria-label="Audio Playback and Time-lapse Controls"
    >
      {/* Top row: Main Playback Transport */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px 44px', gap: 6, alignItems: 'center' }}>
        {/* Previous year */}
        <button
          onClick={onPrev}
          title="Previous year (Left Arrow)"
          aria-label="Previous Year"
          className="btn-icon"
          style={{ ...btnStyle, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ⏮
        </button>

        {/* Play / Pause Time-lapse */}
        <button
          onClick={onPlayPause}
          title={isPlaying ? 'Pause time-lapse (P)' : 'Play time-lapse (P)'}
          aria-label={isPlaying ? 'Pause time-lapse' : 'Play time-lapse'}
          style={{
            ...btnStyle,
            background: isPlaying ? 'rgba(252, 61, 33, 0.45)' : 'rgba(11, 61, 145, 0.8)',
            borderColor: isPlaying ? '#FC3D21' : '#00D4FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 12px',
          }}
        >
          <span>{isPlaying ? '⏸' : '▶'}</span>
          <span>{isPlaying ? 'Pause 1880–2025' : 'Play 1880–2025'}</span>
        </button>

        {/* Next year */}
        <button
          onClick={onNext}
          title="Next year (Right Arrow)"
          aria-label="Next Year"
          className="btn-icon"
          style={{ ...btnStyle, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ⏭
        </button>

        {/* Loop toggle */}
        <button
          onClick={() => onLoopingChange(!looping)}
          title={looping ? 'Looping active: will repeat time-lapse automatically' : 'Looping inactive'}
          aria-label="Toggle loop"
          aria-pressed={looping}
          style={{
            ...btnStyle,
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: looping ? 'rgba(0, 212, 255, 0.25)' : 'rgba(11, 29, 58, 0.5)',
            borderColor: looping ? '#00D4FF' : 'rgba(255, 255, 255, 0.15)',
            color: looping ? '#00D4FF' : '#94A3B8',
          }}
        >
          🔁
        </button>
      </div>

      {/* Row 2: Sonify Actions (Single Year Tone & Decade Chord) */}
      <div style={{ display: 'grid', gridTemplateColumns: onPlayDecadeChord ? '1fr 1fr' : '1fr', gap: 6 }}>
        {/* Play Single Year Tone */}
        <button
          onClick={onPlayTone}
          title="Play single year tone (1.2s, Spacebar)"
          aria-label="Play single year tone"
          style={{
            ...btnStyle,
            background: 'rgba(0, 212, 255, 0.15)',
            borderColor: 'rgba(0, 212, 255, 0.4)',
            color: '#00D4FF',
            padding: '6px 10px',
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🎵</span>
          <span>Play Tone</span>
        </button>

        {/* Play Decade Chord */}
        {onPlayDecadeChord && (
          <button
            onClick={onPlayDecadeChord}
            title="Play Decade Chord (arpeggiates 10-year period over sustained chord)"
            aria-label="Play Decade Chord"
            style={{
              ...btnStyle,
              background: 'rgba(249, 115, 22, 0.18)',
              borderColor: 'rgba(249, 115, 22, 0.45)',
              color: '#F97316',
              padding: '6px 10px',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>🎹</span>
            <span>Decade Chord</span>
          </button>
        )}
      </div>

      {/* Middle row: Speed & Glide */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {/* Speed selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748B', marginRight: 4 }}>
            SPD:
          </span>
          {(['slow', 'normal', 'fast'] as SpeedOption[]).map((s) => {
            const active = speed === s;
            return (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                aria-pressed={active}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  border: `1px solid ${active ? '#00D4FF' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: active ? 'rgba(0, 212, 255, 0.2)' : 'rgba(11, 29, 58, 0.4)',
                  color: active ? '#00D4FF' : '#94A3B8',
                  textTransform: 'uppercase',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Glide toggle */}
        <button
          onClick={() => onGlideChange(!glide)}
          aria-pressed={glide}
          title="Smooth portamento pitch glide between consecutive years"
          style={{
            padding: '3px 10px',
            borderRadius: 4,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            border: `1px solid ${glide ? '#FC3D21' : 'rgba(255, 255, 255, 0.1)'}`,
            background: glide ? 'rgba(252, 61, 33, 0.2)' : 'rgba(11, 29, 58, 0.4)',
            color: glide ? '#FC3D21' : '#94A3B8',
          }}
        >
          Glide: {glide ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Bottom row: Volume slider & Mute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => onMuteChange(!muted)}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
            color: muted ? '#EF4444' : '#94A3B8',
            padding: 2,
          }}
        >
          {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => {
            onMuteChange(false);
            onVolumeChange(Number(e.target.value));
          }}
          aria-label="Volume slider"
          style={{ flex: 1, accentColor: '#00D4FF', height: 4 }}
        />

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#64748B',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {Math.round((muted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(11, 29, 58, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  color: '#FFFFFF',
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'all 0.15s ease',
};
