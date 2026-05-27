import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Music, Swords } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const teko = { fontFamily: 'Teko, sans-serif' };

interface Player {
  username: string;
  avatarUrl: string | null;
}
interface Pick {
  pack?: { name?: string | null; poster?: string | null } | null;
  song?: { title?: string | null; artist?: string | null; cover?: string | null } | null;
}
interface Props {
  fightId: string;
  red: Player;
  blue: Player;
  mySide: 'red' | 'blue' | null;
  durationMs?: number;
  onComplete: () => void;
}

/**
 * Mandatory pre-battle reveal: shows BOTH players' scenepack + song side-by-side
 * with a 3-2-1-GO countdown so everyone can verify what each editor must use.
 */
export default function BattleRevealScreen({ fightId, red, blue, mySide, durationMs = 5000, onComplete }: Props) {
  const [redPick, setRedPick] = useState<Pick | null>(null);
  const [bluePick, setBluePick] = useState<Pick | null>(null);
  const [count, setCount] = useState<number>(Math.ceil(durationMs / 1000));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fightId } as any);
      if (cancelled || !data) return;
      const d = data as any;
      const mine = d.mine || null;
      const opp = d.opponent || null;
      if (mySide === 'red') { setRedPick(mine); setBluePick(opp); }
      else if (mySide === 'blue') { setBluePick(mine); setRedPick(opp); }
      else { setRedPick(mine); setBluePick(opp); }
    };
    load();
    const ch = supabase
      .channel(`qf_reveal_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_selections', filter: `fight_id=eq.${fightId}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fightId, mySide]);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const remaining = Math.max(0, durationMs - (Date.now() - start));
      setCount(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(tick);
        onComplete();
      }
    }, 100);
    return () => clearInterval(tick);
  }, [durationMs, onComplete]);

  return (
    <div className="fixed inset-0 z-[9997] bg-black overflow-hidden flex flex-col">
      <div className="flex-1 grid grid-cols-2 relative">
        <Side player={red} pick={redPick} color="red" isYou={mySide === 'red'} />
        <Side player={blue} pick={bluePick} color="blue" isYou={mySide === 'blue'} />

        {/* Center VS / Countdown */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Swords className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
            </div>
            <div
              className="text-7xl text-white"
              style={{ ...teko, WebkitTextStroke: '3px #000', textShadow: '4px 4px 0 #000', letterSpacing: '0.05em' }}
            >
              VS
            </div>
            <p className="text-[10px] tracking-[0.4em] text-white/60 uppercase font-black" style={teko}>
              Fight Starting
            </p>
            <motion.div
              key={count}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="text-5xl font-black"
              style={{ ...teko, color: count === 0 ? '#22c55e' : '#ef4444', WebkitTextStroke: '2px #000', textShadow: '3px 3px 0 #000' }}
            >
              {count > 0 ? count : 'GO!'}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Side({ player, pick, color, isYou }: { player: Player; pick: Pick | null; color: 'red' | 'blue'; isYou: boolean }) {
  const isRed = color === 'red';
  const accent = isRed ? 'text-red-400' : 'text-blue-400';
  const ring = isRed ? 'ring-red-500' : 'ring-blue-500';
  const grad = isRed
    ? 'linear-gradient(180deg, rgba(239,68,68,0.22), rgba(0,0,0,0.95))'
    : 'linear-gradient(180deg, rgba(59,130,246,0.22), rgba(0,0,0,0.95))';
  return (
    <div className="relative flex flex-col items-center justify-center px-4 py-8" style={{ background: grad }}>
      <Avatar className={`w-24 h-24 ring-4 ${ring} ring-offset-2 ring-offset-black`}>
        <AvatarImage src={player.avatarUrl || undefined} />
        <AvatarFallback>{(player.username || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <p className={`mt-3 text-[10px] font-black tracking-[0.3em] uppercase ${accent}`} style={teko}>
        {color.toUpperCase()}{isYou ? ' · YOU' : ''}
      </p>
      <p className="text-2xl font-black text-white uppercase tracking-wider" style={teko}>
        @{player.username}
      </p>

      <div className="mt-6 w-full max-w-[160px] space-y-3">
        {/* Scenepack */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Film className="w-3 h-3 text-white/50" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">Scenepack</span>
          </div>
          {pick?.pack?.name ? (
            <div className="flex items-center gap-2">
              {pick.pack.poster ? (
                <img src={pick.pack.poster} alt={pick.pack.name} className="w-10 h-10 rounded-sm object-cover shrink-0 border border-white/15" />
              ) : (
                <div className="w-10 h-10 rounded-sm bg-white/10 border border-white/15 shrink-0 flex items-center justify-center">
                  <Film className="w-4 h-4 text-white/30" />
                </div>
              )}
              <p className="text-sm font-bold text-white truncate" style={teko}>{pick.pack.name}</p>
            </div>
          ) : (
            <p className="text-[11px] text-white/30 italic">No scenepack — find your own</p>
          )}
        </div>

        {/* Song */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Music className="w-3 h-3 text-white/50" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">Song</span>
          </div>
          {pick?.song?.title ? (
            <div className="flex items-center gap-2">
              {pick.song.cover ? (
                <img src={pick.song.cover} alt={pick.song.title} className="w-10 h-10 rounded-sm object-cover shrink-0 border border-white/15" />
              ) : (
                <div className="w-10 h-10 rounded-sm bg-white/10 border border-white/15 shrink-0 flex items-center justify-center">
                  <Music className="w-4 h-4 text-white/30" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate" style={teko}>{pick.song.title}</p>
                {pick.song.artist && <p className="text-[11px] text-white/50 truncate">{pick.song.artist}</p>}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-white/30 italic">No song selected</p>
          )}
        </div>
      </div>
    </div>
  );
}
