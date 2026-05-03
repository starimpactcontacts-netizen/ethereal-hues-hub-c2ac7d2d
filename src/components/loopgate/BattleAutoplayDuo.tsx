import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  /** If supplied, fetches live vote counts for the FNF-style health bar. */
  fightId?: string | null;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

/**
 * Two stacked square edits (RED top / BLUE bottom) with a VS divider.
 * Auto-plays one for 10s, then the other for 10s, on infinite loop.
 * Synced for all viewers using `startedAt` timestamp.
 */
export default function BattleAutoplayDuo({ red, blue, startedAt, fightId }: Props) {
  const sides: [Side, Side] = [red, blue];
  const startMsRef = useRef<number>(startedAt ? new Date(startedAt).getTime() : Date.now());
  const totalMs = sides.length * PER_EDIT_SECONDS * 1000;
  const [redReady, setRedReady] = useState(false);
  const [blueReady, setBlueReady] = useState(false);
  const bothReady = redReady && blueReady;

  // Live vote counts (FNF-style health bar)
  const [redVotes, setRedVotes] = useState(0);
  const [blueVotes, setBlueVotes] = useState(0);
  useEffect(() => {
    if (!fightId) return;
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('quick_fight_votes')
        .select('voted_for')
        .eq('fight_id', fightId);
      if (!data) return;
      let r = 0, b = 0;
      for (const v of data) {
        if (v.voted_for === red.userId) r++;
        else if (v.voted_for === blue.userId) b++;
      }
      setRedVotes(r);
      setBlueVotes(b);
    };
    fetchVotes();
    const ch = supabase
      .channel(`bduo_votes_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_votes', filter: `fight_id=eq.${fightId}` }, fetchVotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, red.userId, blue.userId]);

  const totalVotes = redVotes + blueVotes;
  // FNF-style: red on the LEFT side of the bar, blue on the RIGHT.
  // When votes are tied (or empty) the bar sits at 50/50.
  const redBarPct = totalVotes === 0 ? 50 : (redVotes / totalVotes) * 100;
  const leading: 'red' | 'blue' | null =
    totalVotes === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? 'red' : 'blue';

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

  // Tick — drive activeIdx + countdown. Pauses until both videos are ready
  // so the rotation always starts in lockstep with playback.
  useEffect(() => {
    if (!bothReady) return;
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
  }, [bothReady]);

  // Drive playback: active plays full-quality, inactive PAUSES at currentTime=0
  // (kept loaded so swap is instant — no re-buffer).
  useEffect(() => {
    if (!bothReady) return;
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
  }, [activeIdx, bothReady]);

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
        active={bothReady && activeIdx === 0}
        progressPct={bothReady ? (activeIdx === 0 ? progressPct : activeIdx > 0 ? 100 : 0) : 0}
        secondsLeft={secondsLeft}
        onReady={() => setRedReady(true)}
        loading={!redReady}
      />

      {/* FNF-style scoreboard divider — avatars on each side, live vote health bar in the middle */}
      <FNFScoreboard
        red={red}
        blue={blue}
        redVotes={redVotes}
        blueVotes={blueVotes}
        redBarPct={redBarPct}
        leading={leading}
        activeSide={bothReady ? (activeIdx === 0 ? 'red' : 'blue') : null}
      />

      {/* BLUE — bottom */}
      <SidePanel
        side={blue}
        videoRef={blueVideoRef}
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
  active,
  progressPct,
  secondsLeft,
  onReady,
  loading,
}: {
  side: Side;
  videoRef: React.RefObject<HTMLVideoElement>;
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

function FNFScoreboard({
  red,
  blue,
  redVotes,
  blueVotes,
  redBarPct,
  leading,
  activeSide,
}: {
  red: Side;
  blue: Side;
  redVotes: number;
  blueVotes: number;
  redBarPct: number;
  leading: 'red' | 'blue' | null;
  activeSide: 'red' | 'blue' | null;
}) {
  const total = redVotes + blueVotes;
  const blueBarPct = 100 - redBarPct;

  const Avatar = ({ side }: { side: Side }) => {
    const isRed = side.color === 'red';
    const ring = isRed ? 'ring-red-500' : 'ring-blue-500';
    const glow = isRed
      ? '0 0 14px rgba(239,68,68,0.7)'
      : '0 0 14px rgba(59,130,246,0.7)';
    const isActive = activeSide === side.color;
    return (
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-full overflow-hidden bg-black ring-2 ${ring} ${isActive ? 'animate-pulse' : ''}`}
          style={{ boxShadow: glow }}
        >
          {side.avatarUrl ? (
            <img src={side.avatarUrl} alt={side.username} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-white text-sm font-black ${isRed ? 'bg-red-500/30' : 'bg-blue-500/30'}`} style={teko}>
              {side.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-black z-20 px-3 py-2 border-y border-white/10">
      <div className="flex items-center gap-2">
        {/* RED avatar (left) */}
        <Avatar side={red} />

        {/* Health bar */}
        <div className="relative flex-1 h-7">
          {/* Bar track */}
          <div className="absolute inset-0 rounded-full overflow-hidden border border-white/15 bg-black/80 flex">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${redBarPct}%`,
                background:
                  'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: 'inset 0 0 12px rgba(239,68,68,0.6)',
              }}
            />
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${blueBarPct}%`,
                background:
                  'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: 'inset 0 0 12px rgba(59,130,246,0.6)',
              }}
            />
          </div>

          {/* Vote counts on the bar */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            <span
              className="text-[12px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {redVotes}
            </span>
            <span
              className="text-[12px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
            >
              {blueVotes}
            </span>
          </div>

          {/* Center VS chip — perfectly centered on the bar */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-9 h-9 rounded-full bg-black flex items-center justify-center"
              style={{
                border: '1.5px solid rgba(255,255,255,0.3)',
                boxShadow:
                  '0 0 14px rgba(0,0,0,0.9), 0 0 18px rgba(239,68,68,0.35), 0 0 18px rgba(59,130,246,0.35)',
              }}
            >
              <span
                className="text-[13px] font-black tracking-[0.12em] bg-gradient-to-r from-red-400 via-white to-blue-400 bg-clip-text text-transparent leading-none"
                style={teko}
              >
                VS
              </span>
            </div>
          </div>
        </div>

        {/* BLUE avatar (right) */}
        <Avatar side={blue} />
      </div>

      {/* Sub-row: tiny labels */}
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 truncate max-w-[35%]" style={teko}>
          @{red.username}
        </span>
        <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-500 tabular-nums" style={teko}>
          {total === 0 ? 'NO VOTES YET' : `${total} ${total === 1 ? 'VOTE' : 'VOTES'}${leading ? ` · ${leading.toUpperCase()} LEADS` : ''}`}
        </span>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 truncate max-w-[35%] text-right" style={teko}>
          @{blue.username}
        </span>
      </div>
    </div>
  );
}