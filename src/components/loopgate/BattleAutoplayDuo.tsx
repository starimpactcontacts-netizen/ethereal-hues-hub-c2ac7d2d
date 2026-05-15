import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";
import { getBunnyPlaybackUrl, isBunnyVideoUrl } from "@/lib/bunnyPlayback";
import { supabase } from "@/integrations/supabase/client";
import { attachHlsSource } from "@/lib/attachHlsSource";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 15;
const HAVE_NOTHING = 0;
const HAVE_CURRENT_DATA = 2;

type Side = {
  userId: string;
  username: string;
  url: string;
  color: "red" | "blue";
  avatarUrl?: string | null;
  posterUrl?: string | null;
};

interface Props {
  red: Side;
  blue: Side;
  /** Stable id used to scope realtime reaction broadcasts. */
  fightId?: string | null;
  /** ISO timestamp the showcase started (for cross-viewer sync). Defaults to mount time. */
  startedAt?: string | null;
  /** When true, hold playback (e.g. while intro overlay is running) */
  paused?: boolean;
}

function isVideo(url: string) {
  return isBunnyVideoUrl(url);
}

/**
 * Two stacked square edits (RED top / BLUE bottom) with a VS divider.
 * Auto-plays one for 10s, then the other for 10s, on infinite loop.
 * Synced for all viewers using `startedAt` timestamp.
 */
const REACTIONS = [
  { id: "fire",   emoji: "🔥", label: "FIRE"   },
  { id: "goat",   emoji: "🐐", label: "GOAT"   },
  { id: "rotten", emoji: "🍅", label: "ROTTEN" },
  { id: "dead",   emoji: "💀", label: "DEAD"   },
] as const;
type ReactionId = typeof REACTIONS[number]["id"];
interface FloatingReaction { key: number; emoji: string; x: number; }

export default function BattleAutoplayDuo({ red, blue, fightId, startedAt, paused = false }: Props) {
  const sides = useMemo<[Side, Side]>(() => [
    { ...red, url: getBunnyPlaybackUrl(red.url) },
    { ...blue, url: getBunnyPlaybackUrl(blue.url) },
  ], [red, blue]);
  const startMsRef = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());
  const totalMs = sides.length * PER_EDIT_SECONDS * 1000;
  const [redReady, setRedReady] = useState(false);
  const [blueReady, setBlueReady] = useState(false);
  const audioUnlocked = useBattleAudioUnlock();

  const compute = useCallback(() => {
    const elapsed = Math.max(0, Date.now() - startMsRef.current);
    const looped = elapsed % totalMs;
    const idx = Math.min(sides.length - 1, Math.floor(looped / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = looped - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left };
  }, [sides.length, totalMs]);

  const initial = compute();
  const [activeIdx, setActiveIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const tickEnabled = !paused;
  const mountedPausedRef = useRef(paused);
  const bufferHoldStartedAtRef = useRef<number | null>(null);

  const redVideoRef = useRef<HTMLVideoElement>(null);
  const blueVideoRef = useRef<HTMLVideoElement>(null);
  const redPanelRef = useRef<HTMLDivElement>(null);
  const bluePanelRef = useRef<HTMLDivElement>(null);
  const [redPoster, setRedPoster] = useState<string | null>(red.posterUrl || null);
  const [bluePoster, setBluePoster] = useState<string | null>(blue.posterUrl || null);
  const [redStarted, setRedStarted] = useState(false);
  const [blueStarted, setBlueStarted] = useState(false);
  const primedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setRedReady(!isVideo(red.url));
    setBlueReady(!isVideo(blue.url));
    setRedStarted(false);
    setBlueStarted(false);
    setRedPoster(red.posterUrl || null);
    setBluePoster(blue.posterUrl || null);
    bufferHoldStartedAtRef.current = null;
  }, [red.url, blue.url, red.posterUrl, blue.posterUrl]);

  // If the battle mounted behind the 3-2-1 overlay, start the filmed showcase from RED at 15s.
  useEffect(() => {
    if (!mountedPausedRef.current || paused) return;
    mountedPausedRef.current = false;
    startMsRef.current = Date.now();
    setActiveIdx(0);
    setSecondsLeft(PER_EDIT_SECONDS);
  }, [paused]);

  // Tick immediately instead of waiting for both videos to fully buffer.
  useEffect(() => {
    if (!tickEnabled) return;
    const tick = () => {
      const activeSide = sides[activeIdx];
      const activeVideo = activeIdx === 0 ? redVideoRef.current : blueVideoRef.current;
      const waitingForFirstFrame = isVideo(activeSide.url) && !activeVideo?.error && (!activeVideo || activeVideo.readyState < HAVE_CURRENT_DATA);

      if (waitingForFirstFrame) {
        if (!bufferHoldStartedAtRef.current) bufferHoldStartedAtRef.current = Date.now();
        return;
      }

      if (bufferHoldStartedAtRef.current) {
        startMsRef.current += Date.now() - bufferHoldStartedAtRef.current;
        bufferHoldStartedAtRef.current = null;
      }

      const { idx, left } = compute();
      setActiveIdx((prev) => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [activeIdx, blueReady, compute, redReady, sides, tickEnabled]);

  // Keep BOTH Bunny videos hot. Mobile Safari often refuses to fully buffer with
  // metadata-only, so force `auto`, call `load()`, then silently prime playback once.
  useEffect(() => {
    const refs = [redVideoRef.current, blueVideoRef.current];
    refs.forEach((v, i) => {
      if (!v) return;
      v.preload = "auto";
      v.playsInline = true;
      if (v.readyState === HAVE_NOTHING) {
        v.load();
      }

      const key = v.currentSrc || v.src;
      if (!key) return;
      if (!primedUrlsRef.current.has(key)) {
        primedUrlsRef.current.add(key);
        console.info('[Bunny Video] Priming battle edit buffer:', key);
        const wasMuted = v.muted;
        v.muted = true;
        v.defaultMuted = true;
        v.play()
          .then(() => {
            if (i !== activeIdx || paused) {
              v.pause();
              try { v.currentTime = 0; } catch { /* ignore */ }
            }
            v.muted = wasMuted || !(audioUnlocked && i === activeIdx);
          })
          .catch(() => {
            v.muted = wasMuted || !(audioUnlocked && i === activeIdx);
          });
      }
    });
  }, [activeIdx, audioUnlocked, paused, red.url, blue.url]);

  // Drive playback without seeking/resetting; seeking on mobile was causing black frames and stutter.
  useEffect(() => {
    if (paused) {
      [redVideoRef.current, blueVideoRef.current].forEach((v) => {
        if (!v) return;
        v.pause();
      });
      return;
    }
    const refs = [redVideoRef.current, blueVideoRef.current];
    refs.forEach((v, i) => {
      if (!v) return;
      const active = i === activeIdx;
      v.muted = !(audioUnlocked && active);
      v.defaultMuted = false;
      v.volume = active ? 1 : 0;
      if (!active) {
        v.pause();
        // Hard reset inactive side so it can't bleed audio/frames into the other turn.
        try { v.currentTime = 0; } catch { /* ignore */ }
        return;
      }
      if (v.readyState < HAVE_CURRENT_DATA) {
        v.load();
      }
      v.play().catch(() => {
        if (!audioUnlocked) {
          v.muted = true;
          v.play().catch((error) => { void error; });
        }
      });
    });
  }, [activeIdx, audioUnlocked, paused]);

  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;

  // ── Floating emoji reactions broadcast over realtime (no DB) ──
  const [floats, setFloats] = useState<FloatingReaction[]>([]);
  const [counts, setCounts] = useState<Record<ReactionId, number>>({ fire: 0, goat: 0, rotten: 0, dead: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const floatKey = useRef(0);

  // Reset counts when the active side flips
  useEffect(() => {
    setCounts({ fire: 0, goat: 0, rotten: 0, dead: 0 });
    setFloats([]);
  }, [activeIdx]);

  useEffect(() => {
    if (!fightId) return;
    const channel = supabase.channel(`fight-reactions-${fightId}`, { config: { broadcast: { self: true } } });
    channelRef.current = channel;
    channel.on("broadcast", { event: "reaction" }, (payload: { payload?: { id?: unknown; idx?: unknown } }) => {
      const { id, idx } = payload?.payload || {};
      if (typeof id !== "string" || idx !== activeIdx) return;
      const def = REACTIONS.find(r => r.id === id);
      if (!def) return;
      setCounts(c => ({ ...c, [id]: c[id as ReactionId] + 1 }));
      const k = ++floatKey.current;
      setFloats(f => [...f, { key: k, emoji: def.emoji, x: 20 + Math.random() * 60 }]);
      setTimeout(() => setFloats(f2 => f2.filter(it => it.key !== k)), 2200);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [fightId, activeIdx]);

  const fireReaction = (id: ReactionId) => {
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: { id, idx: activeIdx } });
  };

  const activeColor = sides[activeIdx].color;

  return (
    <div className="select-none -mx-4 md:-mx-0">
      {/* ── HUD strip: round + clean turn label ── */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 bg-black border-b border-white/5">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/40" style={teko}>
          Round <span className="text-white tabular-nums">{activeIdx + 1}</span>
          <span className="text-foreground/30">/{sides.length}</span>
        </span>
        <span
          className={`text-[11px] font-black uppercase tracking-[0.28em] ${activeColor === 'red' ? 'text-red-400' : 'text-blue-400'}`}
          style={teko}
        >
          {activeColor}&nbsp;·&nbsp;ON STAGE
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 tabular-nums" style={teko}>
          @{sides[0].username}<span className="text-foreground/25"> vs </span>@{sides[1].username}
        </span>
      </div>

      {/* ── MOBILE: stacked RED on top / BLUE on bottom — both always visible, no scroll ── */}
      <div className="md:hidden flex flex-col w-full bg-black">
        <div className="relative w-full aspect-[16/10] border-b border-white/10">
          <SidePanel
            side={sides[0]}
            videoRef={redVideoRef}
            panelRef={redPanelRef}
            active={activeIdx === 0}
            progressPct={activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0}
            secondsLeft={secondsLeft}
            onReady={() => setRedReady(true)}
            loading={!redReady}
            poster={redPoster}
            onPoster={setRedPoster}
            started={redStarted}
            onStarted={() => setRedStarted(true)}
            fill
          />
        </div>
        <div className="relative w-full aspect-[16/10]">
          <SidePanel
            side={sides[1]}
            videoRef={blueVideoRef}
            panelRef={bluePanelRef}
            active={activeIdx === 1}
            progressPct={activeIdx === 1 ? progressPct : 0}
            secondsLeft={secondsLeft}
            onReady={() => setBlueReady(true)}
            loading={!blueReady}
            poster={bluePoster}
            onPoster={setBluePoster}
            started={blueStarted}
            onStarted={() => setBlueStarted(true)}
            fill
          />
        </div>
      </div>

      {/* ── DESKTOP: side-by-side as before ── */}
      <div className="hidden md:flex md:items-stretch md:gap-0">
      <div className="md:flex-1 md:min-w-0">
      <SidePanel
        side={sides[0]}
        videoRef={redVideoRef}
        panelRef={redPanelRef}
        active={activeIdx === 0}
        progressPct={activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0}
        secondsLeft={secondsLeft}
        onReady={() => setRedReady(true)}
        loading={!redReady}
        poster={redPoster}
        onPoster={setRedPoster}
        started={redStarted}
        onStarted={() => setRedStarted(true)}
      />
      </div>

      {/* Slim vertical VS divider (desktop only) */}
      <div className="relative md:h-auto md:w-0 flex items-center justify-center bg-black z-20">
        <div
          className="absolute md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.9) 30%, #fff 50%, rgba(59,130,246,0.9) 70%, transparent 100%)',
            boxShadow: '0 0 10px rgba(239,68,68,0.5), 0 0 10px rgba(59,130,246,0.5)',
          }}
        />
        <div
          className="relative z-10 w-9 h-9 rounded-full bg-black flex items-center justify-center -my-[18px]"
          style={{
            border: '1.5px solid rgba(255,255,255,0.25)',
            boxShadow:
              '0 0 18px rgba(239,68,68,0.4), 0 0 18px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <span
            className="text-[13px] font-black bg-gradient-to-r from-red-400 via-white to-blue-400 bg-clip-text text-transparent leading-none flex items-center justify-center"
            style={{ ...teko, letterSpacing: 0, transform: 'translateY(0.5px)' }}
          >
            VS
          </span>
        </div>
      </div>

      {/* BLUE — bottom (mobile) / right (desktop) */}
      <div className="md:flex-1 md:min-w-0">
      <SidePanel
        side={sides[1]}
        videoRef={blueVideoRef}
        panelRef={bluePanelRef}
        active={activeIdx === 1}
        progressPct={activeIdx === 1 ? progressPct : 0}
        secondsLeft={secondsLeft}
        onReady={() => setBlueReady(true)}
        loading={!blueReady}
        poster={bluePoster}
        onPoster={setBluePoster}
        started={blueStarted}
        onStarted={() => setBlueStarted(true)}
      />
      </div>
      </div>

      <p className="pt-2 px-4 text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em] md:hidden" style={teko}>
        15s per edit · auto-rotating
      </p>

      {/* ── Quick-tap emoji reactions (mobile) ── */}
      {fightId && (
        <div className="md:hidden relative px-3 pb-3 pt-1">
          {/* Floating burst layer */}
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 overflow-hidden">
            <AnimatePresence>
              {floats.map(f => (
                <motion.div
                  key={f.key}
                  initial={{ y: 0, opacity: 0, scale: 0.6 }}
                  animate={{ y: -90, opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.1, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  className="absolute bottom-0 text-3xl"
                  style={{ left: `${f.x}%` }}
                >
                  {f.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {REACTIONS.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => fireReaction(r.id)}
                className="relative flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] active:scale-95 active:bg-white/[0.07] transition-transform"
              >
                <span className="text-xl leading-none">{r.emoji}</span>
                {counts[r.id] > 0 && (
                  <span className="text-[11px] font-black tabular-nums text-white/85 leading-none" style={teko}>
                    {counts[r.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function SidePanel({
  side,
  videoRef,
  panelRef,
  active,
  progressPct,
  secondsLeft,
  onReady,
  loading,
  poster,
  onPoster,
  started,
  onStarted,
  fill = false,
}: {
  side: Side;
  videoRef: React.RefObject<HTMLVideoElement>;
  panelRef?: React.RefObject<HTMLDivElement>;
  active: boolean;
  progressPct: number;
  secondsLeft: number;
  onReady: () => void;
  loading: boolean;
  poster: string | null;
  onPoster: (dataUrl: string) => void;
  started: boolean;
  onStarted: () => void;
  fill?: boolean;
}) {
  const isVid = isVideo(side.url);
  const [loadError, setLoadError] = useState(false);
  const accent = side.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = side.color === "red" ? "text-red-400" : "text-blue-400";
  const ring = side.color === "red" ? "ring-red-500/60" : "ring-blue-500/60";

  useEffect(() => setLoadError(false), [side.url]);

  // Attach HLS (or native src) — required for Bunny Stream .m3u8 outside Safari.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVid) return;
    const detach = attachHlsSource(v, side.url, {
      onError: () => setLoadError(true),
    });
    return detach;
  }, [isVid, side.url, videoRef]);

  // Capture first frame to use as instant poster — eliminates the "black freeze" flash.
  const handleLoadedData = () => {
    onReady();
    const v = videoRef.current;
    if (!v || poster) return;
    try {
      const canvas = document.createElement("canvas");
      const w = v.videoWidth;
      const h = v.videoHeight;
      if (!w || !h) return;
      const max = 480;
      const scale = Math.min(1, max / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      onPoster(canvas.toDataURL("image/jpeg", 0.6));
    } catch {
      /* tainted canvas — skip */
    }
  };

  return (
    <div
      ref={panelRef}
      className={`relative ${fill ? "w-full h-full" : "aspect-square w-full"} overflow-hidden bg-black transition-opacity ${active ? `ring-2 ${ring} ring-inset` : fill ? "opacity-60" : "opacity-50"}`}
      style={{
        boxShadow: active
          ? side.color === 'red'
            ? 'inset 0 0 80px rgba(239,68,68,0.25)'
            : 'inset 0 0 80px rgba(59,130,246,0.25)'
          : undefined,
      }}
    >
      {isVid && poster && (
        <img
          src={poster}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full object-contain bg-black pointer-events-none transition-opacity duration-200 ${active && !loading ? "opacity-0" : "opacity-100"}`}
        />
      )}
      {isVid ? (
        <video
          key={side.url}
          ref={videoRef}
          className={`relative w-full h-full object-contain transition-opacity duration-200 ${active || !poster ? "opacity-100" : "opacity-0"}`}
          playsInline
          autoPlay={active}
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          disableRemotePlayback
          loop
          preload="auto"
          disablePictureInPicture
          controls={false}
          muted={!active}
          poster={poster || undefined}
          crossOrigin="anonymous"
          onLoadedData={handleLoadedData}
          onCanPlay={onReady}
          onCanPlayThrough={onReady}
          onPlaying={onStarted}
          onError={() => {
            console.error('[Bunny Video] Video element error:', side.url);
            setLoadError(true);
          }}
        />
      ) : (
        <img
          src={side.url}
          alt={`${side.username} edit`}
          className="w-full h-full object-contain bg-black"
          loading="eager"
          decoding="async"
          onLoad={onReady}
        />
      )}

      {/* Only show a spinner before metadata exists; playback starts as soon as the browser can decode. */}
      {loading && active && !poster && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full border-2 ${side.color === 'red' ? 'border-red-500/40 border-t-red-500' : 'border-blue-500/40 border-t-blue-500'} animate-spin`} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50" style={teko}>buffering</span>
          </div>
        </div>
      )}

      {loadError && active && (
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            setLoadError(false);
            v.load();
            v.play().catch(() => {});
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80"
        >
          <span className="text-xs font-black uppercase tracking-[0.18em] text-foreground" style={teko}>Tap to reload</span>
          <span className="text-[10px] text-muted-foreground">Network dropped this edit</span>
        </button>
      )}

      {/* Progress bar — only on active */}
      {active && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={`h-full ${accent} transition-all`}
            style={{ width: `${progressPct}%`, transitionDuration: "1000ms" }}
          />
        </div>
      )}

      {/* Top overlay */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] ${accentText}`} style={teko}>
            <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
            {side.color}
          </span>
          <span className="text-[11px] font-bold text-white">@{side.username}</span>
        </div>
        {active && (
          <span className="text-[11px] font-black text-white tabular-nums px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10" style={teko}>
            {secondsLeft}s
          </span>
        )}
      </div>
    </div>
  );
}

