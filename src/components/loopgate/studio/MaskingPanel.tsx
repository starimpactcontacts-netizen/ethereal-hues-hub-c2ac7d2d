/**
 * MaskingPanel — Shape masks, feathering, invert for selective effects
 */
import { useState } from "react";
import { Circle, Square, Triangle, Hexagon, X, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

const ACCENT = "#9999FF";

export type MaskShape = "circle" | "rectangle" | "ellipse" | "gradient";

export type Mask = {
  id: string;
  shape: MaskShape;
  x: number; y: number; // center, 0-1
  width: number; height: number; // 0-1
  rotation: number;
  feather: number; // 0-100
  inverted: boolean;
  visible: boolean;
  opacity: number;
};

export const DEFAULT_MASK: Omit<Mask, "id"> = {
  shape: "ellipse",
  x: 0.5, y: 0.5,
  width: 0.5, height: 0.5,
  rotation: 0,
  feather: 20,
  inverted: false,
  visible: true,
  opacity: 1,
};

interface MaskingPanelProps {
  masks: Mask[];
  selectedMaskId: string | null;
  onAddMask: (shape: MaskShape) => void;
  onUpdateMask: (id: string, updates: Partial<Mask>) => void;
  onDeleteMask: (id: string) => void;
  onSelectMask: (id: string | null) => void;
  onClose: () => void;
}

const SHAPES: { id: MaskShape; label: string; icon: typeof Circle }[] = [
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "rectangle", label: "Rect", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "gradient", label: "Gradient", icon: Triangle },
];

export function renderMaskToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  masks: Mask[]
): void {
  if (masks.length === 0) return;
  const activeMasks = masks.filter(m => m.visible);
  if (activeMasks.length === 0) return;

  // Create a composite mask
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const mCtx = maskCanvas.getContext("2d")!;

  // Start with all white (visible)
  mCtx.fillStyle = "white";
  mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  for (const mask of activeMasks) {
    mCtx.save();
    mCtx.globalCompositeOperation = mask.inverted ? "destination-out" : "destination-in";

    const cx = mask.x * maskCanvas.width;
    const cy = mask.y * maskCanvas.height;
    const w = mask.width * maskCanvas.width;
    const h = mask.height * maskCanvas.height;

    mCtx.translate(cx, cy);
    mCtx.rotate((mask.rotation * Math.PI) / 180);

    if (mask.feather > 0) {
      const featherPx = (mask.feather / 100) * Math.max(w, h) * 0.5;
      let grad: CanvasGradient;

      if (mask.shape === "gradient") {
        grad = mCtx.createLinearGradient(-w / 2, 0, w / 2, 0);
      } else {
        grad = mCtx.createRadialGradient(0, 0, Math.max(0, Math.min(w, h) / 2 - featherPx), 0, 0, Math.max(w, h) / 2);
      }
      grad.addColorStop(0, `rgba(255,255,255,${mask.opacity})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      mCtx.fillStyle = grad;
    } else {
      mCtx.fillStyle = `rgba(255,255,255,${mask.opacity})`;
    }

    if (mask.shape === "ellipse" || mask.shape === "circle") {
      mCtx.beginPath();
      mCtx.ellipse(0, 0, w / 2, mask.shape === "circle" ? w / 2 : h / 2, 0, 0, Math.PI * 2);
      mCtx.fill();
    } else if (mask.shape === "rectangle") {
      mCtx.fillRect(-w / 2, -h / 2, w, h);
    } else if (mask.shape === "gradient") {
      mCtx.fillRect(-w / 2, -h / 2, w, h);
    }

    mCtx.restore();
  }

  // Apply mask
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();
}

export default function MaskingPanel({
  masks, selectedMaskId, onAddMask, onUpdateMask, onDeleteMask, onSelectMask, onClose,
}: MaskingPanelProps) {
  const selected = masks.find(m => m.id === selectedMaskId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4" style={{ color: "#F97316" }} />
          <span className="text-[11px] font-bold text-white">Masking</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      <p className="text-[9px]" style={{ color: "#555" }}>
        Add masks to apply effects to specific regions. Tap a shape to add.
      </p>

      {/* Add shape buttons */}
      <div className="flex gap-1.5">
        {SHAPES.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onAddMask(id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[8px] font-bold transition-all active:scale-95"
            style={{ background: "#111", border: "1px solid #1a1a1a", color: "#888" }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Mask list */}
      {masks.length > 0 && (
        <div className="space-y-1">
          {masks.map((mask) => (
            <div key={mask.id}
              onClick={() => onSelectMask(mask.id === selectedMaskId ? null : mask.id)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
              style={{
                background: mask.id === selectedMaskId ? "rgba(249,115,22,0.1)" : "#111",
                border: mask.id === selectedMaskId ? "1px solid rgba(249,115,22,0.3)" : "1px solid #1a1a1a",
              }}>
              <Circle className="w-3 h-3 flex-shrink-0" style={{ color: mask.id === selectedMaskId ? "#F97316" : "#555" }} />
              <span className="text-[9px] font-bold flex-1" style={{ color: mask.id === selectedMaskId ? "#fff" : "#888" }}>
                {mask.shape} mask
              </span>
              <button onClick={(e) => { e.stopPropagation(); onUpdateMask(mask.id, { visible: !mask.visible }); }} className="p-0.5">
                {mask.visible ? <Eye className="w-3 h-3" style={{ color: "#555" }} /> : <EyeOff className="w-3 h-3" style={{ color: "#333" }} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteMask(mask.id); }} className="p-0.5">
                <Trash2 className="w-3 h-3" style={{ color: "#555" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected mask controls */}
      {selected && (
        <div className="space-y-2 p-2.5 rounded-xl" style={{ background: "#0d0d0d", border: "1px solid rgba(249,115,22,0.15)" }}>
          {[
            { label: "Feather", key: "feather" as const, min: 0, max: 100, val: selected.feather, unit: "%" },
            { label: "Size X", key: "width" as const, min: 5, max: 100, val: Math.round(selected.width * 100), unit: "%" },
            { label: "Size Y", key: "height" as const, min: 5, max: 100, val: Math.round(selected.height * 100), unit: "%" },
            { label: "Rotation", key: "rotation" as const, min: -180, max: 180, val: selected.rotation, unit: "°" },
          ].map(({ label, key, min, max, val, unit }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px]" style={{ color: "#555" }}>{label}</span>
                <span className="text-[8px] font-mono" style={{ color: "#F97316" }}>{val}{unit}</span>
              </div>
              <input type="range" min={min} max={max} value={val}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (key === "width" || key === "height") onUpdateMask(selected.id, { [key]: v / 100 });
                  else onUpdateMask(selected.id, { [key]: v });
                }}
                className="w-full accent-[#F97316]" />
            </div>
          ))}

          <button onClick={() => onUpdateMask(selected.id, { inverted: !selected.inverted })}
            className="w-full py-1.5 rounded-lg text-[9px] font-bold"
            style={{
              background: selected.inverted ? "rgba(249,115,22,0.15)" : "#111",
              color: selected.inverted ? "#F97316" : "#666",
              border: `1px solid ${selected.inverted ? "rgba(249,115,22,0.3)" : "#1a1a1a"}`,
            }}>
            {selected.inverted ? "✓ Inverted" : "Invert Mask"}
          </button>
        </div>
      )}
    </div>
  );
}
