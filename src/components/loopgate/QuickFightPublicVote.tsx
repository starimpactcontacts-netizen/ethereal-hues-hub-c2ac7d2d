import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Vote, Check } from 'lucide-react';
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

const teko = { fontFamily: 'Teko, sans-serif' };

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
    const accent = side === 'red' ? 'red' : 'blue';
    const baseBg = side === 'red' ? 'bg-red-500/5' : 'bg-blue-500/5';
    const fillBg = side === 'red' ? 'bg-red-500/25' : 'bg-blue-500/25';
    const borderCls = isMine
      ? side === 'red' ? 'border-red-500' : 'border-blue-500'
      : 'border-white/10';
    const textAccent = side === 'red' ? 'text-red-400' : 'text-blue-400';
    const disabled = !!myVote || locked || isParticipant || !user || voting;

    return (
      <button
        onClick={() => castVote(pid)}
        disabled={disabled}
        className={`relative flex-1 overflow-hidden border ${borderCls} ${baseBg} active:scale-[0.99] transition disabled:cursor-default`}
      >
        {/* Fill bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 ${fillBg}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="relative px-3 py-3 flex items-center justify-between gap-2">
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${textAccent}`} style={teko}>
                EDITOR {accent.toUpperCase()}
              </span>
              {isOfficial && (
                <span className="text-[8px] font-black uppercase tracking-wider text-amber-400">★ JUDGED</span>
              )}
            </div>
            <p className="text-[13px] font-bold text-white truncate">@{username}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isMine && <Check className={`w-3.5 h-3.5 ${textAccent}`} />}
            <div className="text-right">
              <p className="text-base font-black text-white tabular-nums leading-none" style={teko}>
                {pct}%
              </p>
              <p className="text-[9px] text-muted-foreground tabular-nums">{count}</p>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="bg-surface-1 border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Vote className="w-3.5 h-3.5 text-foreground" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Which edit won?
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          {total} {total === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="p-3 space-y-2">
        <Side side="red" pid={player1Id} username={player1Username} count={redCount} pct={redPct} />
        <Side side="blue" pid={player2Id} username={player2Username} count={blueCount} pct={bluePct} />

        <p className="text-[9px] text-center text-muted-foreground uppercase tracking-[0.2em] pt-1" style={teko}>
          {!user
            ? 'Sign in to cast your vote'
            : isParticipant
            ? 'Players cannot vote on their own battle'
            : myVote
            ? 'Your vote is locked in'
            : locked
            ? 'Voting closed'
            : 'Tap a side to vote'}
        </p>
      </div>
    </div>
  );
}