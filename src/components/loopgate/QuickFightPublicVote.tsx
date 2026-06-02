import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import vsBadge from '@/assets/vs-badge.png.asset.json';

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

/** Red physical arcade button — O symbol */
function RedButton({ pressed, voted }: { pressed: boolean; voted: boolean }) {
  return (
    <motion.div
      animate={{ y: voted ? 5 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative w-[90px] h-[90px] rounded-full"
      style={{
        /* convex face gradient */
        background: 'radial-gradient(ellipse at 40% 34%, #ff6a6a 0%, #e01515 38%, #9e0000 72%, #680000 100%)',
        /* bottom edge = disc thickness */
        boxShadow: voted
          ? `0 2px 0 #3a0000, 0 4px 22px rgba(200,0,0,0.55), 0 0 40px rgba(220,20,20,0.35), inset 0 1px 4px rgba(255,180,180,0.18)`
          : `0 7px 0 #3a0000, 0 10px 32px rgba(0,0,0,0.75), inset 0 1px 4px rgba(255,180,180,0.18)`,
      }}
    >
      {/* Inner recessed face ring */}
      <div className="absolute inset-[9px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 42% 36%, #e81a1a 0%, #c00000 45%, #8a0000 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.55), inset 0 -1px 3px rgba(255,100,100,0.12)',
        }}
      />
      {/* O symbol */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 118 118" style={{ padding: 26 }}>
        <circle cx="59" cy="59" r="24" fill="none"
          stroke="rgba(255,255,255,0.88)" strokeWidth="7" />
      </svg>
      {/* Specular glare top-left */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '6%', left: '12%',
          width: '46%', height: '32%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.28) 0%, transparent 70%)',
          borderRadius: '50%', transform: 'rotate(-20deg)',
        }} />
      </div>
    </motion.div>
  );
}

/** Blue physical arcade button — X symbol */
function BlueButton({ pressed, voted }: { pressed: boolean; voted: boolean }) {
  return (
    <motion.div
      animate={{ y: voted ? 5 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="relative w-[90px] h-[90px] rounded-full"
      style={{
        background: 'radial-gradient(ellipse at 40% 34%, #6699ff 0%, #1a48e8 38%, #0a28a0 72%, #051878 100%)',
        boxShadow: voted
          ? `0 2px 0 #020d44, 0 4px 22px rgba(30,80,220,0.55), 0 0 40px rgba(30,80,220,0.35), inset 0 1px 4px rgba(160,190,255,0.18)`
          : `0 7px 0 #020d44, 0 10px 32px rgba(0,0,0,0.75), inset 0 1px 4px rgba(160,190,255,0.18)`,
      }}
    >
      {/* Inner recessed face ring */}
      <div className="absolute inset-[9px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 42% 36%, #2255ee 0%, #1238c0 45%, #081888 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.55), inset 0 -1px 3px rgba(100,150,255,0.12)',
        }}
      />
      {/* X symbol */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 118 118" style={{ padding: 30 }}>
        <line x1="35" y1="35" x2="83" y2="83" stroke="rgba(255,255,255,0.88)" strokeWidth="7" strokeLinecap="round" />
        <line x1="83" y1="35" x2="35" y2="83" stroke="rgba(255,255,255,0.88)" strokeWidth="7" strokeLinecap="round" />
      </svg>
      {/* Specular glare */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '6%', left: '12%',
          width: '46%', height: '32%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.24) 0%, transparent 70%)',
          borderRadius: '50%', transform: 'rotate(-20deg)',
        }} />
      </div>
    </motion.div>
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
  const [tapping, setTapping]     = useState<'red' | 'blue' | null>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_votes', filter: `fight_id=eq.${fightId}` }, fetchVotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, player1Id, player2Id, user?.id]);

  const castVote = async (side: 'red' | 'blue', votedFor: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    if (isParticipant) { toast.error("Can't vote in your own battle"); return; }
    if (locked || myVote || voting) return;
    setTapping(side);
    setTimeout(() => setTapping(null), 300);
    setVoting(true);
    const { error } = await supabase.from('quick_fight_votes').insert({
      fight_id: fightId, user_id: user.id, voted_for: votedFor,
    });
    if (error) toast.error('Vote failed');
    else { setMyVote(votedFor); toast.success('🗳️ Vote locked'); }
    setVoting(false);
  };

  const disabled = !!myVote || !!locked || isParticipant || !user || voting;

  const ctaText = !user ? 'SIGN IN TO VOTE'
    : isParticipant    ? "PLAYERS CAN'T VOTE"
    : myVote           ? '✓  VOTE LOCKED IN'
    : locked           ? 'VOTING CLOSED'
    : 'PRESS  ○  OR  ✕  TO VOTE';

  return (
    <div className="overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8">
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

      {/* Buttons area */}
      <div className="flex items-center justify-center gap-8 py-5">
        {/* RED — O */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={() => castVote('red', player1Id)}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.93 }}
            className="relative focus:outline-none"
            style={{ filter: myVote === player1Id ? 'drop-shadow(0 0 18px rgba(220,30,30,0.7))' : myVote && myVote !== player1Id ? 'brightness(0.55)' : 'none' }}
          >
            <RedButton pressed={tapping === 'red'} voted={myVote === player1Id} />
            {officialWinnerId === player1Id && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </div>
            )}
          </motion.button>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-red-500/60 leading-none mb-0.5" style={TEKO}>RED</p>
            <p className="text-[18px] font-black text-white leading-tight truncate max-w-[120px]" style={TEKO}>
              @{player1Username}
            </p>
            {total > 0 && (
              <p className="text-[30px] font-black text-red-400 leading-none tabular-nums" style={TEKO}>
                {redPct}<span className="text-[13px] text-white/30">%</span>
              </p>
            )}
            <p className="text-[9px] text-zinc-600 tracking-wider tabular-nums" style={TEKO}>
              {redCount} {redCount === 1 ? 'VOTE' : 'VOTES'}
            </p>
          </div>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 -mt-10 shrink-0">
          <img src={vsBadge.url} alt="VS" className="w-14 h-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
        </div>

        {/* BLUE — X */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            onClick={() => castVote('blue', player2Id)}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.93 }}
            className="relative focus:outline-none"
            style={{ filter: myVote === player2Id ? 'drop-shadow(0 0 18px rgba(30,80,220,0.7))' : myVote && myVote !== player2Id ? 'brightness(0.55)' : 'none' }}
          >
            <BlueButton pressed={tapping === 'blue'} voted={myVote === player2Id} />
            {officialWinnerId === player2Id && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              </div>
            )}
          </motion.button>
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-blue-500/60 leading-none mb-0.5" style={TEKO}>BLUE</p>
            <p className="text-[18px] font-black text-white leading-tight truncate max-w-[120px]" style={TEKO}>
              @{player2Username}
            </p>
            {total > 0 && (
              <p className="text-[30px] font-black text-blue-400 leading-none tabular-nums" style={TEKO}>
                {bluePct}<span className="text-[13px] text-white/30">%</span>
              </p>
            )}
            <p className="text-[9px] text-zinc-600 tracking-wider tabular-nums" style={TEKO}>
              {blueCount} {blueCount === 1 ? 'VOTE' : 'VOTES'}
            </p>
          </div>
        </div>
      </div>

      {/* Split bar */}
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
      <div className={`flex items-center justify-center h-7 ${myVote ? 'bg-emerald-500/[0.07]' : ''}`}>
        <p className={`text-[10px] tracking-[0.24em] ${myVote ? 'text-emerald-400' : 'text-zinc-600'}`}
          style={{ ...TEKO, fontWeight: 600 }}>
          {ctaText}
        </p>
      </div>
    </div>
  );
}
