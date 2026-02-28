/**
 * Advanced Color Grading & Adjustment Engine — Loopgate Studio
 * CapCut-level controls: Color (Temp, Tint), Lightness (Exposure, Contrast,
 * Highlight, Shadow, Whites, Blacks, Brilliance), Effects (Sharpen, Clarity,
 * Fade, Vignette).
 */

// ─── Types ───
export type AdjustmentValues = {
  // Color
  temp: number;        // -100 to 100 (cool ↔ warm)
  tint: number;        // -100 to 100 (green ↔ magenta)
  // Lightness
  exposure: number;    // -100 to 100
  contrast: number;    // -100 to 100
  highlight: number;   // -100 to 100
  shadow: number;      // -100 to 100
  whites: number;      // -100 to 100
  blacks: number;      // -100 to 100
  brilliance: number;  // -100 to 100
  // Effects
  sharpen: number;     // 0 to 100
  clarity: number;     // 0 to 100
  fade: number;        // 0 to 100
  vignette: number;    // 0 to 100
};

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  temp: 0, tint: 0,
  exposure: 0, contrast: 0, highlight: 0, shadow: 0, whites: 0, blacks: 0, brilliance: 0,
  sharpen: 0, clarity: 0, fade: 0, vignette: 0,
};

export type AdjustSection = "color" | "lightness" | "effects";

export const ADJUST_SECTIONS: { id: AdjustSection; label: string; params: { key: keyof AdjustmentValues; label: string; min: number; max: number; gradient?: string }[] }[] = [
  {
    id: "color", label: "Color",
    params: [
      { key: "temp", label: "Temp", min: -100, max: 100, gradient: "linear-gradient(to right, #4488ff, #888, #ff8844)" },
      { key: "tint", label: "Tint", min: -100, max: 100, gradient: "linear-gradient(to right, #44cc88, #888, #cc44aa)" },
    ],
  },
  {
    id: "lightness", label: "Lightness",
    params: [
      { key: "exposure", label: "Exposure", min: -100, max: 100 },
      { key: "contrast", label: "Contrast", min: -100, max: 100 },
      { key: "highlight", label: "Highlight", min: -100, max: 100 },
      { key: "shadow", label: "Shadow", min: -100, max: 100 },
      { key: "whites", label: "Whites", min: -100, max: 100 },
      { key: "blacks", label: "Blacks", min: -100, max: 100 },
      { key: "brilliance", label: "Brilliance", min: -100, max: 100 },
    ],
  },
  {
    id: "effects", label: "Effects",
    params: [
      { key: "sharpen", label: "Sharpen", min: 0, max: 100 },
      { key: "clarity", label: "Clarity", min: 0, max: 100 },
      { key: "fade", label: "Fade", min: 0, max: 100 },
      { key: "vignette", label: "Vignette", min: 0, max: 100 },
    ],
  },
];

// ─── Build CSS Filter String from Adjustments ───
export function buildAdjustFilter(adj: AdjustmentValues): string {
  const parts: string[] = [];

  // Exposure → brightness
  if (adj.exposure !== 0) {
    const b = 1 + adj.exposure / 100;
    parts.push(`brightness(${b.toFixed(2)})`);
  }

  // Contrast
  if (adj.contrast !== 0) {
    const c = 1 + adj.contrast / 100;
    parts.push(`contrast(${c.toFixed(2)})`);
  }

  // Brilliance → saturate + slight brightness boost
  if (adj.brilliance !== 0) {
    const s = 1 + adj.brilliance * 0.005;
    const b = 1 + adj.brilliance * 0.002;
    parts.push(`saturate(${s.toFixed(2)})`);
    parts.push(`brightness(${b.toFixed(2)})`);
  }

  // Temp → hue-rotate + sepia tint
  if (adj.temp !== 0) {
    if (adj.temp > 0) {
      parts.push(`sepia(${(adj.temp * 0.003).toFixed(3)})`);
      parts.push(`hue-rotate(-${Math.round(adj.temp * 0.1)}deg)`);
    } else {
      parts.push(`hue-rotate(${Math.round(Math.abs(adj.temp) * 0.15)}deg)`);
    }
  }

  // Tint → hue-rotate in opposite axis
  if (adj.tint !== 0) {
    parts.push(`hue-rotate(${Math.round(adj.tint * 0.3)}deg)`);
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

// ─── Apply Canvas-Based Adjustments (post-filter) ───
export function applyCanvasAdjustments(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  adj: AdjustmentValues
) {
  const w = canvas.width, h = canvas.height;
  const hasPixelWork = adj.highlight !== 0 || adj.shadow !== 0 || adj.whites !== 0 || adj.blacks !== 0 || adj.sharpen > 0 || adj.clarity > 0;

  if (hasPixelWork) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

      // Highlights — affect bright pixels
      if (adj.highlight !== 0) {
        const factor = lum > 0.5 ? (lum - 0.5) * 2 : 0;
        const shift = adj.highlight * 0.8 * factor;
        r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift);
      }

      // Shadows — affect dark pixels
      if (adj.shadow !== 0) {
        const factor = lum < 0.5 ? (0.5 - lum) * 2 : 0;
        const shift = adj.shadow * 0.8 * factor;
        r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift);
      }

      // Whites — push brights toward white
      if (adj.whites !== 0) {
        const factor = lum > 0.7 ? (lum - 0.7) / 0.3 : 0;
        const shift = adj.whites * 0.6 * factor;
        r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift);
      }

      // Blacks — push darks toward black
      if (adj.blacks !== 0) {
        const factor = lum < 0.3 ? (0.3 - lum) / 0.3 : 0;
        const shift = -adj.blacks * 0.6 * factor;
        r = clamp(r + shift); g = clamp(g + shift); b = clamp(b + shift);
      }

      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }

    // Clarity — local contrast enhancement (simplified unsharp mask on luminance)
    if (adj.clarity > 0) {
      const strength = adj.clarity / 100;
      const stride = w > 1280 ? 4 : 2;
      for (let y = stride; y < h - stride; y += stride) {
        for (let x = stride; x < w - stride; x += stride) {
          const idx = (y * w + x) * 4;
          const idxL = (y * w + (x - stride)) * 4;
          const idxR = (y * w + (x + stride)) * 4;
          const idxU = ((y - stride) * w + x) * 4;
          const idxD = ((y + stride) * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = d[idx + c];
            const avg = (d[idxL + c] + d[idxR + c] + d[idxU + c] + d[idxD + c]) / 4;
            const diff = (center - avg) * strength * 0.5;
            d[idx + c] = clamp(center + diff);
          }
        }
      }
    }

    // Sharpen — simple convolution
    if (adj.sharpen > 0) {
      const strength = adj.sharpen / 100;
      const src = new Uint8ClampedArray(d);
      const stride = w > 1280 ? 2 : 1;
      for (let y = stride; y < h - stride; y += stride) {
        for (let x = stride; x < w - stride; x += stride) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = src[idx + c] * (1 + 4 * strength);
            const neighbors =
              src[((y - 1) * w + x) * 4 + c] +
              src[((y + 1) * w + x) * 4 + c] +
              src[(y * w + x - 1) * 4 + c] +
              src[(y * w + x + 1) * 4 + c];
            d[idx + c] = clamp(center - neighbors * strength);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // Fade — raise black level
  if (adj.fade > 0) {
    const alpha = adj.fade / 100 * 0.35;
    ctx.fillStyle = `rgba(40, 40, 45, ${alpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette — radial darkening
  if (adj.vignette > 0) {
    const strength = adj.vignette / 100;
    const cx = w / 2, cy = h / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);
    const grd = ctx.createRadialGradient(cx, cy, radius * (0.4 - strength * 0.15), cx, cy, radius);
    grd.addColorStop(0, "transparent");
    grd.addColorStop(0.5, `rgba(0,0,0,${strength * 0.25})`);
    grd.addColorStop(1, `rgba(0,0,0,${strength * 0.7})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

// ─── Check if any adjustments are non-default ───
export function hasAdjustments(adj: AdjustmentValues): boolean {
  return Object.keys(DEFAULT_ADJUSTMENTS).some(
    k => adj[k as keyof AdjustmentValues] !== DEFAULT_ADJUSTMENTS[k as keyof AdjustmentValues]
  );
}
