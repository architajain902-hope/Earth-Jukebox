import React, { useState, useRef, useEffect } from 'react';
import type { EarthDisplayPreset } from '../globe/EarthGlobe';

interface AccessibilityDropdownProps {
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  displayPreset?: EarthDisplayPreset;
  onSelectDisplayPreset?: (preset: EarthDisplayPreset) => void;
}

export default function AccessibilityDropdown({
  speechEnabled,
  onToggleSpeech,
  highContrast,
  onToggleHighContrast,
  reduceMotion,
  onToggleReduceMotion,
  displayPreset = 'vivid',
  onSelectDisplayPreset,
}: AccessibilityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          borderRadius: 8,
          background: isOpen ? 'rgba(0, 212, 255, 0.25)' : 'rgba(11, 29, 58, 0.65)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: 'var(--text-primary, #FFFFFF)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Accessibility and display settings"
      >
        <span>♿</span>
        <span>Accessibility</span>
        <span style={{ fontSize: 9 }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 310,
            padding: 16,
            borderRadius: 14,
            boxShadow: '0 20px 50px rgba(0,0,0,0.75)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            zIndex: 150,
          }}
          role="menu"
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>Inclusivity & Assistive Tech</span>
            <span style={{ fontSize: 11, color: '#00D4FF', fontWeight: 600 }}>WCAG 2.1 AA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Spoken Narration Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Spoken Voice Readout</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #CBD5E1)' }}>Web Speech API auditory narration</div>
              </div>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={onToggleSpeech}
                style={{ width: 18, height: 18, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* High Contrast Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>High Contrast Palette</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #CBD5E1)' }}>Sharpen UI borders and typography</div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={onToggleHighContrast}
                style={{ width: 18, height: 18, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* Reduced Motion Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>Reduced Motion</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #CBD5E1)' }}>Disable 3D planet rotation</div>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={onToggleReduceMotion}
                style={{ width: 18, height: 18, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* Earth Look Visual Preset (Moved from dock per Stage 4) */}
            {onSelectDisplayPreset && (
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #FFFFFF)', marginBottom: 6 }}>
                  Earth look
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'natural', label: 'Natural' },
                    { id: 'vivid', label: 'Vivid' },
                    { id: 'high-contrast', label: 'High contrast' },
                  ].map((preset) => {
                    const active = displayPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onSelectDisplayPreset(preset.id as EarthDisplayPreset)}
                        style={{
                          padding: '6px 4px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                          border: active ? '1px solid #00D4FF' : '1px solid rgba(255,255,255,0.15)',
                          background: active ? 'rgba(0, 212, 255, 0.28)' : 'rgba(11, 29, 58, 0.45)',
                          color: active ? '#FFFFFF' : 'var(--text-secondary, #CBD5E1)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Trigger */}
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.28)',
                  borderRadius: 6,
                  color: '#38BDF8',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⌨️ {showShortcuts ? 'Hide Keyboard Shortcuts' : 'View Keyboard Shortcuts'}
              </button>

              {showShortcuts && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary, #CBD5E1)', display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-mono)' }}>
                  <div><kbd style={kbdStyle}>←</kbd> / <kbd style={kbdStyle}>→</kbd> : ±1 Year</div>
                  <div><kbd style={kbdStyle}>PgUp</kbd> / <kbd style={kbdStyle}>PgDn</kbd> : ±10 Years</div>
                  <div><kbd style={kbdStyle}>Space</kbd> : Hear Current Tone</div>
                  <div><kbd style={kbdStyle}>P</kbd> : Play / Pause Time-lapse</div>
                  <div><kbd style={kbdStyle}>Home</kbd> / <kbd style={kbdStyle}>End</kbd> : 1880 / 2025</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.18)',
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.3)',
  fontSize: 11,
};
