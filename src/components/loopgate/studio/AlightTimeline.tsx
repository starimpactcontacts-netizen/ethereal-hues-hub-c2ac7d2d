/**
 * AlightTimeline — Alight Motion-style multi-layer timeline
 * Colored layer bars, visibility toggles, thumbnails, playhead, keyframe diamonds
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Plus, ChevronLeft, ChevronRight,
  Play, Pause, SkipBack, SkipForward, Scissors,
  Lock, Unlock, GripVertical, Diamond, Music,
  Type, Sparkles, Layers, Image as ImageIcon,
  Square, Circle
} from "lucide-react";

// ─── Types ───
export type TimelineLayer = {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "shape" | "effect" | "image";
  color: string;
  visible: boolean;
  locked: boolean;
  thumbnail?: string;
  startTime: number;
  endTime: number;
  keyframes?: { id: string; time: number }[];
};

interface AlightTimelineProps {
  layers: TimelineLayer[];
  duration: number;
  currentTime: number;
  playing: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onSelectLayer: (layerId: string | null) => void;
  onReorderLayers: (fromIndex: number, toIndex: number) => void;
  onAddLayer: () => void;
  selectedLayerId: string | null;
  thumbnails?: string[];
}

// Layer type colors (Alight Motion style — pastel/bright)
const LAYER_COLORS: Record<string, string> = {
  video: "#4ECDC4",
  audio: "#FF6B6B",
  text: "#FFE66D",
  shape: "#95E1D3",
  effect: "#F38181",
  image: "#AA96DA",
};

const LAYER_ICONS: Record<string, typeof Layers> = {
  video: ImageIcon,
  audio: Music,
  text: Type,
  shape: Square,
  effect: Sparkles,
  image: ImageIcon,
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30); // frames at 30fps
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

export default function AlightTimeline({
  layers,
  duration,
  currentTime,
  playing,
  onSeek,
  onTogglePlay,
  onToggleVisibility,
  onToggleLock,
  onSelectLayer,
  onReorderLayers,
  onAddLayer,
  selectedLayerId,
  thumbnails,
}: AlightTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pixelsPerSecond = 60 * zoom;
  const totalWidth = Math.max(duration * pixelsPerSecond, 300);

  // ─── Seek via timeline tap ───
  const handleTimelineClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left + timelineRef.current.scrollLeft;
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    onSeek(time);
  }, [duration, pixelsPerSecond, onSeek]);

  // ─── Playhead drag ───
  const startPlayheadDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const x = clientX - rect.left + timelineRef.current.scrollLeft;
      const time = Math.max(0, Math.min(duration, x / pixelsPerSecond));
      onSeek(time);
    };
    
    const handleEnd = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
    
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
  }, [duration, pixelsPerSecond, onSeek]);

  // Auto-scroll playhead into view
  useEffect(() => {
    if (!timelineRef.current || isDragging) return;
    const playheadX = currentTime * pixelsPerSecond;
    const el = timelineRef.current;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    if (playheadX < viewLeft + 40 || playheadX > viewRight - 40) {
      el.scrollLeft = playheadX - el.clientWidth / 2;
    }
  }, [currentTime, pixelsPerSecond, isDragging]);

  const playheadLeft = currentTime * pixelsPerSecond;

  return (
    <div className="flex flex-col" style={{ background: "#0c0c12" }}>
      {/* ─── Transport Controls ─── */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-1">
          <button onClick={() => onSeek(0)} className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={() => onSeek(Math.max(0, currentTime - 1/30))} className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={() => onSeek(Math.min(duration, currentTime + 1/30))} className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => onSeek(duration)} className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode */}
        <div className="font-mono text-[13px] font-bold tracking-wider px-3 py-1 rounded-lg" style={{ color: "#FF4444", background: "rgba(255,68,68,0.06)" }}>
          {formatTime(currentTime)}
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <Scissors className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg active:scale-90 transition-transform" style={{ color: "#888" }}>
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Time Ruler ─── */}
      <div
        ref={timelineRef}
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
      >
        {/* Ruler */}
        <div className="h-5 relative" style={{ width: totalWidth, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {duration > 0 && Array.from({ length: Math.ceil(duration * 2) + 1 }).map((_, i) => {
            const time = i / 2;
            const isWhole = time === Math.floor(time);
            return (
              <div
                key={i}
                className="absolute bottom-0"
                style={{ left: time * pixelsPerSecond }}
              >
                <div className="w-px" style={{ height: isWhole ? 8 : 4, background: isWhole ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)" }} />
                {isWhole && (
                  <span className="absolute -top-0.5 left-1 text-[7px] font-mono" style={{ color: "#555" }}>
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Layer Tracks ─── */}
        <div className="relative" style={{ width: totalWidth }}>
          {layers.map((layer, index) => {
            const isSelected = selectedLayerId === layer.id;
            const layerColor = layer.color || LAYER_COLORS[layer.type] || "#888";
            const Icon = LAYER_ICONS[layer.type] || Layers;
            const layerLeft = layer.startTime * pixelsPerSecond;
            const layerWidth = Math.max(40, (layer.endTime - layer.startTime) * pixelsPerSecond);

            return (
              <div
                key={layer.id}
                className="relative flex items-center"
                style={{
                  height: 44,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                {/* Layer Label (floating left) */}
                <div
                  className="absolute left-0 z-10 flex items-center gap-1 px-1.5 py-1 rounded-r-lg"
                  style={{
                    background: "#0c0c12",
                    top: "50%",
                    transform: `translateY(-50%) translateX(${scrollLeft}px)`,
                  }}
                >
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className="p-0.5 rounded transition-colors"
                  >
                    {layer.visible
                      ? <Eye className="w-3 h-3" style={{ color: "#888" }} />
                      : <EyeOff className="w-3 h-3" style={{ color: "#333" }} />
                    }
                  </button>
                  {layer.thumbnail ? (
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                      <img src={layer.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${layerColor}15` }}>
                      <Icon className="w-3 h-3" style={{ color: layerColor }} />
                    </div>
                  )}
                </div>

                {/* Layer Bar */}
                <button
                  onClick={() => onSelectLayer(isSelected ? null : layer.id)}
                  className="absolute top-1 bottom-1 rounded-lg transition-all"
                  style={{
                    left: layerLeft,
                    width: layerWidth,
                    background: `${layerColor}20`,
                    border: `1.5px solid ${isSelected ? layerColor : `${layerColor}40`}`,
                    boxShadow: isSelected ? `0 0 12px ${layerColor}30` : "none",
                  }}
                >
                  {/* Thumbnails strip for video layers */}
                  {layer.type === "video" && thumbnails && thumbnails.length > 0 && (
                    <div className="absolute inset-0 flex rounded-lg overflow-hidden opacity-50">
                      {thumbnails.slice(0, Math.min(8, Math.ceil(layerWidth / 50))).map((thumb, i) => (
                        <div key={i} className="flex-1 h-full overflow-hidden">
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Layer name */}
                  <div className="absolute inset-0 flex items-center px-2 z-10">
                    <span className="text-[9px] font-semibold truncate" style={{ color: layerColor }}>
                      {layer.name}
                    </span>
                  </div>

                  {/* Trim handles */}
                  <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-lg cursor-col-resize flex items-center justify-center"
                    style={{ background: layerColor }} />
                  <div className="absolute inset-y-0 right-0 w-1.5 rounded-r-lg cursor-col-resize flex items-center justify-center"
                    style={{ background: layerColor }} />

                  {/* Keyframe diamonds */}
                  {layer.keyframes?.map((kf) => {
                    const kfX = ((kf.time - layer.startTime) / (layer.endTime - layer.startTime)) * 100;
                    return (
                      <div
                        key={kf.id}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                        style={{ left: `${kfX}%` }}
                      >
                        <Diamond className="w-2.5 h-2.5" style={{ color: "#FFAA00", fill: "#FFAA00" }} />
                      </div>
                    );
                  })}
                </button>
              </div>
            );
          })}

          {/* Playhead */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 z-30"
              style={{ left: playheadLeft, pointerEvents: "none" }}
            >
              {/* Head triangle */}
              <div
                className="absolute -top-[2px] left-1/2 -translate-x-1/2 cursor-col-resize"
                style={{
                  width: 12,
                  height: 12,
                  background: "white",
                  clipPath: "polygon(0 0, 100% 0, 50% 80%)",
                  pointerEvents: "auto",
                  filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))",
                }}
                onMouseDown={startPlayheadDrag}
                onTouchStart={startPlayheadDrag}
              />
              {/* Line */}
              <div className="absolute top-0 bottom-0 w-px left-1/2 -translate-x-1/2" style={{ background: "white" }} />
            </div>
          )}
        </div>

        {/* Empty state */}
        {layers.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-[10px]" style={{ color: "#333" }}>No layers yet — tap + to add elements</p>
          </div>
        )}
      </div>

      {/* ─── Add Layer Button ─── */}
      <div className="flex items-center justify-end px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          onClick={onAddLayer}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            border: "2px solid #00E5A0",
            color: "#00E5A0",
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
