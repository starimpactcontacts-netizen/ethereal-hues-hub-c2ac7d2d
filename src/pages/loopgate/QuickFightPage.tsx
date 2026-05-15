import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MAX_EDIT_UPLOAD_BYTES, MAX_EDIT_UPLOAD_LABEL, uploadToBunny } from '@/lib/bunnyUpload';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Clock, Send, Trophy, ExternalLink, Gavel, Video, Music, Upload, EyeOff, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuickFight, submitQuickFight, joinWaitingQuickFight, useOpenQuickFightQueue } from '@/hooks/useQuickFight';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import QuickFightChat from '@/components/loopgate/QuickFightChat';
import QuickFightResultCard from '@/components/loopgate/QuickFightResultCard';
import BattleSubmissionCard from '@/components/loopgate/BattleSubmissionCard';
import BattleAutoplayDuo from '@/components/loopgate/BattleAutoplayDuo';
import FNFVoteScoreboard from '@/components/loopgate/FNFVoteScoreboard';
import QuickFightPublicVote from '@/components/loopgate/QuickFightPublicVote';
import BattleDecidedOverlay from '@/components/loopgate/BattleDecidedOverlay';
import { setLobbyMusicActive } from '@/components/loopgate/LobbyMusicPlayer';
import CustomEditBattleLobby from '@/components/loopgate/CustomEditBattleLobby';
import BattleIntroOverlay from '@/components/loopgate/BattleIntroOverlay';

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
  const { entries: openQueue } = useOpenQuickFightQueue();
  const { isJudge, isAnyJudge, isAdmin, isDev } = useUserRoles(user?.id);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [judgeScore1, setJudgeScore1] = useState('');
  const [judgeScore2, setJudgeScore2] = useState('');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [judging, setJudging] = useState(false);
  const [judgeVideoUrl, setJudgeVideoUrl] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  const [hiding, setHiding] = useState(false);
  const introKey = fightId ? `battle-intro-played:${fightId}` : null;
  const [introDone, setIntroDone] = useState(() => (introKey ? sessionStorage.getItem(introKey) === '1' : true));
  const [decidedActive, setDecidedActive] = useState(false);
  const [decidedShown, setDecidedShown] = useState(false);

  useEffect(() => {
    if (!introKey) return;
    setIntroDone(sessionStorage.getItem(introKey) === '1');
  }, [introKey]);

  // Once intro is done AND fight is decided, wait one full rotation
  // (both edits shown = 20s) then trigger the cinematic verdict reveal.
  useEffect(() => {
    if (!introDone) return;
    if (decidedShown) return;
    if (!fight) return;
    if (fight.status !== 'completed' || !fight.winner_id) return;
    if (!fight.player_1_submission_url || !fight.player_2_submission_url) return;
    const t = setTimeout(() => {
      setDecidedActive(true);
      setDecidedShown(true);
    }, 20_000);
    return () => clearTimeout(t);
  }, [introDone, decidedShown, fight?.status, fight?.winner_id, fight?.player_1_submission_url, fight?.player_2_submission_url]);
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
  const isWaitingLobby = !!fight && fight.status === 'waiting' && !fight.player_2_id;

  useEffect(() => {
    if (!isWaitingLobby) return;
    setLobbyMusicActive(true);
    return () => setLobbyMusicActive(false);
  }, [isWaitingLobby]);

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

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/fight/${fight.id}` : '';

  const handleCopyLobby = async () => {
    try {
      await navigator.clipboard.writeText(`⚔️ Join my custom Loopgate edit battle: ${shareUrl}`);
      toast.success('Lobby link copied');
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleShareLobby = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Custom Edit Battle', text: `Join @${fight.player_1_username}'s edit battle`, url: shareUrl });
      } else {
        await handleCopyLobby();
      }
    } catch {}
  };

  const handleJoinLobby = async (code?: string) => {
    if (!user || !profile) { navigate('/start'); return; }
    if (isP1) return;
    const result = await joinWaitingQuickFight(fight.id, user.id, profile.username, profile.avatar_url || null, code);
    if (result.ok) toast.success('⚔️ Battle started');
    else toast.error(result.error?.includes('Invalid join code') ? 'Wrong code' : "Couldn't join lobby");
  };

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

  const handleHideFight = async () => {
    if (!fight || hiding) return;
    setHiding(true);
    const { error } = await supabase.rpc('toggle_quick_fight_hidden' as any, {
      p_fight_id: fight.id,
      p_hide: true,
    } as any);
    setHiding(false);
    setHideConfirmOpen(false);
    if (error) {
      toast.error('Failed to hide fight');
      return;
    }
    toast.success('Battle hidden from public view');
    navigate('/hub');
  };

  if (isWaitingLobby) {
    return (
      <CustomEditBattleLobby
        fight={fight}
        isHost={isP1}
        viewerId={user?.id}
        openQueue={openQueue}
        onBack={() => navigate('/arena')}
        onShare={handleShareLobby}
        onCopy={handleCopyLobby}
        onJoin={handleJoinLobby}
        onSongPicked={handleSongPick}
        onCancel={async () => {
          if (!window.confirm('Close this lobby?')) return;
          await supabase.from('quick_fights').update({ status: 'cancelled' }).eq('id', fight.id);
          toast('Lobby closed', { duration: 1500 });
          navigate('/arena');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cinematic winner reveal — fires once both edits have looped */}
      {fight.status === 'completed' && fight.winner_id && (
        <BattleDecidedOverlay
          active={decidedActive}
          winnerUsername={
            fight.winner_id === fight.player_1_id
              ? fight.player_1_username
              : (fight.player_2_username || '???')
          }
          winnerAvatarUrl={
            fight.winner_id === fight.player_1_id
              ? fight.player_1_avatar_url
              : fight.player_2_avatar_url
          }
          winnerColor={fight.winner_id === fight.player_1_id ? 'red' : 'blue'}
          loserUsername={
            fight.winner_id === fight.player_1_id
              ? (fight.player_2_username || undefined)
              : fight.player_1_username
          }
          onDismiss={() => setDecidedActive(false)}
        />
      )}
      {fight.player_1_submission_url && fight.player_2_submission_url && fight.player_2_id && !introDone && (
        <BattleIntroOverlay
          fightId={fight.id}
          active
          onComplete={() => {
            if (introKey) sessionStorage.setItem(introKey, '1');
            setIntroDone(true);
          }}
        />
      )}
      {/* ════════ ARCADE HUD ════════ */}
      {/* Top bar: back + status pill */}
      <div className="relative z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Back</span>
          </button>
          <div className="flex items-center gap-1.5">
            {fight.status === 'active' && (
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
            {fight.status === 'active' && <Swords className="w-3.5 h-3.5 text-red-400" />}
            <span
              className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                fight.status === 'active' ? 'text-red-400' :
                fight.status === 'judging' ? 'text-purple-400' :
                fight.status === 'completed' ? 'text-amber-400' : 'text-zinc-500'
              }`}
              style={{ fontFamily: 'Teko, sans-serif' }}
            >
              {fight.status === 'active' ? 'LIVE FIGHT' :
               fight.status === 'judging' ? 'AWAITING JUDGE' :
               fight.status === 'completed' ? 'DECIDED' :
               fight.status === 'cancelled' ? 'CANCELLED' :
               fight.status === 'forfeited' ? 'FORFEIT' : fight.status.toUpperCase()}
            </span>
            {isParticipant && fight.status === 'completed' && (
              <button
                onClick={() => setHideConfirmOpen(true)}
                className="ml-2 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors touch-manipulation"
                aria-label="Hide this battle"
              >
                <EyeOff className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-400">Hide</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FNF-style live vote scoreboard — replaces the old red/blue HUD topbar */}
      {fight.player_2_id && fight.player_2_username ? (
        <FNFVoteScoreboard
          fightId={fight.id}
          redUserId={fight.player_1_id}
          blueUserId={fight.player_2_id}
          redUsername={fight.player_1_username}
          blueUsername={fight.player_2_username}
          redAvatarUrl={fight.player_1_avatar_url}
          blueAvatarUrl={fight.player_2_avatar_url}
        />
      ) : null}

      {/* Active match countdown chip */}
      {fight.status === 'active' && fight.ends_at && (
        <div className="px-3 pt-2 flex items-center justify-center">
          <div
            className="px-3 py-1 rounded-md flex items-center gap-2"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.95), rgba(15,15,20,0.95))',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]" style={{ fontFamily: 'Teko, sans-serif' }}>
              TIME LEFT
            </span>
            <span className="font-mono tabular-nums text-white text-[13px] font-bold tracking-wider">
              <CountdownTimer endDate={fight.ends_at} label="" />
            </span>
          </div>
        </div>
      )}

      {/* Content — videos full-width up top, vote+chat stacked underneath. */}
      <div className="max-w-7xl mx-auto px-4 mt-2">
        {/* ── MAIN COLUMN (videos + judge + result) ── */}
        <div className="space-y-4 min-w-0">
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

        {/* SCREEN VS SCREEN — stacked vertical, RED on top, VS divider, BLUE on bottom */}
        <div className="space-y-0">
          {fight.player_1_submission_url && fight.player_2_submission_url && fight.player_2_id ? (
            // BOTH UPLOADED → autoplay loop, 10s each, screen-record-ready
            <BattleAutoplayDuo
              red={{
                userId: fight.player_1_id,
                username: fight.player_1_username,
                url: fight.player_1_submission_url,
                color: 'red',
                avatarUrl: fight.player_1_avatar_url,
              }}
              blue={{
                userId: fight.player_2_id,
                username: fight.player_2_username || '???',
                url: fight.player_2_submission_url,
                color: 'blue',
                avatarUrl: fight.player_2_avatar_url,
              }}
              startedAt={
                fight.player_1_submitted_at && fight.player_2_submitted_at
                  ? new Date(
                      Math.max(
                        new Date(fight.player_1_submitted_at).getTime(),
                        new Date(fight.player_2_submitted_at).getTime(),
                      ),
                    ).toISOString()
                  : null
              }
              paused={!introDone || decidedActive}
            />
          ) : (
            // Pre-upload state — placeholders stacked with VS divider
            <div className="md:flex md:items-stretch md:gap-0 -mx-4 md:-mx-0">
              <div className="md:flex-1 md:min-w-0">
                {fight.player_1_submission_url ? (
                  <BattleSubmissionCard
                    url={fight.player_1_submission_url}
                    username={fight.player_1_username}
                    color="red"
                    aspectClass="aspect-square"
                    avatarUrl={fight.player_1_avatar_url}
                    customThumbnailUrl={(fight as any).player_1_thumbnail_url}
                  />
                ) : (
                  <EmptyEditSlot
                    color="red"
                    username={fight.player_1_username}
                    avatarUrl={fight.player_1_avatar_url}
                    isYou={isP1}
                    isLive={fight.status === 'active'}
                    aspectClass="aspect-square"
                  />
                )}
              </div>

              {/* VS divider — horizontal on mobile, vertical on laptop */}
              <div className="relative h-8 md:h-auto md:w-0 flex items-center justify-center bg-black z-20">
                <div
                  className="absolute inset-x-0 top-1/2 h-px md:inset-y-0 md:left-1/2 md:top-0 md:h-auto md:w-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), #fff, rgba(59,130,246,0.7), transparent)' }}
                />
                <div className="relative px-3 py-0.5 bg-black border border-white/15">
                  <span
                    className="text-[14px] font-black tracking-[0.25em] bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Teko, sans-serif' }}
                  >
                    VS
                  </span>
                </div>
              </div>

              <div className="md:flex-1 md:min-w-0">
                {fight.player_2_submission_url ? (
                  <BattleSubmissionCard
                    url={fight.player_2_submission_url}
                    username={fight.player_2_username || '???'}
                    color="blue"
                    aspectClass="aspect-square"
                    avatarUrl={fight.player_2_avatar_url}
                    customThumbnailUrl={(fight as any).player_2_thumbnail_url}
                  />
                ) : (
                  <EmptyEditSlot
                    color="blue"
                    username={fight.player_2_username || 'Waiting…'}
                    avatarUrl={fight.player_2_avatar_url}
                    isYou={isP2}
                    isLive={fight.status === 'active'}
                    aspectClass="aspect-square"
                  />
                )}
              </div>
            </div>
          )}

          {/* Inline submit bar — always visible to participants while active */}
          {canSubmit && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-500/10 via-surface-1 to-blue-500/10 border border-gold/40 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-3.5 h-3.5 text-gold" />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Drop Your Edit</span>
                <span className="text-[9px] text-muted-foreground">MP4 · MOV · max {MAX_EDIT_UPLOAD_LABEL}</span>
              </div>
              <label
                className={`flex items-center justify-center gap-2 h-12 w-full bg-gold text-background font-display uppercase tracking-wider cursor-pointer active:scale-[0.99] transition ${submitting ? 'opacity-60 pointer-events-none' : 'hover:bg-gold/90'}`}
              >
                <input
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  disabled={submitting}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    if (file.size > MAX_EDIT_UPLOAD_BYTES) {
                      toast.error(`File too big — ${MAX_EDIT_UPLOAD_LABEL} max`);
                      return;
                    }
                    setSubmitting(true);
                    setUploadPct(0);
                    try {
                       const { url: cdnUrl } = await uploadToBunny(file, {
                         folder: `battle-edits/${fight.id}`,
                         onProgress: (p) => setUploadPct(p),
                       });
                       const success = await submitQuickFight(fight.id, user.id, cdnUrl);
                      if (!success) throw new Error('submit failed');
                      if (hasSongPicked) {
                        try {
                          await supabase.rpc('award_xp', {
                            p_user_id: user.id,
                            p_amount: 50,
                            p_action: 'song_pick_bonus',
                            p_description: 'Picked a library song for Quick 1v1',
                          });
                          toast.success('🔥 Edit uploaded! +50 XP song bonus');
                        } catch {
                          toast.success('🔥 Edit uploaded!');
                        }
                      } else {
                        toast.success('🔥 Edit uploaded!');
                      }
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
                  <span className="text-sm">UPLOADING {Math.round(uploadPct * 100)}%</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">UPLOAD EDIT</span>
                  </>
                )}
              </label>
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
        </div>

        {/* ── BELOW-VIDEO RAIL (vote + chat) — stacked on mobile, side-by-side on desktop ── */}
        <aside className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        {/* Public Vote — visible once both edits are in (or fight is decided) */}
        {fight.player_2_id && fight.player_1_submission_url && fight.player_2_submission_url && (
          <QuickFightPublicVote
            fightId={fight.id}
            player1Id={fight.player_1_id}
            player2Id={fight.player_2_id}
            player1Username={fight.player_1_username}
            player2Username={fight.player_2_username || '???'}
            locked={fight.status === 'completed'}
            officialWinnerId={fight.winner_id}
          />
        )}

        {/* Unified live chat — participants get RED/BLUE tags, spectators just hype */}
        {fight.player_2_id && (
          <QuickFightChat
            fightId={fight.id}
            player1Id={fight.player_1_id}
            player2Id={fight.player_2_id}
            player1Username={fight.player_1_username}
            player2Username={fight.player_2_username || '???'}
          />
        )}
        </aside>
      </div>

      <AlertDialog open={hideConfirmOpen} onOpenChange={setHideConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-red-400" />
              Hide this edit battle?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This battle will be removed from public carousels and feeds. Your stats, votes,
              and judge results stay intact — only the battle's visibility changes. You can
              still access it via direct link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hiding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHideFight}
              disabled={hiding}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {hiding ? 'Hiding…' : 'Hide Battle'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  waitingFor,
  aspectClass = 'aspect-[9/16]',
}: {
  color: 'red' | 'blue';
  username: string;
  avatarUrl?: string | null;
  isYou: boolean;
  isLive: boolean;
  waitingFor?: string;
  aspectClass?: string;
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
      <div className={`relative ${aspectClass} bg-gradient-to-br ${gradientFrom} ${gradientTo} flex flex-col items-center justify-center overflow-hidden`}>
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
            {waitingFor === 'both'
              ? 'Both edits pending'
              : waitingFor
              ? `Waiting on @${waitingFor}`
              : isYou
              ? 'Drop Edit'
              : 'Awaiting Drop'}
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
