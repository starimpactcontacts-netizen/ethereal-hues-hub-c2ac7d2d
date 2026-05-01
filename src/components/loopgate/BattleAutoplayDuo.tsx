import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 10;

type Side = {
  userId: string;
  username: string;
  url: string;
  color: "red" | "blue";
};

interface Props {
  red: Side;
  blue: Side;
  /** ISO timestamp the showcase started (for cross-viewer sync). Defaults to mount time. */
  startedAt?: string | null;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

/**
 * Two stacked square edits (RED top / BLUE bottom) with a VS divider.
 * Auto-plays one for 10s, then the other for 10s, on infinite loop.
 * Synced for all viewers using `startedAt` timestamp.
 */
export default function BattleAutoplayDuo({ red, blue, startedAt }: Props) {
  const sides: [Side, Side] = [red, blue];
  const startMsRef = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());
  const totalMs = sides.length * PER_EDIT_SECONDS * 1000;

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
  const [muted, setMuted] = useState(true);

  const redVideoRef = useRef<HTMLVideoElement>(null);
  const blueVideoRef = useRef<HTMLVideoElement>(null);

  // Tick — drive activeIdx + countdown
  useEffect(() => {
    const tick = () => {
      const { idx, left } = compute();
      setActiveIdx((prev) => (prev !== idx ? idx : prev));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  // Drive playback: active plays w/ sound (if user unmuted), inactive pauses
  useEffect(() => {
    const refs = [redVideoRef.current, blueVideoRef.current];
    refs.forEach((v, i) => {
      if (!v) return;
      v.muted = muted || i !== activeIdx;
      if (i === activeIdx) {
        v.currentTime = 0;
        v.play().catch(() => {
          // Autoplay blocked → fall back to muted
          v.muted = true;
          v.play().catch(() => {});
        });
      } else {
        v.pause();
      }
    });
  }, [activeIdx, muted]);

  const progressPct = ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100;

  return (
    <div className="space-y-0 select-none">
      {/* RED — top */}
      <SidePanel
        side={red}
        videoRef={redVideoRef}
        active={activeIdx === 0}
        progressPct={activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0}
        secondsLeft={secondsLeft}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
      />

      {/* VS divider */}
      <div className="relative h-8 flex items-center justify-center bg-black">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative px-3 py-0.5 bg-black border border-white/15">
          <span
            className="text-[14px] font-black tracking-[0.25em] bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent"
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
        active={activeIdx === 1}
        progressPct={activeIdx === 1 ? progressPct : 0}
        secondsLeft={secondsLeft}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
      />

      <p className="pt-2 text-[10px] text-center text-foreground/40 uppercase tracking-[0.2em]" style={teko}>
        10s per edit · auto-rotating
      </p>
    </div>
  );
}

function SidePanel({
  side,
  videoRef,
  active,
  progressPct,
  secondsLeft,
  muted,
  onToggleMute,
}: {
  side: Side;
  videoRef: React.RefObject<HTMLVideoElement>;
  active: boolean;
  progressPct: number;
  secondsLeft: number;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const isVid = isVideo(side.url);
  const accent = side.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = side.color === "red" ? "text-red-400" : "text-blue-400";
  const ring = side.color === "red" ? "ring-red-500/60" : "ring-blue-500/60";

  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-black border border-white/[0.06] ${active ? `ring-2 ${ring}` : "opacity-60"}`}>
      {isVid ? (
        <video
          ref={videoRef}
          src={side.url}
          className="w-full h-full object-cover"
          playsInline
          loop
          muted
          preload="auto"
        />
      ) : (
        <img src={side.url} alt={`${side.username} edit`} className="w-full h-full object-contain bg-black" />
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
        {active && isVid && (
          <button
            onClick={onToggleMute}
            className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-95"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
        )}
        {active && (
          <span className="text-[11px] font-black text-white tabular-nums px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10" style={teko}>
            {secondsLeft}s
          </span>
        )}
      </div>
    </div>
  );
}