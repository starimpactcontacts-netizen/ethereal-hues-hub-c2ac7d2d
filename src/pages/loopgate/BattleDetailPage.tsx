import { useState, useEffect } from "react"; // UFC bar live
import { useParams, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { MAX_EDIT_UPLOAD_BYTES, MAX_EDIT_UPLOAD_LABEL, uploadToBunny } from "@/lib/bunnyUpload";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Swords, Clock, Eye, Trophy, ArrowLeft,
  CheckCircle, XCircle, Send, Share2, Users, Gavel, Zap, Play, Music, Flag, Upload, EyeOff, RotateCcw, UserPlus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useBattle, recordBattleView, acceptBattle, joinBattleSlot, startBattle, submitToBattle, voteOnBattle, getMyVote } from "@/hooks/useBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ArcadeCountdown from "@/components/loopgate/ArcadeCountdown";
import BattleShareCard from "@/components/loopgate/BattleShareCard";
import BattleInviteModal from "@/components/loopgate/BattleInviteModal";
import BattleJudgingPanel from "@/components/loopgate/BattleJudgingPanel";
import BattleChat from "@/components/loopgate/BattleChat";
import BattleSongPicker from "@/components/loopgate/BattleSongPicker";
import BattleSubmissionCard, { ForfeitSlot } from "@/components/loopgate/BattleSubmissionCard";
import BattleShowcase from "@/components/loopgate/BattleShowcase";
import ReportUserButton from "@/components/loopgate/ReportUserButton";
import SmartUsername from "@/components/loopgate/SmartUsername";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function BattleDetailPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { battle, loading, setBattle, refetch } = useBattle(battleId);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (battleId) recordBattleView(battleId, user?.id || null);
  }, [battleId, user?.id]);

  useEffect(() => {
    if (battleId && user?.id && (battle?.status === 'judging' || battle?.status === 'active')) {
      getMyVote(battleId, user.id).then(setMyVote);
    }
  }, [battleId, user?.id, battle?.status]);

  // Poll the finalizer so judge-window → public-vote → completed transitions happen
  // without breaking React hook order while the battle is still loading.
  useEffect(() => {
    if (!battleId || battle?.status !== 'judging') return;
    const tick = async () => {
      try {
        await supabase.rpc('finalize_battle_if_expired' as any, { p_battle_id: battleId } as any);
        await refetch();
      } catch (e) {
        console.debug('finalize_battle_if_expired:', e);
      }
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [battleId, battle?.status, refetch]);

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

  // Handle forfeited / cancelled — show a clear screen instead of a blank page
  if (battle.status === 'forfeited' || battle.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Flag className="w-10 h-10 text-zinc-500" />
        <p className="text-white text-2xl tracking-[0.18em] uppercase" style={{ fontFamily: 'Teko, sans-serif' }}>
          {battle.status === 'forfeited' ? 'BATTLE FORFEITED' : 'BATTLE CANCELLED'}
        </p>
        <p className="text-xs text-zinc-500 max-w-xs">
          This lobby is no longer active. Head back to the Arena to start a new one.
        </p>
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
  // After someone joins via "Join", either side can hit Accept Battle to start.
  const canStartJoined = battle.status === 'pending' && !!battle.opponent_id && isParticipant;
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
  const bothSubmitted = !!battle.challenger_submission_url && !!battle.opponent_submission_url;
  const judgingDeadline = (battle as any).judging_deadline as string | null;
  const publicVoteStartedAt = (battle as any).public_vote_started_at as string | null;
  const publicVoteDeadline = (battle as any).public_vote_deadline as string | null;
  const inPublicVote = isJudging && !!publicVoteStartedAt;
  const judgeMsLeft = judgingDeadline ? new Date(judgingDeadline).getTime() - Date.now() : 0;
  const publicVoteMsLeft = publicVoteDeadline ? new Date(publicVoteDeadline).getTime() - Date.now() : 0;

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
    if (success) {
      // Optimistic update — instantly flip the UI into LIVE / edit mode
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + (battle.duration_hours || 48) * 60 * 60 * 1000).toISOString();
      setBattle({
        ...battle,
        opponent_id: profile.id,
        opponent_username: profile.username,
        opponent_avatar_url: profile.avatar_url,
        status: 'active',
        accepted_at: startsAt,
        starts_at: startsAt,
        ends_at: endsAt,
      } as any);
      toast.success("Battle accepted! Time to edit!");
      // Reconcile with server in the background
      refetch();
    } else {
      toast.error("Failed to accept battle");
    }
    setAccepting(false);
  };

  const handleJoin = async () => {
    if (!profile) return;
    setJoining(true);
    const success = await joinBattleSlot(battle.id, profile.id, profile.username, profile.avatar_url);
    if (success) {
      setBattle({
        ...battle,
        opponent_id: profile.id,
        opponent_username: profile.username,
        opponent_avatar_url: profile.avatar_url,
      } as any);
      toast.success("You're in! Talk smack — tap Accept Battle when you're ready.");
      refetch();
    } else {
      toast.error("Couldn't join — slot may already be taken");
    }
    setJoining(false);
  };

  const handleStart = async () => {
    setStarting(true);
    const success = await startBattle(battle.id);
    if (success) {
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + (battle.duration_hours || 48) * 60 * 60 * 1000).toISOString();
      setBattle({
        ...battle,
        status: 'active',
        accepted_at: startsAt,
        starts_at: startsAt,
        ends_at: endsAt,
      } as any);
      toast.success("Battle started! Time to edit!");
      refetch();
    } else {
      toast.error("Couldn't start battle");
    }
    setStarting(false);
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
    if (success) {
      setSubmissionUrl("");
      if (hasSongPicked && user?.id) {
        try {
          await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_amount: 50,
            p_action: 'song_pick_bonus',
            p_description: `Picked a library song for 1v1 Battle`,
          });
          toast.success("Submission recorded! +50 XP song bonus 🎵");
        } catch {
          toast.success("Submission recorded!");
        }
      } else {
        toast.success("Submission recorded!");
      }
    } else toast.error("Failed to submit");
  };

  const handleClearBattleSubmission = async () => {
    const confirmed = window.confirm('Remove your edit?\n\nYou can re-upload a new one while the battle is still active.');
    if (!confirmed) return;
    const update = isChallenger
      ? { challenger_submission_url: null, challenger_submitted_at: null }
      : { opponent_submission_url: null, opponent_submitted_at: null };
    const { error } = await supabase.from('battles').update(update as any).eq('id', battle.id);
    if (error) toast.error("Couldn't remove edit. Try again.");
    else {
      toast.info('Edit removed — upload a new one before time runs out.');
      refetch();
    }
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
    setShareCardOpen(true);
  };

  const handleHideBattle = async () => {
    if (!battle) return;
    setHiding(true);
    const { error } = await supabase.rpc('toggle_battle_hidden' as any, {
      p_battle_id: battle.id,
      p_hide: true,
    } as any);
    setHiding(false);
    setHideConfirmOpen(false);
    if (error) {
      toast.error('Failed to hide battle');
      return;
    }
    toast.success('Battle hidden from public view');
    navigate('/arena');
  };

  const getMyRole = () => {
    if (isChallenger) return "CHALLENGER";
    if (isOpponent) return "DEFENDER";
    return null;
  };

  const opp = battle?.opponent_username || 'Open Slot';
  const seoTitle = battle
    ? `${battle.challenger_username} vs ${opp} — 1v1 Edit Battle`
    : 'Edit Battle';
  const seoDesc = battle
    ? `Watch this 1v1 edit battle between ${battle.challenger_username} and ${opp} on Loopgate. ${totalVotes} votes cast. ${battle.status === 'completed' ? 'See the results and winning edit.' : 'Vote on the best edit.'}`
    : 'Watch a competitive 1v1 edit battle on Loopgate — the #1 video editing competition platform.';

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={`https://loopgate.gg/battles/${battleId}`}
        keywords={`edit battle, ${battle?.challenger_username || ''}, ${opp}, 1v1 editing battle, video editing competition, loopgate`}
      />
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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
            {isParticipant && isCompleted && (
              <button
                onClick={() => setHideConfirmOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                aria-label="Hide this battle"
              >
                <EyeOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">Hide</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ UFC-STYLE MATCHUP BAR ═══ */}
      <div className="relative overflow-hidden" style={{ background: '#080808' }}>
        {/* Status label */}
        <div className="flex items-center justify-center gap-2 pt-2.5 pb-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          <span className={`text-[10px] tracking-[0.28em] uppercase font-bold ${statusColor}`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {statusLabel}
          </span>
          {isRapid && <span className="flex items-center gap-1 text-amber-400 text-[10px]"><Zap className="w-3 h-3" /> RAPID</span>}
        </div>

        {/* The bar — NAME [RED] score [BLUE] NAME */}
        <div className="flex items-stretch h-11 border-y border-white/[0.06]">

          {/* Challenger name — left, text-right */}
          <div className="flex-1 flex items-center justify-end pr-2.5 min-w-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.07))' }}>
            <div className="flex items-center gap-1.5 min-w-0">
              {battle.winner_id === battle.challenger_id && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
              {battle.challenger_submitted_at && <CheckCircle className="w-2.5 h-2.5 text-emerald-400/50 shrink-0" />}
              {isChallenger && <span className="text-[7px] text-red-400/50 font-bold uppercase shrink-0">YOU</span>}
              <SmartUsername userId={battle.challenger_id} username={battle.challenger_username} className="font-black uppercase text-white truncate" style={{ fontFamily: 'Teko, sans-serif', fontSize: 19, letterSpacing: '0.07em', textShadow: '-2px 0 rgba(255,40,40,0.6), 1px 0 rgba(255,255,255,0.85)' }} />
            </div>
          </div>

          {/* RED tag */}
          <div className="flex items-center justify-center px-2.5 shrink-0" style={{ background: 'rgba(220,38,38,0.95)' }}>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white" style={{ fontFamily: 'Teko, sans-serif' }}>RED</span>
          </div>

          {/* Center score / status */}
          <div className="flex flex-col items-center justify-center px-3 shrink-0" style={{ background: '#0d0d0d', minWidth: 64 }}>
            {totalVotes > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="font-black text-red-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif', fontSize: 20 }}>{battle.challenger_votes}</span>
                  <span className="text-white/20 text-base">·</span>
                  <span className="font-black text-blue-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif', fontSize: 20 }}>{battle.opponent_votes}</span>
                </div>
                <span className="text-[6px] uppercase tracking-[0.22em] text-white/25 mt-px">
                  {battle.challenger_votes > battle.opponent_votes ? 'RED LEADS' : battle.opponent_votes > battle.challenger_votes ? 'BLUE LEADS' : 'TIED'}
                </span>
              </>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/25 font-black" style={{ fontFamily: 'Teko, sans-serif' }}>
                {isLive ? 'LIVE' : isJudging ? 'REVIEW' : isCompleted ? 'FINAL' : 'VS'}
              </span>
            )}
          </div>

          {/* BLUE tag */}
          <div className="flex items-center justify-center px-2.5 shrink-0" style={{ background: 'rgba(37,99,235,0.95)' }}>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white" style={{ fontFamily: 'Teko, sans-serif' }}>BLUE</span>
          </div>

          {/* Opponent name — right, text-left */}
          <div className="flex-1 flex items-center pl-2.5 min-w-0" style={{ background: 'linear-gradient(270deg, transparent, rgba(59,130,246,0.07))' }}>
            {battle.opponent_id ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <SmartUsername userId={battle.opponent_id} username={battle.opponent_username || '???'} className="font-black uppercase text-white truncate" style={{ fontFamily: 'Teko, sans-serif', fontSize: 19, letterSpacing: '0.07em', textShadow: '2px 0 rgba(40,100,255,0.6), -1px 0 rgba(255,255,255,0.85)' }} />
                {battle.winner_id === battle.opponent_id && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                {battle.opponent_submitted_at && <CheckCircle className="w-2.5 h-2.5 text-emerald-400/50 shrink-0" />}
                {isOpponent && <span className="text-[7px] text-blue-400/50 font-bold uppercase shrink-0">YOU</span>}
              </div>
            ) : (
              <span className="text-zinc-600 font-black uppercase" style={{ fontFamily: 'Teko, sans-serif', fontSize: 15 }}>AWAITING</span>
            )}
          </div>
        </div>

        {/* Timer */}
        {isLive && battle.ends_at && (
          <div className="flex justify-center py-2.5">
            <ArcadeCountdown endDate={battle.ends_at} label="ENDS IN" variant="battle" />
          </div>
        )}
        {battle.status !== 'active' && battle.ends_at && new Date(battle.ends_at) > new Date() && (
          <div className="flex justify-center py-2">
            <span className="text-[11px] text-zinc-500 tracking-wider uppercase">
              {Math.max(0, Math.ceil((new Date(battle.ends_at).getTime() - Date.now()) / 3600000))}h remaining
            </span>
          </div>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-6xl mx-auto px-4 mt-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-5 lg:items-start">
        {/* ── MAIN COLUMN ── */}
        <div className="space-y-3 min-w-0">

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
                {battle.requested_judge_username ? <SmartUsername userId={battle.requested_judge_id || battle.judge_id} username={battle.requested_judge_username} className="text-sm font-medium text-white block" /> : <span className="text-sm font-medium text-white block">Assigned</span>}
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

        {/* Submissions Display */}
        {(battle.challenger_submission_url || battle.opponent_submission_url) && (
          <div className="space-y-3">
            {/* ═══ SHOWCASE — both submitted, tap-to-play native video slots ═══ */}
            {isJudging && bothSubmitted && battle.opponent_id && (
              <BattleShowcase
                sides={[
                  {
                    userId: battle.challenger_id,
                    username: battle.challenger_username,
                    avatarUrl: battle.challenger_avatar_url,
                    url: battle.challenger_submission_url!,
                    color: "red",
                  },
                  {
                    userId: battle.opponent_id,
                    username: battle.opponent_username || "???",
                    avatarUrl: battle.opponent_avatar_url,
                    url: battle.opponent_submission_url!,
                    color: "blue",
                  },
                ]}
                redScore={battle.challenger_votes}
                blueScore={battle.opponent_votes}
              />
            )}

            {/* ═══ JUDGE WINDOW BANNER (30 min) ═══ */}
            {isJudging && bothSubmitted && !inPublicVote && judgingDeadline && judgeMsLeft > 0 && (
              <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Gavel className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-purple-300" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Judge deciding
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {Math.ceil(judgeMsLeft / 60000)}m left — then it goes to public vote
                  </p>
                </div>
              </div>
            )}

            {/* ═══ PUBLIC VOTE BANNER (15 min) ═══ */}
            {inPublicVote && publicVoteMsLeft > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-300" style={{ fontFamily: 'Teko, sans-serif' }}>
                    Public Vote — {Math.ceil(publicVoteMsLeft / 60000)}m left
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Judge didn't decide in time. Community picks the winner.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                EDITS ({[battle.challenger_submission_url, battle.opponent_submission_url].filter(Boolean).length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {battle.challenger_submission_url ? (
                <BattleSubmissionCard
                  url={battle.challenger_submission_url}
                  username={battle.challenger_username}
                    userId={battle.challenger_id}
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
              ) : (isCompleted && battle.winner_id) ? (
                <ForfeitSlot username={battle.challenger_username} userId={battle.challenger_id} color="red" />
              ) : null}
              {battle.opponent_submission_url ? (
                <BattleSubmissionCard
                  url={battle.opponent_submission_url}
                  username={battle.opponent_username || '???'}
                    userId={battle.opponent_id}
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
              ) : (isCompleted && battle.winner_id && battle.opponent_username) ? (
                <ForfeitSlot username={battle.opponent_username} userId={battle.opponent_id} color="blue" />
              ) : null}
            </div>

          </div>
        )}

        {/* Judge Scoring Panel */}
        {isJudging && <BattleJudgingPanel battle={battle} />}

        {isJudging && isParticipant && (
          <p className="text-[10px] text-zinc-500 text-center py-1">
            Community voting is live — spectators can upvote edits above
          </p>
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
                <SmartUsername userId={battle.winner_id} username={battle.winner_id === battle.challenger_id ? battle.challenger_username : (battle.opponent_username || '???')} />
              </p>
              {(battle.challenger_score !== null && battle.opponent_score !== null) && (
                <div className="flex items-center justify-center gap-6 mt-3">
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.challenger_score}</span>
                    <SmartUsername userId={battle.challenger_id} username={battle.challenger_username} className="text-[9px] text-zinc-500 block uppercase" />
                  </div>
                  <span className="text-xs text-zinc-600">vs</span>
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{battle.opponent_score}</span>
                    <SmartUsername userId={battle.opponent_id} username={battle.opponent_username || '???'} className="text-[9px] text-zinc-500 block uppercase" />
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

        {/* Hide battle (participants only, after it's done) */}
        {isParticipant && (isCompleted || battle.status === 'judging') && (
          <button
            onClick={() => setHideConfirmOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-red-400 transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Hide this battle
          </button>
        )}
        </div>

        {/* ── RIGHT RAIL (actions / submission / chat) ── */}
        <aside className="space-y-3 min-w-0 mt-3 lg:mt-0 lg:sticky lg:top-20 lg:self-start">
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
              <div className={canAcceptOpen ? "grid grid-cols-2 gap-2" : ""}>
                <button
                  onClick={handleAccept}
                  disabled={accepting || joining}
                  className="w-full relative overflow-hidden py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 shadow-[0_4px_24px_rgba(239,68,68,0.25)] active:scale-[0.98]"
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none rounded-t-xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2.5">
                    <Swords className="w-5 h-5 text-white" />
                    <span className="text-lg text-white font-bold uppercase tracking-[0.15em]" style={{ fontFamily: 'Teko, sans-serif' }}>
                      {accepting ? "ACCEPTING..." : canAcceptOpen ? "ACCEPT" : "ACCEPT CHALLENGE"}
                    </span>
                  </span>
                </button>
                {canAcceptOpen && (
                  <button
                    onClick={handleJoin}
                    disabled={joining || accepting}
                    className="w-full relative overflow-hidden py-4 rounded-xl bg-zinc-900 border border-red-500/30 hover:bg-zinc-800 hover:border-red-500/50 transition-all disabled:opacity-50 active:scale-[0.98]"
                    title="Take the slot but wait to start — chat first"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      <UserPlus className="w-5 h-5 text-red-400" />
                      <span className="text-lg text-red-400 font-bold uppercase tracking-[0.15em]" style={{ fontFamily: 'Teko, sans-serif' }}>
                        {joining ? "JOINING..." : "JOIN"}
                      </span>
                    </span>
                  </button>
                )}
              </div>
              {canAcceptOpen && (
                <p className="text-[10px] text-zinc-500 text-center tracking-wide">
                  ACCEPT starts the battle now · JOIN claims the slot so you can smack-talk first
                </p>
              )}
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

          {/* Both players locked in — either side starts */}
          {canStartJoined && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full relative overflow-hidden py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 shadow-[0_4px_24px_rgba(16,185,129,0.25)] active:scale-[0.98]"
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none rounded-t-xl" />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <Swords className="w-5 h-5 text-white" />
                  <span className="text-lg text-white font-bold uppercase tracking-[0.15em]" style={{ fontFamily: 'Teko, sans-serif' }}>
                    {starting ? "STARTING..." : "ACCEPT BATTLE · START"}
                  </span>
                </span>
              </button>
              <p className="text-[10px] text-zinc-500 text-center tracking-wide">
                Both players locked in — either side can start the clock
              </p>
            </motion.div>
          )}

          {/* Waiting for opponent */}
          {isChallenger && battle.status === 'pending' && battle.opponent_id && (
            <div className="bg-zinc-900/60 border border-amber-500/15 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-amber-400/60 mx-auto mb-2" />
              <p className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Teko, sans-serif' }}>
                Waiting for <SmartUsername userId={battle.opponent_id} username={battle.opponent_username || '???'} />
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">They've been notified</p>
            </div>
          )}

          {/* Submission Form — song pick optional (+50 XP bonus) */}
          {canSubmit && (
            <div className="bg-zinc-900/60 border border-amber-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.15em]">SUBMIT YOUR EDIT</span>
                <span className="text-[9px] text-zinc-500">MP4 · MOV · max {MAX_EDIT_UPLOAD_LABEL}</span>
              </div>
              <label
                className={`flex items-center justify-center gap-2 h-12 w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-[0.15em] cursor-pointer active:scale-[0.99] transition ${submitting ? 'opacity-60 pointer-events-none' : 'hover:from-amber-400 hover:to-amber-500'}`}
              >
                <input
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  disabled={submitting}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    if (file.size > MAX_EDIT_UPLOAD_BYTES) { toast.error(`File too big — ${MAX_EDIT_UPLOAD_LABEL} max`); return; }
                    setSubmitting(true);
                    setUploadPct(0);
                    try {
                       const { url: cdnUrl } = await uploadToBunny(file, {
                         folder: `battle-edits/${battle.id}`,
                         onProgress: (p) => setUploadPct(p),
                       });
                       const success = await submitToBattle(battle.id, user.id, isChallenger, cdnUrl, 'upload');
                      if (!success) throw new Error('submit failed');
                      if (hasSongPicked && user?.id) {
                        try {
                          await supabase.rpc('award_xp', {
                            p_user_id: user.id,
                            p_amount: 50,
                            p_action: 'song_pick_bonus',
                            p_description: 'Picked a library song for 1v1 Battle',
                          });
                          toast.success('Submission recorded! +50 XP song bonus 🎵');
                        } catch { toast.success('Submission recorded!'); }
                      } else {
                        toast.success('Submission recorded!');
                      }
                      refetch();
                    } catch (err) {
                      console.error('upload failed', err);
                      toast.error('Upload failed — try again');
                    } finally {
                      setSubmitting(false);
                      setUploadPct(0);
                      e.target.value = '';
                    }
                  }}
                />
                {submitting ? (
                  <span>UPLOADING {Math.round(uploadPct * 100)}%</span>
                ) : (
                  <><Upload className="w-4 h-4" /> <span>UPLOAD EDIT</span></>
                )}
              </label>
            </div>
          )}

          {/* Change Edit — visible when already submitted but battle still active */}
          {isLive && isParticipant && (
            (isChallenger && !!battle.challenger_submitted_at) ||
            (isOpponent && !!battle.opponent_submitted_at)
          ) && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-300">Edit submitted</span>
              </div>
              <button
                type="button"
                onClick={handleClearBattleSubmission}
                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 hover:text-amber-300 transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Change Edit
              </button>
            </div>
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

          {/* Forfeit Battle — escape hatch for active participants */}
          {isParticipant && battle.status === 'active' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Forfeit this battle?\n\n• Your opponent will be declared the winner\n• You will lose 5 IDX\n• This cannot be undone"
                  );
                  if (!confirmed) return;
                  const opponentId = isChallenger ? battle.opponent_id : battle.challenger_id;
                  try {
                    await supabase.from('battles').update({
                      status: 'completed',
                      winner_id: opponentId,
                      judged_at: new Date().toISOString(),
                      winner_index_awarded: 20,
                      loser_index_penalty: 5,
                    }).eq('id', battle.id);
                    if (user?.id) {
                      try {
                        await supabase.rpc('increment_user_index' as any, {
                          p_user_id: user.id,
                          p_amount: -5,
                        });
                      } catch {}
                    }
                    if (opponentId) {
                      try {
                        await supabase.from('notifications').insert({
                          user_id: opponentId,
                          type: 'battle_won',
                          title: 'Opponent forfeited',
                          message: `Your opponent walked away — you win this battle!`,
                          data: { battle_id: battle.id },
                        } as any);
                      } catch {}
                    }
                    toast.info("You forfeited the battle. -5 IDX");
                    navigate('/arena');
                  } catch (err) {
                    console.error('Forfeit failed:', err);
                    toast.error("Couldn't forfeit. Try again.");
                  }
                }}
                className="w-full py-3 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.18em' }}
              >
                <Flag className="w-3.5 h-3.5" />
                Forfeit Battle · −5 IDX
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-1.5">
                Walk away if you can't submit. Opponent wins.
              </p>
            </motion.div>
          )}
        </aside>
      </div>

      {/* Battle Invite Modal */}
      <BattleInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        battleId={battle.id}
        challengerUsername={battle.challenger_username}
      />

      {/* Shareable Battle Card */}
      <BattleShareCard
        isOpen={shareCardOpen}
        onClose={() => setShareCardOpen(false)}
        battle={battle as any}
      />

      {/* Hide Battle Confirmation */}
      <AlertDialog open={hideConfirmOpen} onOpenChange={setHideConfirmOpen}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-red-400" />
              Hide this battle?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
              This battle will be removed from the Arena carousel and public lists.
              Your stats, wins/losses, and Index won't change — only the battle card
              gets hidden from public view. You can't undo this from the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-zinc-300 hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHideBattle}
              disabled={hiding}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {hiding ? 'Hiding…' : 'Yes, hide it'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
