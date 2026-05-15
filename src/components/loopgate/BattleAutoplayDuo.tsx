import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { getBunnyPlaybackUrl, isBunnyVideoUrl } from "@/lib/bunnyPlayback";

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
    <div className="select-none -mx-4 md:-mx-0 bg-background">
      <div className="md:hidden flex items-center justify-between gap-2 px-3 pt-2 pb-1.5 bg-background border-b border-border/30">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground" style={teko}>
          Battle Showcase
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground tabular-nums" style={teko}>
          @{sides[0].username}<span className="text-muted-foreground/50"> vs </span>@{sides[1].username}
        </span>
      </div>

      <div className="md:flex md:items-stretch md:gap-0">
        <div className="md:flex-1 md:min-w-0">
          <BattleVideoSlot side={sides[0]} fill />
        </div>

        <div className="relative h-8 md:h-auto md:w-0 flex items-center justify-center bg-background z-20">
          <div
            className="absolute inset-x-0 top-1/2 h-px md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.7), #fff, rgba(59,130,246,0.7), transparent)" }}
          />
          <div className="relative px-3 py-0.5 bg-background border border-border/60">
            <span
              className="text-[14px] font-black tracking-[0.25em] text-foreground"
              style={teko}
            >
              VS
            </span>
          </div>
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
  const isVid = isVideo(side.url);
  const accent = side.color === "red" ? "bg-red-500" : "bg-blue-500";
  const accentText = side.color === "red" ? "text-red-400" : "text-blue-400";
  const label = side.color === "red" ? "RED" : "BLUE";

  useEffect(() => {
    const video = videoRef.current;
    setIsPlaying(false);
    setLoadError(false);
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, [side.url]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        video.muted = muted;
        video.volume = 1;
        await video.play();
        setIsPlaying(true);
        console.info("[Bunny Video] Battle playing direct Bunny CDN:", side.url);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.warn("[Bunny Video] Battle tap-to-play blocked:", side.url, error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (video) video.muted = nextMuted;
  };

  return (
    <div className={`relative ${fill ? "w-full aspect-[16/10] md:aspect-square" : "aspect-square w-full"} overflow-hidden bg-background`}>
      {isVid ? (
        <video
          ref={videoRef}
          src={side.url}
          poster={side.posterUrl || `${side.url}#t=0.1`}
          className="w-full h-full object-cover bg-background"
          controls
          muted={muted}
          playsInline
          loop
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedData={() => console.info("[Bunny Video] Battle loadeddata:", side.url)}
          onCanPlay={() => console.info("[Bunny Video] Battle canplay:", side.url)}
          onError={() => {
            console.warn("[Bunny Video] Battle direct video error:", side.url, videoRef.current?.error?.code || "unknown");
            setLoadError(true);
          }}
        />
      ) : (
        <img
          src={side.url}
          alt={`${side.username} edit`}
          className="w-full h-full object-contain bg-background"
          loading="eager"
          decoding="async"
        />
      )}

      {isVid && !isPlaying && !loadError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/10 active:scale-[0.99] transition-transform"
          aria-label={`Play ${side.username}'s edit`}
        >
          <span className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-xl border border-border/70 flex items-center justify-center shadow-2xl shadow-background/60">
            <Play className="w-7 h-7 text-foreground fill-current ml-1" />
          </span>
        </button>
      )}

      {isVid && isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-3 left-3 z-20 w-10 h-10 rounded-full bg-background/70 backdrop-blur-xl border border-border/60 flex items-center justify-center active:scale-95"
          aria-label="Pause edit"
        >
          <Pause className="w-4 h-4 text-foreground" />
        </button>
      )}

      {isVid && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-background/70 backdrop-blur-xl border border-border/60 flex items-center justify-center active:scale-95"
          aria-label={muted ? "Unmute edit" : "Mute edit"}
        >
          {muted ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
        </button>
      )}

      {loadError && (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            setLoadError(false);
            video.load();
          }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/85"
        >
          <span className="text-xs font-black uppercase tracking-[0.18em] text-foreground" style={teko}>Tap to reload</span>
          <span className="text-[10px] text-muted-foreground">Direct Bunny CDN video</span>
        </button>
      )}

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-background/80 to-transparent p-2 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] ${accentText}`} style={teko}>
            <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
            {label}
          </span>
          <span className="text-[11px] font-bold text-foreground truncate">@{side.username}</span>
        </div>
      </div>
    </div>
  );
}
