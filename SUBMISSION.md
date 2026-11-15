# NASA International Space Apps Challenge 2026: Project Submission

## Project Name: SONIX: The Earth Information Jukebox
**Team Name:** Team SONIX  
**Local Event:** Bhopal, India  
**Challenge:** The Earth Information Jukebox  

---

### 1. Challenge Selection
**Challenge:** The Earth Information Jukebox  
**Why this challenge:** NASA's Earth Information Center creates world-class visual frames of our changing climate. SONIX directly answers this challenge by translating these visual anomalies into dynamic, real-time synthesized sound, making planetary climate change accessible, auditory, and intuitive for everyone.

---

### 2. High-Level Summary
*Word count: 96 words (Limit: at most 120 words)*

SONIX: The Earth Information Jukebox translates 146 years (1880–2025) of NASA global surface temperature anomalies into an interactive 3D audio-visual instrument. Pairing NASA Earth Information Center visual frames with real-time Web Audio synthesis, every pitch is mathematically calculated from real data: higher temperature anomaly produces higher pitch. Users can scrub history, play automated time-lapses, audition decade chords, compare birth years, and explore offline bilingual English/Hindi explainers. Built with strict scientific honesty and zero pre-recorded audio, SONIX delivers an accessible, universal way to hear and see our warming planet.

---

### 3. Detailed Project Description

#### The Problem
Earth observation visualizations produced by NASA—such as global temperature anomaly heatmaps—are visually stunning, but they remain abstract to the general public and inaccessible to blind and low-vision individuals. Furthermore, artistic "climate music" projects frequently compromise scientific rigor by improvising arbitrary melodies that have no mathematical relationship to real data.

#### Our Approach & Core Philosophy
SONIX is founded on **strict scientific honesty**:
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

##### 2. Exact Fixed-Rule Sonification Formula
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

##### 5. Computer Vision Frame Jukebox & Harmonic Synthesis
Directly answering the 2026 challenge brief to pair NASA Earth Information Center visual frames with dynamic sonification:
- **Computer Vision Extraction:** Built-in analyzer runs Sobel 3×3 edge detection (gradient magnitude), 12-bin HSL hue histograms, color warmth ratios ($W/(W+C)$), and spatial brightness centroids over any visual frame (NASA Blue Marble, Black Marble night lights, Warming Stripes, or user uploads).
- **Visual-to-Sound Translation:** Edge density governs scanline tempo (50ms–140ms per column); hue distribution recommends modal scale quantization (Pentatonic, Dorian, Lydian, Aeolian); warmth ratio modulates urgency timbre; brightness centroid determines spatial stereo panning.
- **Scientific Anchor Invariant:** To prevent chaotic unmusical noise while preserving scientific validity, the root pitch center remains strictly anchored to NASA GISTEMP temperature anomaly data; visual frame metrics dynamically color harmony, timbre, spatialization, and rhythm.
- **Offline WAV Soundscape Export:** Direct 24-second stereo synthesis to uncompressed 16-bit 44.1 kHz WAV via `OfflineAudioContext`.

##### 6. Educational & Analytical Modules
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

We followed each page's explicit credit request; see the NASA Reproduction Guidelines linked on each SVS page (https://www.nasa.gov/nasa-brand-center/images-and-media/). Exported soundscapes are our own derived work from NASA media and data.

#### 1. NASA GISS Surface Temperature Analysis (GISTEMP v4)
- **Product & URL:** Global Land-Ocean Temperature Index (`GLB.Ts+dSST.csv`): https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
- **Time Coverage:** 1880 to 2025 (146 consecutive years analyzed)
- **Baseline Period:** 1951–1980 Global Mean Normal
- **How Used:** Powers the core sonification engine, SVG temperature anomaly line chart, warming stripes scrubber, and statistical ranking explainer.
- **Citation:** GISTEMP Team, 2024: *GISS Surface Temperature Analysis (GISTEMP), version 4.* NASA Goddard Institute for Space Studies. Lenssen, N. et al., 2019: *Improvements in the GISTEMP uncertainty model.* J. Geophys. Res. Atmos., 124(12), 6307–6326.

#### 2. Change in Night Lights between 2012 and 2023 - EIC Version
- **Product & URL:** NASA SVS Entry #5313: https://svs.gsfc.nasa.gov/5313/
- **Credit:** NASA's Scientific Visualization Studio
- **Visualizer:** Kel Elkins (USRA)
- **Scientists:** Zhuosen Wang (University of Maryland), Miguel Roman (Leidos), Ranjay Shrestha (SSAI), Srija Chakraborty (USRA), Virginia Kalb (NASA)
- **Released:** 14 June 2024
- **Datasets:** Black Marble (Black Marble: Next Generation) [Suomi NPP: VIIRS], "NASA Earth Observatory images by Joshua Stevens, using Suomi NPP VIIRS data from Miguel Roman, NASA GSFC."
- **How Used:** Analyzed in the EIC Frame Jukebox for nocturnal electrification dynamics, where city light density dictates arpeggio pulse tempo, purple areas trigger rising notes, and orange areas trigger softening chords.

#### 3. Global Sea Surface Currents and Temperature
- **Product & URL:** NASA SVS Entry #3912: https://svs.gsfc.nasa.gov/3912/
- **Credit:** NASA/Goddard Space Flight Center Scientific Visualization Studio
- **Visualizers:** Greg Shirah (NASA/GSFC); Animators: Greg Shirah, Horace Mitchell (NASA/GSFC), Eric Sokolowsky (Global Science and Technology, Inc.); Producer: Michael Starobin (HTSI)
- **Scientists:** Hong Zhang (UCLA), Dimitris Menemenlis (NASA/JPL, Caltech)
- **Released:** 16 March 2012 (page updated 18 February 2025)
- **Datasets:** GTOPO30 Topography and Bathymetry (USGS), ECCO2 (NASA/JPL)
- **How Used:** Analyzed in the EIC Frame Jukebox for sea surface temperature fluid thermal flows, translating thermal gradients (-3°C to 22°C) into harmonic frequency spectrums.

#### 4. Perpetual Ocean 2: Western Boundary Currents
- **Product & URL:** NASA SVS Entry #5425: https://svs.gsfc.nasa.gov/5425/
- **Credit:** NASA's Scientific Visualization Studio
- **Visualizers:** Greg Shirah (NASA/GSFC), Horace Mitchell (NASA/GSFC); Technical support: Laurence Schuler, Ian Jones (ADNET Systems, Inc.); Producer: Kathleen Gaeta (Advocates in Manpower Management, Inc.)
- **Scientists:** Atousa Saberi (NASA/GSFC), Josh Willis (JPL)
- **Released:** 27 February 2025 (page updated 20 May 2025)
- **Datasets:** BMNG Blue Marble imagery (courtesy of Reto Stockli, NASA/GSFC), ECCO2 (NASA/JPL), ETOPO-30 (NOAA)
- **How Used:** Analyzed in the EIC Frame Jukebox to capture streamline eddies, western boundary currents, and energetic fluid flow in the Gulf Stream.

#### 5. NASA Visible Earth / Blue Marble Imagery
- **Product & URL:** High-resolution day surface, cloud composites, specular ocean maps, and normal bump maps: https://visibleearth.nasa.gov/images/57723/the-blue-marble
- **How Used:** Mapped onto our interactive 3D WebGL globe to represent Earth's physical land-ocean topography.
- **Citation:** NASA Earth Observatory Visible Earth team; Reto Stöckli.
