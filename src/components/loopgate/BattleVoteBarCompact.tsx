interface Props {
  blueVotes: number;
  redVotes: number;
  blueLabel?: string;
  redLabel?: string;
}

/**
 * Compact blue-vs-red vote split bar for carousel cards.
 * Read-only — voting happens on the detail page.
 */
export default function BattleVoteBarCompact({ blueVotes, redVotes, blueLabel, redLabel }: Props) {
  const total = blueVotes + redVotes;
  const bluePct = total > 0 ? (blueVotes / total) * 100 : 50;
  const redPct = total > 0 ? (redVotes / total) * 100 : 50;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 tabular-nums" style={{ fontFamily: "Teko, sans-serif" }}>
          {blueVotes}
        </span>
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest" style={{ fontFamily: "Teko, sans-serif" }}>
          {total > 0 ? `${total} VOTE${total === 1 ? "" : "S"}` : "VOTE"}
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-red-400 tabular-nums" style={{ fontFamily: "Teko, sans-serif" }}>
          {redVotes}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${bluePct}%`,
            background: "linear-gradient(90deg, #2563eb, #60a5fa)",
            minWidth: blueVotes > 0 ? 4 : 0,
          }}
        />
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${redPct}%`,
            background: "linear-gradient(90deg, #f87171, #dc2626)",
            minWidth: redVotes > 0 ? 4 : 0,
          }}
        />
      </div>
    </div>
  );
}
