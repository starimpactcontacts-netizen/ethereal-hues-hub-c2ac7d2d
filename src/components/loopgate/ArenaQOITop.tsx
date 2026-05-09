import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight, Crown, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EditorRow {
  id: string;
  username: string;
  avatar_url: string | null;
  best_gatekeeper_qoi: number | null;
  global_index_score: number | null;
  total_wins: number | null;
  level: number | null;
}

/**
 * Arena mini-leaderboard — Loopgate Top QOI.
 * Lives inside the Arena above Edit Battles to surface elite editors
 * by their best gatekeeper QOI score (the QOI ranking system).
 */
export default function ArenaQOITop() {
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, best_gatekeeper_qoi, global_index_score, total_wins, level")
        .eq("is_hidden", false)
        .order("global_index_score", { ascending: false, nullsFirst: false })
        .order("best_gatekeeper_qoi", { ascending: false, nullsFirst: false })
          .order("level", { ascending: false, nullsFirst: false })
          .limit(50);
      if (!cancelled) {
        const fresh = (data as EditorRow[]) || [];
        // Read previous snapshot for climb/fall arrows
        try {
          const raw = localStorage.getItem('arena_top_editors_ranks');
          if (raw) setPrevRanks(JSON.parse(raw));
        } catch {}
        // Save current snapshot for next visit
        try {
          const snap: Record<string, number> = {};
          fresh.forEach((r, i) => { snap[r.id] = i + 1; });
          localStorage.setItem('arena_top_editors_ranks', JSON.stringify(snap));
        } catch {}
        setRows(fresh);
        setLoading(false);
      }
    };
    load();

    // Realtime — pull fresh stats whenever profiles update
    const ch = supabase
      .channel("arena-top-editors")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
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
            Top Editors
          </h2>
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
              const idx = Number(row.global_index_score || 0);
              const idxLabel = idx >= 1000 ? `${(idx / 1000).toFixed(idx >= 10000 ? 0 : 1)}K` : idx.toFixed(0);
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
                    <div className="flex items-center gap-2 mt-0.5">
                      {row.level ? (
                        <span className="text-[9px] text-muted-foreground tabular-nums">Lvl {row.level}</span>
                      ) : null}
                      {(() => {
                        const prev = prevRanks[row.id];
                        if (!prev) {
                          return (
                            <span className="text-[9px] text-sky-400/90 font-semibold tabular-nums flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" /> NEW
                            </span>
                          );
                        }
                        const delta = prev - rank; // positive = climbed
                        if (delta > 0) {
                          return (
                            <span className="text-[9px] text-emerald-400 font-bold tabular-nums flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.75} /> {delta}
                            </span>
                          );
                        }
                        if (delta < 0) {
                          return (
                            <span className="text-[9px] text-red-400 font-bold tabular-nums flex items-center gap-0.5">
                              <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.75} /> {Math.abs(delta)}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] text-muted-foreground/70 font-semibold tabular-nums flex items-center gap-0.5">
                            <Minus className="w-2.5 h-2.5" />
                          </span>
                        );
                      })()}
                      {row.best_gatekeeper_qoi ? (
                        <span className="text-[9px] text-purple-300/80 font-semibold tabular-nums">QOI {Number(row.best_gatekeeper_qoi).toFixed(1)}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="font-display text-lg text-amber-300 tabular-nums leading-none"
                      style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.02em" }}
                    >
                      {idxLabel}
                    </span>
                    <span className="block text-[8px] text-muted-foreground uppercase tracking-wider">IDX</span>
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