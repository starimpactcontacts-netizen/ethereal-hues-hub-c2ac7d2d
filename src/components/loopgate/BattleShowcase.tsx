import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";
import { getBunnyPlaybackUrl } from "@/lib/bunnyPlayback";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 15;
const PRELOAD_LEAD_SECONDS = 2.5;
const STALL_BAIL_MS = 5000; // if active video can't get a frame in this window, auto-skip
const HAVE_NOTHING = 0;
const HAVE_CURRENT_DATA = 2;

type Side = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  url: string;
  color: "red" | "blue";
  posterUrl?: string | null;
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
  const playableSides = useMemo<[Side, Side]>(() => sides.map((side) => ({
    ...side,
    url: getBunnyPlaybackUrl(side.url),
  })) as [Side, Side], [sides]);
  const videoKey = useMemo(() => playableSides.map((side) => side.url).join("|"), [playableSides]);
  const posterKey = useMemo(() => playableSides.map((side) => side.posterUrl || "").join("|"), [playableSides]);
  const audioUnlocked = useBattleAudioUnlock();
  const startMs = showcaseStartedAt ? new Date(showcaseStartedAt).getTime() : null;
  const totalMs = playableSides.length * PER_EDIT_SECONDS * 1000;

  const compute = useCallback(() => {
    if (!startMs) return { idx: 0, left: PER_EDIT_SECONDS, completedOnce: false };
    const elapsed = Math.max(0, Date.now() - startMs);
    const completedOnce = elapsed >= totalMs;
    // Loop after the first pass so latecomers always see something playing
    const looped = elapsed % totalMs;
    const idx = Math.min(playableSides.length - 1, Math.floor(looped / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = looped - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left, completedOnce };
  }, [playableSides.length, startMs, totalMs]);

  const initial = compute();
  const [currentIdx, setCurrentIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const completedFiredRef = useRef(false);
  const bufferHoldStartedAtRef = useRef<number | null>(null);
  const holdOffsetMsRef = useRef(0);
  const [posters, setPosters] = useState<Record<number, string>>({});
  const [started, setStarted] = useState<Record<number, boolean>>({});
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const [loadErrors, setLoadErrors] = useState<Record<number, boolean>>({});
  const skippedRef = useRef<Record<number, boolean>>({});
  const stallTimerRef = useRef<number | null>(null);

  const current = playableSides[currentIdx];

  const advanceToNext = useCallback(() => {
    if (playableSides.length <= 1) return;
    const next = (currentIdx + 1) % playableSides.length;
    setCurrentIdx(next);
    setSecondsLeft(PER_EDIT_SECONDS);
  }, [currentIdx, playableSides.length]);

  useEffect(() => {
    setReady({});
    setStarted({});
    setPosters(sides.reduce<Record<number, string>>((acc, side, index) => {
      if (side.posterUrl) acc[index] = side.posterUrl;
      return acc;
    }, {}));
    setLoadErrors({});
    skippedRef.current = {};
    bufferHoldStartedAtRef.current = null;
    holdOffsetMsRef.current = 0;
  }, [posterKey, videoKey]);

  // Keep inactive videos at metadata so mobile Safari can grab a first frame cheaply.
  // Active video uses auto; the next side warms up near the swap without both full-buffering forever.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = false;
      const isActive = i === currentIdx;
      // Always full-preload the active side; warm the next side ahead of the swap.
      // Avoid the metadata→auto thrash that aborts in-flight loads on iOS Safari.
      const shouldWarm = !isActive && secondsLeft <= PRELOAD_LEAD_SECONDS;
      const desired = isActive || shouldWarm ? "auto" : "metadata";
      if (v.preload !== desired) v.preload = desired;
      if (v.readyState === HAVE_NOTHING) v.load();
    });
  }, [currentIdx, secondsLeft, videoKey]);

  // Auto-skip the active side if it can't produce a frame within STALL_BAIL_MS.
  useEffect(() => {
    if (stallTimerRef.current) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    const activeSide = sides[currentIdx];
    if (!isDirectVideo(activeSide.url)) return;
    if (skippedRef.current[currentIdx]) return;
    if (started[currentIdx] || ready[currentIdx]) return;
    stallTimerRef.current = window.setTimeout(() => {
      const v = videoRefs.current[currentIdx];
      if (!v || v.readyState >= HAVE_CURRENT_DATA) return;
      skippedRef.current[currentIdx] = true;
      setLoadErrors((prev) => ({ ...prev, [currentIdx]: true }));
      advanceToNext();
    }, STALL_BAIL_MS);
    return () => {
      if (stallTimerRef.current) {
        window.clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    };
  }, [advanceToNext, currentIdx, ready, sides, started]);

  useEffect(() => {
    videoRefs.current.forEach((v, index) => {
      if (!v) return;
      const active = index === currentIdx;
      v.muted = !(audioUnlocked && active);
      v.defaultMuted = false;
      v.volume = active ? 1 : 0;
      if (paused || !active) {
        v.pause();
        return;
      }
      v.play().catch(() => {
        if (!audioUnlocked) {
          v.muted = true;
          v.play().catch((error) => { void error; });
        }
      });
    });
  }, [audioUnlocked, currentIdx, paused]);

  // Server-synced ticker
  useEffect(() => {
    if (!startMs) return;
    const tick = () => {
      const activeSide = sides[currentIdx];
      const activeVideo = videoRefs.current[currentIdx];
      const waitingForFirstFrame = isDirectVideo(activeSide.url) && !activeVideo?.error && (!activeVideo || activeVideo.readyState < HAVE_CURRENT_DATA);

      if (waitingForFirstFrame) {
        if (!bufferHoldStartedAtRef.current) bufferHoldStartedAtRef.current = Date.now();
        return;
      }

      const now = Date.now();
      if (bufferHoldStartedAtRef.current) {
        holdOffsetMsRef.current += now - bufferHoldStartedAtRef.current;
        bufferHoldStartedAtRef.current = null;
      }
      const adjustedStartMs = startMs + holdOffsetMsRef.current;
      const elapsed = Math.max(0, now - adjustedStartMs);
      const completedOnce = elapsed >= totalMs;
      const looped = elapsed % totalMs;
      const idx = Math.min(sides.length - 1, Math.floor(looped / (PER_EDIT_SECONDS * 1000)));
      const intoEdit = looped - idx * PER_EDIT_SECONDS * 1000;
      const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
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
  }, [currentIdx, onComplete, ready, sides, startMs, totalMs]);

  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;
  const ringColor = current.color === "red" ? "ring-red-500/40" : "ring-blue-500/40";
  const accent = current.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = current.color === "red" ? "text-red-400" : "text-blue-400";

  const capturePoster = (index: number) => {
    const v = videoRefs.current[index];
    if (!v || posters[index]) return;
    try {
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) return;
      const canvas = document.createElement("canvas");
      const max = 540;
      const scale = Math.min(1, max / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setPosters((prev) => ({ ...prev, [index]: dataUrl }));
    } catch {
      /* tainted canvas */
    }
  };

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
            const poster = posters[index];
            const hasStarted = !!started[index];

            return (
              <div key={side.userId} className={`absolute inset-0 transition-opacity duration-75 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                {sideDirect ? (
                  <>
                    {poster && (
                      <img
                        src={poster}
                        alt=""
                        aria-hidden
                        className={`absolute inset-0 w-full h-full object-contain bg-black pointer-events-none transition-opacity duration-200 ${hasStarted && active ? "opacity-0" : "opacity-100"}`}
                      />
                    )}
                    <video
                      ref={(node) => { videoRefs.current[index] = node; }}
                      src={side.url}
                      className={`relative w-full h-full object-contain bg-black transition-opacity duration-200 ${poster && !hasStarted ? "opacity-0" : "opacity-100"}`}
                      playsInline
                      loop
                      preload={active ? "auto" : "metadata"}
                      controls={false}
                      disablePictureInPicture
                      muted={!active}
                      poster={poster || undefined}
                      crossOrigin="anonymous"
                      onLoadedMetadata={() => setReady((prev) => (prev[index] ? prev : { ...prev, [index]: true }))}
                      onLoadedData={() => {
                        setReady((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
                        capturePoster(index);
                      }}
                      onCanPlay={() => setReady((prev) => (prev[index] ? prev : { ...prev, [index]: true }))}
                      onPlaying={() => setStarted((prev) => (prev[index] ? prev : { ...prev, [index]: true }))}
                      onError={() => {
                        setLoadErrors((prev) => ({ ...prev, [index]: true }));
                        if (index === currentIdx && !skippedRef.current[index]) {
                          skippedRef.current[index] = true;
                          advanceToNext();
                        }
                      }}
                    />
                    {active && !ready[index] && !poster && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/35">
                        <div className={`w-8 h-8 rounded-full border-2 ${side.color === "red" ? "border-red-500/40 border-t-red-500" : "border-blue-500/40 border-t-blue-500"} animate-spin`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50" style={teko}>buffering</span>
                      </div>
                    )}
                    {active && loadErrors[index] && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 px-6 text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/60" style={teko}>
                          Edit unavailable
                        </span>
                        <a
                          href={side.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground"
                          style={teko}
                        >
                          Open in new tab
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const v = videoRefs.current[index];
                            setLoadErrors((prev) => ({ ...prev, [index]: false }));
                            skippedRef.current[index] = false;
                            if (v) { v.load(); v.play().catch(() => {}); }
                          }}
                          className="text-[10px] uppercase tracking-[0.18em] text-foreground/50 underline-offset-4 hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </>
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
