import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { getBunnyPlaybackCandidates, getBunnyPlaybackUrl, isBunnyVideoUrl } from "@/lib/bunnyPlayback";

const teko = { fontFamily: "Teko, sans-serif" };

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
  redScore?: number;
  blueScore?: number;
  fightId?: string | null;
  startedAt?: string | null;
  paused?: boolean;
}

function isVideo(url: string) {
  return isBunnyVideoUrl(url);
}

export default function BattleAutoplayDuo({ red, blue, redScore = 0, blueScore = 0 }: Props) {
  const sides = useMemo<[Side, Side]>(() => [
    { ...red, url: getBunnyPlaybackUrl(red.url) },
    { ...blue, url: getBunnyPlaybackUrl(blue.url) },
  ], [red, blue]);

  const total = redScore + blueScore;
  const redPct  = total > 0 ? (redScore  / total) * 100 : 50;
  const bluePct = total > 0 ? (blueScore / total) * 100 : 50;

  return (
    <div className="select-none -mx-4 md:-mx-0 bg-black overflow-hidden">
      {/* ── TikTok-style battle HUD ── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 bg-black">
        {/* Red player */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div
            className="w-10 h-10 overflow-hidden border-2 border-red-500 bg-zinc-900"
            style={{ boxShadow: '0 0 14px rgba(239,68,68,0.65)' }}
          >
            {red.avatarUrl
              ? <img src={red.avatarUrl} alt={red.username} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-black text-red-400 text-sm">{red.username[0]?.toUpperCase()}</div>}
          </div>
          <span className="text-[8px] font-bold text-white/75 max-w-[48px] truncate">@{red.username}</span>
        </div>

        {/* Score bars */}
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[11px] font-black text-red-400 tabular-nums w-4 text-right">{redScore}</span>
          {/* Red bar — fills right-to-left */}
          <div className="flex-1 h-2.5 rounded-full overflow-hidden relative bg-red-950/60">
            <div
              className="absolute right-0 top-0 bottom-0 rounded-full transition-all duration-700"
              style={{ width: `${redPct}%`, background: 'linear-gradient(90deg, #b91c1c, #ef4444)' }}
            />
          </div>
          {/* Blue bar — fills left-to-right */}
          <div className="flex-1 h-2.5 rounded-full overflow-hidden relative bg-blue-950/60">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700"
              style={{ width: `${bluePct}%`, background: 'linear-gradient(270deg, #1d4ed8, #3b82f6)' }}
            />
          </div>
          <span className="text-[11px] font-black text-blue-400 tabular-nums w-4">{blueScore}</span>
        </div>

        {/* Blue player */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div
            className="w-10 h-10 overflow-hidden border-2 border-blue-500 bg-zinc-900"
            style={{ boxShadow: '0 0 14px rgba(59,130,246,0.65)' }}
          >
            {blue.avatarUrl
              ? <img src={blue.avatarUrl} alt={blue.username} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-black text-blue-400 text-sm">{blue.username[0]?.toUpperCase()}</div>}
          </div>
          <span className="text-[8px] font-bold text-white/75 max-w-[48px] truncate">@{blue.username}</span>
        </div>
      </div>

      {/* ── Videos — always side by side ── */}
      <div className="relative flex flex-row items-stretch h-[calc(100svh-260px)] min-h-[300px] max-h-[700px]">
        <div className="flex-1 min-w-0 relative bg-black">
          <BattleVideoSlot side={sides[0]} />
        </div>
        {/* Center divider glow */}
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none z-20"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.18) 80%, transparent 100%)' }}
        />
        <div className="flex-1 min-w-0 relative bg-black">
          <BattleVideoSlot side={sides[1]} />
        </div>
      </div>
    </div>
  );
}

function BattleVideoSlot({ side }: { side: Side }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const isVid = isVideo(side.url);
  const sources = useMemo(() => getBunnyPlaybackCandidates(side.url), [side.url]);
  const activeSrc = sources[sourceIndex] || side.url;
  const isRed = side.color === "red";
  const accentHex = isRed ? "#ef4444" : "#3b82f6";
  const accentGlow = isRed ? "rgba(239,68,68,0.55)" : "rgba(59,130,246,0.55)";

  useEffect(() => {
    const video = videoRef.current;
    setIsPlaying(false);
    setLoadError(false);
    setSourceIndex(0);
    setProgress(0);
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, [side.url]);

  useEffect(() => {
    if (!showControls) return;
    const t = setTimeout(() => setShowControls(false), 2200);
    return () => clearTimeout(t);
  }, [showControls, isPlaying, muted]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        video.muted = muted;
        video.volume = 1;
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
      setShowControls(true);
    } catch (error) {
      console.warn("[Bunny Video] tap-to-play blocked:", side.url, error);
    }
  };

  const handleVideoError = () => {
    setIsPlaying(false);
    setSourceIndex((current) => {
      const next = current + 1;
      if (next < sources.length) return next;
      setLoadError(true);
      return current;
    });
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (video) video.muted = nextMuted;
    setShowControls(true);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
    setShowControls(true);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black group"
      onClick={() => setShowControls((s) => !s)}
    >
      {isVid ? (
        <video
          ref={videoRef}
          src={activeSrc}
          poster={side.posterUrl || `${activeSrc}#t=0.1`}
          className="w-full h-full object-cover bg-black"
          muted={muted}
          playsInline
          loop
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
        />
      ) : (
        <img
          src={side.url}
          alt={`${side.username} edit`}
          className="w-full h-full object-cover bg-black"
          loading="eager"
          decoding="async"
        />
      )}

      {/* Tap-to-play button */}
      {isVid && !isPlaying && !loadError && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 z-20 flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label={`Play ${side.username}'s edit`}
        >
          <span
            className="relative w-10 h-10 rounded-md flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${accentHex}`,
              boxShadow: `0 0 12px ${accentGlow}`,
            }}
          >
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </span>
        </button>
      )}

      {/* Playback controls (brief on tap) */}
      {isVid && isPlaying && (
        <div
          className={`absolute bottom-1.5 left-1.5 right-1.5 z-20 flex items-end justify-between gap-2 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={togglePlay}
            className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
            style={{ boxShadow: `0 0 8px ${accentGlow}` }}
          >
            <Pause className="w-2.5 h-2.5 text-white fill-white" />
          </button>
          <button type="button" onClick={toggleMute}
            className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
            style={{ boxShadow: `0 0 8px ${accentGlow}` }}
          >
            {muted ? <VolumeX className="w-2.5 h-2.5 text-white" /> : <Volume2 className="w-2.5 h-2.5 text-white" />}
          </button>
        </div>
      )}

      {/* Mute toggle when paused */}
      {isVid && !isPlaying && !loadError && (
        <button type="button"
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-md bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
        >
          {muted ? <VolumeX className="w-2.5 h-2.5 text-white/90" /> : <Volume2 className="w-2.5 h-2.5 text-white/90" />}
        </button>
      )}

      {/* Progress bar */}
      {isVid && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-1 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleScrub(e); }}>
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute inset-y-0 left-0 transition-[width] duration-150"
            style={{ width: `${progress}%`, background: accentHex, boxShadow: `0 0 8px ${accentGlow}` }} />
        </div>
      )}

      {/* Edit Submitted overlay on load error */}
      {loadError && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.90) 100%)' }}
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ border: `1px solid ${accentHex}`, background: 'rgba(0,0,0,0.55)', boxShadow: `0 0 18px ${accentGlow}` }}>
            <span className="text-2xl select-none leading-none">✓</span>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white" style={teko}>Edit Submitted</p>
            <p className="text-[8px] text-white/35 tracking-widest mt-0.5">@{side.username}</p>
          </div>
        </div>
      )}

      {/* Subtle username label at bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <span
          className="text-[9px] font-bold text-white/60 px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          @{side.username}
        </span>
      </div>
    </div>
  );
}
