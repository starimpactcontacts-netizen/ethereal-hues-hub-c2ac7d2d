/**
 * KeyframeEditor — Per-property keyframe animation for mobile
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Diamond, Plus, Trash2, ChevronDown, ChevronRight,
  Move, Maximize, RotateCw, Blend, X
} from "lucide-react";

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";
const KEYFRAME_COLOR = "#FFAA00";

export type Keyframe = {
  id: string;
  time: number;
  value: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";
};

export type KeyframedProperty = {
  id: string;
  label: string;
  icon: typeof Move;
  color: string;
  keyframes: Keyframe[];
  min: number;
  max: number;
  unit: string;
  currentValue: number;
};

interface KeyframeEditorProps {
  properties: KeyframedProperty[];
  currentTime: number;
  duration: number;
  onAddKeyframe: (propertyId: string, time: number, value: number) => void;
  onRemoveKeyframe: (propertyId: string, keyframeId: string) => void;
  onClose: () => void;
}

const EASING_OPTIONS: { id: Keyframe["easing"]; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "ease-in", label: "Ease In" },
  { id: "ease-out", label: "Ease Out" },
  { id: "ease-in-out", label: "Ease I/O" },
  { id: "spring", label: "Spring" },
];

export function interpolateKeyframes(keyframes: Keyframe[], time: number, defaultValue: number): number {
  if (keyframes.length === 0) return defaultValue;
  if (keyframes.length === 1) return keyframes[0].value;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const t = (time - sorted[i].time) / (sorted[i + 1].time - sorted[i].time);
      const eased = applyEasing(t, sorted[i + 1].easing);
      return sorted[i].value + (sorted[i + 1].value - sorted[i].value) * eased;
    }
  }
  return defaultValue;
}

function applyEasing(t: number, easing: Keyframe["easing"]): number {
  switch (easing) {
    case "ease-in": return t * t;
    case "ease-out": return 1 - (1 - t) * (1 - t);
    case "ease-in-out": return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "spring": return 1 - Math.cos(t * Math.PI * 2.5) * Math.exp(-t * 4);
    default: return t;
  }
}

export default function KeyframeEditor({
  properties,
  currentTime,
  duration,
  onAddKeyframe,
  onRemoveKeyframe,
  onClose,
}: KeyframeEditorProps) {
  const [expandedProp, setExpandedProp] = useState<string | null>(properties[0]?.id || null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Diamond className="w-4 h-4" style={{ color: KEYFRAME_COLOR }} />
          <span className="text-[11px] font-bold text-white">Keyframes</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      <p className="text-[9px]" style={{ color: "#555" }}>
        Add keyframes to animate properties over time. Tap ◆ to add a keyframe at the current position.
      </p>

      {/* Properties */}
      <div className="space-y-1.5">
        {properties.map((prop) => {
          const isExpanded = expandedProp === prop.id;
          const hasKeyframes = prop.keyframes.length > 0;
          const Icon = prop.icon;

          return (
            <div key={prop.id} className="rounded-xl overflow-hidden" style={{ background: "#0d0d0d", border: `1px solid ${hasKeyframes ? prop.color + "30" : "#1a1a1a"}` }}>
              {/* Header */}
              <button
                onClick={() => setExpandedProp(isExpanded ? null : prop.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" style={{ color: "#555" }} /> : <ChevronRight className="w-3 h-3" style={{ color: "#555" }} />}
                <Icon className="w-3 h-3" style={{ color: prop.color }} />
                <span className="text-[10px] font-bold flex-1 text-left" style={{ color: hasKeyframes ? "#fff" : "#888" }}>{prop.label}</span>
                <span className="text-[9px] font-mono" style={{ color: "#555" }}>{prop.currentValue.toFixed(1)}{prop.unit}</span>
                {hasKeyframes && (
                  <span className="text-[7px] px-1.5 rounded-full font-bold" style={{ background: `${KEYFRAME_COLOR}20`, color: KEYFRAME_COLOR }}>
                    {prop.keyframes.length}◆
                  </span>
                )}
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {/* Mini timeline with keyframes */}
                      <div className="relative h-8 rounded-lg overflow-hidden" style={{ background: "#080808", border: "1px solid #1a1a1a" }}>
                        {/* Keyframe dots */}
                        {prop.keyframes.map((kf) => (
                          <button key={kf.id}
                            onClick={() => onRemoveKeyframe(prop.id, kf.id)}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 z-10 transition-transform active:scale-150"
                            style={{ left: `${(kf.time / duration) * 100}%` }}
                          >
                            <Diamond className="w-3 h-3" style={{ color: KEYFRAME_COLOR, fill: KEYFRAME_COLOR }} />
                          </button>
                        ))}

                        {/* Playhead */}
                        <div className="absolute top-0 bottom-0 w-px z-20" style={{ left: `${(currentTime / duration) * 100}%`, background: "white" }} />

                        {/* Interpolation preview line */}
                        {prop.keyframes.length >= 2 && (
                          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                            <polyline
                              fill="none"
                              stroke={prop.color}
                              strokeWidth="1.5"
                              opacity="0.4"
                              points={
                                Array.from({ length: 50 }).map((_, i) => {
                                  const t = (i / 49) * duration;
                                  const v = interpolateKeyframes(prop.keyframes, t, prop.currentValue);
                                  const x = (t / duration) * 100;
                                  const y = 100 - ((v - prop.min) / (prop.max - prop.min)) * 100;
                                  return `${x},${y}`;
                                }).join(" ")
                              }
                            />
                          </svg>
                        )}
                      </div>

                      {/* Add keyframe button */}
                      <button
                        onClick={() => onAddKeyframe(prop.id, currentTime, prop.currentValue)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold transition-all active:scale-97"
                        style={{ background: `${KEYFRAME_COLOR}15`, border: `1px solid ${KEYFRAME_COLOR}30`, color: KEYFRAME_COLOR }}
                      >
                        <Diamond className="w-3 h-3" /> Add Keyframe at {currentTime.toFixed(1)}s
                      </button>

                      {/* Keyframe list */}
                      {prop.keyframes.length > 0 && (
                        <div className="space-y-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                          {[...prop.keyframes].sort((a, b) => a.time - b.time).map((kf) => (
                            <div key={kf.id} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: "#111" }}>
                              <Diamond className="w-2 h-2 flex-shrink-0" style={{ color: KEYFRAME_COLOR, fill: KEYFRAME_COLOR }} />
                              <span className="text-[8px] font-mono" style={{ color: "#888" }}>{kf.time.toFixed(1)}s</span>
                              <span className="text-[8px] font-mono font-bold" style={{ color: prop.color }}>{kf.value.toFixed(1)}{prop.unit}</span>
                              <span className="text-[7px] px-1 rounded" style={{ background: "#1a1a1a", color: "#555" }}>{kf.easing}</span>
                              <button onClick={() => onRemoveKeyframe(prop.id, kf.id)} className="ml-auto p-0.5">
                                <X className="w-2.5 h-2.5" style={{ color: "#555" }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
