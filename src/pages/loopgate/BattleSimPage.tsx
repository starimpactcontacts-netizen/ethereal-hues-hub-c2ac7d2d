import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Play, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleEnterIntro from '@/components/loopgate/BattleEnterIntro';
import BattleIntroOverlay from '@/components/loopgate/BattleIntroOverlay';
import BattleAutoplayDuo from '@/components/loopgate/BattleAutoplayDuo';
import FoundingBadge from '@/components/loopgate/FoundingBadge';
import { useAuth } from '@/hooks/useAuth';

// Usernames explicitly granted sim access (beyond ops users)
const SIM_WHITELIST = ['guestvipe'];

const TEKO = { fontFamily: 'Teko, sans-serif' };

type League = 'open' | 'pro' | 'elite';

interface PlayerCfg {
  username: string;
  league: League;
  level: number;
  wins: number;
  isOG: boolean;
  videoUrl: string;
  avatarUrl: string;
}

interface SimCfg {
  red: PlayerCfg;
  blue: PlayerCfg;
  redVotes: number;
  blueVotes: number;
}

const DEFAULT: SimCfg = {
  red:  { username: 'REDPLAYER',  league: 'pro',   level: 24, wins: 138, isOG: false, videoUrl: '', avatarUrl: '' },
  blue: { username: 'BLUEPLAYER', league: 'elite',  level: 37, wins: 214, isOG: true,  videoUrl: '', avatarUrl: '' },
  redVotes: 47,
  blueVotes: 31,
};

// ── Inline sim scoreboard (no Supabase fetch) ─────────────────────────────────
function SimScoreboard({ cfg }: { cfg: SimCfg }) {
  const red = cfg.redVotes;
  const blue = cfg.blueVotes;
  const total = red + blue;
  const redLeads = red > blue;
  const blueLeads = blue > red;

  function nameStyle(side: 'red' | 'blue', isLeading: boolean) {
    const base = { ...TEKO, fontSize: 18, fontWeight: 900, letterSpacing: '0.09em', lineHeight: 1, color: '#fff' };
    if (side === 'red') return { ...base, textShadow: isLeading ? '-4px 0 #ff0000, 4px 0 rgba(255,200,200,0.95), 0 0 22px rgba(255,20,20,0.65)' : '-2px 0 rgba(220,0,0,0.8), 2px 0 rgba(255,220,220,0.6)' };
    return { ...base, textShadow: isLeading ? '4px 0 #0044ff, -4px 0 rgba(180,210,255,0.95), 0 0 22px rgba(20,80,255,0.65)' : '2px 0 rgba(0,50,220,0.8), -2px 0 rgba(200,220,255,0.6)' };
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 30, background: 'hsl(var(--background))' }}>
      {/* top broadcast edge */}
      <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg,#cc0000 0%,#880000 25%,rgba(0,0,0,0) 48%,rgba(0,0,0,0) 52%,#001a88 75%,#0033cc 100%)' }} />
      {/* scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,0.18) 1px,rgba(0,0,0,0.18) 2px)', zIndex: 10 }} />

      {/* red corner block */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center" style={{ width: 38, background: '#cc0000' }}>
        <span style={{ ...TEKO, fontSize: 13, fontWeight: 900, letterSpacing: '0.1em', color: '#fff' }}>RED</span>
      </div>
      {/* blue corner block */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center" style={{ width: 38, background: '#0033cc' }}>
        <span style={{ ...TEKO, fontSize: 13, fontWeight: 900, letterSpacing: '0.1em', color: '#fff' }}>BLU</span>
      </div>

      {/* red name area */}
      <div className="absolute top-0 bottom-0 flex items-center px-3" style={{ left: 38, right: '50%', background: 'linear-gradient(90deg,hsl(var(--background)) 40%,rgba(140,0,0,0.28) 100%)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate" style={nameStyle('red', redLeads)}>{cfg.red.username.toUpperCase()}</span>
          {cfg.red.isOG && <FoundingBadge size="sm" animate={false} />}
        </div>
      </div>
      {/* blue name area */}
      <div className="absolute top-0 bottom-0 flex items-center justify-end px-3" style={{ right: 38, left: '50%', background: 'linear-gradient(270deg,hsl(var(--background)) 40%,rgba(0,30,140,0.28) 100%)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          {cfg.blue.isOG && <FoundingBadge size="sm" animate={false} />}
          <span className="truncate" style={nameStyle('blue', blueLeads)}>{cfg.blue.username.toUpperCase()}</span>
        </div>
      </div>

      {/* center score */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 px-2 z-10" style={{ minWidth: 56, background: 'hsl(var(--background))' }}>
        <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, color: '#ef4444', letterSpacing: '0.04em' }}>{red}</span>
        <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>–</span>
        <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, color: '#3b82f6', letterSpacing: '0.04em' }}>{blue}</span>
      </div>

      {/* vote bar */}
      {total > 0 && (
        <div className="absolute bottom-0 left-[38px] right-[38px] h-[2px]">
          <div className="h-full" style={{ width: `${(red / total) * 100}%`, background: '#cc0000', float: 'left' }} />
          <div className="h-full" style={{ width: `${(blue / total) * 100}%`, background: '#0033cc', float: 'left' }} />
        </div>
      )}
    </div>
  );
}

// ── Inline sim stats bar (no Supabase fetch) ──────────────────────────────────
function BadgeOpen({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 20,6.5 20,17.5 12,22 4,17.5 4,6.5" fill="#27272a" stroke="#71717a" strokeWidth="1.4" />
      <polygon points="12,5.5 17,8.5 17,15.5 12,18.5 7,15.5 7,8.5" fill="none" stroke="#52525b" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="#71717a" />
    </svg>
  );
}
function BadgePro({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 21,8.5 18,19 6,19 3,8.5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.4" />
      <polygon points="12,6 17,11 12,16 7,11" fill="none" stroke="#60a5fa" strokeWidth="1.2" />
      <circle cx="12" cy="11" r="2" fill="#60a5fa" />
    </svg>
  );
}
function BadgeElite({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill="#3d2a00" stroke="#fbbf24" strokeWidth="1.3" />
      <path d="M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z" fill="#78350f" stroke="#fde68a" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="1.8" fill="#fbbf24" />
    </svg>
  );
}
const LEAGUE_CFG = {
  open:  { label: 'OPEN',  color: '#71717a', badge: (s?: number) => <BadgeOpen  size={s} /> },
  pro:   { label: 'PRO',   color: '#60a5fa', badge: (s?: number) => <BadgePro   size={s} /> },
  elite: { label: 'ELITE', color: '#fbbf24', badge: (s?: number) => <BadgeElite size={s} /> },
};

function SimStatsBar({ cfg }: { cfg: SimCfg }) {
  function Side({ p, accentColor, align }: { p: PlayerCfg; accentColor: string; align: 'left' | 'right' }) {
    const lc = LEAGUE_CFG[p.league];
    const rgb = accentColor === '#ef4444' ? '239,68,68' : '59,130,246';
    return (
      <div className={`flex-1 flex items-center px-4 min-w-0 overflow-hidden ${align === 'right' ? 'justify-end' : ''}`}
        style={{ background: align === 'left' ? `linear-gradient(90deg,rgba(${rgb},0.05) 0%,transparent 80%)` : `linear-gradient(270deg,rgba(${rgb},0.05) 0%,transparent 80%)` }}>
        <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {lc.badge(22)}
          <div className={`flex flex-col leading-none ${align === 'right' ? 'items-end' : ''}`}>
            <span style={{ ...TEKO, fontSize: 13, fontWeight: 900, letterSpacing: '0.14em', color: lc.color }}>{lc.label}</span>
            <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
              LVL {p.level}<span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 3px' }}>·</span>
              <span style={{ color: accentColor }}>{p.wins}W</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch w-full" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', height: 32 }}>
      <Side p={cfg.red}  accentColor="#ef4444" align="left" />
      <Side p={cfg.blue} accentColor="#3b82f6" align="right" />
    </div>
  );
}

// ── Video placeholder (shown when no URL provided) ────────────────────────────
function VideoPlaceholder({ username, color }: { username: string; color: '#cc0000' | '#0033cc' }) {
  return (
    <div className="flex-1 aspect-square flex items-center justify-center bg-black" style={{ border: `1px solid ${color}22` }}>
      <div className="flex flex-col items-center gap-2 opacity-40">
        <Play size={28} style={{ color }} />
        <span style={{ ...TEKO, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>{username.toUpperCase()}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>paste video URL above</span>
      </div>
    </div>
  );
}

// ── Input helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-white/30"
        style={{ minWidth: 0 }}
      />
    </label>
  );
}

function LeagueSelect({ value, onChange }: { value: League; onChange: (v: League) => void }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>League</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as League)}
        className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-white/30"
      >
        <option value="open">Open</option>
        <option value="pro">Pro</option>
        <option value="elite">Elite</option>
      </select>
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BattleSimPage() {
  const { profile, hasOpsAccess } = useAuth();
  const canAccess = hasOpsAccess || SIM_WHITELIST.includes(profile?.username ?? '');
  if (!canAccess) return <Navigate to="/404" replace />;

  const [cfg, setCfg] = useState<SimCfg>(DEFAULT);
  const [configOpen, setConfigOpen] = useState(true);

  // Intro animation triggers
  const [introKey, setIntroKey] = useState(0);
  const [showIntro, setShowIntro] = useState(false);

  // Countdown triggers
  const [countdownKey, setCountdownKey] = useState('sim-0');
  const [countdownActive, setCountdownActive] = useState(false);

  const updRed  = (k: keyof PlayerCfg, v: string | number | boolean) => setCfg(c => ({ ...c, red:  { ...c.red,  [k]: v } }));
  const updBlue = (k: keyof PlayerCfg, v: string | number | boolean) => setCfg(c => ({ ...c, blue: { ...c.blue, [k]: v } }));

  const triggerIntro = () => {
    setShowIntro(false);
    setTimeout(() => { setIntroKey(k => k + 1); setShowIntro(true); }, 50);
  };

  const triggerCountdown = () => {
    setCountdownActive(false);
    setTimeout(() => { setCountdownKey(`sim-${Date.now()}`); setCountdownActive(true); }, 50);
  };

  const hasVideos = cfg.red.videoUrl.trim() && cfg.blue.videoUrl.trim();

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#fff' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-50" style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/ops-panel/a7c92ff31b" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span style={{ ...TEKO, fontSize: 20, fontWeight: 900, letterSpacing: '0.08em' }}>BATTLE SIMULATOR</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded font-bold uppercase tracking-widest" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}>SANDBOX</span>
      </div>

      {/* ── Config panel ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setConfigOpen(o => !o)}
          className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <span style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
            Player Config
          </span>
          {configOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </button>

        <AnimatePresence>
          {configOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Red player */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid rgba(204,0,0,0.3)' }}>
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                    <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, letterSpacing: '0.1em', color: '#ef4444' }}>RED PLAYER</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Field label="Username" value={cfg.red.username} onChange={v => updRed('username', v)} />
                    </div>
                    <LeagueSelect value={cfg.red.league} onChange={v => updRed('league', v)} />
                    <Field label="Level" type="number" value={cfg.red.level} onChange={v => updRed('level', parseInt(v) || 1)} />
                    <Field label="Total Wins" type="number" value={cfg.red.wins} onChange={v => updRed('wins', parseInt(v) || 0)} />
                    <label className="flex flex-col gap-0.5 justify-end">
                      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>OG Badge</span>
                      <button
                        onClick={() => updRed('isOG', !cfg.red.isOG)}
                        className="flex items-center gap-2 border rounded px-2 py-1 text-sm transition-colors"
                        style={{
                          background: cfg.red.isOG ? 'rgba(255,190,40,0.1)' : 'transparent',
                          borderColor: cfg.red.isOG ? 'rgba(255,190,40,0.4)' : 'rgba(255,255,255,0.1)',
                          color: cfg.red.isOG ? '#FFD060' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        <span>{cfg.red.isOG ? '★ OG' : '☆ OG'}</span>
                      </button>
                    </label>
                    <div className="col-span-2">
                      <Field label="Video URL (Bunny CDN or direct mp4)" value={cfg.red.videoUrl} onChange={v => updRed('videoUrl', v)} />
                    </div>
                  </div>
                </div>

                {/* Blue player */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid rgba(0,51,204,0.3)' }}>
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, letterSpacing: '0.1em', color: '#3b82f6' }}>BLUE PLAYER</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Field label="Username" value={cfg.blue.username} onChange={v => updBlue('username', v)} />
                    </div>
                    <LeagueSelect value={cfg.blue.league} onChange={v => updBlue('league', v)} />
                    <Field label="Level" type="number" value={cfg.blue.level} onChange={v => updBlue('level', parseInt(v) || 1)} />
                    <Field label="Total Wins" type="number" value={cfg.blue.wins} onChange={v => updBlue('wins', parseInt(v) || 0)} />
                    <label className="flex flex-col gap-0.5 justify-end">
                      <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>OG Badge</span>
                      <button
                        onClick={() => updBlue('isOG', !cfg.blue.isOG)}
                        className="flex items-center gap-2 border rounded px-2 py-1 text-sm transition-colors"
                        style={{
                          background: cfg.blue.isOG ? 'rgba(255,190,40,0.1)' : 'transparent',
                          borderColor: cfg.blue.isOG ? 'rgba(255,190,40,0.4)' : 'rgba(255,255,255,0.1)',
                          color: cfg.blue.isOG ? '#FFD060' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        <span>{cfg.blue.isOG ? '★ OG' : '☆ OG'}</span>
                      </button>
                    </label>
                    <div className="col-span-2">
                      <Field label="Video URL (Bunny CDN or direct mp4)" value={cfg.blue.videoUrl} onChange={v => updBlue('videoUrl', v)} />
                    </div>
                  </div>
                </div>

                {/* Votes + triggers */}
                <div className="md:col-span-2 flex flex-wrap items-end gap-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-28">
                    <Field label="Red Votes" type="number" value={cfg.redVotes} onChange={v => setCfg(c => ({ ...c, redVotes: parseInt(v) || 0 }))} />
                  </div>
                  <div className="w-28">
                    <Field label="Blue Votes" type="number" value={cfg.blueVotes} onChange={v => setCfg(c => ({ ...c, blueVotes: parseInt(v) || 0 }))} />
                  </div>
                  <div className="flex gap-2 ml-auto flex-wrap">
                    <button
                      onClick={triggerIntro}
                      className="flex items-center gap-2 px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                    >
                      <Play size={13} /> Intro Splash
                    </button>
                    <button
                      onClick={triggerCountdown}
                      className="flex items-center gap-2 px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                    >
                      <RefreshCw size={13} /> 3-2-1-GO!
                    </button>
                    <button
                      onClick={() => { setCfg(DEFAULT); }}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm uppercase tracking-wider transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Battle preview ── */}
      <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-0">

        {/* HUD scoreboard */}
        <SimScoreboard cfg={cfg} />

        {/* Video area */}
        <div className="-mx-4 md:-mx-0">
          {hasVideos ? (
            <BattleAutoplayDuo
              red={{ userId: 'sim-red',  username: cfg.red.username,  url: cfg.red.videoUrl,  color: 'red',  avatarUrl: cfg.red.avatarUrl  || null }}
              blue={{ userId: 'sim-blue', username: cfg.blue.username, url: cfg.blue.videoUrl, color: 'blue', avatarUrl: cfg.blue.avatarUrl || null }}
            />
          ) : (
            <div className="flex" style={{ background: '#000' }}>
              <VideoPlaceholder username={cfg.red.username}  color="#cc0000" />
              <div className="w-px self-stretch" style={{ background: 'linear-gradient(180deg,transparent 0%,rgba(255,255,255,0.18) 20%,rgba(255,255,255,0.18) 80%,transparent 100%)' }} />
              <VideoPlaceholder username={cfg.blue.username} color="#0033cc" />
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="-mx-4 md:-mx-0">
          <SimStatsBar cfg={cfg} />
        </div>

        {/* Vote buttons (visual mock) */}
        <div className="flex items-center justify-center gap-8 py-5">
          {/* O button */}
          <button className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: 62, height: 62 }}>
            <svg viewBox="0 0 118 118" width={62} height={62} fill="none">
              <circle cx="59" cy="59" r="50" fill="rgba(255,26,26,0.12)" stroke="#ff1a1a" strokeWidth="3.5" />
              <circle cx="59" cy="59" r="22" stroke="#ff1a1a" strokeWidth="6" fill="none" />
            </svg>
          </button>
          <span style={{ ...TEKO, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.18)' }}>VOTE</span>
          {/* X button */}
          <button className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: 62, height: 62 }}>
            <svg viewBox="0 0 118 118" width={62} height={62} fill="none">
              <circle cx="59" cy="59" r="50" fill="rgba(26,68,255,0.12)" stroke="#1a44ff" strokeWidth="3.5" />
              <line x1="38" y1="38" x2="80" y2="80" stroke="#1a44ff" strokeWidth="6" strokeLinecap="round" />
              <line x1="80" y1="38" x2="38" y2="80" stroke="#1a44ff" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

      </div>

      {/* ── Overlays ── */}
      {showIntro && (
        <BattleEnterIntro
          key={introKey}
          redUsername={cfg.red.username}
          blueUsername={cfg.blue.username}
          onDone={() => setShowIntro(false)}
        />
      )}

      <BattleIntroOverlay
        key={countdownKey}
        fightId={countdownKey}
        active={countdownActive}
        onComplete={() => setCountdownActive(false)}
      />
    </div>
  );
}
