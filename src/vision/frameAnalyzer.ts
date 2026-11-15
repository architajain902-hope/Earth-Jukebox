/**
 * frameAnalyzer.ts
 * Computer vision frame analyzer for NASA Earth Information Center (EIC) visual frames.
 * Downsamples frames to 96x48 and computes:
 * - 12-bin Hue histogram
 * - Average Saturation & Brightness
 * - Warm vs. Cool color ratio
 * - Sobel edge density (visual detail/complexity)
 * - Brightness centroid (spatial weight)
 * - Column-by-column profile for time-swept sonification
 * - Accessible natural-language description based on verified source description and measured pixels
 */

export interface ColumnProfile {
  columnIndex: number;
  hue: number;        // 0 to 360
  saturation: number; // 0 to 1
  brightness: number; // 0 to 1
  verticalCentroid: number; // 0 (top) to 1 (bottom)
  edgeEnergy: number; // 0 to 1
}

export interface FrameAnalysisResult {
  width: number;
  height: number;
  dominantHue: number;          // 0 to 360 degrees
  dominantHueName: string;      // e.g. "Deep Blue", "Amber", "Orange"
  averageSaturation: number;    // 0 to 1
  averageBrightness: number;    // 0 to 1
  warmCoolRatio: number;        // 0 (100% cool) to 1 (100% warm)
  edgeDensity: number;          // 0 to 1 (Sobel gradient magnitude)
  centroid: { x: number; y: number }; // 0 to 1 coordinates
  hueHistogram: number[];       // 12 bins (each 30 degrees)
  columnProfiles: ColumnProfile[]; // 96 time slices
  recommendedScale: 'pentatonic' | 'dorian' | 'lydian' | 'aeolian';
  accessibleDescription: string;
}

export const SCALE_MOODS: Record<'pentatonic' | 'dorian' | 'lydian' | 'aeolian', { label: string; tooltip: string }> = {
  lydian: {
    label: 'Lydian (bright and open)',
    tooltip: 'A major scale with a raised 4th, creating an airy, uplifting feel.',
  },
  dorian: {
    label: 'Dorian (spacious and calm)',
    tooltip: 'A balanced minor scale with a raised 6th, conveying calm reflection.',
  },
  aeolian: {
    label: 'Aeolian (poignant and serious)',
    tooltip: 'The natural minor scale, conveying dramatic and climatic weight.',
  },
  pentatonic: {
    label: 'Pentatonic (clear and harmonious)',
    tooltip: 'A five-note scale with open intervals and no dissonance.',
  },
};

const HUE_BIN_NAMES = [
  'Red',
  'Orange',
  'Amber',
  'Yellow',
  'Yellow-Green',
  'Green',
  'Teal/Cyan',
  'Sky Blue',
  'Deep Blue',
  'Indigo',
  'Violet',
  'Magenta',
];

/** Convert RGB (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1) */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h, s, l];
}

/** Analyze raw pixel data array (RGBA) */
export function analyzePixelData(
  data: Uint8ClampedArray | number[] | Uint8Array,
  targetWidth = 96,
  targetHeight = 48,
  sourceDescription?: string
): FrameAnalysisResult {
  const totalPixels = targetWidth * targetHeight;
  const hueBins = new Array(12).fill(0);
  const luminanceGrid: number[][] = Array.from({ length: targetHeight }, () =>
    new Array(targetWidth).fill(0)
  );

  let totalSat = 0;
  let totalBri = 0;
  let warmPixelCount = 0;
  let coolPixelCount = 0;
  let weightedX = 0;
  let weightedY = 0;
  let totalLuminanceWeight = 0;

  const columnProfiles: ColumnProfile[] = [];

  // Per-column accumulators
  for (let x = 0; x < targetWidth; x++) {
    let colHueWeightX = 0;
    let colHueWeightY = 0;
    let colTotalSat = 0;
    let colTotalBri = 0;
    let colWeightedY = 0;
    let colBriSum = 0;

    for (let y = 0; y < targetHeight; y++) {
      const idx = (y * targetWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const [h, s, l] = rgbToHsl(r, g, b);
      luminanceGrid[y][x] = l;

      totalSat += s;
      totalBri += l;

      // Spatial centroid accumulation
      weightedX += (x / targetWidth) * l;
      weightedY += (y / targetHeight) * l;
      totalLuminanceWeight += l;

      // Hue histogram (only for non-grayscale pixels)
      if (s > 0.12 && l > 0.08 && l < 0.95) {
        const binIndex = Math.min(11, Math.floor(h / 30));
        hueBins[binIndex]++;

        // Warm vs Cool classification
        // Warm: [320-360] or [0-70]
        // Cool: [150-270]
        if (h >= 320 || h <= 70) {
          warmPixelCount++;
        } else if (h >= 150 && h <= 270) {
          coolPixelCount++;
        }
      }

      // Column statistics
      const rad = (h * Math.PI) / 180;
      colHueWeightX += Math.cos(rad) * s;
      colHueWeightY += Math.sin(rad) * s;
      colTotalSat += s;
      colTotalBri += l;
      colWeightedY += (y / targetHeight) * l;
      colBriSum += l;
    }

    const avgColHueRad = Math.atan2(colHueWeightY, colHueWeightX);
    let avgColHueDeg = (avgColHueRad * 180) / Math.PI;
    if (avgColHueDeg < 0) avgColHueDeg += 360;

    columnProfiles.push({
      columnIndex: x,
      hue: Math.round(avgColHueDeg),
      saturation: colTotalSat / targetHeight,
      brightness: colTotalBri / targetHeight,
      verticalCentroid: colBriSum > 0 ? colWeightedY / colBriSum : 0.5,
      edgeEnergy: 0, // Populated in Sobel pass
    });
  }

  // Sobel Edge Detection pass
  let totalEdgeEnergy = 0;
  for (let y = 1; y < targetHeight - 1; y++) {
    for (let x = 1; x < targetWidth - 1; x++) {
      // 3x3 Sobel kernels
      const gx =
        -1 * luminanceGrid[y - 1][x - 1] +
        1 * luminanceGrid[y - 1][x + 1] +
        -2 * luminanceGrid[y][x - 1] +
        2 * luminanceGrid[y][x + 1] +
        -1 * luminanceGrid[y + 1][x - 1] +
        1 * luminanceGrid[y + 1][x + 1];

      const gy =
        -1 * luminanceGrid[y - 1][x - 1] -
        2 * luminanceGrid[y - 1][x] -
        1 * luminanceGrid[y - 1][x + 1] +
        1 * luminanceGrid[y + 1][x - 1] +
        2 * luminanceGrid[y + 1][x] +
        1 * luminanceGrid[y + 1][x + 1];

      const mag = Math.sqrt(gx * gx + gy * gy);
      totalEdgeEnergy += mag;
      columnProfiles[x].edgeEnergy += mag / targetHeight;
    }
  }

  const edgeDensity = Math.min(1, totalEdgeEnergy / (totalPixels * 1.4));
  const avgSat = totalSat / totalPixels;
  const avgBri = totalBri / totalPixels;

  // Dominant Hue
  let maxBinIndex = 8; // Default Deep Blue
  let maxBinCount = -1;
  for (let i = 0; i < 12; i++) {
    if (hueBins[i] > maxBinCount) {
      maxBinCount = hueBins[i];
      maxBinIndex = i;
    }
  }
  const dominantHue = maxBinIndex * 30 + 15;
  const dominantHueName = HUE_BIN_NAMES[maxBinIndex];

  // Warm vs Cool Ratio
  const warmCoolTotal = warmPixelCount + coolPixelCount;
  const warmCoolRatio = warmCoolTotal > 0 ? warmPixelCount / warmCoolTotal : 0.5;

  // Brightness Centroid
  const centroidX = totalLuminanceWeight > 0 ? weightedX / totalLuminanceWeight : 0.5;
  const centroidY = totalLuminanceWeight > 0 ? weightedY / totalLuminanceWeight : 0.5;

  // Scale Recommendation:
  // Cool palette (blues/cyans) -> Dorian / Lydian (ethereal, spacious)
  // Warm palette (ambers/reds) -> Aeolian (climatic urgency, poignant)
  let recommendedScale: 'pentatonic' | 'dorian' | 'lydian' | 'aeolian' = 'dorian';
  if (warmCoolRatio > 0.65) {
    recommendedScale = 'aeolian';
  } else if (warmCoolRatio < 0.25) {
    recommendedScale = 'lydian';
  } else if (edgeDensity < 0.25) {
    recommendedScale = 'pentatonic';
  }

  // Accessible Natural-Language Description for Screen Readers & Judges
  const warmPct = Math.round(warmCoolRatio * 100);
  const coolPct = 100 - warmPct;
  const complexityWord =
    edgeDensity > 0.5 ? 'high detail level' :
    edgeDensity > 0.25 ? 'moderate detail level' : 'low detail level (smooth gradients)';

  const baseDesc = sourceDescription?.trim()
    ? sourceDescription.trim()
    : 'NASA visual frame.';

  const accessibleDescription =
    `${baseDesc} Measured values: main colour is ${dominantHueName} (${Math.round(dominantHue)}°), ` +
    `${warmPct}% warm and ${coolPct}% cool tones. Average brightness is ${Math.round(avgBri * 100)}% with ${complexityWord} ` +
    `(${(edgeDensity * 100).toFixed(1)}% edge density). Music mood: ${recommendedScale}.`;

  return {
    width: targetWidth,
    height: targetHeight,
    dominantHue,
    dominantHueName,
    averageSaturation: avgSat,
    averageBrightness: avgBri,
    warmCoolRatio,
    edgeDensity,
    centroid: { x: centroidX, y: centroidY },
    hueHistogram: hueBins,
    columnProfiles,
    recommendedScale,
    accessibleDescription,
  };
}

/** Analyze any visual canvas, image, or video element */
export function analyzeFrame(
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  targetWidth = 96,
  targetHeight = 48,
  sourceDescription?: string
): FrameAnalysisResult {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create 2D canvas context for frame analysis');
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  return analyzePixelData(imgData.data, targetWidth, targetHeight, sourceDescription);
}
