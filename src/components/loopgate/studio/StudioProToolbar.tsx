/**
 * StudioProToolbar — Alight Motion-style bottom toolbar
 * Category tabs with sub-panels for shapes, media, audio, elements, etc.
 */
import {
  Scissors, Crop, Gauge, SlidersHorizontal,
  Type, Layers, Sparkles, Diamond, Music,
  AudioLines, ArrowUpCircle, Settings, Film,
  Palette, Droplets, Square, Blend,
  Move, Star, Pen, Image as ImageIcon,
  Circle, Triangle, Plus, Minus, ArrowRight,
  Hexagon, Heart, Zap, Grid3x3,
  Eye, EyeOff, Lock, Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ─── Types ───
export type EditorTool =
  | "trim" | "filters" | "text" | "audio" | "speed" | "effects"
  | "transitions" | "adjust" | "export" | "upscale" | "crop"
  | "keyframes" | "blend" | "scopes" | "masks" | "audiofx"
  | "motion" | "compositor" | "stabilize" | "stickers" | "chroma"
  // Alight Motion categories
  | "shape" | "media" | "object" | "template" | "drawing";

type BottomTab = "shape" | "media" | "audio" | "object" | "template" | "drawing";

type ToolDef = {
  id: EditorTool;
  icon: typeof Scissors;
  label: string;
};

// ─── Tab Definitions ───
const BOTTOM_TABS: { id: BottomTab; icon: typeof Scissors; label: string }[] = [
  { id: "shape", icon: Hexagon, label: "Shape" },
  { id: "media", icon: ImageIcon, label: "Media" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "object", icon: Layers, label: "Object" },
  { id: "template", icon: Grid3x3, label: "Template" },
  { id: "drawing", icon: Pen, label: "Drawing" },
];

// ─── Shape Grid Items ───
const SHAPES = [
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "square", icon: Square, label: "Square" },
  { id: "plus", icon: Plus, label: "Plus" },
  { id: "crescent", icon: Minus, label: "Arc" },
  { id: "triangle", icon: Triangle, label: "Triangle" },
  { id: "star", icon: Star, label: "Star" },
  { id: "hexagon", icon: Hexagon, label: "Hexagon" },
  { id: "diamond", icon: Diamond, label: "Diamond" },
  { id: "heart", icon: Heart, label: "Heart" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "zap", icon: Zap, label: "Bolt" },
  { id: "blend", icon: Blend, label: "Blend" },
];

// ─── Layer Property Tools (shown when a layer is selected) ───
const LAYER_TOOLS: ToolDef[] = [
  { id: "adjust", icon: Droplets, label: "Color & Fill" },
  { id: "blend", icon: Square, label: "Border" },
  { id: "compositor", icon: Blend, label: "Blending" },
  { id: "crop", icon: Move, label: "Transform" },
  { id: "keyframes", icon: Diamond, label: "Keyframes" },
  { id: "effects", icon: Sparkles, label: "Effects" },
];

// ─── Editing Tools (context toolbar) ───
const EDIT_TOOLS: ToolDef[] = [
  { id: "trim", icon: Scissors, label: "Trim" },
  { id: "crop", icon: Crop, label: "Transform" },
  { id: "speed", icon: Gauge, label: "Speed" },
  { id: "filters", icon: Palette, label: "Filters" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  { id: "text", icon: Type, label: "Text" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "transitions", icon: Film, label: "Trans" },
  { id: "keyframes", icon: Diamond, label: "Keys" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "audiofx", icon: AudioLines, label: "Mix" },
  { id: "export", icon: Settings, label: "Export" },
];

interface StudioProToolbarProps {
  activeTool: EditorTool | null;
  onToolChange: (tool: EditorTool | null) => void;
  onAIOpen: () => void;
  onAIBrainOpen?: () => void;
  hasSelectedLayer?: boolean;
  mode?: "add" | "edit";
}

export default function StudioProToolbar({
  activeTool,
  onToolChange,
  onAIOpen,
  onAIBrainOpen,
  hasSelectedLayer = false,
  mode = "edit",
}: StudioProToolbarProps) {
  const [activeTab, setActiveTab] = useState<BottomTab | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // When in edit mode with a selected layer, show layer tools + editing tools
  // When adding, show Alight Motion-style category tabs

  return (
    <div className="flex-shrink-0" style={{
      background: "#0a0a0f",
      borderTop: "1px solid rgba(255,255,255,0.04)",
    }}>
      {/* ─── Add Panel (Alight Motion style) ─── */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Category Tabs */}
              <div className="flex items-center px-2 pt-2 gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {BOTTOM_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(isActive ? null : tab.id)}
                      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all flex-shrink-0"
                      style={{
                        color: isActive ? "#00E5A0" : "#666",
                        background: isActive ? "rgba(0,229,160,0.08)" : "transparent",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[8px] font-bold tracking-wider uppercase">{tab.label}</span>
                    </button>
                  );
                })}

                {/* Vector Drawing button */}
                <div className="ml-auto flex flex-col items-center gap-1 px-2 flex-shrink-0">
                  <button className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Pen className="w-4 h-4" style={{ color: "#888" }} />
                  </button>
                  <span className="text-[7px]" style={{ color: "#555" }}>Vector</span>
                </div>

                {/* Text button */}
                <div className="flex flex-col items-center gap-1 px-2 flex-shrink-0">
                  <button
                    onClick={() => { onToolChange("text"); setShowAddPanel(false); }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <Type className="w-4 h-4" style={{ color: "#888" }} />
                  </button>
                  <span className="text-[7px]" style={{ color: "#555" }}>Text</span>
                </div>

                {/* Close */}
                <div className="flex flex-col items-center gap-1 px-1 flex-shrink-0">
                  <button
                    onClick={() => setShowAddPanel(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ color: "#666" }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sub-panel Content */}
              <AnimatePresence mode="wait">
                {activeTab === "shape" && (
                  <motion.div
                    key="shapes"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-6 gap-2 p-3"
                  >
                    {SHAPES.map((shape) => {
                      const Icon = shape.icon;
                      return (
                        <button
                          key={shape.id}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all active:scale-90"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <Icon className="w-7 h-7" style={{ color: "#ccc" }} />
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === "media" && (
                  <motion.div
                    key="media"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4"
                  >
                    <button
                      onClick={() => { onToolChange("media" as EditorTool); setShowAddPanel(false); }}
                      className="w-full py-4 rounded-xl flex flex-col items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)" }}
                    >
                      <ImageIcon className="w-6 h-6" style={{ color: "#888" }} />
                      <span className="text-xs" style={{ color: "#888" }}>Import from Gallery</span>
                    </button>
                  </motion.div>
                )}

                {activeTab === "audio" && (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4"
                  >
                    <button
                      onClick={() => { onToolChange("audio"); setShowAddPanel(false); }}
                      className="w-full py-4 rounded-xl flex flex-col items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)" }}
                    >
                      <Music className="w-6 h-6" style={{ color: "#888" }} />
                      <span className="text-xs" style={{ color: "#888" }}>Import Audio</span>
                    </button>
                  </motion.div>
                )}

                {(activeTab === "object" || activeTab === "template") && (
                  <motion.div
                    key="objects"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 text-center"
                  >
                    <p className="text-[11px]" style={{ color: "#555" }}>
                      {activeTab === "object" ? "Objects & Elements coming soon" : "Templates coming soon"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Toolbar ─── */}
      <div className="flex items-center py-1.5 px-1 overflow-x-auto gap-0.5" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>

        {/* Add (+) Button — opens Alight Motion panel */}
        <button
          onClick={() => { setShowAddPanel(!showAddPanel); if (!activeTab) setActiveTab("shape"); }}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90 relative"
          style={{
            width: 56, height: 56,
            background: showAddPanel ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showAddPanel ? "rgba(0,229,160,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <Plus className="w-6 h-6" style={{ color: showAddPanel ? "#00E5A0" : "#888" }} />
          <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: showAddPanel ? "#00E5A0" : "#555" }}>Add</span>
        </button>

        {/* Separator */}
        <div className="w-px h-8 mx-0.5 flex-shrink-0 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Layer property tools (when layer selected) or edit tools */}
        {(hasSelectedLayer ? LAYER_TOOLS : EDIT_TOOLS).map((tool) => {
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
                background: isActive ? "rgba(0,229,160,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(0,229,160,0.2)" : "1px solid transparent",
              }}
            >
              <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? "#00E5A0" : "#666" }} />
              <span className="text-[7px] font-bold tracking-wider uppercase" style={{ color: isActive ? "#00E5A0" : "#555" }}>
                {tool.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="toolbar-indicator"
                  className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                  style={{ background: "#00E5A0", boxShadow: "0 0 8px rgba(0,229,160,0.6)" }}
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
