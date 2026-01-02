import { useState } from "react";
import { generateRankings } from "@/data/loopgateData";
import RankingRow from "@/components/loopgate/RankingRow";

type TabType = "global" | "league" | "region" | "history";

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const rankings = generateRankings(50);

  const tabs: { id: TabType; label: string }[] = [
    { id: "global", label: "Global" },
    { id: "league", label: "League" },
    { id: "region", label: "Region" },
    { id: "history", label: "History" },
  ];

  const filteredRankings = rankings.filter((editor) => {
    if (activeTab === "league") return editor.league === "elite" || editor.league === "pro";
    if (activeTab === "region") return editor.rank <= 20; // Mock regional filter
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">RANKINGS</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Global Competitive Index
          </p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gold text-black"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Rankings List */}
      <div className="px-4 py-4">
        {activeTab === "history" ? (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Winter 2024 Champion
              </p>
              <p className="text-lg font-bold">VELOCITY_X</p>
              <p className="text-sm text-gold">98.7 Index Score</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Fall 2024 Champion
              </p>
              <p className="text-lg font-bold">FRAME_HUNTER</p>
              <p className="text-sm text-gold">97.2 Index Score</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Summer 2024 Champion
              </p>
              <p className="text-lg font-bold">CUT_MASTER</p>
              <p className="text-sm text-gold">96.8 Index Score</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRankings.map((editor) => (
              <RankingRow key={editor.id} editor={editor} />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Rankings are final. Index updated daily.
        </p>
      </div>
    </div>
  );
}
