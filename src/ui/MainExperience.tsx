import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { AnomalyRecord, GistempDataset } from '../data/types';
import { getRecordForYear } from '../data/loadData';
import { audioEngine } from '../audio/engine';
import { frequencyToNoteName, type MusicalScaleType } from '../audio/sonify';
import { setUrlState, copyShareableLink } from '../utils/urlState';
import { demoScreenRecorder } from '../utils/screenRecorder';

import EarthGlobe, { type EarthDisplayPreset } from '../globe/EarthGlobe';
import TimelineSlider from './TimelineSlider';
import YearDisplay from './YearDisplay';
import AudioVisualizer from './AudioVisualizer';
import QuickJumps from './QuickJumps';

import ExplainerModal from './ExplainerModal';
import CompareModal from './CompareModal';
import AboutModal from './AboutModal';
import BirthYearModal from './BirthYearModal';
import ClassroomModal from './ClassroomModal';
import FutureEarthModal from './FutureEarthModal';
import DataMethodModal from './DataMethodModal';
import ExportModal from './ExportModal';
import SourcesModal from './SourcesModal';
import AutoTour from './AutoTour';
import AccessibilityDropdown from './AccessibilityDropdown';
import SoundMixerModal from './SoundMixerModal';
import CoachMark from './CoachMark';
import PeakChartModal from './PeakChartModal';
import GlassWorkspaceModal from './GlassWorkspaceModal';

import JukeboxTab from './JukeboxTab';
import LearnTab from './LearnTab';
import MoreDrawer from './MoreDrawer';

interface MainExperienceProps {
  dataset: GistempDataset;
  initialParams?: {
    year?: number;
    speed?: 'slow' | 'normal' | 'fast';
    mode?: 'jukebox' | 'classroom' | 'birthyear';
  };
}

type SpeedOption = 'slow' | 'normal' | 'fast';
type NavigationTab = 'earth' | 'frames' | 'learn';

const SPEED_MS: Record<SpeedOption, number> = {
  slow: 550,
  normal: 260,
  fast: 120,
};

export default function MainExperience({
  dataset,
  initialParams,
}: MainExperienceProps) {
  const { data } = dataset;
  const years = data.map((d) => d.year);
  const minYear = years[0] ?? 1880;
  const maxYear = years[years.length - 1] ?? 2025;

  // Primary Navigation Tab (Earth | NASA Frames | Learn)
  const [activeTab, setActiveTab] = useState<NavigationTab>('earth');

  // Core Playback State
  const [selectedYear, setSelectedYear] = useState<number>(initialParams?.year ?? maxYear);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<SpeedOption>(initialParams?.speed ?? 'normal');
  const [glide, setGlide] = useState<boolean>(true);
  const [looping, setLooping] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [muted, setMuted] = useState<boolean>(false);

  // Sound Mode & Scale
  const [soundMode, setSoundMode] = useState<'scientific' | 'musical'>('musical');
  const [musicalScale, setMusicalScale] = useState<MusicalScaleType>('dorian');
  const [showSoundMixer, setShowSoundMixer] = useState<boolean>(false);

  // Visual Theme & Earth Display Preset (Default = Vivid per Stage 4)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('earth_jukebox_theme') as 'dark' | 'light') || 'dark';
  });
  const [displayPreset, setDisplayPreset] = useState<EarthDisplayPreset>('vivid');

  // First-run coach-mark
  const [showCoachMark, setShowCoachMark] = useState<boolean>(() => {
    return !localStorage.getItem('earth_jukebox_coach_dismissed');
  });

  // Secondary options collapsible panel
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  // More drawer
  const [showMoreDrawer, setShowMoreDrawer] = useState<boolean>(false);

  // Video recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState<number>(0);

  // Modals
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showBirthYear, setShowBirthYear] = useState<boolean>(initialParams?.mode === 'birthyear');
  const [showClassroom, setShowClassroom] = useState<boolean>(false);
  const [showFutureEarth, setShowFutureEarth] = useState<boolean>(false);
  const [showDataMethod, setShowDataMethod] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showSources, setShowSources] = useState<boolean>(false);
  const [showPeakChart, setShowPeakChart] = useState<boolean>(false);
  const [showGlassWorkspace, setShowGlassWorkspace] = useState<boolean>(false);
  const [isAutoTourActive, setIsAutoTourActive] = useState<boolean>(false);

  // Toast
  const [linkCopiedToast, setLinkCopiedToast] = useState<boolean>(false);

  // Accessibility
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Timelapse timer ref
  const timelapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAnomalyRef = useRef<number | undefined>(undefined);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('earth_jukebox_theme', theme);
  }, [theme]);

  // Sync sound mode & scale with audio engine
  useEffect(() => {
    audioEngine.soundMode = soundMode;
    audioEngine.musicalScale = musicalScale as any;
  }, [soundMode, musicalScale]);

  // Current record
  const currentRecord = getRecordForYear(data, selectedYear) ?? data[data.length - 1];
  const currentAnomaly = currentRecord.anomaly;
  const currentFreq = audioEngine.getPitchForAnomaly(currentAnomaly);
  const currentNote = frequencyToNoteName(currentFreq);

  // Synchronize URL parameters
  useEffect(() => {
    let mode: 'jukebox' | 'classroom' | 'birthyear' = 'jukebox';
    if (activeTab === 'learn') mode = 'classroom';
    else if (showBirthYear) mode = 'birthyear';

    setUrlState({
      year: selectedYear,
      speed,
      mode,
    });
  }, [selectedYear, speed, activeTab, showBirthYear]);

  // Sync volume / mute with audio engine
  useEffect(() => {
    audioEngine.volume = volume;
  }, [volume]);

  useEffect(() => {
    audioEngine.muted = muted;
  }, [muted]);

  // Web Speech API accessibility reader
  const speakCurrent = useCallback(
    (year: number, anom: number, hz: number) => {
      if (!speechEnabled || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const signWord = anom >= 0 ? 'plus' : 'minus';
      const utterance = new SpeechSynthesisUtterance(
        `Year ${year}, anomaly ${signWord} ${Math.abs(anom).toFixed(2)} degrees Celsius, pitch ${Math.round(hz)} hertz.`
      );
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled]
  );

  // Play single-year rich tone
  const handlePlayTone = useCallback(() => {
    const freq = audioEngine.playTone(currentAnomaly, 1.8);
    speakCurrent(selectedYear, currentAnomaly, freq);
  }, [currentAnomaly, selectedYear, speakCurrent]);

  // Play Decade Chord
  const handlePlayDecadeChord = useCallback(() => {
    const decadeStart = Math.floor(selectedYear / 10) * 10;
    const decadeEnd = decadeStart + 9;
    const decadeRecords = data.filter((d) => d.year >= decadeStart && d.year <= decadeEnd);

    if (decadeRecords.length > 0) {
      audioEngine.playDecadeChord(decadeRecords, (arpYear) => {
        setSelectedYear(arpYear);
      });
    }
  }, [data, selectedYear]);

  // Handle Year Change
  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      const rec = getRecordForYear(data, year);
      if (rec && !isPlaying) {
        audioEngine.playNote(rec.anomaly, 190, prevAnomalyRef.current, glide);
        prevAnomalyRef.current = rec.anomaly;
        speakCurrent(year, rec.anomaly, audioEngine.getPitchForAnomaly(rec.anomaly));
      }
    },
    [data, isPlaying, glide, speakCurrent]
  );

  // Handle Share link copy
  const handleCopyLink = async () => {
    const success = await copyShareableLink();
    if (success) {
      setLinkCopiedToast(true);
      setTimeout(() => setLinkCopiedToast(false), 2500);
    }
  };

  // Screen recording handler
  const handleToggleRecording = () => {
    if (isRecording) {
      demoScreenRecorder.stopRecording();
      setIsRecording(false);
      setRecordElapsedSec(0);
      return;
    }

    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('3D WebGL Canvas not detected.');
      return;
    }

    const started = demoScreenRecorder.startRecording(
      canvas,
      (elapsed) => setRecordElapsedSec(elapsed),
      (_blob, _url) => {
        setIsRecording(false);
        setRecordElapsedSec(0);
      }
    );

    if (started) {
      setIsRecording(true);
    }
  };

  // Time-lapse loop
  const stepTimelapse = useCallback(() => {
    setSelectedYear((curr) => {
      const idx = data.findIndex((d) => d.year === curr);
      if (idx === -1 || idx >= data.length - 1) {
        if (looping) {
          const firstRec = data[0];
          audioEngine.playNote(firstRec.anomaly, SPEED_MS[speed] * 0.9, prevAnomalyRef.current, glide);
          prevAnomalyRef.current = firstRec.anomaly;
          return minYear;
        } else {
          setIsPlaying(false);
          audioEngine.stopDrone();
          return curr;
        }
      }

      const nextRec = data[idx + 1];
      audioEngine.playNote(nextRec.anomaly, SPEED_MS[speed] * 0.9, prevAnomalyRef.current, glide);
      prevAnomalyRef.current = nextRec.anomaly;
      return nextRec.year;
    });
  }, [data, speed, glide, looping, minYear]);

  // Time-lapse ticker
  useEffect(() => {
    if (isPlaying) {
      audioEngine.startDrone(55);
      timelapseTimerRef.current = setTimeout(stepTimelapse, SPEED_MS[speed]);
    } else {
      audioEngine.stopDrone();
      if (timelapseTimerRef.current) {
        clearTimeout(timelapseTimerRef.current);
        timelapseTimerRef.current = null;
      }
    }
    return () => {
      if (timelapseTimerRef.current) {
        clearTimeout(timelapseTimerRef.current);
      }
    };
  }, [isPlaying, selectedYear, speed, stepTimelapse]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayTone();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleYearChange(Math.max(minYear, selectedYear - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleYearChange(Math.min(maxYear, selectedYear + 1));
          break;
        case 'PageUp':
          e.preventDefault();
          handleYearChange(Math.max(minYear, selectedYear - 10));
          break;
        case 'PageDown':
          e.preventDefault();
          handleYearChange(Math.min(maxYear, selectedYear + 10));
          break;
        case 'Home':
          e.preventDefault();
          handleYearChange(minYear);
          break;
        case 'End':
          e.preventDefault();
          handleYearChange(maxYear);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedYear, minYear, maxYear, handlePlayTone, handleYearChange]);

  const dismissCoachMark = () => {
    setShowCoachMark(false);
    localStorage.setItem('earth_jukebox_coach_dismissed', 'true');
  };

  return (
    <div className="app-viewport-grid">
      {/* Screen Reader ARIA Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        Year {selectedYear}, Anomaly {currentAnomaly >= 0 ? '+' : ''}{currentAnomaly.toFixed(2)} degrees Celsius, pitch {Math.round(currentFreq)} Hertz, note {currentNote}.
      </div>

      {/* =========================================================
          ROW 1: SLIM TOP BAR (Max 5 Visible Items)
          ========================================================= */}
      <header
        className="glass app-header neon-border"
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          margin: '8px 14px 0 14px',
          borderRadius: 14,
          zIndex: 100,
          border: '1px solid rgba(0, 212, 255, 0.35)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45), 0 0 18px rgba(0, 212, 255, 0.16)',
        }}
      >
        {/* 1. Brand Logo & Title */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setActiveTab('earth')}
          title="Return to 3D Earth Globe"
        >
          <img
            src="/branding/sonix-logo.png"
            alt="SONIX logo"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid rgba(0, 212, 255, 0.5)',
              boxShadow: '0 0 12px rgba(0, 212, 255, 0.25)',
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #FFFFFF)', letterSpacing: 0.5, lineHeight: 1.1 }}>
              SONIX
            </div>
            <div
              className="hide-on-mobile"
              style={{ fontSize: 11, color: '#00D4FF', fontWeight: 600, letterSpacing: 0.2 }}
            >
              The Earth Information Jukebox
            </div>
          </div>
        </div>

        {/* 2. Primary Tabs: Earth | NASA Frames | Learn with Separate Spacing & Neon Detailing */}
        <nav
          className="neon-tabs-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12, // Distinct separated tab spacing
          }}
          aria-label="Main Navigation Tabs"
        >
          <button
            onClick={() => setActiveTab('earth')}
            className={`neon-tab-item ${activeTab === 'earth' ? 'active' : ''}`}
            aria-pressed={activeTab === 'earth'}
          >
            {activeTab === 'earth' && <span className="neon-pulse-dot" />}
            <span>🌐 Earth</span>
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            className={`neon-tab-item ${activeTab === 'frames' ? 'active' : ''}`}
            aria-pressed={activeTab === 'frames'}
          >
            {activeTab === 'frames' && <span className="neon-pulse-dot" />}
            <span>🎞️ NASA Frames</span>
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            className={`neon-tab-item ${activeTab === 'learn' ? 'active' : ''}`}
            aria-pressed={activeTab === 'learn'}
          >
            {activeTab === 'learn' && <span className="neon-pulse-dot" />}
            <span>🎓 Learn</span>
          </button>
        </nav>

        {/* 3. Right Utility Menu: Theme, Accessibility, About, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(11, 29, 58, 0.55)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: 'var(--text-primary, #FFFFFF)',
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={theme === 'dark' ? 'Switch to Daylight Light Theme' : 'Switch to Deep Space Dark Theme'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Accessibility & Display Dropdown (Hosts "Earth look" preset as specified in Stage 4) */}
          <AccessibilityDropdown
            speechEnabled={speechEnabled}
            onToggleSpeech={() => setSpeechEnabled(!speechEnabled)}
            highContrast={highContrast}
            onToggleHighContrast={() => setHighContrast(!highContrast)}
            reduceMotion={reduceMotion}
            onToggleReduceMotion={() => setReduceMotion(!reduceMotion)}
            displayPreset={displayPreset}
            onSelectDisplayPreset={setDisplayPreset}
          />

          {/* About Button */}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'rgba(11, 29, 58, 0.55)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: 'var(--text-primary, #FFFFFF)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            className="hide-on-mobile"
          >
            About
          </button>

          {/* "More" Drawer Trigger */}
          <button
            onClick={() => setShowMoreDrawer(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            aria-label="Open mission control menu"
          >
            <span>☰</span>
            <span>More</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          ROW 2: EARTH STAGE (Flexible 1fr, Centered Large Globe, Zero Overlap)
          ========================================================= */}
      {activeTab === 'earth' && (
        <main className="earth-stage-grid">
          {/* Left Column: Now Playing Card (Sits beside globe, not on top) */}
          <div className="earth-stage-left">
            <YearDisplay
              year={selectedYear}
              anomaly={currentAnomaly}
              frequency={currentFreq}
              noteName={currentNote}
              isPlaying={isPlaying}
              soundMode={soundMode}
              onToggleSoundMode={() => setSoundMode((m) => (m === 'musical' ? 'scientific' : 'musical'))}
            />
          </div>

          {/* Center Column: Centered Large 3D Earth Globe (~70% of stage height) */}
          <div className="earth-stage-center">
            {/* 3D WebGL Canvas */}
            <div ref={canvasContainerRef} className="earth-canvas-wrapper">
              <Canvas
                camera={{ position: [0, 0, 2.7], fov: 45, near: 0.1, far: 1000 }}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                style={{ width: '100%', height: '100%' }}
              >
                <Suspense fallback={null}>
                  <Stars radius={180} depth={60} count={3500} factor={4} saturation={0} fade speed={reduceMotion ? 0 : 0.6} />
                  <EarthGlobe
                    anomaly={currentAnomaly}
                    isPlaying={isPlaying}
                    reduceMotion={reduceMotion}
                    displayPreset={displayPreset}
                  />
                  <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={1.75}
                    maxDistance={6.0}
                    rotateSpeed={0.65}
                    autoRotate={false}
                  />
                </Suspense>
              </Canvas>
            </div>

            {/* In-canvas Non-obstructive Overlays (Stage 2 Tooltip & Stage 5 Data Badges) */}
            <div className="earth-center-overlay">
              {/* Top: Artistic indicator tooltip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(5, 11, 26, 0.82)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: 12.5,
                  color: 'var(--text-secondary, #CBD5E1)',
                  backdropFilter: 'blur(10px)',
                }}
                title="Glow colour is an artistic indicator, not a measurement."
              >
                <span style={{ fontSize: 13 }}>ℹ️</span>
                <span>Glow colour is an artistic indicator, not a measurement</span>
              </div>

              {/* Bottom: Interactive Data Badges Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setShowDataMethod(true)}
                  title="Click to view NASA GISS GISTEMP v4 methodology & verified data"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: 'rgba(11, 29, 58, 0.8)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: 'var(--text-secondary, #CBD5E1)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🛰️</span>
                  <span>NASA GISS GISTEMP v4</span>
                </button>
                <button
                  onClick={() => setShowDataMethod(true)}
                  title="Click to view baseline climatological normal documentation"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: 'rgba(11, 29, 58, 0.8)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: 'var(--text-secondary, #CBD5E1)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>⚖️</span>
                  <span>Baseline 1951–1980</span>
                </button>
                <button
                  onClick={() => setShowDataMethod(true)}
                  title="Click to view 146 consecutive years verification"
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    background: 'rgba(11, 29, 58, 0.8)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: 'var(--text-secondary, #CBD5E1)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>📅</span>
                  <span>146 Years (1880–2025)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sound Wave Card (Sits beside globe, not on top) */}
          <div className="earth-stage-right">
            <AudioVisualizer
              isPlaying={isPlaying}
              noteName={currentNote}
              frequency={currentFreq}
              soundMode={soundMode}
              musicalScale={musicalScale}
            />
          </div>
        </main>
      )}

      {/* Primary Tab: NASA Frames Viewport */}
      {activeTab === 'frames' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <JukeboxTab
            dataset={dataset}
            selectedYear={selectedYear}
          />
        </div>
      )}

      {/* Primary Tab: Educational Learn Viewport */}
      {activeTab === 'learn' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <LearnTab
            dataset={dataset}
            selectedYear={selectedYear}
            onSetYear={handleYearChange}
          />
        </div>
      )}

      {/* =========================================================
          ROW 3: SLIM PLAYER DOCK (Max 200px tall, under Earth stage, not floating)
          ========================================================= */}
      <footer className="glass player-dock">
        {/* Dock Line 1: Timeline Slider & Computed True Milestones */}
        <div style={{ width: '100%' }}>
          <TimelineSlider
            years={years}
            selectedYear={selectedYear}
            data={data}
            onChange={handleYearChange}
          />
        </div>

        {/* Dock Line 2: Controls Row (Left-to-Right layout as specified in Stage 4) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Left Controls: Big Play Button, Hear One Year, Exact | Musical Segmented Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Big Primary Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                minHeight: 44,
                padding: '0 24px',
                borderRadius: 10,
                background: isPlaying
                  ? 'linear-gradient(135deg, #FC3D21 0%, #B91C1C 100%)'
                  : 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: isPlaying ? '0 0 20px rgba(252,61,33,0.45)' : '0 0 20px rgba(0,212,255,0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              aria-label={isPlaying ? 'Pause time-lapse playback' : 'Play time-lapse playback'}
            >
              <span>{isPlaying ? '⏸ Pause' : '▶ Play Timeline'}</span>
            </button>

            {/* Hear One Year Button */}
            <button
              onClick={handlePlayTone}
              style={{
                minHeight: 44,
                padding: '0 16px',
                borderRadius: 10,
                background: 'rgba(11, 29, 58, 0.75)',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Audition full single-year tone"
            >
              <span>🎵</span>
              <span>Hear One Year</span>
            </button>

            {/* Segmented Control "Sound: Exact | Musical" with helper text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(2, 6, 17, 0.75)',
                  borderRadius: 8,
                  padding: 3,
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                }}
                role="radiogroup"
                aria-label="Sound mapping mode"
              >
                <button
                  onClick={() => setSoundMode('scientific')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: soundMode === 'scientific' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                    color: soundMode === 'scientific' ? '#FFFFFF' : 'var(--text-secondary, #CBD5E1)',
                  }}
                  role="radio"
                  aria-checked={soundMode === 'scientific'}
                >
                  Exact
                </button>
                <button
                  onClick={() => setSoundMode('musical')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: soundMode === 'musical' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                    color: soundMode === 'musical' ? '#FFFFFF' : 'var(--text-secondary, #CBD5E1)',
                  }}
                  role="radio"
                  aria-checked={soundMode === 'musical'}
                >
                  Musical
                </button>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted, #94A3B8)', paddingLeft: 4 }}>
                Exact = true pitch. Musical = rounded to scale.
              </span>
            </div>

            {/* Sound Mixer Modal Trigger */}
            <button
              onClick={() => setShowSoundMixer(true)}
              style={{
                minHeight: 44,
                padding: '0 14px',
                borderRadius: 10,
                background: 'rgba(11, 29, 58, 0.65)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00D4FF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🎛️</span>
              <span>Sound Mixer</span>
            </button>

            {/* More Options (Renamed from Advanced Controls) */}
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              style={{
                minHeight: 44,
                padding: '0 14px',
                borderRadius: 10,
                background: showMoreOptions ? 'rgba(0, 212, 255, 0.25)' : 'rgba(11, 29, 58, 0.55)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: 'var(--text-secondary, #CBD5E1)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              aria-expanded={showMoreOptions}
            >
              <span>⚙️</span>
              <span>{showMoreOptions ? 'Close options' : 'More options'}</span>
            </button>
          </div>

          {/* Right: The Rule Line in Plain English */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00D4FF' }}>
              Warmer year = higher pitch
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-secondary, #CBD5E1)' }}>
              −0.5 °C (220 Hz) → +1.3 °C (880 Hz)
            </div>
          </div>
        </div>

        {/* Collapsible More Options Panel */}
        {showMoreOptions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary, #CBD5E1)', fontWeight: 600 }}>
                Speed:
              </span>
              {(['slow', 'normal', 'fast'] as SpeedOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    background: speed === s ? '#00D4FF' : 'rgba(255,255,255,0.1)',
                    color: speed === s ? '#040A14' : '#CBD5E1',
                    fontWeight: 600,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Glide & Loop toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#CBD5E1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={glide}
                  onChange={(e) => setGlide(e.target.checked)}
                  style={{ accentColor: '#00D4FF' }}
                />
                <span>Glide pitch</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#CBD5E1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={looping}
                  onChange={(e) => setLooping(e.target.checked)}
                  style={{ accentColor: '#00D4FF' }}
                />
                <span>Loop</span>
              </label>
            </div>

            {/* Volume slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setMuted(!muted)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: 14 }}
              >
                {muted || volume === 0 ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (muted) setMuted(false);
                }}
                style={{ width: 80, accentColor: '#00D4FF' }}
                aria-label="Master Volume"
              />
            </div>

            {/* Quick jump to verified milestones */}
            <QuickJumps data={data} selectedYear={selectedYear} onSelectYear={handleYearChange} />

            {/* Personal exploration buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setShowBirthYear(true)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🎂 Birth Year
              </button>
              <button
                onClick={() => setShowCompare(true)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚖️ Compare
              </button>
              <button
                onClick={handlePlayDecadeChord}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🎹 Decade Chord
              </button>
            </div>
          </div>
        )}

        {/* Footer Credit Line (Stage 5) */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted, #94A3B8)',
            lineHeight: 1.3,
            paddingTop: 2,
          }}
        >
          <span>Data: NASA GISS GISTEMP v4 • Frames: NASA Scientific Visualization Studio.</span>{' '}
          <span>Independent student project using NASA data and imagery. Not endorsed by NASA. • SONIX v1.1.0</span>
        </div>
      </footer>

      {/* =========================================================
          MODALS & OVERLAYS
          ========================================================= */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {showExplainer && (
        <ExplainerModal
          year={selectedYear}
          data={data}
          onClose={() => setShowExplainer(false)}
        />
      )}

      {showCompare && (
        <CompareModal
          data={data}
          initialYear1={1900}
          initialYear2={selectedYear}
          onClose={() => setShowCompare(false)}
        />
      )}

      {showBirthYear && (
        <BirthYearModal
          data={data}
          onSelectYear={handleYearChange}
          onClose={() => setShowBirthYear(false)}
        />
      )}

      {showClassroom && (
        <ClassroomModal
          data={data}
          onSetYear={handleYearChange}
          onClose={() => setShowClassroom(false)}
        />
      )}

      {showFutureEarth && (
        <FutureEarthModal
          onClose={() => setShowFutureEarth(false)}
        />
      )}

      {showDataMethod && (
        <DataMethodModal
          dataset={dataset}
          selectedYear={selectedYear}
          onClose={() => setShowDataMethod(false)}
        />
      )}

      {showExport && (
        <ExportModal
          data={data}
          onClose={() => setShowExport(false)}
        />
      )}

      {showSources && (
        <SourcesModal
          onClose={() => setShowSources(false)}
        />
      )}

      {showSoundMixer && (
        <SoundMixerModal
          soundMode={soundMode}
          onSoundModeChange={setSoundMode}
          musicalScale={musicalScale}
          onScaleChange={setMusicalScale}
          onClose={() => setShowSoundMixer(false)}
        />
      )}

      {showPeakChart && (
        <PeakChartModal
          dataset={dataset}
          selectedYear={selectedYear}
          onClose={() => setShowPeakChart(false)}
        />
      )}

      {showGlassWorkspace && (
        <GlassWorkspaceModal
          onClose={() => setShowGlassWorkspace(false)}
        />
      )}

      <MoreDrawer
        isOpen={showMoreDrawer}
        onClose={() => setShowMoreDrawer(false)}
        onOpenBirthYear={() => setShowBirthYear(true)}
        onOpenCompare={() => setShowCompare(true)}
        onOpenDecadeChord={handlePlayDecadeChord}
        onOpenAutoTour={() => setIsAutoTourActive(true)}
        onOpenExplainer={() => setShowExplainer(true)}
        onOpenClassroom={() => setShowClassroom(true)}
        onOpenFutureEarth={() => setShowFutureEarth(true)}
        onOpenDataMethod={() => setShowDataMethod(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenSources={() => setShowSources(true)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenPeakChart={() => setShowPeakChart(true)}
        onOpenGlassWorkspace={() => setShowGlassWorkspace(true)}
        onCopyLink={handleCopyLink}
        onToggleRecording={handleToggleRecording}
        isRecording={isRecording}
      />

      {isAutoTourActive && (
        <AutoTour
          data={data}
          onSetYear={handleYearChange}
          onOpenExplainer={() => setShowExplainer(true)}
          onClose={() => setIsAutoTourActive(false)}
        />
      )}

      {/* Onboarding Coach-Mark */}
      <CoachMark visible={showCoachMark} onDismiss={dismissCoachMark} />

      {/* Share Link Copied Toast */}
      {linkCopiedToast && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 8px 30px rgba(0, 212, 255, 0.45)',
            zIndex: 200,
          }}
        >
          ✓ Shareable link copied to clipboard!
        </div>
      )}
    </div>
  );
}
