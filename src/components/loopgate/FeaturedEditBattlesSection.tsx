import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Swords, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { QuickFight } from '@/hooks/useQuickFight';

const COL = 18; // pillar column width px

function PillarCol({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <div className="relative flex-shrink-0" style={{
      width: COL,
      background: isLeft
        ? 'linear-gradient(90deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.07) 100%)',
      borderLeft:  isLeft  ? '1px solid rgba(255,255,255,0.55)' : undefined,
      borderRight: !isLeft ? '1px solid rgba(255,255,255,0.55)' : undefined,
    }}>
      {/* Inner accent line */}
      <div className="absolute inset-y-0" style={{
        [isLeft ? 'left' : 'right']: 5,
        width: 1,
        background: 'rgba(255,255,255,0.13)',
      }} />
    </div>
  );
}

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
          red:  rows.filter(r => r.voted_for === current.player_2_id).length,
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
  const redPct  = 100 - bluePct;

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
              TORII GATE FRAME — structure from top to bottom:
                [SVG]  gakuzuka tablet + kasagi (double-line arch, overhangs)
                [HTML] shimagi beam  (double-line + bracket steps at pillars)
                [HTML] left col | player content | right col
                [HTML] nuki crossbar (spans full width)
                [HTML] left col | vote area | right col
                [HTML] base rail (pillar bracket widening at corners)
            */}

            {/* ── KASAGI ─────────────────────────────────────────────────────
                viewBox 0 0 500 60 at height:52px → scale 0.867/px
                Paths extend to x=-24/524 (overhang past card edges)          */}
            <svg viewBox="0 0 500 60" className="w-full block"
              style={{ height: 52, overflow: 'visible' }} preserveAspectRatio="none">

              {/* Gakuzuka: small raised tablet centered on kasagi top */}
              <rect x="212" y="4" width="76" height="15" fill="#141414" />
              <line x1="212" y1="4"  x2="288" y2="4"  stroke="rgba(255,255,255,0.72)" strokeWidth="1" />
              <line x1="212" y1="19" x2="288" y2="19" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
              <line x1="212" y1="4"  x2="212" y2="19" stroke="rgba(255,255,255,0.5)"  strokeWidth="1" />
              <line x1="288" y1="4"  x2="288" y2="19" stroke="rgba(255,255,255,0.5)"  strokeWidth="1" />
              <line x1="220" y1="8"  x2="280" y2="8"  stroke="rgba(255,255,255,0.14)" strokeWidth="1" />

              {/* Kasagi fill (dark body — drawn before strokes so strokes sit on top) */}
              <path
                d="M -24 22 C 8 10, 86 32, 146 35 L 354 35 C 414 32, 492 10, 524 22 L 524 52 C 492 50, 8 50, -24 52 Z"
                fill="#101010"
              />
              {/* Kasagi outer top edge — the defining upswept profile */}
              <path
                d="M -24 22 C 8 10, 86 32, 146 35 L 354 35 C 414 32, 492 10, 524 22"
                fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="1"
              />
              {/* Kasagi inner parallel line — depth / second layer */}
              <path
                d="M -12 26 C 12 14, 88 34, 148 37 L 352 37 C 412 34, 488 14, 512 26"
                fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"
              />
              {/* Soffit (underside) */}
              <path
                d="M -24 52 C 8 50, 492 50, 524 52"
                fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"
              />
              {/* Outer end caps */}
              <line x1="-24" y1="21" x2="-24" y2="53" stroke="rgba(255,255,255,0.62)" strokeWidth="1" />
              <line x1="524" y1="21" x2="524" y2="53" stroke="rgba(255,255,255,0.62)" strokeWidth="1" />
              {/* Inner end cap lines */}
              <line x1="-12" y1="25" x2="-12" y2="53" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
              <line x1="512" y1="25" x2="512" y2="53" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            </svg>

            {/* ── SHIMAGI ─────────────────────────────────────────────────────
                Sits flush below kasagi. Bracket step tabs at pillar positions. */}
            <div className="relative" style={{
              background: '#121212',
              borderLeft:  '1px solid rgba(255,255,255,0.55)',
              borderRight: '1px solid rgba(255,255,255,0.55)',
            }}>
              {/* Top edge */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.5)' }} />
              {/* Inner top line */}
              <div style={{ height: 1, marginTop: 3, background: 'rgba(255,255,255,0.14)' }} />
              {/* Body */}
              <div style={{ height: 8 }} />
              {/* Inner bottom line */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
              {/* Bottom edge */}
              <div style={{ height: 1, marginTop: 3, background: 'rgba(255,255,255,0.28)' }} />

              {/* Bracket step tabs — hang below shimagi at each pillar corner */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between pointer-events-none"
                style={{ height: 10 }}>
                <div style={{ width: COL + 6, borderRight: '1px solid rgba(255,255,255,0.32)', borderBottom: '1px solid rgba(255,255,255,0.18)' }} />
                <div style={{ width: COL + 6, borderLeft: '1px solid rgba(255,255,255,0.32)', borderBottom: '1px solid rgba(255,255,255,0.18)' }} />
              </div>
            </div>

            {/* ── PLAYER CONTENT ──────────────────────────────────────────────── */}
            <div className="flex" style={{ background: '#0a0a0a' }}>
              <PillarCol side="left" />

              <div className="flex-1 min-w-0 relative">
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.016) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />
                <div className="relative flex items-start pt-5 pb-4 px-3 gap-2">

                  {/* Player 1 */}
                  <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="absolute -inset-[2px] bg-blue-500/50" />
                      <Avatar className="relative w-[68px] h-[68px] rounded-none">
                        <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-none text-blue-300 font-black text-3xl"
                          style={{ fontFamily: 'Teko, sans-serif', background: '#080f1a' }}>
                          {current.player_1_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[11px] font-black text-white/75 truncate w-full text-center uppercase tracking-wider"
                      style={{ fontFamily: 'Teko, sans-serif' }}>
                      {current.player_1_username}
                    </p>
                    <div className="text-center leading-none">
                      <span className="text-[38px] font-black text-blue-400 tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif', lineHeight: 1 }}>
                        {votes.blue}
                      </span>
                      <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-400/30 mt-0.5">Votes</p>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex-shrink-0 flex items-center justify-center pt-8">
                    <span className="text-[22px] font-black leading-none"
                      style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(255,255,255,0.055)' }}>VS</span>
                  </div>

                  {/* Player 2 */}
                  <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="absolute -inset-[2px] bg-red-500/50" />
                      <Avatar className="relative w-[68px] h-[68px] rounded-none">
                        <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-none text-red-300 font-black text-3xl"
                          style={{ fontFamily: 'Teko, sans-serif', background: '#1a0808' }}>
                          {current.player_2_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[11px] font-black text-white/75 truncate w-full text-center uppercase tracking-wider"
                      style={{ fontFamily: 'Teko, sans-serif' }}>
                      {current.player_2_username}
                    </p>
                    <div className="text-center leading-none">
                      <span className="text-[38px] font-black text-red-400 tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif', lineHeight: 1 }}>
                        {votes.red}
                      </span>
                      <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-red-400/30 mt-0.5">Votes</p>
                    </div>
                  </div>

                </div>
              </div>

              <PillarCol side="right" />
            </div>

            {/* ── NUKI crossbar ───────────────────────────────────────────────── */}
            <div className="relative" style={{
              height: 11, background: '#121212',
              borderLeft:  '1px solid rgba(255,255,255,0.55)',
              borderRight: '1px solid rgba(255,255,255,0.55)',
            }}>
              <div className="absolute inset-x-0 top-0"    style={{ height: 1, background: 'rgba(255,255,255,0.38)' }} />
              <div className="absolute inset-x-0 bottom-0" style={{ height: 1, background: 'rgba(255,255,255,0.1)'  }} />
            </div>

            {/* ── VOTE AREA ───────────────────────────────────────────────────── */}
            <div className="flex" style={{ background: '#0a0a0a' }}>
              <PillarCol side="left" />

              <div className="flex-1 min-w-0 px-4 py-3 space-y-2">
                <div className="flex overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${bluePct}%` }} />
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

              <PillarCol side="right" />
            </div>

            {/* ── BASE RAIL ───────────────────────────────────────────────────── */}
            {/* Pillar bracket widening at each corner matches the reference      */}
            <div className="relative flex items-center justify-center" style={{ height: 16, background: '#121212' }}>
              <div className="absolute inset-x-0 top-0"    style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
              <div className="absolute inset-x-0 bottom-0" style={{ height: 1, background: 'rgba(255,255,255,0.45)' }} />
              {/* Left pillar base bracket */}
              <div className="absolute inset-y-0 left-0" style={{
                width: COL + 8,
                borderLeft:   '1px solid rgba(255,255,255,0.55)',
                borderRight:  '1px solid rgba(255,255,255,0.2)',
              }} />
              {/* Right pillar base bracket */}
              <div className="absolute inset-y-0 right-0" style={{
                width: COL + 8,
                borderRight: '1px solid rgba(255,255,255,0.55)',
                borderLeft:  '1px solid rgba(255,255,255,0.2)',
              }} />
              <Swords className="w-2.5 h-2.5 text-white/15" strokeWidth={1.5} />
            </div>

          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
