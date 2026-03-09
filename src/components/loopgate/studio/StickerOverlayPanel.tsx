/**
 * StickerOverlayPanel — Emoji/Shape/Decorative sticker system
 * NodeVideo-level overlay stickers that render to canvas
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Sparkles, Star, Heart, Zap, Crown, Flame, Skull, Ghost } from "lucide-react";

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

export type StickerOverlay = {
  id: string;
  type: "emoji" | "shape" | "badge";
  content: string;
  x: number; // 0-1
  y: number; // 0-1
  scale: number; // 0.5-3
  rotation: number; // degrees
  opacity: number;
  startTime: number;
  endTime: number;
};

const EMOJI_CATEGORIES = [
  {
    label: "Fire",
    emojis: ["🔥", "💥", "⚡", "✨", "💫", "🌟", "⭐", "🎆", "🎇", "🪩"],
  },
  {
    label: "Reactions",
    emojis: ["😂", "💀", "🤯", "😎", "🥶", "🤮", "😈", "👁️", "🗿", "🤡"],
  },
  {
    label: "Vibes",
    emojis: ["🎵", "🎶", "🎤", "🎧", "🎸", "🥁", "🎹", "🎻", "🎺", "🪘"],
  },
  {
    label: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❤️‍🔥"],
  },
  {
    label: "Hands",
    emojis: ["👍", "👎", "👏", "🤝", "✌️", "🤙", "🤘", "💪", "👊", "🙏"],
  },
  {
    label: "Symbols",
    emojis: ["❌", "✅", "⚠️", "🚫", "💯", "🏆", "👑", "💎", "🎯", "🔔"],
  },
  {
    label: "Arrows",
    emojis: ["⬆️", "⬇️", "➡️", "⬅️", "↗️", "↘️", "🔄", "↩️", "⏩", "⏪"],
  },
  {
    label: "Weather",
    emojis: ["☀️", "🌙", "⛈️", "🌊", "❄️", "🌈", "🌪️", "💨", "☁️", "🌸"],
  },
];

const SHAPE_STICKERS = [
  { id: "circle_outline", label: "Circle", draw: "○" },
  { id: "square_outline", label: "Square", draw: "□" },
  { id: "triangle", label: "Triangle", draw: "△" },
  { id: "diamond", label: "Diamond", draw: "◇" },
  { id: "star_5", label: "Star", draw: "☆" },
  { id: "hexagon", label: "Hex", draw: "⬡" },
  { id: "arrow_right", label: "Arrow", draw: "➤" },
  { id: "cross", label: "Cross", draw: "✦" },
];

interface StickerOverlayPanelProps {
  stickers: StickerOverlay[];
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  onAddSticker: (sticker: Omit<StickerOverlay, "id">) => void;
  onUpdateSticker: (id: string, updates: Partial<StickerOverlay>) => void;
  onDeleteSticker: (id: string) => void;
  onClose: () => void;
}

export default function StickerOverlayPanel({
  stickers, currentTime, trimStart, trimEnd,
  onAddSticker, onUpdateSticker, onDeleteSticker, onClose,
}: StickerOverlayPanelProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [tab, setTab] = useState<"emoji" | "shapes" | "active">("emoji");
  const [searchQuery, setSearchQuery] = useState("");

  const addEmoji = (emoji: string) => {
    onAddSticker({
      type: "emoji",
      content: emoji,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      startTime: trimStart,
      endTime: trimEnd,
    });
  };

  const addShape = (shape: string) => {
    onAddSticker({
      type: "shape",
      content: shape,
      x: 0.5,
      y: 0.3,
      scale: 1.5,
      rotation: 0,
      opacity: 0.8,
      startTime: trimStart,
      endTime: trimEnd,
    });
  };

  const filteredEmojis = searchQuery
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(searchQuery))
    : EMOJI_CATEGORIES[activeCategory]?.emojis || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#FF6B00" }} />
          <span className="text-[11px] font-bold text-white">Stickers</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: "#555" }}>Done</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(["emoji", "shapes", "active"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 text-[9px] font-bold rounded-lg capitalize transition-all"
            style={{
              background: tab === t ? ACCENT_DIM : "#111",
              color: tab === t ? ACCENT : "#555",
              border: `1px solid ${tab === t ? ACCENT_BORDER : "#1a1a1a"}`,
            }}>
            {t === "active" ? `Active (${stickers.length})` : t}
          </button>
        ))}
      </div>

      {tab === "emoji" && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "#444" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search emoji..."
              className="w-full pl-7 pr-3 py-2 rounded-lg text-[11px] focus:outline-none"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#ccc" }}
            />
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button key={cat.label} onClick={() => setActiveCategory(i)}
                  className="px-2 py-1 text-[8px] font-semibold rounded flex-shrink-0 transition-all"
                  style={{
                    background: activeCategory === i ? ACCENT_DIM : "transparent",
                    color: activeCategory === i ? ACCENT : "#555",
                    border: activeCategory === i ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                  }}>
                  {cat.emojis[0]} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {filteredEmojis.map((emoji, i) => (
              <motion.button
                key={`${emoji}-${i}`}
                whileTap={{ scale: 0.85 }}
                onClick={() => addEmoji(emoji)}
                className="h-12 rounded-xl flex items-center justify-center text-2xl transition-all active:bg-white/5"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </>
      )}

      {tab === "shapes" && (
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPE_STICKERS.map(shape => (
            <motion.button
              key={shape.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => addShape(shape.draw)}
              className="py-4 rounded-xl flex flex-col items-center gap-1.5 transition-all"
              style={{ background: "#111", border: "1px solid #1a1a1a" }}
            >
              <span className="text-xl" style={{ color: "#888" }}>{shape.draw}</span>
              <span className="text-[7px] font-bold" style={{ color: "#444" }}>{shape.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {tab === "active" && (
        <div className="space-y-1.5">
          {stickers.length === 0 ? (
            <p className="text-center py-6 text-[10px]" style={{ color: "#444" }}>No stickers added yet</p>
          ) : (
            stickers.map(sticker => (
              <div key={sticker.id} className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <span className="text-lg">{sticker.content}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <input type="range" min={0.3} max={3} step={0.1} value={sticker.scale}
                      onChange={e => onUpdateSticker(sticker.id, { scale: Number(e.target.value) })}
                      className="flex-1 h-1 accent-[#9999FF]" />
                    <span className="text-[8px] font-mono w-6 text-right" style={{ color: "#555" }}>
                      {sticker.scale.toFixed(1)}x
                    </span>
                  </div>
                </div>
                <button onClick={() => onDeleteSticker(sticker.id)}>
                  <X className="w-3 h-3" style={{ color: "#555" }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Render stickers to canvas
 */
export function renderStickersToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stickers: StickerOverlay[],
  currentTime: number,
) {
  stickers.forEach(sticker => {
    if (currentTime < sticker.startTime || currentTime > sticker.endTime) return;
    
    ctx.save();
    ctx.globalAlpha = sticker.opacity;
    
    const px = sticker.x * canvas.width;
    const py = sticker.y * canvas.height;
    ctx.translate(px, py);
    ctx.rotate(sticker.rotation * Math.PI / 180);
    
    const fontSize = Math.round(48 * sticker.scale * (canvas.width / 1080));
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sticker.content, 0, 0);
    
    ctx.restore();
  });
}
