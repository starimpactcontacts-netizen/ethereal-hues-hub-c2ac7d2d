import { RealEditor } from "@/hooks/useRealData";

interface EditorCardProps {
  editor: RealEditor;
}

const leagueColors: Record<string, string> = {
  elite: "text-gold border-gold",
  pro: "text-blue-400 border-blue-400",
  open: "text-muted-foreground border-muted-foreground/50",
};

export default function EditorCard({ editor }: EditorCardProps) {
  const isTop10 = (editor.rank || 999) <= 10;

  return (
    <div className={`bg-surface-1 border p-4 ${isTop10 ? "border-l-2 border-l-gold border-t-border border-r-border border-b-border" : "border-border"}`}>
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="w-12 text-center flex-shrink-0">
          <p className={`font-display text-2xl ${isTop10 ? "text-gold" : "text-muted-foreground"}`}>
            {editor.rank || '-'}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Rank</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{editor.username}</h3>
            <span className={`text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 ${leagueColors[editor.league] || leagueColors.open}`}>
              {editor.league}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>{editor.win_rate?.toFixed(0) || 0}% Win</span>
            <span>{editor.total_events || 0} Events</span>
            <span>{editor.total_wins || 0} Wins</span>
          </div>
        </div>

        {/* Index Score */}
        <div className="text-right flex-shrink-0">
          <p className="font-display text-2xl text-gold">
            {(editor.global_index_score || 0).toFixed(1)}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Index</p>
        </div>
      </div>
    </div>
  );
}
