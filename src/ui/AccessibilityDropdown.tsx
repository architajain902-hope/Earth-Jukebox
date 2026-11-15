import React, { useState, useRef, useEffect } from 'react';

interface AccessibilityDropdownProps {
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
}

export default function AccessibilityDropdown({
  speechEnabled,
  onToggleSpeech,
  highContrast,
  onToggleHighContrast,
  reduceMotion,
  onToggleReduceMotion,
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
          background: isOpen ? 'rgba(0, 212, 255, 0.2)' : 'rgba(11, 29, 58, 0.65)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#FFFFFF',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Accessibility settings"
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
            width: 290,
            padding: 16,
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            zIndex: 150,
          }}
          role="menu"
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>Inclusivity & Assistive Tech</span>
            <span style={{ fontSize: 10, color: '#00D4FF', fontFamily: 'var(--font-mono)' }}>WCAG 2.1 AA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Spoken Narration Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Spoken Voice Readout</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Web Speech API auditory narration</div>
              </div>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={onToggleSpeech}
                style={{ width: 16, height: 16, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* High Contrast Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>High Contrast Palette</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Sharpen UI borders and typography</div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={onToggleHighContrast}
                style={{ width: 16, height: 16, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* Reduced Motion Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Reduced Motion</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Disable 3D planet rotation</div>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={onToggleReduceMotion}
                style={{ width: 16, height: 16, accentColor: '#00D4FF', cursor: 'pointer' }}
              />
            </label>

            {/* Keyboard Shortcuts Trigger */}
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderRadius: 6,
                  color: '#38BDF8',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ⌨️ {showShortcuts ? 'Hide Keyboard Shortcuts' : 'View Keyboard Shortcuts'}
              </button>

              {showShortcuts && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)' }}>
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
  background: 'rgba(255,255,255,0.15)',
  padding: '1px 5px',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.25)',
  fontSize: 10,
};
