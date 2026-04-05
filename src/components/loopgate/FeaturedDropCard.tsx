import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Zap, Trophy, ChevronRight, Flame, Gift, Crown, Star, Clock, TrendingUp, Link2, Check, Swords, Target } from "lucide-react";
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
  const isOfficialEvent = drop.prize_usd > 0;
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

  // ═══════════════════════════════════════════════════
  // OFFICIAL EVENT CARD — prize pool, ranked rounds
  // ═══════════════════════════════════════════════════
  if (isOfficialEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "relative w-[240px] sm:w-[260px] shrink-0 snap-start overflow-hidden group",
          "bg-black border-2 border-emerald-500/60",
          "shadow-[0_0_30px_rgba(16,185,129,0.2),0_0_60px_rgba(16,185,129,0.08)]",
          "hover:shadow-[0_0_40px_rgba(16,185,129,0.35),0_0_80px_rgba(16,185,129,0.12)]",
          "hover:border-emerald-400/80 transition-all duration-300"
        )}
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        {/* Corner cut accents */}
        <div className="absolute top-0 right-0 w-[22px] h-[22px] overflow-hidden z-10">
          <div className="absolute top-0 right-0 w-[32px] h-[2px] bg-emerald-400 origin-top-right rotate-45 translate-x-[4px] translate-y-[10px]" />
        </div>
        <div className="absolute bottom-0 left-0 w-[22px] h-[22px] overflow-hidden z-10">
          <div className="absolute bottom-0 left-0 w-[32px] h-[2px] bg-emerald-400 origin-bottom-left rotate-45 -translate-x-[4px] -translate-y-[10px]" />
        </div>

        {/* OFFICIAL EVENT ribbon */}
        <div className="absolute top-3 left-0 z-20 bg-emerald-500 px-3 py-1 flex items-center gap-1.5"
          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
          <Swords className="w-3 h-3 text-black" />
          <span className="text-[8px] font-black text-black uppercase tracking-[0.15em]">King of the Hill</span>
        </div>

        {/* Poster — taller for official */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden">
          {drop.poster_url ? (
            <img
              src={drop.poster_url}
              alt={drop.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-black flex items-center justify-center">
              <Target className="w-10 h-10 text-emerald-500/20" />
            </div>
          )}
          {/* Heavy dark overlay with scan lines */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)',
          }} />

          {/* Top badges */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center w-6 h-6 bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all"
              title="Copy link"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Link2 className="w-2.5 h-2.5 text-white/60" />}
            </button>
            {isLive && (
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>

          {/* Bottom — Title + Prize */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg sm:text-xl text-white leading-tight tracking-wide uppercase truncate font-black drop-shadow-lg">
                {drop.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Link
                  to={`/artist/${artist?.slug || ''}`}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  onClick={e => e.stopPropagation()}
                >
                  <Avatar className="w-4 h-4 border border-white/20">
                    <AvatarImage src={artist?.avatar_url || ''} />
                    <AvatarFallback className="bg-surface-2 text-[6px] font-bold">{artist?.name?.[0]?.toUpperCase() || '🎵'}</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-semibold text-white/60">{artist?.name}</span>
                </Link>
                <span className="text-white/20">·</span>
                <p className="text-[9px] text-white/40 flex items-center gap-1 truncate">
                  <Music className="w-2.5 h-2.5 shrink-0" />
                  {drop.song_name}
                </p>
              </div>
            </div>
            {/* Big prize */}
            <div className="shrink-0 flex flex-col items-end">
              <span className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-wider">Prize</span>
              <span
                className="font-display text-4xl sm:text-5xl text-emerald-400 font-black leading-none"
                style={{ textShadow: '0 0 30px rgba(16,185,129,0.6), 0 4px 20px rgba(16,185,129,0.4), 0 10px 40px rgba(16,185,129,0.2)' }}
              >
                ${drop.prize_usd}
              </span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-3 py-2 flex items-center gap-2 border-t border-emerald-500/20 bg-emerald-950/20">
          <ActivityIcon className={cn("w-3 h-3 shrink-0", activity.color)} />
          <span className={cn("text-[9px] font-semibold tracking-tight flex-1 truncate", activity.color)}>
            {activity.text}
          </span>
          <div className="flex items-center gap-2 text-[9px] font-bold shrink-0">
            <span className="flex items-center gap-0.5 text-brand">
              <Zap className="w-3 h-3" />+{drop.xp_reward}
            </span>
            <span className="flex items-center gap-0.5 text-gold">
              <Trophy className="w-3 h-3" />+{drop.index_reward}
            </span>
          </div>
        </div>

        {/* Winners */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[9px] overflow-hidden">
            {drop.top_scorer_username && (
              <div className="flex items-center gap-1 bg-gold/8 border border-gold/15 px-2 py-0.5 truncate">
                <Crown className="w-2.5 h-2.5 text-gold shrink-0" />
                <span className="text-gold font-bold truncate">@{drop.top_scorer_username}</span>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-1 bg-brand/8 border border-brand/15 px-2 py-0.5 truncate">
                <Star className="w-2.5 h-2.5 text-brand shrink-0" />
                <span className="text-brand font-bold truncate">@{drop.random_pick_username}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="px-3 pb-3 pt-1">
          {isLive ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(profile ? `/drop/${drop.id}` : '/start')}
              className={cn(
                "w-full py-3.5 font-display text-sm uppercase tracking-[0.25em]",
                "flex items-center justify-center gap-2",
                "bg-emerald-500 text-black font-black",
                "shadow-[0_4px_20px_rgba(16,185,129,0.4)]",
                "hover:bg-emerald-400 hover:shadow-[0_6px_30px_rgba(16,185,129,0.5)]",
                "active:bg-emerald-600 transition-all duration-200 touch-manipulation"
              )}
              style={{ clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
            >
              <Swords className="w-4 h-4" />
              Enter Event
            </motion.button>
          ) : (
            <Link
              to={`/drop/${drop.id}`}
              className={cn(
                "w-full py-3 font-display text-xs uppercase tracking-widest",
                "flex items-center justify-center gap-1.5",
                "bg-white/[0.04] border border-white/[0.08] text-white/60",
                "hover:bg-white/[0.08] hover:text-white/80 transition-all duration-200"
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

  // ═══════════════════════════════════════════════════
  // REGULAR FEATURED DROP CARD
  // ═══════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative w-[210px] sm:w-[220px] shrink-0 snap-start overflow-hidden rounded-lg",
        "bg-black",
        "border transition-all duration-300 group",
        isPromoted
          ? "border-gold/30 shadow-[0_4px_20px_rgba(255,215,0,0.12)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.2)]"
          : "border-white/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.7)]"
      )}
    >
      {/* Poster */}
      <div className="relative w-full h-48 sm:h-52 overflow-hidden">
        {drop.poster_url ? (
          <img
            src={drop.poster_url}
            alt={drop.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-2 to-surface-1 flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground/15" />
          </div>
        )}
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black to-transparent" />

        {/* Top row: Artist left, status right */}
        <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between gap-1.5">
          <Link
            to={`/artist/${artist?.slug || ''}`}
            className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full pl-0.5 pr-2 py-0.5 border border-white/[0.08] hover:border-white/[0.15] transition-colors min-w-0 shrink"
          >
            <Avatar className="w-5 h-5 border border-white/20 shrink-0">
              <AvatarImage src={artist?.avatar_url || ''} />
              <AvatarFallback className="bg-surface-2 text-[7px] font-bold">{artist?.name?.[0]?.toUpperCase() || '🎵'}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-semibold text-white/90 truncate">{artist?.name || 'Artist'}</span>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {isPromoted && (
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 border border-gold/25">
                <Crown className="w-2.5 h-2.5 text-gold" />
                <span className="text-[7px] font-bold text-gold uppercase tracking-wider hidden sm:inline">Campaign</span>
              </div>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center w-6 h-6 bg-black/50 backdrop-blur-md rounded-full border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/10 transition-all"
              title="Copy link"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Link2 className="w-2.5 h-2.5 text-white/60" />}
            </button>
            {isLive && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-1 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Title + Song — bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base sm:text-lg text-white leading-tight tracking-wide uppercase truncate drop-shadow-lg font-extrabold">
              {drop.title}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-white/50 mt-0.5 flex items-center gap-1 truncate">
              <Music className="w-2.5 h-2.5 shrink-0" />
              {drop.song_name}
            </p>
          </div>
        </div>
      </div>

      {/* Activity signal + Rewards */}
      <div className="px-2.5 py-2 flex items-center gap-1.5 border-t border-white/[0.04]">
        <ActivityIcon className={cn("w-2.5 h-2.5 shrink-0", activity.color)} />
        <span className={cn("text-[8px] font-semibold tracking-tight flex-1 truncate", activity.color)}>
          {activity.text}
        </span>
        <div className="flex items-center gap-1.5 text-[8px] font-bold shrink-0">
          <span className="flex items-center gap-0.5 text-brand">
            <Zap className="w-2.5 h-2.5" />+{drop.xp_reward}
          </span>
          <span className="flex items-center gap-0.5 text-gold">
            <Trophy className="w-2.5 h-2.5" />+{drop.index_reward}
          </span>
        </div>
      </div>

      {/* Winner / Pick chips */}
      {(drop.top_scorer_username || drop.random_pick_username) && (
        <div className="px-3 pb-1.5 flex items-center gap-1.5 text-[9px] overflow-hidden">
          {drop.top_scorer_username && (
            <div className="flex items-center gap-1 bg-gold/8 border border-gold/15 rounded-full px-2 py-0.5 truncate">
              <Crown className="w-2.5 h-2.5 text-gold shrink-0" />
              <span className="text-gold font-bold truncate">@{drop.top_scorer_username}</span>
            </div>
          )}
          {drop.random_pick_username && drop.random_pick_username !== drop.top_scorer_username && (
            <div className="flex items-center gap-1 bg-brand/8 border border-brand/15 rounded-full px-2 py-0.5 truncate">
              <Star className="w-2.5 h-2.5 text-brand shrink-0" />
              <span className="text-brand font-bold truncate">@{drop.random_pick_username}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA Buttons */}
      <div className="px-2.5 pb-2.5 pt-0.5">
        {isLive ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/drop/${drop.id}`)}
            className={cn(
              "w-full py-2.5 rounded-md font-display text-[11px] uppercase tracking-widest",
              "flex items-center justify-center gap-1.5",
              "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold",
              "shadow-[0_2px_12px_rgba(16,185,129,0.3)]",
              "hover:from-emerald-400 hover:to-emerald-500",
              "active:from-emerald-600 active:to-emerald-700",
              "transition-all duration-200 touch-manipulation"
            )}
          >
            View Event <ChevronRight className="w-3 h-3" />
          </motion.button>
        ) : (
          <Link
            to={`/drop/${drop.id}`}
            className={cn(
              "w-full py-2.5 rounded-md font-display text-[10px] uppercase tracking-widest",
              "flex items-center justify-center gap-1.5",
              "bg-white/[0.04] border border-white/[0.06] text-white/50",
              "hover:bg-white/[0.08] hover:text-white/70",
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
