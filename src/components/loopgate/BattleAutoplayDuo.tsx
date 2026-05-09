import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 15;

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
  const sides = useMemo<[Side, Side]>(() => [red, blue], [red, blue]);
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

  const redVideoRef = useRef<HTMLVideoElement>(null);
  const blueVideoRef = useRef<HTMLVideoElement>(null);
  const redPanelRef = useRef<HTMLDivElement>(null);
  const bluePanelRef = useRef<HTMLDivElement>(null);

  // Tick immediately instead of waiting for both videos to fully buffer.
  useEffect(() => {
    if (!tickEnabled) return;
    const tick = () => {
      const { idx, left } = compute();
      setActiveIdx((prev) => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [compute, tickEnabled]);

  // Preload both videos immediately; only the active edit decodes/plays to avoid mobile lag.
  useEffect(() => {
    [redVideoRef.current, blueVideoRef.current].forEach((v, i) => {
      if (!v) return;
      v.muted = !(audioUnlocked && i === activeIdx);
      v.defaultMuted = false;
      v.volume = i === activeIdx ? 1 : 0;
      v.preload = "auto";
      v.load();
    });
  }, [red.url, blue.url, activeIdx, audioUnlocked]);

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
        return;
      }
      v.play().catch(() => {
        v.muted = true;
        v.play().catch((error) => { void error; });
      });
    });
  }, [activeIdx, audioUnlocked, paused]);

  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;

  return (
    <div className="space-y-0 select-none -mx-4 md:flex md:items-stretch md:gap-0 md:-mx-0">
      {/* RED — top (mobile) / left (desktop) */}
      <div className="md:flex-1 md:min-w-0">
      <SidePanel
        side={red}
        videoRef={redVideoRef}
        panelRef={redPanelRef}
        active={activeIdx === 0}
        progressPct={activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0}
        secondsLeft={secondsLeft}
        onReady={() => setRedReady(true)}
        loading={!redReady}
      />
      </div>

      {/* Slim VS divider — horizontal on mobile, vertical on desktop */}
      <div className="relative h-0 md:h-auto md:w-0 flex items-center justify-center bg-black z-20">
        <div
          className="absolute inset-x-0 top-1/2 h-[2px] md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-[2px]"
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
        side={blue}
        videoRef={blueVideoRef}
        panelRef={bluePanelRef}
        active={activeIdx === 1}
        progressPct={activeIdx === 1 ? progressPct : 0}
        secondsLeft={secondsLeft}
        onReady={() => setBlueReady(true)}
        loading={!blueReady}
      />
      </div>

      <p className="pt-2 px-4 text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em] md:hidden" style={teko}>
        15s per edit · auto-rotating
      </p>

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
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          disableRemotePlayback
          loop
          preload="auto"
          disablePictureInPicture
          controls={false}
          onLoadStart={onReady}
          onLoadedMetadata={onReady}
          onLoadedData={onReady}
          onCanPlay={onReady}
          onCanPlayThrough={onReady}
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
      {loading && active && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
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

