# 🌍 Earth 616: The Earth Information Jukebox

> **NASA International Space Apps Challenge 2026**  
> *Challenge:* The Earth Information Jukebox  
> *Team:* **Earth 616**  
> *Scientific Core:* Authentic NASA GISTEMP v4 Surface Temperature Sonification (1880–2025)

---

## 1. Overview & Vision
**Earth 616: The Earth Information Jukebox** transforms 146 years of NASA planetary surface temperature measurements into an immersive, mathematically rigorous audio-visual instrument. 

Unlike artistic interpretations or "climate-inspired music", Earth 616 enforces **strict scientific honesty**:
- Every audible tone is calculated deterministically from real temperature anomaly measurements.
- Higher global temperature produces a strictly higher musical pitch.
- Zero randomized notes, no subjective arrangement, no fabricated data points.

---

## 2. Interactive Features

### 🌐 Dynamic 3D Earth Globe (Hero Visual)
- Continuously rotating photorealistic 3D planet rendered in WebGL using Three.js and `@react-three/fiber`.
- Day surface texture, ocean specular reflection map, surface normal relief map, and an independent, drifting cloud layer.
- Realistic solar lighting showcasing the rotating day/night terminator.
- **Data-Driven Atmospheric Fresnel Glow:** Custom GLSL shaders dynamically transition the atmospheric haze from deep polar blue (negative anomalies) to icy cyan, warm amber, and fiery solar red (+1.28 °C record years).
- **Acoustic Pulse Ripple:** Each time a temperature note plays, an acoustic wavefront ripple propagates outward across the globe, with its expansion diameter scaling with note frequency.
- Interactive OrbitControls with automatic rotation resumption after 3 seconds of user inactivity.

### 🎵 Sonification Engine (Web Audio API)
- Zero external sound files — 100% synthesized in real-time in the browser.
- Warm sinusoidal fundamental tone blended with a soft second harmonic for natural resonance.
- Anti-click envelope shaping (60ms attack, exponential release) connected to a safety limiter (`DynamicsCompressorNode`).
- **Single-Year Tone:** 1.2-second full harmonic analysis.
- **Time-Lapse Mode:** Automated chronological playback through 1880–2025 at selectable speeds (*Slow 400ms*, *Normal 220ms*, *Fast 100ms*).
- **Portamento Glide Toggle:** Smooth musical frequency interpolation between consecutive years.
- **Live Oscilloscope:** Real-time canvas waveform visualizer powered by `AnalyserNode`.

### 📊 Mission Control HUD & Analytics
- **Animated Year Display:** Large rolling counter showcasing the selected year, formatted anomaly (e.g., `+1.28 °C`), frequency in Hz, and nearest musical note name.
- **Warming Stripes Visual Scrubber:** Ed Hawkins-style warming stripes under the timeline slider acting as a direct click-to-jump scrubber.
- **Interactive SVG Line Chart:** Vector graph of global anomalies (1880–2025) with baseline zero-line, interactive hover tooltips, and a moving playhead.
- **Quick Milestones:** Rapid jump chips for landmark climate years (1880, 1940, 1976, 1998, 2016, 2023, 2024, 2025) verified from loaded data.
- **"What Am I Hearing?" Scientific Explainer:** Modal providing dynamic breakdown of the selected year's rank among all 146 years, comparison against the 1951–1980 baseline, comparison against pre-industrial (1880–1900) averages, and decade normal. Includes an instant **English / Hindi (हिन्दी)** bilingual toggle.
- **Compare Mode:** Select any two historical years and play their tones back-to-back to directly perceive shifts in temperature and frequency.
- **Automated 90-Second Demo Tour:** Scripted screen-recording mode with on-screen English subtitles guiding judges through key historical transitions.

---

## 3. Exact Sonification Formula

$$\text{Frequency (Hz)} = 220.0 + \left(\frac{\text{Anomaly} - (-0.5)}{1.3 - (-0.5)}\right) \times (880.0 - 220.0)$$

- **Anomaly Minimum:** $-0.50\ ^\circ\text{C} \longrightarrow 220.0\text{ Hz}$ (Musical note **A3**)
- **Baseline Zero:** $0.00\ ^\circ\text{C} \longrightarrow 403.3\text{ Hz}$ (Musical note **G4**)
- **Check Value:** $+0.90\ ^\circ\text{C} \longrightarrow 733.3\text{ Hz}$ (Musical note **F#5**)
- **Anomaly Maximum:** $+1.30\ ^\circ\text{C} \longrightarrow 880.0\text{ Hz}$ (Musical note **A5**)
- Clamping is strictly applied to any anomaly values outside the $[-0.5, +1.3]$ range.

---

## 4. Real Data Pipeline

All scientific measurements originate from the **NASA Goddard Institute for Space Studies (GISS)**:
- **Source:** GISTEMP v4 Surface Temperature Analysis (Global Land-Ocean Temperature Index: `GLB.Ts+dSST.csv`)
- **Direct NASA URL:** `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv`
- **Data Pipeline Script:** `scripts/fetch-data.mjs` downloads the live CSV, strips metadata headers, parses the annual meteorological mean (`J-D` column), validates 146 consecutive years (1880–2025) without gaps or non-finite values, and compiles `public/data/gistemp.json`.
- The bundled JSON is shipped with the app so that Earth 616 operates 100% offline without live NASA network dependencies.

To re-fetch and validate data at any time:
```bash
npm run fetch-data
```

---

## 5. Accessibility (WCAG 2.1 AA)

- **Keyboard Navigable:** Full functionality via `ArrowLeft` / `ArrowRight` (±1 year), `PageUp` / `PageDown` (±10 years), `Home` (1880), `End` (2025), `Space` (Play single tone), and `P` (Toggle time-lapse).
- **Screen Reader Announcements:** High-priority `aria-live="polite"` region continuously announces:  
  *e.g., "Year 2015, anomaly plus 0.90 degrees Celsius, pitch 733 hertz."*
- **Speech Synthesis:** Built-in Web Speech API (`speechSynthesis`) toggle for auditory readouts.
- **High-Contrast Mode:** One-click toggle for high-contrast presentation.
- **Reduced Motion Support:** Respects `prefers-reduced-motion` and includes an on-screen toggle to freeze globe auto-rotation and ripple effects.
- **Multimodal Feedback:** Information is never encoded solely by color; numerical labels, units, and frequencies accompany every visualization.

---

## 6. Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm (v8 or newer)

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/nasa-earth-jukebox.git
cd nasa-earth-jukebox

# Install dependencies (includes WebAssembly Rollup patch)
npm install

# Download and validate latest NASA GISTEMP dataset
npm run fetch-data

# Run unit test suite (Vitest)
npm run test

# Launch local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```
The compiled, zero-backend static build is saved to `dist/`, ready for immediate hosting on **Vercel**, **Netlify**, or **GitHub Pages**.

---

## 7. Limitations & Scope

- **Global Means:** The dataset reflects annual global surface temperature averages. It represents whole-planet thermodynamic energy shifts, not daily weather variations or localized microclimates.
- **Climatological Baseline:** Temperatures are expressed as anomalies relative to the internationally standardized 1951–1980 baseline normal.

---

## 8. Space Apps Submission Narrative & Citations

- Full Space Apps Challenge submission text is available in [SUBMISSION.md](SUBMISSION.md).
- Complete references, licenses, and formal NASA citations are cataloged in [REFERENCES.md](REFERENCES.md).
- Demonstration video script is detailed in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
- Project evolution and implementation audit is documented in [CHANGELOG.md](CHANGELOG.md).

---

## 9. License

This project is open-source under the [MIT License](LICENSE).  
Copyright © 2026 Team Earth 616.
