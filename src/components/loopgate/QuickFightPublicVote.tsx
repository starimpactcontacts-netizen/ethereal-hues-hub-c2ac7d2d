import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  fightId: string;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
  /** Locks voting (e.g. once judge decides). */
  locked?: boolean;
  /** Official winner_id (judged), to mark the official side. */
  officialWinnerId?: string | null;
}

// Clean modern sans — no Teko condensed display font on this card.

/**
 * Public spectator vote — "Which edit won?"
 * Reuses the existing `quick_fight_votes` table.
 * Participants and judges cannot vote on their own fight.
 */
export default function QuickFightPublicVote({
  fightId,
  player1Id,
  player2Id,
  player1Username,
  player2Username,
  locked,
  officialWinnerId,
}: Props) {
  const { user } = useAuth();
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const isParticipant = !!user && (user.id === player1Id || user.id === player2Id);
  const total = redCount + blueCount;
  const redPct = total === 0 ? 0 : Math.round((redCount / total) * 100);
  const bluePct = total === 0 ? 0 : 100 - redPct;
  const leadingSide: 'red' | 'blue' | null =
    total === 0 ? null : redCount === blueCount ? null : redCount > blueCount ? 'red' : 'blue';

  useEffect(() => {
    if (!fightId) return;

    const fetchVotes = async () => {
      const { data } = await supabase
        .from('quick_fight_votes')
        .select('voted_for, user_id')
        .eq('fight_id', fightId);
      if (!data) return;
      let r = 0, b = 0;
      let mine: string | null = null;
      for (const v of data) {
        if (v.voted_for === player1Id) r++;
        else if (v.voted_for === player2Id) b++;
        if (user?.id && v.user_id === user.id) mine = v.voted_for;
      }
      setRedCount(r);
      setBlueCount(b);
      setMyVote(mine);
    };
    fetchVotes();

    const channel = supabase
      .channel(`qf_votes_${fightId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_fight_votes', filter: `fight_id=eq.${fightId}` },
        () => fetchVotes(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fightId, player1Id, player2Id, user?.id]);

  const castVote = async (votedFor: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    if (isParticipant) { toast.error("You can't vote in your own battle"); return; }
    if (locked || myVote || voting) return;
    setVoting(true);
    const { error } = await supabase.from('quick_fight_votes').insert({
      fight_id: fightId,
      user_id: user.id,
      voted_for: votedFor,
    });
    if (error) toast.error('Could not record vote');
    else {
      setMyVote(votedFor);
      toast.success('Vote in 🗳️');
    }
    setVoting(false);
  };

  const disabled = !!myVote || !!locked || isParticipant || !user || voting;

  const Side = ({
    side,
    pid,
    username,
    count,
    pct,
  }: {
    side: 'red' | 'blue';
    pid: string;
    username: string;
    count: number;
    pct: number;
  }) => {
    const isMine = myVote === pid;
    const isOfficial = officialWinnerId === pid;
    const isLeading = leadingSide === side;
    const isRed = side === 'red';

    return (
      <motion.button
        onClick={() => castVote(pid)}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        className={`relative flex-1 overflow-hidden border-2 transition-all duration-300 ${
          isMine
            ? isRed ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
            : isOfficial
            ? 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.4)]'
            : isLeading
            ? isRed ? 'border-red-500/60' : 'border-blue-500/60'
            : 'border-white/10'
        } ${disabled && !isMine && !isOfficial ? 'opacity-80' : ''} disabled:cursor-default`}
        style={{
          background: isRed
            ? `linear-gradient(135deg, rgba(239,68,68,${isLeading ? 0.18 : 0.08}) 0%, rgba(0,0,0,0.95) 100%)`
            : `linear-gradient(135deg, rgba(59,130,246,${isLeading ? 0.18 : 0.08}) 0%, rgba(0,0,0,0.95) 100%)`,
        }}
      >
        {/* Animated fill bar from bottom */}
        <motion.div
          className={`absolute inset-x-0 bottom-0 ${isRed ? 'bg-gradient-to-t from-red-500/40 to-red-500/10' : 'bg-gradient-to-t from-blue-500/40 to-blue-500/10'}`}
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* Pulsing glow when leading */}
        {isLeading && !isOfficial && (
          <motion.div
            className={`absolute inset-0 pointer-events-none ${isRed ? 'bg-red-500/5' : 'bg-blue-500/5'}`}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="relative px-3 py-4 flex flex-col items-center justify-center gap-1.5 min-h-[124px]">
          {/* Top tag row */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[10px] font-semibold tracking-[0.18em] ${isRed ? 'text-red-400/90' : 'text-blue-400/90'}`}>
              {side.toUpperCase()}
            </span>
            {isOfficial && (
              <span className="text-[9px] font-semibold tracking-wider text-amber-400 flex items-center gap-0.5">
                <Trophy className="w-2.5 h-2.5" /> WINNER
              </span>
            )}
          </div>

          {/* Percentage — modern sans, not condensed */}
          <p
            className="text-[44px] font-semibold text-white tabular-nums leading-none tracking-tight"
            style={{ textShadow: isRed ? '0 0 24px rgba(239,68,68,0.35)' : '0 0 24px rgba(59,130,246,0.35)' }}
          >
            {pct}<span className="text-[22px] text-white/50 font-medium">%</span>
          </p>

          {/* Username */}
          <p className="text-[13px] font-medium text-white/95 truncate max-w-full px-2">@{username}</p>

          {/* Vote count */}
          <p className="text-[10px] text-zinc-500 tabular-nums tracking-wide">
            {count} {count === 1 ? 'vote' : 'votes'}
          </p>

          {/* Mine indicator */}
          {isMine && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full ${isRed ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center`}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  };

  const ctaText = !user
    ? 'SIGN IN TO VOTE'
    : isParticipant
    ? "PLAYERS CAN'T VOTE"
    : myVote
    ? '✓ VOTE LOCKED IN'
    : locked
    ? 'VOTING CLOSED'
    : 'TAP A SIDE TO VOTE';

  return (
    <div className="relative bg-black border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="relative px-3.5 py-2.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-white/70" strokeWidth={2.2} />
          <span className="text-[12px] font-semibold text-white/95 tracking-[0.12em]">
            WHO WON?
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[10px] text-zinc-400 tracking-wide tabular-nums">
            {total} {total === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      {/* Duel */}
      <div className="relative p-3">
        <div className="flex gap-2 items-stretch">
          <Side side="red" pid={player1Id} username={player1Username} count={redCount} pct={redPct} />
          <Side side="blue" pid={player2Id} username={player2Username} count={blueCount} pct={bluePct} />
        </div>

        {/* Center VS chip overlapping the two sides */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="w-9 h-9 rounded-full bg-black border border-white/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <span className="text-[10px] font-semibold text-white/90 tracking-[0.1em]">VS</span>
          </div>
        </div>
      </div>

      {/* CTA bar */}
      <div className={`px-3 py-2.5 border-t border-white/10 text-center ${myVote ? 'bg-emerald-500/10' : 'bg-white/[0.015]'}`}>
        <p className={`text-[11px] font-medium tracking-[0.14em] ${myVote ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {ctaText}
        </p>
      </div>
    </div>
  );
}