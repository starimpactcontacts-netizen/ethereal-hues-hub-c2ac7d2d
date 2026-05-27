import { useEffect, useState } from 'react';
import { Download, Film, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Pick {
  pack?: { id?: string | null; name?: string | null; poster?: string | null } | null;
  song?: { id?: string | null; title?: string | null; artist?: string | null; cover?: string | null; preview?: string | null } | null;
}

interface Props {
  fightId: string;
  mySide: 'red' | 'blue';
  redUsername: string;
  blueUsername: string;
}

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
    <div className="grid grid-cols-2 gap-0 border border-white/10 bg-black/70 overflow-hidden">
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
  const gradFrom = isRed ? 'from-red-500/[0.07]' : 'from-blue-500/[0.07]';
  const accentHex = isRed ? '#ef4444' : '#3b82f6';

  const hasAnyPick = !!(pick?.pack?.name || pick?.song?.title);

  return (
    <div className={`p-2.5 ${border} bg-gradient-to-b ${gradFrom} to-transparent space-y-2`}>
      {/* Header */}
      <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${accent}`} style={{ fontFamily: 'Teko, sans-serif' }}>
        {label} <span className="text-white/40">· @{username}</span>
      </p>

      {!hasAnyPick ? (
        /* Empty state */
        <div className="py-3 space-y-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Teko, sans-serif' }}>
            No selections yet
          </p>
          <p className="text-[9px] text-white/20 leading-snug">
            No scenepacks available — go find your own scenepacks for this type shi
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Scenepack row */}
          {pick?.pack?.name ? (
            <PickRow
              icon={<Film className="w-3 h-3 text-white/40" />}
              label="Scenepack"
              coverUrl={pick.pack.poster || null}
              title={pick.pack.name}
              subtitle={null}
              downloadUrl={pick.pack.poster || null}
              accentHex={accentHex}
            />
          ) : (
            <EmptyPickRow label="Scenepack" />
          )}

          {/* Song row */}
          {pick?.song?.title ? (
            <PickRow
              icon={<Music className="w-3 h-3 text-white/40" />}
              label="Song"
              coverUrl={pick.song.cover || null}
              title={pick.song.title}
              subtitle={pick.song.artist || null}
              downloadUrl={pick.song.preview || null}
              accentHex={accentHex}
            />
          ) : (
            <EmptyPickRow label="Song" />
          )}
        </div>
      )}
    </div>
  );
}

function PickRow({
  icon,
  label,
  coverUrl,
  title,
  subtitle,
  downloadUrl,
  accentHex,
}: {
  icon: React.ReactNode;
  label: string;
  coverUrl: string | null;
  title: string;
  subtitle: string | null;
  downloadUrl: string | null;
  accentHex: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Cover art thumbnail */}
      <div
        className="w-11 h-11 shrink-0 overflow-hidden rounded-sm bg-white/5 border border-white/10 flex items-center justify-center"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            {icon}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {icon}
          <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">{label}</span>
        </div>
        <p className="text-[12px] font-bold text-white truncate leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-white/45 truncate leading-tight">{subtitle}</p>
        )}
      </div>

      {/* Download / preview button */}
      {downloadUrl ? (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
          aria-label={`Download ${label}`}
          style={{ color: accentHex }}
        >
          <Download className="w-3 h-3" />
        </a>
      ) : (
        <div
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm border border-white/8 bg-white/[0.03] opacity-30 cursor-not-allowed"
          title="No download available"
        >
          <Download className="w-3 h-3 text-white/40" />
        </div>
      )}
    </div>
  );
}

function EmptyPickRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-11 h-11 shrink-0 rounded-sm border border-dashed border-white/10 flex items-center justify-center">
        {label === 'Scenepack' ? (
          <Film className="w-3.5 h-3.5 text-white/15" />
        ) : (
          <Music className="w-3.5 h-3.5 text-white/15" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] uppercase tracking-wider text-white/25 font-bold mb-0.5">{label}</p>
        <p className="text-[10px] text-white/20 leading-tight">
          No {label.toLowerCase()} available — find your own
        </p>
      </div>
    </div>
  );
}
