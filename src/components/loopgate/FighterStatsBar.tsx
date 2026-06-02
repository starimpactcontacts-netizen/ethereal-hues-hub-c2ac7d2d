import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TEKO = { fontFamily: 'Teko, sans-serif' };

type League = 'open' | 'pro' | 'elite';

interface FighterStats {
  league: League;
  level: number;
  total_wins: number | null;
  win_rate: number | null;
}

/* ── Valorant-inspired SVG rank badges ── */
function BadgeOpen({ size = 22 }: { size?: number }) {
  // Hexagon with inner ring — Iron/Bronze tier feel
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 20,6.5 20,17.5 12,22 4,17.5 4,6.5" fill="#27272a" stroke="#71717a" strokeWidth="1.4" />
      <polygon points="12,5.5 17,8.5 17,15.5 12,18.5 7,15.5 7,8.5" fill="none" stroke="#52525b" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="#71717a" />
    </svg>
  );
}

function BadgePro({ size = 22 }: { size?: number }) {
  // Pentagon + inner diamond — Gold/Plat tier
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 21,8.5 18,19 6,19 3,8.5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.4" />
      <polygon points="12,6 17,11 12,16 7,11" fill="none" stroke="#60a5fa" strokeWidth="1.2" />
      <circle cx="12" cy="11" r="2" fill="#60a5fa" />
    </svg>
  );
}

function BadgeElite({ size = 22 }: { size?: number }) {
  // 4-pointed star / diamond — Immortal/Radiant tier
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#3d2a00" stroke="#fbbf24" strokeWidth="1.3" />
      <path d="M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z" fill="#78350f" stroke="#fde68a" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="1.8" fill="#fbbf24" />
    </svg>
  );
}

const LEAGUE_CFG: Record<League, {
  label: string;
  color: string;
  badge: (size?: number) => JSX.Element;
}> = {
  open:  { label: 'OPEN',  color: '#71717a', badge: (s) => <BadgeOpen  size={s} /> },
  pro:   { label: 'PRO',   color: '#60a5fa', badge: (s) => <BadgePro   size={s} /> },
  elite: { label: 'ELITE', color: '#fbbf24', badge: (s) => <BadgeElite size={s} /> },
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
        .select('id, league, level, total_wins, win_rate')
        .in('id', [redUserId, blueUserId]);
      if (!data) return;
      for (const p of data) {
        const s: FighterStats = {
          league: (p.league as League) || 'open',
          level: p.level ?? 1,
          total_wins: p.total_wins,
          win_rate: p.win_rate,
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
      style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', height: 32 }}
    >
      <Side stats={red} accentColor="#ef4444" align="left" />

      <Side stats={blue} accentColor="#3b82f6" align="right" />
    </div>
  );
}

function Side({ stats, accentColor, align }: {
  stats: FighterStats | null;
  accentColor: string;
  align: 'left' | 'right';
}) {
  if (!stats) {
    return <div className="flex-1" />;
  }

  const cfg = LEAGUE_CFG[stats.league];
  const wins = stats.total_wins ?? 0;

  const content = (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {/* Badge icon */}
      {cfg.badge(22)}

      {/* Text stack */}
      <div className={`flex flex-col leading-none ${align === 'right' ? 'items-end' : 'items-start'}`}>
        {/* League name */}
        <span
          className="font-black uppercase"
          style={{ ...TEKO, fontSize: 13, letterSpacing: '0.14em', color: cfg.color }}
        >
          {cfg.label}
        </span>
        {/* Level · Wins */}
        <span
          className="font-black tabular-nums"
          style={{ ...TEKO, fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}
        >
          LVL {stats.level}
          <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 3px' }}>·</span>
          <span style={{ color: accentColor }}>{wins}W</span>
        </span>
      </div>
    </div>
  );

  return (
    <div
      className={`flex-1 flex items-center px-4 min-w-0 overflow-hidden ${align === 'right' ? 'justify-end' : 'justify-start'}`}
      style={{
        background: align === 'left'
          ? `linear-gradient(90deg, rgba(${accentColor === '#ef4444' ? '239,68,68' : '59,130,246'},0.05) 0%, transparent 80%)`
          : `linear-gradient(270deg, rgba(${accentColor === '#ef4444' ? '239,68,68' : '59,130,246'},0.05) 0%, transparent 80%)`,
      }}
    >
      {content}
    </div>
  );
}
