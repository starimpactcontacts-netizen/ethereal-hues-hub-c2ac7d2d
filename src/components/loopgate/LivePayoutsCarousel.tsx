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

type Payout = PayoutRow & {
  drop_title: string | null;
};

export default function LivePayoutsCarousel() {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    let mounted = true;

    const hydrateDropTitles = async (rows: PayoutRow[]) => {
      const dropIds = [...new Set(rows.map((r) => r.drop_id).filter(Boolean))] as string[];
      if (dropIds.length === 0) return new Map<string, string>();

      const { data } = await supabase
        .from("featured_drops")
        .select("id, title")
        .in("id", dropIds);

      return new Map((data || []).map((d) => [d.id, d.title] as const));
    };

    const fetchPayouts = async () => {
      const { data } = await supabase
        .from("featured_submissions")
        .select("id, username, avatar_url, earned_cents, created_at, judged_at, rating, drop_id")
        .gt("earned_cents", 0)
        .order("created_at", { ascending: false })
        .limit(12);

      const rows = (data || []) as unknown as PayoutRow[];
      const dropMap = await hydrateDropTitles(rows);

      const next: Payout[] = rows.map((r) => ({
        ...r,
        drop_title: r.drop_id ? dropMap.get(r.drop_id) ?? null : null,
      }));

      if (mounted) setPayouts(next);
    };

    fetchPayouts();

    const channel = supabase
      .channel("live-payouts-carousel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "featured_submissions",
          filter: "earned_cents=gt.0",
        },
        async (payload) => {
          const row = payload.new as unknown as PayoutRow;
          if (!row?.earned_cents || row.earned_cents <= 0) return;

          let drop_title: string | null = null;
          if (row.drop_id) {
            const { data } = await supabase
              .from("featured_drops")
              .select("id, title")
              .eq("id", row.drop_id)
              .maybeSingle();
            drop_title = data?.title ?? null;
          }

          const next: Payout = { ...row, drop_title };
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
  const avgCents = useMemo(() => (payouts.length ? totalCents / payouts.length : 0), [payouts.length, totalCents]);

  if (payouts.length === 0) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <DollarSign className="w-4 h-4 text-status-live" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-live rounded-full animate-pulse" />
            </div>
            <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Live Payouts</span>
            <div className="px-1.5 py-0.5 bg-muted/40 border border-border/60 rounded-sm">
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Waiting</span>
            </div>
          </div>
        </div>
        <div className="px-4">
          <div className="rounded-lg border border-border/60 bg-surface-1/60 backdrop-blur-sm p-3">
            <p className="text-xs text-muted-foreground">No payouts yet — once a Feature is judged with earnings, it will appear here in real time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <DollarSign className="w-4 h-4 text-status-live" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-live rounded-full animate-pulse" />
          </div>
          <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Live Payouts</span>
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
              className="shrink-0 w-[190px] relative group"
            >
              <div className="relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0 backdrop-blur-sm">
                {/* top glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-status-live/35 to-transparent" />

                <div className="relative p-3 space-y-2">
                  {/* user row */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 border border-status-live/25 ring-1 ring-status-live/10">
                      <AvatarImage src={payout.avatar_url || ""} />
                      <AvatarFallback className="bg-status-live/10 text-status-live text-[10px] font-bold">
                        {payout.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">{payout.username}</p>
                      <p className="text-[8px] text-muted-foreground">
                        {formatDistanceToNow(new Date(payout.judged_at || payout.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* payout amount */}
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[20px] font-black text-status-live leading-none tabular-nums"
                      style={{
                        textShadow:
                          "0 0 18px hsl(var(--status-live) / 0.35), 0 0 42px hsl(var(--status-live) / 0.12)",
                      }}
                    >
                      ${(payout.earned_cents / 100).toFixed(2)}
                    </span>
                    <TrendingUp className="w-3 h-3 text-status-live/70 mb-0.5" />
                  </div>

                  {/* context badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <Zap className="w-2.5 h-2.5 text-gold shrink-0" />
                      <span className="text-[8px] font-bold text-gold uppercase tracking-wider truncate">
                        {payout.drop_title || "FEATURE"}
                      </span>
                    </div>
                    {payout.rating ? (
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                        {payout.rating} rank
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-status-live/5 to-transparent pointer-events-none" />
              </div>

              {/* hover glow */}
              <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-status-live/0 via-status-live/0 to-status-live/0 group-hover:from-status-live/10 group-hover:via-status-live/5 group-hover:to-status-live/10 transition-all duration-500 -z-10 blur-xl opacity-0 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-2 px-4 flex items-center justify-between text-[9px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Total paid:</span>
            <span className="text-status-live font-bold tabular-nums">${(totalCents / 100).toFixed(2)}</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Avg:</span>
            <span className="text-foreground font-bold tabular-nums">${(avgCents / 100).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          <span className="font-medium">Last 24h</span>
        </div>
      </div>
    </div>
  );
}
