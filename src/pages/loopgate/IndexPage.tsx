import { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRealRankings } from "@/hooks/useRealData";
import EditorCard from "@/components/loopgate/EditorCard";
import loopgateLogo from "@/assets/loopgate-logo-white.png";

type LeagueFilter = "all" | "open" | "pro" | "elite";
type RankFilter = "all" | "top10" | "top50" | "top100";

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");

  const { rankings, loading, error } = useRealRankings();

  const filteredEditors = useMemo(() => {
    return rankings.filter((editor) => {
      if (searchQuery && !editor.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (leagueFilter !== "all" && editor.league !== leagueFilter) {
        return false;
      }
      const rank = editor.rank || 999;
      if (rankFilter === "top10" && rank > 10) return false;
      if (rankFilter === "top50" && rank > 50) return false;
      if (rankFilter === "top100" && rank > 100) return false;
      return true;
    });
  }, [rankings, searchQuery, leagueFilter, rankFilter]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-5" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Index
          </span>
        </div>
      </header>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search editors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-1 border border-border pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-gold/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        <select
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
          className="bg-surface-1 border border-border px-3 py-2 text-xs font-medium uppercase tracking-wider appearance-none cursor-pointer focus:outline-none"
        >
          <option value="all">League</option>
          <option value="elite">Elite</option>
          <option value="pro">Pro</option>
          <option value="open">Open</option>
        </select>

        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value as RankFilter)}
          className="bg-surface-1 border border-border px-3 py-2 text-xs font-medium uppercase tracking-wider appearance-none cursor-pointer focus:outline-none"
        >
          <option value="all">Rank</option>
          <option value="top10">Top 10</option>
          <option value="top50">Top 50</option>
          <option value="top100">Top 100</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="font-display text-lg text-muted-foreground">
          {filteredEditors.length} Editors
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Global Index
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-destructive">Failed to load rankings</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEditors.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="font-display text-2xl text-muted-foreground mb-2">No rankings yet</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {rankings.length === 0 
              ? "Be the first to compete and claim your rank" 
              : "No editors match your filters"}
          </p>
        </div>
      )}

      {/* Editor Cards */}
      {!loading && !error && filteredEditors.length > 0 && (
        <div className="px-4 space-y-2">
          {filteredEditors.map((editor) => (
            <EditorCard key={editor.id} editor={editor} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 text-center mt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Real-time verified rankings
        </p>
      </div>
    </div>
  );
}
