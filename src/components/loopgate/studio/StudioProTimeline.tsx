/**
 * StudioProTimeline — DaVinci/Premiere-tier mobile timeline
 * Multi-track headers, pro playhead, waveform preview, ruler
 */
import { useRef, useState, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Music, Scissors, Bookmark,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { formatTimecode } from "@/lib/studioEffects";

const ACCENT = "#9999FF";

type TimelineMarker = {
  id: string;
  time: number;
  color: string;
  label: string;
  type: "cut" | "beat" | "effect" | "caption";
};

interface StudioProTimelineProps {
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  playing: boolean;
  thumbnails: string[];
  audioName: string;
  markers: TimelineMarker[];
  onSeek: (time: number) => void;
  onTrimStartChange: (time: number) => void;
  onTrimEndChange: (time: number) => void;
  onTogglePlay: () => void;
  onAddMarker: (time: number) => void;
  onSplit: (time: number) => void;
}

export default function StudioProTimeline({
  duration, currentTime, trimStart, trimEnd, playing, thumbnails, audioName, markers,
  onSeek, onTrimStartChange, onTrimEndChange, onTogglePlay, onAddMarker, onSplit,
}: StudioProTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = trimStart + pct * (trimEnd - trimStart);
    onSeek(time);
  };

  // Frame-skip buttons
  const skipFrames = (frames: number) => {
    const frameTime = 1 / 30; // 30fps
    onSeek(Math.max(0, Math.min(duration, currentTime + frames * frameTime)));
  };

  return (
    <div className="flex-shrink-0" style={{
      background: "linear-gradient(180deg, #0f0f13 0%, #0a0a0e 100%)",
      borderTop: "1px solid rgba(255,255,255,0.04)",
    }}>
      {/* Transport bar */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        {/* Timecode display */}
        <div className="flex items-center gap-0.5">
          <div className="px-2 py-1 rounded-md" style={{ background: "rgba(153,153,255,0.06)", border: "1px solid rgba(153,153,255,0.1)" }}>
            <span className="text-[11px] font-mono font-bold tabular-nums tracking-tight" style={{ color: ACCENT }}>
              {formatTimecode(currentTime)}
            </span>
          </div>
          <span className="text-[10px] font-mono mx-1" style={{ color: "#2a2a2a" }}>/</span>
          <span className="text-[11px] font-mono tabular-nums tracking-tight" style={{ color: "#444" }}>
            {formatTimecode(duration)}
          </span>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-0.5">
          {/* Frame back */}
          <button onClick={() => skipFrames(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 active:bg-white/5">
            <ChevronLeft className="w-4 h-4" style={{ color: "#555" }} />
          </button>
          {/* Skip to start */}
          <button onClick={() => onSeek(trimStart)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 active:bg-white/5">
            <SkipBack className="w-3.5 h-3.5" style={{ color: "#555" }} />
          </button>
          {/* Play/Pause */}
          <button onClick={onTogglePlay}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: playing
                ? `linear-gradient(135deg, ${ACCENT}20, ${ACCENT}08)`
                : `linear-gradient(135deg, ${ACCENT}, #7777DD)`,
              border: `1px solid ${playing ? ACCENT + "30" : "transparent"}`,
              boxShadow: playing ? `0 0 16px ${ACCENT}15` : `0 4px 16px ${ACCENT}30`,
            }}>
            {playing
              ? <Pause className="w-5 h-5" style={{ color: ACCENT }} />
              : <Play className="w-5 h-5 ml-0.5" style={{ color: "#000" }} />
            }
          </button>
          {/* Skip to end */}
          <button onClick={() => onSeek(trimEnd)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 active:bg-white/5">
            <SkipForward className="w-3.5 h-3.5" style={{ color: "#555" }} />
          </button>
          {/* Frame forward */}
          <button onClick={() => skipFrames(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 active:bg-white/5">
            <ChevronRight className="w-4 h-4" style={{ color: "#555" }} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => onSplit(currentTime)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Scissors className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
          <button onClick={() => onAddMarker(currentTime)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Bookmark className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
        </div>
      </div>

      {/* Time ruler */}
      <div className="px-3 pb-0.5">
        <div className="h-4 relative flex items-end" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          {duration > 0 && Array.from({ length: Math.min(20, Math.ceil(duration)) }).map((_, i) => {
            const t = (i / Math.min(20, Math.ceil(duration))) * 100;
            const sec = Math.round(i * duration / Math.min(20, Math.ceil(duration)));
            const isMajor = sec % 5 === 0;
            return (
              <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${t}%` }}>
                {isMajor && (
                  <span className="text-[6px] font-mono font-bold mb-0.5" style={{ color: "#444" }}>{sec}s</span>
                )}
                <div style={{ width: 1, height: isMajor ? 6 : 3, background: isMajor ? "#333" : "#1e1e1e" }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Track headers + timeline */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5">
          {/* Track labels */}
          <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: 28 }}>
            {/* Video track label */}
            <div className="h-14 rounded-lg flex flex-col items-center justify-center gap-0.5"
              style={{ background: "rgba(153,153,255,0.04)", border: "1px solid rgba(153,153,255,0.08)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              <span className="text-[6px] font-black tracking-widest uppercase" style={{ color: ACCENT }}>V1</span>
            </div>
            {/* Audio track label */}
            {audioName && (
              <div className="h-6 rounded-lg flex flex-col items-center justify-center"
                style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.08)" }}>
                <span className="text-[6px] font-black tracking-widest uppercase" style={{ color: "#A855F7" }}>A1</span>
              </div>
            )}
          </div>

          {/* Timeline tracks */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Video track */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  setIsDragging(true);
                  const rect = timelineRef.current?.getBoundingClientRect();
                  if (rect) {
                    const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                    onSeek(trimStart + pct * (trimEnd - trimStart));
                  }
                }
              }}
              onTouchMove={(e) => {
                if (isDragging && e.touches.length === 1) {
                  const rect = timelineRef.current?.getBoundingClientRect();
                  if (rect) {
                    const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                    onSeek(Math.max(0, Math.min(duration, trimStart + pct * (trimEnd - trimStart))));
                  }
                }
              }}
              onTouchEnd={() => setIsDragging(false)}
              className="relative h-14 rounded-xl overflow-hidden cursor-pointer"
              style={{
                background: "#080810",
                border: "1px solid rgba(255,255,255,0.04)",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
              }}
            >
              {/* Thumbnails */}
              <div className="absolute inset-0 flex">
                {thumbnails.length > 0 ? thumbnails.map((thumb, i) => (
                  <div key={i} className="flex-1 h-full overflow-hidden" style={{ opacity: 0.35 }}>
                    <img src={thumb} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                )) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[7px] font-bold tracking-[0.2em] uppercase" style={{ color: "#1a1a1a" }}>NO MEDIA</span>
                  </div>
                )}
              </div>

              {duration > 0 && (
                <>
                  {/* Inactive trim regions */}
                  <div className="absolute inset-y-0 left-0 rounded-l-xl" style={{
                    width: `${(trimStart / duration) * 100}%`,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(2px)",
                  }} />
                  <div className="absolute inset-y-0 right-0 rounded-r-xl" style={{
                    width: `${((duration - trimEnd) / duration) * 100}%`,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(2px)",
                  }} />

                  {/* Active region border glow */}
                  <div className="absolute inset-y-0 pointer-events-none" style={{
                    left: `${(trimStart / duration) * 100}%`,
                    right: `${((duration - trimEnd) / duration) * 100}%`,
                    borderTop: `2px solid ${ACCENT}30`,
                    borderBottom: `2px solid ${ACCENT}30`,
                  }} />

                  {/* Trim start handle */}
                  <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-l-lg flex items-center justify-center"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      background: `linear-gradient(180deg, ${ACCENT}, #6666CC)`,
                      boxShadow: `2px 0 8px ${ACCENT}40`,
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => {
                        const pct = Math.max(0, Math.min((trimEnd - 0.5) / duration, (ev.touches[0].clientX - rect.left) / rect.width));
                        onTrimStartChange(pct * duration);
                      };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }}
                  >
                    <div className="w-0.5 h-4 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }} />
                  </div>

                  {/* Trim end handle */}
                  <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-r-lg flex items-center justify-center"
                    style={{
                      left: `calc(${(trimEnd / duration) * 100}% - 8px)`,
                      background: `linear-gradient(180deg, ${ACCENT}, #6666CC)`,
                      boxShadow: `-2px 0 8px ${ACCENT}40`,
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => {
                        const pct = Math.max((trimStart + 0.5) / duration, Math.min(1, (ev.touches[0].clientX - rect.left) / rect.width));
                        onTrimEndChange(pct * duration);
                      };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }}
                  >
                    <div className="w-0.5 h-4 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }} />
                  </div>

                  {/* Markers */}
                  {markers.map(m => (
                    <div key={m.id} className="absolute top-0 bottom-0 w-px z-[15] pointer-events-none"
                      style={{ left: `${(m.time / duration) * 100}%`, background: m.color, opacity: 0.7 }}>
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                        style={{ background: m.color, boxShadow: `0 0 4px ${m.color}60` }} />
                    </div>
                  ))}

                  {/* Playhead — premium */}
                  <motion.div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                    transition={{ type: "tween", duration: 0.05 }}
                  >
                    <div className="absolute -left-px w-[2px] h-full" style={{
                      background: "linear-gradient(180deg, white, rgba(255,255,255,0.7))",
                      boxShadow: "0 0 6px rgba(255,255,255,0.3), 0 0 12px rgba(255,255,255,0.1)",
                    }} />
                    {/* Diamond head */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                      <div className="w-3 h-3 rotate-45 rounded-[1px]" style={{
                        background: "white",
                        boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                      }} />
                    </div>
                    {/* Bottom tail */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{
                      background: "white",
                      boxShadow: "0 0 4px rgba(255,255,255,0.4)",
                    }} />
                  </motion.div>
                </>
              )}
            </div>

            {/* Audio track */}
            {audioName && (
              <div className="h-6 rounded-lg flex items-center px-2 gap-1.5 overflow-hidden relative"
                style={{
                  background: "rgba(168,85,247,0.03)",
                  border: "1px solid rgba(168,85,247,0.08)",
                }}>
                {/* Fake waveform */}
                <div className="absolute inset-0 flex items-center px-2 gap-px opacity-30">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const h = 4 + Math.sin(i * 0.7) * 3 + Math.cos(i * 1.3) * 2 + Math.random() * 2;
                    return (
                      <div key={i} className="flex-1 rounded-full" style={{
                        height: Math.max(2, h),
                        background: "#A855F7",
                      }} />
                    );
                  })}
                </div>
                <Music className="w-2.5 h-2.5 flex-shrink-0 relative z-10" style={{ color: "rgba(168,85,247,0.5)" }} />
                <span className="text-[7px] truncate font-semibold relative z-10" style={{ color: "rgba(168,85,247,0.5)" }}>{audioName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marker count */}
      {markers.length > 0 && (
        <div className="px-3 pb-1.5 flex items-center gap-1">
          <Bookmark className="w-2.5 h-2.5" style={{ color: "#333" }} />
          <span className="text-[7px] font-bold" style={{ color: "#333" }}>{markers.length} markers</span>
        </div>
      )}
    </div>
  );
}
