import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachMarkProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function CoachMark({ visible, onDismiss }: CoachMarkProps) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        style={{
          position: 'fixed',
          bottom: 110,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 140,
          width: '90%',
          maxWidth: 480,
          pointerEvents: 'auto',
        }}
      >
        <div
          className="glass"
          style={{
            padding: '14px 18px',
            borderRadius: 14,
            border: '1px solid rgba(0, 212, 255, 0.45)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(5, 15, 35, 0.88)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>💡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                How to Interact
              </div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.4 }}>
                Drag the 3D globe to rotate • Drag the timeline or press <kbd style={{ padding: '1px 4px', background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>Play</kbd> to hear 146 years of climate sonification.
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Got it
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
