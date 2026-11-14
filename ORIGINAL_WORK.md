# ORIGINAL WORK DISCLOSURE

In accordance with the rules of the **NASA International Space Apps Challenge 2026**, this document clearly delineates original work created by **Team Earth 616** versus third-party data, libraries, and assets utilized.

---

## 1. Summary Matrix

| Aspect | What Our Team Created (Original Work) | Third-Party Work Used & Attribution |
| :--- | :--- | :--- |
| **Sonification Model** | • Deterministic linear frequency mapping formula ($220\text{ Hz} \to 880\text{ Hz}$).<br>• Real-time dual-oscillator synthesizer architecture (sine fundamental + 2nd harmonic warmth).<br>• Portamento glide algorithm.<br>• In-browser WAV audio export generator via `OfflineAudioContext`.<br>• Decade chord harmonic arpeggiator. | None. All audio code was designed and written natively using the browser's standard Web Audio API without third-party audio engines or pre-recorded clips. |
| **Scientific Data & Validation** | • Automated streaming parser and data ingestion pipeline (`scripts/fetch-data.mjs`).<br>• 146-year dataset integrity validator with duplicate detection and range assertions.<br>• Real-time statistical calculators for rank (#1 to #146), pre-industrial (1880–1900) deltas, and decade averages. | **NASA Goddard Institute for Space Studies (GISS):**<br>Surface Temperature Analysis (GISTEMP v4), Global Land-Ocean Temperature Index (`GLB.Ts+dSST.csv`). Public domain. |
| **3D Planetary Graphics** | • 3D scene composition and dynamic camera rigging in `@react-three/fiber`.<br>• Custom GLSL vertex and fragment shaders for data-driven atmospheric Fresnel rim glowing.<br>• Dynamic color interpolation lerp linking temperature anomaly to atmospheric hue.<br>• Frequency-scaled acoustic pulse ripple geometry. | **NASA Visible Earth / Three.js Asset Repository:**<br>Day land-ocean color map, ocean specular roughness map, normal relief map, and cloud composite image. Public domain / MIT. |
| **User Interface & Experience** | • Mission control glassmorphic theme and layout.<br>• Animated rolling year counter.<br>• Interactive vector SVG temperature line chart with moving playhead and tooltips.<br>• 146-band interactive warming stripes visual scrubber.<br>• 5-step interactive classroom lesson with instant-feedback quizzes.<br>• "Hear Your Birth Year" personal comparison tool.<br>• 100-second automated video presentation tour with synchronized captions. | **Open Source UI Libraries:**<br>React 18, Framer Motion (transitions), Three.js (WebGL rendering). Open-source under MIT.<br>**Fonts:** Space Grotesk, Space Mono, Inter (SIL Open Font License). |
| **Accessibility & Inclusive Design** | • `aria-live="polite"` real-time auditory status region.<br>• Web Speech API (`speechSynthesis`) vocal narration engine.<br>• High-contrast palette theme.<br>• Comprehensive keyboard navigation handlers. | Browser native Web Speech and Web Accessibility APIs. |
| **Testing & Quality Gates** | • 18-test automated Vitest validation suite.<br>• Unified `npm run verify` quality gate script.<br>• Headless screenshot capture automation (`scripts/capture-screenshots.mjs`). | Vitest, Puppeteer-Core (dev tooling only). |

---

## 2. Integrity Statement
Team Earth 616 certifies that all software algorithms, mathematical sonification pipelines, visual shader implementations, and educational curricula presented in this repository were created by our team for the 2026 NASA Space Apps Challenge. All space agency data and open-source dependencies have been properly credited in [REFERENCES.md](REFERENCES.md).
