import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Trophy, Swords } from 'lucide-react';

const TEKO = { fontFamily: 'Teko, sans-serif' };

type League = 'open' | 'pro' | 'elite';

interface FighterStats {
  league: League;
  level: number;
  xp: number;
  total_wins: number | null;
  win_rate: number | null;
  archetype: string | null;
}

const LEAGUE_CONFIG: Record<League, { label: string; color: string; bg: string; border: string }> = {
  open:  { label: 'OPEN',  color: '#a1a1aa', bg: 'rgba(161,161,170,0.1)', border: 'rgba(161,161,170,0.25)' },
  pro:   { label: 'PRO',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)'  },
  elite: { label: 'ELITE', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)'  },
};

interface Props {
  redUserId: string;
  blueUserId: string;
}

export default function FighterStatsBar({ redUserId, blueUserId }: Props) {
  const [red, setRed] = useState<FighterStats | null>(null);
  const [blue, setBlue] = useState<FighterStats | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, league, level, xp, total_wins, win_rate, archetype')
        .in('id', [redUserId, blueUserId]);
      if (!data) return;
      for (const p of data) {
        const s: FighterStats = {
          league: (p.league as League) || 'open',
          level: p.level ?? 1,
          xp: p.xp ?? 0,
          total_wins: p.total_wins,
          win_rate: p.win_rate,
          archetype: p.archetype,
        };
        if (p.id === redUserId) setRed(s);
        else setBlue(s);
      }
    };
    fetch();
  }, [redUserId, blueUserId]);

  if (!red && !blue) return null;

  return (
    <div
      className="flex items-stretch w-full"
      style={{
        background: '#0d0d0d',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* RED side */}
      <StatSide stats={red} accent="#ef4444" side="red" />

      {/* Center divider */}
      <div className="flex items-center justify-center shrink-0 px-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <Swords className="w-3 h-3 text-white/15" />
      </div>

      {/* BLUE side */}
      <StatSide stats={blue} accent="#3b82f6" side="blue" />
    </div>
  );
}

function StatSide({ stats, accent, side }: { stats: FighterStats | null; accent: string; side: 'red' | 'blue' }) {
  const isRed = side === 'red';

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center py-2.5">
        <span className="text-[10px] text-white/15 uppercase tracking-widest" style={TEKO}>—</span>
      </div>
    );
  }

  const cfg = LEAGUE_CONFIG[stats.league];
  const wins = stats.total_wins ?? 0;
  const wr = stats.win_rate != null ? Math.round(stats.win_rate) : null;

  const pills = (
    <>
      {/* League badge */}
      <span
        className="text-[9px] font-black uppercase tracking-[0.18em] px-1.5 py-0.5 rounded shrink-0"
        style={{ ...TEKO, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {cfg.label}
      </span>

      {/* Level */}
      <StatPill icon={<Flame className="w-2.5 h-2.5" />} label={`LVL ${stats.level}`} color="#d4d4d8" />

      {/* Wins */}
      <StatPill icon={<Trophy className="w-2.5 h-2.5" />} label={`${wins}W`} color={accent} />

      {/* Win rate */}
      {wr != null && (
        <StatPill label={`${wr}% WR`} color={wr >= 60 ? '#4ade80' : wr >= 40 ? '#d4d4d8' : '#f87171'} />
      )}

      {/* Archetype */}
      {stats.archetype && (
        <span className="text-[9px] uppercase tracking-[0.14em] text-white/25 shrink-0 hidden sm:inline" style={TEKO}>
          {stats.archetype}
        </span>
      )}
    </>
  );

  return (
    <div
      className={`flex-1 flex items-center gap-1.5 py-2.5 px-3 min-w-0 overflow-hidden flex-wrap ${isRed ? 'justify-start' : 'justify-end'}`}
      style={{ background: isRed ? `linear-gradient(90deg, rgba(239,68,68,0.04) 0%, transparent 100%)` : `linear-gradient(270deg, rgba(59,130,246,0.04) 0%, transparent 100%)` }}
    >
      {isRed ? pills : <>{pills}</>}
    </div>
  );
}

function StatPill({ icon, label, color }: { icon?: React.ReactNode; label: string; color: string }) {
  return (
    <span className="flex items-center gap-0.5 shrink-0" style={{ color }}>
      {icon && <span style={{ color }}>{icon}</span>}
      <span className="text-[11px] font-black tabular-nums" style={TEKO}>{label}</span>
    </span>
  );
}
