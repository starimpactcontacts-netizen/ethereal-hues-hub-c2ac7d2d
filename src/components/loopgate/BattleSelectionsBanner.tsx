import { useEffect, useState } from 'react';
import { Film, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Pick {
  pack?: { id?: string | null; name?: string | null; poster?: string | null } | null;
  song?: { id?: string | null; title?: string | null; artist?: string | null; cover?: string | null } | null;
}

interface Props {
  fightId: string;
  mySide: 'red' | 'blue';
  redUsername: string;
  blueUsername: string;
}

/**
 * Persistent banner shown during an active/completed battle that displays
 * BOTH players' selected scenepack + song. Visible only to participants
 * (RLS-gated RPC). Helps editors remember what they're working with.
 */
export default function BattleSelectionsBanner({ fightId, mySide, redUsername, blueUsername }: Props) {
  const [mine, setMine] = useState<Pick | null>(null);
  const [opp, setOpp] = useState<Pick | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fightId } as any);
      if (cancelled || !data) return;
      const d = data as any;
      setMine(d.mine || null);
      setOpp(d.opponent || null);
    };
    load();
    const ch = supabase
      .channel(`qf_sel_banner_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_selections', filter: `fight_id=eq.${fightId}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fightId]);

  const red = mySide === 'red' ? mine : opp;
  const blue = mySide === 'blue' ? mine : opp;

  if (!red?.pack?.name && !red?.song?.title && !blue?.pack?.name && !blue?.song?.title) return null;

  return (
    <div className="grid grid-cols-2 gap-0 border border-white/10 bg-black/60 overflow-hidden">
      <SideBlock
        color="red"
        label={mySide === 'red' ? 'RED · YOU' : 'RED'}
        username={redUsername}
        pick={red}
      />
      <SideBlock
        color="blue"
        label={mySide === 'blue' ? 'BLUE · YOU' : 'BLUE'}
        username={blueUsername}
        pick={blue}
      />
    </div>
  );
}

function SideBlock({ color, label, username, pick }: { color: 'red' | 'blue'; label: string; username: string; pick: Pick | null }) {
  const isRed = color === 'red';
  const accent = isRed ? 'text-red-400' : 'text-blue-400';
  const border = isRed ? 'border-r border-red-500/20' : 'border-l border-blue-500/20';
  const packName = pick?.pack?.name || '—';
  const songTitle = pick?.song?.title;
  const songArtist = pick?.song?.artist;
  return (
    <div className={`p-2.5 ${border} bg-gradient-to-b ${isRed ? 'from-red-500/[0.06]' : 'from-blue-500/[0.06]'} to-transparent`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${accent} mb-1.5`} style={{ fontFamily: 'Teko, sans-serif' }}>
        {label} <span className="text-white/40">· @{username}</span>
      </p>
      <div className="flex items-center gap-1.5 mb-1">
        <Film className="w-3 h-3 text-white/40 shrink-0" />
        <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Scenepack</span>
      </div>
      <p className="text-[13px] font-bold text-white truncate mb-2" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
        {packName}
      </p>
      <div className="flex items-center gap-1.5 mb-1">
        <Music className="w-3 h-3 text-white/40 shrink-0" />
        <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Song</span>
      </div>
      <p className="text-[13px] font-bold text-white truncate" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
        {songTitle || '—'}
        {songArtist ? <span className="text-white/50 font-normal text-[11px]"> · {songArtist}</span> : null}
      </p>
    </div>
  );
}
