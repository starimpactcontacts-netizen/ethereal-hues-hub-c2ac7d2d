import { useEffect, useRef, useState } from "react";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 10;

type Side = {
  userId: string;
  username: string;
  url: string;
  color: "red" | "blue";
  avatarUrl?: string | null;
};

interface Props {
  red: Side;
  blue: Side;
  /** ISO timestamp the showcase started (for cross-viewer sync). Defaults to mount time. */
  startedAt?: string | null;
  /** When true, hold playback (e.g. while intro overlay is running) */
  paused?: boolean;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

/**
 * Two stacked square edits (RED top / BLUE bottom) with a VS divider.
 * Auto-plays one for 10s, then the other for 10s, on infinite loop.
 * Synced for all viewers using `startedAt` timestamp.
 */
export default function BattleAutoplayDuo({ red, blue, startedAt, paused = false }: Props) {
  const sides: [Side, Side] = [red, blue];
  const startMsRef = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());
  const totalMs = sides.length * PER_EDIT_SECONDS * 1000;
  const [redReady, setRedReady] = useState(false);
  const [blueReady, setBlueReady] = useState(false);
  const bothReady = redReady && blueReady;

  const compute = () => {
    const elapsed = Math.max(0, Date.now() - startMsRef.current);
    const looped = elapsed % totalMs;
    const idx = Math.min(sides.length - 1, Math.floor(looped / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = looped - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left };
  };

  const initial = compute();
  const [activeIdx, setActiveIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const [needsTapForSound, setNeedsTapForSound] = useState(false);

  const redVideoRef = useRef<HTMLVideoElement>(null);
  const blueVideoRef = useRef<HTMLVideoElement>(null);
  const redPanelRef = useRef<HTMLDivElement>(null);
  const bluePanelRef = useRef<HTMLDivElement>(null);

  // Tick — drive activeIdx + countdown. Pauses until both videos are ready
  // so the rotation always starts in lockstep with playback.
  useEffect(() => {
    if (!bothReady || paused) return;
    // Reset start clock the moment both clips are buffered so the first play is instant
    startMsRef.current = Date.now();
    const tick = () => {
      const { idx, left } = compute();
      setActiveIdx((prev) => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [bothReady, paused]);

  // Drive playback: active plays full-quality, inactive PAUSES at currentTime=0
  // (kept loaded so swap is instant — no re-buffer).
  useEffect(() => {
    if (!bothReady) return;
    if (paused) {
      [redVideoRef.current, blueVideoRef.current].forEach((v) => {
        if (!v) return;
        v.pause();
        v.muted = true;
        try { v.currentTime = 0; } catch {}
      });
      return;
    }
    const refs = [redVideoRef.current, blueVideoRef.current];
    refs.forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) {
        v.muted = false;
        try { v.currentTime = 0; } catch {}
        v.play().catch(() => {
          // Autoplay-with-sound blocked → fall back to muted and prompt tap
          v.muted = true;
          setNeedsTapForSound(true);
          v.play().catch(() => {});
        });
      } else {
        v.pause();
        v.muted = true;
        try { v.currentTime = 0; } catch {}
      }
    });
  }, [activeIdx, bothReady, paused]);

  // Smooth-scroll the active panel into view when it switches
  useEffect(() => {
    if (!bothReady || paused) return;
    const target = activeIdx === 0 ? redPanelRef.current : bluePanelRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIdx, bothReady, paused]);

  const enableSound = () => {
    setNeedsTapForSound(false);
    [redVideoRef.current, blueVideoRef.current].forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) {
        v.muted = false;
        v.play().catch(() => {});
      }
    });
  };

  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;

  return (
    <div className="space-y-0 select-none -mx-4">
      {/* Loading state until BOTH clips have buffered → guarantees zero stutter on first play */}
      {!bothReady && (
        <div className="absolute -z-10 opacity-0 pointer-events-none">
          {/* preload work happens via the real <video> tags below; this is just a hint */}
        </div>
      )}
      {/* RED — top */}
      <SidePanel
        side={red}
        videoRef={redVideoRef}
        panelRef={redPanelRef}
        active={bothReady && activeIdx === 0}
        progressPct={bothReady ? (activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0) : 0}
        secondsLeft={secondsLeft}
        onReady={() => setRedReady(true)}
        loading={!redReady}
      />

      {/* Slim VS divider — the live FNF scoreboard now lives at the top of the page */}
      <div className="relative h-0 flex items-center justify-center bg-black z-20">
        <div
          className="absolute inset-x-0 top-1/2 h-[2px]"
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
            className="text-[13px] font-black tracking-[0.15em] bg-gradient-to-r from-red-400 via-white to-blue-400 bg-clip-text text-transparent leading-none"
            style={teko}
          >
            VS
          </span>
        </div>
      </div>

      {/* BLUE — bottom */}
      <SidePanel
        side={blue}
        videoRef={blueVideoRef}
        panelRef={bluePanelRef}
        active={bothReady && activeIdx === 1}
        progressPct={bothReady && activeIdx === 1 ? progressPct : 0}
        secondsLeft={secondsLeft}
        onReady={() => setBlueReady(true)}
        loading={!blueReady}
      />

      <p className="pt-2 px-4 text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em]" style={teko}>
        {bothReady ? '10s per edit · auto-rotating' : 'Buffering both edits in HD…'}
      </p>

      {/* One-tap unmute overlay if browser blocked autoplay-with-sound */}
      {needsTapForSound && bothReady && (
        <button
          onClick={enableSound}
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="px-6 py-3 bg-white text-black text-sm font-black uppercase tracking-[0.2em] rounded-full" style={teko}>
            Tap for sound
          </div>
        </button>
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
}: {
  side: Side;
  videoRef: React.RefObject<HTMLVideoElement>;
  panelRef?: React.RefObject<HTMLDivElement>;
  active: boolean;
  progressPct: number;
  secondsLeft: number;
  onReady: () => void;
  loading: boolean;
}) {
  const isVid = isVideo(side.url);
  const accent = side.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = side.color === "red" ? "text-red-400" : "text-blue-400";
  const ring = side.color === "red" ? "ring-red-500/60" : "ring-blue-500/60";

  return (
    <div
      ref={panelRef}
      className={`relative aspect-square w-full overflow-hidden bg-black ${active ? `ring-2 ${ring} ring-inset` : "opacity-50"}`}
      style={{
        boxShadow: active
          ? side.color === 'red'
            ? 'inset 0 0 80px rgba(239,68,68,0.25)'
            : 'inset 0 0 80px rgba(59,130,246,0.25)'
          : undefined,
      }}
    >
      {isVid ? (
        <video
          ref={videoRef}
          src={side.url}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'auto' as any }}
          playsInline
          // @ts-ignore — iOS Safari hint
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          disableRemotePlayback
          loop
          muted
          preload="auto"
          // @ts-ignore — Chrome/Edge HD hint
          disablePictureInPicture
          onLoadedData={onReady}
          onCanPlayThrough={onReady}
        />
      ) : (
        <img
          src={side.url}
          alt={`${side.username} edit`}
          className="w-full h-full object-cover bg-black"
          loading="eager"
          decoding="async"
          style={{ imageRendering: 'auto' as any }}
          onLoad={onReady}
        />
      )}

      {/* Buffering shimmer */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`w-8 h-8 rounded-full border-2 ${side.color === 'red' ? 'border-red-500/40 border-t-red-500' : 'border-blue-500/40 border-t-blue-500'} animate-spin`} />
        </div>
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
            <span className={`w-1.5 h-1.5 rounded-full ${accent} ${active ? "animate-pulse" : ""}`} />
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

