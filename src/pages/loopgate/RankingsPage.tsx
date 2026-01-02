import { useState } from "react";
import { generateRankings } from "@/data/loopgateData";
import RankingRow from "@/components/loopgate/RankingRow";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
    if (activeTab === "region") return editor.rank <= 20;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-6" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Rankings
          </span>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] rounded transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Rankings List */}
      <div className="p-4">
        {activeTab === "history" ? (
          <div className="space-y-3">
            {[
              { season: "Winter 2024", alias: "VELOCITY_X", score: 98.7 },
              { season: "Fall 2024", alias: "FRAME_HUNTER", score: 97.2 },
              { season: "Summer 2024", alias: "CUT_MASTER", score: 96.8 },
            ].map((champ) => (
              <div key={champ.season} className="bg-surface-1 border border-border rounded-lg p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  {champ.season}
                </p>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold">{champ.alias}</p>
                  <p className="text-lg font-bold text-gold">{champ.score}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRankings.map((editor) => (
              <RankingRow key={editor.id} editor={editor} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-8 text-center border-t border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Rankings are final
        </p>
      </div>
    </div>
  );
}
