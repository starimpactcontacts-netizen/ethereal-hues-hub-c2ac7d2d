import { Link } from "react-router-dom";
import { Play, Trophy, Swords, Gavel, Zap, Target } from "lucide-react";
import loopgateWordmark from "@/assets/loopgate-wordmark.png";
import { useRecentSubmissions, RecentSubmission } from "@/hooks/useRecentSubmissions";
import { useThumbnail } from "@/hooks/useThumbnail";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Color palettes for no-thumbnail cells — cycles through these
const CELL_PALETTES = [
  { bg: "from-red-950/80 via-black to-red-950/40", accent: "text-red-400", border: "border-red-500/20", dot: "bg-red-500/30" },
  { bg: "from-gold/10 via-black to-amber-950/40", accent: "text-gold", border: "border-gold/20", dot: "bg-gold/30" },
  { bg: "from-purple-950/60 via-black to-purple-950/30", accent: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-500/30" },
  { bg: "from-cyan-950/50 via-black to-cyan-950/30", accent: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-500/30" },
  { bg: "from-emerald-950/50 via-black to-emerald-950/30", accent: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500/30" },
];

function getTypeLabel(sub: RecentSubmission) {
  if (sub.type === "battle") return { label: "1v1", icon: Swords, color: "text-red-400" };
  if (sub.type === "round") return { label: "DROP", icon: Target, color: "text-brand" };
  if (sub.type === "sanctioned") return { label: "ARENA", icon: Swords, color: "text-red-400" };
  if (sub.qoi_score !== null) return { label: "JUDGED", icon: Gavel, color: "text-purple-400" };
  return { label: "EDIT", icon: Zap, color: "text-gold" };
}

// Crosshair pattern SVG for branded cells
function CellPattern({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="cell-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <line x1="14" y1="10" x2="14" y2="18" stroke="currentColor" strokeWidth="0.5" />
          <line x1="10" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="0.6" fill="currentColor" />
          <circle cx="28" cy="0" r="0.6" fill="currentColor" />
          <circle cx="0" cy="28" r="0.6" fill="currentColor" />
          <circle cx="28" cy="28" r="0.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cell-grid)" className={color} />
    </svg>
  );
}

// Branded fallback cell — shows context info
function BrandedCell({ submission, size, paletteIdx }: { submission: RecentSubmission; size: "large" | "normal"; paletteIdx: number }) {
  const palette = CELL_PALETTES[paletteIdx % CELL_PALETTES.length];
  const typeInfo = getTypeLabel(submission);
  const TypeIcon = typeInfo.icon;
  const hasScore = submission.qoi_score !== null;
  const isLarge = size === "large";

  return (
    <div className={cn("absolute inset-0 bg-gradient-to-br", palette.bg)}>
      <CellPattern color={palette.accent} />

      {/* Center: Loopgate logo — true center */}
      <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center">
        <img
          src={loopgateWordmark}
          alt=""
          className={cn("w-auto object-contain object-center select-none", isLarge ? "h-20 opacity-[0.34]" : "h-10 opacity-[0.3]")}
          style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.72))" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-2.5 sm:p-3.5">
        {/* Top: type badge */}
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest", typeInfo.color)}>
            <TypeIcon size={isLarge ? 12 : 10} />
            {typeInfo.label}
          </div>
          {hasScore && (
            <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
              <Trophy size={isLarge ? 12 : 9} className="text-gold" />
              <span className={cn("font-display font-bold text-gold", isLarge ? "text-sm" : "text-[11px]")}>
                {Math.round(submission.qoi_score!)}
              </span>
            </div>
          )}
        </div>

      {/* Bottom: user info + event */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            {submission.avatar_url ? (
              <img src={submission.avatar_url} alt="" className={cn("rounded-full object-cover ring-1 ring-white/10", isLarge ? "w-7 h-7" : "w-5 h-5")} />
            ) : (
              <div className={cn("rounded-full flex items-center justify-center", palette.dot, isLarge ? "w-7 h-7" : "w-5 h-5")}>
                <span className={cn("font-bold", palette.accent, isLarge ? "text-[10px]" : "text-[8px]")}>
                  {(submission.display_name || submission.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className={cn("font-extrabold text-foreground truncate", isLarge ? "text-base" : "text-[11px]")}>
              {submission.display_name || submission.username}
            </span>
          </div>

          {/* Battle VS indicator */}
          {submission.type === "battle" && submission.opponent_username && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className={cn("font-display font-black text-red-500", isLarge ? "text-[11px]" : "text-[8px]")}>VS</span>
              <span className={cn("text-muted-foreground truncate", isLarge ? "text-[11px]" : "text-[8px]")}>
                {submission.opponent_username}
              </span>
              {submission.winner_id && (
                <Trophy size={isLarge ? 10 : 8} className={submission.winner_id === submission.user_id ? "text-gold" : "text-muted-foreground/40"} />
              )}
            </div>
          )}

          <p className={cn("text-muted-foreground truncate", isLarge ? "text-[11px]" : "text-[9px]")}>
            {submission.event_title}
          </p>
          {/* Platform pill */}
          <div className="mt-1">
            <span className={cn(
              "uppercase font-bold tracking-wider bg-white/[0.05] px-1.5 py-0.5 rounded-sm",
              palette.accent,
              isLarge ? "text-[8px]" : "text-[7px]"
            )}>
              {submission.platform}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual cell
function GridCell({ submission, size = "normal", index }: { submission: RecentSubmission; size?: "large" | "normal"; index: number }) {
  const { thumbnail, loading } = useThumbnail(submission.submission_url, submission.platform);
  const hasScore = submission.qoi_score !== null;
  const typeInfo = getTypeLabel(submission);

  return (
    <Link
      to={submission.type === 'battle' && submission.battle_id ? `/battle/${submission.battle_id}` : `/editor/${submission.user_id}`}
      className={cn(
        "relative block overflow-hidden group bg-black",
        size === "large" ? "md:row-span-2 md:col-span-2" : ""
      )}
    >
      {loading ? (
        <div className="absolute inset-0 bg-surface-1 animate-pulse" />
      ) : thumbnail ? (
        <>
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
              {hasScore && (
                <div className="flex items-center gap-1.5 text-white">
                  <Trophy size={16} className="text-gold" />
                  <span className="font-display text-sm font-bold">{Math.round(submission.qoi_score!)}</span>
                </div>
              )}
              <span className="text-[10px] text-white/70 font-semibold">{submission.display_name || submission.username}</span>
            </div>
          </div>
          {/* Play icon */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={14} className="text-white drop-shadow-lg" fill="white" />
          </div>
          {/* Type badge on thumbnailed cells */}
          <div className="absolute top-1.5 left-1.5">
            <span className={cn("text-[6px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm px-1 py-0.5 rounded-sm", typeInfo.color)}>
              {typeInfo.label}
            </span>
          </div>
          {/* Score badge */}
          {hasScore && size === "normal" && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
              <span className="text-[9px] font-bold text-gold">{Math.round(submission.qoi_score!)}</span>
            </div>
          )}
          {/* Bottom name strip for large */}
          {size === "large" && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3.5">
              <div className="flex items-center gap-2">
                {submission.avatar_url ? (
                  <img src={submission.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gold">
                      {(submission.display_name || submission.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-base text-white font-extrabold truncate">
                  {submission.display_name || submission.username}
                </span>
              </div>
              {submission.type === "battle" && submission.opponent_username && (
                <div className="flex items-center gap-1 mt-0.5 ml-8">
                  <span className="text-[10px] font-black text-red-500">VS</span>
                  <span className="text-[10px] text-white/70 truncate">{submission.opponent_username}</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <BrandedCell submission={submission} size={size} paletteIdx={index} />
      )}
    </Link>
  );
}

export default function ExploreGrid({ limit = 12 }: { limit?: number }) {
  const { submissions, loading } = useRecentSubmissions(limit);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 aspect-square">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-surface-1 animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-muted-foreground">No edits yet</p>
      </div>
    );
  }

  // Desktop keeps IG Explore rhythm; mobile uses uniform 2-col flow for stability.
  const cells: { submission: RecentSubmission; size: "large" | "normal" }[] = isMobile
    ? submissions.map((submission) => ({ submission, size: "normal" }))
    : (() => {
        const desktopCells: { submission: RecentSubmission; size: "large" | "normal" }[] = [];
        let idx = 0;
        let groupIdx = 0;

        while (idx < submissions.length) {
          const isEvenGroup = groupIdx % 2 === 0;

          if (isEvenGroup && idx < submissions.length) {
            desktopCells.push({ submission: submissions[idx], size: "large" });
            idx++;
          }

          const smallCount = Math.min(isEvenGroup ? 4 : 5, submissions.length - idx);
          for (let s = 0; s < smallCount; s++) {
            if (idx < submissions.length) {
              desktopCells.push({ submission: submissions[idx], size: "normal" });
              idx++;
            }
          }

          if (!isEvenGroup && idx < submissions.length) {
            desktopCells.push({ submission: submissions[idx], size: "large" });
            idx++;
          }
          groupIdx++;
        }

        return desktopCells;
      })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-px auto-rows-[minmax(0,1fr)] -mx-4 sm:mx-0"
      style={{ gridAutoRows: isMobile ? "calc((100vw - 1px) / 2)" : "calc((min(100vw, 640px) - 2px) / 3)" }}
    >
      {cells.map((cell, i) => (
        <GridCell key={cell.submission.id} submission={cell.submission} size={cell.size} index={i} />
      ))}
    </motion.div>
  );
}
