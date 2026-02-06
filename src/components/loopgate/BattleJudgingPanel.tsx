import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gavel, Trophy, ExternalLink, Loader2, Crown,
  Heart, Lightbulb, Music, Fingerprint, Zap, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { claimBattle, judgeBattle } from '@/hooks/useBattleJudging';
import { toast } from 'sonner';
import type { Battle } from '@/hooks/useBattles';

const PILLARS = [
  { id: 'emotion', label: 'Emotion', max: 15, icon: Heart, color: 'text-pink-400' },
  { id: 'creativity', label: 'Creativity', max: 25, icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'sync', label: 'Sync', max: 25, icon: Music, color: 'text-purple-400' },
  { id: 'identity', label: 'Identity', max: 10, icon: Fingerprint, color: 'text-blue-400' },
  { id: 'execution', label: 'Execution', max: 25, icon: Zap, color: 'text-green-400' },
];

interface Props {
  battle: Battle;
}

export default function BattleJudgingPanel({ battle }: Props) {
  const { user, isAdmin } = useAuth();
  const { roles } = useUserRoles(user?.id);

  const [claiming, setClaiming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [judgeNotes, setJudgeNotes] = useState('');
  const [cScores, setCScores] = useState({ emotion: 8, creativity: 15, sync: 15, identity: 5, execution: 15 });
  const [oScores, setOScores] = useState({ emotion: 8, creativity: 15, sync: 15, identity: 5, execution: 15 });

  const isJudge = roles.includes('judge');
  const isDev = roles.includes('dev');
  const canJudge = isAdmin || isJudge || isDev;
  const cTotal = Object.values(cScores).reduce((a, b) => a + b, 0);
  const oTotal = Object.values(oScores).reduce((a, b) => a + b, 0);

  if (!canJudge || battle.status !== 'judging') return null;

  const isClaimed = !!battle.judge_id;
  const isMyJudge = battle.judge_id === user?.id;

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    const success = await claimBattle(battle.id, user.id);
    setClaiming(false);
    if (success) {
      toast.success('Battle claimed! Review both submissions and score them.');
    } else {
      toast.error('Failed to claim — may already be claimed');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    const winnerId = cTotal >= oTotal ? battle.challenger_id : battle.opponent_id;
    if (!winnerId) {
      toast.error('Cannot determine winner');
      return;
    }

    setSubmitting(true);
    const success = await judgeBattle(
      battle.id,
      user.id,
      cTotal,
      oTotal,
      winnerId,
      judgeNotes || null
    );
    setSubmitting(false);

    if (success) {
      toast.success('Battle judged! Winner announced.');
    } else {
      toast.error('Failed to submit judgment');
    }
  };

  // Not claimed yet - show claim button
  if (!isClaimed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gold/10 via-surface-1 to-gold/5 border border-gold/40 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4 text-gold" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Judge This Battle</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Both editors have submitted. Claim this battle to score both edits and decide the winner.
        </p>
        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-gold text-background hover:bg-gold/90 font-display uppercase tracking-wider"
        >
          {claiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
          {claiming ? 'Claiming...' : 'Claim & Judge'}
        </Button>
      </motion.div>
    );
  }

  // Claimed by someone else
  if (!isMyJudge) {
    return (
      <div className="bg-surface-1 border border-gold/30 p-4">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-gold" />
          <span className="text-xs text-muted-foreground">A judge has claimed this battle</span>
        </div>
      </div>
    );
  }

  // My claim - show scoring UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-1 border border-gold/40 p-4 space-y-5"
    >
      <div className="flex items-center gap-2">
        <Gavel className="w-4 h-4 text-gold" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Score Both Edits</h3>
      </div>

      {/* Instructions */}
      <p className="text-[10px] text-muted-foreground">
        Watch both submissions, then score each on 5 QOI pillars. Higher total wins.
      </p>

      {/* Challenger Scoring */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-red-500/30">
          <Avatar className="w-6 h-6 border border-red-500/50">
            <AvatarImage src={battle.challenger_avatar_url || ''} />
            <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px]">
              {battle.challenger_username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-display text-foreground">{battle.challenger_username}</span>
          {battle.challenger_submission_url && (
            <a href={battle.challenger_submission_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gold hover:underline">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <span className="text-sm font-bold text-gold">{cTotal}/100</span>
        </div>

        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const score = cScores[pillar.id as keyof typeof cScores];
          return (
            <div key={`c-${pillar.id}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={pillar.color} />
                  <span className="text-[10px]">{pillar.label}</span>
                </div>
                <span className="text-[10px] font-bold text-gold">{score}/{pillar.max}</span>
              </div>
              <Slider
                value={[score]}
                max={pillar.max}
                step={1}
                onValueChange={([v]) => setCScores(prev => ({ ...prev, [pillar.id]: v }))}
                className="py-0.5"
              />
            </div>
          );
        })}
      </div>

      {/* Opponent Scoring */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-sky-500/30">
          <Avatar className="w-6 h-6 border border-sky-500/50">
            <AvatarImage src={battle.opponent_avatar_url || ''} />
            <AvatarFallback className="bg-sky-500/20 text-sky-400 text-[10px]">
              {battle.opponent_username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-display text-foreground">{battle.opponent_username}</span>
          {battle.opponent_submission_url && (
            <a href={battle.opponent_submission_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-gold hover:underline">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <span className="text-sm font-bold text-gold">{oTotal}/100</span>
        </div>

        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const score = oScores[pillar.id as keyof typeof oScores];
          return (
            <div key={`o-${pillar.id}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={pillar.color} />
                  <span className="text-[10px]">{pillar.label}</span>
                </div>
                <span className="text-[10px] font-bold text-gold">{score}/{pillar.max}</span>
              </div>
              <Slider
                value={[score]}
                max={pillar.max}
                step={1}
                onValueChange={([v]) => setOScores(prev => ({ ...prev, [pillar.id]: v }))}
                className="py-0.5"
              />
            </div>
          );
        })}
      </div>

      {/* Score Comparison */}
      <div className="bg-background border border-border p-3 text-center">
        <div className="flex items-center justify-center gap-6">
          <div>
            <span className="text-2xl font-display font-bold text-red-400">{cTotal}</span>
            <span className="text-[9px] text-muted-foreground block">{battle.challenger_username}</span>
          </div>
          <span className="text-xs text-muted-foreground font-bold">VS</span>
          <div>
            <span className="text-2xl font-display font-bold text-sky-400">{oTotal}</span>
            <span className="text-[9px] text-muted-foreground block">{battle.opponent_username}</span>
          </div>
        </div>
        {cTotal !== oTotal && (
          <div className="mt-2 flex items-center justify-center gap-1">
            <Crown className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-gold font-bold uppercase">
              Winner: {cTotal > oTotal ? battle.challenger_username : battle.opponent_username}
            </span>
          </div>
        )}
        {cTotal === oTotal && (
          <p className="text-[10px] text-amber-400 mt-2">Scores are tied — adjust to decide a winner</p>
        )}
      </div>

      {/* Judge Notes */}
      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <MessageSquare size={10} />
          Judge Notes (Optional)
        </label>
        <Textarea
          value={judgeNotes}
          onChange={(e) => setJudgeNotes(e.target.value)}
          placeholder="Breakdown of your decision..."
          className="bg-background border-border resize-none h-20 text-sm"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || cTotal === oTotal}
        className="w-full bg-gold text-background hover:bg-gold/90 font-display uppercase tracking-wider"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
        ) : (
          <><Trophy className="w-4 h-4 mr-2" /> Submit Judgment</>
        )}
      </Button>
    </motion.div>
  );
}
