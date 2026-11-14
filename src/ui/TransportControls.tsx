import React from 'react';

export type SpeedOption = 'slow' | 'normal' | 'fast';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPlayTone: () => void;
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
      {/* Top row: Transport buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Previous year */}
        <button
          onClick={onPrev}
          title="Previous year (Left Arrow)"
          aria-label="Previous Year"
          className="btn-icon"
          style={btnStyle}
        >
          ⏮
        </button>

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
            padding: '6px 12px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🎵</span>
          <span>Tone</span>
        </button>

        {/* Play / Pause Time-lapse */}
        <button
          onClick={onPlayPause}
          title={isPlaying ? 'Pause time-lapse (P)' : 'Play time-lapse (P)'}
          aria-label={isPlaying ? 'Pause time-lapse' : 'Play time-lapse'}
          style={{
            ...btnStyle,
            minWidth: 90,
            background: isPlaying ? 'rgba(252, 61, 33, 0.35)' : 'rgba(11, 61, 145, 0.7)',
            borderColor: isPlaying ? '#FC3D21' : '#00D4FF',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>{isPlaying ? '⏸' : '▶'}</span>
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Next year */}
        <button
          onClick={onNext}
          title="Next year (Right Arrow)"
          aria-label="Next Year"
          className="btn-icon"
          style={btnStyle}
        >
          ⏭
        </button>

        {/* Loop toggle */}
        <button
          onClick={() => onLoopingChange(!looping)}
          title={looping ? 'Looping enabled' : 'Looping disabled'}
          aria-label="Toggle loop"
          aria-pressed={looping}
          style={{
            ...btnStyle,
            background: looping ? 'rgba(0, 212, 255, 0.25)' : 'rgba(11, 29, 58, 0.5)',
            borderColor: looping ? '#00D4FF' : 'rgba(255, 255, 255, 0.15)',
            color: looping ? '#00D4FF' : '#94A3B8',
          }}
        >
          🔁
        </button>
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
