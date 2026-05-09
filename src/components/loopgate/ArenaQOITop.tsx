import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight, ArrowUp, ArrowDown, Minus, Flame } from "lucide-react";
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

/** Custom podium marks — bespoke geometric medals, not lucide presets. */
function PodiumMark({ rank }: { rank: 1 | 2 | 3 }) {
  if (rank === 1) {
    // Sovereign crown: 3-spike with gem dots
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.55)]" fill="currentColor">
        <path d="M3 8.5 7 13l5-7 5 7 4-4.5L20 18H4L3 8.5Z" />
        <rect x="4" y="19" width="16" height="2" rx="0.5" />
        <circle cx="3" cy="7.5" r="1.2" fill="#fde68a" />
        <circle cx="21" cy="7.5" r="1.2" fill="#fde68a" />
        <circle cx="12" cy="4.5" r="1.4" fill="#fff7d6" />
      </svg>
    );
  }
  if (rank === 2) {
    // Hex shield with "2"
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-200 drop-shadow-[0_0_4px_rgba(228,228,231,0.4)]">
        <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="currentColor" fontFamily="Teko, sans-serif" letterSpacing="0.5">2</text>
      </svg>
    );
  }
  // Hex shield with "3"
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.4)]">
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="currentColor" fontFamily="Teko, sans-serif" letterSpacing="0.5">3</text>
    </svg>
  );
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
        // Weekly-bucketed snapshot — deltas reflect movement over the past 7 days.
        // ISO-week key (year + week number) so a snapshot persists for a full week
        // before being rolled into "prev" for next week's comparison.
        try {
          const isoWeek = (d: Date) => {
            const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            const day = t.getUTCDay() || 7;
            t.setUTCDate(t.getUTCDate() + 4 - day);
            const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
            const wk = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
          };
          const week = isoWeek(new Date());
          const rawCur = localStorage.getItem('arena_top_editors_ranks_w1');
          const cur = rawCur ? JSON.parse(rawCur) : null;
          const rawPrev = localStorage.getItem('arena_top_editors_ranks_w0');
          const prev = rawPrev ? JSON.parse(rawPrev) : null;

          // Compare against last week's frozen snapshot if we have one.
          if (prev?.ranks) setPrevRanks(prev.ranks);
          else if (cur?.week && cur.week !== week && cur.ranks) setPrevRanks(cur.ranks);

          const snap: Record<string, number> = {};
          fresh.forEach((r, i) => { snap[r.id] = i + 1; });

          if (!cur || cur.week !== week) {
            // New week — roll the previous current into prev, start fresh.
            if (cur) localStorage.setItem('arena_top_editors_ranks_w0', JSON.stringify(cur));
            localStorage.setItem('arena_top_editors_ranks_w1', JSON.stringify({ week, ranks: snap }));
          } else {
            // Same week — keep updating the current bucket so it stabilises.
            localStorage.setItem('arena_top_editors_ranks_w1', JSON.stringify({ week, ranks: snap }));
          }
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
                    {rank <= 3 ? (
                      <PodiumMark rank={rank as 1 | 2 | 3} />
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
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md bg-sky-400/15 border border-sky-400/30 text-[8.5px] font-black uppercase tracking-wider text-sky-300">
                              <Sparkles className="w-2.5 h-2.5" strokeWidth={2.75} /> NEW
                            </span>
                          );
                        }
                        const delta = prev - rank; // positive = climbed
                        if (delta > 0) {
                          const blazing = delta >= 5;
                          return (
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md text-[9px] font-black tabular-nums border ${
                                blazing
                                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 animate-pulse'
                                  : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                              }`}
                            >
                              {blazing ? (
                                <Flame className="w-2.5 h-2.5" strokeWidth={2.75} fill="currentColor" />
                              ) : (
                                <ChevronsUp className="w-3 h-3 -ml-0.5" strokeWidth={3} />
                              )}
                              {delta}
                            </span>
                          );
                        }
                        if (delta < 0) {
                          return (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md bg-red-500/10 border border-red-400/30 text-[9px] font-black tabular-nums text-red-300">
                              <ChevronsDown className="w-3 h-3 -ml-0.5" strokeWidth={3} />
                              {Math.abs(delta)}
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md bg-white/[0.04] border border-white/10 text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            <Minus className="w-2.5 h-2.5" strokeWidth={3} />
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