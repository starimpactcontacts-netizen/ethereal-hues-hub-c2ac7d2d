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
        const pick = rows[Math.floor(Math.random() * rows.length)];
        setCurrent(pick);
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
    const pick = others[Math.floor(Math.random() * others.length)];
    setCurrent(pick);
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
          <div className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-red-500">
            <Swords className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-[15px] font-black tracking-tight text-foreground uppercase">
            Battle Spotlight
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shuffle}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <Shuffle className="w-3 h-3" /> Shuffle
          </button>
          <Link
            to="/arena"
            className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <Link
            to={`/fight/${current.id}`}
            className="block rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, #0a0a0a 40%, rgba(239,68,68,0.06) 100%)' }}
          >
            {/* Blue/red top stripe */}
            <div className="h-[2px] bg-[linear-gradient(90deg,hsl(217_91%_60%),transparent_44%,transparent_56%,hsl(0_72%_51%))]" />

            {/* Players */}
            <div className="flex items-center px-4 py-4 gap-3">
              {/* Player 1 — blue */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <Avatar className="w-14 h-14 rounded-xl border-2 border-blue-500/40">
                  <AvatarImage src={current.player_1_avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-blue-500/10 text-blue-300 font-black rounded-xl">
                    {current.player_1_username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-bold text-white/80 truncate w-full text-center">{current.player_1_username}</span>
                <span className="text-[13px] font-black text-blue-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {votes.blue} <span className="text-[10px] text-blue-400/50 font-bold">VOTES</span>
                </span>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-[20px] font-black text-white/20" style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
              </div>

              {/* Player 2 — red */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <Avatar className="w-14 h-14 rounded-xl border-2 border-red-500/40">
                  <AvatarImage src={current.player_2_avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-red-500/10 text-red-300 font-black rounded-xl">
                    {current.player_2_username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-bold text-white/80 truncate w-full text-center">{current.player_2_username}</span>
                <span className="text-[13px] font-black text-red-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {votes.red} <span className="text-[10px] text-red-400/50 font-bold">VOTES</span>
                </span>
              </div>
            </div>

            {/* Vote bar */}
            <div className="px-4 pb-3 space-y-1.5">
              <div className="h-[3px] rounded-full overflow-hidden bg-white/[0.05] flex">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${bluePct}%` }} />
                <div className="h-full bg-red-500 flex-1" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-blue-400/60 tabular-nums">{bluePct}%</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
                  {total} vote{total !== 1 ? 's' : ''} · tap to vote
                </span>
                <span className="text-[9px] font-bold text-red-400/60 tabular-nums">{redPct}%</span>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
