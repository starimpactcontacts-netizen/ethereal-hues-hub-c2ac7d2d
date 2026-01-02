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

const platformIcons = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
};

export default function EditorCard({ editor }: EditorCardProps) {
  const leagueColors = {
    elite: "text-gold",
    pro: "text-blue-400",
    open: "text-muted-foreground",
  };

  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4">
      {/* Header: Alias + Region */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm">{editor.alias}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5">
            {editor.region}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${leagueColors[editor.league]}`}>
          {editor.league}
        </span>
      </div>

      {/* Platforms */}
      {editor.platforms.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {editor.platforms.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-2 rounded text-[10px]"
            >
              <span className="font-bold text-muted-foreground">{platformIcons[p.platform]}</span>
              <span>{formatFollowers(p.followers)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div>
          <p className="text-lg font-bold">{editor.indexScore.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">Index</p>
        </div>
        <div>
          <p className="text-lg font-bold">{editor.winRate}%</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">Win Rate</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-lg font-bold text-gold">#{editor.rank}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">Global</p>
        </div>
      </div>
    </div>
  );
}
