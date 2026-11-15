# CHANGELOG: SONIX Implementation Audit

All key technical decisions, bug fixes, and milestones completed during the 36-hour NASA International Space Apps Challenge.

---

## [v1.0.0] - Stage 1 & Stage 2 Complete Release (2026-11-14)

### Stage 1: Core Engine & Foundations
- **Automated NASA Data Pipeline (`scripts/fetch-data.mjs`):**
  - Implemented Node.js HTTPS stream downloader targeting NASA GISTEMP v4 (`GLB.Ts+dSST.csv`).
  - Added parser skipping metadata header and extracting calendar-year means (`J-D` column).
  - Built strict validation checking 146 consecutive years (1880–2025), no duplicate entries, no missing numbers, and finite floating-point bounds.
  - Successfully generated offline `public/data/gistemp.json` with metadata tags and citations.
- **Scientific Sonification Engine (`src/audio/sonify.ts`, `src/audio/engine.ts`):**
  - Implemented exact linear mapping formula: $-0.5\ ^\circ\text{C} \to 220\text{ Hz}$ to $+1.3\ ^\circ\text{C} \to 880\text{ Hz}$.
  - Added strict clamping for values outside range.
  - Built synthesizer with Web Audio API utilizing a fundamental sine oscillator plus a soft second harmonic ($16\%$ amplitude, $+1$ octave) for warm acoustics without clipping.
  - Implemented non-linear anti-click attack and exponential release gain envelopes.
  - Connected `DynamicsCompressorNode` limiter graph to prevent auditory distortion.
  - Supported single-year $1.2\text{s}$ tones and time-lapse $100\text{ms}-400\text{ms}$ notes with optional portamento pitch glide.
  - Complied strictly with browser autoplay security policy: audio context created exclusively upon explicit user click on the start screen.
- **Photorealistic 3D Earth (`src/globe/EarthGlobe.tsx`):**
  - Integrated Three.js and `@react-three/fiber` canvas with rotating spherical mesh.
  - Loaded day color texture, surface normal map, ocean specular roughness map, and an independent drifting cloud layer.
  - Developed custom GLSL Fresnel vertex/fragment shader for dynamic atmospheric glow.
  - Data-driven atmosphere color lerping: cool blue for cold anomalies, cyan/white for baseline, and deep red for high anomalies.
  - Added acoustic ripple mesh expanding radially across the globe proportional to note frequency upon playback.
- **Timeline & UI Controls (`src/ui/TimelineSlider.tsx`, `src/ui/YearDisplay.tsx`, `src/ui/TemperatureChart.tsx`):**
  - Huge rolling year counter with color-coded anomaly value, live frequency in Hz, and musical note name.
  - Keyboard-accessible timeline slider supporting Arrow keys, Home, End, PageUp, and PageDown.
  - High-performance custom SVG line chart with baseline zero-line, playhead indicator, and hover tooltip.
  - Verified transport controls: Play/Pause time-lapse, Previous/Next year, speed options (*slow*, *normal*, *fast*), volume slider, mute, and loop.
- **Unit Testing Suite (`tests/sonify.test.ts`, `tests/validate.test.ts`):**
  - Verified $+0.90\ ^\circ\text{C} \to 733.33\text{ Hz}$.
  - Verified endpoint clamping at $-0.5\ ^\circ\text{C}$ and $+1.3\ ^\circ\text{C}$.
  - Verified monotonic increase property and musical note name generation.
  - Verified parser error handling on corrupted data, duplicate years, and non-finite numbers.
  - Verified rank and baseline calculations.

---

### Stage 2: Advanced Mission Control & Accessibility
- **Warming Stripes Visual Scrubber:**
  - Integrated 146-stripe Ed Hawkins climate color palette under the timeline slider.
  - Clicking on any individual year's stripe immediately jumps to that year and updates the 3D globe and audio pitch.
- **Real-Time Oscilloscope Visualizer (`src/ui/AudioVisualizer.tsx`):**
  - Connected `AnalyserNode` with 1024-point FFT to a lightweight HTML5 canvas.
  - Renders glowing cyan sinusoidal waveforms in real-time sync with synthesized notes.
- **Scientific Explainer ("What Am I Hearing?" - `src/ui/ExplainerModal.tsx`):**
  - Offline calculation of year rank ($1$ to $146$), baseline anomaly difference, pre-industrial (1880–1900) difference, and decade average.
  - Built-in instant bilingual toggle between **English** and **Hindi (हिन्दी)**.
- **Historical Comparison Tool (`src/ui/CompareModal.tsx`):**
  - Dual year selectors allowing side-by-side scientific comparison and sequenced back-to-back audio playback.
  - Displays computed differences in both temperature ($^\circ\text{C}$) and frequency ($\text{Hz}$).
- **Quick Milestones Bar (`src/ui/QuickJumps.tsx`):**
  - Quick jump chips for milestone years (1880, 1940, 1976, 1998, 2016, 2023, 2024, 2025) dynamically validated against dataset records.
- **Guided 90-Second Auto-Tour (`src/ui/AutoTour.tsx`):**
  - Scripted run for submission video recording: camera fly-in, 1880 baseline, 1940 scrub, 1976–2025 time-lapse, and explainer popup.
  - Synchronized on-screen subtitles and progress bar.
- **Accessibility Enhancements:**
  - `aria-live="polite"` region continuously announcing year, anomaly, and pitch for screen readers.
  - Web Speech API narration toggle (`speechSynthesis`).
  - High-contrast mode toggle and `prefers-reduced-motion` compliance.

---

### Technical Obstacles Solved
- **Rollup Dynamic Binary Policy Resolution:**
  - In restricted Windows environments where `.node` C++ native dynamic libraries are blocked by Application Control / AppLocker, Vite initially failed loading `@rollup/rollup-win32-x64-msvc`.
  - Resolved cleanly by installing `@rollup/wasm-node` (WebAssembly build) and integrating an automated `postinstall` script in `package.json` ensuring 100% pure WebAssembly rollup compilation without native DLL execution requirements.
