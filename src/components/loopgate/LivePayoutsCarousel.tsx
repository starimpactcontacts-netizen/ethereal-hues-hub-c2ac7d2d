import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign } from "lucide-react";
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
      {/* Header — minimal */}
      <div className="flex items-center justify-between mb-2 px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Live Payouts</span>
          <span className="text-[9px] text-muted-foreground font-medium tabular-nums">
            ${(totalCents / 100).toFixed(2)} paid
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground">{payouts.length} recent</span>
      </div>

      {/* Ticker rows — stake.com style */}
      <div className="px-4 space-y-px">
        {payouts.map((payout, idx) => (
          <motion.div
            key={payout.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="flex items-center gap-3 py-2 px-3 rounded-md group hover:bg-white/[0.03] transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            {/* Avatar */}
            <Avatar className="w-7 h-7 shrink-0 border border-white/[0.08]">
              <AvatarImage src={payout.avatar_url || ""} />
              <AvatarFallback className="bg-white/[0.06] text-white/60 text-[9px] font-bold">
                {payout.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* User + context */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-foreground truncate">{payout.username}</span>
                {payout.rating && (
                  <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">{payout.rating}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <span className="truncate">{payout.drop_title || "Feature"}</span>
                <span>·</span>
                <span className="shrink-0">
                  {formatDistanceToNow(new Date(payout.judged_at || payout.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Amount — the dopamine hit */}
            <div className="shrink-0 text-right">
              <span className="text-[14px] font-black text-foreground tabular-nums">
                <span className="text-gold">$</span>{(payout.earned_cents / 100).toFixed(2)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
