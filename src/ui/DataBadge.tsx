import React, { useState } from 'react';
import type { GistempDataset } from '../data/types';

interface DataBadgeProps {
  dataset: GistempDataset;
}

export default function DataBadge({ dataset }: DataBadgeProps) {
  const [open, setOpen] = useState(false);

  const formattedDate = new Date(dataset.fetchedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="View NASA GISTEMP data source information"
        aria-expanded={open}
        style={{
          background: 'rgba(11, 61, 145, 0.4)',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: 6,
          padding: '4px 10px',
          color: '#E0F2FE',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: 12 }}>🛰️</span>
        <span>NASA GISTEMP v4</span>
        <span style={{ color: '#00D4FF', fontSize: 10 }}>[verified]</span>
      </button>

      {open && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 320,
            padding: 16,
            zIndex: 100,
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
          }}
          role="dialog"
          aria-label="Scientific Data Verification Details"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#00D4FF' }}>
              Dataset Provenance
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: '#64748B' }}>Source: </span>
              <span style={{ color: '#E2E8F0' }}>NASA Goddard Institute for Space Studies</span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Series: </span>
              <span style={{ color: '#E2E8F0' }}>GISTEMP v4 (Land-Ocean Index)</span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Baseline: </span>
              <span style={{ color: '#E2E8F0' }}>{dataset.baseline} (Global Mean)</span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Unit: </span>
              <span style={{ color: '#E2E8F0' }}>{dataset.unit} (Temperature Anomaly)</span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Records: </span>
              <span style={{ color: '#38BDF8' }}>
                {dataset.data.length} consecutive years ({dataset.data[0]?.year}–{dataset.data[dataset.data.length - 1]?.year})
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Fetched: </span>
              <span style={{ color: '#E2E8F0' }}>{formattedDate}</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 10,
              color: '#94A3B8',
              lineHeight: 1.4,
            }}
          >
            <em>Citation:</em> Lenssen et al. (2019) J. Geophys. Res. Atmos., 124(12), 6307-6326. NASA GISS Surface Temperature Analysis.
          </div>
        </div>
      )}
    </div>
  );
}
