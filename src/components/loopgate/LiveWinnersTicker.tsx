import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Winner {
  id: string;
  username: string;
  avatar_url: string | null;
  earned_cents: number;
  created_at: string;
}

export default function LiveWinnersTicker() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const fetchWinners = async () => {
      const { data } = await supabase
        .from('commission_submissions')
        .select('id, username, avatar_url, earned_cents, created_at')
        .gt('earned_cents', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setWinners(data as Winner[]);
    };

    fetchWinners();

    const channel = supabase
      .channel('live-winners')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'commission_submissions',
        filter: 'earned_cents=gt.0',
      }, (payload) => {
        const newWinner = payload.new as Winner;
        if (newWinner.earned_cents > 0) {
          setWinners(prev => [newWinner, ...prev.slice(0, 19)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (winners.length === 0) return null;

  const tickerItems = [...winners, ...winners];

  return (
    <div className="relative overflow-hidden bg-black/40 border border-white/[0.06] rounded-lg py-2">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent z-10 pointer-events-none" />
      
      <div className="flex items-center gap-1.5 px-3 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
        <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">Live Payouts</span>
      </div>

      <div className="flex animate-scroll-left">
        {tickerItems.map((winner, idx) => (
          <div
            key={`${winner.id}-${idx}`}
            className="flex items-center gap-2 px-4 shrink-0"
          >
            <Avatar className="h-6 w-6 border border-white/[0.08]">
              <AvatarImage src={winner.avatar_url || ''} />
              <AvatarFallback className="bg-white/[0.06] text-white/60 text-[10px]">
                {winner.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-foreground truncate max-w-[80px]">
                {winner.username}
              </span>
              <span className="text-[10px] font-bold text-foreground tabular-nums">
                <span className="text-gold">$</span>{(winner.earned_cents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
