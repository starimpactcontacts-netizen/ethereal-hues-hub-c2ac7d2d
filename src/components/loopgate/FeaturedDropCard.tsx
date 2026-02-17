import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, ChevronRight, Flame, Gift, Crown, Star, Clock, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeaturedSubmitModal from "@/components/loopgate/FeaturedSubmitModal";
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
  const [showSubmit, setShowSubmit] = useState(false);
  const artist = drop.artist;
  const isLive = drop.status === 'live';
  const activity = useActivitySignal(drop);
  const ActivityIcon = activity.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[260px] shrink-0 snap-start overflow-hidden bg-surface-0 border border-border rounded-lg"
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
          <Link to={`/artist/${artist?.slug || ''}`} className="absolute top-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full pl-0.5 pr-2 py-0.5">
            <Avatar className="w-5 h-5 border border-white/20">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="bg-surface-1 text-[7px] font-bold">{artist?.name?.[0]?.toUpperCase() || '🎵'}</AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-bold text-white truncate max-w-[80px]">{artist?.name || 'Artist'}</span>
          </Link>

          {/* Status */}
          {isLive && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[7px] font-bold text-emerald-400 uppercase">Live</span>
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

        {/* Activity signal — contextual, never dead */}
        <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[8px] border-t border-border/40">
          <ActivityIcon className={`w-2.5 h-2.5 shrink-0 ${activity.color}`} />
          <span className={`${activity.color} font-medium`}>{activity.text}</span>
          <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <span className="flex items-center gap-0.5 text-brand">
              <Zap className="w-2.5 h-2.5" />+{drop.xp_reward}
            </span>
            <span className="flex items-center gap-0.5 text-brand">
              <Trophy className="w-2.5 h-2.5" />+{drop.index_reward}
            </span>
          </div>
        </div>

        {/* Winner / Pick chips */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="px-2.5 pb-1.5 flex items-center gap-1.5 text-[8px] overflow-hidden">
            {drop.top_scorer_username && (
              <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full truncate">
                <Crown className="w-2 h-2 text-gold shrink-0" />
                <span className="text-gold font-bold truncate">@{drop.top_scorer_username}</span>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded-full truncate">
                <Star className="w-2 h-2 text-brand shrink-0" />
                <span className="text-brand font-bold truncate">@{drop.random_pick_username}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="px-2.5 pb-2.5">
          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
              className="w-full py-2 bg-brand text-white font-display text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-md hover:bg-brand/90 transition-colors"
            >
              <Flame className="w-3 h-3" />
              Submit Edit
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          ) : (
            <Link
              to={`/artist/${artist?.slug || ''}`}
              className="w-full py-2 bg-surface-1 border border-border text-muted-foreground font-display text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-md"
            >
              View Results
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </motion.div>

      {showSubmit && (
        <FeaturedSubmitModal
          drop={drop}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </>
  );
}
