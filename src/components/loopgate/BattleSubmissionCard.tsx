import { ExternalLink, Play, Trophy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useThumbnail } from "@/hooks/useThumbnail";
import loopgateLogo from "@/assets/loopgate-logo.png";

function detectPlatform(url: string): string {
  if (!url) return "unknown";
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("capcut.com")) return "capcut";
  return "unknown";
}

/** Auto-generated branded fallback thumbnail */
function FallbackThumbnail({ username, color }: { username: string; color: "red" | "blue" }) {
  const gradientFrom = color === "red" ? "from-red-950" : "from-blue-950";
  const gradientTo = color === "red" ? "to-red-900/60" : "to-blue-900/60";
  const accentColor = color === "red" ? "text-red-400" : "text-blue-400";
  const borderColor = color === "red" ? "border-red-500/20" : "border-blue-500/20";

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex flex-col items-center justify-center gap-2 relative overflow-hidden`}>
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 60% 80%, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 40px 40px, 50px 50px",
        }}
      />
      {/* Logo */}
      <img src={loopgateLogo} alt="" className="w-8 h-8 opacity-40" />
      {/* Username */}
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
}

export default function BattleSubmissionCard({
  url, username, color, avatarUrl, customThumbnailUrl,
  score, isWinner, votes, onVote, hasVoted, canVote,
}: BattleSubmissionCardProps) {
  const platform = detectPlatform(url);
  const { thumbnail, loading: thumbLoading } = useThumbnail(url, platform);
  const platformLabel = platform === "tiktok" ? "TIKTOK" : platform === "youtube" ? "YOUTUBE" : platform === "instagram" ? "INSTAGRAM" : platform.toUpperCase();
  const borderColor = color === "red" ? "border-red-500/40" : "border-blue-500/40";
  const hoverBorder = color === "red" ? "hover:border-red-500/70" : "hover:border-blue-500/70";
  const accentBg = color === "red" ? "bg-red-500/20" : "bg-blue-500/20";
  const accentText = color === "red" ? "text-red-400" : "text-blue-400";

  // Priority: custom thumbnail > auto-pulled > fallback
  const displayThumb = customThumbnailUrl || thumbnail;

  return (
    <div className={`bg-surface-1 border ${borderColor} ${hoverBorder} transition-all overflow-hidden ${isWinner ? "ring-2 ring-gold/50" : ""}`}>
      {/* Thumbnail */}
      <a href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-[16/9] bg-surface-2 overflow-hidden group">
        {displayThumb ? (
          <img src={displayThumb} alt={`${username}'s edit`} className="w-full h-full object-cover" />
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
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Platform badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5">
          <span className="text-[8px] font-bold text-white uppercase tracking-wider">{platformLabel}</span>
        </div>

        {/* Score badge */}
        {score != null && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1">
            <span className="text-sm font-bold text-gold">{score}</span>
            <span className="text-[8px] text-gold/70 ml-0.5 uppercase">QOI</span>
          </div>
        )}

        {/* Winner crown */}
        {isWinner && (
          <div className="absolute top-2 left-2 bg-gold px-2 py-0.5 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-black" />
            <span className="text-[8px] font-bold text-black uppercase">Winner</span>
          </div>
        )}
      </a>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 border border-border">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className={`${accentBg} ${accentText} text-[8px] font-bold`}>
              {username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground">@{username}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Vote button */}
          {canVote && onVote && (
            <button
              onClick={(e) => { e.preventDefault(); onVote(); }}
              className={`flex items-center gap-1 px-2 py-0.5 transition-all ${
                hasVoted ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-surface-2 border border-border hover:border-emerald-500/40"
              }`}
            >
              <ThumbsUp className={`w-3 h-3 ${hasVoted ? "text-emerald-400" : "text-muted-foreground"}`} />
              {votes != null && votes > 0 && (
                <span className={`text-[9px] font-bold ${hasVoted ? "text-emerald-400" : "text-muted-foreground"}`}>{votes}</span>
              )}
            </button>
          )}
          {!canVote && votes != null && votes > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-2 border border-border">
              <ThumbsUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-bold text-muted-foreground">{votes}</span>
            </div>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
