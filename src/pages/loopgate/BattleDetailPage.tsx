import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Swords, Clock, Eye, Trophy, ArrowLeft, Flame, 
  CheckCircle, XCircle, ExternalLink, ThumbsUp, 
  Send, Share2, Users, Gavel, Zap, Play, Music
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBattle, recordBattleView, acceptBattle, submitToBattle, voteOnBattle, getMyVote } from "@/hooks/useBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import BattleInviteModal from "@/components/loopgate/BattleInviteModal";
import BattleJudgingPanel from "@/components/loopgate/BattleJudgingPanel";
import BattleChat from "@/components/loopgate/BattleChat";
import BattleSongPicker from "@/components/loopgate/BattleSongPicker";
import BattleSubmissionCard from "@/components/loopgate/BattleSubmissionCard";

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function BattleDetailPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { battle, loading } = useBattle(battleId);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    if (battleId) recordBattleView(battleId, user?.id || null);
  }, [battleId, user?.id]);

  useEffect(() => {
    if (battleId && user?.id && (battle?.status === 'judging' || battle?.status === 'active')) {
      getMyVote(battleId, user.id).then(setMyVote);
    }
  }, [battleId, user?.id, battle?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-display text-lg tracking-wider">LOADING...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Swords className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-muted-foreground font-display text-lg">BATTLE NOT FOUND</p>
        <Button variant="outline" onClick={() => navigate('/arena')} className="font-display uppercase tracking-wider">
          Back to Arena
        </Button>
      </div>
    );
  }

  const isChallenger = user?.id === battle.challenger_id;
  const isOpponent = user?.id === battle.opponent_id;
  const isParticipant = isChallenger || isOpponent;
  const isRequestedJudge = user?.id === battle.requested_judge_id;
  const canAcceptOpen = battle.status === 'pending' && !battle.opponent_id && user?.id && !isChallenger;
  const canAcceptDirect = battle.status === 'pending' && battle.opponent_id && isOpponent;
  const canAccept = canAcceptOpen || canAcceptDirect;
  const canJudgeAccept = isRequestedJudge && battle.judge_status === 'requested';
  const canSubmit = battle.status === 'active' && isParticipant && (
    (isChallenger && !battle.challenger_submitted_at) ||
    (isOpponent && !battle.opponent_submitted_at)
  );
  const canVote = (battle.status === 'judging' || battle.status === 'active') && user?.id && !isParticipant && !myVote;
  const totalVotes = battle.challenger_votes + battle.opponent_votes;
  const hasSongPicked = !!(battle as any).theme_song_name;
  const isRapid = (battle as any).is_rapid;
  const isLive = battle.status === 'active';
  const isCompleted = battle.status === 'completed';
  const isJudging = battle.status === 'judging';

  const handleSongPick = async (drop: any) => {
    await supabase.from('battles').update({
      theme_drop_id: drop.id,
      theme_song_name: drop.song_name,
      theme_song_preview_url: drop.song_preview_url,
    }).eq('id', battle.id);
    toast.success('🎵 Song picked!');
  };

  const handleAccept = async () => {
    if (!profile) return;
    setAccepting(true);
    const success = await acceptBattle(battle.id, profile.id, profile.username, profile.avatar_url);
    setAccepting(false);
    if (success) toast.success("Battle accepted! Time to edit!");
    else toast.error("Failed to accept battle");
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) { toast.error("Enter a submission URL"); return; }
    let platform = 'other';
    if (submissionUrl.includes('tiktok.com')) platform = 'tiktok';
    else if (submissionUrl.includes('instagram.com')) platform = 'instagram';
    else if (submissionUrl.includes('youtube.com') || submissionUrl.includes('youtu.be')) platform = 'youtube';
    setSubmitting(true);
    const success = await submitToBattle(battle.id, user!.id, isChallenger, submissionUrl, platform);
    setSubmitting(false);
    if (success) { toast.success("Submission recorded!"); setSubmissionUrl(""); }
    else toast.error("Failed to submit");
  };

  const handleVote = async (votedForId: string) => {
    if (!user?.id || voting) return;
    setVoting(true);
    const success = await voteOnBattle(battle.id, user.id, votedForId);
    setVoting(false);
    if (success) { setMyVote(votedForId); toast.success("Vote recorded!"); }
    else toast.error("Failed to vote");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Battle link copied!");
  };

  // Participant role label
  const getMyRole = () => {
    if (isChallenger) return "YOU'RE CHALLENGING";
    if (isOpponent) return "YOU'RE DEFENDING";
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/arena')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Arena</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-foreground font-bold tabular-nums">{formatViews(battle.view_count)}</span>
              <span className="text-[9px] text-muted-foreground">watching</span>
            </div>
            <button onClick={handleShare} className="p-2 hover:bg-surface-1 transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HERO VS BANNER ═══ */}
      <div className="relative overflow-hidden">
        {/* Red gradient atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/25 via-red-900/10 to-background" />
        {/* Cross-hatch pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, currentColor 8px, currentColor 9px),
                            repeating-linear-gradient(-45deg, transparent, transparent 8px, currentColor 8px, currentColor 9px)`,
          color: 'rgb(239 68 68)'
        }} />

        <div className="relative px-4 pt-6 pb-8">
          {/* Status line — seamless text, not blocky chip */}
          <div className="flex items-center justify-center gap-2 mb-1">
            {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
            <span className={`font-display text-sm tracking-[0.2em] uppercase drop-shadow-sm ${
              isLive ? 'text-red-400' :
              isJudging ? 'text-purple-400' :
              isCompleted ? 'text-gold' :
              'text-muted-foreground'
            }`} style={{ fontFamily: 'Teko, sans-serif' }}>
              {isLive && 'LIVE'}
              {battle.status === 'pending' && !battle.opponent_id && 'OPEN CHALLENGE'}
              {battle.status === 'pending' && battle.opponent_id && 'AWAITING ACCEPTANCE'}
              {isJudging && 'JUDGING'}
              {isCompleted && 'DECIDED'}
            </span>
            {isParticipant && getMyRole() && (
              <>
                <span className="text-muted-foreground/40">—</span>
                <span className="text-[11px] text-red-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
                  🛡️ {getMyRole()}
                </span>
              </>
            )}
          </div>

          {/* Rapid badge */}
          {isRapid && (
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-display text-xs tracking-[0.15em] text-amber-400 uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
                ⚡ RAPID BATTLE
              </span>
              <span className="text-[9px] text-muted-foreground ml-1">Reuse existing edits</span>
            </div>
          )}

          {/* VS Display — two fighters */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {/* Challenger */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className={`relative p-[3px] ${
                battle.winner_id === battle.challenger_id 
                  ? 'bg-gradient-to-br from-gold via-amber-500 to-gold' 
                  : 'bg-gradient-to-br from-red-500/60 to-red-900/60'
              }`} style={{ borderRadius: '50%' }}>
                <Avatar className="w-[76px] h-[76px] border-2 border-background" style={{ borderRadius: '50%' }}>
                  <AvatarImage src={battle.challenger_avatar_url || ''} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                    {battle.challenger_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {battle.challenger_submitted_at && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 flex items-center justify-center" style={{ borderRadius: '50%' }}>
                    <CheckCircle className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <span className="text-[13px] font-display text-foreground mt-2 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                {battle.challenger_username}
              </span>
              {battle.challenger_score !== null && (
                <span className="text-lg font-display text-gold tabular-nums">{battle.challenger_score}</span>
              )}
              {battle.winner_id === battle.challenger_id && (
                <span className="text-[9px] text-gold font-bold uppercase flex items-center gap-1 mt-0.5">
                  <Trophy className="w-3 h-3" /> WINNER
                </span>
              )}
            </div>

            {/* VS — center swords */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl shadow-red-500/30" style={{ borderRadius: '50%' }}>
                <Swords className="w-7 h-7 text-white" />
              </div>
              {isLive && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-ping" />}
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center text-center">
              {battle.opponent_id ? (
                <>
                  <div className={`relative p-[3px] ${
                    battle.winner_id === battle.opponent_id 
                      ? 'bg-gradient-to-br from-gold via-amber-500 to-gold' 
                      : 'bg-gradient-to-br from-red-500/60 to-red-900/60'
                  }`} style={{ borderRadius: '50%' }}>
                    <Avatar className="w-[76px] h-[76px] border-2 border-background" style={{ borderRadius: '50%' }}>
                      <AvatarImage src={battle.opponent_avatar_url || ''} />
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-2xl font-bold">
                        {battle.opponent_username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {battle.opponent_submitted_at && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 flex items-center justify-center" style={{ borderRadius: '50%' }}>
                        <CheckCircle className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] font-display text-foreground mt-2 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                    {battle.opponent_username}
                  </span>
                  {battle.opponent_score !== null && (
                    <span className="text-lg font-display text-gold tabular-nums">{battle.opponent_score}</span>
                  )}
                  {battle.winner_id === battle.opponent_id && (
                    <span className="text-[9px] text-gold font-bold uppercase flex items-center gap-1 mt-0.5">
                      <Trophy className="w-3 h-3" /> WINNER
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-[76px] h-[76px] border-2 border-dashed border-red-500/30 flex items-center justify-center bg-surface-1" style={{ borderRadius: '50%' }}>
                    <span className="text-3xl text-red-400/30 font-display">?</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground mt-2 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Awaiting
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Matchup text line */}
          <p className="text-center text-[11px] text-muted-foreground mb-4">
            {battle.challenger_username} vs {battle.opponent_username || '???'}
          </p>

          {/* Timer */}
          {isLive && battle.ends_at && (
            <div className="flex justify-center">
              <div className="bg-surface-1/80 border border-red-500/20 px-6 py-2.5">
                <CountdownTimer endDate={battle.ends_at} label="ENDS" />
              </div>
            </div>
          )}

          {battle.status !== 'active' && battle.ends_at && (
            <div className="flex justify-center">
              <span className="text-[11px] text-muted-foreground font-display tracking-wider uppercase">
                ENDS <span className="text-foreground font-bold">
                  {new Date(battle.ends_at) <= new Date() ? 'Ended' : 
                    `${Math.max(0, Math.ceil((new Date(battle.ends_at).getTime() - Date.now()) / 3600000))}h left`}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-4 space-y-3 mt-1">

        {/* Song Picker — mandatory for participants before submit */}
        {isParticipant && battle.status === 'active' && (
          <BattleSongPicker
            onSongPicked={handleSongPick}
            selectedSongName={(battle as any).theme_song_name}
          />
        )}

        {/* Show picked song for non-participants */}
        {!isParticipant && (battle as any).theme_song_name && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">SONG PICKED</p>
              <p className="text-sm text-foreground font-bold truncate" style={{ fontFamily: 'Teko, sans-serif', fontSize: '16px', letterSpacing: '0.02em' }}>
                {(battle as any).theme_song_name}
              </p>
            </div>
            <Music className="w-5 h-5 text-emerald-400/60 shrink-0" />
          </div>
        )}

        {/* Judge Section */}
        {(battle.requested_judge_username || battle.judge_id) && (
          <div className="bg-surface-1 border border-purple-500/30 p-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <Gavel className="w-3.5 h-3.5 text-purple-400" />
              OFFICIAL JUDGE
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-purple-500/60">
                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-sm font-bold">
                  {(battle.requested_judge_username || 'J').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{battle.requested_judge_username || 'Assigned Judge'}</span>
                <span className={`text-[10px] block font-bold uppercase tracking-wider ${
                  battle.judge_status === 'accepted' ? 'text-emerald-400' :
                  battle.judge_status === 'declined' ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {battle.judge_status === 'accepted' ? '✓ ACCEPTED' :
                   battle.judge_status === 'declined' ? '✗ DECLINED' :
                   '⏳ REQUESTED'}
                </span>
              </div>
            </div>

            {canJudgeAccept && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  onClick={async () => {
                    const { error } = await supabase.from('battles').update({
                      judge_status: 'accepted', judge_id: user!.id, judge_claimed_at: new Date().toISOString()
                    }).eq('id', battle.id);
                    if (!error) {
                      toast.success("You're officiating this battle!");
                      const notifications = [battle.challenger_id, battle.opponent_id].filter(Boolean).map(uid => ({
                        user_id: uid!,
                        type: 'battle_judge_accepted',
                        title: '⚖️ Judge Accepted!',
                        message: `@${profile?.username} will officiate your battle`,
                        data: { battle_id: battle.id },
                      }));
                      await supabase.from('notifications').insert(notifications);
                    } else toast.error("Failed to accept");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-display uppercase tracking-wider text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> ACCEPT
                </Button>
                <Button
                  onClick={async () => {
                    const { error } = await supabase.from('battles').update({
                      judge_status: 'declined', requested_judge_id: null, requested_judge_username: null
                    }).eq('id', battle.id);
                    if (!error) {
                      toast.info("Declined — battle is now open for other judges");
                      const { data: judgeRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'judge');
                      if (judgeRoles && judgeRoles.length > 0) {
                        const notifications = judgeRoles.filter(r => r.user_id !== user!.id).map(r => ({
                          user_id: r.user_id, type: 'battle_judge_open',
                          title: '⚔️ Battle Needs a Judge',
                          message: `${battle.challenger_username} vs ${battle.opponent_username || '???'} — claim it!`,
                          data: { battle_id: battle.id },
                        }));
                        await supabase.from('notifications').insert(notifications);
                      }
                      await supabase.from('battles').update({ judge_status: 'open' }).eq('id', battle.id);
                    } else toast.error("Failed to decline");
                  }}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-display uppercase tracking-wider text-sm"
                >
                  <XCircle className="w-4 h-4 mr-1" /> DECLINE
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stakes — compact horizontal strip */}
        <div className="bg-surface-1 border border-border p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xl font-display text-gold tabular-nums">+{battle.winner_index_awarded}</span>
              <span className="text-[8px] text-muted-foreground block uppercase tracking-widest mt-0.5">WINNER</span>
            </div>
            <div>
              <span className="text-xl font-display text-red-400 tabular-nums">-{battle.loser_index_penalty}</span>
              <span className="text-[8px] text-muted-foreground block uppercase tracking-widest mt-0.5">LOSER</span>
            </div>
            <div>
              <span className="text-xl font-display text-foreground tabular-nums">{battle.duration_hours}h</span>
              <span className="text-[8px] text-muted-foreground block uppercase tracking-widest mt-0.5">DURATION</span>
            </div>
          </div>
        </div>

        {/* Invite Challengers */}
        {isChallenger && battle.status === 'pending' && !battle.opponent_id && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => setInviteModalOpen(true)}
              variant="outline"
              className="w-full h-12 border-red-500/40 text-red-400 hover:bg-red-500/10 font-display uppercase tracking-wider"
            >
              <Users className="w-4 h-4 mr-2" />
              INVITE CHALLENGERS
            </Button>
          </motion.div>
        )}

        {/* Accept Challenge */}
        {canAccept && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full relative overflow-hidden py-4 bg-red-600 hover:bg-red-500 transition-colors touch-manipulation select-none disabled:opacity-50"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Swords className="w-5 h-5 text-white" />
                <span className="font-display text-lg text-white uppercase tracking-wider" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {accepting ? "ACCEPTING..." : "ACCEPT CHALLENGE"}
                </span>
              </span>
            </button>
            {canAcceptDirect && (
              <Button
                onClick={async () => {
                  await supabase.from('battles').update({ status: 'cancelled' }).eq('id', battle.id);
                  toast.info("Challenge declined");
                  navigate('/arena');
                }}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 font-display uppercase tracking-wider"
              >
                DECLINE CHALLENGE
              </Button>
            )}
          </motion.div>
        )}

        {/* Waiting for opponent */}
        {isChallenger && battle.status === 'pending' && battle.opponent_id && (
          <div className="bg-surface-1 border border-amber-500/20 p-4 text-center">
            <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-display text-foreground uppercase tracking-wide">Waiting for {battle.opponent_username}</p>
            <p className="text-[10px] text-muted-foreground mt-1">They've been notified of your challenge</p>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && hasSongPicked && (
          <div className="bg-surface-1 border border-gold/20 p-4">
            <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              SUBMIT YOUR EDIT
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Paste TikTok, IG, or YouTube URL..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="flex-1 bg-background border-border text-sm"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || !submissionUrl.trim()}
                className="bg-gold hover:bg-gold/90 text-background font-display uppercase tracking-wider"
              >
                {submitting ? "..." : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Submissions Display */}
        {(battle.challenger_submission_url || battle.opponent_submission_url) && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-2">
              <Play className="w-3.5 h-3.5" />
              EDITS ({[battle.challenger_submission_url, battle.opponent_submission_url].filter(Boolean).length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {battle.challenger_submission_url && (
                <BattleSubmissionCard
                  url={battle.challenger_submission_url}
                  username={battle.challenger_username}
                  color="red"
                  avatarUrl={battle.challenger_avatar_url}
                  customThumbnailUrl={(battle as any).challenger_thumbnail_url}
                  score={isCompleted ? battle.challenger_score : undefined}
                  isWinner={battle.winner_id === battle.challenger_id}
                  votes={battle.challenger_votes}
                  canVote={canVote && !myVote}
                  hasVoted={myVote === battle.challenger_id}
                  onVote={() => handleVote(battle.challenger_id)}
                />
              )}
              {battle.opponent_submission_url && (
                <BattleSubmissionCard
                  url={battle.opponent_submission_url}
                  username={battle.opponent_username || '???'}
                  color="blue"
                  avatarUrl={battle.opponent_avatar_url}
                  customThumbnailUrl={(battle as any).opponent_thumbnail_url}
                  score={isCompleted ? battle.opponent_score : undefined}
                  isWinner={battle.winner_id === battle.opponent_id}
                  votes={battle.opponent_votes}
                  canVote={canVote && !myVote}
                  hasVoted={myVote === battle.opponent_id}
                  onVote={() => handleVote(battle.opponent_id!)}
                />
              )}
            </div>

            {/* Vote Bar */}
            {totalVotes > 0 && (
              <div className="bg-surface-1 border border-border p-3">
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-red-400 font-bold uppercase">{battle.challenger_username}</span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{totalVotes} votes</span>
                  <span className="text-sky-400 font-bold uppercase">{battle.opponent_username}</span>
                </div>
                <div className="h-1.5 bg-surface-2 overflow-hidden flex">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }} />
                  <div className="h-full bg-sky-500 transition-all" style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Judge Scoring Panel */}
        {isJudging && <BattleJudgingPanel battle={battle} />}

        {isJudging && isParticipant && (
          <p className="text-[10px] text-muted-foreground text-center py-1">
            Community voting is live — spectators can upvote edits above
          </p>
        )}

        {/* Battle Chat */}
        {battle.opponent_id && (
          <BattleChat
            battleId={battle.id}
            challengerId={battle.challenger_id}
            opponentId={battle.opponent_id}
            judgeId={battle.judge_id}
          />
        )}

        {/* Winner Announcement */}
        {isCompleted && battle.winner_id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-1 border border-gold/30 p-6 text-center"
          >
            <Trophy className="w-10 h-10 text-gold mx-auto mb-3" />
            <h3 className="font-display text-sm text-gold uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>WINNER</h3>
            <span className="text-2xl font-display text-foreground uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
              {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username}
            </span>
            {(battle.challenger_score !== null && battle.opponent_score !== null) && (
              <div className="flex items-center justify-center gap-6 mt-3">
                <div>
                  <span className="text-lg font-bold text-foreground tabular-nums">{battle.challenger_score}</span>
                  <span className="text-[9px] text-muted-foreground block uppercase">{battle.challenger_username}</span>
                </div>
                <span className="text-xs text-muted-foreground/40">vs</span>
                <div>
                  <span className="text-lg font-bold text-foreground tabular-nums">{battle.opponent_score}</span>
                  <span className="text-[9px] text-muted-foreground block uppercase">{battle.opponent_username}</span>
                </div>
              </div>
            )}
            {battle.judge_notes && (
              <div className="mt-3 pt-3 border-t border-gold/15">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">JUDGE NOTES</p>
                <p className="text-xs text-foreground/80">{battle.judge_notes}</p>
              </div>
            )}
            <p className="text-[10px] text-gold/60 mt-3 font-bold">
              +{battle.winner_index_awarded} INDEX AWARDED
            </p>
          </motion.div>
        )}
      </div>

      {/* Battle Invite Modal */}
      <BattleInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        battleId={battle.id}
        challengerUsername={battle.challenger_username}
      />
    </div>
  );
}
