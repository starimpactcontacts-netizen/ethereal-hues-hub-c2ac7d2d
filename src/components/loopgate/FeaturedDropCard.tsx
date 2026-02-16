import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, Users, ChevronRight, Star, Gift, Crown, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-950/60 via-surface-1 to-pink-950/40 border border-purple-500/30 rounded-xl shadow-[0_8px_40px_-8px_rgba(168,85,247,0.25),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

        {/* Header: Artist row */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <Link to={`/artist/${artist?.slug || ''}`} className="flex items-center gap-2.5 min-w-0">
            <Avatar className="w-10 h-10 border-2 border-purple-500/50 shrink-0">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="bg-purple-500/20 text-purple-300 text-sm font-bold">
                {artist?.name?.[0]?.toUpperCase() || '🎵'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-foreground truncate">{artist?.name || 'Artist'}</span>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[7px] px-1 py-0">
                  <Music className="w-2 h-2 mr-0.5" /> FEATURED
                </Badge>
              </div>
              <span className="text-[9px] text-purple-300/70 uppercase tracking-wider">{artist?.genre || 'Phonk'} Artist</span>
            </div>
          </Link>
          {isLive && (
            <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-400 uppercase">Live</span>
            </div>
          )}
        </div>

        {/* Poster / Song section */}
        <div className="px-4 pb-3">
          <div className="relative rounded-lg overflow-hidden bg-surface-2/60">
            {drop.poster_url ? (
              <img src={drop.poster_url} alt={drop.title} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                <Music className="w-10 h-10 text-purple-400/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-display text-base text-white leading-tight">{drop.title}</h3>
              <p className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1.5">
                <Music className="w-3 h-3" />
                {drop.song_name}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 pb-3 flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1 text-purple-300">
            <Users className="w-3 h-3" />
            <span className="text-foreground font-bold">{drop.submission_count}</span> entries
          </span>
          <span className="flex items-center gap-1 text-gold">
            <Zap className="w-3 h-3" />
            +{drop.xp_reward} XP
          </span>
          <span className="flex items-center gap-1 text-gold">
            <Trophy className="w-3 h-3" />
            +{drop.index_reward} IDX
          </span>
          <span className="flex items-center gap-1 text-pink-400">
            <Gift className="w-3 h-3" />
            {drop.mystery_reward_label}
          </span>
        </div>

        {/* Top scorer / Random pick */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="px-4 pb-3 flex items-center gap-3 text-[9px]">
            {drop.top_scorer_username && (
              <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 px-2 py-1 rounded-full">
                <Crown className="w-3 h-3 text-gold" />
                <span className="text-gold font-bold">@{drop.top_scorer_username}</span>
                <span className="text-muted-foreground">• {Math.round(drop.top_score)} QOI</span>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 text-pink-400" />
                <span className="text-pink-400 font-bold">@{drop.random_pick_username}</span>
                <span className="text-muted-foreground">Artist Pick</span>
              </div>
            )}
          </div>
        )}

        {/* Countdown */}
        {isLive && drop.ends_at && (
          <div className="px-4 pb-3">
            <div className="bg-background/50 border border-border/50 rounded-lg p-2">
              <CountdownTimer endDate={drop.ends_at} label="Ends" />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-4">
          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg shadow-[0_4px_20px_-4px_rgba(168,85,247,0.5)]"
            >
              <Flame className="w-4 h-4" />
              Submit Your Edit
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <Link
              to={`/artist/${artist?.slug || ''}`}
              className="w-full py-3 bg-surface-2 border border-border text-muted-foreground font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg"
            >
              View Results
              <ChevronRight className="w-4 h-4" />
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
