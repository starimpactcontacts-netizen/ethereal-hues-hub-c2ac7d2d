import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Swords, Clock, Eye, Trophy, ArrowLeft, 
  CheckCircle, XCircle, Send, Share2, Users, Gavel, Zap, Play, Music
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
        <div className="flex flex-col items-center gap-3">
          <Swords className="w-8 h-8 text-red-500 animate-pulse" />
          <span className="text-muted-foreground text-sm tracking-[0.3em] uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>LOADING BATTLE...</span>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Swords className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-muted-foreground text-lg tracking-[0.2em] uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>BATTLE NOT FOUND</p>
        <Button variant="outline" onClick={() => navigate('/arena')} className="uppercase tracking-wider text-xs">
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

  const statusColor = isLive ? 'text-red-400' : isJudging ? 'text-purple-400' : isCompleted ? 'text-amber-400' : 'text-zinc-400';
  const statusLabel = isLive ? 'LIVE BATTLE' : battle.status === 'pending' && !battle.opponent_id ? 'OPEN CHALLENGE' : battle.status === 'pending' && battle.opponent_id ? 'AWAITING ACCEPTANCE' : isJudging ? 'UNDER REVIEW' : isCompleted ? 'DECIDED' : '';

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

  const getMyRole = () => {
    if (isChallenger) return "CHALLENGER";
    if (isOpponent) return "DEFENDER";
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/arena')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Arena</span>
          </button>
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <Eye className="w-3 h-3 text-red-400" />
                <span className="text-[11px] text-red-400 font-bold tabular-nums">{formatViews(battle.view_count)}</span>
              </div>
            )}
            {!isLive && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-zinc-500" />
                <span className="text-[11px] text-zinc-500 tabular-nums">{formatViews(battle.view_count)}</span>
              </div>
            )}
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
              <Share2 className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <div className="relative overflow-hidden">
        {/* Layered atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-red-950/15 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-transparent to-blue-600/5" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(239,68,68,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 30%, rgba(59,130,246,0.1) 0%, transparent 50%)`
        }} />

        <div className="relative px-4 pt-5 pb-6">
          {/* Status + Role */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" />}
            <span className={`text-sm tracking-[0.25em] uppercase font-bold ${statusColor}`} style={{ fontFamily: 'Teko, sans-serif' }}>
              {statusLabel}
            </span>
            {isRapid && (
              <span className="flex items-center gap-1 text-amber-400 text-xs tracking-wider ml-1">
                <Zap className="w-3 h-3" /> RAPID
              </span>
            )}
          </div>

          {/* VS Display */}
          <div className="flex items-center justify-center gap-2">
            {/* Challenger Side */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="relative mb-2">
                {/* Glow ring */}
                <div className={`absolute -inset-1 rounded-full opacity-40 blur-md ${
                  battle.winner_id === battle.challenger_id ? 'bg-amber-500' : 'bg-red-500/50'
                }`} />
                <div className={`relative p-[2px] rounded-full ${
                  battle.winner_id === battle.challenger_id 
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600' 
                    : 'bg-gradient-to-br from-red-500/70 to-red-800/70'
                }`}>
                  <Avatar className="w-[72px] h-[72px] border-2 border-background rounded-full">
                    <AvatarImage src={battle.challenger_avatar_url || ''} />
                    <AvatarFallback className="bg-red-500/15 text-red-400 text-xl font-bold">
                      {battle.challenger_username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {battle.challenger_submitted_at && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </span>
                )}
                {battle.winner_id === battle.challenger_id && (
                  <span className="absolute -top-1 -right-1">
                    <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  </span>
                )}
              </div>
              <span className="text-[14px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.08em' }}>
                {battle.challenger_username}
              </span>
              {battle.challenger_score !== null && (
                <span className="text-2xl font-bold text-amber-400 tabular-nums leading-none mt-0.5" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {battle.challenger_score}
                </span>
              )}
              {isChallenger && (
                <span className="text-[8px] text-red-400/70 font-bold uppercase tracking-[0.15em] mt-1">YOU</span>
              )}
            </div>

            {/* VS Center */}
            <div className="relative shrink-0 mx-1">
              <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.25)]">
                <Swords className="w-6 h-6 text-white" />
              </div>
              {isLive && (
                <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
              )}
            </div>

            {/* Opponent Side */}
            <div className="flex-1 flex flex-col items-center text-center">
              {battle.opponent_id ? (
                <>
                  <div className="relative mb-2">
                    <div className={`absolute -inset-1 rounded-full opacity-40 blur-md ${
                      battle.winner_id === battle.opponent_id ? 'bg-amber-500' : 'bg-blue-500/50'
                    }`} />
                    <div className={`relative p-[2px] rounded-full ${
                      battle.winner_id === battle.opponent_id 
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-blue-500/70 to-blue-800/70'
                    }`}>
                      <Avatar className="w-[72px] h-[72px] border-2 border-background rounded-full">
                        <AvatarImage src={battle.opponent_avatar_url || ''} />
                        <AvatarFallback className="bg-blue-500/15 text-blue-400 text-xl font-bold">
                          {battle.opponent_username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {battle.opponent_submitted_at && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {battle.winner_id === battle.opponent_id && (
                      <span className="absolute -top-1 -right-1">
                        <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[14px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.08em' }}>
                    {battle.opponent_username}
                  </span>
                  {battle.opponent_score !== null && (
                    <span className="text-2xl font-bold text-amber-400 tabular-nums leading-none mt-0.5" style={{ fontFamily: 'Teko, sans-serif' }}>
                      {battle.opponent_score}
                    </span>
                  )}
                  {isOpponent && (
                    <span className="text-[8px] text-blue-400/70 font-bold uppercase tracking-[0.15em] mt-1">YOU</span>
                  )}
                </>
              ) : (
                <>
                  <div className="relative mb-2">
                    <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-zinc-600/50 flex items-center justify-center bg-zinc-900/50">
                      <span className="text-2xl text-zinc-600" style={{ fontFamily: 'Teko, sans-serif' }}>?</span>
                    </div>
                  </div>
                  <span className="text-[13px] text-zinc-500 uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                    AWAITING
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Matchup text */}
          <p className="text-center text-[11px] text-zinc-500 mt-3 tracking-wide">
            {battle.challenger_username} vs {battle.opponent_username || '???'}
          </p>

          {/* Timer */}
          {isLive && battle.ends_at && (
            <div className="flex justify-center mt-4">
              <div className="bg-black/40 backdrop-blur-sm border border-red-500/15 rounded-xl px-6 py-2.5">
                <CountdownTimer endDate={battle.ends_at} label="ENDS" />
              </div>
            </div>
          )}

          {battle.status !== 'active' && battle.ends_at && (
            <div className="flex justify-center mt-3">
              <span className="text-[11px] text-zinc-500 tracking-wider uppercase">
                {new Date(battle.ends_at) <= new Date() ? 'Ended' : 
                  `${Math.max(0, Math.ceil((new Date(battle.ends_at).getTime() - Date.now()) / 3600000))}h remaining`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-4 space-y-3 mt-1">

        {/* Stakes Strip */}
        <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xl font-bold text-emerald-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>+{battle.winner_index_awarded}</span>
              <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">WINNER</span>
            </div>
            <div>
              <span className="text-xl font-bold text-red-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>-{battle.loser_index_penalty}</span>
              <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">LOSER</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.duration_hours}H</span>
              <span className="text-[8px] text-zinc-500 block uppercase tracking-[0.2em] mt-0.5">DURATION</span>
            </div>
          </div>
        </div>

        {/* Judge Section */}
        {(battle.requested_judge_username || battle.judge_id) && (
          <div className="bg-zinc-900/60 border border-purple-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gavel className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">JUDGE</span>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border border-purple-500/30 rounded-full">
                <AvatarFallback className="bg-purple-500/10 text-purple-400 text-sm font-bold rounded-full">
                  {(battle.requested_judge_username || 'J').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white block">{battle.requested_judge_username || 'Assigned'}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  battle.judge_status === 'accepted' ? 'text-emerald-400' :
                  battle.judge_status === 'declined' ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {battle.judge_status === 'accepted' ? '✓ CONFIRMED' :
                   battle.judge_status === 'declined' ? '✗ DECLINED' :
                   '⏳ REQUESTED'}
                </span>
              </div>
            </div>

            {canJudgeAccept && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
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
                  className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> ACCEPT
                </button>
                <button
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
                  className="py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> DECLINE
                </button>
              </div>
            )}
          </div>
        )}

        {/* Song Picker */}
        {isParticipant && battle.status === 'active' && (
          <BattleSongPicker
            onSongPicked={handleSongPick}
            selectedSongName={(battle as any).theme_song_name}
          />
        )}

        {/* Song Display for spectators */}
        {!isParticipant && (battle as any).theme_song_name && (
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-wider">THEME SONG</p>
              <p className="text-sm text-white font-bold truncate" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
                {(battle as any).theme_song_name}
              </p>
            </div>
          </div>
        )}

        {/* Invite Challengers */}
        {isChallenger && battle.status === 'pending' && !battle.opponent_id && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="w-full py-3.5 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/5 transition-colors text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              INVITE CHALLENGERS
            </button>
          </motion.div>
        )}

        {/* Accept Challenge — Premium CTA */}
        {canAccept && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full relative overflow-hidden py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 shadow-[0_4px_24px_rgba(239,68,68,0.25)] active:scale-[0.98]"
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none rounded-t-xl" />
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <Swords className="w-5 h-5 text-white" />
                <span className="text-lg text-white font-bold uppercase tracking-[0.15em]" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {accepting ? "ACCEPTING..." : "ACCEPT CHALLENGE"}
                </span>
              </span>
            </button>
            {canAcceptDirect && (
              <button
                onClick={async () => {
                  await supabase.from('battles').update({ status: 'cancelled' }).eq('id', battle.id);
                  toast.info("Challenge declined");
                  navigate('/arena');
                }}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/5 text-sm font-bold uppercase tracking-wider transition-colors"
              >
                DECLINE
              </button>
            )}
          </motion.div>
        )}

        {/* Waiting for opponent */}
        {isChallenger && battle.status === 'pending' && battle.opponent_id && (
          <div className="bg-zinc-900/60 border border-amber-500/15 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-amber-400/60 mx-auto mb-2" />
            <p className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
              Waiting for {battle.opponent_username}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">They've been notified</p>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && hasSongPicked && (
          <div className="bg-zinc-900/60 border border-amber-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.15em]">SUBMIT YOUR EDIT</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste TikTok, IG, or YouTube URL..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                className="flex-1 bg-black/30 border-white/[0.08] text-sm rounded-lg"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !submissionUrl.trim()}
                className="px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold disabled:opacity-50 transition-all"
              >
                {submitting ? "..." : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Submissions Display */}
        {(battle.challenger_submission_url || battle.opponent_submission_url) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                EDITS ({[battle.challenger_submission_url, battle.opponent_submission_url].filter(Boolean).length})
              </span>
            </div>
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
              <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-red-400 font-bold uppercase">{battle.challenger_username}</span>
                  <span className="text-[9px] text-zinc-500 tabular-nums">{totalVotes} votes</span>
                  <span className="text-blue-400 font-bold uppercase">{battle.opponent_username}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-l-full transition-all" style={{ width: `${(battle.challenger_votes / totalVotes) * 100}%` }} />
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-r-full transition-all" style={{ width: `${(battle.opponent_votes / totalVotes) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Judge Scoring Panel */}
        {isJudging && <BattleJudgingPanel battle={battle} />}

        {isJudging && isParticipant && (
          <p className="text-[10px] text-zinc-500 text-center py-1">
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
            className="relative bg-zinc-900/60 border border-amber-500/20 rounded-xl p-6 text-center overflow-hidden"
          >
            {/* Gold glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-xl" />
            <div className="relative z-10">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]" />
              <span className="text-[10px] text-amber-400/60 font-bold uppercase tracking-[0.25em]">WINNER</span>
              <p className="text-3xl font-bold text-white uppercase tracking-wide mt-1" style={{ fontFamily: 'Teko, sans-serif' }}>
                {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username}
              </p>
              {(battle.challenger_score !== null && battle.opponent_score !== null) && (
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.challenger_score}</span>
                    <span className="text-[9px] text-zinc-500 block uppercase">{battle.challenger_username}</span>
                  </div>
                  <span className="text-xs text-zinc-600">vs</span>
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.opponent_score}</span>
                    <span className="text-[9px] text-zinc-500 block uppercase">{battle.opponent_username}</span>
                  </div>
                </div>
              )}
              {battle.judge_notes && (
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-1">JUDGE NOTES</p>
                  <p className="text-xs text-zinc-300">{battle.judge_notes}</p>
                </div>
              )}
              <p className="text-[10px] text-amber-400/50 mt-3 font-bold tracking-wider">
                +{battle.winner_index_awarded} INDEX
              </p>
            </div>
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
