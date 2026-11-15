import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import type { GistempDataset } from '../data/types';
import { audioEngine } from '../audio/engine';
import { frequencyToNoteName, type MusicalScaleType } from '../audio/sonify';
import { getRecordForYear } from '../data/loadData';
import { setUrlState, copyShareableLink, type AppUrlState } from '../utils/urlState';
import { demoScreenRecorder } from '../utils/screenRecorder';
import EarthGlobe, { type EarthDisplayPreset } from '../globe/EarthGlobe';
import YearDisplay from './YearDisplay';
import TimelineSlider from './TimelineSlider';
import AudioVisualizer from './AudioVisualizer';
import JukeboxTab from './JukeboxTab';
import LearnTab from './LearnTab';
import QuickJumps from './QuickJumps';
import ExplainerModal from './ExplainerModal';
import CompareModal from './CompareModal';
import AboutModal from './AboutModal';
import AutoTour from './AutoTour';
import BirthYearModal from './BirthYearModal';
import ClassroomModal from './ClassroomModal';
import FutureEarthModal from './FutureEarthModal';
import DataMethodModal from './DataMethodModal';
import ExportModal from './ExportModal';
import SourcesModal from './SourcesModal';
import SoundMixerModal from './SoundMixerModal';
import AccessibilityDropdown from './AccessibilityDropdown';
import CoachMark from './CoachMark';
import MoreDrawer from './MoreDrawer';

interface MainExperienceProps {
  dataset: GistempDataset;
  initialParams?: AppUrlState;
}

export type PrimaryTab = 'earth' | 'frames' | 'learn';
export type SpeedOption = 'slow' | 'normal' | 'fast';

const SPEED_MS: Record<SpeedOption, number> = {
  slow: 400,
  normal: 220,
  fast: 100,
};

export default function MainExperience({ dataset, initialParams }: MainExperienceProps) {
  const { data } = dataset;
  const years = data.map((d) => d.year);
  const minYear = years[0] ?? 1880;
  const maxYear = years[years.length - 1] ?? 2025;

  // Active Primary Tab: 'earth' | 'frames' | 'learn'
  const [activeTab, setActiveTab] = useState<PrimaryTab>(() => {
    if (initialParams?.mode === 'classroom') return 'learn';
    return 'earth';
  });

  // Selected year state
  const [selectedYear, setSelectedYear] = useState<number>(initialParams?.year ?? 2024);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<SpeedOption>(initialParams?.speed ?? 'normal');
  const [glide, setGlide] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.65);
  const [muted, setMuted] = useState<boolean>(false);
  const [looping, setLooping] = useState<boolean>(false);

  // Sound mode & musical scale
  const [soundMode, setSoundMode] = useState<'scientific' | 'musical'>('musical');
  const [musicalScale, setMusicalScale] = useState<MusicalScaleType>('dorian');
  const [showSoundMixer, setShowSoundMixer] = useState<boolean>(false);

  // Earth display preset
  const [displayPreset, setDisplayPreset] = useState<EarthDisplayPreset>('natural');

  // Theme: Dark ('dark') vs Daylight ('light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('earth_jukebox_theme') as 'dark' | 'light') || 'dark';
  });

  // First-run coach-mark
  const [showCoachMark, setShowCoachMark] = useState<boolean>(() => {
    return !localStorage.getItem('earth_jukebox_coach_dismissed');
  });

  // Advanced controls collapsible drawer
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);

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
    audioEngine.musicalScale = musicalScale;
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
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-solid, #050B1A)',
      }}
    >
      {/* Screen Reader ARIA Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        Year {selectedYear}, Anomaly {currentAnomaly >= 0 ? '+' : ''}{currentAnomaly.toFixed(2)} degrees Celsius, pitch {Math.round(currentFreq)} Hertz, note {currentNote}.
      </div>

      {/* TOP BAR: Max 5 Visible Items */}
      <header
        className="glass app-header"
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          right: 12,
          height: 52,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderRadius: 14,
        }}
      >
        {/* 1. Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, cursor: 'pointer' }} onClick={() => setActiveTab('earth')}>🌍</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary, #FFFFFF)', letterSpacing: -0.3, lineHeight: 1 }}>
              Earth 616
            </div>
            <div style={{ fontSize: 10, color: '#00D4FF', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
              NASA Space Apps 2026
            </div>
          </div>
        </div>

        {/* 2. Primary Tabs: Earth | NASA Frames | Learn */}
        <nav style={{ display: 'flex', background: 'rgba(2, 6, 17, 0.6)', borderRadius: 10, padding: 3, border: '1px solid rgba(0, 212, 255, 0.2)' }}>
          <button
            onClick={() => setActiveTab('earth')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'earth' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
              color: activeTab === 'earth' ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
              transition: 'all 0.15s ease',
            }}
          >
            🌐 Earth
          </button>
          <button
            onClick={() => setActiveTab('frames')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'frames' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
              color: activeTab === 'frames' ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
              transition: 'all 0.15s ease',
            }}
          >
            🎞️ NASA Frames
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'learn' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
              color: activeTab === 'learn' ? '#FFFFFF' : 'var(--text-secondary, #94A3B8)',
              transition: 'all 0.15s ease',
            }}
          >
            🎓 Learn
          </button>
        </nav>

        {/* 3. Right Utility Icons: Theme, Accessibility Dropdown, About, More Drawer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(11, 29, 58, 0.5)',
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

          {/* 4. Accessibility Dropdown */}
          <AccessibilityDropdown
            speechEnabled={speechEnabled}
            onToggleSpeech={() => setSpeechEnabled(!speechEnabled)}
            highContrast={highContrast}
            onToggleHighContrast={() => setHighContrast(!highContrast)}
            reduceMotion={reduceMotion}
            onToggleReduceMotion={() => setReduceMotion(!reduceMotion)}
          />

          {/* 5. About Button */}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              background: 'rgba(11, 29, 58, 0.5)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: 'var(--text-primary, #FFFFFF)',
              fontSize: 12.5,
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
              fontSize: 12.5,
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

      {/* VIEWPORT BODY */}
      {activeTab === 'earth' && (
        <>
          {/* 3D WebGL Earth Canvas */}
          <div ref={canvasContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <Canvas
              camera={{ position: [0, 0, 2.75], fov: 45, near: 0.1, far: 1000 }}
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

          {/* Floating HUD: Upper Left Quick Year Display */}
          <div
            className="glass app-hud-overlay hide-on-mobile"
            style={{
              position: 'absolute',
              top: 72,
              left: 16,
              padding: '12px 18px',
              borderRadius: 14,
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxWidth: 260,
            }}
          >
            <YearDisplay
              year={selectedYear}
              anomaly={currentAnomaly}
              frequency={currentFreq}
              noteName={currentNote}
            />
            {/* Subtle scientific badge */}
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Baseline: 1951–1980</span>
              <span style={{ color: '#00D4FF' }}>NASA GISTEMP v4</span>
            </div>
            <div style={{ fontSize: 9.5, color: '#64748B', fontStyle: 'italic' }}>
              Atmosphere rim: Artistic indicator, not a measurement
            </div>
          </div>

          {/* Floating HUD: Upper Right Live Oscilloscope */}
          <div
            className="glass hide-on-tablet"
            style={{
              position: 'absolute',
              top: 72,
              right: 16,
              padding: '10px 14px',
              borderRadius: 14,
              zIndex: 30,
              width: 240,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#00D4FF', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Audio Waveform
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                {soundMode === 'musical' ? `Musical (${musicalScale})` : 'Exact (Hz)'}
              </span>
            </div>
            <AudioVisualizer isPlaying={isPlaying} />
          </div>

          {/* Primary Bottom Control Deck */}
          <div
            className="glass app-control-deck"
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              zIndex: 80,
              padding: '12px 20px',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            {/* Row 1: Scrubber with Ed Hawkins Warming Stripes */}
            <div style={{ width: '100%' }}>
              <TimelineSlider
                years={years}
                selectedYear={selectedYear}
                data={data}
                onChange={handleYearChange}
              />
            </div>

            {/* Row 2: Transport Buttons, Mode Toggle, Sound Mixer, Advanced Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {/* Playback Transport */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Big Primary Play/Pause Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    background: isPlaying ? 'linear-gradient(135deg, #FC3D21 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isPlaying ? '0 0 20px rgba(252,61,33,0.45)' : '0 0 20px rgba(0,212,255,0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                >
                  <span>{isPlaying ? '⏸ Pause' : '▶ Play Timeline'}</span>
                </button>

                {/* Hear One Year Tone */}
                <button
                  onClick={handlePlayTone}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: 'rgba(11, 29, 58, 0.65)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Audition full single-year tone"
                >
                  🎵 Hear One Year
                </button>

                {/* Exact vs Musical Segmented Toggle */}
                <div style={{ display: 'inline-flex', background: 'rgba(2, 6, 17, 0.65)', borderRadius: 8, padding: 3, border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                  <button
                    onClick={() => setSoundMode('scientific')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: soundMode === 'scientific' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                      color: soundMode === 'scientific' ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    Exact
                  </button>
                  <button
                    onClick={() => setSoundMode('musical')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: soundMode === 'musical' ? 'linear-gradient(135deg, #0B3D91 0%, #00D4FF 100%)' : 'transparent',
                      color: soundMode === 'musical' ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    Musical
                  </button>
                </div>

                {/* Sound Mixer Modal Trigger */}
                <button
                  onClick={() => setShowSoundMixer(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(11, 29, 58, 0.5)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    color: '#00D4FF',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🎛️ Sound Mixer
                </button>
              </div>

              {/* Earth Display Presets & Advanced Controls Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Earth Visual Preset */}
                <select
                  value={displayPreset}
                  onChange={(e) => setDisplayPreset(e.target.value as EarthDisplayPreset)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(2, 6, 17, 0.8)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    color: '#FFFFFF',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                  className="hide-on-mobile"
                  aria-label="Earth visual display preset"
                >
                  <option value="natural">Earth: Natural</option>
                  <option value="vivid">Earth: Vivid Oceans</option>
                  <option value="high-contrast">Earth: High Contrast</option>
                </select>

                {/* Advanced Controls Toggle */}
                <button
                  onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: showAdvancedControls ? 'rgba(0, 212, 255, 0.2)' : 'rgba(11, 29, 58, 0.45)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    color: '#CBD5E1',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ {showAdvancedControls ? 'Hide Controls' : 'Advanced Controls'}
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Controls Drawer */}
            {showAdvancedControls && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Speed Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Time-lapse Speed:</span>
                  {(['slow', 'normal', 'fast'] as SpeedOption[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 11,
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

                {/* Glide (Portamento) & Loop Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#CBD5E1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={glide}
                      onChange={(e) => setGlide(e.target.checked)}
                      style={{ accentColor: '#00D4FF' }}
                    />
                    <span>Portamento Pitch Glide</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#CBD5E1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={looping}
                      onChange={(e) => setLooping(e.target.checked)}
                      style={{ accentColor: '#00D4FF' }}
                    />
                    <span>Loop Playback</span>
                  </label>
                </div>

                {/* Quick Inflection Year Buttons */}
                <div className="hide-on-mobile">
                  <QuickJumps data={data} selectedYear={selectedYear} onSelectYear={handleYearChange} />
                </div>
              </div>
            )}

            {/* Visible Build Marker Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10,
                color: '#64748B',
                fontFamily: 'var(--font-mono)',
                paddingTop: 4,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span>
                v1.1.0 • Built: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__.slice(0, 10) : '2026-11-15'} • NASA GISTEMP v4
              </span>
              <span>
                Independent student project using NASA data and imagery. Not endorsed by NASA.
              </span>
            </div>
          </div>
        </>
      )}

      {/* VIEWPORT: NASA Frames Tab */}
      {activeTab === 'frames' && (
        <JukeboxTab
          dataset={dataset}
          selectedYear={selectedYear}
          onClose={() => setActiveTab('earth')}
          getCanvasElement={() => document.querySelector('canvas')}
        />
      )}

      {/* VIEWPORT: Learn Tab */}
      {activeTab === 'learn' && (
        <LearnTab
          dataset={dataset}
          selectedYear={selectedYear}
          onSetYear={(yr) => {
            setSelectedYear(yr);
            setActiveTab('earth');
          }}
          onClose={() => setActiveTab('earth')}
        />
      )}

      {/* Onboarding Coach-Mark */}
      <CoachMark visible={showCoachMark} onDismiss={dismissCoachMark} />

      {/* Sound Mixer Modal */}
      {showSoundMixer && (
        <SoundMixerModal
          soundMode={soundMode}
          onSoundModeChange={setSoundMode}
          musicalScale={musicalScale}
          onScaleChange={setMusicalScale}
          onClose={() => setShowSoundMixer(false)}
        />
      )}

      {/* More Drawer */}
      <MoreDrawer
        isOpen={showMoreDrawer}
        onClose={() => setShowMoreDrawer(false)}
        onOpenBirthYear={() => setShowBirthYear(true)}
        onOpenCompare={() => setShowCompare(true)}
        onOpenDecadeChord={handlePlayDecadeChord}
        onOpenFutureEarth={() => setShowFutureEarth(true)}
        onOpenExplainer={() => setShowExplainer(true)}
        onOpenClassroom={() => setShowClassroom(true)}
        onOpenDataMethod={() => setShowDataMethod(true)}
        onCopyLink={handleCopyLink}
        onOpenExport={() => setShowExport(true)}
        onToggleRecording={handleToggleRecording}
        isRecording={isRecording}
        onOpenAutoTour={() => setIsAutoTourActive(true)}
        onOpenSources={() => setShowSources(true)}
        onOpenAbout={() => setShowAbout(true)}
      />

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showSources && <SourcesModal onClose={() => setShowSources(false)} />}
      {showBirthYear && (
        <BirthYearModal
          data={data}
          onSelectYear={(yr) => {
            handleYearChange(yr);
            setShowBirthYear(false);
          }}
          onClose={() => setShowBirthYear(false)}
        />
      )}
      {showCompare && (
        <CompareModal
          data={data}
          initialYear1={1880}
          initialYear2={selectedYear}
          onClose={() => setShowCompare(false)}
        />
      )}
      {showExplainer && (
        <ExplainerModal
          year={selectedYear}
          data={data}
          onClose={() => setShowExplainer(false)}
        />
      )}
      {showClassroom && (
        <ClassroomModal
          data={data}
          onSetYear={(yr) => {
            handleYearChange(yr);
            setShowClassroom(false);
          }}
          onClose={() => setShowClassroom(false)}
        />
      )}
      {showDataMethod && (
        <DataMethodModal
          dataset={dataset}
          selectedYear={selectedYear}
          onClose={() => setShowDataMethod(false)}
        />
      )}
      {showFutureEarth && <FutureEarthModal onClose={() => setShowFutureEarth(false)} />}
      {showExport && <ExportModal data={data} onClose={() => setShowExport(false)} />}
      {isAutoTourActive && (
        <AutoTour
          data={data}
          onSetYear={handleYearChange}
          onOpenExplainer={() => setShowExplainer(true)}
          onClose={() => setIsAutoTourActive(false)}
        />
      )}

      {/* Link Copied Toast */}
      {linkCopiedToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 84,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 212, 255, 0.95)',
            color: '#040A14',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 300,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          ✓ Shareable link copied to clipboard!
        </div>
      )}
    </div>
  );
}
