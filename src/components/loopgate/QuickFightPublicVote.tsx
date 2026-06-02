import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const TEKO = { fontFamily: 'Teko, sans-serif' };

interface Props {
  fightId: string;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
  locked?: boolean;
  officialWinnerId?: string | null;
}

function OIcon({ active }: { active: boolean }) {
  const c = active ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.6)';
  return (
    <svg viewBox="0 0 44 44" className="w-full h-full">
      <circle cx="22" cy="22" r="14" fill="none" stroke={c} strokeWidth="3.5" />
    </svg>
  );
}

function XIcon({ active }: { active: boolean }) {
  const c = active ? 'rgba(96,165,250,1)' : 'rgba(96,165,250,0.6)';
  return (
    <svg viewBox="0 0 44 44" className="w-full h-full">
      <line x1="11" y1="11" x2="33" y2="33" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="33" y1="11" x2="11" y2="33" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

interface PanelProps {
  side: 'red' | 'blue';
  pid: string;
  username: string;
  count: number;
  pct: number;
  total: number;
  voted: boolean;
  leading: boolean;
  isOfficial: boolean;
  disabled: boolean;
  onVote: () => void;
}

function VotePanel({ side, username, count, pct, total, voted, leading, isOfficial, disabled, onVote }: PanelProps) {
  const isRed = side === 'red';
  const accent = isRed ? '#ef4444' : '#3b82f6';
  const glowRgb = isRed ? '239,68,68' : '59,130,246';
  const textColor = isRed ? 'text-red-400' : 'text-blue-400';

  return (
    <motion.button
      onClick={onVote}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`relative flex-1 flex flex-col items-center gap-1.5 pt-4 pb-3 overflow-hidden transition-all duration-300 ${
        disabled && !voted ? 'opacity-80' : ''
      }`}
      style={{
        background: voted
          ? `linear-gradient(180deg, rgba(${glowRgb},0.16) 0%, rgba(${glowRgb},0.04) 50%, #050505 100%)`
          : leading
          ? `linear-gradient(180deg, rgba(${glowRgb},0.10) 0%, #050505 100%)`
          : `linear-gradient(180deg, rgba(${glowRgb},0.05) 0%, #050505 100%)`,
        boxShadow: voted
          ? `inset 0 0 0 1.5px rgba(${glowRgb},0.55), inset 0 0 24px rgba(${glowRgb},0.08)`
          : leading
          ? `inset 0 0 0 1px rgba(${glowRgb},0.22)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Fill bar from bottom */}
      {total > 0 && (
        <motion.div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          initial={{ height: 0 }}
          animate={{ height: `${pct * 0.35}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: `linear-gradient(to top, rgba(${glowRgb},0.20), transparent)` }}
        />
      )}

      {/* Symbol */}
      <div className="relative w-10 h-10 shrink-0">
        {isRed ? <OIcon active={voted || leading} /> : <XIcon active={voted || leading} />}
        {voted && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.4, 1.8] }}
            transition={{ duration: 0.5 }}
            style={{ background: `radial-gradient(circle, rgba(${glowRgb},0.4), transparent 70%)` }}
          />
        )}
      </div>

      {/* Corner label */}
      <span
        className={`text-[8px] font-black uppercase tracking-[0.35em] ${textColor} opacity-70 leading-none`}
        style={TEKO}
      >
        {side}
      </span>

      {/* Username */}
      <p
        className="text-[19px] font-black text-white leading-none truncate px-2 max-w-full"
        style={{ ...TEKO, letterSpacing: '0.03em' }}
      >
        @{username}
      </p>

      {/* Percentage */}
      <div className="leading-none">
        {total > 0 ? (
          <motion.p
            className={`text-[36px] font-black leading-none tabular-nums ${textColor}`}
            style={TEKO}
            key={pct}
            initial={{ opacity: 0.6, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {pct}<span className="text-[15px] text-white/30">%</span>
          </motion.p>
        ) : (
          <p className="text-[22px] font-black text-white/15 leading-none" style={TEKO}>
            —%
          </p>
        )}
      </div>

      {/* Vote count */}
      <p className="text-[9px] text-zinc-600 tabular-nums tracking-[0.2em]" style={TEKO}>
        {count} {count === 1 ? 'VOTE' : 'VOTES'}
      </p>

      {/* Official winner trophy */}
      {isOfficial && (
        <div className="flex items-center gap-1 mt-0.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider" style={TEKO}>
            Winner
          </span>
        </div>
      )}
    </motion.button>
  );
}

export default function QuickFightPublicVote({
  fightId, player1Id, player2Id, player1Username, player2Username, locked, officialWinnerId,
}: Props) {
  const { user } = useAuth();
  const [redCount, setRedCount]   = useState(0);
  const [blueCount, setBlueCount] = useState(0);
  const [myVote, setMyVote]       = useState<string | null>(null);
  const [voting, setVoting]       = useState(false);

  const isParticipant = !!user && (user.id === player1Id || user.id === player2Id);
  const total   = redCount + blueCount;
  const redPct  = total === 0 ? 0 : Math.round((redCount  / total) * 100);
  const bluePct = total === 0 ? 0 : 100 - redPct;
  const leadingSide: 'red' | 'blue' | null =
    total === 0 ? null : redCount === blueCount ? null : redCount > blueCount ? 'red' : 'blue';

  useEffect(() => {
    if (!fightId) return;
    const fetchVotes = async () => {
      const { data } = await supabase
        .from('quick_fight_votes').select('voted_for, user_id').eq('fight_id', fightId);
      if (!data) return;
      let r = 0, b = 0, mine: string | null = null;
      for (const v of data) {
        if (v.voted_for === player1Id) r++;
        else if (v.voted_for === player2Id) b++;
        if (user?.id && v.user_id === user.id) mine = v.voted_for;
      }
      setRedCount(r); setBlueCount(b); setMyVote(mine);
    };
    fetchVotes();
    const ch = supabase.channel(`qf_votes_${fightId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'quick_fight_votes', filter: `fight_id=eq.${fightId}`,
      }, fetchVotes).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, player1Id, player2Id, user?.id]);

  const castVote = async (votedFor: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    if (isParticipant) { toast.error("Can't vote in your own battle"); return; }
    if (locked || myVote || voting) return;
    setVoting(true);
    const { error } = await supabase.from('quick_fight_votes').insert({
      fight_id: fightId, user_id: user.id, voted_for: votedFor,
    });
    if (error) toast.error('Vote failed');
    else { setMyVote(votedFor); toast.success('Vote locked 🗳️'); }
    setVoting(false);
  };

  const disabled = !!myVote || !!locked || isParticipant || !user || voting;

  const ctaText = !user ? 'SIGN IN TO VOTE'
    : isParticipant    ? "PLAYERS CAN'T VOTE"
    : myVote           ? '✓  VOTE LOCKED IN'
    : locked           ? 'VOTING CLOSED'
    : 'TAP A SIDE  ·  O  OR  X';

  return (
    <div className="bg-[#060606] border border-white/[0.08] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-white/[0.06]">
        <span className="text-[12px] font-black uppercase tracking-[0.28em] text-white/70" style={TEKO}>
          Who Won?
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-zinc-500 tabular-nums tracking-[0.16em]" style={TEKO}>
            {total} {total === 1 ? 'VOTE' : 'VOTES'}
          </span>
        </div>
      </div>

      {/* Vote panels */}
      <div className="flex items-stretch" style={{ minHeight: 168 }}>
        <VotePanel
          side="red" pid={player1Id} username={player1Username}
          count={redCount} pct={redPct} total={total}
          voted={myVote === player1Id} leading={leadingSide === 'red'}
          isOfficial={officialWinnerId === player1Id}
          disabled={disabled} onVote={() => castVote(player1Id)}
        />

        {/* Center divider */}
        <div className="flex flex-col items-center justify-center shrink-0 relative"
          style={{ width: 1, background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="absolute px-1.5 py-1 bg-[#0a0a0a] border border-white/[0.08]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
          >
            <span className="text-[11px] font-black text-white/25 tracking-[0.18em]" style={TEKO}>
              VS
            </span>
          </div>
        </div>

        <VotePanel
          side="blue" pid={player2Id} username={player2Username}
          count={blueCount} pct={bluePct} total={total}
          voted={myVote === player2Id} leading={leadingSide === 'blue'}
          isOfficial={officialWinnerId === player2Id}
          disabled={disabled} onVote={() => castVote(player2Id)}
        />
      </div>

      {/* Vote split bar */}
      {total > 0 && (
        <div className="flex h-[2px]">
          <motion.div
            style={{ background: 'linear-gradient(90deg,#c01010,#ef4444)' }}
            animate={{ width: `${redPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          <div className="flex-1" style={{ background: 'linear-gradient(90deg,#3b82f6,#1040c0)' }} />
        </div>
      )}

      {/* CTA */}
      <div className={`flex items-center justify-center h-7 border-t border-white/[0.06] ${
        myVote ? 'bg-emerald-500/[0.08]' : ''
      }`}>
        <p
          className={`text-[10px] tracking-[0.28em] ${myVote ? 'text-emerald-400' : 'text-zinc-600'}`}
          style={{ ...TEKO, fontWeight: 600 }}
        >
          {ctaText}
        </p>
      </div>
    </div>
  );
}
