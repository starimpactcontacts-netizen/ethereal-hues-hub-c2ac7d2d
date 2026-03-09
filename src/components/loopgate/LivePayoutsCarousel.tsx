import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Payout {
  id: string;
  username: string;
  avatar_url: string | null;
  earned_cents: number;
  created_at: string;
  bounty_title?: string;
}

export default function LivePayoutsCarousel() {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      const { data } = await supabase
        .from('commission_submissions')
        .select('id, username, avatar_url, earned_cents, created_at, commission_id')
        .gt('earned_cents', 0)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(12);

      if (data) setPayouts(data as Payout[]);
    };

    fetchPayouts();

    const channel = supabase
      .channel('live-payouts-carousel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'commission_submissions',
        filter: 'earned_cents=gt.0',
      }, (payload) => {
        const newPayout = payload.new as Payout;
        if (newPayout.earned_cents > 0) {
          setPayouts(prev => [newPayout, ...prev.slice(0, 11)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (payouts.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Header with live badge */}
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-[11px] font-black text-foreground uppercase tracking-wider">
            Live Payouts
          </span>
          <div className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
        <span className="text-[9px] text-muted-foreground font-medium">{payouts.length} recent</span>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-1">
          {payouts.map((payout, idx) => (
            <motion.div
              key={payout.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="shrink-0 w-[180px] relative group"
            >
              {/* Stake-style card with glow */}
              <div className="relative overflow-hidden rounded-lg border border-emerald-500/10 bg-gradient-to-br from-black via-emerald-950/5 to-black backdrop-blur-sm">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                
                {/* Content */}
                <div className="relative p-3 space-y-2">
                  {/* User row */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 border border-emerald-500/20 ring-1 ring-emerald-500/10">
                      <AvatarImage src={payout.avatar_url || ''} />
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        {payout.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">
                        {payout.username}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Payout amount - big and bold */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-black text-emerald-400 leading-none tabular-nums" 
                      style={{ 
                        textShadow: '0 0 20px rgba(52, 211, 153, 0.3), 0 0 40px rgba(52, 211, 153, 0.1)',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                      ${(payout.earned_cents / 100).toFixed(2)}
                    </span>
                    <TrendingUp className="w-3 h-3 text-emerald-400/60 mb-0.5" />
                  </div>

                  {/* Type badge */}
                  <div className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-wider">
                      Mission
                    </span>
                  </div>
                </div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
              </div>

              {/* Outer glow effect on hover */}
              <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:via-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-500 -z-10 blur-xl opacity-0 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-2 px-4 flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Total paid:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              ${(payouts.reduce((sum, p) => sum + p.earned_cents, 0) / 100).toFixed(2)}
            </span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Avg:</span>
            <span className="text-foreground font-bold tabular-nums">
              ${(payouts.reduce((sum, p) => sum + p.earned_cents, 0) / payouts.length / 100).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Last 24h</span>
        </div>
      </div>
    </div>
  );
}
