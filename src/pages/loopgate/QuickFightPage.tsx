import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Clock, Send, Trophy, ExternalLink, Gavel, Share2, Search, Play, Video, Music, ThumbsUp, Upload, Sparkles } from 'lucide-react';
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
import BattleSongPicker from '@/components/loopgate/BattleSongPicker';
import BattleSubmissionCard from '@/components/loopgate/BattleSubmissionCard';

/** Detect platform from URL */
function detectPlatform(url: string): string {
  if (!url) return 'unknown';
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('capcut.com')) return 'capcut';
  return 'unknown';
}

export default function QuickFightPage() {
  const { fightId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { fight, loading } = useQuickFight(fightId);
  const { isJudge, isAnyJudge, isAdmin, isDev } = useUserRoles(user?.id);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [judgeScore1, setJudgeScore1] = useState('');
  const [judgeScore2, setJudgeScore2] = useState('');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [judging, setJudging] = useState(false);
  const [judgeVideoUrl, setJudgeVideoUrl] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  // Auto-resolve expired fights on page load
  useEffect(() => {
    supabase.rpc('resolve_expired_quick_fights').then(() => {});
  }, [fightId]);

  // Fetch my vote
  useEffect(() => {
    if (!fightId || !user?.id) return;
    supabase
      .from('quick_fight_votes')
      .select('voted_for')
      .eq('fight_id', fightId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyVote(data.voted_for); });
  }, [fightId, user?.id]);

  const hasSongPicked = !!(fight as any)?.theme_song_name;

  const handleSongPick = async (drop: any) => {
    if (!fight) return;
    await supabase
      .from('quick_fights')
      .update({
        theme_drop_id: drop.id,
        theme_song_name: drop.song_name,
        theme_song_preview_url: drop.song_preview_url,
      })
      .eq('id', fight.id);
    toast.success('🎵 Song picked!');
  };

  const handleVote = async (votedFor: string) => {
    if (!user?.id || !fight || voting) return;
    setVoting(true);
    const { error } = await supabase.from('quick_fight_votes').insert({
      fight_id: fight.id,
      user_id: user.id,
      voted_for: votedFor,
    });
    if (!error) {
      setMyVote(votedFor);
      toast.success('Vote recorded!');
    }
    setVoting(false);
  };

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
  const canJudge = fight.status === 'judging' && (isJudge || isAnyJudge || isAdmin || isDev) && !fight.judge_id;

  const handleSubmit = async () => {
    if (!submissionUrl.trim() || !user) return;
    setSubmitting(true);
    const success = await submitQuickFight(fight.id, user.id, submissionUrl.trim());
    setSubmitting(false);
    if (success) {
      setSubmissionUrl('');
      // +50 XP bonus if a song from the library was picked
      if (hasSongPicked) {
        try {
          await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_amount: 50,
            p_action: 'song_pick_bonus',
            p_description: `Picked a library song for Quick 1v1`,
          });
          toast.success('🔥 Edit submitted! +50 XP song bonus');
        } catch {
          toast.success('🔥 Edit submitted!');
        }
      } else {
        toast.success('🔥 Edit submitted!');
      }
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
        judge_video_url: judgeVideoUrl.trim() || null,
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
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
            {fight.status === 'active' ? '⚔️ LIVE FIGHT' :
             fight.status === 'judging' ? '⚖️ AWAITING JUDGE' :
             fight.status === 'completed' ? '🏆 DECIDED' :
             fight.status === 'cancelled' ? '🚫 CANCELLED' :
             fight.status === 'forfeited' ? '🏳️ FORFEIT' : fight.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Compact VS strip — minimal chrome so the EDITS are the hero */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-background to-blue-500/10" />
        <div className="relative px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Player 1 (RED) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className={`w-7 h-7 border ${fight.winner_id === fight.player_1_id ? 'border-gold' : 'border-red-500/70'}`}>
              <AvatarImage src={fight.player_1_avatar_url || ''} />
              <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px] font-bold">
                {fight.player_1_username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate leading-none">@{fight.player_1_username}</p>
              <p className="text-[8px] text-red-400 font-bold uppercase tracking-wider mt-0.5">
                RED{fight.player_1_submitted_at ? ' · ✓' : ''}
              </p>
            </div>
          </div>

          {/* Center: timer or VS */}
          {fight.status === 'active' && fight.ends_at ? (
            <div className="bg-surface-1 border border-border/60 px-2.5 py-1 shrink-0">
              <CountdownTimer endDate={fight.ends_at} label="" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-blue-500 flex items-center justify-center shrink-0">
              <Swords className="w-4 h-4 text-white" />
            </div>
          )}

          {/* Player 2 (BLUE) */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-bold text-foreground truncate leading-none">@{fight.player_2_username || '???'}</p>
              <p className="text-[8px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                BLUE{fight.player_2_submitted_at ? ' · ✓' : ''}
              </p>
            </div>
            <Avatar className={`w-7 h-7 border ${fight.winner_id === fight.player_2_id ? 'border-gold' : 'border-blue-500/70'}`}>
              <AvatarImage src={fight.player_2_avatar_url || ''} />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                {fight.player_2_username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4 mt-2">
        {/* Show picked song for non-participants */}
        {!isParticipant && (fight as any).theme_song_name && (
          <div className="bg-surface-1 border border-border p-3 flex items-center gap-3">
            <Music className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Theme Song</p>
              <p className="text-sm text-foreground font-medium truncate">{(fight as any).theme_song_name}</p>
            </div>
            {(fight as any).theme_song_preview_url && (
              <audio src={(fight as any).theme_song_preview_url} controls className="h-7 w-28 shrink-0" />
            )}
          </div>
        )}

        {/* ALWAYS-ON Edit vs Edit Showcase — viral side-by-side, even before submissions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-muted-foreground" />
              Edit vs Edit
            </h3>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {[fight.player_1_submission_url, fight.player_2_submission_url].filter(Boolean).length}/2 submitted
            </span>
          </div>

          {/* Tall 9:16 cards so the actual edits dominate the screen — screen-record ready */}
          <div className="grid grid-cols-2 gap-2">
            {/* RED slot — Player 1 */}
            {fight.player_1_submission_url ? (
              <BattleSubmissionCard
                url={fight.player_1_submission_url}
                username={fight.player_1_username}
                color="red"
                avatarUrl={fight.player_1_avatar_url}
                customThumbnailUrl={(fight as any).player_1_thumbnail_url}
                score={fight.status === 'completed' ? fight.winner_id === fight.player_1_id ? fight.winner_score : fight.loser_score : undefined}
                isWinner={fight.winner_id === fight.player_1_id}
                votes={(fight as any).player_1_votes || 0}
                canVote={!isParticipant && !!user && !myVote}
                hasVoted={myVote === fight.player_1_id}
                onVote={() => handleVote(fight.player_1_id)}
              />
            ) : (
              <EmptyEditSlot
                color="red"
                username={fight.player_1_username}
                avatarUrl={fight.player_1_avatar_url}
                isYou={isP1}
                isLive={fight.status === 'active'}
              />
            )}

            {/* BLUE slot — Player 2 */}
            {fight.player_2_submission_url ? (
              <BattleSubmissionCard
                url={fight.player_2_submission_url}
                username={fight.player_2_username || '???'}
                color="blue"
                avatarUrl={fight.player_2_avatar_url}
                customThumbnailUrl={(fight as any).player_2_thumbnail_url}
                score={fight.status === 'completed' ? fight.winner_id === fight.player_2_id ? fight.winner_score : fight.loser_score : undefined}
                isWinner={fight.winner_id === fight.player_2_id}
                votes={(fight as any).player_2_votes || 0}
                canVote={!isParticipant && !!user && !myVote}
                hasVoted={myVote === fight.player_2_id}
                onVote={() => fight.player_2_id && handleVote(fight.player_2_id)}
              />
            ) : (
              <EmptyEditSlot
                color="blue"
                username={fight.player_2_username || 'Waiting…'}
                avatarUrl={fight.player_2_avatar_url}
                isYou={isP2}
                isLive={fight.status === 'active'}
              />
            )}
          </div>

          {/* Inline submit bar — always visible to participants while active */}
          {canSubmit && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-500/10 via-surface-1 to-blue-500/10 border border-gold/40 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Drop Your Edit</span>
                <span className="text-[9px] text-muted-foreground">TikTok · YouTube · CapCut</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://tiktok.com/@you/video/..."
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className="flex-1 bg-background border-border h-10"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !submissionUrl.trim()}
                  className="bg-gold hover:bg-gold/90 text-background h-10 px-4 font-display uppercase tracking-wider"
                >
                  {submitting ? '...' : <><Send className="w-4 h-4 mr-1" /> Drop</>}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Judge Video Review */}
        {fight.status === 'completed' && (fight as any).judge_video_url && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              Judge Review
            </h3>
            <a
              href={(fight as any).judge_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-surface-1 border border-purple-500/30 hover:border-purple-500/50 transition-all overflow-hidden p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-purple-500/20 flex items-center justify-center shrink-0">
                <Gavel className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium">
                  {fight.judge_username ? `@${fight.judge_username}` : 'Judge'} — Video Review
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </a>
          </div>
        )}

        {/* Judge Panel (simplified) */}
        {canJudge && (
          <div className="bg-surface-1 border border-purple-500/30 p-4">
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
              className="mb-2 bg-background"
            />
            <Input
              placeholder="Video review URL (optional — TikTok/YouTube)"
              value={judgeVideoUrl}
              onChange={(e) => setJudgeVideoUrl(e.target.value)}
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

        {/* Cancelled Banner */}
        {fight.status === 'cancelled' && (
          <div className="bg-muted border border-border p-4 text-center">
            <p className="text-sm font-display text-muted-foreground uppercase tracking-wider">🚫 Fight Cancelled</p>
            <p className="text-[10px] text-muted-foreground mt-1">Neither player submitted before the deadline. No index awarded.</p>
          </div>
        )}

        {/* Forfeit Result */}
        {fight.status === 'completed' && fight.judge_notes?.includes('forfeit') && (
          <div className="bg-muted border border-destructive/30 p-4 text-center">
            <p className="text-sm font-display text-foreground uppercase tracking-wider">🏳️ Won by Forfeit</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Opponent did not submit. Winner receives <span className="text-gold font-bold">+20 IDX</span>, forfeiter penalized <span className="text-destructive font-bold">-10 IDX</span>
            </p>
          </div>
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

/** Empty edit slot — shown before a player submits. Side-by-side viral preview. */
function EmptyEditSlot({
  color,
  username,
  avatarUrl,
  isYou,
  isLive,
}: {
  color: 'red' | 'blue';
  username: string;
  avatarUrl?: string | null;
  isYou: boolean;
  isLive: boolean;
}) {
  const borderColor = color === 'red' ? 'border-red-500/40' : 'border-blue-500/40';
  const gradientFrom = color === 'red' ? 'from-red-950/60' : 'from-blue-950/60';
  const gradientTo = color === 'red' ? 'to-red-900/20' : 'to-blue-900/20';
  const accentText = color === 'red' ? 'text-red-400' : 'text-blue-400';
  const accentBg = color === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20';
  const ringColor = color === 'red' ? 'ring-red-500/30' : 'ring-blue-500/30';

  return (
    <div className={`bg-surface-1 border ${borderColor} overflow-hidden ${isYou ? `ring-2 ${ringColor}` : ''}`}>
      {/* Tall 9:16 placeholder — minimal, no big avatar. Matches the live edit card height. */}
      <div className={`relative aspect-[9/16] bg-gradient-to-br ${gradientFrom} ${gradientTo} flex flex-col items-center justify-center overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 70% 30%, currentColor 1px, transparent 1px)`,
            backgroundSize: '50px 50px, 40px 40px',
          }}
        />

        {isLive && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`} />
            <span className="text-[8px] font-bold text-white uppercase tracking-wider">Live</span>
          </div>
        )}

        {isYou && (
          <div className="absolute top-1.5 right-1.5 bg-gold px-1.5 py-0.5">
            <span className="text-[8px] font-bold text-black uppercase tracking-wider">You</span>
          </div>
        )}

        {/* Center: just the upload chip */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm border ${borderColor} z-10`}>
          <Upload className={`w-3 h-3 ${accentText}`} />
          <span className={`text-[9px] font-bold ${accentText} uppercase tracking-[0.15em]`}>
            {isYou ? 'Drop Edit' : 'Awaiting Drop'}
          </span>
        </div>

        {/* Username overlay at bottom — matches submitted card layout */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-white truncate drop-shadow">@{username}</span>
          <span className={`text-[8px] font-bold ${accentText} uppercase tracking-wider shrink-0`}>{color}</span>
        </div>
      </div>
    </div>
  );
}
