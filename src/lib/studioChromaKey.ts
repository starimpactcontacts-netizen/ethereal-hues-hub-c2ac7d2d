/**
 * Loopgate Studio — Chroma Key (Green Screen) Engine
 * Real-time HSL-based background removal with edge refinement
 */

// ─── Types ───
export type ChromaKeyConfig = {
  enabled: boolean;
  keyColor: string;        // Hex color to key out
  tolerance: number;       // 0-100 how strict the match
  softness: number;        // 0-100 edge softness
  spillSuppression: number; // 0-100 remove color spill on subject
  denoiseAlpha: number;    // 0-100 clean up alpha channel noise
};

export type ColorPreset = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

// ─── Presets ───
export const DEFAULT_CHROMA_CONFIG: ChromaKeyConfig = {
  enabled: false,
  keyColor: '#00FF00',
  tolerance: 40,
  softness: 10,
  spillSuppression: 30,
  denoiseAlpha: 20,
};

export const CHROMA_COLOR_PRESETS: ColorPreset[] = [
  { id: 'green', name: 'Green Screen', color: '#00FF00', icon: '🟢' },
  { id: 'lime', name: 'Lime Green', color: '#32CD32', icon: '🍀' },
  { id: 'blue', name: 'Blue Screen', color: '#0000FF', icon: '🔵' },
  { id: 'cyan', name: 'Cyan Screen', color: '#00FFFF', icon: '💠' },
  { id: 'magenta', name: 'Magenta', color: '#FF00FF', icon: '🟣' },
  { id: 'white', name: 'White BG', color: '#FFFFFF', icon: '⬜' },
  { id: 'black', name: 'Black BG', color: '#000000', icon: '⬛' },
];

// ─── Color Conversion ───
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 255, 0]; // Default green
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return [0, 0, l];
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  return [h * 360, s * 100, l * 100];
}

// ─── Core Chroma Key Functions ───

/**
 * Calculate alpha (transparency) for a pixel based on chroma key settings
 */
export function calculateChromaAlpha(
  r: number,
  g: number,
  b: number,
  keyHsl: [number, number, number],
  config: ChromaKeyConfig
): number {
  const [pixelH, pixelS, pixelL] = rgbToHsl(r, g, b);
  const [keyH, keyS, keyL] = keyHsl;
  
  // Calculate color distance in HSL space
  let hueDiff = Math.abs(pixelH - keyH);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  
  const satDiff = Math.abs(pixelS - keyS);
  const lumDiff = Math.abs(pixelL - keyL);
  
  // Weighted distance (hue is most important)
  const distance = Math.sqrt(
    (hueDiff / 180) ** 2 * 4 +
    (satDiff / 100) ** 2 +
    (lumDiff / 100) ** 2
  );
  
  // Tolerance threshold (0-1)
  const toleranceNorm = config.tolerance / 100;
  const softnessNorm = config.softness / 100;
  
  // Calculate alpha
  const lowerBound = toleranceNorm * (1 - softnessNorm);
  const upperBound = toleranceNorm;
  
  if (distance < lowerBound) {
    return 0; // Fully transparent (key color)
  } else if (distance < upperBound) {
    // Soft edge
    return (distance - lowerBound) / (upperBound - lowerBound);
  }
  
  return 1; // Fully opaque
}

/**
 * Apply spill suppression - remove color cast on subject edges
 */
export function applySpillSuppression(
  r: number,
  g: number,
  b: number,
  keyRgb: [number, number, number],
  amount: number
): [number, number, number] {
  const factor = amount / 100;
  
  // Simple spill suppression for green screen
  // Reduce green channel based on proximity to key color
  const [keyR, keyG, keyB] = keyRgb;
  
  // Check if green is dominant (for green screen)
  if (keyG > keyR && keyG > keyB) {
    const maxRB = Math.max(r, b);
    if (g > maxRB) {
      const spill = (g - maxRB) * factor;
      return [r, Math.max(0, g - spill), b];
    }
  }
  
  // Check if blue is dominant (for blue screen)
  if (keyB > keyR && keyB > keyG) {
    const maxRG = Math.max(r, g);
    if (b > maxRG) {
      const spill = (b - maxRG) * factor;
      return [r, g, Math.max(0, b - spill)];
    }
  }
  
  return [r, g, b];
}

/**
 * Process entire frame with chroma key
 * Returns a new ImageData with alpha channel modified
 */
export function processChromaKeyFrame(
  imageData: ImageData,
  config: ChromaKeyConfig
): ImageData {
  if (!config.enabled) return imageData;
  
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const outData = output.data;
  
  const keyRgb = hexToRgb(config.keyColor);
  const keyHsl = rgbToHsl(...keyRgb);
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Calculate alpha
    const alpha = calculateChromaAlpha(r, g, b, keyHsl, config);
    
    // Apply spill suppression
    if (config.spillSuppression > 0 && alpha > 0.1) {
      [r, g, b] = applySpillSuppression(r, g, b, keyRgb, config.spillSuppression);
    }
    
    outData[i] = r;
    outData[i + 1] = g;
    outData[i + 2] = b;
    outData[i + 3] = Math.round(alpha * 255);
  }
  
  // Apply alpha denoising if needed
  if (config.denoiseAlpha > 0) {
    denoiseAlphaChannel(outData, width, height, config.denoiseAlpha);
  }
  
  return output;
}

/**
 * Simple morphological denoising on alpha channel
 */
function denoiseAlphaChannel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  const threshold = Math.round((strength / 100) * 128);
  const kernelSize = Math.max(1, Math.round(strength / 25));
  
  // Create alpha buffer
  const alphaBuffer = new Uint8Array(width * height);
  for (let i = 0; i < alphaBuffer.length; i++) {
    alphaBuffer[i] = data[i * 4 + 3];
  }
  
  // Simple median-like filter
  for (let y = kernelSize; y < height - kernelSize; y++) {
    for (let x = kernelSize; x < width - kernelSize; x++) {
      const idx = y * width + x;
      const current = alphaBuffer[idx];
      
      // Count neighbors
      let opaqueNeighbors = 0;
      let total = 0;
      
      for (let ky = -kernelSize; ky <= kernelSize; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize; kx++) {
          const nIdx = (y + ky) * width + (x + kx);
          if (alphaBuffer[nIdx] > 128) opaqueNeighbors++;
          total++;
        }
      }
      
      // Denoise: if mostly surrounded by opaque, make opaque; if mostly transparent, make transparent
      const ratio = opaqueNeighbors / total;
      if (current > 128 && ratio < 0.3) {
        data[idx * 4 + 3] = Math.max(0, current - threshold);
      } else if (current < 128 && ratio > 0.7) {
        data[idx * 4 + 3] = Math.min(255, current + threshold);
      }
    }
  }
}

/**
 * Create a CSS filter approximation for preview (not actual keying)
 */
export function getChromaPreviewFilter(config: ChromaKeyConfig): string {
  if (!config.enabled) return 'none';
  
  // This is just a visual hint, actual keying happens on canvas
  const keyRgb = hexToRgb(config.keyColor);
  const inverted = keyRgb.map(c => 255 - c);
  
  return `
    drop-shadow(0 0 ${config.softness / 10}px rgba(${inverted.join(',')}, 0.3))
  `.trim();
}

/**
 * Sample colors from a frame for color picker
 */
export function sampleFrameColor(
  imageData: ImageData,
  x: number,
  y: number,
  sampleSize = 5
): string {
  const { data, width, height } = imageData;
  
  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  const half = Math.floor(sampleSize / 2);
  
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const sx = Math.max(0, Math.min(width - 1, x + dx));
      const sy = Math.max(0, Math.min(height - 1, y + dy));
      const idx = (sy * width + sx) * 4;
      
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      count++;
    }
  }
  
  const r = Math.round(totalR / count);
  const g = Math.round(totalG / count);
  const b = Math.round(totalB / count);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
