import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Swords, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { QuickFight } from '@/hooks/useQuickFight';

export default function FeaturedEditBattlesSection() {
  const [pool, setPool] = useState<QuickFight[]>([]);
  const [current, setCurrent] = useState<QuickFight | null>(null);
  const [votes, setVotes] = useState({ blue: 0, red: 0 });
  const [key, setKey] = useState(0);

  useEffect(() => {
    supabase.from('quick_fights').select('*')
      .eq('status', 'completed').eq('is_private', false)
      .not('player_1_submission_url', 'is', null)
      .not('player_2_submission_url', 'is', null)
      .not('player_2_id', 'is', null)
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        const rows = (data as QuickFight[]) || [];
        if (!rows.length) return;
        setPool(rows);
        setCurrent(rows[Math.floor(Math.random() * rows.length)]);
      });
  }, []);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    supabase.from('quick_fight_votes').select('voted_for').eq('fight_id', current.id)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const rows = data as { voted_for: string }[];
        setVotes({
          blue: rows.filter(r => r.voted_for === current.player_1_id).length,
          red: rows.filter(r => r.voted_for === current.player_2_id).length,
        });
      });
    return () => { cancelled = true; };
  }, [current]);

  const shuffle = useCallback(() => {
    if (pool.length < 2) return;
    const others = pool.filter(f => f.id !== current?.id);
    setCurrent(others[Math.floor(Math.random() * others.length)]);
    setKey(k => k + 1);
  }, [pool, current]);

  if (!current) return null;

  const total = votes.blue + votes.red;
  const bluePct = total === 0 ? 50 : Math.round((votes.blue / total) * 100);
  const redPct = 100 - bluePct;

  const G = {
    w: 500, h: 120,
    pL: 60,   // left pillar inner edge
    pR: 440,  // right pillar inner edge
    pW: 34,   // pillar width
  };

  return (
    <section className="px-4 mt-6">
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-white/40" strokeWidth={2} />
          <span className="text-[12px] font-black tracking-[0.2em] text-white/40 uppercase"
            style={{ fontFamily: 'Teko, sans-serif' }}>Battle Spotlight</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={shuffle}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 hover:text-white/60 transition-colors">
            <Shuffle className="w-3 h-3" /> Shuffle
          </button>
          <Link to="/arena"
            className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 hover:text-white/60 transition-colors">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={key}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}>
          <Link to={`/fight/${current.id}`} className="block">

            {/*
              ╔══════════════════════════════════════════════╗
                 TORII GATE CARD
                 Structure:
                  [SVG] kasagi arch (curved, wider) + shimagi + pillar tops
                  [DIV] left pillar | content | right pillar
                  [DIV] nuki crossbar (full width, through pillars)
                  [DIV] lower pillar section | lower content | lower pillar
                  [DIV] base rail
              ╚══════════════════════════════════════════════╝
            */}

            {/* ── KASAGI + SHIMAGI: SVG arch section ─────────────────────── */}
            {/* height:82 on an 120-unit viewBox → scale=0.683, giving shimagi ~19px rendered */}
            <div className="-mx-1.5 overflow-visible">
              <svg
                viewBox={`0 0 ${G.w} ${G.h}`}
                className="w-full block"
                style={{ height: 82, overflow: 'visible' }}
                preserveAspectRatio="none"
              >
                {/* ── KASAGI fill ── */}
                <path
                  d="M -20 18 C 5 4, 80 34, 130 38 L 370 38 C 420 34, 495 4, 520 18 L 520 55 C 490 52, 10 52, -20 55 Z"
                  fill="#111111"
                />
                {/* Kasagi top edge — sweeps up at ends */}
                <path
                  d="M -20 18 C 5 4, 80 34, 130 38 L 370 38 C 420 34, 495 4, 520 18"
                  fill="none" stroke="#ffffff" strokeWidth="2.5"
                />
                {/* Kasagi soffit */}
                <path
                  d="M -20 55 C 10 52, 490 52, 520 55"
                  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"
                />
                {/* Kasagi end caps */}
                <line x1="-20" y1="17" x2="-20" y2="56" stroke="#ffffff" strokeWidth="2.5" />
                <line x1="520" y1="17" x2="520" y2="56" stroke="#ffffff" strokeWidth="2.5" />

                {/* ── PILLAR BODIES (run from kasagi to bottom of SVG) ── */}
                {/* Left */}
                <rect x={G.pL} y="52" width={G.pW} height="68" fill="#161616" />
                <line x1={G.pL} y1="52" x2={G.pL} y2="120" stroke="#ffffff" strokeWidth="1.5" />
                <line x1={G.pL + G.pW} y1="52" x2={G.pL + G.pW} y2="120"
                  stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
                {/* Right */}
                <rect x={G.pR - G.pW} y="52" width={G.pW} height="68" fill="#161616" />
                <line x1={G.pR} y1="52" x2={G.pR} y2="120" stroke="#ffffff" strokeWidth="1.5" />
                <line x1={G.pR - G.pW} y1="52" x2={G.pR - G.pW} y2="120"
                  stroke="rgba(255,255,255,0.22)" strokeWidth="1" />

                {/* ── SHIMAGI: second beam (28 SVG units = ~19px rendered) ── */}
                <rect x={G.pL - 18} y="57" width={G.w - (G.pL - 18) * 2} height="28"
                  fill="#141414" />
                {/* Top edge */}
                <line x1={G.pL - 18} y1="57" x2={G.w - G.pL + 18} y2="57"
                  stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
                {/* Inner shadow line */}
                <line x1={G.pL - 18} y1="60" x2={G.w - G.pL + 18} y2="60"
                  stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                {/* Bottom edge */}
                <line x1={G.pL - 18} y1="85" x2={G.w - G.pL + 18} y2="85"
                  stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                {/* ── BRACKET EARS: hang below shimagi at each pillar ── */}
                {/* Left pillar — left ear */}
                <rect x={G.pL - 14} y="85" width="14" height="12" fill="#181818" />
                <line x1={G.pL - 14} y1="85" x2={G.pL - 14} y2="97" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
                <line x1={G.pL - 14} y1="97" x2={G.pL} y2="97" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Left pillar — right ear */}
                <rect x={G.pL + G.pW} y="85" width="14" height="12" fill="#181818" />
                <line x1={G.pL + G.pW + 14} y1="85" x2={G.pL + G.pW + 14} y2="97" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
                <line x1={G.pL + G.pW} y1="97" x2={G.pL + G.pW + 14} y2="97" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Right pillar — left ear */}
                <rect x={G.pR - G.pW - 14} y="85" width="14" height="12" fill="#181818" />
                <line x1={G.pR - G.pW - 14} y1="85" x2={G.pR - G.pW - 14} y2="97" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
                <line x1={G.pR - G.pW - 14} y1="97" x2={G.pR - G.pW} y2="97" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                {/* Right pillar — right ear */}
                <rect x={G.pR} y="85" width="14" height="12" fill="#181818" />
                <line x1={G.pR + 14} y1="85" x2={G.pR + 14} y2="97" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
                <line x1={G.pR} y1="97" x2={G.pR + 14} y2="97" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              </svg>
            </div>

            {/* ── PILLAR + UPPER CONTENT (above nuki) ────────────────────── */}
            <div className="flex" style={{ background: '#0a0a0a' }}>
              {/* Left pillar */}
              <div className="flex-shrink-0" style={{
                width: 34,
                background: '#141414',
                borderLeft: '2px solid #ffffff',
                borderRight: '1px solid rgba(255,255,255,0.12)',
              }} />

              {/* Upper content — players */}
              <div className="flex-1 min-w-0 relative">
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }} />
                <div className="relative flex items-start pt-5 pb-4 px-3 gap-2">

                  {/* Player 1 */}
                  <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="absolute -inset-[2px] bg-blue-500 opacity-60" />
                      <Avatar className="relative w-[72px] h-[72px] rounded-none">
                        <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-none text-blue-300 font-black text-3xl"
                          style={{ fontFamily: 'Teko, sans-serif', background: '#080f1a' }}>
                          {current.player_1_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[11px] font-black text-white/80 truncate w-full text-center uppercase tracking-wider"
                      style={{ fontFamily: 'Teko, sans-serif' }}>
                      {current.player_1_username}
                    </p>
                    <div className="text-center leading-none">
                      <span className="text-[40px] font-black text-blue-400 tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif', lineHeight: 1 }}>
                        {votes.blue}
                      </span>
                      <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-400/30 mt-0.5">Votes</p>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex-shrink-0 flex items-center justify-center pt-10">
                    <span className="text-[28px] font-black text-white/[0.07] leading-none"
                      style={{ fontFamily: 'Teko, sans-serif' }}>
                      VS
                    </span>
                  </div>

                  {/* Player 2 */}
                  <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="absolute -inset-[2px] bg-red-500 opacity-60" />
                      <Avatar className="relative w-[72px] h-[72px] rounded-none">
                        <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-none text-red-300 font-black text-3xl"
                          style={{ fontFamily: 'Teko, sans-serif', background: '#1a0808' }}>
                          {current.player_2_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[11px] font-black text-white/80 truncate w-full text-center uppercase tracking-wider"
                      style={{ fontFamily: 'Teko, sans-serif' }}>
                      {current.player_2_username}
                    </p>
                    <div className="text-center leading-none">
                      <span className="text-[40px] font-black text-red-400 tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif', lineHeight: 1 }}>
                        {votes.red}
                      </span>
                      <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-red-400/30 mt-0.5">Votes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right pillar */}
              <div className="flex-shrink-0" style={{
                width: 34,
                background: '#141414',
                borderRight: '2px solid #ffffff',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
              }} />
            </div>

            {/* ── NUKI: horizontal crossbar through the pillars ───────────── */}
            <div className="-mx-1.5 relative" style={{ background: '#141414', height: 14 }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(255,255,255,0.4)' }} />
              <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
              {/* Bracket marks at pillar edges */}
              <div className="absolute top-0 bottom-0" style={{ left: 34, width: 2, background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute top-0 bottom-0" style={{ left: 68, width: 1, background: 'rgba(255,255,255,0.12)' }} />
              <div className="absolute top-0 bottom-0" style={{ right: 34, width: 2, background: 'rgba(255,255,255,0.3)' }} />
              <div className="absolute top-0 bottom-0" style={{ right: 68, width: 1, background: 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* ── LOWER PILLAR + VOTE AREA ────────────────────────────────── */}
            <div className="flex" style={{ background: '#0a0a0a' }}>
              {/* Left pillar lower */}
              <div className="flex-shrink-0" style={{
                width: 34,
                background: '#141414',
                borderLeft: '2px solid #ffffff',
                borderRight: '1px solid rgba(255,255,255,0.12)',
              }} />

              {/* Vote bar section */}
              <div className="flex-1 min-w-0 px-4 py-3 space-y-2">
                <div className="flex" style={{ height: 5, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${bluePct}%` }} />
                  <div className="h-full bg-red-500 flex-1" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-400/60 tabular-nums">{bluePct}%</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/15">
                    {total} vote{total !== 1 ? 's' : ''} · tap to vote
                  </span>
                  <span className="text-[10px] font-black text-red-400/60 tabular-nums">{redPct}%</span>
                </div>
              </div>

              {/* Right pillar lower */}
              <div className="flex-shrink-0" style={{
                width: 34,
                background: '#141414',
                borderRight: '2px solid #ffffff',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
              }} />
            </div>

            {/* ── BASE RAIL ───────────────────────────────────────────────── */}
            <div className="-mx-1.5 h-[20px] flex items-center justify-center relative"
              style={{ background: '#141414' }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(255,255,255,0.25)' }} />
              <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: 'rgba(255,255,255,0.75)' }} />
              {/* Pillar base marks */}
              <div className="absolute top-0 bottom-0" style={{ left: 34, width: 34, borderLeft: '2px solid #ffffff', borderRight: '1px solid rgba(255,255,255,0.15)' }} />
              <div className="absolute top-0 bottom-0" style={{ right: 34, width: 34, borderRight: '2px solid #ffffff', borderLeft: '1px solid rgba(255,255,255,0.15)' }} />
              {/* Center gate emblem */}
              <Swords className="w-3 h-3 text-white/20" strokeWidth={2} />
            </div>

          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
