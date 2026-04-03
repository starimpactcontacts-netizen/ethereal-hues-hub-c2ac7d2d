import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

type PayoutRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  earned_cents: number;
  created_at: string;
  judged_at: string | null;
  rating: string | null;
  drop_id: string | null;
};

type DropInfo = { title: string; poster_url: string | null };

type Payout = PayoutRow & {
  drop_title: string | null;
  drop_poster: string | null;
};

const teko = { fontFamily: 'Teko, sans-serif' };

export default function LivePayoutsCarousel() {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    let mounted = true;

    const hydrateDropInfo = async (rows: PayoutRow[]) => {
      const dropIds = [...new Set(rows.map((r) => r.drop_id).filter(Boolean))] as string[];
      if (dropIds.length === 0) return new Map<string, DropInfo>();

      const { data } = await supabase
        .from("featured_drops")
        .select("id, title, poster_url")
        .in("id", dropIds);

      return new Map(
        (data || []).map((d: any) => [d.id, { title: d.title, poster_url: d.poster_url }] as const),
      );
    };

    const fetchPayouts = async () => {
      const { data } = await supabase
        .from("featured_submissions")
        .select("id, username, avatar_url, earned_cents, created_at, judged_at, rating, drop_id")
        .gt("earned_cents", 0)
        .order("created_at", { ascending: false })
        .limit(12);

      const rows = (data || []) as unknown as PayoutRow[];
      const dropMap = await hydrateDropInfo(rows);

      const next: Payout[] = rows.map((r) => {
        const info = r.drop_id ? dropMap.get(r.drop_id) : undefined;
        return {
          ...r,
          drop_title: info?.title ?? null,
          drop_poster: info?.poster_url ?? null,
        };
      });

      if (mounted) setPayouts(next);
    };

    fetchPayouts();

    const channel = supabase
      .channel("live-payouts-carousel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "featured_submissions", filter: "earned_cents=gt.0" },
        async (payload) => {
          const row = payload.new as unknown as PayoutRow;
          if (!row?.earned_cents || row.earned_cents <= 0) return;

          let drop_title: string | null = null;
          let drop_poster: string | null = null;
          if (row.drop_id) {
            const { data } = await supabase
              .from("featured_drops")
              .select("id, title, poster_url")
              .eq("id", row.drop_id)
              .maybeSingle();
            drop_title = data?.title ?? null;
            drop_poster = (data as any)?.poster_url ?? null;
          }

          const next: Payout = { ...row, drop_title, drop_poster };
          setPayouts((prev) => [next, ...prev.filter((p) => p.id !== next.id)].slice(0, 12));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const totalCents = useMemo(() => payouts.reduce((sum, p) => sum + (p.earned_cents || 0), 0), [payouts]);
  const avgCents = payouts.length > 0 ? totalCents / payouts.length : 0;

  if (payouts.length === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-4">
          <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Live Payouts</span>
        </div>
        <div className="px-4">
          <div className="rounded-lg border border-border/40 bg-surface-1/40 p-3">
            <p className="text-xs text-muted-foreground">No payouts yet — once a Feature is judged with earnings, it will appear here in real time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-black text-foreground uppercase tracking-wider" style={teko}>Live Payouts</span>
        </div>
        <span className="text-[9px] text-muted-foreground">{payouts.length} recent</span>
      </div>

      {/* Cards carousel */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {payouts.map((payout, idx) => (
          <PayoutCard key={payout.id} payout={payout} idx={idx} />
        ))}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 px-4 mt-2 text-[9px] text-muted-foreground">
        <span>Total paid: <span className="text-emerald-400 font-bold">${(totalCents / 100).toFixed(2)}</span></span>
        <span className="text-border/30">|</span>
        <span>Avg: <span className="text-foreground/60 font-bold">${(avgCents / 100).toFixed(2)}</span></span>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          <span className="font-bold">Recent</span>
        </div>
      </div>
    </div>
  );
}

function PayoutCard({ payout, idx }: { payout: Payout; idx: number }) {
  const amount = (payout.earned_cents / 100).toFixed(2);
  const timeAgo = formatDistanceToNow(new Date(payout.judged_at || payout.created_at), { addSuffix: false });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="shrink-0 w-[200px] snap-start relative overflow-hidden rounded-lg group"
      style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Background — poster or gradient */}
      {payout.drop_poster ? (
        <img
          src={payout.drop_poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-[1.05] group-hover:scale-[1.1] transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-black to-black" />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="absolute inset-0 rounded-lg border border-white/[0.08] group-hover:border-emerald-400/20 transition-colors duration-300" />

      {/* Content */}
      <div className="relative p-2.5 flex flex-col h-[130px] justify-between">
        {/* Top — user info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-white/[0.15]">
            <AvatarImage src={payout.avatar_url || ""} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
              {payout.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="text-[13px] font-bold text-white truncate block">{payout.username}</span>
            <span className="text-[9px] text-white/40">{timeAgo} ago</span>
          </div>
        </div>

        {/* Center — big money */}
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-black text-emerald-400 leading-none tabular-nums tracking-tight" style={teko}>
            ${amount}
          </span>
          <TrendingUp className="w-4 h-4 text-emerald-400/60 mb-1" />
        </div>

        {/* Bottom — drop info + rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <Zap className="w-3 h-3 text-gold shrink-0" />
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider truncate">
              {payout.drop_title || "Feature"}
            </span>
          </div>
          {payout.rating && (
            <div className="flex flex-col items-center ml-2 shrink-0">
              <span className="text-sm font-black text-white/30 leading-none" style={teko}>{payout.rating}</span>
              <span className="text-[6px] font-bold text-white/15 uppercase tracking-[0.15em]">Rank</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
