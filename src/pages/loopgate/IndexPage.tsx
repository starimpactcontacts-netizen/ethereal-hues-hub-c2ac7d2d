import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { generateEditors } from "@/data/loopgateData";
import EditorCard from "@/components/loopgate/EditorCard";
import loopgateLogo from "@/assets/loopgate-logo.png";

type PlatformFilter = "all" | "tiktok" | "instagram" | "youtube";
type LeagueFilter = "all" | "open" | "pro" | "elite";
type RankFilter = "all" | "top10" | "top50" | "top100";

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");

  const allEditors = useMemo(() => generateEditors(100), []);

  const filteredEditors = useMemo(() => {
    return allEditors.filter((editor) => {
      if (searchQuery && !editor.alias.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (platformFilter !== "all" && !editor.platforms.some(p => p.platform === platformFilter)) {
        return false;
      }
      if (leagueFilter !== "all" && editor.league !== leagueFilter) {
        return false;
      }
      if (rankFilter === "top10" && editor.rank > 10) return false;
      if (rankFilter === "top50" && editor.rank > 50) return false;
      if (rankFilter === "top100" && editor.rank > 100) return false;
      return true;
    });
  }, [allEditors, searchQuery, platformFilter, leagueFilter, rankFilter]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
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
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
          className="bg-surface-1 border border-border px-3 py-2 text-xs font-medium uppercase tracking-wider appearance-none cursor-pointer focus:outline-none"
        >
          <option value="all">Platform</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>

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

      {/* Editor Cards */}
      <div className="px-4 space-y-2">
        {filteredEditors.slice(0, 20).map((editor) => (
          <EditorCard key={editor.id} editor={editor} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 text-center mt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Verified editor database
        </p>
      </div>
    </div>
  );
}
