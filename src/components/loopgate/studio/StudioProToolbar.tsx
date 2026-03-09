/**
 * StudioProToolbar — CapCut/Filmora-tier mobile toolbar
 * Bigger touch targets, grouped tools, premium active states
 */
import {
  Scissors, Crop, Gauge, Wand2, SlidersHorizontal, Activity, Blend,
  Type, LayoutGrid, Circle, Layers, Sparkles, Diamond, Music,
  AudioLines, ArrowUpCircle, Settings, Film, Smile, Palette, Brain
} from "lucide-react";
import { motion } from "framer-motion";

const ACCENT = "#9999FF";

export type EditorTool = "trim" | "filters" | "text" | "audio" | "speed" | "effects" | "transitions" | "adjust" | "export" | "upscale" | "crop" | "keyframes" | "blend" | "scopes" | "masks" | "audiofx" | "motion" | "compositor" | "stabilize" | "stickers" | "chroma";

type ToolDef = {
  id: EditorTool;
  icon: typeof Scissors;
  label: string;
  group: string;
};

const TOOL_GROUPS: (ToolDef | { id: string; group: "sep" })[] = [
  { id: "trim", icon: Scissors, label: "Trim", group: "edit" },
  { id: "crop", icon: Crop, label: "Transform", group: "edit" },
  { id: "speed", icon: Gauge, label: "Speed", group: "edit" },
  { id: "sep1", group: "sep" },
  { id: "filters", icon: Wand2, label: "Filters", group: "color" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust", group: "color" },
  { id: "scopes", icon: Activity, label: "Scopes", group: "color" },
  { id: "blend", icon: Blend, label: "Blend", group: "color" },
  { id: "sep2", group: "sep" },
  { id: "text", icon: Type, label: "Text", group: "compose" },
  { id: "motion", icon: LayoutGrid, label: "GFX", group: "compose" },
  { id: "masks", icon: Circle, label: "Mask", group: "compose" },
  { id: "compositor", icon: Layers, label: "PiP", group: "compose" },
  { id: "stickers", icon: Smile, label: "Stickers", group: "compose" },
  { id: "sep3", group: "sep" },
  { id: "effects", icon: Sparkles, label: "Effects", group: "animate" },
  { id: "transitions", icon: Film, label: "Trans", group: "animate" },
  { id: "keyframes", icon: Diamond, label: "Keys", group: "animate" },
  { id: "sep4", group: "sep" },
  { id: "audio", icon: Music, label: "Audio", group: "audio" },
  { id: "audiofx", icon: AudioLines, label: "Mix", group: "audio" },
  { id: "chroma", icon: Palette, label: "Chroma", group: "output" },
  { id: "sep5", group: "sep" },
  { id: "stabilize", icon: Activity, label: "Stabilize", group: "output" },
  { id: "upscale", icon: ArrowUpCircle, label: "4K", group: "output" },
  { id: "export", icon: Settings, label: "Export", group: "output" },
];

interface StudioProToolbarProps {
  activeTool: EditorTool | null;
  onToolChange: (tool: EditorTool | null) => void;
  onAIOpen: () => void;
  onAIBrainOpen?: () => void;
}

export default function StudioProToolbar({ activeTool, onToolChange, onAIOpen }: StudioProToolbarProps) {
  return (
    <div className="flex-shrink-0" style={{
      background: "linear-gradient(180deg, #111114 0%, #09090c 100%)",
      borderTop: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div className="flex items-center py-1.5 px-1 overflow-x-auto gap-0.5" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {/* AI Button — premium treatment */}
        <button
          onClick={onAIOpen}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90 relative overflow-hidden"
          style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg, rgba(255,0,79,0.12), rgba(255,60,120,0.04))",
            border: "1px solid rgba(255,0,79,0.18)",
            boxShadow: "0 0 20px rgba(255,0,79,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Animated pulse ring */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl"
            style={{ border: "1px solid rgba(255,0,79,0.2)" }}
          />
          <Wand2 className="w-5 h-5" style={{ color: "#FF004F" }} />
          <span className="text-[7px] font-black tracking-[0.15em] uppercase" style={{ color: "#FF004F" }}>AI</span>
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#FF004F", boxShadow: "0 0 6px #FF004F" }} />
        </button>

        {/* Separator */}
        <div className="w-px h-8 mx-0.5 flex-shrink-0 rounded-full" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        {/* Tool buttons */}
        {TOOL_GROUPS.map((item) => {
          if (item.group === "sep") {
            return (
              <div key={item.id} className="w-px h-7 mx-0.5 flex-shrink-0 rounded-full"
                style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent)" }} />
            );
          }

          const tool = item as ToolDef;
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(activeTool === tool.id ? null : tool.id)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150 active:scale-90 relative"
              style={{
                width: 52, height: 52,
                color: isActive ? "#fff" : "#555",
                background: isActive
                  ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT}08)`
                  : "transparent",
                border: isActive ? `1px solid ${ACCENT}25` : "1px solid transparent",
              }}
            >
              <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? ACCENT : "#666" }} />
              <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: isActive ? ACCENT : "#555" }}>
                {tool.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="toolbar-indicator"
                  className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                  style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}60` }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="safe-bottom" />
    </div>
  );
}
