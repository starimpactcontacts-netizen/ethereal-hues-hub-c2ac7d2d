/**
 * Shared Studio Effects Engine — Loopgate Studio
 * Real-time canvas effects, filters, transitions, and text styles.
 * Used by both StudioNLE (desktop) and QuickClipEditor (mobile).
 */

// ─── Types ───
export type FilterPreset = {
  name: string;
  label: string;
  filter: string;
  color: string;
  category: "basic" | "cinema" | "mood" | "film";
};

export type TextStyleKey = "bold" | "caption" | "title" | "glow" | "outline" | "neon" | "shadow" | "typewriter" | "minimal";

export type TextStyleDef = {
  font: string;
  color: string;
  stroke: string;
  label: string;
  shadow?: string;
  glow?: boolean;
};

export type EffectDef = { id: string; label: string; icon: string; category: "distort" | "color" | "style" | "light" };
export type TransitionDef = { id: string; label: string; icon: string };

// ─── Filters (24 presets) ───
export const FILTER_PRESETS: FilterPreset[] = [
  // Basic
  { name: "none", label: "Original", filter: "none", color: "hsl(0 0% 30%)", category: "basic" },
  { name: "chrome", label: "Chrome", filter: "contrast(1.2) saturate(0.4) brightness(1.1)", color: "hsl(200 10% 50%)", category: "basic" },
  { name: "fade", label: "Fade", filter: "contrast(0.85) saturate(0.6) brightness(1.15)", color: "hsl(220 15% 45%)", category: "basic" },
  { name: "bw", label: "B&W", filter: "grayscale(1) contrast(1.15)", color: "hsl(0 0% 35%)", category: "basic" },
  // Cinema
  { name: "cinematic", label: "Cinema", filter: "contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)", color: "hsl(30 30% 35%)", category: "cinema" },
  { name: "noir", label: "Noir", filter: "grayscale(1) contrast(1.3) brightness(0.9)", color: "hsl(0 0% 20%)", category: "cinema" },
  { name: "blockbuster", label: "Blockbuster", filter: "contrast(1.25) saturate(1.1) brightness(0.92) sepia(0.05)", color: "hsl(210 30% 30%)", category: "cinema" },
  { name: "anamorphic", label: "Anamorphic", filter: "contrast(1.2) saturate(0.9) brightness(0.95) hue-rotate(5deg)", color: "hsl(200 20% 35%)", category: "cinema" },
  { name: "teal_orange", label: "Teal & Orange", filter: "contrast(1.2) saturate(1.3) hue-rotate(-5deg) brightness(0.95)", color: "hsl(25 60% 35%)", category: "cinema" },
  // Mood
  { name: "phonk", label: "Phonk", filter: "contrast(1.4) saturate(1.3) brightness(0.85) hue-rotate(-10deg)", color: "hsl(340 60% 30%)", category: "mood" },
  { name: "cold", label: "Cold", filter: "saturate(0.7) brightness(1.05) hue-rotate(15deg) contrast(1.1)", color: "hsl(210 50% 35%)", category: "mood" },
  { name: "heat", label: "Heat", filter: "saturate(1.4) brightness(1.05) hue-rotate(-15deg) contrast(1.1)", color: "hsl(15 70% 35%)", category: "mood" },
  { name: "neon", label: "Neon", filter: "contrast(1.3) saturate(1.6) brightness(1.1)", color: "hsl(280 70% 40%)", category: "mood" },
  { name: "dream", label: "Dream", filter: "contrast(0.9) saturate(1.3) brightness(1.15)", color: "hsl(270 40% 50%)", category: "mood" },
  { name: "lofi", label: "Lo-Fi", filter: "contrast(1.5) saturate(1.1) brightness(0.8)", color: "hsl(0 40% 25%)", category: "mood" },
  { name: "golden_hour", label: "Golden Hour", filter: "brightness(1.1) saturate(1.2) sepia(0.15) hue-rotate(-10deg)", color: "hsl(40 60% 40%)", category: "mood" },
  { name: "midnight", label: "Midnight", filter: "brightness(0.75) contrast(1.3) saturate(0.6) hue-rotate(20deg)", color: "hsl(230 40% 20%)", category: "mood" },
  { name: "toxic", label: "Toxic", filter: "contrast(1.3) saturate(1.5) hue-rotate(80deg) brightness(0.9)", color: "hsl(120 60% 25%)", category: "mood" },
  // Film
  { name: "vintage", label: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.8)", color: "hsl(35 40% 35%)", category: "film" },
  { name: "kodak", label: "Kodak Gold", filter: "sepia(0.2) contrast(1.1) saturate(1.15) brightness(1.05) hue-rotate(-5deg)", color: "hsl(40 50% 40%)", category: "film" },
  { name: "fuji", label: "Fuji Pro", filter: "contrast(1.15) saturate(0.95) brightness(1.02) hue-rotate(5deg)", color: "hsl(170 30% 35%)", category: "film" },
  { name: "polaroid", label: "Polaroid", filter: "contrast(0.95) saturate(0.85) brightness(1.1) sepia(0.15)", color: "hsl(45 30% 50%)", category: "film" },
  { name: "film_burn", label: "Film Burn", filter: "contrast(1.2) saturate(1.4) brightness(0.9) sepia(0.1) hue-rotate(-8deg)", color: "hsl(10 50% 30%)", category: "film" },
  { name: "super8", label: "Super 8", filter: "sepia(0.3) contrast(1.3) brightness(0.85) saturate(0.7)", color: "hsl(30 35% 28%)", category: "film" },
];

// ─── Text Styles (9 styles) ───
export const TEXT_STYLES: Record<TextStyleKey, TextStyleDef> = {
  bold: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "#000000", label: "Bold" },
  caption: { font: "600 24px 'Inter', sans-serif", color: "#ffffff", stroke: "#000000", label: "Caption" },
  title: { font: "bold 64px 'Bebas Neue', sans-serif", color: "hsl(43, 74%, 49%)", stroke: "#000000", label: "Title" },
  glow: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "rgba(200,150,50,0.8)", label: "Glow", glow: true },
  outline: { font: "bold 56px 'Bebas Neue', sans-serif", color: "transparent", stroke: "#ffffff", label: "Outline" },
  neon: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#00ffcc", stroke: "#003322", label: "Neon", glow: true, shadow: "rgba(0,255,200,0.8)" },
  shadow: { font: "bold 52px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "#000000", label: "Shadow", shadow: "rgba(0,0,0,0.6)" },
  typewriter: { font: "500 28px 'Courier New', monospace", color: "#e0e0e0", stroke: "#000000", label: "Typewriter" },
  minimal: { font: "300 32px 'Inter', sans-serif", color: "#ffffff", stroke: "transparent", label: "Minimal" },
};

// ─── Effects (18 effects) ───
export const EFFECTS: EffectDef[] = [
  // Distort
  { id: "glitch", label: "Glitch", icon: "⚡", category: "distort" },
  { id: "shake", label: "Shake", icon: "📳", category: "distort" },
  { id: "zoom_pulse", label: "Zoom Pulse", icon: "🔍", category: "distort" },
  { id: "mirror", label: "Mirror", icon: "🪞", category: "distort" },
  { id: "pixelate", label: "Pixelate", icon: "🟩", category: "distort" },
  { id: "wave", label: "Wave", icon: "🌊", category: "distort" },
  // Color
  { id: "rgb_split", label: "RGB Split", icon: "🌈", category: "color" },
  { id: "invert", label: "Invert", icon: "🔄", category: "color" },
  { id: "duotone", label: "Duotone", icon: "🎨", category: "color" },
  { id: "chromatic", label: "Chromatic", icon: "💎", category: "color" },
  { id: "posterize", label: "Posterize", icon: "🖼", category: "color" },
  // Style
  { id: "vhs", label: "VHS", icon: "📼", category: "style" },
  { id: "grain", label: "Grain", icon: "🎞", category: "style" },
  { id: "halftone", label: "Halftone", icon: "⚫", category: "style" },
  { id: "blur_pulse", label: "Blur", icon: "💨", category: "style" },
  // Light
  { id: "flash", label: "Flash", icon: "💥", category: "light" },
  { id: "light_leak", label: "Light Leak", icon: "☀️", category: "light" },
  { id: "strobe", label: "Strobe", icon: "💡", category: "light" },
];

// ─── Transitions (12 presets) ───
export const TRANSITIONS: TransitionDef[] = [
  { id: "fade", label: "Fade", icon: "🌅" },
  { id: "dissolve", label: "Dissolve", icon: "✨" },
  { id: "slide_left", label: "Slide Left", icon: "⬅" },
  { id: "slide_right", label: "Slide Right", icon: "➡" },
  { id: "slide_up", label: "Slide Up", icon: "⬆" },
  { id: "wipe", label: "Wipe", icon: "🧹" },
  { id: "zoom_in", label: "Zoom In", icon: "🔎" },
  { id: "zoom_out", label: "Zoom Out", icon: "🔍" },
  { id: "spin", label: "Spin", icon: "🌀" },
  { id: "blur_trans", label: "Blur", icon: "💨" },
  { id: "glitch_trans", label: "Glitch", icon: "⚡" },
  { id: "flash_trans", label: "Flash", icon: "💫" },
];

export const SPEED_OPTIONS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

// ─── Effect Application Engine ───
export function applyEffect(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  effectId: string,
  time: number,
  intensity: number = 1
) {
  const w = canvas.width, h = canvas.height;
  const t = time;

  switch (effectId) {
    case "glitch": {
      const sliceCount = Math.round((6 + Math.floor(Math.random() * 10)) * intensity);
      for (let i = 0; i < sliceCount; i++) {
        const y = Math.random() * h;
        const sliceH = 2 + Math.random() * 25 * intensity;
        const offset = (Math.random() - 0.5) * 40 * intensity;
        try {
          const imgData = ctx.getImageData(Math.max(0, 0), Math.max(0, Math.floor(y)), w, Math.min(Math.ceil(sliceH), h - Math.floor(y)));
          ctx.putImageData(imgData, offset, Math.floor(y));
        } catch { /* ignore edge cases */ }
      }
      // Random color channel overlay
      if (Math.random() < 0.3 * intensity) {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},${Math.random() > 0.5 ? 255 : 0},${0.05 * intensity})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }
      break;
    }

    case "shake": {
      const ox = (Math.random() - 0.5) * 16 * intensity;
      const oy = (Math.random() - 0.5) * 16 * intensity;
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(imgData, ox, oy);
      break;
    }

    case "zoom_pulse": {
      const scale = 1 + Math.sin(t * 4) * 0.04 * intensity;
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();
      break;
    }

    case "flash": {
      if (Math.random() < 0.06 * intensity) {
        ctx.fillStyle = `rgba(255,255,255,${(0.3 + Math.random() * 0.5) * intensity})`;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }

    case "rgb_split": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const shift = Math.round((4 + Math.sin(t * 3) * 4) * intensity);
      const shifted = ctx.createImageData(w, h);
      for (let y2 = 0; y2 < h; y2++) {
        for (let x = 0; x < w; x++) {
          const idx = (y2 * w + x) * 4;
          const rIdx = (y2 * w + Math.min(w - 1, x + shift)) * 4;
          const bIdx = (y2 * w + Math.max(0, x - shift)) * 4;
          shifted.data[idx] = imgData.data[rIdx];
          shifted.data[idx + 1] = imgData.data[idx + 1];
          shifted.data[idx + 2] = imgData.data[bIdx + 2];
          shifted.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(shifted, 0, 0);
      break;
    }

    case "vhs": {
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      for (let y2 = 0; y2 < h; y2 += 2) ctx.fillRect(0, y2, w, 1);
      ctx.globalAlpha = 0.05 * intensity;
      ctx.fillStyle = `hsl(${(t * 60) % 360}, 100%, 50%)`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      const trackY = (Math.sin(t * 2) * 0.5 + 0.5) * h;
      const trackH = Math.ceil(3 + Math.random() * 6 * intensity);
      try {
        const imgData = ctx.getImageData(0, Math.floor(trackY), w, Math.min(trackH, h - Math.floor(trackY)));
        ctx.putImageData(imgData, (Math.random() - 0.5) * 10 * intensity, Math.floor(trackY));
      } catch { /* ignore */ }
      break;
    }

    case "grain": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const stride = w > 640 ? 16 : 8; // Performance scaling
      for (let i = 0; i < imgData.data.length; i += stride) {
        const noise = (Math.random() - 0.5) * 35 * intensity;
        imgData.data[i] += noise;
        imgData.data[i + 1] += noise;
        imgData.data[i + 2] += noise;
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case "light_leak": {
      const grd = ctx.createRadialGradient(
        w * (0.3 + Math.sin(t * 0.5) * 0.3), h * 0.3, 0,
        w * 0.5, h * 0.5, w * 0.8
      );
      grd.addColorStop(0, `hsla(${(t * 30) % 60 + 20}, 80%, 60%, ${0.18 * intensity})`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case "mirror": {
      try {
        const half = ctx.getImageData(0, 0, Math.floor(w / 2), h);
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.putImageData(half, Math.ceil(w / 2), 0);
        ctx.restore();
      } catch { /* ignore */ }
      break;
    }

    case "pixelate": {
      const size = Math.round(6 + 6 * intensity);
      for (let y2 = 0; y2 < h; y2 += size) {
        for (let x = 0; x < w; x += size) {
          try {
            const imgData = ctx.getImageData(x, y2, 1, 1);
            ctx.fillStyle = `rgb(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]})`;
            ctx.fillRect(x, y2, size, size);
          } catch { /* ignore */ }
        }
      }
      break;
    }

    case "invert": {
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = 255 - imgData.data[i];
        imgData.data[i + 1] = 255 - imgData.data[i + 1];
        imgData.data[i + 2] = 255 - imgData.data[i + 2];
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case "blur_pulse": {
      ctx.globalAlpha = 0.12 * intensity;
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        ctx.putImageData(imgData, (Math.random() - 0.5) * 5 * intensity, (Math.random() - 0.5) * 5 * intensity);
      }
      ctx.globalAlpha = 1;
      break;
    }

    case "wave": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const shifted = ctx.createImageData(w, h);
      for (let y2 = 0; y2 < h; y2++) {
        const xOffset = Math.round(Math.sin(y2 * 0.02 + t * 3) * 10 * intensity);
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w - 1, x + xOffset));
          const srcIdx = (y2 * w + srcX) * 4;
          const dstIdx = (y2 * w + x) * 4;
          shifted.data[dstIdx] = imgData.data[srcIdx];
          shifted.data[dstIdx + 1] = imgData.data[srcIdx + 1];
          shifted.data[dstIdx + 2] = imgData.data[srcIdx + 2];
          shifted.data[dstIdx + 3] = 255;
        }
      }
      ctx.putImageData(shifted, 0, 0);
      break;
    }

    case "duotone": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const hue1 = (t * 20) % 360;
      const hue2 = (hue1 + 180) % 360;
      for (let i = 0; i < imgData.data.length; i += 4) {
        const lum = (imgData.data[i] * 0.299 + imgData.data[i + 1] * 0.587 + imgData.data[i + 2] * 0.114) / 255;
        const h = lum < 0.5 ? hue1 : hue2;
        const s = 0.7;
        const l = lum * 0.8 + 0.1;
        const [r, g, b] = hslToRgb(h / 360, s, l);
        imgData.data[i] = Math.round(imgData.data[i] * (1 - intensity * 0.7) + r * intensity * 0.7);
        imgData.data[i + 1] = Math.round(imgData.data[i + 1] * (1 - intensity * 0.7) + g * intensity * 0.7);
        imgData.data[i + 2] = Math.round(imgData.data[i + 2] * (1 - intensity * 0.7) + b * intensity * 0.7);
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case "chromatic": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const shift = Math.round((3 + Math.sin(t * 2) * 3) * intensity);
      const result = ctx.createImageData(w, h);
      for (let y2 = 0; y2 < h; y2++) {
        for (let x = 0; x < w; x++) {
          const idx = (y2 * w + x) * 4;
          const rX = Math.min(w - 1, x + shift);
          const gY = Math.min(h - 1, y2 + Math.round(shift * 0.5));
          const bX = Math.max(0, x - shift);
          result.data[idx] = imgData.data[(y2 * w + rX) * 4];
          result.data[idx + 1] = imgData.data[(gY * w + x) * 4 + 1];
          result.data[idx + 2] = imgData.data[(y2 * w + bX) * 4 + 2];
          result.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(result, 0, 0);
      break;
    }

    case "posterize": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const levels = Math.round(3 + (1 - intensity) * 5);
      const step = 255 / levels;
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = Math.round(imgData.data[i] / step) * step;
        imgData.data[i + 1] = Math.round(imgData.data[i + 1] / step) * step;
        imgData.data[i + 2] = Math.round(imgData.data[i + 2] / step) * step;
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case "halftone": {
      const size = Math.round(4 + 4 * intensity);
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      for (let y2 = 0; y2 < h; y2 += size) {
        for (let x = 0; x < w; x += size) {
          const idx = (y2 * w + x) * 4;
          const lum = (imgData.data[idx] * 0.299 + imgData.data[idx + 1] * 0.587 + imgData.data[idx + 2] * 0.114) / 255;
          const r = lum * size * 0.5;
          if (r > 0.5) {
            ctx.beginPath();
            ctx.arc(x + size / 2, y2 + size / 2, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${imgData.data[idx]},${imgData.data[idx + 1]},${imgData.data[idx + 2]})`;
            ctx.fill();
          }
        }
      }
      break;
    }

    case "strobe": {
      const strobePhase = Math.sin(t * 12 * intensity);
      if (strobePhase > 0.7) {
        ctx.fillStyle = `rgba(255,255,255,${0.2 * intensity})`;
        ctx.fillRect(0, 0, w, h);
      } else if (strobePhase < -0.7) {
        ctx.fillStyle = `rgba(0,0,0,${0.15 * intensity})`;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
  }
}

// ─── Text Rendering ───
export function renderTextOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  x: number,
  y: number,
  styleKey: TextStyleKey
) {
  const style = TEXT_STYLES[styleKey];
  ctx.font = style.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Shadow
  if (style.shadow) {
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }

  // Glow
  if (style.glow) {
    ctx.shadowColor = style.shadow || "rgba(200,150,50,0.9)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Stroke
  if (style.stroke !== "transparent") {
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = styleKey === "outline" ? 3 : 4;
    ctx.lineJoin = "round";
    ctx.strokeText(text, canvas.width * x, canvas.height * y);
  }

  // Fill
  if (style.color !== "transparent") {
    ctx.fillStyle = style.color;
    ctx.fillText(text, canvas.width * x, canvas.height * y);
  }

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// ─── Helpers ───
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ─── Computed Filter Builder ───
export function buildComputedFilter(
  activeFilter: FilterPreset,
  brightness: number,
  contrast: number,
  saturation: number,
  hueRotate: number
): string {
  const parts: string[] = [];
  if (activeFilter.filter !== "none") parts.push(activeFilter.filter);
  if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
  if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
  if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
  if (hueRotate !== 0) parts.push(`hue-rotate(${hueRotate}deg)`);
  return parts.length > 0 ? parts.join(" ") : "none";
}

// ─── Timecode Formatter ───
export function formatTimecode(t: number, showFrames = false): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  if (showFrames) {
    const f = Math.floor((t % 1) * 30);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
  }
  const ms = Math.floor((t % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

// ─── Export Quality Presets ───
export const EXPORT_QUALITIES = [
  { id: "draft", label: "Draft", resolution: 0.5, bitrate: 2_000_000, fps: 24 },
  { id: "standard", label: "Standard", resolution: 0.75, bitrate: 8_000_000, fps: 30 },
  { id: "high", label: "High", resolution: 1, bitrate: 20_000_000, fps: 30 },
  { id: "max", label: "Max Quality", resolution: 1, bitrate: 40_000_000, fps: 60 },
] as const;

export type ExportQuality = typeof EXPORT_QUALITIES[number]["id"];
