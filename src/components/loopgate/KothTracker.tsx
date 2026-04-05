import { motion } from "framer-motion";
import { Crown, Flame, Trophy, Zap, TrendingUp, Star, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";

const teko = { fontFamily: 'Teko, sans-serif' };
const MAX_EDITS = 30;

const WEEKLY_REWARDS = [
  { week: 1, xp: 50, index: 10 },
  { week: 2, xp: 75, index: 15 },
  { week: 3, xp: 100, index: 25 },
  { week: 4, xp: 150, index: 40 },
];

interface KothTrackerProps {
  submissions: FeaturedSubmission[];
  songName?: string;
  isLive: boolean;
}

export default function KothTracker({ submissions, songName, isLive }: KothTrackerProps) {
  const totalEdits = submissions.length;
  const progress = Math.min(totalEdits / MAX_EDITS, 1);
  const editsLeft = Math.max(MAX_EDITS - totalEdits, 0);
  const isComplete = totalEdits >= MAX_EDITS;

  const scored = [...submissions]
    .filter(s => s.status === 'scored')
    .sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = submissions.filter(s => s.status === 'pending');
  const leaderboard = [...scored, ...pending];
  const king = scored[0] || null;

  const weeksActive = Math.max(1, Math.ceil((Date.now() - new Date(submissions[0]?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)));

  return (
    <div className="space-y-5">

      {/* ═══ PROGRESS BAR ═══ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold" />
            <h3 className="text-xl text-foreground uppercase tracking-wider leading-none font-bold" style={teko}>
              Hill Progress
            </h3>
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={totalEdits}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-2xl tabular-nums font-bold text-gold leading-none"
              style={teko}
            >
              {totalEdits}
            </motion.span>
            <span className="text-sm text-muted-foreground font-bold" style={teko}>/ {MAX_EDITS}</span>
          </div>
        </div>

        {/* Clean progress bar */}
        <div className="relative h-3 bg-foreground/[0.06] overflow-hidden rounded-sm">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              "h-full relative rounded-sm",
              isComplete
                ? "bg-gradient-to-r from-gold to-amber-400"
                : progress > 0.7
                ? "bg-gradient-to-r from-destructive to-gold"
                : "bg-gradient-to-r from-emerald-500 to-emerald-400"
            )}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[9px] text-muted-foreground">
            {isComplete ? '👑 Hill conquered — rewards distributed' : `${editsLeft} more edits to end the hill`}
          </p>
          {!isComplete && isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Open</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CURRENT KING ═══ */}
      {king && (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="w-12 h-12 border-2 border-gold shadow-[0_0_16px_-4px_rgba(255,215,0,0.3)]">
              <AvatarImage src={king.avatar_url || ''} />
              <AvatarFallback className="bg-gold/20 text-gold font-bold" style={teko}>
                {king.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div
              className="absolute -top-1.5 -right-1"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Crown className="w-4 h-4 text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
            </motion.div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[8px] text-gold/60 font-black uppercase tracking-[0.15em]">👑 King of the Hill</p>
            <p className="text-xl text-foreground font-bold leading-none truncate" style={teko}>@{king.username}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {king.qoi_score != null && (
                <span className="text-sm text-gold font-bold" style={teko}>{Math.round(king.qoi_score)} QOI</span>
              )}
              <span className="text-[8px] text-emerald-400 font-bold">Week {weeksActive}</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[7px] text-gold/50 font-black uppercase tracking-wider block">Weekly</span>
            <span className="text-lg text-gold font-bold leading-none" style={teko}>
              +{WEEKLY_REWARDS[Math.min(weeksActive - 1, WEEKLY_REWARDS.length - 1)].xp} XP
            </span>
            <span className="text-[9px] text-emerald-400 font-bold block">
              +{WEEKLY_REWARDS[Math.min(weeksActive - 1, WEEKLY_REWARDS.length - 1)].index} IDX
            </span>
          </div>
        </div>
      )}

      {/* ═══ WEEKLY REWARD TIERS ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3 h-3 text-gold/60" />
          <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider" style={teko}>
            Hold #1 Longer = More Loot
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {WEEKLY_REWARDS.map((tier, i) => {
            const isEarned = i < weeksActive && king;
            return (
              <div key={i} className="text-center py-2">
                <span className="text-[8px] text-muted-foreground/50 font-bold uppercase block">Wk {tier.week}</span>
                <span className={cn(
                  "text-xl font-bold leading-none block",
                  isEarned ? "text-gold" : "text-foreground/20"
                )} style={teko}>
                  +{tier.xp}
                </span>
                <span className="text-[7px] text-muted-foreground/40 uppercase">XP</span>
                <span className={cn(
                  "text-[9px] font-bold block",
                  isEarned ? "text-emerald-400" : "text-foreground/15"
                )}>
                  +{tier.index} IDX
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ LEADERBOARD ═══ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="text-xl text-foreground uppercase tracking-wider leading-none font-bold" style={teko}>
              The Hill
            </h3>
          </div>
          <span className="text-sm text-muted-foreground font-bold tabular-nums" style={teko}>
            {totalEdits} / {MAX_EDITS}
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-10 text-center">
            <Flame className="w-8 h-8 text-muted-foreground/15 mx-auto mb-2" />
            <p className="text-lg font-bold text-muted-foreground/40" style={teko}>No Edits Yet</p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">Be the first to take the hill 🔥</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {leaderboard.map((sub, idx) => {
              const rank = idx + 1;
              const isKing = rank === 1 && sub.status === 'scored';
              const isScored = sub.status === 'scored';

              return (
                <motion.a
                  key={sub.id}
                  href={sub.submission_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-1 transition-all group active:scale-[0.99]",
                    isKing && "border-l-2 border-gold pl-2"
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    "text-3xl tabular-nums w-8 text-center shrink-0 font-bold leading-none",
                    isKing ? "text-gold" : rank === 2 ? "text-foreground/50" : rank === 3 ? "text-foreground/30" : "text-foreground/10"
                  )} style={teko}>
                    {rank}
                  </span>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className={cn(
                      isKing ? "w-10 h-10 border-2 border-gold" : "w-8 h-8 border border-border/20"
                    )}>
                      <AvatarImage src={sub.avatar_url || ''} />
                      <AvatarFallback className="text-[9px] font-bold">
                        {sub.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isKing && (
                      <Crown className="absolute -top-1.5 -right-1 w-3 h-3 text-gold" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-bold truncate block",
                      isKing ? "text-gold" : "text-foreground"
                    )}>
                      @{sub.username}
                    </span>
                    {isKing && (
                      <span className="text-[7px] text-gold/50 font-black uppercase tracking-wider">King</span>
                    )}
                    {!isScored && (
                      <span className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-wider">Awaiting score</span>
                    )}
                  </div>

                  {/* Score */}
                  {isScored && sub.qoi_score != null ? (
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-2xl font-bold leading-none tabular-nums",
                        isKing ? "text-gold" : "text-foreground/60"
                      )} style={teko}>
                        {Math.round(sub.qoi_score)}
                      </span>
                      <span className="text-[7px] text-muted-foreground/30 uppercase block">QOI</span>
                    </div>
                  ) : (
                    <span className="text-[8px] text-muted-foreground/20 font-bold uppercase shrink-0">—</span>
                  )}
                </motion.a>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ ENDGAME CALLOUT ═══ */}
      {!isComplete && totalEdits >= 20 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-3">
          <p className="text-sm font-bold text-destructive uppercase tracking-wider" style={teko}>
            🔥 {editsLeft} Edits Left — Take The Hill Now
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            The king gets max rewards when the hill fills. Get in before it ends!
          </p>
        </motion.div>
      )}
    </div>
  );
}
