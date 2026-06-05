import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Play, Swords, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import FeedInlineComments from "./FeedInlineComments";
import FeedVideoPlayer from "./FeedVideoPlayer";
import SmartUsername from "./SmartUsername";
import { formatDistanceToNow } from "date-fns";
import { resolveInstantThumbnail, fetchThumbnailsBatch } from "@/hooks/useThumbnail";

interface BattleRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenger_username: string;
  opponent_username: string;
  challenger_avatar_url: string | null;
  opponent_avatar_url: string | null;
  challenger_submission_url: string | null;
  opponent_submission_url: string | null;
  challenger_submission_platform: string | null;
  opponent_submission_platform: string | null;
  challenger_thumbnail_url: string | null;
  opponent_thumbnail_url: string | null;
  challenger_votes: number;
  opponent_votes: number;
  winner_id: string | null;
  status: string;
  updated_at: string;
  created_at: string;
}

interface QuickFightFeedRow {
  id: string;
  player_1_id: string;
  player_2_id: string;
  player_1_username: string | null;
  player_2_username: string | null;
  player_1_avatar_url: string | null;
  player_2_avatar_url: string | null;
  player_1_submission_url: string | null;
  player_2_submission_url: string | null;
  player_1_thumbnail_url: string | null;
  player_2_thumbnail_url: string | null;
  player_1_votes: number | null;
  player_2_votes: number | null;
  winner_id: string | null;
  status: string;
  updated_at: string;
  created_at: string;
}

interface QuickFightVoteRow {
  fight_id: string;
  voted_for: string;
}

export default function EditBattlesFeed() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<BattleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({}); // battle_id -> voted_for user_id
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [voting, setVoting] = useState<string | null>(null);
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({}); // submission_url -> thumb
  const [player, setPlayer] = useState<{ url: string; platform: string; battleId: string; username: string } | null>(null);

  const load = useCallback(async () => {
    const cutoffMs = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const since = new Date(cutoffMs).toISOString();
    const { data } = await supabase
      .from("quick_fights")
      .select("id, player_1_id, player_2_id, player_1_username, player_2_username, player_1_avatar_url, player_2_avatar_url, player_1_submission_url, player_2_submission_url, player_1_thumbnail_url, player_2_thumbnail_url, player_1_votes, player_2_votes, winner_id, status, updated_at, created_at, is_private")
      .in("status", ["active", "judging", "completed"])
      .eq("is_private", false)
      .not("player_1_submission_url", "is", null)
      .not("player_2_submission_url", "is", null)
      .not("player_2_id", "is", null)
      .is("hidden_at" as never, null)
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(40);
    const rows = ((data || []) as QuickFightFeedRow[]).filter(r => new Date(r.updated_at || r.created_at).getTime() >= cutoffMs);
    // Prioritize battles with no winner decided yet (live / judging)
    const rank = (r: QuickFightFeedRow) => (r.winner_id ? 1 : 0);
    rows.sort((a, b) => {
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
    const mapped: BattleRow[] = rows.map(r => ({
      id: r.id,
      challenger_id: r.player_1_id,
      opponent_id: r.player_2_id,
      challenger_username: r.player_1_username || 'player 1',
      opponent_username: r.player_2_username || 'player 2',
      challenger_avatar_url: r.player_1_avatar_url,
      opponent_avatar_url: r.player_2_avatar_url,
      challenger_submission_url: r.player_1_submission_url,
      opponent_submission_url: r.player_2_submission_url,
      challenger_submission_platform: 'tiktok',
      opponent_submission_platform: 'tiktok',
      challenger_thumbnail_url: r.player_1_thumbnail_url,
      opponent_thumbnail_url: r.player_2_thumbnail_url,
      challenger_votes: r.player_1_votes || 0,
      opponent_votes: r.player_2_votes || 0,
      winner_id: r.winner_id,
      status: r.status,
      updated_at: r.updated_at,
      created_at: r.created_at,
    }));
    setBattles(mapped);
    // Tally real votes from quick_fight_votes (source of truth across detail + feed)
    if (mapped.length) {
      const ids = mapped.map(m => m.id);
      const { data: voteRows } = await supabase
        .from('quick_fight_votes')
        .select('fight_id, voted_for')
        .in('fight_id', ids);
      const tally: Record<string, { ch: number; op: number }> = {};
      ((voteRows || []) as { fight_id: string; voted_for: string }[]).forEach(v => {
        const b = mapped.find(m => m.id === v.fight_id);
        if (!b) return;
        if (!tally[v.fight_id]) tally[v.fight_id] = { ch: 0, op: 0 };
        if (v.voted_for === b.challenger_id) tally[v.fight_id].ch++;
        else if (v.voted_for === b.opponent_id) tally[v.fight_id].op++;
      });
      setBattles(prev => prev.map(b => tally[b.id] ? { ...b, challenger_votes: tally[b.id].ch, opponent_votes: tally[b.id].op } : b));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('edit_battles_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_votes' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // Resolve thumbnails (Bunny CDN derived instantly; TikTok/IG via edge function)
  useEffect(() => {
    if (!battles.length) return;
    const seeds: Record<string, string> = {};
    const pending: Array<{ submission_url: string; platform: string }> = [];
    battles.forEach(b => {
      [
        { url: b.challenger_submission_url, plat: b.challenger_submission_platform || 'tiktok', stored: b.challenger_thumbnail_url },
        { url: b.opponent_submission_url, plat: b.opponent_submission_platform || 'tiktok', stored: b.opponent_thumbnail_url },
      ].forEach(s => {
        if (!s.url) return;
        if (s.stored) { seeds[s.url] = s.stored; return; }
        const instant = resolveInstantThumbnail(s.url, s.plat);
        if (instant) seeds[s.url] = instant;
        else pending.push({ submission_url: s.url, platform: s.plat });
      });
    });
    setThumbMap(prev => ({ ...prev, ...seeds }));
    if (pending.length) {
      fetchThumbnailsBatch(pending).then(res => {
        const add: Record<string, string> = {};
        Object.entries(res).forEach(([u, t]) => { if (t) add[u] = t; });
        if (Object.keys(add).length) setThumbMap(prev => ({ ...prev, ...add }));
      });
    }
  }, [battles]);

  // Load my votes for the visible battles
  useEffect(() => {
    if (!user || battles.length === 0) return;
    (async () => {
      const ids = battles.map(b => b.id);
      const { data } = await supabase
        .from("quick_fight_votes")
        .select("fight_id, voted_for")
        .eq("user_id", user.id)
        .in("fight_id", ids);
      const map: Record<string, string> = {};
      ((data || []) as QuickFightVoteRow[]).forEach(v => { map[v.fight_id] = v.voted_for; });
      setMyVotes(map);
    })();
  }, [user, battles]);

  // Load comment counts for visible battles
  useEffect(() => {
    if (battles.length === 0) return;
    (async () => {
      const ids = battles.map(b => b.id);
      const { data } = await supabase
        .from("feed_comments")
        .select("submission_id")
        .eq("submission_type", "battle")
        .in("submission_id", ids);
      const counts: Record<string, number> = {};
      ((data || []) as { submission_id: string }[]).forEach(r => {
        counts[r.submission_id] = (counts[r.submission_id] || 0) + 1;
      });
      setCommentCounts(counts);
    })();
  }, [battles]);

  const handleVote = async (battle: BattleRow, votedForId: string) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (myVotes[battle.id]) { toast.info("You already voted on this battle"); return; }
    setVoting(battle.id);
    const { error } = await supabase.from("quick_fight_votes").insert({
      fight_id: battle.id,
      user_id: user.id,
      voted_for: votedForId,
    });
    if (!error) {
      setMyVotes(prev => ({ ...prev, [battle.id]: votedForId }));
      // Optimistic vote bump
      setBattles(prev => prev.map(b => b.id === battle.id
        ? { ...b, challenger_votes: b.challenger_votes + (votedForId === b.challenger_id ? 1 : 0), opponent_votes: b.opponent_votes + (votedForId === b.opponent_id ? 1 : 0) }
        : b));
      toast.success("Vote cast");
    } else {
      toast.error("Couldn't cast vote");
    }
    setVoting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-3">
          <Swords className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-foreground/50 mb-1">No edit battles yet</p>
        <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">Completed battles will show up here for voting</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/10">
        {battles.map(b => {
          const totalVotes = b.challenger_votes + b.opponent_votes;
          const chPct = totalVotes ? Math.round((b.challenger_votes / totalVotes) * 100) : 50;
          const opPct = 100 - chPct;
          const myVote = myVotes[b.id];
          const isCommentsOpen = openComments.has(b.id);
          const showWinner = !!b.winner_id;
          const chWon = b.winner_id === b.challenger_id;
          const opWon = b.winner_id === b.opponent_id;

          return (
            <article key={b.id} className="px-4 py-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70">
                  <Swords className="w-3 h-3" strokeWidth={2.5} />
                  Edit Battle
                  {showWinner && <span className="text-amber-300/90"> · Final</span>}
                </div>
                <span className="text-[10px] text-muted-foreground/50">{formatDistanceToNow(new Date(b.updated_at), { addSuffix: true })}</span>
              </div>

              {/* Side by side */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { side: 'ch' as const, id: b.challenger_id, username: b.challenger_username, avatar: b.challenger_avatar_url, url: b.challenger_submission_url!, platform: b.challenger_submission_platform || 'tiktok', thumb: b.challenger_thumbnail_url, votes: b.challenger_votes, pct: chPct, won: chWon },
                  { side: 'op' as const, id: b.opponent_id, username: b.opponent_username, avatar: b.opponent_avatar_url, url: b.opponent_submission_url!, platform: b.opponent_submission_platform || 'tiktok', thumb: b.opponent_thumbnail_url, votes: b.opponent_votes, pct: opPct, won: opWon },
                ].map(s => {
                  const isVotedSide = myVote === s.id;
                  const resolvedThumb = s.thumb || thumbMap[s.url] || null;
                  const isChallenger = s.side === 'ch';
                  const sideAccent = isChallenger
                    ? { border: 'border-sky-500/60', ring: 'ring-sky-500/40', text: 'text-sky-300', bg: 'bg-sky-500', label: 'BLUE' }
                    : { border: 'border-red-500/60', ring: 'ring-red-500/40', text: 'text-red-300', bg: 'bg-red-500', label: 'RED' };
                  return (
                    <div key={s.side} className={`relative overflow-hidden border ${isVotedSide ? `${sideAccent.border} ring-1 ${sideAccent.ring}` : 'border-white/10'} bg-black`}>
                      {/* Top corner side tag */}
                      <div className={`absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 ${sideAccent.bg} text-white text-[9px] font-black tracking-[0.18em]`}>
                        {sideAccent.label}
                      </div>
                      {/* Thumbnail / video preview */}
                      <button
                        onClick={() => setPlayer({ url: s.url, platform: s.platform, battleId: b.id, username: s.username })}
                        className="relative block w-full aspect-square bg-zinc-900"
                      >
                        {resolvedThumb ? (
                          <img src={resolvedThumb} alt={s.username} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-[10px]">Tap to play</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        {s.won && (
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5" /> Winner
                          </div>
                        )}
                        {/* Bottom name */}
                        <div className="absolute bottom-0 inset-x-0 p-1.5 flex items-center gap-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={s.avatar || ''} />
                            <AvatarFallback className="text-[9px]">{s.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <SmartUsername userId={s.id} username={s.username} className={`text-[11px] font-bold truncate ${sideAccent.text}`} />
                        </div>
                      </button>

                      {/* Vote button */}
                      <button
                        disabled={!!myVote || voting === b.id}
                        onClick={() => handleVote(b, s.id)}
                        className={`w-full px-2 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                          isVotedSide
                            ? `${sideAccent.bg} text-white`
                            : myVote
                              ? 'bg-white/[0.04] text-muted-foreground/60 cursor-not-allowed'
                              : `bg-white/[0.04] text-foreground hover:${sideAccent.bg.replace('bg-', 'bg-')}/30`
                        }`}
                      >
                        {isVotedSide ? `Voted · ${s.votes}` : myVote ? `${s.votes} ${s.votes === 1 ? 'vote' : 'votes'}` : 'Vote'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Vote bar */}
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-white/[0.04]">
                  <motion.div animate={{ width: `${chPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full bg-sky-500" />
                  <motion.div animate={{ width: `${opPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full bg-red-500" />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
                  <span className="text-sky-300">{b.challenger_votes} · {chPct}%</span>
                  <span className="uppercase tracking-wider">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                  <span className="text-red-300">{opPct}% · {b.opponent_votes}</span>
                </div>
              </div>

              {/* Comments toggle */}
              <button
                onClick={() => setOpenComments(prev => {
                  const next = new Set(prev);
                  if (next.has(b.id)) next.delete(b.id); else next.add(b.id);
                  return next;
                })}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {isCommentsOpen
                  ? `Hide comments${commentCounts[b.id] ? ` (${commentCounts[b.id]})` : ''}`
                  : `Comments${commentCounts[b.id] ? ` · ${commentCounts[b.id]}` : ''}`}
              </button>

              {isCommentsOpen && (
                <div className="mt-3 border-t border-border/10 pt-3">
                  <FeedInlineComments submissionId={b.id} submissionType="battle" />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {player && (
        <FeedVideoPlayer
          isOpen={true}
          onClose={() => setPlayer(null)}
          submissionUrl={player.url}
          platform={player.platform}
          submissionId={player.battleId}
          submissionType="battle"
          username={player.username}
        />
      )}
    </>
  );
}