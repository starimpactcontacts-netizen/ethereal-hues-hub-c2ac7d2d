import { ChevronRight } from "lucide-react";
import { Editor } from "@/data/loopgateData";

interface EditorCardProps {
  editor: Editor;
}

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return String(count);
}

const platformIcons: Record<string, string> = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
};

export default function EditorCard({ editor }: EditorCardProps) {
  const leagueColors: Record<string, string> = {
    elite: "text-gold",
    pro: "text-blue-400",
    open: "text-muted-foreground",
  };

  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4 flex items-center gap-4">
      {/* Rank */}
      <div className={`w-10 text-center ${editor.rank <= 3 ? "text-gold" : "text-muted-foreground"}`}>
        <span className="font-bold text-lg">#{editor.rank}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-sm truncate">{editor.alias}</h3>
          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${leagueColors[editor.league]}`}>
            {editor.league}
          </span>
        </div>

        {/* Platforms */}
        {editor.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {editor.platforms.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-2 rounded text-[10px]"
              >
                <span className="font-bold text-muted-foreground">{platformIcons[p.platform]}</span>
                <span>{formatFollowers(p.followers)}</span>
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Index: <span className="text-foreground font-semibold">{editor.indexScore.toFixed(1)}</span></span>
          <span>{editor.winRate}% Win</span>
        </div>
      </div>

      {/* CTA */}
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </div>
  );
}
