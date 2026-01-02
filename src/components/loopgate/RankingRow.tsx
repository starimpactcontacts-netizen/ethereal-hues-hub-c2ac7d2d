import { Editor } from "@/data/loopgateData";

interface RankingRowProps {
  editor: Editor;
}

export default function RankingRow({ editor }: RankingRowProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-gold font-bold";
    if (rank === 2) return "text-gray-300 font-bold";
    if (rank === 3) return "text-amber-600 font-bold";
    return "text-muted-foreground";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
      {/* Rank */}
      <div className={`w-10 text-center ${getRankStyle(editor.rank)}`}>
        <span className="text-lg">{editor.rank}</span>
      </div>

      {/* Editor Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{editor.alias}</h3>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          <span>{editor.winRate}% Win</span>
          <span>{editor.finalsReached} Finals</span>
        </div>
      </div>

      {/* Index Score */}
      <div className="text-right">
        <p className="text-lg font-bold">{editor.indexScore.toFixed(1)}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Index
        </p>
      </div>
    </div>
  );
}
