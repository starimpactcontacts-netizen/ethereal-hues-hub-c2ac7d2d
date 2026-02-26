import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, ChevronRight, Flame, Gift, Crown, Star, Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import type { FeaturedDrop } from "@/hooks/useFeaturedDrops";
import { formatDistanceToNow } from "date-fns";

interface Props {
  drop: FeaturedDrop;
}

/** Build a contextual activity label that never looks dead */
function useActivitySignal(drop: FeaturedDrop) {
  return useMemo(() => {
    const count = drop.submission_count || 0;

    // High activity — show real numbers proudly
    if (count >= 10) return { text: `${count} edits submitted`, icon: TrendingUp, color: 'text-emerald-400' };
    if (count >= 5) return { text: `${count} editors competing`, icon: TrendingUp, color: 'text-emerald-400' };

    // Low activity — reframe around rewards & urgency instead of exposing low count
    if (drop.ends_at) {
      const endsAt = new Date(drop.ends_at);
      const hoursLeft = (endsAt.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft > 0 && hoursLeft <= 24) return { text: `Closing soon — ${Math.ceil(hoursLeft)}h left`, icon: Clock, color: 'text-orange-400' };
      if (hoursLeft > 0 && hoursLeft <= 72) return { text: `${Math.ceil(hoursLeft / 24)}d left to enter`, icon: Clock, color: 'text-muted-foreground' };
    }

    // Fallback — lead with value, not emptiness
    if (drop.xp_reward >= 100) return { text: `+${drop.xp_reward} XP up for grabs`, icon: Zap, color: 'text-brand' };
    if (drop.mystery_reward_label) return { text: `Mystery reward: ${drop.mystery_reward_label}`, icon: Gift, color: 'text-gold' };

    return { text: 'Open for submissions', icon: Flame, color: 'text-brand' };
  }, [drop]);
}

export default function FeaturedDropCard({ drop }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const artist = drop.artist;
  const isLive = drop.status === 'live';
  const isPromoted = !!(drop as any).is_promoted;
  const activity = useActivitySignal(drop);
  const ActivityIcon = activity.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-[240px] shrink-0 snap-start overflow-hidden bg-surface-0 border ${
          isPromoted ? 'border-gold/60 shadow-[0_0_12px_rgba(255,215,0,0.15)]' : 'border-border'
        }`}
      >
        {/* Poster — compact */}
        <div className="relative w-full h-28 overflow-hidden">
          {drop.poster_url ? (
            <img src={drop.poster_url} alt={drop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-1 flex items-center justify-center">
              <Music className="w-6 h-6 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Artist — overlay top-left */}
          <Link to={`/artist/${artist?.slug || ''}`} className="absolute top-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm pl-0.5 pr-2 py-0.5">
            <Avatar className="w-5 h-5 border border-white/20">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="bg-surface-1 text-[7px] font-bold">{artist?.name?.[0]?.toUpperCase() || '🎵'}</AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-bold text-white truncate max-w-[80px]">{artist?.name || 'Artist'}</span>
          </Link>

          {/* Promoted badge */}
          {isPromoted && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gold/40 z-10">
              <Crown className="w-2.5 h-2.5 text-gold" />
              <span className="text-[7px] font-bold text-gold uppercase tracking-wider">Campaign</span>
            </div>
          )}

          {/* Status */}
          {isLive && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          )}

          {/* Title + Song — bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
            <h3 className="font-display text-[11px] text-white leading-tight tracking-wide uppercase truncate">{drop.title}</h3>
            <p className="text-[8px] text-white/50 mt-0.5 flex items-center gap-1 truncate">
              <Music className="w-2 h-2 shrink-0" />
              {drop.song_name}
            </p>
          </div>
        </div>

        {/* Activity signal */}
        <div className="px-2.5 py-2 flex items-center gap-2 text-[10px] border-t border-border/40">
          <ActivityIcon className={`w-3 h-3 shrink-0 ${activity.color}`} />
          <span className={`${activity.color} font-semibold tracking-tight`}>{activity.text}</span>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground font-bold">
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
          <div className="px-2.5 pb-1.5 flex items-center gap-1.5 text-[8px] overflow-hidden">
            {drop.top_scorer_username && (
              <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 px-1.5 py-0.5 truncate">
                <Crown className="w-2 h-2 text-gold shrink-0" />
                <span className="text-gold font-bold truncate">@{drop.top_scorer_username}</span>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 px-1.5 py-0.5 truncate">
                <Star className="w-2 h-2 text-brand shrink-0" />
                <span className="text-brand font-bold truncate">@{drop.random_pick_username}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {isLive ? (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (profile) navigate(`/drop/${drop.id}`);
                  else navigate('/start');
                }}
                className="w-full py-2.5 bg-emerald-500 text-white font-display text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-colors"
              >
                JOIN
              </motion.button>
              <button
                onClick={() => navigate(`/drop/${drop.id}`)}
                className="w-full py-1.5 bg-surface-1 border border-border text-muted-foreground font-display text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-surface-2 transition-colors"
              >
                Enter Lobby
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </>
          ) : (
            <Link
              to={`/drop/${drop.id}`}
              className="w-full py-2 bg-surface-1 border border-border text-muted-foreground font-display text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
            >
              View Results
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </motion.div>

    </>
  );
}
