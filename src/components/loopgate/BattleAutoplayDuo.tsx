import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
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
  fightId?: string | null;
  startedAt?: string | null;
  paused?: boolean;
}

function isVideo(url: string) {
  return isBunnyVideoUrl(url);
}

export default function BattleAutoplayDuo({ red, blue }: Props) {
  const sides = useMemo<[Side, Side]>(() => [
    { ...red, url: getBunnyPlaybackUrl(red.url) },
    { ...blue, url: getBunnyPlaybackUrl(blue.url) },
  ], [red, blue]);

  return (
    <div className="select-none -mx-4 md:-mx-0 bg-black">
      <div className="md:flex md:items-stretch md:gap-0 relative">
        <div className="md:flex-1 md:min-w-0">
          <BattleVideoSlot side={sides[0]} fill />
        </div>

        {/* Center VS chip — game HUD style */}
        <div className="relative h-0 md:h-auto md:w-0 flex items-center justify-center z-30">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-md opacity-80"
                style={{ background: "radial-gradient(circle, rgba(239,68,68,0.6), rgba(59,130,246,0.6))" }}
              />
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                style={{ background: "linear-gradient(135deg, #ef4444 0%, #1a1a1a 50%, #3b82f6 100%)" }}
              >
                <span className="text-[11px] font-black tracking-[0.15em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" style={teko}>
                  VS
                </span>
              </div>
            </div>
          </div>
          {/* Hairline divider */}
          <div
            className="absolute inset-x-0 top-0 h-px md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.9), #fff, rgba(59,130,246,0.9), transparent)" }}
          />
        </div>

        <div className="md:flex-1 md:min-w-0">
          <BattleVideoSlot side={sides[1]} fill />
        </div>
      </div>
    </div>
  );
}

function BattleVideoSlot({ side, fill = false }: { side: Side; fill?: boolean }) {
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
  const label = isRed ? "RED" : "BLUE";

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

  // Auto-hide controls after a tap
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
        console.info("[Bunny Video] Battle playing direct Bunny CDN:", activeSrc);
      } else {
        video.pause();
        setIsPlaying(false);
      }
      setShowControls(true);
    } catch (error) {
      console.warn("[Bunny Video] Battle tap-to-play blocked:", side.url, error);
    }
  };

  const handleVideoError = () => {
    console.warn("[Bunny Video] Battle direct video error:", activeSrc, videoRef.current?.error?.code || "unknown");
    setIsPlaying(false);
    setSourceIndex((current) => {
      const next = current + 1;
      if (next < sources.length) {
        console.info("[Bunny Video] Battle trying fallback source:", sources[next]);
        return next;
      }
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
      className={`relative ${fill ? "w-full aspect-[9/12] md:aspect-square" : "aspect-square w-full"} overflow-hidden bg-black group`}
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
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedData={() => console.info("[Bunny Video] Battle loadeddata:", activeSrc)}
          onCanPlay={() => console.info("[Bunny Video] Battle canplay:", activeSrc)}
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

      {/* Initial play tap target — minimal game icon */}
      {isVid && !isPlaying && !loadError && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 z-20 flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label={`Play ${side.username}'s edit`}
        >
          <span
            className="relative w-12 h-12 rounded-md flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${accentHex}`,
              boxShadow: `0 0 18px ${accentGlow}, inset 0 0 0 1px rgba(255,255,255,0.08)`,
            }}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </span>
        </button>
      )}

      {/* Tiny game-icon HUD — shows briefly on tap */}
      {isVid && isPlaying && (
        <div
          className={`absolute bottom-2 left-2 right-2 z-20 flex items-end justify-between gap-2 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
            style={{ boxShadow: `0 0 8px ${accentGlow}` }}
            aria-label="Pause"
          >
            <Pause className="w-3 h-3 text-white fill-white" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
            style={{ boxShadow: `0 0 8px ${accentGlow}` }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3 h-3 text-white" /> : <Volume2 className="w-3 h-3 text-white" />}
          </button>
        </div>
      )}

      {/* Always-on tiny mute toggle when paused but loaded */}
      {isVid && !isPlaying && !loadError && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-md bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center active:scale-90"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-3 h-3 text-white/90" /> : <Volume2 className="w-3 h-3 text-white/90" />}
        </button>
      )}

      {/* Slim accent progress bar — game-style */}
      {isVid && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 h-1 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleScrub(e); }}
        >
          <div className="absolute inset-0 bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-150"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentHex}, ${accentHex})`,
              boxShadow: `0 0 8px ${accentGlow}`,
            }}
          />
        </div>
      )}

      {loadError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (!video) return;
            setLoadError(false);
            setSourceIndex(0);
            video.load();
          }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/85"
        >
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white" style={teko}>Tap to reload</span>
        </button>
      )}

      {/* Top corner game-tag — minimal, doesn't cover edit */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <span
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-[0.22em] text-white"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${accentHex}`,
            boxShadow: `0 0 8px ${accentGlow}`,
            ...teko,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accentHex, boxShadow: `0 0 6px ${accentHex}` }}
          />
          {label}
        </span>
        <span className="text-[10px] font-bold text-white/90 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          @{side.username}
        </span>
      </div>
    </div>
  );
}
