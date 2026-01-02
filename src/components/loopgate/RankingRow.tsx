import { Editor } from "@/data/loopgateData";

interface RankingRowProps {
  editor: Editor;
}

export default function RankingRow({ editor }: RankingRowProps) {
  const isTop3 = editor.rank <= 3;
  
  return (
    <div className={`flex items-center gap-4 py-3 px-4 rounded-lg ${
      isTop3 ? "bg-surface-1" : ""
    }`}>
      {/* Rank - Hero element */}
      <div className={`w-12 text-center ${
        editor.rank === 1 ? "text-gold" : 
        editor.rank === 2 ? "text-foreground/70" : 
        editor.rank === 3 ? "text-amber-700" : 
        "text-muted-foreground"
      }`}>
        <span className={`font-bold ${isTop3 ? "text-2xl" : "text-lg"}`}>
          {editor.rank}
        </span>
      </div>

      {/* Editor Info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${isTop3 ? "text-base" : "text-sm"}`}>
          {editor.alias}
        </h3>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>{editor.winRate}% Win</span>
          <span>{editor.region}</span>
        </div>
      </div>

      {/* Index Score - Large and bold */}
      <div className="text-right">
        <p className={`font-bold ${isTop3 ? "text-xl" : "text-lg"}`}>
          {editor.indexScore.toFixed(1)}
        </p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
          Index
        </p>
      </div>
    </div>
  );
}
