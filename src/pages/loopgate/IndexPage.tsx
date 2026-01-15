import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, MessageCircle, Shield, Crown, Star, Lock, ChevronRight } from "lucide-react";
import { useRealRankings } from "@/hooks/useRealData";
import { useAuth } from "@/hooks/useAuth";
import EditorCard from "@/components/loopgate/EditorCard";
import loopgateLogo from "@/assets/loopgate-logo.png";
import SEO, { pageSEO } from "@/components/SEO";

type LeagueFilter = "all" | "open" | "pro" | "elite";
type RankFilter = "all" | "top10" | "top50" | "top100";
type ViewMode = "editors" | "arenas";

const arenas = [
  { id: 1, name: "Global", description: "Open to all editors", minLeague: "open" as const, icon: MessageCircle },
  { id: 2, name: "Open League", description: "Open League members", minLeague: "open" as const, icon: Shield },
  { id: 3, name: "Pro Arena", description: "Pro & Elite only", minLeague: "pro" as const, icon: Star },
  { id: 4, name: "Elite Arena", description: "Elite members only", minLeague: "elite" as const, icon: Crown },
];

const leagueOrder = { elite: 0, pro: 1, open: 2 };

export default function IndexPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("editors");

  const { rankings, loading, error } = useRealRankings();

  const userLeague = profile?.league || "open";

  const canAccessArena = (minLeague: "open" | "pro" | "elite") => {
    return leagueOrder[userLeague as keyof typeof leagueOrder] <= leagueOrder[minLeague];
  };

  const filteredEditors = useMemo(() => {
    return rankings.filter((editor) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUsername = editor.username.toLowerCase().includes(query);
        const matchesDisplayName = editor.display_name?.toLowerCase().includes(query);
        if (!matchesUsername && !matchesDisplayName) {
          return false;
        }
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
      <SEO {...pageSEO.index} />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Index
          </span>
        </div>
      </header>

      {/* View Mode Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-surface-1 border border-border p-1">
          {[
            { id: "editors" as const, label: "Editors" },
            { id: "arenas" as const, label: "Arenas" },
            { id: "class" as const, label: "Class" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.id === "class" ? navigate("/class") : setViewMode(tab.id as ViewMode)}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                viewMode === tab.id
                  ? "bg-gold text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editors View */}
      {viewMode === "editors" && (
        <>
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
        </>
      )}

      {/* Arenas View */}
      {viewMode === "arenas" && (
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
            Real-time chat rooms by league tier
          </p>
          {arenas.map((arena) => {
            const hasAccess = canAccessArena(arena.minLeague);
            const IconComponent = arena.icon;
            
            return (
              <button
                key={arena.id}
                onClick={() => hasAccess && navigate(`/arenas/${arena.id}`)}
                disabled={!hasAccess}
                className={`w-full p-4 border rounded-lg flex items-center gap-4 transition-all text-left ${
                  hasAccess
                    ? "bg-surface-1 border-border hover:border-gold/30 hover:bg-surface-1/80"
                    : "bg-muted/20 border-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  hasAccess ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{arena.name}</h3>
                    {!hasAccess && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{arena.description}</p>
                </div>
                {hasAccess && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            );
          })}
          
          <div className="pt-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Unlock higher arenas by advancing your league
            </p>
          </div>
        </div>
      )}


      {/* Footer */}
      <div className="p-4 text-center mt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {viewMode === "editors" ? "Real-time verified rankings" : 
           viewMode === "arenas" ? "Text-only • No media uploads" :
           "Performance-based progression"}
        </p>
      </div>
    </div>
  );
}
