import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

type Payout = {
  id: string;
  username: string;
  avatar_url: string | null;
  earned_cents: number;
  created_at: string;
  rating: string | null;
  source: "drop" | "mission";
  source_title: string | null;
  source_poster: string | null;
};

const teko = { fontFamily: 'Teko, sans-serif' };

export default function LivePayoutsCarousel() {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchPayouts = async () => {
      // Fetch from featured_submissions (drops)
      const { data: dropData } = await supabase
        .from("featured_submissions")
        .select("id, username, avatar_url, earned_cents, created_at, rating, drop_id")
        .gt("earned_cents", 0)
        .order("created_at", { ascending: false })
        .limit(12);

      // Fetch from commission_submissions (missions)
      const { data: missionData } = await supabase
        .from("commission_submissions")
        .select("id, username, avatar_url, earned_cents, created_at, rating, commission_id")
        .gt("earned_cents", 0)
        .order("created_at", { ascending: false })
        .limit(12);

      // Hydrate drop info
      const dropRows = (dropData || []) as any[];
      const dropIds = [...new Set(dropRows.map(r => r.drop_id).filter(Boolean))];
      let dropMap = new Map<string, { title: string; poster_url: string | null }>();
      if (dropIds.length > 0) {
        const { data } = await supabase.from("featured_drops").select("id, title, poster_url").in("id", dropIds);
        dropMap = new Map((data || []).map((d: any) => [d.id, { title: d.title, poster_url: d.poster_url }]));
      }

      // Hydrate mission info
      const missionRows = (missionData || []) as any[];
      const commIds = [...new Set(missionRows.map(r => r.commission_id).filter(Boolean))];
      let commMap = new Map<string, { title: string; cover_url: string | null }>();
      if (commIds.length > 0) {
        const { data } = await supabase.from("commissions").select("id, title, cover_url").in("id", commIds);
        commMap = new Map((data || []).map((d: any) => [d.id, { title: d.title, cover_url: d.cover_url }]));
      }

      const dropPayouts: Payout[] = dropRows.map(r => {
        const info = r.drop_id ? dropMap.get(r.drop_id) : undefined;
        return {
          id: r.id,
          username: r.username,
          avatar_url: r.avatar_url,
          earned_cents: r.earned_cents,
          created_at: r.created_at,
          rating: r.rating,
          source: "drop" as const,
          source_title: info?.title ?? null,
          source_poster: info?.poster_url ?? null,
        };
      });

      const missionPayouts: Payout[] = missionRows.map(r => {
        const info = r.commission_id ? commMap.get(r.commission_id) : undefined;
        return {
          id: `m-${r.id}`,
          username: r.username,
          avatar_url: r.avatar_url,
          earned_cents: r.earned_cents,
          created_at: r.created_at,
          rating: r.rating,
          source: "mission" as const,
          source_title: info?.title ?? null,
          source_poster: info?.cover_url ?? null,
        };
      });

      // Merge and sort by date, take top 12
      const all = [...dropPayouts, ...missionPayouts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 12);

      if (mounted) setPayouts(all);
    };

    fetchPayouts();

    // Listen for realtime updates from both tables
    const channel = supabase
      .channel("live-payouts-carousel")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "featured_submissions" }, () => fetchPayouts())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "commission_submissions" }, () => fetchPayouts())
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
            <p className="text-xs text-muted-foreground">No payouts yet — once an edit is judged with earnings, it will appear here in real time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 relative overflow-hidden border-y border-emerald-500/10 -mx-4"
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(0,0,0,0.95) 40%, rgba(16,185,129,0.04) 100%)',
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(16,185,129,0.3) 20px, rgba(16,185,129,0.3) 21px),
                            repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(16,185,129,0.3) 20px, rgba(16,185,129,0.3) 21px)`,
        }}
      />
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-emerald-500/20" />

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 px-4 pt-3 relative z-10">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-black text-foreground uppercase tracking-wider" style={teko}>Live Payouts</span>
        </div>
        <span className="text-[9px] text-muted-foreground">{payouts.length} recent</span>
      </div>

      {/* Cards carousel */}
      <div className="flex gap-3 pl-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory relative z-10">
        {payouts.map((payout, idx) => (
          <PayoutCard key={payout.id} payout={payout} idx={idx} />
        ))}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-3 px-4 pb-3 mt-1 text-[9px] text-muted-foreground relative z-10">
        <span>Total paid: <span className="text-emerald-400 font-bold">${(totalCents / 100).toFixed(2)}</span></span>
        <span className="text-border/30">|</span>
        <span>Avg: <span className="text-foreground/60 font-bold">${(avgCents / 100).toFixed(2)}</span></span>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          <span className="font-bold">Recent</span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500/20" />
    </div>
  );
}

function PayoutCard({ payout, idx }: { payout: Payout; idx: number }) {
  const amount = (payout.earned_cents / 100).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="shrink-0 w-[100px] h-[100px] snap-start relative overflow-hidden rounded-lg group"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
    >
      {/* Background */}
      {payout.source_poster ? (
        <img src={payout.source_poster} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.05] group-hover:scale-[1.1] transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-black to-black" />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="absolute inset-0 rounded-lg border border-white/[0.08] group-hover:border-emerald-400/20 transition-colors duration-300" />

      {/* Content */}
      <div className="relative p-2 flex flex-col h-[100px] justify-between">
        {/* Top — user + source badge */}
        <div className="flex items-center gap-1.5">
          <Avatar className="w-5 h-5 border border-white/[0.15]">
            <AvatarImage src={payout.avatar_url || ""} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-[8px] font-black">
              {payout.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-bold text-white truncate">{payout.username}</span>
        </div>

        {/* Center — money */}
        <span className="text-lg font-black text-emerald-400 leading-none tabular-nums tracking-tight" style={teko}>
          ${amount}
        </span>

        {/* Bottom — source name */}
        <span className="text-[7px] font-bold text-white/40 uppercase tracking-wider truncate">
          {payout.source_title || (payout.source === "mission" ? "Mission" : "Feature")}
        </span>
      </div>
    </motion.div>
  );
}
