# NASA International Space Apps Challenge 2026: Project Submission

## Project Name: Earth 616: The Earth Information Jukebox
**Team:** Earth 616  
**Challenge:** The Earth Information Jukebox

---

### Section 1: Challenge Selection & Statement of Problem
The NASA Space Apps Challenge *"The Earth Information Jukebox"* tasks participants with creating innovative, multi-sensory experiences that transform complex Earth observation and climate science datasets into accessible, educational, and intuitive soundscapes and visual formats.

Historically, climate data visualization has relied heavily on 2D charts and statistical anomalies that can feel abstract and emotionally detached to the public. Conversely, artistic "climate music" often sacrifices scientific precision by subjectively improvising melodies that have no mathematical relationship to real measurements.

**Earth 616: The Earth Information Jukebox** bridges this divide by upholding **strict scientific honesty**. We asked: *Can a user perceive the physical thermodynamic warming of our planet simply by listening, while watching Earth respond in 3D real time?* By turning 146 years of real NASA GISTEMP records into exact audio frequencies, Earth 616 allows anyone—students, educators, researchers, and visually impaired audiences—to hear the trajectory of our changing climate.

---

### Section 2: High-Level Summary
**Earth 616: The Earth Information Jukebox** is an interactive, zero-backend web instrument that sonifies and visualizes 146 years (1880–2025) of authentic NASA global surface temperature anomalies. Every year's temperature measurement is converted directly into a synthesized musical pitch using a fixed, deterministic linear mapping: higher temperatures produce higher frequencies. As the user scrubs the timeline or plays a chronological time-lapse, a realistic 3D Earth rotates in WebGL, its atmospheric glow dynamically shifting from polar blue to fiery crimson while acoustic ripple rings radiate outward. With zero third-party audio files, offline data resilience, bilingual English/Hindi explainers, and WCAG AA accessibility, Earth 616 offers an honest, scientifically faithful audio-visual journey through Earth's modern climate history.

---

### Section 3: Detailed Project Description
Earth 616 is engineered as a production-grade, client-side web application built with **React, TypeScript, Three.js (@react-three/fiber), and the Web Audio API**.

#### 1. Real-Time Physical Sound Synthesis
Rather than playing pre-recorded audio samples, Earth 616 generates sound entirely through browser code. Using a dual-oscillator architecture, the synthesizer pairs a fundamental pure sine wave with a subtle second harmonic (one octave higher at 16% amplitude) to deliver a warm, resonant acoustic timbre reminiscent of an electronic chamber organ. To ensure acoustic comfort and clarity, every note is shaped by a 60ms non-linear attack envelope, smooth decay, and routed through a `DynamicsCompressorNode` limiter that eliminates clipping and harshness. A toggleable portamento glide enables continuous musical transitions between adjacent years during automated time-lapses.

#### 2. Photorealistic 3D Planetary Visualization
The centerpiece of the application is a responsive 3D Earth globe created in WebGL. It integrates high-resolution NASA Blue Marble surface imagery, bump/normal topography maps, ocean specular roughness shaders, and a separate atmospheric cloud layer that drifts at an independent orbital velocity. Custom GLSL vertex and fragment shaders render a dynamic Fresnel rim glow around the planet's limb. The color of this atmospheric glow is driven directly by the active year's anomaly, transitioning smoothly from cool oceanic blue (`-0.5 °C`) through crisp cyan (`0.0 °C`) to intense solar red (`+1.28 °C`). Each time a note sounds, a spherical acoustic pulse wave expands across the globe, with its scale dynamically tied to the note's frequency.

#### 3. Mission Control UI & Scientific Tools
- **Year HUD & Warming Stripes Scrubber:** A large animated rolling counter displays the year, formatted anomaly, live frequency in Hertz, and nearest musical note name. Below the primary slider, an Ed Hawkins-style warming stripes strip represents all 146 years as individual color-coded bands that function as an interactive scrubber.
- **Interactive SVG Vector Chart:** A zero-dependency SVG line chart plots the complete 1880–2025 anomaly curve against the 1951–1980 baseline, complete with a synchronized moving playhead, hover inspection tooltips, and clickable milestone navigation.
- **"What Am I Hearing?" Bilingual Explainer:** Operating completely offline, this module calculates the selected year's historical rank (e.g., *2024 is #1 warmest of 146 years*), departure from pre-industrial levels (1880–1900 mean), and decade normal, explaining the physical significance of the pitch in plain language in both **English and Hindi**.
- **Comparative Mode:** Users can select any two historical milestones (e.g., 1880 vs. 2024) and audition them back-to-back, revealing both the degree Celsius delta and the auditory frequency jump.
- **Scripted 90-Second Demo Tour:** An automated guided tour with on-screen subtitles designed for screen recordings, video presentations, and interactive kiosk demonstrations.

#### 4. Universal Accessibility
Earth 616 was designed from day one to be inclusive of visually impaired and motion-sensitive users. The app features comprehensive keyboard navigation, an `aria-live="polite"` screen-reader pipeline, optional Web Speech API vocal narration, a high-contrast theme, and full support for `prefers-reduced-motion`.

---

### Section 4: Space Agency Data Usage
Earth 616 relies directly on scientific data produced by the **NASA Goddard Institute for Space Studies (GISS)**:

1. **Dataset Used:**
   - **GISS Surface Temperature Analysis (GISTEMP v4)**
   - **Product:** Global Land-Ocean Temperature Index (annual meteorological means: `GLB.Ts+dSST.csv`)
   - **Temporal Coverage:** 1880 through 2025 (146 continuous annual records)
   - **Climatological Baseline:** 1951–1980 global mean normal

2. **How Data Was Integrated:**
   - A dedicated data pipeline script (`scripts/fetch-data.mjs`) streams the official GISTEMP table directly from NASA GISS servers.
   - The parser isolates the calendar-year mean (`J-D` column), verifies that all 146 years are consecutive and without duplicate entries or missing values, and compiles the verified records into an offline JSON document (`public/data/gistemp.json`).
   - The frontend application loads this verified dataset at startup, displaying dataset provenance, fetch timestamp, and scientific baseline metadata in a dedicated mission control badge.

3. **NASA Scientific Citations:**
   - *GISTEMP Team, 2024:* GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed at `https://data.giss.nasa.gov/gistemp/`.
   - *Lenssen, N., et al., 2019:* Improvements in the GISTEMP uncertainty model. *J. Geophys. Res. Atmos.*, 124, 6307–6326, doi:10.1029/2018JD029522.
   - *NASA Visible Earth:* Planetary surface and cloud composite maps provided by the NASA Earth Observatory team.
