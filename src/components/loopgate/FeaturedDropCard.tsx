import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, ChevronRight, Flame, Gift, Crown, Star, Clock, TrendingUp, Link2, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import type { FeaturedDrop } from "@/hooks/useFeaturedDrops";
import { cn } from "@/lib/utils";

interface Props {
  drop: FeaturedDrop;
}

function useActivitySignal(drop: FeaturedDrop) {
  return useMemo(() => {
    const count = drop.submission_count || 0;
    if (count >= 10) return { text: `${count} edits submitted`, icon: TrendingUp, color: 'text-emerald-400' };
    if (count >= 5) return { text: `${count} editors competing`, icon: TrendingUp, color: 'text-emerald-400' };
    if (drop.ends_at) {
      const endsAt = new Date(drop.ends_at);
      const hoursLeft = (endsAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft > 0 && hoursLeft <= 24) return { text: `Closing soon — ${Math.ceil(hoursLeft)}h left`, icon: Clock, color: 'text-orange-400' };
      if (hoursLeft > 0 && hoursLeft <= 72) return { text: `${Math.ceil(hoursLeft / 24)}d left to enter`, icon: Clock, color: 'text-muted-foreground' };
    }
    if (drop.xp_reward >= 100) return { text: `+${drop.xp_reward} XP up for grabs`, icon: Zap, color: 'text-brand' };
    if (drop.mystery_reward_label) return { text: `Mystery reward: ${drop.mystery_reward_label}`, icon: Gift, color: 'text-gold' };
    return { text: 'Open for submissions', icon: Flame, color: 'text-brand' };
  }, [drop]);
}

export default function FeaturedDropCard({ drop }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const artist = drop.artist;
  const isLive = drop.status === 'live';
  const isPromoted = !!(drop as any).is_promoted;
  const activity = useActivitySignal(drop);
  const ActivityIcon = activity.icon;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = (drop as any).slug || drop.id;
    const link = `${window.location.origin}/drop/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-[260px] shrink-0 snap-start overflow-hidden rounded-xl",
        "bg-gradient-to-b from-surface-1 to-surface-0",
        "border transition-all duration-300 group",
        isPromoted
          ? "border-gold/40 shadow-[0_4px_24px_rgba(255,215,0,0.12)] hover:shadow-[0_8px_32px_rgba(255,215,0,0.2)]"
          : "border-white/[0.06] hover:border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Poster */}
      <div className="relative w-full h-36 overflow-hidden">
        {drop.poster_url ? (
          <img
            src={drop.poster_url}
            alt={drop.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-2 to-surface-1 flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground/15" />
          </div>
        )}
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

        {/* Artist chip — top-left */}
        <Link
          to={`/artist/${artist?.slug || ''}`}
          className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full pl-0.5 pr-2.5 py-1 border border-white/[0.08] hover:border-white/[0.15] transition-colors"
        >
          <Avatar className="w-5 h-5 border border-white/20">
            <AvatarImage src={artist?.avatar_url || ''} />
            <AvatarFallback className="bg-surface-2 text-[7px] font-bold">{artist?.name?.[0]?.toUpperCase() || '🎵'}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-semibold text-white/90 truncate max-w-[90px]">{artist?.name || 'Artist'}</span>
        </Link>

        {/* Promoted badge */}
        {isPromoted && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full px-2.5 py-1 border border-gold/30 z-10">
            <Crown className="w-3 h-3 text-gold" />
            <span className="text-[8px] font-bold text-gold uppercase tracking-wider">Campaign</span>
          </div>
        )}

        {/* Status badges — top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center w-7 h-7 bg-black/50 backdrop-blur-md rounded-full border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/10 transition-all"
            title="Copy link"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Link2 className="w-3 h-3 text-white/60" />
            )}
          </button>
          {isLive && (
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Title + Song — bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
          <h3 className="font-display text-sm text-white leading-tight tracking-wide uppercase truncate drop-shadow-lg">
            {drop.title}
          </h3>
          <p className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1 truncate">
            <Music className="w-2.5 h-2.5 shrink-0" />
            {drop.song_name}
          </p>
        </div>
      </div>

      {/* Activity signal + Rewards */}
      <div className="px-3.5 py-2.5 flex items-center gap-2 border-t border-white/[0.04]">
        <ActivityIcon className={cn("w-3.5 h-3.5 shrink-0", activity.color)} />
        <span className={cn("text-[10px] font-semibold tracking-tight flex-1 truncate", activity.color)}>
          {activity.text}
        </span>
        <div className="flex items-center gap-2.5 text-[10px] font-bold shrink-0">
          <span className="flex items-center gap-0.5 text-brand">
            <Zap className="w-3 h-3" />+{drop.xp_reward}
          </span>
          <span className="flex items-center gap-0.5 text-gold">
            <Trophy className="w-3 h-3" />+{drop.index_reward}
          </span>
        </div>
      </div>

      {/* Winner / Pick chips */}
      {(drop.top_scorer_username || drop.random_pick_username) && (
        <div className="px-3.5 pb-2 flex items-center gap-1.5 text-[9px] overflow-hidden">
          {drop.top_scorer_username && (
            <div className="flex items-center gap-1 bg-gold/8 border border-gold/15 rounded-full px-2 py-0.5 truncate">
              <Crown className="w-2.5 h-2.5 text-gold shrink-0" />
              <span className="text-gold font-bold truncate">@{drop.top_scorer_username}</span>
            </div>
          )}
          {drop.random_pick_username && (
            <div className="flex items-center gap-1 bg-brand/8 border border-brand/15 rounded-full px-2 py-0.5 truncate">
              <Star className="w-2.5 h-2.5 text-brand shrink-0" />
              <span className="text-brand font-bold truncate">@{drop.random_pick_username}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="px-3.5 pb-3.5 space-y-2 pt-1">
        {isLive ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (profile) navigate(`/drop/${drop.id}`);
                else navigate('/start');
              }}
              className={cn(
                "w-full py-3.5 rounded-lg font-display text-sm uppercase tracking-widest",
                "flex items-center justify-center gap-2",
                "bg-emerald-500 text-white",
                "shadow-[0_4px_16px_rgba(16,185,129,0.3)]",
                "hover:bg-emerald-400 hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)]",
                "active:bg-emerald-600",
                "transition-all duration-200"
              )}
            >
              Join
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/drop/${drop.id}`)}
              className={cn(
                "w-full py-2.5 rounded-lg font-display text-xs uppercase tracking-widest",
                "flex items-center justify-center gap-1.5",
                "bg-white/[0.04] border border-white/[0.08] text-white/60",
                "hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.15]",
                "transition-all duration-200"
              )}
            >
              Enter Lobby
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          </>
        ) : (
          <Link
            to={`/drop/${drop.id}`}
            className={cn(
              "w-full py-3 rounded-lg font-display text-xs uppercase tracking-widest",
              "flex items-center justify-center gap-1.5",
              "bg-white/[0.04] border border-white/[0.08] text-white/60",
              "hover:bg-white/[0.08] hover:text-white/80",
              "transition-all duration-200"
            )}
          >
            View Results
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
