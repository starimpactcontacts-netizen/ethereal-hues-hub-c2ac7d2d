/**
 * CompositorPanel — PiP, Split Screen, Multi-layer compositing
 */
import { useState, useRef } from "react";
import { PictureInPicture2, LayoutGrid, Layers, Upload, Trash2, Move, Maximize } from "lucide-react";

const ACCENT = "#9999FF";

export type CompositorLayer = {
  id: string;
  type: "pip" | "split";
  videoUrl: string;
  fileName: string;
  // PiP positioning (0-1 normalized)
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  visible: boolean;
};

export type SplitLayout = {
  id: string;
  label: string;
  regions: { x: number; y: number; w: number; h: number }[];
};

export const SPLIT_LAYOUTS: SplitLayout[] = [
  { id: "half_h", label: "50/50 H", regions: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { id: "half_v", label: "50/50 V", regions: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { id: "thirds", label: "Thirds", regions: [{ x: 0, y: 0, w: 0.333, h: 1 }, { x: 0.333, y: 0, w: 0.334, h: 1 }, { x: 0.667, y: 0, w: 0.333, h: 1 }] },
  { id: "quad", label: "Quad", regions: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { id: "pip_br", label: "PiP BR", regions: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.65, y: 0.65, w: 0.3, h: 0.3 }] },
  { id: "pip_bl", label: "PiP BL", regions: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.05, y: 0.65, w: 0.3, h: 0.3 }] },
  { id: "pip_tr", label: "PiP TR", regions: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.65, y: 0.05, w: 0.3, h: 0.3 }] },
  { id: "reaction", label: "Reaction", regions: [{ x: 0, y: 0, w: 1, h: 0.65 }, { x: 0.3, y: 0.55, w: 0.4, h: 0.4 }] },
];

export const DEFAULT_PIP: Omit<CompositorLayer, "id" | "videoUrl" | "fileName"> = {
  type: "pip",
  x: 0.7, y: 0.7,
  width: 0.25, height: 0.25,
  opacity: 1,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#ffffff",
  visible: true,
};

/**
 * Render compositor layers onto canvas
 */
export function renderCompositorLayers(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  layers: CompositorLayer[],
  videoElements: Map<string, HTMLVideoElement>
): void {
  for (const layer of layers) {
    if (!layer.visible) continue;
    const vid = videoElements.get(layer.id);
    if (!vid || vid.readyState < 2) continue;

    const dx = layer.x * canvas.width;
    const dy = layer.y * canvas.height;
    const dw = layer.width * canvas.width;
    const dh = layer.height * canvas.height;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Border radius clipping
    if (layer.borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, layer.borderRadius);
      ctx.clip();
    }

    // Draw video
    ctx.drawImage(vid, dx, dy, dw, dh);

    // Border
    if (layer.borderWidth > 0) {
      ctx.strokeStyle = layer.borderColor;
      ctx.lineWidth = layer.borderWidth;
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, layer.borderRadius);
      ctx.stroke();
    }

    ctx.restore();
  }
}

interface CompositorPanelProps {
  layers: CompositorLayer[];
  selectedLayerId: string | null;
  activeSplitLayout: string | null;
  onAddLayer: (file: File) => void;
  onUpdateLayer: (id: string, updates: Partial<CompositorLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onSelectLayer: (id: string | null) => void;
  onSplitLayoutChange: (layoutId: string | null) => void;
  onClose: () => void;
}

export default function CompositorPanel({
  layers, selectedLayerId, activeSplitLayout,
  onAddLayer, onUpdateLayer, onDeleteLayer, onSelectLayer, onSplitLayoutChange, onClose,
}: CompositorPanelProps) {
  const [tab, setTab] = useState<"pip" | "split">("pip");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selected = layers.find(l => l.id === selectedLayerId);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onAddLayer(f);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: "#06B6D4" }} />
          <span className="text-[11px] font-bold text-white">Compositor</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["pip", "split"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: tab === t ? "rgba(6,182,212,0.1)" : "#111",
              color: tab === t ? "#06B6D4" : "#555",
              border: tab === t ? "1px solid rgba(6,182,212,0.22)" : "1px solid #1a1a1a",
            }}>
            {t === "pip" ? "Picture in Picture" : "Split Screen"}
          </button>
        ))}
      </div>

      {tab === "pip" ? (
        <div className="space-y-2">
          {/* Add PiP layer */}
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-[9px] font-bold active:scale-97 transition-all"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.22)", color: "#06B6D4" }}>
            <Upload className="w-3.5 h-3.5" /> Add PiP Layer
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />

          {/* Layer list */}
          {layers.map((layer) => (
            <div key={layer.id}
              onClick={() => onSelectLayer(layer.id === selectedLayerId ? null : layer.id)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
              style={{
                background: layer.id === selectedLayerId ? "rgba(6,182,212,0.1)" : "#111",
                border: layer.id === selectedLayerId ? "1px solid rgba(6,182,212,0.2)" : "1px solid #1a1a1a",
              }}>
              <PictureInPicture2 className="w-3 h-3" style={{ color: "#06B6D4" }} />
              <span className="text-[9px] font-bold flex-1 truncate" style={{ color: "#fff" }}>{layer.fileName}</span>
              <button onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }} className="p-0.5">
                <Trash2 className="w-3 h-3" style={{ color: "#555" }} />
              </button>
            </div>
          ))}

          {/* Selected layer controls */}
          {selected && (
            <div className="space-y-2 p-2.5 rounded-xl" style={{ background: "#0d0d0d", border: "1px solid rgba(6,182,212,0.15)" }}>
              {[
                { label: "Position X", key: "x" as const, min: 0, max: 100, val: Math.round(selected.x * 100) },
                { label: "Position Y", key: "y" as const, min: 0, max: 100, val: Math.round(selected.y * 100) },
                { label: "Size", key: "width" as const, min: 5, max: 100, val: Math.round(selected.width * 100) },
                { label: "Opacity", key: "opacity" as const, min: 0, max: 100, val: Math.round(selected.opacity * 100) },
                { label: "Corner Radius", key: "borderRadius" as const, min: 0, max: 50, val: selected.borderRadius },
              ].map(({ label, key, min, max, val }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[7px] w-16" style={{ color: "#555" }}>{label}</span>
                  <input type="range" min={min} max={max} value={val}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (key === "borderRadius") onUpdateLayer(selected.id, { [key]: v });
                      else if (key === "width") onUpdateLayer(selected.id, { width: v / 100, height: v / 100 });
                      else onUpdateLayer(selected.id, { [key]: v / 100 });
                    }}
                    className="flex-1 accent-[#06B6D4]" />
                  <span className="text-[7px] font-mono w-8 text-right" style={{ color: "#06B6D4" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {SPLIT_LAYOUTS.map((layout) => (
            <button key={layout.id}
              onClick={() => onSplitLayoutChange(activeSplitLayout === layout.id ? null : layout.id)}
              className="py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all"
              style={{
                background: activeSplitLayout === layout.id ? "rgba(6,182,212,0.1)" : "#111",
                border: activeSplitLayout === layout.id ? "1px solid rgba(6,182,212,0.22)" : "1px solid #1a1a1a",
              }}>
              {/* Mini layout preview */}
              <div className="w-8 h-6 relative rounded overflow-hidden" style={{ background: "#222" }}>
                {layout.regions.map((r, i) => (
                  <div key={i} className="absolute" style={{
                    left: `${r.x * 100}%`, top: `${r.y * 100}%`,
                    width: `${r.w * 100}%`, height: `${r.h * 100}%`,
                    background: `hsl(${190 + i * 30}, 70%, ${40 + i * 10}%)`,
                    border: "0.5px solid #000",
                  }} />
                ))}
              </div>
              <span className="text-[7px] font-bold" style={{ color: activeSplitLayout === layout.id ? "#06B6D4" : "#666" }}>
                {layout.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
