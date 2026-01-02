import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { generateEditors } from "@/data/loopgateData";
import EditorCard from "@/components/loopgate/EditorCard";
import loopgateLogo from "@/assets/loopgate-logo.png";

type RegionFilter = "all" | "NA" | "EU" | "APAC" | "LATAM" | "MEA";
type LeagueFilter = "all" | "open" | "pro" | "elite";
type ActivityFilter = "all" | "active" | "inactive";

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  const allEditors = useMemo(() => generateEditors(50), []);

  const filteredEditors = useMemo(() => {
    return allEditors.filter((editor) => {
      // Search by alias
      if (searchQuery && !editor.alias.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Region filter
      if (regionFilter !== "all" && editor.region !== regionFilter) {
        return false;
      }
      // League filter
      if (leagueFilter !== "all" && editor.league !== leagueFilter) {
        return false;
      }
      // Activity filter
      if (activityFilter === "active" && editor.activeEvents.length === 0) {
        return false;
      }
      if (activityFilter === "inactive" && editor.activeEvents.length > 0) {
        return false;
      }
      return true;
    });
  }, [allEditors, searchQuery, regionFilter, leagueFilter, activityFilter]);

  const regions: RegionFilter[] = ["all", "NA", "EU", "APAC", "LATAM", "MEA"];
  const leagues: LeagueFilter[] = ["all", "open", "pro", "elite"];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Editor Index
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
              className="w-full bg-surface-1 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          {/* Region */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setRegionFilter(region)}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded whitespace-nowrap transition-colors ${
                  regionFilter === region
                    ? "bg-foreground text-background"
                    : "bg-surface-1 text-muted-foreground"
                }`}
              >
                {region === "all" ? "All Regions" : region}
              </button>
            ))}
          </div>

          {/* League */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() => setLeagueFilter(league)}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded whitespace-nowrap transition-colors ${
                  leagueFilter === league
                    ? "bg-foreground text-background"
                    : "bg-surface-1 text-muted-foreground"
                }`}
              >
                {league === "all" ? "All Leagues" : league}
              </button>
            ))}
          </div>

          {/* Activity */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setActivityFilter("all")}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded transition-colors ${
                activityFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-surface-1 text-muted-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActivityFilter("active")}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded transition-colors ${
                activityFilter === "active"
                  ? "bg-foreground text-background"
                  : "bg-surface-1 text-muted-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActivityFilter("inactive")}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] rounded transition-colors ${
                activityFilter === "inactive"
                  ? "bg-foreground text-background"
                  : "bg-surface-1 text-muted-foreground"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">
          {filteredEditors.length} Editors
        </p>
        <div className="space-y-2">
          {filteredEditors.map((editor) => (
            <EditorCard key={editor.id} editor={editor} />
          ))}
        </div>
      </div>
    </div>
  );
}
