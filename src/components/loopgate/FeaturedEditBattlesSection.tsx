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

  // Pillar hairlines: CSS left/right border on content divs.
  // SVG handles only the kasagi arch — no chunky pillar blocks.
  const pillar = '1px solid rgba(255,255,255,0.5)';
  const pillarFaint = '1px solid rgba(255,255,255,0.12)';

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

            {/* ── KASAGI: torii top beam, upswept ends ─────────────────────── */}
            {/* viewBox 0 0 500 80, displayed at 54px → y-scale 0.675           */}
            {/* End caps land at x=0/500 = card left/right edges                */}
            <div className="overflow-visible">
              <svg viewBox="0 0 500 80" className="w-full block"
                style={{ height: 54, overflow: 'visible' }} preserveAspectRatio="none">
                {/* Fill drawn first so stroke renders on top */}
                <path
                  d="M 0 26 C 25 13, 95 36, 155 39 L 345 39 C 405 36, 475 13, 500 26 L 500 54 C 470 52, 30 52, 0 54 Z"
                  fill="#0e0e0e"
                />
                {/* Top edge — the upswept kasagi profile */}
                <path
                  d="M 0 26 C 25 13, 95 36, 155 39 L 345 39 C 405 36, 475 13, 500 26"
                  fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1"
                />
                {/* Soffit (underside) — faint */}
                <path
                  d="M 0 54 C 30 52, 470 52, 500 54"
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                />
                {/* End caps — align with card left/right edges = pillar positions */}
                <line x1="0" y1="25" x2="0" y2="55" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
                <line x1="500" y1="25" x2="500" y2="55" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
              </svg>
            </div>

            {/* ── SHIMAGI: second flat beam ──────────────────────────────────── */}
            <div style={{ borderLeft: pillar, borderRight: pillar, background: '#0e0e0e' }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.45)' }} />
              <div style={{ height: 12, background: '#131313' }} />
              <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
              {/* Bracket ear tabs at left/right pillar junction */}
              <div className="relative" style={{ height: 8, background: '#0e0e0e' }}>
                <div className="absolute left-0 top-0 bottom-0" style={{ width: 14, borderBottom: '1px solid rgba(255,255,255,0.3)', borderRight: '1px solid rgba(255,255,255,0.2)' }} />
                <div className="absolute right-0 top-0 bottom-0" style={{ width: 14, borderBottom: '1px solid rgba(255,255,255,0.3)', borderLeft: '1px solid rgba(255,255,255,0.2)' }} />
              </div>
            </div>

            {/* ── PLAYER CONTENT ─────────────────────────────────────────────── */}
            <div className="relative" style={{ borderLeft: pillar, borderRight: pillarFaint, background: '#0a0a0a' }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
              <div className="relative flex items-start pt-5 pb-4 px-4 gap-2">

                {/* Player 1 */}
                <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="relative">
                    <div className="absolute -inset-[2px] bg-blue-500 opacity-50" />
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
                  <span className="text-[22px] font-black text-white/[0.055] leading-none"
                    style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
                </div>

                {/* Player 2 */}
                <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="relative">
                    <div className="absolute -inset-[2px] bg-red-500 opacity-50" />
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

            {/* ── NUKI: crossbar spanning full width ──────────────────────────── */}
            <div className="relative" style={{ height: 11, background: '#111111' }}>
              <div className="absolute inset-x-0 top-0" style={{ height: 1, background: 'rgba(255,255,255,0.38)' }} />
              <div className="absolute inset-x-0 bottom-0" style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* ── VOTE AREA ──────────────────────────────────────────────────── */}
            <div className="relative" style={{ borderLeft: pillar, borderRight: pillarFaint, background: '#0a0a0a' }}>
              <div className="px-4 py-3 space-y-2">
                <div className="flex overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.04)' }}>
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

            {/* ── BASE RAIL ───────────────────────────────────────────────────── */}
            <div className="h-4 flex items-center justify-center relative"
              style={{ background: '#111111' }}>
              <div className="absolute inset-x-0 top-0" style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />
              <div className="absolute inset-x-0 bottom-0" style={{ height: 1, background: 'rgba(255,255,255,0.45)' }} />
              <Swords className="w-2.5 h-2.5 text-white/15" strokeWidth={1.5} />
            </div>

          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
