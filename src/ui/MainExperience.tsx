import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import type { GistempDataset } from '../data/types';
import { audioEngine } from '../audio/engine';
import { anomalyToFrequency, frequencyToNoteName } from '../audio/sonify';
import { getRecordForYear } from '../data/loadData';
import { setUrlState, copyShareableLink, type AppUrlState } from '../utils/urlState';
import { demoScreenRecorder } from '../utils/screenRecorder';
import EarthGlobe from '../globe/EarthGlobe';
import YearDisplay from './YearDisplay';
import TimelineSlider from './TimelineSlider';
import TemperatureChart from './TemperatureChart';
import TransportControls, { type SpeedOption } from './TransportControls';
import AudioVisualizer from './AudioVisualizer';
import JukeboxTab from './JukeboxTab';
import DataBadge from './DataBadge';
import ExplainerModal from './ExplainerModal';
import CompareModal from './CompareModal';
import AboutModal from './AboutModal';
import AutoTour from './AutoTour';
import BirthYearModal from './BirthYearModal';
import ClassroomModal from './ClassroomModal';
import EICModal from './EICModal';
import FutureEarthModal from './FutureEarthModal';
import DataMethodModal from './DataMethodModal';
import ExportModal from './ExportModal';

interface MainExperienceProps {
  dataset: GistempDataset;
  initialParams?: AppUrlState;
}

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

  // View mode: 'globe' (3D planetary view) vs 'jukebox' (EIC visual frames)
  const [viewMode, setViewMode] = useState<'globe' | 'jukebox'>('globe');

  // Selected year state (default from URL or 2024)
  const [selectedYear, setSelectedYear] = useState<number>(initialParams?.year ?? 2024);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<SpeedOption>(initialParams?.speed ?? 'normal');
  const [glide, setGlide] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.65);
  const [muted, setMuted] = useState<boolean>(false);
  const [looping, setLooping] = useState<boolean>(false);

  // Sound mode: 'musical' (harmonious scales) vs 'scientific' (exact raw pitch)
  const [soundMode, setSoundMode] = useState<'musical' | 'scientific'>('musical');

  // Theme: Deep Space ('dark') vs Daylight ('light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('earth_jukebox_theme') as 'dark' | 'light') || 'dark';
  });

  // Demo clip video recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState<number>(0);

  // Pulse animation on the 3D globe
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);

  // Modals & Panels
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showBirthYear, setShowBirthYear] = useState<boolean>(initialParams?.mode === 'birthyear');
  const [showClassroom, setShowClassroom] = useState<boolean>(initialParams?.mode === 'classroom');
  const [showEIC, setShowEIC] = useState<boolean>(false);
  const [showFutureEarth, setShowFutureEarth] = useState<boolean>(false);
  const [showDataMethod, setShowDataMethod] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [isAutoTourActive, setIsAutoTourActive] = useState<boolean>(false);

  // Link copy toast
  const [linkCopiedToast, setLinkCopiedToast] = useState<boolean>(false);

  // Accessibility settings
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Timelapse timer ref
  const timelapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAnomalyRef = useRef<number | undefined>(undefined);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('earth_jukebox_theme', theme);
  }, [theme]);

  // Sync sound mode with audio engine
  useEffect(() => {
    audioEngine.soundMode = soundMode;
  }, [soundMode]);

  // Current record
  const currentRecord = getRecordForYear(data, selectedYear) ?? data[data.length - 1];
  const currentAnomaly = currentRecord.anomaly;
  const currentFreq = audioEngine.getPitchForAnomaly(currentAnomaly);
  const currentNote = frequencyToNoteName(currentFreq);

  // Synchronize URL parameters
  useEffect(() => {
    let mode: 'jukebox' | 'classroom' | 'birthyear' = 'jukebox';
    if (showClassroom) mode = 'classroom';
    else if (showBirthYear) mode = 'birthyear';

    setUrlState({
      year: selectedYear,
      speed,
      mode,
    });
  }, [selectedYear, speed, showClassroom, showBirthYear]);

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

  // Play single year tone (1.6 seconds rich phrase)
  const handlePlayTone = useCallback(() => {
    const freq = audioEngine.playTone(currentAnomaly, 1.6);
    setPulseTrigger(Date.now());
    speakCurrent(selectedYear, currentAnomaly, freq);
  }, [currentAnomaly, selectedYear, speakCurrent]);

  // Play Decade Chord
  const handlePlayDecadeChord = useCallback(() => {
    const decadeStart = Math.floor(selectedYear / 10) * 10;
    const decadeEnd = decadeStart + 9;
    const decadeRecords = data.filter((d) => d.year >= decadeStart && d.year <= decadeEnd);

    if (decadeRecords.length > 0) {
      setPulseTrigger(Date.now());
      audioEngine.playDecadeChord(decadeRecords, (arpYear) => {
        setSelectedYear(arpYear);
      });
    }
  }, [data, selectedYear]);

  // Trigger sound when jumping years manually
  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      const rec = getRecordForYear(data, year);
      if (rec) {
        if (!isPlaying) {
          audioEngine.playNote(rec.anomaly, 190, prevAnomalyRef.current, glide);
          setPulseTrigger(Date.now());
          prevAnomalyRef.current = rec.anomaly;
          speakCurrent(year, rec.anomaly, audioEngine.getPitchForAnomaly(rec.anomaly));
        }
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
    } else {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        alert('Could not find active canvas for recording.');
        return;
      }
      setIsRecording(true);
      setRecordElapsedSec(0);
      demoScreenRecorder.startRecording(
        canvas,
        (sec) => setRecordElapsedSec(sec),
        (_blob, url) => {
          setIsRecording(false);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Earth616-Submission-Demo-${Date.now()}.webm`;
          a.click();
        }
      );
    }
  };

  // Timelapse playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timelapseTimerRef.current) clearTimeout(timelapseTimerRef.current);
      audioEngine.stopDrone();
      return;
    }

    audioEngine.startDrone(55);
    const intervalMs = SPEED_MS[speed];

    const step = (yr: number) => {
      if (!isPlaying) return;
      setSelectedYear(yr);
      const rec = getRecordForYear(data, yr);
      if (rec) {
        audioEngine.playNote(rec.anomaly, intervalMs * 0.9, prevAnomalyRef.current, glide);
        setPulseTrigger(Date.now());
        prevAnomalyRef.current = rec.anomaly;
      }

      const nextYear = yr + 1;
      if (nextYear > maxYear) {
        if (looping) {
          timelapseTimerRef.current = setTimeout(() => step(minYear), intervalMs + 60);
        } else {
          setIsPlaying(false);
          audioEngine.stopDrone();
          prevAnomalyRef.current = undefined;
        }
      } else {
        timelapseTimerRef.current = setTimeout(() => step(nextYear), intervalMs);
      }
    };

    step(selectedYear);

    return () => {
      if (timelapseTimerRef.current) clearTimeout(timelapseTimerRef.current);
      audioEngine.stopDrone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, glide, looping]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleYearChange(Math.max(minYear, selectedYear - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleYearChange(Math.min(maxYear, selectedYear + 1));
          break;
        case 'Home':
          e.preventDefault();
          handleYearChange(minYear);
          break;
        case 'End':
          e.preventDefault();
          handleYearChange(maxYear);
          break;
        case 'PageUp':
          e.preventDefault();
          handleYearChange(Math.min(maxYear, selectedYear + 10));
          break;
        case 'PageDown':
          e.preventDefault();
          handleYearChange(Math.max(minYear, selectedYear - 10));
          break;
        case ' ':
          e.preventDefault();
          handlePlayTone();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setMuted((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedYear, minYear, maxYear, handleYearChange, handlePlayTone]);

  const formatRecordTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme === 'light' ? '#E2E8F0' : 'var(--color-bg, #040A18)',
        color: theme === 'light' ? '#0F172A' : '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        filter: highContrast ? 'contrast(1.35)' : 'none',
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(5, 12, 28, 0.8)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          zIndex: 40,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Title, Badge & Primary Mode Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🌍</span>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 0.5,
              }}
            >
              Earth 616
            </span>
          </div>

          <DataBadge dataset={dataset} />

          {/* View Mode Switcher: 3D Globe vs Frame Jukebox */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(4, 10, 24, 0.4)',
              borderRadius: 6,
              padding: 2,
              border: '1px solid rgba(0, 212, 255, 0.25)',
            }}
          >
            <button
              onClick={() => setViewMode('globe')}
              style={{
                ...navBtnStyle,
                background: viewMode === 'globe' ? 'rgba(0, 212, 255, 0.25)' : 'transparent',
                borderColor: viewMode === 'globe' ? '#00D4FF' : 'transparent',
                color: viewMode === 'globe' ? '#00D4FF' : '#94A3B8',
                fontWeight: viewMode === 'globe' ? 700 : 500,
              }}
            >
              🌐 3D Globe
            </button>
            <button
              onClick={() => setViewMode('jukebox')}
              style={{
                ...navBtnStyle,
                background: viewMode === 'jukebox' ? 'rgba(249, 115, 22, 0.3)' : 'transparent',
                borderColor: viewMode === 'jukebox' ? '#F97316' : 'transparent',
                color: viewMode === 'jukebox' ? '#F97316' : '#94A3B8',
                fontWeight: viewMode === 'jukebox' ? 700 : 500,
              }}
              title="NASA Earth Information Center Frame Sonifier Jukebox"
            >
              🎨 EIC Frame Jukebox
            </button>
          </div>
        </div>

        {/* Action Controls & Modals */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Record Demo Clip Button */}
          <button
            onClick={handleToggleRecording}
            style={{
              ...navBtnStyle,
              background: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
              borderColor: isRecording ? '#EF4444' : 'rgba(255, 255, 255, 0.2)',
              color: isRecording ? '#EF4444' : '#E2E8F0',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Records a high-quality video/audio clip of your canvas for submission demo"
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isRecording ? '#EF4444' : '#94A3B8',
                boxShadow: isRecording ? '0 0 8px #EF4444' : 'none',
                animation: isRecording ? 'pulse 1s infinite alternate' : 'none',
              }}
            />
            <span>{isRecording ? `REC ${formatRecordTime(recordElapsedSec)} / 02:00` : '📹 Record Clip'}</span>
          </button>

          {/* NASA EIC Info */}
          <button
            onClick={() => setShowEIC(true)}
            style={{
              ...navBtnStyle,
              background: 'rgba(0, 212, 255, 0.12)',
              borderColor: 'rgba(0, 212, 255, 0.35)',
              color: '#00D4FF',
            }}
            title="See it in NASA's Earth Information Center (EIC)"
          >
            🏛️ NASA EIC
          </button>

          {/* Hear Your Birth Year */}
          <button
            onClick={() => setShowBirthYear(true)}
            style={navBtnStyle}
            title="Hear Your Birth Year (Personalized comparison)"
          >
            🎂 Birth Year
          </button>

          {/* Classroom Guided Mode */}
          <button
            onClick={() => setShowClassroom(true)}
            style={navBtnStyle}
            title="Classroom / Guided Mode (5-step interactive lesson)"
          >
            🎓 Classroom
          </button>

          {/* What am I hearing? button */}
          <button
            onClick={() => setShowExplainer(true)}
            style={navBtnStyle}
            title="What am I hearing? (Bilingual scientific explainer)"
          >
            🎧 What am I hearing?
          </button>

          {/* Compare button */}
          <button
            onClick={() => setShowCompare(true)}
            style={navBtnStyle}
            title="Compare two years back-to-back"
          >
            ⚖️ Compare
          </button>

          {/* Data & Method */}
          <button
            onClick={() => setShowDataMethod(true)}
            style={navBtnStyle}
            title="Data & Method (Formulas, live calculation, limitations)"
          >
            🔬 Method
          </button>

          {/* Export Audio / PNG */}
          <button
            onClick={() => setShowExport(true)}
            style={navBtnStyle}
            title="Export time-lapse as WAV audio or chart as PNG"
          >
            💾 Export
          </button>

          {/* Future Earth Teaser */}
          <button
            onClick={() => setShowFutureEarth(true)}
            style={navBtnStyle}
            title="Future Earth Roadmap (Wind, precipitation, wildfire sonification)"
          >
            🚀 Future
          </button>

          {/* Shareable Link Button */}
          <button
            onClick={handleCopyLink}
            style={{
              ...navBtnStyle,
              borderColor: linkCopiedToast ? '#22C55E' : 'rgba(0, 212, 255, 0.3)',
              color: linkCopiedToast ? '#22C55E' : '#E0F2FE',
            }}
            title="Copy shareable link with current year and settings"
          >
            {linkCopiedToast ? '✓ Copied!' : '🔗 Share'}
          </button>

          {/* 100-Second Auto-Tour */}
          <button
            onClick={() => setIsAutoTourActive(true)}
            style={{
              ...navBtnStyle,
              background: 'rgba(252, 61, 33, 0.25)',
              borderColor: '#FC3D21',
              color: '#FFFFFF',
              fontWeight: 700,
            }}
            title="Start 100-second automated video presentation tour"
          >
            ▶ Auto-Tour (100s)
          </button>

          {/* About / Credits */}
          <button
            onClick={() => setShowAbout(true)}
            style={navBtnStyle}
            title="About the project, challenge alignment, and team"
          >
            ℹ️ About
          </button>

          {/* Theme Toggle Button (Day / Space) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Daylight Theme' : 'Switch to Deep Space Theme'}
            style={{
              ...iconToggleStyle,
              background: theme === 'dark' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 176, 32, 0.2)',
            }}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {/* Accessibility Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 2 }}>
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? 'Spoken narration enabled' : 'Enable spoken narration (Web Speech API)'}
              aria-pressed={speechEnabled}
              style={{
                ...iconToggleStyle,
                background: speechEnabled ? 'rgba(0, 212, 255, 0.3)' : 'transparent',
                color: speechEnabled ? '#00D4FF' : '#94A3B8',
              }}
            >
              🗣️
            </button>

            <button
              onClick={() => setReduceMotion(!reduceMotion)}
              title={reduceMotion ? 'Reduced motion active' : 'Reduce motion'}
              aria-pressed={reduceMotion}
              style={{
                ...iconToggleStyle,
                background: reduceMotion ? 'rgba(0, 212, 255, 0.3)' : 'transparent',
                color: reduceMotion ? '#00D4FF' : '#94A3B8',
              }}
            >
              🚸
            </button>

            <button
              onClick={() => setHighContrast(!highContrast)}
              title={highContrast ? 'High contrast active' : 'Toggle high contrast mode'}
              aria-pressed={highContrast}
              style={{
                ...iconToggleStyle,
                background: highContrast ? 'rgba(0, 212, 255, 0.3)' : 'transparent',
                color: highContrast ? '#00D4FF' : '#94A3B8',
              }}
            >
              👁️
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {viewMode === 'jukebox' ? (
          <JukeboxTab
            dataset={dataset}
            selectedYear={selectedYear}
            onClose={() => setViewMode('globe')}
            getCanvasElement={() => document.querySelector('canvas')}
          />
        ) : (
          <>
            {/* 3D Scene Viewport */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              <Canvas
                gl={{
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.15,
                }}
                camera={{ position: [0, 0, 3.1], fov: 45 }}
                style={{ width: '100%', height: '100%', background: 'transparent' }}
              >
                <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade />
                <ambientLight intensity={0.12} />
                <hemisphereLight args={['#1E3A6E', '#040A18', 0.55]} />
                <directionalLight position={[5.5, 2.0, 4.0]} intensity={1.85} color="#FFF8EE" castShadow />

                <Suspense fallback={null}>
                  <EarthGlobe
                    anomaly={currentAnomaly}
                    isPlaying={isPlaying}
                    pulseTrigger={pulseTrigger}
                    pulseFreq={currentFreq}
                    reduceMotion={reduceMotion}
                  />
                </Suspense>

                <OrbitControls
                  enablePan={false}
                  minDistance={2.0}
                  maxDistance={7.0}
                  autoRotate={!isPlaying && !reduceMotion}
                  autoRotateSpeed={0.35}
                  makeDefault
                />
              </Canvas>

              {/* Floating Now Playing Card HUD (Top Left) */}
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: 18,
                  zIndex: 20,
                  pointerEvents: 'none',
                }}
              >
                <YearDisplay
                  year={selectedYear}
                  anomaly={currentAnomaly}
                  frequency={currentFreq}
                  noteName={currentNote}
                  isPlaying={isPlaying}
                  soundMode={soundMode}
                  onToggleSoundMode={() =>
                    setSoundMode(soundMode === 'musical' ? 'scientific' : 'musical')
                  }
                />
              </div>
            </div>

            {/* Right Sidebar Control Deck */}
            <aside
              style={{
                width: 'clamp(330px, 26vw, 385px)',
                minWidth: 320,
                maxHeight: '100%',
                overflowY: 'auto',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: theme === 'light' ? 'rgba(248, 250, 252, 0.9)' : 'rgba(7, 18, 38, 0.85)',
                borderLeft: '1px solid rgba(0, 212, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                zIndex: 30,
                boxSizing: 'border-box',
              }}
            >
              {/* Transport Controls */}
              <TransportControls
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onPrev={() => handleYearChange(Math.max(minYear, selectedYear - 1))}
                onNext={() => handleYearChange(Math.min(maxYear, selectedYear + 1))}
                onPlayTone={handlePlayTone}
                onPlayDecadeChord={handlePlayDecadeChord}
                speed={speed}
                onSpeedChange={setSpeed}
                glide={glide}
                onGlideChange={setGlide}
                volume={volume}
                onVolumeChange={setVolume}
                muted={muted}
                onMuteChange={setMuted}
                looping={looping}
                onLoopingChange={setLooping}
              />

              {/* Real-time Oscilloscope */}
              <AudioVisualizer isPlaying={isPlaying} />

              {/* Timeline and Warming Stripes */}
              <TimelineSlider
                years={years}
                selectedYear={selectedYear}
                data={data}
                onChange={handleYearChange}
              />

              {/* Temperature Anomaly Line Chart */}
              <TemperatureChart
                data={data}
                selectedYear={selectedYear}
                onYearClick={handleYearChange}
              />
            </aside>
          </>
        )}
      </div>

      {/* Modals & Auto-tour overlay */}
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
          initialYear1={1880}
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

      {showEIC && (
        <EICModal onClose={() => setShowEIC(false)} />
      )}

      {showFutureEarth && (
        <FutureEarthModal onClose={() => setShowFutureEarth(false)} />
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

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}

      {isAutoTourActive && (
        <AutoTour
          data={data}
          onSetYear={(yr) => setSelectedYear(yr)}
          onOpenExplainer={() => setShowExplainer(true)}
          onClose={() => setIsAutoTourActive(false)}
        />
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(11, 61, 145, 0.4)',
  border: '1px solid rgba(0, 212, 255, 0.3)',
  borderRadius: 6,
  color: '#E0F2FE',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  padding: '4px 8px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

const iconToggleStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 6,
  padding: '3px 6px',
  fontSize: 12,
  cursor: 'pointer',
};
