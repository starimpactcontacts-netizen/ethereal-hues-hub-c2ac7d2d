import { motion } from "framer-motion";
import { Clock, Gift, CheckCircle2, Zap, Trophy, Users, Film, BarChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { type ChallengeWithProgress } from "@/hooks/useCrewChallenges";
import { cn } from "@/lib/utils";

interface CrewChallengeCardProps {
  challenge: ChallengeWithProgress;
  timeRemaining: string;
  onClaim: (challengeId: string) => void;
  claiming?: boolean;
}

const METRIC_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  crew_xp: {
    icon: <Zap className="w-4 h-4" />,
    color: "text-gold",
  },
  submissions: {
    icon: <Film className="w-4 h-4" />,
    color: "text-purple-400",
  },
  members: {
    icon: <Users className="w-4 h-4" />,
    color: "text-green-400",
  },
  arena_wins: {
    icon: <Trophy className="w-4 h-4" />,
    color: "text-amber-400",
  },
  gqt_scores: {
    icon: <BarChart className="w-4 h-4" />,
    color: "text-blue-400",
  },
};

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  weekly: {
    label: "WEEKLY",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  daily: {
    label: "DAILY",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  special: {
    label: "SPECIAL",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
};

export default function CrewChallengeCard({
  challenge,
  timeRemaining,
  onClaim,
  claiming = false,
}: CrewChallengeCardProps) {
  const metricConfig = METRIC_CONFIG[challenge.target_metric] || METRIC_CONFIG.crew_xp;
  const typeBadge = TYPE_BADGES[challenge.challenge_type] || TYPE_BADGES.weekly;
  const currentValue = challenge.progress?.current_value || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative bg-surface-1 border rounded-lg p-4 overflow-hidden transition-all",
        challenge.isCompleted && !challenge.xpClaimed
          ? "border-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          : challenge.isCompleted
          ? "border-green-500/30 opacity-75"
          : "border-border hover:border-border/80"
      )}
    >
      {/* Completion shimmer effect */}
      {challenge.canClaim && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg bg-surface-2", metricConfig.color)}>
              {metricConfig.icon}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{challenge.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {challenge.description}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border shrink-0",
              typeBadge.color
            )}
          >
            {typeBadge.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {currentValue} / {challenge.target_value}
            </span>
            <span className="font-semibold text-foreground">
              {challenge.percentComplete}%
            </span>
          </div>
          <Progress
            value={challenge.percentComplete}
            className={cn(
              "h-2",
              challenge.isCompleted && "bg-green-500/20"
            )}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {/* Time remaining */}
            {!challenge.isCompleted && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeRemaining}
              </span>
            )}
            
            {/* XP Reward */}
            <span className="flex items-center gap-1 font-semibold text-gold">
              <Gift className="w-3 h-3" />
              +{challenge.xp_reward} XP
            </span>
          </div>

          {/* Action */}
          {challenge.canClaim ? (
            <Button
              size="sm"
              variant="default"
              onClick={() => onClaim(challenge.id)}
              disabled={claiming}
              className="h-7 px-3 bg-gold hover:bg-gold/90 text-black font-bold text-xs"
            >
              {claiming ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Gift className="w-3 h-3 mr-1" />
                  Claim
                </>
              )}
            </Button>
          ) : challenge.isCompleted ? (
            <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Claimed
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
