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
    supabase
      .from('quick_fights').select('*')
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

  return (
    <section className="px-4 mt-6">
      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-white/40" strokeWidth={2} />
          <h2 className="text-[13px] font-black tracking-[0.18em] text-white/60 uppercase"
            style={{ fontFamily: 'Teko, sans-serif' }}>
            Battle Spotlight
          </h2>
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          <Link to={`/fight/${current.id}`} className="block">

            {/*
              ┌─ TORII GATE FRAME ──────────────────────────────────────────┐
              │  Kasagi (top beam) — wider than pillars, extends ±12px       │
              │  Nuki (crossbar) — inset between pillars                     │
              │  Pillars — thick vertical structural elements, left + right  │
              │  Base rail — bottom horizontal element                       │
              └───────────────────────────────────────────────────────────── ┘
            */}

            {/* ── GATE OUTER WRAPPER ── breaks out 12px each side for pillars ── */}
            <div className="relative -mx-3">

              {/* ═══ KASAGI: top crossbeam — wider than everything, gold top edge ═══ */}
              <div className="relative h-[48px] flex items-center justify-center"
                style={{
                  background: '#111',
                  borderTop: '2px solid #f59e0b',
                  borderLeft: '2px solid #f59e0b',
                  borderRight: '2px solid #f59e0b',
                }}>
                {/* Kasagi soffit underline (second beam visual) */}
                <div className="absolute bottom-0 inset-x-[14px] h-[6px]"
                  style={{ background: '#0d0d0d', borderTop: '1px solid rgba(245,158,11,0.25)' }} />
                {/* Kasagi end tabs — the characteristic horizontal extension caps */}
                <div className="absolute left-0 bottom-0 w-[14px] h-[6px]"
                  style={{ background: '#1a1a1a', borderTop: '1px solid rgba(245,158,11,0.15)', borderRight: '1px solid rgba(245,158,11,0.15)' }} />
                <div className="absolute right-0 bottom-0 w-[14px] h-[6px]"
                  style={{ background: '#1a1a1a', borderTop: '1px solid rgba(245,158,11,0.15)', borderLeft: '1px solid rgba(245,158,11,0.15)' }} />
                {/* Center plaque */}
                <div className="relative flex items-center gap-2 px-4 h-[30px]"
                  style={{ background: '#0a0a0a', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Swords className="w-3.5 h-3.5 text-gold/60" strokeWidth={2} />
                  <span className="text-[11px] font-black tracking-[0.22em] text-gold/70 uppercase"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    Battle Spotlight
                  </span>
                </div>
              </div>

              {/* ═══ NUKI: second crossbar — inset, narrower ═══ */}
              <div className="mx-[14px] h-[10px]"
                style={{
                  background: '#0f0f0f',
                  borderLeft: '1px solid rgba(245,158,11,0.2)',
                  borderRight: '1px solid rgba(245,158,11,0.2)',
                  borderBottom: '1px solid rgba(245,158,11,0.15)',
                }} />

              {/* ═══ PILLAR + CONTENT ROW ═══ */}
              <div className="relative flex">

                {/* LEFT PILLAR */}
                <div className="w-[14px] flex-shrink-0"
                  style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                    borderLeft: '2px solid #f59e0b',
                    borderRight: '1px solid rgba(245,158,11,0.2)',
                  }}>
                  {/* Pillar highlight edge */}
                  <div className="w-[2px] h-full ml-[2px]"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)' }} />
                </div>

                {/* INNER CONTENT — the "gate opening" */}
                <div className="flex-1 min-w-0" style={{ background: '#080808' }}>
                  {/* Dot grid inside the gate */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }} />

                  {/* Players */}
                  <div className="relative flex items-start pt-5 pb-2 px-4 gap-3">

                    {/* Player 1 */}
                    <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <div className="relative">
                        <div className="absolute -inset-[2px]"
                          style={{ background: '#3b82f6', opacity: 0.5 }} />
                        <Avatar className="relative w-[68px] h-[68px] rounded-none border-0">
                          <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                          <AvatarFallback className="rounded-none text-blue-300 font-black text-2xl"
                            style={{ fontFamily: 'Teko, sans-serif', background: '#0c1829' }}>
                            {current.player_1_username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-[11px] font-black text-white/80 truncate w-full text-center tracking-wider uppercase"
                        style={{ fontFamily: 'Teko, sans-serif' }}>
                        {current.player_1_username}
                      </p>
                      <div className="flex flex-col items-center">
                        <span className="text-[36px] font-black text-blue-400 leading-none tabular-nums"
                          style={{ fontFamily: 'Teko, sans-serif' }}>
                          {votes.blue}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-400/35">Votes</span>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center justify-center pt-7 shrink-0">
                      <span className="text-[30px] font-black text-white/15 leading-none"
                        style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '-0.02em' }}>
                        VS
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <div className="relative">
                        <div className="absolute -inset-[2px]"
                          style={{ background: '#ef4444', opacity: 0.5 }} />
                        <Avatar className="relative w-[68px] h-[68px] rounded-none border-0">
                          <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                          <AvatarFallback className="rounded-none text-red-300 font-black text-2xl"
                            style={{ fontFamily: 'Teko, sans-serif', background: '#1a0808' }}>
                            {current.player_2_username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-[11px] font-black text-white/80 truncate w-full text-center tracking-wider uppercase"
                        style={{ fontFamily: 'Teko, sans-serif' }}>
                        {current.player_2_username}
                      </p>
                      <div className="flex flex-col items-center">
                        <span className="text-[36px] font-black text-red-400 leading-none tabular-nums"
                          style={{ fontFamily: 'Teko, sans-serif' }}>
                          {votes.red}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-red-400/35">Votes</span>
                      </div>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="relative px-4 pb-4 pt-1 space-y-2">
                    <div className="h-[4px] flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
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
                </div>

                {/* RIGHT PILLAR */}
                <div className="w-[14px] flex-shrink-0 flex justify-end"
                  style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
                    borderRight: '2px solid #f59e0b',
                    borderLeft: '1px solid rgba(245,158,11,0.2)',
                  }}>
                  <div className="w-[2px] h-full mr-[2px]"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)' }} />
                </div>
              </div>

              {/* ═══ BASE RAIL: bottom horizontal element ═══ */}
              <div className="relative h-[24px] flex items-center justify-center"
                style={{
                  background: '#111',
                  borderBottom: '2px solid #f59e0b',
                  borderLeft: '2px solid #f59e0b',
                  borderRight: '2px solid #f59e0b',
                }}>
                {/* Rail top line */}
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: 'rgba(245,158,11,0.15)' }} />
                {/* Center torii emblem */}
                <div className="w-[32px] h-[14px] flex items-center justify-center"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(245,158,11,0.25)',
                    clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0% 50%)',
                  }}>
                  <Swords className="w-2.5 h-2.5 text-gold/40" strokeWidth={2} />
                </div>
              </div>

            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
