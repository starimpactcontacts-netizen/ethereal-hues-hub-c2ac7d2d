import { ExternalLink, Play, Trophy, ThumbsUp } from "lucide-react";
import { useThumbnail } from "@/hooks/useThumbnail";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { getBunnyPlaybackUrl } from "@/lib/bunnyPlayback";

function detectPlatform(url: string): string {
  if (!url) return "unknown";
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("capcut.com")) return "capcut";
  return "unknown";
}

function FallbackThumbnail({ username, color }: { username: string; color: "red" | "blue" }) {
  const gradientFrom = color === "red" ? "from-red-950" : "from-blue-950";
  const gradientTo = color === "red" ? "to-red-900/60" : "to-blue-900/60";
  const accentColor = color === "red" ? "text-red-400" : "text-blue-400";
  const borderColor = color === "red" ? "border-red-500/20" : "border-blue-500/20";

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex flex-col items-center justify-center gap-2 relative overflow-hidden`}>
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 60% 80%, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 40px 40px, 50px 50px",
        }}
      />
      <img src={loopgateLogo} alt="" className="w-8 h-8 opacity-40" />
      <div className={`border ${borderColor} px-3 py-1 backdrop-blur-sm bg-black/20`}>
        <span className={`text-xs font-display uppercase tracking-wider ${accentColor}`}>
          @{username}
        </span>
      </div>
    </div>
  );
}

interface BattleSubmissionCardProps {
  url: string;
  username: string;
  color: "red" | "blue";
  avatarUrl?: string | null;
  customThumbnailUrl?: string | null;
  score?: number | null;
  isWinner?: boolean;
  votes?: number;
  onVote?: () => void;
  hasVoted?: boolean;
  canVote?: boolean;
  aspectClass?: string;
}

export default function BattleSubmissionCard({
  url, username, color, customThumbnailUrl,
  score, isWinner, votes, onVote, hasVoted, canVote, aspectClass = 'aspect-[9/16]',
}: BattleSubmissionCardProps) {
  const playbackUrl = getBunnyPlaybackUrl(url);
  const platform = detectPlatform(playbackUrl);
  const { thumbnail, loading: thumbLoading } = useThumbnail(playbackUrl, platform);
  const platformLabel = platform === "tiktok" ? "TIKTOK" : platform === "youtube" ? "YOUTUBE" : platform === "instagram" ? "INSTAGRAM" : platform.toUpperCase();
  const borderColor = color === "red" ? "border-red-500/40" : "border-blue-500/40";
  const hoverBorder = color === "red" ? "hover:border-red-500/70" : "hover:border-blue-500/70";

  const displayThumb = customThumbnailUrl || thumbnail;

  return (
    <div className={`bg-surface-1 border ${borderColor} ${hoverBorder} transition-all overflow-hidden ${isWinner ? "ring-2 ring-gold/50" : ""}`}>
      {/* Tall 9:16 — the EDIT is the entire card. Minimal overlay only. */}
      <a href={playbackUrl} target="_blank" rel="noopener noreferrer" className={`block relative ${aspectClass} bg-surface-2 overflow-hidden group`}>
        {displayThumb ? (
          <img src={displayThumb} alt={`${username}'s edit`} className="w-full h-full object-contain bg-black" loading="eager" decoding="async" />
        ) : thumbLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Play className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1 animate-pulse" />
              <span className="text-[8px] text-muted-foreground/50 uppercase">Loading...</span>
            </div>
          </div>
        ) : (
          <FallbackThumbnail username={username} color={color} />
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Platform badge — hide for direct uploads (no meaningful platform) */}
        {platform !== "unknown" && (
          <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5">
            <span className="text-[8px] font-bold text-white uppercase tracking-wider">{platformLabel}</span>
          </div>
        )}

        {/* Score badge */}
        {score != null && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5">
            <span className="text-xs font-bold text-gold">{score}</span>
            <span className="text-[8px] text-gold/70 ml-0.5 uppercase">QOI</span>
          </div>
        )}

        {/* Winner crown */}
        {isWinner && (
          <div className="absolute top-1.5 left-1.5 bg-gold px-1.5 py-0.5 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-black" />
            <span className="text-[8px] font-bold text-black uppercase">Winner</span>
          </div>
        )}

        {/* Bottom gradient + minimal username/vote overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-white truncate drop-shadow">@{username}</span>
          <div className="flex items-center gap-1 shrink-0">
            {canVote && onVote ? (
              <button
                onClick={(e) => { e.preventDefault(); onVote(); }}
                className={`flex items-center gap-1 px-1.5 py-0.5 backdrop-blur-sm transition-all ${
                  hasVoted ? "bg-emerald-500/30 border border-emerald-400/60" : "bg-black/50 border border-white/20"
                }`}
              >
                <ThumbsUp className={`w-2.5 h-2.5 ${hasVoted ? "text-emerald-300" : "text-white"}`} />
                {votes != null && votes > 0 && (
                  <span className={`text-[9px] font-bold ${hasVoted ? "text-emerald-300" : "text-white"}`}>{votes}</span>
                )}
              </button>
            ) : votes != null && votes > 0 ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm border border-white/20">
                <ThumbsUp className="w-2.5 h-2.5 text-white" />
                <span className="text-[9px] font-bold text-white">{votes}</span>
              </div>
            ) : null}
            <ExternalLink className="w-3 h-3 text-white/70" />
          </div>
        </div>
      </a>
    </div>
  );
}
