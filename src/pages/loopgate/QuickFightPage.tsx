import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Clock, Send, Trophy, ExternalLink, Gavel, Share2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useQuickFight, submitQuickFight } from '@/hooks/useQuickFight';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import QuickFightChat from '@/components/loopgate/QuickFightChat';
import QuickFightResultCard from '@/components/loopgate/QuickFightResultCard';

export default function QuickFightPage() {
  const { fightId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { fight, loading } = useQuickFight(fightId);
  const { isJudge } = useUserRoles(user?.id);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [judgeScore1, setJudgeScore1] = useState('');
  const [judgeScore2, setJudgeScore2] = useState('');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [judging, setJudging] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Swords className="w-8 h-8 text-red-400 animate-pulse" />
      </div>
    );
  }

  if (!fight) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Swords className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Fight not found</p>
        <Button variant="outline" onClick={() => navigate('/hub')}>Back to Hub</Button>
      </div>
    );
  }

  const isP1 = user?.id === fight.player_1_id;
  const isP2 = user?.id === fight.player_2_id;
  const isParticipant = isP1 || isP2;
  const canSubmit = fight.status === 'active' && isParticipant && (
    (isP1 && !fight.player_1_submitted_at) || (isP2 && !fight.player_2_submitted_at)
  );
  const canJudge = fight.status === 'judging' && isJudge && !fight.judge_id;

  const handleSubmit = async () => {
    if (!submissionUrl.trim() || !user) return;
    setSubmitting(true);
    const success = await submitQuickFight(fight.id, user.id, submissionUrl.trim());
    setSubmitting(false);
    if (success) {
      toast.success('🔥 Edit submitted!');
      setSubmissionUrl('');
    } else {
      toast.error('Failed to submit');
    }
  };

  const handleJudge = async (winnerId: string) => {
    if (!user || judging) return;
    const s1 = parseInt(judgeScore1) || 0;
    const s2 = parseInt(judgeScore2) || 0;
    setJudging(true);
    
    const { error } = await supabase
      .from('quick_fights')
      .update({
        judge_id: user.id,
        judge_username: profile?.username,
        winner_id: winnerId,
        winner_score: winnerId === fight.player_1_id ? s1 : s2,
        loser_score: winnerId === fight.player_1_id ? s2 : s1,
        judge_notes: judgeNotes || null,
        judged_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', fight.id);

    if (!error) {
      toast.success('⚖️ Winner declared!');
      // XP is now awarded automatically by database trigger (on_quick_fight_completed)
    } else {
      toast.error('Failed to judge');
    }
    setJudging(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (isParticipant && (fight.status === 'active' || fight.status === 'judging')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/hub');
              }
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{isParticipant && (fight.status === 'active' || fight.status === 'judging') ? 'Overview' : 'Back'}</span>
          </button>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            {fight.status === 'active' ? '⚔️ LIVE FIGHT' :
             fight.status === 'judging' ? '⚖️ AWAITING JUDGE' :
             fight.status === 'completed' ? '🏆 DECIDED' : fight.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* VS Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-background to-blue-500/20" />
        <div className="relative px-4 py-8">
          <div className="flex items-center justify-center gap-6">
            {/* Player 1 (RED) */}
            <div className="flex flex-col items-center flex-1">
              <div className={`relative ${fight.winner_id === fight.player_1_id ? 'ring-4 ring-gold ring-offset-2 ring-offset-background' : ''} rounded-full`}>
                <Avatar className="w-20 h-20 border-4 border-red-500 shadow-lg shadow-red-500/30">
                  <AvatarImage src={fight.player_1_avatar_url || ''} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                    {fight.player_1_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {fight.winner_id === fight.player_1_id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold px-2 py-0.5 rounded-sm">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <span className="font-display text-sm text-foreground mt-3">{fight.player_1_username}</span>
              <span className="text-[9px] text-red-400 font-bold uppercase">RED</span>
              {fight.player_1_submitted_at && (
                <span className="text-[9px] text-emerald-400 mt-1">✓ Submitted</span>
              )}
            </div>

            {/* VS */}
            <div className="relative">
              <motion.div
                animate={fight.status === 'active' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-blue-500 flex items-center justify-center shadow-xl"
              >
                <Swords className="w-7 h-7 text-white" />
              </motion.div>
            </div>

            {/* Player 2 (BLUE) */}
            <div className="flex flex-col items-center flex-1">
              <div className={`relative ${fight.winner_id === fight.player_2_id ? 'ring-4 ring-gold ring-offset-2 ring-offset-background' : ''} rounded-full`}>
                <Avatar className="w-20 h-20 border-4 border-blue-500 shadow-lg shadow-blue-500/30">
                  <AvatarImage src={fight.player_2_avatar_url || ''} />
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 text-2xl font-bold">
                    {fight.player_2_username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {fight.winner_id === fight.player_2_id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gold px-2 py-0.5 rounded-sm">
                    <Trophy className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <span className="font-display text-sm text-foreground mt-3">{fight.player_2_username || '???'}</span>
              <span className="text-[9px] text-blue-400 font-bold uppercase">BLUE</span>
              {fight.player_2_submitted_at && (
                <span className="text-[9px] text-emerald-400 mt-1">✓ Submitted</span>
              )}
            </div>
          </div>

          {/* Timer */}
          {fight.status === 'active' && fight.ends_at && (
            <div className="flex justify-center mt-4">
              <div className="bg-surface-1 border border-red-500/30 px-6 py-2 rounded-lg">
                <CountdownTimer endDate={fight.ends_at} label="Time Left" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4 mt-2">
        {/* Submission Form */}
        {canSubmit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-1 border border-gold/30 p-4 rounded-lg"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-gold" />
              Submit Your Edit
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3">Paste your TikTok, YouTube, or CapCut link</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://tiktok.com/..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="flex-1 bg-background border-border"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !submissionUrl.trim()}
                className="bg-gold hover:bg-gold/90 text-background"
              >
                {submitting ? '...' : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Submissions Display */}
        {(fight.player_1_submission_url || fight.player_2_submission_url) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Submissions</h3>
            {fight.player_1_submission_url && (
              <a href={fight.player_1_submission_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-1 border border-red-500/30 rounded-lg hover:border-red-500/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] text-red-400 font-bold">R</span>
                  <span className="text-sm text-foreground">{fight.player_1_username}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
            {fight.player_2_submission_url && (
              <a href={fight.player_2_submission_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-surface-1 border border-blue-500/30 rounded-lg hover:border-blue-500/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">B</span>
                  <span className="text-sm text-foreground">{fight.player_2_username}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Judge Panel (simplified) */}
        {canJudge && (
          <div className="bg-surface-1 border border-purple-500/30 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-purple-400" />
              Judge This Fight
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-red-400 font-bold uppercase">{fight.player_1_username} (RED)</label>
                <Input
                  type="number" min="0" max="100"
                  placeholder="Score"
                  value={judgeScore1}
                  onChange={(e) => setJudgeScore1(e.target.value)}
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <label className="text-[10px] text-blue-400 font-bold uppercase">{fight.player_2_username} (BLUE)</label>
                <Input
                  type="number" min="0" max="100"
                  placeholder="Score"
                  value={judgeScore2}
                  onChange={(e) => setJudgeScore2(e.target.value)}
                  className="mt-1 bg-background"
                />
              </div>
            </div>
            <Input
              placeholder="Judge notes (optional)"
              value={judgeNotes}
              onChange={(e) => setJudgeNotes(e.target.value)}
              className="mb-3 bg-background"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleJudge(fight.player_1_id)}
                disabled={judging}
                className="bg-red-500 hover:bg-red-600 text-white font-display uppercase"
              >
                <Trophy className="w-4 h-4 mr-1" /> {fight.player_1_username} Wins
              </Button>
              <Button
                onClick={() => fight.player_2_id && handleJudge(fight.player_2_id)}
                disabled={judging || !fight.player_2_id}
                className="bg-blue-500 hover:bg-blue-600 text-white font-display uppercase"
              >
                <Trophy className="w-4 h-4 mr-1" /> {fight.player_2_username} Wins
              </Button>
            </div>
          </div>
        )}

        {/* Result Card (shareable) */}
        {fight.status === 'completed' && fight.winner_id && (
          <QuickFightResultCard fight={fight} />
        )}

        {/* Chat */}
        {fight.player_2_id && (
          <QuickFightChat
            fightId={fight.id}
            player1Id={fight.player_1_id}
            player2Id={fight.player_2_id}
            player1Username={fight.player_1_username}
            player2Username={fight.player_2_username || '???'}
          />
        )}
      </div>
    </div>
  );
}
