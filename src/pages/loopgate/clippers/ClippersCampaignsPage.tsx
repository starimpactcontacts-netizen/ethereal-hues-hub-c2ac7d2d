import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useRealEvents, getEventSlug } from '@/hooks/useRealData';

export default function ClippersCampaignsPage() {
  const navigate = useNavigate();
  const { events } = useRealEvents();
  const [poster, setPoster] = useState<string | null>(null);

  const liveEvent = events?.find((e) => e.status === 'live') || events?.[0] || null;
  const target = liveEvent ? `/event/${getEventSlug(liveEvent)}` : '/arena';

  useEffect(() => {
    if (liveEvent?.poster_url) setPoster(liveEvent.poster_url);
  }, [liveEvent?.poster_url]);

  // Best-effort prefetch of the latest live event for fallback when the hook lags
  useEffect(() => {
    if (liveEvent) return;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('poster_url')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.poster_url) setPoster(data.poster_url);
    })();
  }, [liveEvent]);

  const go = () => navigate(target);

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-12">
      {/* Headline */}
      <div className="text-center mb-5">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">New</span>
        </span>
        <h1
          className="mt-3 text-[44px] leading-[0.92] font-black text-white tracking-tight uppercase"
          style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
        >
          Missions Are Now<br />
          <span className="text-emerald-400">Competitions</span>
        </h1>
        <p className="mt-3 text-[13px] text-white/60 leading-snug max-w-[320px] mx-auto">
          Paid drops moved into the live competition format — submit your edit, climb the QOI ranks, win the prize pool.
        </p>
      </div>

      {/* Big tap-to-enter card */}
      <motion.button
        onClick={go}
        whileTap={{ scale: 0.98 }}
        className="relative block w-full overflow-hidden rounded-2xl bg-black text-left"
        style={{
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.08) inset, 0 24px 60px -28px rgba(16,185,129,0.6), 0 0 80px -40px rgba(239,68,68,0.45)',
        }}
      >
        <div className="relative aspect-[16/10] w-full">
          {poster ? (
            <img
              src={poster}
              alt={liveEvent?.title || 'Live competition'}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: '50% 32%' }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-black to-red-600/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

          {/* Live badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500 shadow-[0_0_22px_rgba(239,68,68,0.7)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white">Live Comp</span>
          </div>

          {/* Bottom info */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
              <Trophy className="w-3 h-3 text-emerald-400" />
              {liveEvent ? 'Now Live' : 'Open Arena'}
            </div>
            <h2
              className="mt-1 text-[28px] leading-[0.95] font-black text-white tracking-tight uppercase line-clamp-2"
              style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
            >
              {liveEvent?.title?.toUpperCase() || 'Enter The Arena'}
            </h2>

            <div className="mt-3 inline-flex items-center gap-2 px-3 h-10 rounded-md bg-emerald-400 text-black text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_24px_rgba(16,185,129,0.55)]">
              Enter Comp
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={3.5} />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Footnote */}
      <p className="mt-5 text-center text-[11px] text-white/40 leading-snug">
        Old missions dashboard retired. Tap the card above to enter the live competition.
      </p>
    </div>
  );
}
