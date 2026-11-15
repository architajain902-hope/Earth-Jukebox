import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBirthYear: () => void;
  onOpenCompare: () => void;
  onOpenDecadeChord: () => void;
  onOpenFutureEarth: () => void;
  onOpenExplainer: () => void;
  onOpenClassroom: () => void;
  onOpenDataMethod: () => void;
  onCopyLink: () => void;
  onOpenExport: () => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  onOpenAutoTour: () => void;
  onOpenSources: () => void;
  onOpenAbout: () => void;
}

export default function MoreDrawer({
  isOpen,
  onClose,
  onOpenBirthYear,
  onOpenCompare,
  onOpenDecadeChord,
  onOpenFutureEarth,
  onOpenExplainer,
  onOpenClassroom,
  onOpenDataMethod,
  onCopyLink,
  onOpenExport,
  onToggleRecording,
  isRecording,
  onOpenAutoTour,
  onOpenSources,
  onOpenAbout,
}: MoreDrawerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 17, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 420,
            background: 'var(--panel-bg, #050B1A)',
            borderLeft: '1px solid rgba(0, 212, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-12px 0 40px rgba(0,0,0,0.85)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Mission Control Menu
              </h2>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                SONIX Feature Index
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                fontSize: 22,
                cursor: 'pointer',
                padding: 4,
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Group 1: Explore */}
            <div>
              <div style={groupHeaderStyle}>Explore & Compare</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DrawerButton
                  icon="🎂"
                  title="Hear Your Birth Year"
                  desc="Compare your birth year against today's warming"
                  onClick={() => { onClose(); onOpenBirthYear(); }}
                />
                <DrawerButton
                  icon="⚖️"
                  title="Compare Two Years"
                  desc="Audition any 2 historical years with Δ°C and ΔHz"
                  onClick={() => { onClose(); onOpenCompare(); }}
                />
                <DrawerButton
                  icon="🎹"
                  title="Decade Chords"
                  desc="Audition 10-year averages as sustained chords"
                  onClick={() => { onClose(); onOpenDecadeChord(); }}
                />
                <DrawerButton
                  icon="🔮"
                  title="Future Earth Datasets"
                  desc="Planned wind, precipitation & wildfire sonification"
                  onClick={() => { onClose(); onOpenFutureEarth(); }}
                />
              </div>
            </div>

            {/* Group 2: Learn */}
            <div>
              <div style={groupHeaderStyle}>Educational Insights</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DrawerButton
                  icon="🎧"
                  title='"What Am I Hearing?"'
                  desc="Bilingual English / हिन्दी scientific explainer"
                  onClick={() => { onClose(); onOpenExplainer(); }}
                />
                <DrawerButton
                  icon="🎓"
                  title="Classroom / Guided Lesson"
                  desc="5-step interactive curriculum with quizzes"
                  onClick={() => { onClose(); onOpenClassroom(); }}
                />
                <DrawerButton
                  icon="📐"
                  title="Data & Method"
                  desc="GISTEMP v4 formulas & uncertainty disclosure"
                  onClick={() => { onClose(); onOpenDataMethod(); }}
                />
              </div>
            </div>

            {/* Group 3: Share & Export */}
            <div>
              <div style={groupHeaderStyle}>Share & Media Export</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DrawerButton
                  icon="🔗"
                  title="Copy Shareable Link"
                  desc="Share exact year, speed & configuration URL"
                  onClick={() => { onCopyLink(); }}
                />
                <DrawerButton
                  icon="🎵"
                  title="Export Media (WAV / PNG)"
                  desc="Download uncompressed 16-bit audio & chart image"
                  onClick={() => { onClose(); onOpenExport(); }}
                />
                <DrawerButton
                  icon="📹"
                  title={isRecording ? 'Stop Recording' : 'Record Demo Video Clip'}
                  desc="Capture canvas + synthesized audio into WebM"
                  onClick={() => { onToggleRecording(); }}
                />
                <DrawerButton
                  icon="▶"
                  title="100-Second Guided Auto-Tour"
                  desc="Automated presentation tour with subtitles"
                  onClick={() => { onClose(); onOpenAutoTour(); }}
                />
              </div>
            </div>

            {/* Group 4: Project & Compliance */}
            <div>
              <div style={groupHeaderStyle}>Sources & Attribution</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DrawerButton
                  icon="🏛️"
                  title="NASA SVS Sources & Credits"
                  desc="Verified SVS 5313, 3912, 5425 & reproduction rights"
                  onClick={() => { onClose(); onOpenSources(); }}
                />
                <DrawerButton
                  icon="ℹ️"
                  title="About SONIX"
                  desc="Team, challenge statement, judging alignment"
                  onClick={() => { onClose(); onOpenAbout(); }}
                />
              </div>
            </div>
          </div>

          {/* Drawer Footer Disclaimer */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: 11,
              color: '#94A3B8',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
          >
            Independent student project using NASA data and imagery. Not endorsed by NASA.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

const groupHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: '#00D4FF',
  marginBottom: 10,
  fontFamily: 'var(--font-mono)',
};

function DrawerButton({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(11, 29, 58, 0.45)',
        border: '1px solid rgba(0, 212, 255, 0.15)',
        color: '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 212, 255, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(11, 29, 58, 0.45)';
        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.15)';
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {desc}
        </div>
      </div>
    </button>
  );
}
