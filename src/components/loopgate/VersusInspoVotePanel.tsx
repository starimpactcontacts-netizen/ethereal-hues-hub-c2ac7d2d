import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { VersusInspoBattle } from '@/hooks/useVersusInspo';

const TEKO = { fontFamily: 'Teko, sans-serif' };

interface Props {
  battle: VersusInspoBattle;
  myVote: 'creator' | 'inspo' | null;
  isOwner: boolean;
  onVote: (side: 'creator' | 'inspo') => Promise<{ ok: boolean; error?: string }>;
}

export default function VersusInspoVotePanel({ battle, myVote, isOwner, onVote }: Props) {
  const [busy, setBusy] = useState<'creator' | 'inspo' | null>(null);
  const decided = battle.status === 'decided';
  const total = battle.creator_votes + battle.inspo_votes;
  const creatorPct = total === 0 ? 50 : Math.round((battle.creator_votes / total) * 100);
  const inspoPct = 100 - creatorPct;

  async function vote(side: 'creator' | 'inspo') {
    if (isOwner) { toast.error("Can't vote on your own battle"); return; }
    if (myVote || decided) return;
    setBusy(side);
    const { ok, error } = await onVote(side);
    setBusy(null);
    if (!ok) toast.error(error || 'Vote failed');
    else toast.success('Vote locked in');
  }

  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.22em] font-black text-white/70" style={TEKO}>Who Did It Better?</span>
        <span className="text-[10px] text-emerald-400 font-bold">{total} VOTE{total === 1 ? '' : 'S'}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Creator */}
        <button
          onClick={() => vote('creator')}
          disabled={!!myVote || decided || isOwner || !!busy}
          className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100"
          style={{
            background: myVote === 'creator' || (decided && battle.winner === 'creator')
              ? 'radial-gradient(circle at center, rgba(239,68,68,0.35), rgba(239,68,68,0.15))'
              : 'rgba(239,68,68,0.08)',
            border: `2px solid ${myVote === 'creator' ? '#ef4444' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {busy === 'creator' ? (
            <Loader2 className="w-7 h-7 animate-spin text-red-400" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
                {myVote === 'creator' ? <Check className="w-7 h-7 text-white" /> : <span className="text-2xl font-black text-white" style={TEKO}>R</span>}
              </div>
              <span className="text-[11px] font-black uppercase tracking-wide text-white/90 truncate max-w-[90%]" style={TEKO}>@{battle.creator_username}</span>
              {(myVote || decided) && (
                <span className="text-2xl font-black tabular-nums text-red-400" style={TEKO}>{creatorPct}%</span>
              )}
            </>
          )}
        </button>

        {/* Inspo */}
        <button
          onClick={() => vote('inspo')}
          disabled={!!myVote || decided || isOwner || !!busy}
          className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100"
          style={{
            background: myVote === 'inspo' || (decided && battle.winner === 'inspo')
              ? 'radial-gradient(circle at center, rgba(59,130,246,0.35), rgba(59,130,246,0.15))'
              : 'rgba(59,130,246,0.08)',
            border: `2px solid ${myVote === 'inspo' ? '#3b82f6' : 'rgba(59,130,246,0.3)'}`,
          }}
        >
          {busy === 'inspo' ? (
            <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center">
                {myVote === 'inspo' ? <Check className="w-7 h-7 text-white" /> : <span className="text-2xl font-black text-white" style={TEKO}>I</span>}
              </div>
              <span className="text-[11px] font-black uppercase tracking-wide text-white/90" style={TEKO}>Inspo</span>
              {(myVote || decided) && (
                <span className="text-2xl font-black tabular-nums text-blue-400" style={TEKO}>{inspoPct}%</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Bar */}
      <div className="mt-3 h-1.5 rounded-full overflow-hidden flex bg-white/[0.04]">
        <div className="h-full bg-red-500 transition-all" style={{ width: `${creatorPct}%` }} />
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${inspoPct}%` }} />
      </div>

      {myVote && !decided && (
        <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] py-2 text-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400" style={TEKO}>✓ Vote Locked In</span>
        </div>
      )}
      {isOwner && !decided && (
        <p className="text-center text-[10px] text-white/30 mt-3 uppercase tracking-wider" style={TEKO}>Your battle — can't vote</p>
      )}
    </div>
  );
}