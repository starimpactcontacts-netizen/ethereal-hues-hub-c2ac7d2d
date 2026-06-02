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

/** Circle / O symbol (RED corner) */
function OSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ padding: '24%' }}>
      <circle cx="50" cy="50" r="35" fill="none"
        stroke="rgba(255,255,255,0.88)" strokeWidth="12" />
    </svg>
  );
}

/** Cross / X symbol (BLUE corner) */
function XSymbol() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ padding: '24%' }}>
      <line x1="18" y1="18" x2="82" y2="82" stroke="rgba(255,255,255,0.88)" strokeWidth="12" strokeLinecap="round" />
      <line x1="82" y1="18" x2="18" y2="82" stroke="rgba(255,255,255,0.88)" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

function PsButton({
  side,
  voted,
  leading,
  isOfficial,
  disabled,
  onClick,
}: {
  side: 'red' | 'blue';
  voted: boolean;
  leading: boolean;
  isOfficial: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isRed = side === 'red';

  const resting = isRed
    ? 'radial-gradient(circle at 38% 28%, #ff5555 0%, #cc1010 50%, #7a0000 100%)'
    : 'radial-gradient(circle at 38% 28%, #5588ff 0%, #1140dd 50%, #001080 100%)';

  const ringColor = isRed ? 'rgba(255,80,80,0.9)' : 'rgba(70,120,255,0.9)';
  const glowColor = isRed ? 'rgba(255,40,40,0.7)' : 'rgba(40,90,255,0.7)';
  const dimRing   = isRed ? 'rgba(180,30,30,0.35)' : 'rgba(30,60,200,0.35)';

  const shadow = voted
    ? `0 0 0 3.5px ${ringColor}, 0 0 40px ${glowColor}, inset 0 -6px 18px rgba(0,0,0,0.65)`
    : leading
    ? `0 0 0 2px ${dimRing}, 0 0 22px ${isRed ? 'rgba(255,40,40,0.3)' : 'rgba(40,90,255,0.3)'}, inset 0 -6px 18px rgba(0,0,0,0.65)`
    : `0 0 0 1px rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.7), inset 0 -6px 18px rgba(0,0,0,0.65)`;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.90, transition: { duration: 0.08 } }}
      animate={voted ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-[116px] h-[116px] rounded-full shrink-0"
      style={{ background: resting, boxShadow: shadow }}
    >
      {/* Specular highlight — top-left glare */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 36% 22%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 42%, transparent 65%)',
        }} />
        {/* Rim highlight */}
        <div className="absolute inset-0 rounded-full" style={{
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.18)',
        }} />
      </div>

      {/* Symbol */}
      {isRed ? <OSymbol /> : <XSymbol />}

      {/* Official win crown */}
      {isOfficial && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        </div>
      )}
    </motion.button>
  );
}

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
  const redPct  = total === 0 ? 50 : Math.round((redCount  / total) * 100);
  const bluePct = total === 0 ? 50 : 100 - redPct;
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
      let r = 0, b = 0, mine: string | null = null;
      for (const v of data) {
        if (v.voted_for === player1Id) r++;
        else if (v.voted_for === player2Id) b++;
        if (user?.id && v.user_id === user.id) mine = v.voted_for;
      }
      setRedCount(r); setBlueCount(b); setMyVote(mine);
    };
    fetchVotes();
    const ch = supabase
      .channel(`qf_votes_${fightId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'quick_fight_votes', filter: `fight_id=eq.${fightId}`,
      }, fetchVotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, player1Id, player2Id, user?.id]);

  const castVote = async (votedFor: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    if (isParticipant) { toast.error("You can't vote in your own battle"); return; }
    if (locked || myVote || voting) return;
    setVoting(true);
    const { error } = await supabase.from('quick_fight_votes').insert({
      fight_id: fightId, user_id: user.id, voted_for: votedFor,
    });
    if (error) toast.error('Could not record vote');
    else { setMyVote(votedFor); toast.success('Vote locked 🗳️'); }
    setVoting(false);
  };

  const disabled = !!myVote || !!locked || isParticipant || !user || voting;

  const ctaText = !user
    ? 'SIGN IN TO VOTE'
    : isParticipant
    ? "PLAYERS CAN'T VOTE"
    : myVote ? '✓ VOTE LOCKED IN'
    : locked  ? 'VOTING CLOSED'
    : 'TAP TO VOTE';

  return (
    <div className="relative bg-black border border-white/10 overflow-hidden">

      {/* Header */}
      <div className="px-3 py-1.5 border-b border-white/10 bg-white/[0.025] flex items-center justify-between">
        <span className="text-[14px] text-white/90 tracking-[0.22em]" style={{ ...TEKO, fontWeight: 600 }}>
          WHO WON?
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[12px] text-zinc-400 tracking-[0.16em] tabular-nums" style={{ ...TEKO, fontWeight: 400 }}>
            {total} {total === 1 ? 'VOTE' : 'VOTES'}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-5 py-6 px-4">

        {/* RED — O button */}
        <div className="flex flex-col items-center gap-2.5">
          <PsButton
            side="red"
            voted={myVote === player1Id}
            leading={leadingSide === 'red'}
            isOfficial={officialWinnerId === player1Id}
            disabled={disabled}
            onClick={() => castVote(player1Id)}
          />
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-red-500/70 leading-none mb-0.5" style={TEKO}>
              RED
            </p>
            <p className="text-[17px] font-black text-white truncate max-w-[110px] leading-tight" style={TEKO}>
              @{player1Username}
            </p>
            {total > 0 && (
              <p className="text-[26px] font-black text-red-400 leading-none tabular-nums" style={TEKO}>
                {redPct}<span className="text-[13px] text-white/35">%</span>
              </p>
            )}
            <p className="text-[9px] text-zinc-600 tabular-nums tracking-wider" style={TEKO}>
              {redCount} {redCount === 1 ? 'VOTE' : 'VOTES'}
            </p>
          </div>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center gap-1 shrink-0 -mt-10">
          <div className="w-9 h-9 rounded-full bg-[#0d0d0d] border border-white/[0.08] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <span className="text-[14px] text-white/30 font-black tracking-wide" style={TEKO}>VS</span>
          </div>
        </div>

        {/* BLUE — X button */}
        <div className="flex flex-col items-center gap-2.5">
          <PsButton
            side="blue"
            voted={myVote === player2Id}
            leading={leadingSide === 'blue'}
            isOfficial={officialWinnerId === player2Id}
            disabled={disabled}
            onClick={() => castVote(player2Id)}
          />
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-blue-500/70 leading-none mb-0.5" style={TEKO}>
              BLUE
            </p>
            <p className="text-[17px] font-black text-white truncate max-w-[110px] leading-tight" style={TEKO}>
              @{player2Username}
            </p>
            {total > 0 && (
              <p className="text-[26px] font-black text-blue-400 leading-none tabular-nums" style={TEKO}>
                {bluePct}<span className="text-[13px] text-white/35">%</span>
              </p>
            )}
            <p className="text-[9px] text-zinc-600 tabular-nums tracking-wider" style={TEKO}>
              {blueCount} {blueCount === 1 ? 'VOTE' : 'VOTES'}
            </p>
          </div>
        </div>
      </div>

      {/* CTA bar */}
      <div className={`px-3 py-1.5 border-t border-white/10 text-center ${myVote ? 'bg-emerald-500/10' : 'bg-white/[0.015]'}`}>
        <p className={`text-[12px] tracking-[0.24em] ${myVote ? 'text-emerald-400' : 'text-zinc-500'}`}
          style={{ ...TEKO, fontWeight: 500 }}>
          {ctaText}
        </p>
      </div>
    </div>
  );
}
