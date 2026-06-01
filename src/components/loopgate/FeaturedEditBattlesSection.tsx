import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Swords, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { QuickFight } from '@/hooks/useQuickFight';

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const t = pos[0] === 't', l = pos[1] === 'l';
  return (
    <div className="absolute pointer-events-none" style={{
      [t ? 'top' : 'bottom']: 0, [l ? 'left' : 'right']: 0, width: 12, height: 12,
    }}>
      <div style={{ position: 'absolute', [t ? 'top' : 'bottom']: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.5)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, [l ? 'left' : 'right']: 0, width: 1, background: 'rgba(255,255,255,0.5)' }} />
    </div>
  );
}

export default function FeaturedEditBattlesSection() {
  const [pool, setPool]       = useState<QuickFight[]>([]);
  const [current, setCurrent] = useState<QuickFight | null>(null);
  const [votes, setVotes]     = useState({ blue: 0, red: 0 });
  const [key, setKey]         = useState(0);

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

  const total   = votes.blue + votes.red;
  const bluePct = total === 0 ? 50 : Math.round((votes.blue / total) * 100);
  const redPct  = 100 - bluePct;

  return (
    <section className="px-4 mt-6">

      {/* Row header */}
      <div className="flex items-center justify-between mb-3">
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

            <div className="relative overflow-hidden" style={{
              background: '#0c0c0c',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {/* Corner bracket marks */}
              <Corner pos="tl" /><Corner pos="tr" />
              <Corner pos="bl" /><Corner pos="br" />

              {/* Top accent strip: blue → white → red */}
              <div style={{ height: 2, background: 'linear-gradient(90deg, #3b82f6 0%, rgba(255,255,255,0.15) 50%, #ef4444 100%)' }} />

              {/* ── PLAYER PANELS ── */}
              <div className="flex relative">

                {/* Left edge glow (blue) */}
                <div className="absolute left-0 inset-y-0 pointer-events-none" style={{ width: 2, background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.55), transparent)' }} />
                {/* Right edge glow (red) */}
                <div className="absolute right-0 inset-y-0 pointer-events-none" style={{ width: 2, background: 'linear-gradient(to bottom, transparent, rgba(239,68,68,0.55), transparent)' }} />

                {/* Player 1 */}
                <div className="flex-1 flex flex-col items-center pt-5 pb-4 px-3 gap-1.5 min-w-0"
                  style={{ background: 'linear-gradient(150deg, rgba(59,130,246,0.06) 0%, transparent 55%)' }}>
                  <div className="relative">
                    <div className="absolute -inset-[2px] bg-blue-500/50" />
                    <Avatar className="relative w-[64px] h-[64px] rounded-none">
                      <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="rounded-none text-blue-300 font-black text-3xl"
                        style={{ fontFamily: 'Teko, sans-serif', background: '#070e1c' }}>
                        {current.player_1_username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-[11px] font-black text-white/80 truncate w-full text-center uppercase tracking-wider mt-1"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {current.player_1_username}
                  </p>
                  <span className="text-[44px] font-black text-blue-400 tabular-nums leading-none"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {votes.blue}
                  </span>
                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-blue-400/35">Votes</p>
                </div>

                {/* VS divider */}
                <div className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 38, borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[18px] font-black tracking-widest"
                    style={{ fontFamily: 'Teko, sans-serif', color: 'rgba(255,255,255,0.1)' }}>VS</span>
                </div>

                {/* Player 2 */}
                <div className="flex-1 flex flex-col items-center pt-5 pb-4 px-3 gap-1.5 min-w-0"
                  style={{ background: 'linear-gradient(210deg, rgba(239,68,68,0.06) 0%, transparent 55%)' }}>
                  <div className="relative">
                    <div className="absolute -inset-[2px] bg-red-500/50" />
                    <Avatar className="relative w-[64px] h-[64px] rounded-none">
                      <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="rounded-none text-red-300 font-black text-3xl"
                        style={{ fontFamily: 'Teko, sans-serif', background: '#1c0707' }}>
                        {current.player_2_username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-[11px] font-black text-white/80 truncate w-full text-center uppercase tracking-wider mt-1"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {current.player_2_username}
                  </p>
                  <span className="text-[44px] font-black text-red-400 tabular-nums leading-none"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {votes.red}
                  </span>
                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-red-400/35">Votes</p>
                </div>

              </div>

              {/* Section divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

              {/* ── VOTE BAR ── */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex overflow-hidden" style={{ height: 5, background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${bluePct}%` }} />
                  <div className="h-full bg-red-500 flex-1" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-400/70 tabular-nums">{bluePct}%</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/18">
                    {total} vote{total !== 1 ? 's' : ''} · tap to vote
                  </span>
                  <span className="text-[11px] font-black text-red-400/70 tabular-nums">{redPct}%</span>
                </div>
              </div>

            </div>

          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
