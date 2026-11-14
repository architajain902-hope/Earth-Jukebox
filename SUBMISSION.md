# NASA International Space Apps Challenge 2026: Project Submission

## Project Name: Earth 616: The Earth Information Jukebox
**Team Name:** Earth 616  
**Local Event:** Bhopal, India  
**Challenge:** The Earth Information Jukebox  

---

### 1. Challenge Selection
**Challenge:** The Earth Information Jukebox  
**Why this challenge:** NASA's Earth Information Center creates world-class visual frames of our changing climate. Earth 616 directly answers this challenge by translating these visual anomalies into dynamic, real-time synthesized sound, making planetary climate change accessible, auditory, and intuitive for everyone.

---

### 2. High-Level Summary
*Word count: 96 words (Limit: at most 120 words)*

Earth 616: The Earth Information Jukebox translates 146 years (1880–2025) of NASA global surface temperature anomalies into an interactive 3D audio-visual instrument. Pairing NASA Earth Information Center visual frames with real-time Web Audio synthesis, every pitch is mathematically calculated from real data: higher temperature anomaly produces higher pitch. Users can scrub history, play automated time-lapses, audition decade chords, compare birth years, and explore offline bilingual English/Hindi explainers. Built with strict scientific honesty and zero pre-recorded audio, Earth 616 delivers an accessible, universal way to hear and see our warming planet.

---

### 3. Detailed Project Description

#### The Problem
Earth observation visualizations produced by NASA—such as global temperature anomaly heatmaps—are visually stunning, but they remain abstract to the general public and inaccessible to blind and low-vision individuals. Furthermore, artistic "climate music" projects frequently compromise scientific rigor by improvising arbitrary melodies that have no mathematical relationship to real data.

#### Our Approach & Core Philosophy
Earth 616 is founded on **strict scientific honesty**:
1. Sound is generated directly from physical data values; we never fake, invent, or randomize climate measurements.
2. Sound is synthesized 100% in real time inside the browser using the Web Audio API without relying on pre-recorded audio files.
3. Every numerical value displayed or quoted in the application is computed dynamically from verified NASA records at runtime.

#### Technical Methodology

##### 1. Data Ingestion & Offline Validation Pipeline
Our pipeline script (`scripts/fetch-data.mjs`) automatically downloads NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis records (`GLB.Ts+dSST.csv`). The parser extracts calendar-year meteorological means (`J-D` column) from 1880 to 2025 and verifies:
- Exactly 146 continuous annual records.
- Zero duplicate years and zero missing values.
- All numbers finite floating-point bounds.
The dataset is bundled into `public/data/gistemp.json` with fetch timestamps and citations, guaranteeing 100% offline functionality.

##### 2. Exact Deterministic Sonification Formula
Frequency is computed using a linear interpolation mapping, clamped strictly between −0.50 °C and +1.30 °C:
$$\text{Frequency (Hz)} = 220.0 + \left(\frac{\text{clamp}(\text{Anomaly}, -0.5, 1.3) - (-0.5)}{1.3 - (-0.5)}\right) \times (880.0 - 220.0)$$
- **−0.50 °C:** 220.0 Hz (Musical note **A3**)
- **0.00 °C Baseline Normal:** 403.3 Hz (Musical note **G4**)
- **+0.90 °C Verification Test:** 733.3 Hz (Musical note **F#5**)
- **+1.30 °C Upper Limit:** 880.0 Hz (Musical note **A5**)

##### 3. Audio Synthesis Architecture
Sound is generated using dual Web Audio oscillators: a fundamental pure sine wave blended with a subtle second harmonic (16% gain, +1 octave) for acoustic warmth. Each note features an anti-click 60ms non-linear attack envelope and an exponential release, routed through a `DynamicsCompressorNode` limiter graph to prevent auditory distortion. Additional audio modes include:
- **Portamento Glide:** Smooth musical frequency gliding between sequential years.
- **Decade Chords:** Arpeggiates the 10 yearly records of any decade over a sustained fundamental pad.
- **Offline WAV Rendering:** Uses `OfflineAudioContext` to export the full 146-year time-lapse into an uncompressed 44.1 kHz 16-bit WAV file directly in-browser.

##### 4. 3D Planetary Visualization
Built with Three.js and `@react-three/fiber`, our hero visualization features a rotating 3D Earth incorporating NASA Blue Marble surface day textures, surface normal maps, specular ocean roughness, and an independently drifting cloud layer. A custom GLSL Fresnel atmosphere shader dynamically lerps its atmospheric rim glow from polar blue (`< -0.2 °C`) through cyan (`0.0 °C`) to blazing solar red (`+1.28 °C`). Acoustic pulse ripples expand radially across the globe proportional to note frequency.

##### 5. Educational & Analytical Modules
- **Hear Your Birth Year:** Allows users to input their birth year, plays their birth year followed by today's record warmth, and presents a personalized summary of warming during their lifetime.
- **Classroom / Guided Mode:** An offline 5-step interactive lesson with instant-feedback quizzes teaching anomalies, baselines, and sonification rules.
- **What Am I Hearing?:** Offline bilingual (English & Hindi) explainer breaking down historical warmth rank (#1 to #146), pre-industrial baseline deltas, and decade averages.
- **NASA Earth Information Center Bridge:** Direct links and documentation connecting our audio engine to official NASA visual frames at `earth.gov`.

#### Universal Accessibility (WCAG 2.1 AA)
- Full keyboard control (`Arrow` keys, `Home`/`End`, `PageUp`/`PageDown`, `Space`, `P`).
- Real-time `aria-live="polite"` screen-reader pipeline announcing year, anomaly, and pitch.
- Built-in Web Speech API (`speechSynthesis`) toggle for auditory readouts.
- High-contrast mode and `prefers-reduced-motion` compliance.

#### Limitations
- **Annual Global Mean:** Represents worldwide thermodynamic energy imbalance, not localized weather forecasts.
- **Climatological Baseline:** Temperature anomalies are measured relative to the international 1951–1980 baseline normal.
- **Uncertainty Bounds:** Because the simplified J-D summary table does not provide uncertainty margins per year, uncertainty bands are omitted from the line chart to avoid fabrication.

#### Future Work
Roadmap for expanding into multi-sensory Earth observation:
1. **Global Wind Vectors (NASA MERRA-2):** Binaural spatial stereo panning with velocity-driven filter modulation.
2. **Precipitation (NASA GPM IMERG):** Granular synthesis mapping rainfall rates to chime harmonics.
3. **Wildfire Radiative Power (NASA FIRMS):** High-frequency crackle spectral density noise envelopes.
4. **Ocean Heat Content (NASA/JPL Altimetry):** Deep sub-bass acoustic pressure drones (40 Hz–110 Hz).

---

### 4. Space Agency Data Usage

#### 1. NASA GISS Surface Temperature Analysis (GISTEMP v4)
- **Product:** Global Land-Ocean Temperature Index (GLB.Ts+dSST.csv)
- **Time Coverage:** 1880 to 2025 (146 consecutive years analyzed)
- **Baseline Period:** 1951–1980 Global Mean Normal
- **How Used:** Powers the entire sonification engine, line chart, warming stripes scrubber, and statistical explainer.
- **Citation:** GISTEMP Team, 2024: *GISS Surface Temperature Analysis (GISTEMP), version 4.* NASA Goddard Institute for Space Studies. Lenssen, N. et al., 2019: *Improvements in the GISTEMP uncertainty model.* J. Geophys. Res. Atmos., 124(12), 6307–6326.

#### 2. NASA Visible Earth / Blue Marble Imagery
- **Product:** High-resolution day surface, cloud composites, specular ocean maps, and normal bump maps.
- **How Used:** Mapped onto our interactive 3D WebGL globe to represent Earth's physical land-ocean topography.
- **Citation:** NASA Earth Observatory Visible Earth team; Reto Stöckli.

#### 3. NASA Earth Information Center (EIC) Visual Frames
- **Product:** Earth Information Center climate dashboard (`earth.gov`) and NASA Scientific Visualization Studio (SVS Entry #5190).
- **How Used:** Serves as the visual reference paired directly with our real-time sonification algorithms.
