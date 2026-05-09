import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 15;

type Side = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  url: string;
  color: "red" | "blue";
};

interface Props {
  sides: [Side, Side];
  showcaseStartedAt: string | null;
  /** Called once when both edits have finished playing the full 10s round */
  onComplete?: () => void;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}
function isImageFile(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

/**
 * 1v1 Battle Showcase — plays each edit for 10s in turn (challenger → opponent),
 * synced for ALL viewers via `showcase_started_at`. Loops until onComplete fires
 * after the first full pass.
 */
export default function BattleShowcase({ sides, showcaseStartedAt, onComplete }: Props) {
  const videoKey = useMemo(() => sides.map((side) => side.url).join("|"), [sides]);
  const audioUnlocked = useBattleAudioUnlock();
  const startMs = showcaseStartedAt ? new Date(showcaseStartedAt).getTime() : null;
  const totalMs = sides.length * PER_EDIT_SECONDS * 1000;

  const compute = useCallback(() => {
    if (!startMs) return { idx: 0, left: PER_EDIT_SECONDS, completedOnce: false };
    const elapsed = Math.max(0, Date.now() - startMs);
    const completedOnce = elapsed >= totalMs;
    // Loop after the first pass so latecomers always see something playing
    const looped = elapsed % totalMs;
    const idx = Math.min(sides.length - 1, Math.floor(looped / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = looped - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left, completedOnce };
  }, [sides.length, startMs, totalMs]);

  const initial = compute();
  const [currentIdx, setCurrentIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const completedFiredRef = useRef(false);

  const current = sides[currentIdx];

  // Preload and play every direct video; after the first page tap, active edit is unmuted automatically.
  useEffect(() => {
    videoRefs.current.forEach((v, index) => {
      if (!v) return;
      const active = index === currentIdx;
      v.muted = !(audioUnlocked && active);
      v.defaultMuted = false;
      v.volume = active ? 1 : 0;
      v.preload = "auto";
      v.play().catch(() => {
        v.muted = true;
        v.play().catch((error) => { void error; });
      });
    });
  }, [audioUnlocked, currentIdx, videoKey]);

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      if (paused) v.pause();
      else v.play().catch((error) => { void error; });
    });
  }, [paused]);

  // Server-synced ticker
  useEffect(() => {
    if (!startMs) return;
    const tick = () => {
      const { idx, left, completedOnce } = compute();
      setCurrentIdx(prev => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
      if (completedOnce && !completedFiredRef.current) {
        completedFiredRef.current = true;
        onComplete?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [compute, startMs, sides.length, onComplete]);

  const image = isImageFile(current.url);
  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;
  const ringColor = current.color === "red" ? "ring-red-500/40" : "ring-blue-500/40";
  const accent = current.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = current.color === "red" ? "text-red-400" : "text-blue-400";

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] ${accentText}`} style={teko}>
            <span className={`w-1.5 h-1.5 rounded-full ${accent} animate-pulse`} />
            Showcase
          </span>
          <span className="text-foreground/30 text-[10px]">·</span>
          <span className="text-[10px] font-bold tabular-nums text-foreground/60" style={teko}>
            {currentIdx + 1}/{sides.length}
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground/40" style={teko}>
          Synced for everyone
        </span>
      </div>

      {/* Two-segment progress */}
      <div className="flex gap-1">
        {sides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full ${i === 0 ? "bg-red-500" : "bg-blue-500"} transition-all`}
              style={{
                width: i < currentIdx ? "100%" : i === currentIdx ? `${progressPct}%` : "0%",
                transitionDuration: i === currentIdx ? "1000ms" : "0ms",
              }}
            />
          </div>
        ))}
      </div>

      {/* Player */}
      <motion.div
        className={`relative aspect-[9/16] max-h-[78vh] w-full max-w-[min(100%,calc(78vh*9/16))] mx-auto rounded-2xl overflow-hidden bg-black border border-white/[0.06] ring-2 ${ringColor}`}
      >
          {sides.map((side, index) => {
            const sideDirect = isDirectVideo(side.url);
            const sideImage = isImageFile(side.url);
            const active = index === currentIdx;

            return (
              <div key={side.userId} className={`absolute inset-0 transition-opacity duration-75 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                {sideDirect ? (
                  <video
                    ref={(node) => { videoRefs.current[index] = node; }}
                    src={side.url}
                    className="w-full h-full object-contain bg-black"
                    autoPlay
                    playsInline
                    loop
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                  />
                ) : sideImage ? (
                  <img src={side.url} alt={`${side.username} edit`} className="w-full h-full object-contain bg-black" loading="eager" decoding="async" />
                ) : active ? (
                  <a
                    href={side.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.04] to-black"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                      <Play className="w-9 h-9 text-white ml-1" />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="text-xs text-white/70 uppercase tracking-wider" style={teko}>
                        Tap to open
                      </span>
                    </div>
                  </a>
                ) : null}
              </div>
            );
          })}

          {/* Top overlay: who's playing */}
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className={`w-7 h-7 border ${current.color === "red" ? "border-red-400/60" : "border-blue-400/60"}`}>
                <AvatarImage src={current.avatarUrl || ""} />
                <AvatarFallback className="text-[9px] font-bold bg-surface-1">
                  {current.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold text-white">@{current.username}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${current.color === "red" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}`}>
                {current.color}
              </span>
            </div>
            <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
              <span className="text-[12px] font-black text-white tabular-nums" style={teko}>
                {secondsLeft}s
              </span>
            </div>
          </div>

          {/* Pause toggle */}
          <button
            onClick={() => setPaused(p => !p)}
            className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="w-4 h-4 text-white ml-0.5" /> : <Pause className="w-4 h-4 text-white" />}
          </button>

      </motion.div>

      <p className="text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em]" style={teko}>
        {PER_EDIT_SECONDS}s per edit · auto-rotating
      </p>
    </div>
  );
}
