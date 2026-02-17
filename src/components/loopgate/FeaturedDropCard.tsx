import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, Users, ChevronRight, Star, Crown, Flame, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import FeaturedSubmitModal from "@/components/loopgate/FeaturedSubmitModal";
import { useAuth } from "@/hooks/useAuth";
import type { FeaturedDrop } from "@/hooks/useFeaturedDrops";

interface Props {
  drop: FeaturedDrop;
}

export default function FeaturedDropCard({ drop }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showSubmit, setShowSubmit] = useState(false);
  const artist = drop.artist;
  const isLive = drop.status === 'live';
  const isClosed = drop.status === 'closed' || drop.status === 'judging';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-surface-0 border border-border rounded-md"
      >
        {/* Poster with overlay — full bleed, compact */}
        <div className="relative w-full h-36 sm:h-44 overflow-hidden">
          {drop.poster_url ? (
            <img src={drop.poster_url} alt={drop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-1 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Artist chip — top left */}
          <Link to={`/artist/${artist?.slug || ''}`} className="absolute top-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full pl-1 pr-3 py-1 hover:bg-black/80 transition-colors">
            <Avatar className="w-6 h-6 border border-white/20">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="bg-surface-1 text-foreground text-[8px] font-bold">
                {artist?.name?.[0]?.toUpperCase() || '🎵'}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{artist?.name || 'Artist'}</span>
          </Link>

          {/* Status badge — top right */}
          {isLive && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wide">Live</span>
            </div>
          )}
          {isClosed && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-muted/60 border border-border px-2 py-0.5 rounded-full">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide">
                {drop.status === 'judging' ? 'Judging' : 'Closed'}
              </span>
            </div>
          )}

          {/* Title + song — bottom of poster */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
            <h3 className="font-display text-sm text-white leading-tight tracking-wide uppercase">{drop.title}</h3>
            <p className="text-[9px] text-white/60 mt-0.5 flex items-center gap-1">
              <Music className="w-2.5 h-2.5" />
              {drop.song_name}
            </p>
          </div>
        </div>

        {/* Info bar — single dense row */}
        <div className="px-3 py-2 flex items-center justify-between border-t border-border/50">
          <div className="flex items-center gap-3 text-[9px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="text-foreground font-bold tabular-nums">{drop.submission_count}</span>
            </span>
            <span className="flex items-center gap-1 text-brand">
              <Zap className="w-3 h-3" />
              +{drop.xp_reward} XP
            </span>
            <span className="flex items-center gap-1 text-brand">
              <Trophy className="w-3 h-3" />
              +{drop.index_reward} IDX
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Gift className="w-3 h-3" />
              {drop.mystery_reward_label}
            </span>
          </div>

          {/* Countdown inline */}
          {isLive && drop.ends_at && (
            <div className="text-[9px] text-muted-foreground">
              <CountdownTimer endDate={drop.ends_at} label="" />
            </div>
          )}
        </div>

        {/* Top scorer / Random pick — conditional */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="px-3 pb-2 flex items-center gap-2 text-[9px]">
            {drop.top_scorer_username && (
              <div className="flex items-center gap-1 bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5 text-gold" />
                <span className="text-gold font-bold">@{drop.top_scorer_username}</span>
                <span className="text-muted-foreground">{Math.round(drop.top_score)} QOI</span>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-1 bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5 text-brand" />
                <span className="text-brand font-bold">@{drop.random_pick_username}</span>
                <span className="text-muted-foreground">Artist Pick</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="px-3 pb-3">
          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
              className="w-full py-2.5 bg-brand text-white font-display text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-md hover:bg-brand/90 transition-colors"
            >
              <Flame className="w-3.5 h-3.5" />
              Submit Your Edit
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <Link
              to={`/artist/${artist?.slug || ''}`}
              className="w-full py-2.5 bg-surface-1 border border-border text-muted-foreground font-display text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-md hover:bg-surface-2 transition-colors"
            >
              View Results
              <ChevronRight className="w-3.5 h-3.5" />
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
