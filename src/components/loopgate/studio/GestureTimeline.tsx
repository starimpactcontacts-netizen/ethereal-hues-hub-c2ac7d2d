/**
 * GestureTimeline — Enhanced mobile timeline with pinch-to-zoom, layers, markers
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Music,
  Layers, Plus, Minus, Scissors, Bookmark
} from "lucide-react";

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

type TimelineMarker = {
  id: string;
  time: number;
  color: string;
  label: string;
  type: "cut" | "beat" | "effect" | "caption";
};

type TimelineLayer = {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "effect";
  color: string;
  visible: boolean;
  items: { startTime: number; endTime: number; label: string }[];
};

interface GestureTimelineProps {
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  playing: boolean;
  thumbnails: string[];
  audioName: string;
  markers: TimelineMarker[];
  layers: TimelineLayer[];
  onSeek: (time: number) => void;
  onTrimStartChange: (time: number) => void;
  onTrimEndChange: (time: number) => void;
  onTogglePlay: () => void;
  onAddMarker: (time: number) => void;
  onSplit: (time: number) => void;
}

export default function GestureTimeline({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  playing,
  thumbnails,
  audioName,
  markers,
  layers,
  onSeek,
  onTrimStartChange,
  onTrimEndChange,
  onTogglePlay,
  onAddMarker,
  onSplit,
}: GestureTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showLayers, setShowLayers] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Pinch to zoom
  const lastPinchDist = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        setZoom(prev => Math.max(1, Math.min(8, prev * scale)));
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && isDragging) {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
      const visibleStart = trimStart + scrollOffset * (trimEnd - trimStart);
      const visibleRange = (trimEnd - trimStart) / zoom;
      const time = visibleStart + pct * visibleRange;
      onSeek(Math.max(0, Math.min(duration, time)));
    }
  }, [isDragging, zoom, scrollOffset, trimStart, trimEnd, duration, onSeek]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = 0;
    setIsDragging(false);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = trimStart + pct * (trimEnd - trimStart);
    onSeek(time);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const visibleLayers = layers.filter(l => l.visible);

  return (
    <div className="flex-shrink-0" style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
      {/* Transport controls */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold" style={{ color: ACCENT }}>{formatTime(currentTime)}</span>
          <span className="text-[8px]" style={{ color: "#333" }}>/</span>
          <span className="text-[10px] font-mono" style={{ color: "#444" }}>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSeek(trimStart)} className="p-1.5 rounded-full active:scale-90 transition-transform">
            <SkipBack className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
          <button onClick={onTogglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ border: `1px solid ${ACCENT_BORDER}`, background: ACCENT_DIM }}>
            {playing ? <Pause className="w-3.5 h-3.5" style={{ color: ACCENT }} /> : <Play className="w-3.5 h-3.5 ml-0.5" style={{ color: ACCENT }} />}
          </button>
          <button onClick={() => onSeek(trimEnd)} className="p-1.5 rounded-full active:scale-90 transition-transform">
            <SkipForward className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button onClick={() => setZoom(prev => Math.max(1, prev / 1.5))} className="p-1 rounded" style={{ background: zoom > 1 ? ACCENT_DIM : "transparent" }}>
            <Minus className="w-3 h-3" style={{ color: zoom > 1 ? ACCENT : "#444" }} />
          </button>
          <span className="text-[8px] font-mono w-6 text-center" style={{ color: "#555" }}>{zoom.toFixed(1)}x</span>
          <button onClick={() => setZoom(prev => Math.min(8, prev * 1.5))} className="p-1 rounded">
            <Plus className="w-3 h-3" style={{ color: "#666" }} />
          </button>
          {/* Layer toggle */}
          <button onClick={() => setShowLayers(!showLayers)} className="p-1 rounded ml-1" style={{ background: showLayers ? ACCENT_DIM : "transparent" }}>
            <Layers className="w-3 h-3" style={{ color: showLayers ? ACCENT : "#555" }} />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 px-3 pb-1">
        <button onClick={() => onSplit(currentTime)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-bold active:scale-95 transition-transform"
          style={{ background: "#111", border: "1px solid #222", color: "#888" }}>
          <Scissors className="w-2.5 h-2.5" /> Split
        </button>
        <button onClick={() => onAddMarker(currentTime)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-bold active:scale-95 transition-transform"
          style={{ background: "#111", border: "1px solid #222", color: "#888" }}>
          <Bookmark className="w-2.5 h-2.5" /> Mark
        </button>
        {markers.length > 0 && (
          <span className="text-[7px] ml-auto" style={{ color: "#444" }}>{markers.length} markers</span>
        )}
      </div>

      {/* Main timeline */}
      <div className="px-3 pb-1">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onTouchStart={(e) => { handleTouchStart(e); if (e.touches.length === 1) setIsDragging(true); }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative h-12 rounded-xl overflow-hidden cursor-pointer"
          style={{ background: "#111", border: "1px solid #222" }}
        >
          {/* Thumbnails */}
          <div className="absolute inset-0 flex">
            {thumbnails.map((thumb, i) => (
              <div key={i} className="flex-1 h-full overflow-hidden opacity-50">
                <img src={thumb} alt="" className="w-full h-full object-cover" draggable={false} />
              </div>
            ))}
            {thumbnails.length === 0 && <div className="flex-1" style={{ background: "#151515" }} />}
          </div>

          {/* Trim handles */}
          {duration > 0 && (
            <>
              <div className="absolute inset-y-0 left-0 rounded-l-xl" style={{ width: `${(trimStart / duration) * 100}%`, background: "rgba(0,0,0,0.6)" }} />
              <div className="absolute inset-y-0 right-0 rounded-r-xl" style={{ width: `${((duration - trimEnd) / duration) * 100}%`, background: "rgba(0,0,0,0.6)" }} />

              {/* Trim start handle */}
              <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-l-xl"
                style={{ left: `${(trimStart / duration) * 100}%`, background: ACCENT }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const rect = timelineRef.current!.getBoundingClientRect();
                  const onMove = (ev: TouchEvent) => { const pct = Math.max(0, Math.min((trimEnd - 0.5) / duration, (ev.touches[0].clientX - rect.left) / rect.width)); onTrimStartChange(pct * duration); };
                  const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                  window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                }} />

              {/* Trim end handle */}
              <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-r-xl"
                style={{ left: `calc(${(trimEnd / duration) * 100}% - 8px)`, background: ACCENT }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const rect = timelineRef.current!.getBoundingClientRect();
                  const onMove = (ev: TouchEvent) => { const pct = Math.max((trimStart + 0.5) / duration, Math.min(1, (ev.touches[0].clientX - rect.left) / rect.width)); onTrimEndChange(pct * duration); };
                  const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                  window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                }} />

              {/* Markers */}
              {markers.map((m) => (
                <div key={m.id} className="absolute top-0 bottom-0 w-0.5 z-15 pointer-events-none"
                  style={{ left: `${(m.time / duration) * 100}%`, background: m.color }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: m.color }} />
                </div>
              ))}

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%`, background: "white" }}>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ background: "white", boxShadow: "0 0 6px rgba(255,255,255,0.6)" }} />
              </div>
            </>
          )}

          {/* Audio track indicator */}
          {audioName && (
            <div className="absolute bottom-0 left-0 right-0 h-3 flex items-center px-1.5 rounded-b-xl" style={{ background: "rgba(168,85,247,0.08)", borderTop: "1px solid rgba(168,85,247,0.15)" }}>
              <Music className="w-2 h-2 mr-0.5" style={{ color: "rgba(168,85,247,0.4)" }} />
              <span className="text-[7px] truncate" style={{ color: "rgba(168,85,247,0.4)" }}>{audioName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Layer tracks */}
      {showLayers && visibleLayers.length > 0 && (
        <div className="px-3 pb-2 space-y-0.5">
          {visibleLayers.map((layer) => (
            <div key={layer.id} className="flex items-center gap-1.5">
              <span className="text-[7px] font-bold w-8 text-right truncate" style={{ color: layer.color }}>{layer.name}</span>
              <div className="flex-1 h-4 rounded relative overflow-hidden" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                {layer.items.map((item, i) => (
                  <div key={i} className="absolute inset-y-0.5 rounded-sm flex items-center px-1"
                    style={{
                      left: `${(item.startTime / duration) * 100}%`,
                      width: `${((item.endTime - item.startTime) / duration) * 100}%`,
                      background: `${layer.color}30`,
                      border: `1px solid ${layer.color}50`,
                    }}>
                    <span className="text-[6px] truncate font-bold" style={{ color: layer.color }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="safe-bottom" />
    </div>
  );
}
