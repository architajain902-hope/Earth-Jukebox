import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassWorkspaceDemo from "@/components/ui/glass-workspace-demo";

interface GlassWorkspaceModalProps {
  onClose: () => void;
}

export default function GlassWorkspaceModal({ onClose }: GlassWorkspaceModalProps) {
  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjustable Glass Workspace"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 400,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Dismiss Bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            background: "rgba(5, 11, 26, 0.9)",
            borderBottom: "1px solid rgba(0, 212, 255, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🪟</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>
                Adjustable Glass Workspace
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                Real-time glassmorphism controls (blur, opacity, tint, edge light)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close glass workspace"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(0, 212, 255, 0.15)",
              border: "1px solid rgba(0, 212, 255, 0.4)",
              color: "#00D4FF",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to SONIX
          </button>
        </div>

        {/* Workspace Canvas Container */}
        <div style={{ flex: 1, position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <GlassWorkspaceDemo />
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
