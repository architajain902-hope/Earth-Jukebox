# Artistic and Technical Rationale

**Project:** Earth 616: The Earth Information Jukebox  
**Challenge:** The Earth Information Jukebox (NASA International Space Apps Challenge 2026)  
**Track:** Science & Creative Technology  
**Version:** 2.0.0 Production Release  

---

## 1. Executive Summary & Purpose

How does one convey 146 years of planetary thermal transformation to a global audience with both scientific rigor and emotional resonance? 

Traditional climate communications rely almost exclusively on two-dimensional visual graphs—static line charts or color-ramped warming stripes. While mathematically precise, visual-only media fail two critical groups:
1. **The Visually Impaired Community:** Millions of blind and low-vision individuals are entirely locked out of visual climate data and NASA satellite imagery.
2. **The General Public:** Cognitive fatigue from static numbers often obscures the visceral reality of accelerating warming. Sound bypasses intellectual abstraction; the human auditory cortex processes temporal shifts, frequency changes, and harmonic tension with immediate emotional clarity.

**Earth 616: The Earth Information Jukebox** bridges this divide. It pairs **NASA Earth Information Center (EIC)** visual frames with **real-time dynamic sonification**, translating scientific data and satellite imagery into an auditory experience where Earth’s changes can be heard as well as seen.

---

## 2. The Core Philosophy: Scientific Honesty Meets Musical Elegance

### 2.1 The Two-Layer Architecture: Data vs. Frame

A fundamental hazard in creative sonification is the temptation to produce "music inspired by climate"—arbitrary chord progressions or aesthetic soundscapes where data is merely metaphorical. Conversely, direct raw sonification (e.g. mapping every raw RGB pixel value directly to random sine wave frequencies) produces chaotic, unlistenable white noise that repels the listener.

To resolve this tension, **Earth 616** introduces a **strict separation of concerns**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EARTH 616 ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [LAYER 1: GROUND TRUTH]              [LAYER 2: HARMONIC ATMOSPHERE]  │
│   NASA GISTEMP v4 Anomaly              NASA EIC Visual Frame (CV)      │
│   -0.5 °C  ───►  +1.45 °C              Hue, Edge Density, Centroid     │
│             │                                       │                  │
│             ▼                                       ▼                  │
│      FUNDAMENTAL ROOT                  HARMONY, TIMBRE & SPACE         │
│   A3 (220 Hz) ──► A5 (880 Hz)          • Dominant Hue ──► Scale Mode   │
│   * Higher temp = Higher pitch         • Edge Density ──► Rhythm/BPM   │
│   * Clamped & Never Inverted           • Brightness ──► Filter Cutoff  │
│                                        • Centroid ──► Stereo Panning   │
│             │                                       │                  │
│             └───────────────────┬───────────────────┘                  │
│                                 │                                      │
│                                 ▼                                      │
│                     DYNAMIC SYNTHESIS ENGINE                           │
│                   Web Audio API (No Prerecorded Audio)                 │
└────────────────────────────────────────────────────────────────────────┘
```

#### Layer 1: What the DATA Decides (Unyielding Scientific Truth)
- **Source:** NASA Goddard Institute for Space Studies (GISS) Surface Temperature Analysis (GISTEMP v4), Land-Ocean Temperature Index (GLB.Ts+dSST.csv), 1880–2025.
- **Rule:** The annual temperature anomaly relative to the 1951–1980 baseline ($0.00^\circ\text{C}$) strictly governs the **fundamental tonal root** ($f_0$):
  $$\text{Pitch } (f_0) = 220 + \left(\frac{\text{anomaly} - (-0.5)}{1.3 - (-0.5)}\right) \times (880 - 220) \text{ Hz}$$
- **Check Value:** $+0.90^\circ\text{C}$ precisely maps to $733.33\text{ Hz}$.
- **Monotonicity:** An increase in temperature *never* produces a lower frequency.

#### Layer 2: What the FRAME Decides (Harmonic Atmosphere & Texture)
- **Source:** NASA Earth Information Center (EIC) and Scientific Visualization Studio (SVS) visual frames (Blue Marble, Black Marble night lights, Warming Stripes, and user-uploaded satellite imagery).
- **Computer Vision Extraction (Offscreen 96×48 analysis):**
  1. **12-Bin Hue Histogram:** Cool dominant hues (blues/cyans, $180^\circ$–$240^\circ$) activate open, spacious modal scales (**Lydian / Dorian**), capturing pristine oceans and atmosphere. Warm dominant hues (ambers/oranges/reds, $0^\circ$–$45^\circ$, $330^\circ$–$360^\circ$) activate **Aeolian** with tension intervals (sus2, $\sharp 4$), expressing thermal stress and climate urgency.
  2. **Sobel Edge Density:** Measures visual detail, texture, and cloud boundaries using a 3×3 spatial gradient convolution. Higher edge complexity increases arpeggio velocity and rhythmic subdivision (50 ms to 140 ms per column).
  3. **Luminance & Vertical Centroid:** Average luminance opens the synthesizer low-pass filter cutoff ($800\text{ Hz} \to 11.5\text{ kHz}$), while each column's vertical centroid pans arpeggiated chimes across the stereo spectrum ($-0.9$ Left to $+0.9$ Right).

---

## 3. Scale Quantization Justification

Why offer a **Harmonic Mode** alongside **Exact Linear Mode**?
- **Cognitive Clarity:** The human ear distinguishes musical intervals (thirds, fifths, octaves) far more reliably than continuous microtonal frequency shifts. A jump from $440\text{ Hz}$ to $443.2\text{ Hz}$ sounds like a detuned wobble; a jump from $440\text{ Hz}$ (A4) to $523.25\text{ Hz}$ (C5) instantly signals a discrete, recognizable shift.
- **Monotonic Quantization Guarantee:** The scale quantizer $S(f)$ is weakly monotonic:
  $$\forall a_1, a_2 \in \mathbb{R},\quad a_1 \le a_2 \implies S(f(a_1)) \le S(f(a_2))$$
  No note in a hotter year is ever lower in pitch than a note in a cooler year.
- **Dual Mode Accessibility:** The user can toggle between **Exact Linear (Hz)** for scientific verification and **Harmonic Mode** for emotional and educational storytelling with a single click.

---

## 4. Audio Synthesis Architecture (Pure Web Audio API)

No pre-recorded MP3 or WAV samples are loaded. Every sound is mathematically synthesized in real time via client-side Web Audio primitives:

1. **Lead Voice (Melodic Core):**
   - Dual detuned oscillators: Triangle wave (body and warmth) paired with Sine wave (pure fundamental) detuned by $\pm 4$ cents to produce subtle acoustic chorus.
   - Dynamic Vibrato: An auxiliary LFO modulates pitch. For modern record-warm years ($>0.8^\circ\text{C}$), vibrato rate accelerates from $4.2\text{ Hz}$ to $5.5\text{ Hz}$ and depth doubles, introducing an unmistakable acoustic sense of urgency.
2. **Harmonic Voice (Octave Air):**
   - Soft second harmonic (frequency $2 \times f_0$) injected at $-16\text{ dB}$ to ensure warmth on laptop and mobile phone speakers.
3. **Sub Drone Voice (Geological Weight):**
   - A low-frequency $55\text{ Hz}$ (A1) sine wave drone fades in during time-lapse playback, providing physical low-end weight representing the deep planetary mass of Earth.
4. **Cinematic Space Reverb (Algorithmic Convolver):**
   - Synthesizes a 2.2-second stereo impulse response with an exponential decay envelope ($\text{decay} = 2.0$) directly in memory, imparting a vast, orbital acoustic depth.
5. **Safety Limiter / Dynamics Compressor:**
   - A dedicated `DynamicsCompressorNode` (threshold $-14\text{ dB}$, knee $6$, ratio $8:1$, attack $3\text{ ms}$) guarantees zero digital clipping or speaker distortion across all frequencies.

---

## 5. Universal Design & Accessibility (Core Theme)

Accessibility is not an afterthought; it is woven into every layer:
1. **Web Speech API Screen Reader:** A dedicated toggle speaks aloud the year, signed anomaly, and exact Hertz value upon selection.
2. **Natural-Language Frame Synthesis (`aria-live="polite"`):** The computer vision engine translates every visual frame into rich descriptive prose for screen reader users (e.g., *"Visual frame shows 74% cool ocean blues with 26% warm terrestrial amber. Moderate visual texture with edge density 28.4%..."*).
3. **Reduced Motion Mode:** Toggles off globe auto-rotation, starfield scintillation, and CSS layout transitions for vestibular disorder accessibility.
4. **High Contrast Mode:** Amplifies color contrasts, borders, and luminance gradients to satisfy WCAG AAA criteria.
5. **Color-Blind Safe Warming Stripes:** Built using Professor Ed Hawkins' verified climate stripes palette, incorporating luminance contrasts alongside hue shifts.
6. **Keyboard Navigation:** Full keyboard control (`Left`/`Right` arrow for years, `PageUp`/`PageDown` for decades, `Space` for single-tone sonification, `P` for time-lapse play/pause, `M` for mute).

---

## 6. Conclusion

Earth 616 transforms NASA's vast repository of satellite observations and global temperature models from silent visual frames into a living, audible planetary instrument. By honoring scientific ground truth while applying sophisticated computer vision and audio design, Earth 616 empowers students, researchers, judges, and citizens worldwide to hear the pulse of our changing planet.
