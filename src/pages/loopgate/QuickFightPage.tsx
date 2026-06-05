import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MAX_EDIT_UPLOAD_BYTES, MAX_EDIT_UPLOAD_LABEL, uploadToBunny } from '@/lib/bunnyUpload';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Clock, Send, Trophy, ExternalLink, Gavel, Video, Music, Upload, EyeOff, Loader2, RotateCcw, MessageSquare, BarChart2 } from 'lucide-react';
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
import BattleSubmissionCard, { ForfeitSlot } from '@/components/loopgate/BattleSubmissionCard';
import BattleAutoplayDuo from '@/components/loopgate/BattleAutoplayDuo';
import FNFVoteScoreboard from '@/components/loopgate/FNFVoteScoreboard';
import QuickFightPublicVote from '@/components/loopgate/QuickFightPublicVote';
import { setLobbyMusicActive } from '@/components/loopgate/LobbyMusicPlayer';
import CustomEditBattleLobby from '@/components/loopgate/CustomEditBattleLobby';
import BattleSelectFlow from '@/components/loopgate/battle-select/BattleSelectFlow';
import BattleSelectionsBanner from '@/components/loopgate/BattleSelectionsBanner';
import BattleRevealScreen from '@/components/loopgate/BattleRevealScreen';
import FighterStatsBar from '@/components/loopgate/FighterStatsBar';
import BattleEnterIntro from '@/components/loopgate/BattleEnterIntro';
import BattleClipExporter from '@/components/loopgate/BattleClipExporter';

/** Deterministic index from fight ID — both players independently produce the same pick */
function seededIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return Math.abs(h) % len;
}

const FALLBACK_SONG_POOL = [
  { id: 'fb-1', song_name: 'Virtuoso',    artist_name: 'Loneliness x Sace', cover_url: null, preview_url: null },
  { id: 'fb-2', song_name: 'LUA NOVA',    artist_name: 'refri',             cover_url: null, preview_url: null },
  { id: 'fb-3', song_name: 'Toxic Potion',artist_name: 'Margaux',           cover_url: null, preview_url: null },
];

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
  const [showIntro, setShowIntro] = useState(true);
  const [revealDone, setRevealDone] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !fightId) return false;
    return sessionStorage.getItem(`qf_reveal_done_${fightId}`) === '1';
  });

  const autoAssignedRef = useRef(false);

  // Auto-assign random picks when fight is active but player never made selections.
  // Uses fight ID as seed so both players independently get the same song + scenepack
  // when neither chose anything.
  useEffect(() => {
    if (!fight || fight.status !== 'active' || !user?.id) return;
    const isMe = user.id === fight.player_1_id || user.id === fight.player_2_id;
    if (!isMe) return;
    if (autoAssignedRef.current) return;
    autoAssignedRef.current = true;

    (async () => {
      const { data } = await supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fight.id } as any);
      const existing = (data as any)?.mine;
      const needsPack = !existing?.pack?.id;
      const needsSong = !existing?.song?.id;
      if (!needsPack && !needsSong) return;

      const [{ data: packRows }, { data: songRows }] = await Promise.all([
        supabase.from('scenepack_pool').select('id, title, thumbnail_url, pack_count').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('battle_songs' as any).select('id, song_name, artist_name, cover_url, preview_url, audio_url').eq('is_featured', true).limit(60),
      ]);

      const packPool = Array.isArray(packRows) && packRows.length ? packRows : [];
      const songPool = Array.isArray(songRows) && songRows.length ? songRows : FALLBACK_SONG_POOL;

      const p_scenepack = needsPack && packPool.length ? (() => {
        const p = packPool[seededIndex(fight.id, packPool.length)] as any;
        return { id: p.id, name: p.title || 'Unknown', poster: p.thumbnail_url || '', packCount: p.pack_count || 0 };
      })() : (existing?.pack || null);

      const p_song = needsSong ? (() => {
        const s = songPool[seededIndex(fight.id + 's', songPool.length)] as any;
        return { id: s.id, title: s.song_name || 'Unknown', artist: s.artist_name || '', cover: s.cover_url || null, preview: s.preview_url || s.audio_url || null };
      })() : (existing?.song || null);

      await supabase.rpc('upsert_quick_fight_selection' as any, {
        p_fight_id: fight.id,
        p_scenepack,
        p_song,
        p_ready: true,
      } as any);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fight?.status, fight?.id, fight?.player_1_id, fight?.player_2_id, user?.id]);

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
  const isWaitingLobby = !!fight && fight.status === 'waiting';

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
        <Swords className="w-8 h-8 text-red-400/70" />
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
  const myPlayer = isP1
    ? { username: fight.player_1_username, avatarUrl: fight.player_1_avatar_url, level: (profile as any)?.level || 1 }
    : { username: fight.player_2_username || profile?.username || 'You', avatarUrl: fight.player_2_avatar_url || profile?.avatar_url || null, level: (profile as any)?.level || 1 };
  const opponentPlayer = isP1
    ? { username: fight.player_2_username || 'Opponent', avatarUrl: fight.player_2_avatar_url, level: 1 }
    : { username: fight.player_1_username, avatarUrl: fight.player_1_avatar_url, level: 1 };
  const canSubmit = fight.status === 'active' && isParticipant && (
    (isP1 && !fight.player_1_submitted_at) || (isP2 && !fight.player_2_submitted_at)
  );
  const canJudge = fight.status === 'judging' && (isJudge || isAnyJudge || isAdmin || isDev) && !fight.judge_id;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/fight/${fight.id}` : '';

  const handleUploadEdit = async (file: File) => {
    if (!user || !fight) return;
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
    }
  };

  const handleClearSubmission = async (player: 'player_1' | 'player_2') => {
    const confirmed = window.confirm('Remove your edit?\n\nYou can re-upload a new one while the battle is still active.');
    if (!confirmed) return;
    const update = player === 'player_1'
      ? { player_1_submission_url: null, player_1_submitted_at: null, player_1_thumbnail_url: null }
      : { player_2_submission_url: null, player_2_submitted_at: null, player_2_thumbnail_url: null };
    const { error } = await supabase.from('quick_fights').update(update as any).eq('id', fight.id);
    if (error) toast.error("Couldn't remove edit. Try again.");
    else toast.info('Edit removed — upload a new one before time runs out.');
  };

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

  const handleReserveLobby = async () => {
    if (!user || !profile || isP1 || fight.player_2_id) return;
    const { data, error } = await supabase.rpc('reserve_quick_fight_slot' as any, {
      p_fight_id: fight.id,
      p_user_id: user.id,
      p_username: profile.username,
      p_avatar_url: profile.avatar_url || null,
      p_code: null,
    } as any);
    const result = data as { ok?: boolean; error?: string } | null;
    if (error || !result?.ok) {
      if (result?.error === 'slot_taken') toast.error('Slot just got taken');
      else if (result?.error === 'bad_code') toast.error('Code required');
      else toast.error("Couldn't reserve slot");
      return;
    }
    toast.success('🔴 You\'re in — smack talk away');
  };

  const handleJoinLobby = async (code?: string) => {
    if (!user || !profile) { navigate('/start'); return; }
    if (isP1) return;
    // If P2 already reserved their slot, just transition the fight to selecting
    if (fight.player_2_id === user.id) {
      const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('quick_fights')
        .update({ status: 'selecting', selection_deadline: deadline } as any)
        .eq('id', fight.id)
        .eq('player_2_id', user.id)
        .eq('status', 'waiting');
      if (!error) toast.success('⚔️ Battle started');
      else toast.error("Couldn't start battle");
      return;
    }
    const normalizedCode = code ? code.trim().toUpperCase() : undefined;
    const result = await joinWaitingQuickFight(fight.id, user.id, profile.username, profile.avatar_url || null, normalizedCode);
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
        onReserve={handleReserveLobby}
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

  if (fight.status === 'selecting' && isParticipant) {
    return (
      <BattleSelectFlow
        open
        fightId={fight.id}
        you={myPlayer}
        opponent={opponentPlayer}
        youSide={isP1 ? 'red' : 'blue'}
        selectionDeadline={(fight as any).selection_deadline || null}
        onComplete={() => {
          if (typeof window !== 'undefined') sessionStorage.setItem(`qf_reveal_done_${fight.id}`, '1');
          setRevealDone(true);
        }}
        onCancel={() => navigate('/hub')}
      />
    );
  }

  // Mandatory pre-battle reveal — shown once per session when the match becomes active.
  if (
    fight.status === 'active' &&
    !revealDone &&
    fight.player_2_id &&
    fight.player_2_username
  ) {
    return (
      <BattleRevealScreen
        fightId={fight.id}
        red={{ username: fight.player_1_username, avatarUrl: fight.player_1_avatar_url }}
        blue={{ username: fight.player_2_username, avatarUrl: fight.player_2_avatar_url }}
        mySide={isP1 ? 'red' : isP2 ? 'blue' : null}
        durationMs={5000}
        onComplete={() => {
          if (typeof window !== 'undefined') sessionStorage.setItem(`qf_reveal_done_${fight.id}`, '1');
          setRevealDone(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#080808' }}>
      {showIntro && fight.player_2_username && (
        <BattleEnterIntro
          redUsername={fight.player_1_username}
          blueUsername={fight.player_2_username}
          onDone={() => setShowIntro(false)}
        />
      )}
      {/* ════════ HEADER ════════ */}
      <div className="relative z-30 border-b border-white/[0.06]" style={{ background: '#080808' }}>
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Back</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Utility icons */}
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
              <BarChart2 className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
              {fight.player_1_submission_url && fight.player_2_submission_url && fight.player_2_id && fight.player_2_username && (
                <BattleClipExporter
                  fightId={fight.id}
                  redUrl={fight.player_1_submission_url}
                  blueUrl={fight.player_2_submission_url}
                  redUsername={fight.player_1_username}
                  blueUsername={fight.player_2_username}
                  redScore={(fight as any).winner_id === fight.player_1_id ? (fight as any).winner_score ?? 0 : (fight as any).loser_score ?? 0}
                  blueScore={(fight as any).winner_id === fight.player_2_id ? (fight as any).winner_score ?? 0 : (fight as any).loser_score ?? 0}
                  winnerSide={fight.winner_id === fight.player_1_id ? 'red' : fight.winner_id === fight.player_2_id ? 'blue' : null}
                  status={fight.status}
                />
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-white/10" />

            {/* Status — Bebas Neue, no box */}
            {fight.status === 'active' && (
              <div className="flex items-center gap-2">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                <span className="text-[22px] leading-none tracking-[0.06em] text-red-400" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: '0 0 18px rgba(239,68,68,0.5)' }}>
                  LIVE FIGHT
                </span>
              </div>
            )}
            {fight.status === 'judging' && (
              <span className="text-[22px] leading-none tracking-[0.06em] text-white" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: '1px 1px 0 rgba(0,0,0,0.9), 0 0 12px rgba(255,255,255,0.08)' }}>
                AWAITING JUDGE
              </span>
            )}
            {fight.status === 'completed' && (
              <span className="text-[22px] leading-none tracking-[0.06em] text-amber-400" style={{ fontFamily: 'Bebas Neue, sans-serif', textShadow: '0 0 14px rgba(251,191,36,0.4)' }}>
                DECIDED
              </span>
            )}
            {(fight.status === 'cancelled' || fight.status === 'forfeited') && (
              <span className="text-[22px] leading-none tracking-[0.06em] text-zinc-500" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {fight.status === 'forfeited' ? 'FORFEIT' : 'CANCELLED'}
              </span>
            )}

            {isParticipant && fight.status === 'completed' && (
              <button
                onClick={() => setHideConfirmOpen(true)}
                className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors touch-manipulation"
                aria-label="Hide this battle"
              >
                <EyeOff className="w-3.5 h-3.5" />
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
          {isParticipant && fight.player_2_id && ['active','submitted','judging','completed'].includes(fight.status) && (
            <div className="mb-2">
              <BattleSelectionsBanner
                fightId={fight.id}
                mySide={isP1 ? 'red' : 'blue'}
                redUsername={fight.player_1_username}
                blueUsername={fight.player_2_username || '???'}
              />
            </div>
          )}
          {fight.player_1_submission_url && fight.player_2_submission_url && fight.player_2_id ? (
            // BOTH UPLOADED → clean tap-to-play native video slots
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
            />
          ) : null}

          {(!fight.player_1_submission_url || !fight.player_2_submission_url || !fight.player_2_id) ? (
            // Pre-upload state — always side-by-side with vertical VS divider
            <div className="relative grid grid-cols-2 -mx-4 md:-mx-0 overflow-hidden border border-white/[0.07]">
              {/* ── RED ── */}
              <div className="min-w-0 border-r border-red-500/20">
                {fight.player_1_submission_url ? (
                  <div>
                    <BattleSubmissionCard
                      url={fight.player_1_submission_url}
                      username={fight.player_1_username}
                      color="red"
                      aspectClass="aspect-square"
                      avatarUrl={fight.player_1_avatar_url}
                      customThumbnailUrl={(fight as any).player_1_thumbnail_url}
                    />
                    {isP1 && fight.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleClearSubmission('player_1')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-black/70 border-t border-red-500/25 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        style={{ fontFamily: 'Teko, sans-serif' }}
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Change Edit
                      </button>
                    )}
                  </div>
                ) : (fight.status === 'completed' && fight.winner_id) ? (
                  <ForfeitSlot username={fight.player_1_username} color="red" aspectClass="aspect-square" />
                ) : isP1 && canSubmit ? (
                  <UploadEditSlot color="red" submitting={submitting} uploadPct={uploadPct} onUpload={handleUploadEdit} />
                ) : (
                  <WaitingSlot color="red" username={fight.player_1_username} submitted={!!fight.player_1_submitted_at} />
                )}
              </div>

              {/* ── Vertical VS badge ── */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center" style={{ width: 1 }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 0%,rgba(239,68,68,.55) 30%,rgba(255,255,255,.85) 50%,rgba(59,130,246,.55) 70%,transparent 100%)' }} />
                <div className="relative bg-black border border-white/20 px-1.5 py-0.5">
                  <span className="text-[11px] font-black tracking-[0.22em] bg-gradient-to-b from-red-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
                </div>
              </div>

              {/* ── BLUE ── */}
              <div className="min-w-0 border-l border-blue-500/20">
                {fight.player_2_submission_url ? (
                  <div>
                    <BattleSubmissionCard
                      url={fight.player_2_submission_url}
                      username={fight.player_2_username || '???'}
                      color="blue"
                      aspectClass="aspect-square"
                      avatarUrl={fight.player_2_avatar_url}
                      customThumbnailUrl={(fight as any).player_2_thumbnail_url}
                    />
                    {isP2 && fight.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleClearSubmission('player_2')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-black/70 border-t border-blue-500/25 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        style={{ fontFamily: 'Teko, sans-serif' }}
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Change Edit
                      </button>
                    )}
                  </div>
                ) : (fight.status === 'completed' && fight.winner_id) ? (
                  <ForfeitSlot username={fight.player_2_username || '???'} color="blue" aspectClass="aspect-square" />
                ) : isP2 && canSubmit ? (
                  <UploadEditSlot color="blue" submitting={submitting} uploadPct={uploadPct} onUpload={handleUploadEdit} />
                ) : (
                  <WaitingSlot color="blue" username={fight.player_2_username || 'Waiting…'} submitted={!!fight.player_2_submitted_at} />
                )}
              </div>
            </div>
          ) : null}

          {/* Fighter stat strip — below videos, shown once */}
          {fight.player_2_id && (
            <div className="-mx-4 md:-mx-0">
              <FighterStatsBar
                redUserId={fight.player_1_id}
                blueUserId={fight.player_2_id}
              />
            </div>
          )}

          {/* Upload now lives inline inside the player's empty slot */}
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

        {/* Cancelled Banner */}
        {fight.status === 'cancelled' && (
          <div className="bg-muted border border-border p-4 text-center">
            <p className="text-sm font-display text-muted-foreground uppercase tracking-wider">🚫 Fight Cancelled</p>
            <p className="text-[10px] text-muted-foreground mt-1">Neither player submitted before the deadline. No index awarded.</p>
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

        {/* Share — below voting so people share after seeing the result */}
        {fight.status === 'completed' && fight.winner_id && (
          <div className="mt-4">
            <QuickFightResultCard fight={fight} />
          </div>
        )}
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

function WaitingSlot({ color, username, submitted }: { color: 'red' | 'blue'; username: string; submitted: boolean }) {
  const isRed = color === 'red';
  const accentHex = isRed ? '#ef4444' : '#3b82f6';
  const accentText = isRed ? 'text-red-400' : 'text-blue-400';
  const grad = isRed ? 'from-red-500/[0.06]' : 'from-blue-500/[0.06]';
  const label = isRed ? 'RED' : 'BLUE';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${grad} to-black flex flex-col h-[200px]`}
      style={{ boxShadow: `inset 0 0 40px ${accentHex}18` }}
    >
      {/* Top strip */}
      <div className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: accentHex }} />
        <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${accentText}`} style={{ fontFamily: 'Teko, sans-serif' }}>
          {label}
        </span>
      </div>

      {/* Username */}
      <div className="px-2.5">
        <p className="text-[15px] font-black text-white leading-none truncate" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.04em' }}>
          @{username}
        </p>
      </div>

      {/* Status — grows to fill */}
      <div className="flex-1 flex items-end justify-end px-2.5 pb-3">
        {submitted ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/35">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300" style={{ fontFamily: 'Teko, sans-serif' }}>
              Edit in
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25" style={{ fontFamily: 'Teko, sans-serif' }}>
              Working on it…
            </span>
          </div>
        )}
      </div>

      {/* Subtle corner accent */}
      <div className="absolute bottom-0 left-0 w-12 h-12 opacity-20" style={{ background: `radial-gradient(circle at 0% 100%, ${accentHex}, transparent 70%)` }} />
    </div>
  );
}

function UploadEditSlot({
  color,
  submitting,
  uploadPct,
  onUpload,
}: {
  color: 'red' | 'blue';
  submitting: boolean;
  uploadPct: number;
  onUpload: (file: File) => Promise<void> | void;
}) {
  const isRed = color === 'red';
  const accentHex = isRed ? '#ef4444' : '#3b82f6';
  const accentText = isRed ? 'text-red-400' : 'text-blue-400';
  const grad = isRed ? 'from-red-500/[0.07]' : 'from-blue-500/[0.07]';
  const label = isRed ? 'RED' : 'BLUE';

  const [picked, setPicked] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!picked) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(picked);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [picked]);

  const isVideo = picked?.type.startsWith('video/');

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_EDIT_UPLOAD_BYTES) {
      toast.error(`File too big — ${MAX_EDIT_UPLOAD_LABEL} max`);
      return;
    }
    setPicked(f);
  };

  const handleSubmit = async () => {
    if (!picked) return;
    await onUpload(picked);
    setPicked(null);
  };

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${grad} to-black flex flex-col h-[200px]`}
      style={{ boxShadow: `inset 0 0 40px ${accentHex}18` }}
    >
      {/* Top strip */}
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: accentHex }} />
          <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${accentText}`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {label} · You
          </span>
        </div>
        <span className="text-[7px] font-bold uppercase tracking-[0.15em] text-white/20">
          {MAX_EDIT_UPLOAD_LABEL}
        </span>
      </div>

      {/* Main area — preview or pick zone */}
      <div className="relative flex-1 overflow-hidden">
        {picked && previewUrl ? (
          <>
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            {!submitting && (
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 border border-white/20 flex items-center justify-center active:scale-90 text-white text-sm leading-none"
                aria-label="Remove"
              >×</button>
            )}
            {submitting && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {Math.round(uploadPct * 100)}%
                </span>
                <div className="w-20 h-[2px] bg-white/15 overflow-hidden">
                  <div className="h-full transition-[width] duration-150" style={{ width: `${Math.round(uploadPct * 100)}%`, background: accentHex }} />
                </div>
              </div>
            )}
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 cursor-pointer group">
            <input type="file" accept="video/*,image/*" className="hidden" onChange={handlePick} />
            <div
              className="w-9 h-9 flex items-center justify-center transition-transform group-active:scale-95"
              style={{ border: `1.5px solid ${accentHex}`, boxShadow: `0 0 18px ${accentHex}50` }}
            >
              <Upload className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: 'Teko, sans-serif' }}>
              Drop Edit Here
            </span>
            <span className="text-[7px] font-bold uppercase tracking-[0.18em] text-white/25">
              MP4 · MOV
            </span>
          </label>
        )}
      </div>

      {/* Action bar — only visible after picking */}
      {picked && !submitting && (
        <div className="flex shrink-0 border-t border-white/[0.08]">
          <label
            className="flex-1 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.18em] text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer transition-colors border-r border-white/[0.08]"
            style={{ fontFamily: 'Teko, sans-serif' }}
          >
            <input type="file" accept="video/*,image/*" className="hidden" onChange={handlePick} />
            Re-pick
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-[2] h-8 text-[11px] font-black uppercase tracking-[0.2em] text-black active:scale-[0.99] transition-transform"
            style={{ background: accentHex, fontFamily: 'Teko, sans-serif' }}
          >
            Submit
          </button>
        </div>
      )}

      {/* Subtle corner accent */}
      <div className="absolute bottom-0 right-0 w-12 h-12 opacity-20" style={{ background: `radial-gradient(circle at 100% 100%, ${accentHex}, transparent 70%)` }} />
    </div>
  );
}
