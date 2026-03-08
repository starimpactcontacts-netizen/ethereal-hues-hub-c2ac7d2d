import { useState } from "react";
import { Swords, Trophy, Clock } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { motion, AnimatePresence } from "framer-motion";
import { useCrewChallenges } from "@/hooks/useCrewChallenges";
import CrewChallengeCard from "./CrewChallengeCard";

interface CrewChallengesPanelProps {
  crewId: string;
}

export default function CrewChallengesPanel({ crewId }: CrewChallengesPanelProps) {
  const { challenges, loading, claimReward, getTimeRemaining } = useCrewChallenges(crewId);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId);
    await claimReward(challengeId);
    setClaimingId(null);
  };

  // Separate active and completed challenges
  const activeChallenges = challenges.filter((c) => !c.isCompleted || c.canClaim);
  const completedChallenges = challenges.filter((c) => c.isCompleted && !c.canClaim);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalXP = challenges.reduce((sum, c) => sum + c.xp_reward, 0);
  const claimableXP = challenges
    .filter((c) => c.canClaim)
    .reduce((sum, c) => sum + c.xp_reward, 0);

  return (
    <div className="space-y-6">

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
          <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
          <p className="text-lg font-bold">{challenges.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Quests
          </p>
        </div>
        <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
          <GateIcon className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gold">+{totalXP}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Total XP
          </p>
        </div>
        <div className="bg-surface-1 border border-gold/30 rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-400">
            {claimableXP > 0 ? `+${claimableXP}` : "0"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Claimable
          </p>
        </div>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Swords className="w-4 h-4" />
            Unit Quests
          </h3>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {activeChallenges.map((challenge) => (
                <CrewChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  timeRemaining={getTimeRemaining(challenge.ends_at)}
                  onClaim={handleClaim}
                  claiming={claimingId === challenge.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state when no challenges */}
      {challenges.length === 0 && (
        <div className="text-center py-8">
          <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No quests available right now</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Check back soon!</p>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Completed ({completedChallenges.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedChallenges.slice(0, 3).map((challenge) => (
              <div
                key={challenge.id}
                className="bg-surface-1/50 border border-border/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium line-through opacity-70">
                    {challenge.title}
                  </p>
                  <p className="text-xs text-green-400">
                    +{challenge.xp_reward} XP claimed
                  </p>
                </div>
                <Trophy className="w-4 h-4 text-gold" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
