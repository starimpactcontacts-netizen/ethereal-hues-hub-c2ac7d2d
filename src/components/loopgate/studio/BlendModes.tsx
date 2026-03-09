/**
 * BlendModes — Canvas blend mode & overlay system for mobile editor
 */
import { useState } from "react";
import { Blend, Layers, Image } from "lucide-react";

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

export type BlendMode = GlobalCompositeOperation;

export const BLEND_MODES: { id: BlendMode; label: string; category: "normal" | "darken" | "lighten" | "contrast" }[] = [
  { id: "source-over", label: "Normal", category: "normal" },
  { id: "multiply", label: "Multiply", category: "darken" },
  { id: "darken", label: "Darken", category: "darken" },
  { id: "color-burn", label: "Color Burn", category: "darken" },
  { id: "screen", label: "Screen", category: "lighten" },
  { id: "lighten", label: "Lighten", category: "lighten" },
  { id: "color-dodge", label: "Color Dodge", category: "lighten" },
  { id: "overlay", label: "Overlay", category: "contrast" },
  { id: "hard-light", label: "Hard Light", category: "contrast" },
  { id: "soft-light", label: "Soft Light", category: "contrast" },
  { id: "difference", label: "Difference", category: "contrast" },
  { id: "exclusion", label: "Exclusion", category: "contrast" },
  { id: "luminosity", label: "Luminosity", category: "normal" },
  { id: "hue", label: "Hue", category: "normal" },
  { id: "saturation", label: "Saturation", category: "normal" },
  { id: "color", label: "Color", category: "normal" },
];

export type OverlayPreset = {
  id: string;
  label: string;
  color1: string;
  color2: string;
  blendMode: BlendMode;
  opacity: number;
};

export const OVERLAY_PRESETS: OverlayPreset[] = [
  { id: "none", label: "None", color1: "transparent", color2: "transparent", blendMode: "source-over", opacity: 0 },
  { id: "warm-glow", label: "Warm Glow", color1: "rgba(255,180,50,0.3)", color2: "rgba(255,100,20,0.1)", blendMode: "screen", opacity: 0.4 },
  { id: "cool-tone", label: "Cool Tone", color1: "rgba(50,100,255,0.2)", color2: "rgba(100,200,255,0.1)", blendMode: "overlay", opacity: 0.3 },
  { id: "sunset", label: "Sunset", color1: "rgba(255,100,50,0.4)", color2: "rgba(255,200,100,0.2)", blendMode: "soft-light", opacity: 0.5 },
  { id: "midnight", label: "Midnight", color1: "rgba(20,20,80,0.5)", color2: "rgba(50,0,100,0.3)", blendMode: "multiply", opacity: 0.4 },
  { id: "neon-leak", label: "Neon Leak", color1: "rgba(255,0,200,0.3)", color2: "rgba(0,255,200,0.2)", blendMode: "screen", opacity: 0.35 },
  { id: "vintage-fade", label: "Vintage", color1: "rgba(200,180,120,0.4)", color2: "rgba(100,80,50,0.2)", blendMode: "overlay", opacity: 0.3 },
  { id: "film-grain", label: "Film Grain", color1: "rgba(0,0,0,0.1)", color2: "rgba(50,50,50,0.05)", blendMode: "soft-light", opacity: 0.5 },
];

interface BlendModePanelProps {
  activeBlendMode: BlendMode;
  activeOverlay: string;
  overlayOpacity: number;
  onBlendModeChange: (mode: BlendMode) => void;
  onOverlayChange: (overlayId: string) => void;
  onOverlayOpacityChange: (opacity: number) => void;
  onClose: () => void;
}

export default function BlendModePanel({
  activeBlendMode,
  activeOverlay,
  overlayOpacity,
  onBlendModeChange,
  onOverlayChange,
  onOverlayOpacityChange,
  onClose,
}: BlendModePanelProps) {
  const [tab, setTab] = useState<"blend" | "overlay">("overlay");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blend className="w-4 h-4" style={{ color: "#FF44AA" }} />
          <span className="text-[11px] font-bold text-white">Blend & Overlay</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["overlay", "blend"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: tab === t ? ACCENT_DIM : "#111",
              color: tab === t ? ACCENT : "#555",
              border: tab === t ? `1px solid ${ACCENT_BORDER}` : "1px solid #1a1a1a",
            }}>
            {t === "overlay" ? "Overlays" : "Blend Modes"}
          </button>
        ))}
      </div>

      {tab === "overlay" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {OVERLAY_PRESETS.map((preset) => {
              const isActive = activeOverlay === preset.id;
              return (
                <button key={preset.id} onClick={() => onOverlayChange(preset.id)}
                  className="py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all"
                  style={{
                    background: isActive ? ACCENT_DIM : "#111",
                    border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #1a1a1a",
                  }}>
                  <div className="w-8 h-8 rounded-lg" style={{
                    background: preset.id === "none" ? "#222" : `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`,
                    border: "1px solid #333",
                  }} />
                  <span className="text-[7px] font-bold" style={{ color: isActive ? ACCENT : "#666" }}>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {activeOverlay !== "none" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px]" style={{ color: "#555" }}>Overlay Intensity</span>
                <span className="text-[9px] font-mono" style={{ color: ACCENT }}>{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input type="range" min={0} max={100} value={Math.round(overlayOpacity * 100)}
                onChange={(e) => onOverlayOpacityChange(Number(e.target.value) / 100)}
                className="w-full accent-[#9999FF]" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(["normal", "darken", "lighten", "contrast"] as const).map((cat) => {
            const modes = BLEND_MODES.filter(m => m.category === cat);
            return (
              <div key={cat}>
                <span className="text-[8px] uppercase tracking-wider font-bold block mb-1" style={{ color: "#444" }}>{cat}</span>
                <div className="flex flex-wrap gap-1">
                  {modes.map((mode) => (
                    <button key={mode.id} onClick={() => onBlendModeChange(mode.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[8px] font-bold transition-all"
                      style={{
                        background: activeBlendMode === mode.id ? ACCENT_DIM : "#111",
                        color: activeBlendMode === mode.id ? ACCENT : "#666",
                        border: activeBlendMode === mode.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #1a1a1a",
                      }}>
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Apply overlay to canvas context
 */
export function applyOverlay(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, overlay: OverlayPreset, opacity: number) {
  if (overlay.id === "none" || opacity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = overlay.blendMode;
  ctx.globalAlpha = opacity;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, overlay.color1);
  grad.addColorStop(1, overlay.color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
