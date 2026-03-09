/**
 * Loopgate Studio — Color Science Engine
 * LUT import, histogram, waveform, vectorscope data extraction
 */

// ─── Histogram ───
export type HistogramData = {
  r: number[];
  g: number[];
  b: number[];
  luma: number[];
};

export function computeHistogram(imageData: ImageData): HistogramData {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const luma = new Array(256).fill(0);
  const d = imageData.data;
  const step = 4; // sample every pixel for accuracy
  for (let i = 0; i < d.length; i += step) {
    r[d[i]]++;
    g[d[i + 1]]++;
    b[d[i + 2]]++;
    const l = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    luma[Math.min(255, l)]++;
  }
  return { r, g, b, luma };
}

// ─── Waveform ───
export type WaveformData = {
  columns: { r: number[]; g: number[]; b: number[] }[];
};

export function computeWaveform(imageData: ImageData, width: number, height: number, resolution = 128): WaveformData {
  const columns: WaveformData["columns"] = [];
  const d = imageData.data;
  const colWidth = Math.max(1, Math.floor(width / resolution));

  for (let col = 0; col < resolution; col++) {
    const rVals: number[] = [];
    const gVals: number[] = [];
    const bVals: number[] = [];
    const startX = col * colWidth;
    const endX = Math.min(startX + colWidth, width);

    for (let y = 0; y < height; y += 2) {
      for (let x = startX; x < endX; x += 2) {
        const idx = (y * width + x) * 4;
        rVals.push(d[idx] / 255);
        gVals.push(d[idx + 1] / 255);
        bVals.push(d[idx + 2] / 255);
      }
    }
    columns.push({ r: rVals, g: gVals, b: bVals });
  }
  return { columns };
}

// ─── Vectorscope ───
export type VectorscopePoint = { angle: number; saturation: number };

export function computeVectorscope(imageData: ImageData, sampleRate = 8): VectorscopePoint[] {
  const points: VectorscopePoint[] = [];
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4 * sampleRate) {
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta < 0.02) continue; // skip near-gray

    let hue = 0;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = ((hue * 60) + 360) % 360;

    const sat = max === 0 ? 0 : delta / max;
    points.push({ angle: hue, saturation: sat });
  }
  return points;
}

// ─── LUT Engine ───
export type LUT3D = {
  size: number;
  data: Float32Array; // size^3 * 3 (RGB triplets)
  title?: string;
};

/**
 * Parse a .cube LUT file
 */
export function parseCubeLUT(text: string): LUT3D | null {
  const lines = text.split("\n");
  let size = 0;
  let title = "";
  const values: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("TITLE")) {
      title = trimmed.substring(5).trim().replace(/"/g, "");
      continue;
    }
    if (trimmed.startsWith("LUT_3D_SIZE")) {
      size = parseInt(trimmed.split(/\s+/)[1]);
      continue;
    }
    if (trimmed.startsWith("DOMAIN_MIN") || trimmed.startsWith("DOMAIN_MAX")) continue;

    const parts = trimmed.split(/\s+/).map(Number);
    if (parts.length >= 3 && !isNaN(parts[0])) {
      values.push(parts[0], parts[1], parts[2]);
    }
  }

  if (size === 0 || values.length < size * size * size * 3) return null;
  return { size, data: new Float32Array(values), title };
}

/**
 * Apply 3D LUT to image data (trilinear interpolation)
 */
export function applyLUT(imageData: ImageData, lut: LUT3D, intensity = 1.0): void {
  const d = imageData.data;
  const s = lut.size;
  const s1 = s - 1;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;

    // Clamp and map to LUT coordinates
    const rIdx = r * s1;
    const gIdx = g * s1;
    const bIdx = b * s1;

    const r0 = Math.floor(rIdx), r1 = Math.min(r0 + 1, s1);
    const g0 = Math.floor(gIdx), g1 = Math.min(g0 + 1, s1);
    const b0 = Math.floor(bIdx), b1 = Math.min(b0 + 1, s1);

    const rf = rIdx - r0, gf = gIdx - g0, bf = bIdx - b0;

    // Trilinear interpolation
    const lookup = (ri: number, gi: number, bi: number, ch: number) =>
      lut.data[(bi * s * s + gi * s + ri) * 3 + ch];

    const result = [0, 0, 0];
    for (let ch = 0; ch < 3; ch++) {
      const c000 = lookup(r0, g0, b0, ch);
      const c100 = lookup(r1, g0, b0, ch);
      const c010 = lookup(r0, g1, b0, ch);
      const c110 = lookup(r1, g1, b0, ch);
      const c001 = lookup(r0, g0, b1, ch);
      const c101 = lookup(r1, g0, b1, ch);
      const c011 = lookup(r0, g1, b1, ch);
      const c111 = lookup(r1, g1, b1, ch);

      const c00 = c000 * (1 - rf) + c100 * rf;
      const c10 = c010 * (1 - rf) + c110 * rf;
      const c01 = c001 * (1 - rf) + c101 * rf;
      const c11 = c011 * (1 - rf) + c111 * rf;

      const c0 = c00 * (1 - gf) + c10 * gf;
      const c1 = c01 * (1 - gf) + c11 * gf;

      result[ch] = c0 * (1 - bf) + c1 * bf;
    }

    d[i] = Math.round((r * (1 - intensity) + result[0] * intensity) * 255);
    d[i + 1] = Math.round((g * (1 - intensity) + result[1] * intensity) * 255);
    d[i + 2] = Math.round((b * (1 - intensity) + result[2] * intensity) * 255);
  }
}

// ─── Built-in LUT Presets ───
export type LUTPreset = {
  id: string;
  label: string;
  category: string;
  // Simplified color transform (no .cube needed)
  transform: (r: number, g: number, b: number) => [number, number, number];
};

export const LUT_PRESETS: LUTPreset[] = [
  {
    id: "rec709", label: "Rec.709", category: "Technical",
    transform: (r, g, b) => [r, g, b],
  },
  {
    id: "log_to_rec709", label: "Log → Rec.709", category: "Technical",
    transform: (r, g, b) => {
      const curve = (v: number) => Math.pow(v, 0.45) * 1.1;
      return [curve(r), curve(g), curve(b)];
    },
  },
  {
    id: "bleach_bypass", label: "Bleach Bypass", category: "Film",
    transform: (r, g, b) => {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        Math.min(1, r * 0.6 + luma * 0.5),
        Math.min(1, g * 0.6 + luma * 0.5),
        Math.min(1, b * 0.55 + luma * 0.45),
      ];
    },
  },
  {
    id: "cross_process", label: "Cross Process", category: "Film",
    transform: (r, g, b) => [
      Math.min(1, r * 1.2 + 0.05),
      Math.min(1, g * 0.9 + 0.1),
      Math.min(1, b * 0.7 + 0.15),
    ],
  },
  {
    id: "teal_orange_lut", label: "Teal & Orange", category: "Cinematic",
    transform: (r, g, b) => {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return [
        Math.min(1, r * 1.1 + (luma > 0.5 ? 0.08 : -0.02)),
        Math.min(1, g * 0.95),
        Math.min(1, b * 0.85 + (luma < 0.5 ? 0.12 : -0.02)),
      ];
    },
  },
  {
    id: "moonlight", label: "Moonlight", category: "Cinematic",
    transform: (r, g, b) => [
      Math.min(1, r * 0.7 + 0.02),
      Math.min(1, g * 0.75 + 0.05),
      Math.min(1, b * 0.95 + 0.1),
    ],
  },
  {
    id: "golden_age", label: "Golden Age", category: "Cinematic",
    transform: (r, g, b) => [
      Math.min(1, r * 1.15 + 0.05),
      Math.min(1, g * 1.0 + 0.02),
      Math.min(1, b * 0.75),
    ],
  },
  {
    id: "noir_lut", label: "Noir", category: "Cinematic",
    transform: (r, g, b) => {
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const contrast = Math.pow(luma, 1.4);
      return [contrast * 0.95, contrast * 0.92, contrast * 1.05];
    },
  },
];

export function applyLUTPreset(imageData: ImageData, preset: LUTPreset, intensity = 1.0): void {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255;
    const g = d[i + 1] / 255;
    const b = d[i + 2] / 255;
    const [nr, ng, nb] = preset.transform(r, g, b);
    d[i] = Math.round((r * (1 - intensity) + Math.max(0, Math.min(1, nr)) * intensity) * 255);
    d[i + 1] = Math.round((g * (1 - intensity) + Math.max(0, Math.min(1, ng)) * intensity) * 255);
    d[i + 2] = Math.round((b * (1 - intensity) + Math.max(0, Math.min(1, nb)) * intensity) * 255);
  }
}
