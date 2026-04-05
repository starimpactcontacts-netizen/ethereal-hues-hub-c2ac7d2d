import { motion } from "framer-motion";
import { Crown, Flame, Trophy, Zap, TrendingUp, Star, Shield, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";

const teko = { fontFamily: 'Teko, sans-serif' };
const MAX_EDITS = 30;

// Weekly reward tiers based on how long you hold #1
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

  // Sort by score for leaderboard
  const scored = [...submissions]
    .filter(s => s.status === 'scored')
    .sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = submissions.filter(s => s.status === 'pending');
  const leaderboard = [...scored, ...pending];
  const king = scored[0] || null;

  // Simulate weeks held (based on submission timing)
  const weeksActive = Math.max(1, Math.ceil((Date.now() - new Date(submissions[0]?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)));

  return (
    <div className="space-y-4">
      {/* ═══ 30 EDIT GOAL TRACKER ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gold/[0.06] via-background to-background p-4 border border-gold/10">
        {/* Ambient glow */}
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/8 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold/15 border border-gold/30 flex items-center justify-center">
                <Target className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h3 className="text-xl text-foreground uppercase tracking-wider leading-none font-bold" style={teko}>
                  Hill Progress
                </h3>
                <p className="text-[9px] text-muted-foreground">
                  {isComplete ? 'Hill conquered — rewards distributed!' : `${editsLeft} more edits to end the hill`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <motion.span
                key={totalEdits}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="text-3xl tabular-nums font-bold text-gold leading-none block"
                style={teko}
              >
                {totalEdits}
              </motion.span>
              <span className="text-[10px] text-muted-foreground font-bold">/ {MAX_EDITS}</span>
            </div>
          </div>

          {/* Progress bar — chunked like XP bar */}
          <div className="relative h-6 bg-foreground/[0.04] border border-foreground/[0.06] overflow-hidden">
            {/* Segment lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-foreground/[0.08]"
                style={{ left: `${(i + 1) * 20}%` }}
              />
            ))}

            {/* Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={cn(
                "h-full relative",
                isComplete
                  ? "bg-gradient-to-r from-gold via-amber-400 to-gold"
                  : progress > 0.7
                  ? "bg-gradient-to-r from-destructive via-orange-500 to-gold"
                  : "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
              )}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>

            {/* Milestone markers */}
            {[10, 20, 30].map(mark => (
              <div
                key={mark}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${(mark / MAX_EDITS) * 100}%`, transform: 'translateX(-50%)' }}
              >
                <span className={cn(
                  "text-[8px] font-black tabular-nums",
                  totalEdits >= mark ? "text-background" : "text-muted-foreground/30"
                )}>
                  {mark}
                </span>
              </div>
            ))}
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-2 mt-2.5">
            {totalEdits >= 10 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20"
              >
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">10 Hit</span>
              </motion.div>
            )}
            {totalEdits >= 20 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20"
              >
                <Flame className="w-2.5 h-2.5 text-orange-400" />
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-wider">20 Hit</span>
              </motion.div>
            )}
            {isComplete && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-gold/15 border border-gold/30"
              >
                <Crown className="w-2.5 h-2.5 text-gold" />
                <span className="text-[8px] font-black text-gold uppercase tracking-wider">Hill Conquered</span>
              </motion.div>
            )}
            {!isComplete && isLive && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Accepting edits</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ KING OF THE HILL — Current King Banner ═══ */}
      {king && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden border-2 border-gold/30 bg-gradient-to-r from-gold/[0.08] via-background to-gold/[0.04]"
        >
          {/* Crown glow */}
          <motion.div
            className="absolute -top-10 left-1/4 w-32 h-32 bg-gold/10 rounded-full blur-3xl pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <div className="relative z-10 p-4 flex items-center gap-4">
            {/* King avatar */}
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-gold shadow-[0_0_20px_-4px_rgba(255,215,0,0.4)]">
                <AvatarImage src={king.avatar_url || ''} />
                <AvatarFallback className="bg-gold/20 text-gold font-bold text-lg" style={teko}>
                  {king.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <motion.div
                className="absolute -top-2 -right-1"
                animate={{ rotate: [0, -5, 5, 0], y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-5 h-5 text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gold/70 font-black uppercase tracking-[0.2em]">Current King</p>
              <p className="text-2xl text-foreground font-bold leading-none truncate" style={teko}>
                @{king.username}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {king.qoi_score != null && (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl text-gold font-bold" style={teko}>{Math.round(king.qoi_score)}</span>
                    <span className="text-[8px] text-muted-foreground uppercase">QOI</span>
                  </div>
                )}
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10">
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[8px] font-bold text-emerald-400">Week {weeksActive}</span>
                </div>
              </div>
            </div>

            {/* Weekly reward indicator */}
            <div className="text-center shrink-0">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-2 bg-gold/15 border border-gold/30"
              >
                <span className="text-[8px] text-gold/60 font-black uppercase tracking-wider block">Weekly</span>
                <span className="text-lg text-gold font-bold leading-none block" style={teko}>
                  +{WEEKLY_REWARDS[Math.min(weeksActive - 1, WEEKLY_REWARDS.length - 1)].xp} XP
                </span>
                <span className="text-[9px] text-emerald-400 font-bold block">
                  +{WEEKLY_REWARDS[Math.min(weeksActive - 1, WEEKLY_REWARDS.length - 1)].index} IDX
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ WEEKLY REWARD TIERS ═══ */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-gold" />
          <span className="text-sm font-bold text-foreground/60 uppercase tracking-wider" style={teko}>
            King Rewards — Hold #1 Longer = More Loot
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {WEEKLY_REWARDS.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-2 text-center border transition-all",
                i < weeksActive && king
                  ? "border-gold/30 bg-gold/[0.06]"
                  : "border-foreground/[0.06] bg-foreground/[0.02]"
              )}
            >
              <span className="text-[8px] text-muted-foreground font-black uppercase tracking-wider block">
                Wk {tier.week}
              </span>
              <span className={cn(
                "text-lg font-bold leading-none block",
                i < weeksActive && king ? "text-gold" : "text-foreground/30"
              )} style={teko}>
                +{tier.xp}
              </span>
              <span className="text-[7px] text-muted-foreground uppercase">XP</span>
              <div className={cn(
                "text-[9px] font-bold mt-0.5",
                i < weeksActive && king ? "text-emerald-400" : "text-foreground/20"
              )}>
                +{tier.index} IDX
              </div>
              {i < weeksActive && king && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3 h-3 mx-auto mt-1 bg-gold/20 border border-gold/40 flex items-center justify-center"
                >
                  <span className="text-[6px] text-gold">✓</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ LEADERBOARD ═══ */}
      <div className="space-y-1">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="text-xl text-foreground uppercase tracking-wider leading-none font-bold" style={teko}>
              The Hill
            </h3>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
          </div>
          <span className="text-sm text-muted-foreground font-bold tabular-nums" style={teko}>
            {totalEdits} / {MAX_EDITS}
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-lg font-bold text-muted-foreground" style={teko}>No Edits Yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to take the hill 🔥</p>
          </div>
        ) : (
          <div className="space-y-px">
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
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 p-2.5 transition-all group active:scale-[0.99]",
                    isKing
                      ? "bg-gradient-to-r from-gold/[0.08] via-gold/[0.04] to-transparent border-l-2 border-gold"
                      : rank <= 3 && isScored
                      ? "bg-foreground/[0.03] border-l-2 border-foreground/10"
                      : "bg-foreground/[0.01] hover:bg-foreground/[0.03]"
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    "text-3xl tabular-nums w-10 text-center shrink-0 font-bold leading-none",
                    isKing ? "text-gold" : rank === 2 ? "text-foreground/60" : rank === 3 ? "text-amber-700/60" : "text-foreground/15"
                  )} style={teko}>
                    {rank}
                  </span>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className={cn(
                      "border-2",
                      isKing ? "w-10 h-10 border-gold shadow-[0_0_12px_-2px_rgba(255,215,0,0.3)]" : "w-8 h-8 border-border/30"
                    )}>
                      <AvatarImage src={sub.avatar_url || ''} />
                      <AvatarFallback className="text-[9px] bg-surface-2 font-bold">
                        {sub.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isKing && (
                      <motion.div
                        className="absolute -top-1.5 -right-1"
                        animate={{ rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Crown className="w-3.5 h-3.5 text-gold" />
                      </motion.div>
                    )}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-bold truncate block",
                      isKing ? "text-gold" : "text-foreground"
                    )}>
                      @{sub.username}
                    </span>
                    {isKing && (
                      <span className="text-[8px] text-gold/60 font-black uppercase tracking-wider">
                        👑 King of the Hill
                      </span>
                    )}
                    {!isScored && (
                      <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-wider">
                        Awaiting score
                      </span>
                    )}
                  </div>

                  {/* Score */}
                  {isScored && sub.qoi_score != null ? (
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "text-2xl font-bold leading-none tabular-nums",
                        isKing ? "text-gold" : (sub.qoi_score || 0) >= 70 ? "text-foreground" : "text-foreground/50"
                      )} style={teko}>
                        {Math.round(sub.qoi_score)}
                      </span>
                      <span className="text-[7px] text-muted-foreground/40 uppercase block">QOI</span>
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-foreground/[0.04] shrink-0">
                      <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-wider">Pending</span>
                    </div>
                  )}

                  {/* Reward indicator for top 3 */}
                  {isScored && rank <= 3 && (
                    <div className={cn(
                      "shrink-0 px-1.5 py-0.5",
                      rank === 1 ? "bg-gold/15" : rank === 2 ? "bg-foreground/[0.05]" : "bg-amber-800/10"
                    )}>
                      <Star className={cn(
                        "w-3 h-3",
                        rank === 1 ? "text-gold" : rank === 2 ? "text-foreground/30" : "text-amber-700/30"
                      )} />
                    </div>
                  )}
                </motion.a>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ ENDGAME CALLOUT ═══ */}
      {!isComplete && totalEdits >= 20 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-destructive/[0.06] border border-destructive/20 text-center"
        >
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
