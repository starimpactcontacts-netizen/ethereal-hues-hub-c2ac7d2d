import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight, Crown, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QoiRow {
  id: string;
  username: string;
  avatar_url: string | null;
  best_gatekeeper_qoi: number | null;
  global_index_score: number | null;
}

/**
 * Arena mini-leaderboard — Loopgate Top QOI.
 * Lives inside the Arena above Edit Battles to surface elite editors
 * by their best gatekeeper QOI score (the QOI ranking system).
 */
export default function ArenaQOITop() {
  const [rows, setRows] = useState<QoiRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, best_gatekeeper_qoi, global_index_score")
        .eq("is_hidden", false)
        .not("best_gatekeeper_qoi", "is", null)
        .order("best_gatekeeper_qoi", { ascending: false, nullsFirst: false })
        .limit(5);
      if (!cancelled) {
        setRows((data as QoiRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!loading && rows.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between px-4 mb-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-400 to-orange-500">
            <Trophy className="w-2.5 h-2.5 text-black" strokeWidth={3} />
          </div>
          <h2
            className="text-[15px] font-extrabold tracking-tight text-foreground whitespace-nowrap"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Top QOI
          </h2>
          <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-[0.18em] ml-1">Loopgate</span>
        </div>
        <Link
          to="/rankings"
          className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="mx-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-500/[0.04] via-white/[0.02] to-transparent overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[0,1,2].map(i => <div key={i} className="h-9 rounded-lg bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rows.map((row, i) => {
              const rank = i + 1;
              const Icon = rank === 1 ? Crown : rank <= 3 ? Medal : null;
              const accent = rank === 1 ? "text-amber-300" : rank === 2 ? "text-zinc-300" : rank === 3 ? "text-orange-400" : "text-muted-foreground";
              return (
                <Link
                  key={row.id}
                  to={`/u/${row.username}`}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
                >
                  <div className="w-6 flex items-center justify-center shrink-0">
                    {Icon ? (
                      <Icon className={`w-4 h-4 ${accent}`} strokeWidth={2.5} />
                    ) : (
                      <span className={`text-[11px] font-black tabular-nums ${accent}`}>{rank}</span>
                    )}
                  </div>
                  <Avatar className="w-7 h-7 shrink-0 border border-white/10">
                    <AvatarImage src={row.avatar_url || ''} />
                    <AvatarFallback className="bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                      {row.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground truncate">{row.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="font-display text-base text-amber-300 tabular-nums leading-none"
                      style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.02em" }}
                    >
                      {(row.best_gatekeeper_qoi || 0).toFixed(1)}
                    </span>
                    <span className="block text-[8px] text-muted-foreground uppercase tracking-wider">QOI</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}