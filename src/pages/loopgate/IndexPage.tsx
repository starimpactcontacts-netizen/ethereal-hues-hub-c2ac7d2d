import { useState, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
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

  const allEditors = useMemo(() => generateEditors(50), []);

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Index
          </span>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-lg py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
            className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
            className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Leagues</option>
            <option value="elite">Elite</option>
            <option value="pro">Pro</option>
            <option value="open">Open</option>
          </select>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value as RankFilter)}
            className="bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Ranks</option>
            <option value="top10">Top 10</option>
            <option value="top50">Top 50</option>
            <option value="top100">Top 100</option>
          </select>
        </div>
      </header>

      {/* Results */}
      <div className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-3">
          {filteredEditors.length} editors found
        </p>
        <div className="space-y-2">
          {filteredEditors.slice(0, 20).map((editor) => (
            <EditorCard key={editor.id} editor={editor} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Metadata only. Loopgate does not host content.
        </p>
      </div>
    </div>
  );
}
