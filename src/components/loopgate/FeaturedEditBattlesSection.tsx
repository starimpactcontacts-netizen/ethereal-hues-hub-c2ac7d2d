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
      .from('quick_fights')
      .select('*')
      .eq('status', 'completed')
      .eq('is_private', false)
      .not('player_1_submission_url', 'is', null)
      .not('player_2_submission_url', 'is', null)
      .not('player_2_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const rows = (data as QuickFight[]) || [];
        if (rows.length === 0) return;
        setPool(rows);
        setCurrent(rows[Math.floor(Math.random() * rows.length)]);
      });
  }, []);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    supabase
      .from('quick_fight_votes')
      .select('voted_for')
      .eq('fight_id', current.id)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)', clipPath: 'polygon(12% 0%, 88% 0%, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0% 88%, 0% 12%)' }}>
            <Swords className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-black tracking-[0.12em] text-foreground uppercase"
            style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.12em' }}>
            Battle Spotlight
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={shuffle}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors"
          >
            <Shuffle className="w-3 h-3" /> Shuffle
          </button>
          <Link
            to="/arena"
            className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Link to={`/fight/${current.id}`} className="block">
            {/* ── GATE FRAME WRAPPER ─────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ background: '#0a0a0a' }}>

              {/* ── TOP CROSSBEAM (torii kasagi) ── */}
              <div className="relative h-[36px] flex items-center" style={{
                background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                {/* Blue left beam */}
                <div className="absolute left-0 top-0 bottom-0 right-1/2"
                  style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.25) 0%, transparent 100%)' }} />
                {/* Red right beam */}
                <div className="absolute right-0 top-0 bottom-0 left-1/2"
                  style={{ background: 'linear-gradient(270deg, rgba(239,68,68,0.25) 0%, transparent 100%)' }} />
                {/* Top edge lines */}
                <div className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 30%, transparent 48%, transparent 52%, #dc2626 70%, #ef4444 100%)' }} />
                {/* Left angled corner accent */}
                <div className="absolute left-0 top-0 w-8 h-full border-r border-blue-500/20" />
                <div className="absolute right-0 top-0 w-8 h-full border-l border-red-500/20" />
                {/* Center gate icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1"
                    style={{ background: 'rgba(0,0,0,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                    <Swords className="w-3.5 h-3.5 text-white/50" strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* ── MAIN ARENA AREA ── */}
              <div className="relative">
                {/* Side column glows */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ background: 'linear-gradient(180deg, #3b82f6 0%, rgba(59,130,246,0.3) 60%, transparent 100%)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-[3px]"
                  style={{ background: 'linear-gradient(180deg, #ef4444 0%, rgba(239,68,68,0.3) 60%, transparent 100%)' }} />

                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }} />

                {/* Blue / Red ambient glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 40% 60% at 20% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 40% 60% at 80% 50%, rgba(239,68,68,0.07) 0%, transparent 70%)' }} />

                {/* Players */}
                <div className="relative flex items-center px-5 pt-5 pb-3 gap-2">

                  {/* Player 1 */}
                  <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                    <div className="relative">
                      {/* Outer glow ring */}
                      <div className="absolute -inset-[3px] rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, transparent)', opacity: 0.6 }} />
                      <Avatar className="relative w-[72px] h-[72px] rounded-xl border-0">
                        <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-blue-950 text-blue-300 font-black text-2xl"
                          style={{ fontFamily: 'Teko, sans-serif' }}>
                          {current.player_1_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[12px] font-black text-white/90 truncate w-full text-center tracking-wide"
                      style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.06em' }}>
                      {current.player_1_username}
                    </p>
                    <div className="text-center">
                      <span className="text-[28px] font-black text-blue-400 leading-none tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif' }}>
                        {votes.blue}
                      </span>
                      <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-blue-400/40 mt-0.5">Votes</span>
                    </div>
                  </div>

                  {/* VS center */}
                  <div className="flex flex-col items-center gap-1 shrink-0 px-1">
                    <div className="relative">
                      {/* VS background diamond */}
                      <div className="absolute inset-0 rotate-45 opacity-15"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }} />
                      <span className="relative text-[32px] font-black leading-none text-white/70"
                        style={{
                          fontFamily: 'Teko, sans-serif',
                          letterSpacing: '-0.02em',
                          WebkitTextStroke: '1px rgba(255,255,255,0.08)',
                        }}>
                        VS
                      </span>
                    </div>
                    {/* Vertical divider lines */}
                    <div className="w-px h-4 bg-gradient-to-b from-blue-500/30 to-transparent" />
                  </div>

                  {/* Player 2 */}
                  <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="absolute -inset-[3px] rounded-xl"
                        style={{ background: 'linear-gradient(135deg, transparent, #ef4444)', opacity: 0.6 }} />
                      <Avatar className="relative w-[72px] h-[72px] rounded-xl border-0">
                        <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-red-950 text-red-300 font-black text-2xl"
                          style={{ fontFamily: 'Teko, sans-serif' }}>
                          {current.player_2_username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[12px] font-black text-white/90 truncate w-full text-center"
                      style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.06em' }}>
                      {current.player_2_username}
                    </p>
                    <div className="text-center">
                      <span className="text-[28px] font-black text-red-400 leading-none tabular-nums"
                        style={{ fontFamily: 'Teko, sans-serif' }}>
                        {votes.red}
                      </span>
                      <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-red-400/40 mt-0.5">Votes</span>
                    </div>
                  </div>
                </div>

                {/* Vote bar + footer */}
                <div className="relative px-4 pb-4 space-y-2 mt-1">
                  {/* Bar track */}
                  <div className="relative h-[5px] bg-white/[0.04] overflow-hidden">
                    {/* Blue fill */}
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-700"
                      style={{
                        width: `${bluePct}%`,
                        background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                        boxShadow: '0 0 8px rgba(59,130,246,0.6)',
                      }}
                    />
                    {/* Red fill */}
                    <div
                      className="absolute right-0 top-0 h-full transition-all duration-700"
                      style={{
                        width: `${redPct}%`,
                        background: 'linear-gradient(270deg, #dc2626, #ef4444)',
                        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                      }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-400/70 tabular-nums">{bluePct}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">
                      {total} vote{total !== 1 ? 's' : ''} · tap to vote
                    </span>
                    <span className="text-[10px] font-black text-red-400/70 tabular-nums">{redPct}%</span>
                  </div>
                </div>
              </div>

              {/* ── BOTTOM GATE RAIL ── */}
              <div className="h-[28px] flex items-center justify-center relative"
                style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Bottom rail line */}
                <div className="absolute inset-x-0 bottom-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 20%, transparent 48%, transparent 52%, rgba(239,68,68,0.4) 80%, transparent 100%)' }} />
                {/* Center emblem */}
                <div className="relative w-8 h-5 flex items-center justify-center">
                  <div className="absolute inset-0"
                    style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.06)', clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)' }} />
                  <Swords className="relative w-3 h-3 text-white/30" strokeWidth={2} />
                </div>
              </div>

              {/* Left/right corner notch marks */}
              <div className="absolute top-[36px] left-[3px] w-4 h-px bg-blue-500/30" />
              <div className="absolute top-[36px] right-[3px] w-4 h-px bg-red-500/30" />
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
