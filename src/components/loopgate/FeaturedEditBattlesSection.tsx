import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Swords, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { QuickFight } from '@/hooks/useQuickFight';
import SmartUsername from './SmartUsername';

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
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {/* ── PLAYER PANELS ── */}
              <div className="flex relative">

                {/* Player 1 — muted blue block w/ dots */}
                <div className="relative flex-1 flex flex-col items-center pt-5 pb-4 px-3 gap-2 min-w-0"
                  style={{
                    background: '#1a2740',
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}>
                  <Avatar className="w-[68px] h-[68px] rounded-none relative z-10" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                    <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="rounded-none text-white font-black text-3xl"
                      style={{ fontFamily: 'Teko, sans-serif', background: '#101a2e' }}>
                      {current.player_1_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <SmartUsername
                    userId={current.player_1_id}
                    username={current.player_1_username || '?'}
                    className="relative z-10 text-[12px] font-black text-white/85 truncate w-full text-center uppercase tracking-wider"
                    style={{ fontFamily: 'Teko, sans-serif' }}
                  />
                  <span className="relative z-10 text-[48px] font-black text-white/90 tabular-nums leading-none"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {votes.blue}
                  </span>
                  <p className="relative z-10 text-[9px] font-black uppercase tracking-[0.22em] text-white/45">Votes</p>
                </div>

                {/* VS divider — chunky badge, sits centered */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <img
                    src="/vs-badge.png"
                    alt="VS"
                    style={{
                      width: 78,
                      height: 78,
                      objectFit: 'contain',
                      filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.6))',
                    }}
                  />
                </div>

                {/* Player 2 — muted red block w/ dots */}
                <div className="relative flex-1 flex flex-col items-center pt-5 pb-4 px-3 gap-2 min-w-0"
                  style={{
                    background: '#3a1a1a',
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <Avatar className="w-[68px] h-[68px] rounded-none relative z-10" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                    <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="rounded-none text-white font-black text-3xl"
                      style={{ fontFamily: 'Teko, sans-serif', background: '#2a1010' }}>
                      {current.player_2_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <SmartUsername
                    userId={current.player_2_id}
                    username={current.player_2_username || '?'}
                    className="relative z-10 text-[12px] font-black text-white/85 truncate w-full text-center uppercase tracking-wider"
                    style={{ fontFamily: 'Teko, sans-serif' }}
                  />
                  <span className="relative z-10 text-[48px] font-black text-white/90 tabular-nums leading-none"
                    style={{ fontFamily: 'Teko, sans-serif' }}>
                    {votes.red}
                  </span>
                  <p className="relative z-10 text-[9px] font-black uppercase tracking-[0.22em] text-white/45">Votes</p>
                </div>

              </div>

              {/* ── VOTE BAR ── */}
              <div className="px-3 py-3 space-y-2" style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full transition-all duration-700" style={{ width: `${bluePct}%`, background: '#3b6fb8' }} />
                  <div className="h-full flex-1" style={{ background: '#b84747' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-black tabular-nums" style={{ fontFamily: 'Teko, sans-serif', color: '#7a9bd1' }}>{bluePct}%</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                    {total} vote{total !== 1 ? 's' : ''} · tap to vote
                  </span>
                  <span className="text-[12px] font-black tabular-nums" style={{ fontFamily: 'Teko, sans-serif', color: '#d18585' }}>{redPct}%</span>
                </div>
              </div>

            </div>

          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
