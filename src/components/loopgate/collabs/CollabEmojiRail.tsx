import { CollabEmoji } from "@/hooks/useCollabs";

const EMOJIS: { key: CollabEmoji; glyph: string; weight: number }[] = [
  { key: "fire", glyph: "🔥", weight: 1 },
  { key: "zap", glyph: "⚡", weight: 1 },
  { key: "diamond", glyph: "💎", weight: 2 },
  { key: "crown", glyph: "👑", weight: 3 },
  { key: "clapper", glyph: "🎬", weight: 1 },
];

export default function CollabEmojiRail({
  reactions,
  onTap,
  disabled,
}: {
  reactions: { emoji: CollabEmoji; count: number; mine: boolean }[];
  onTap: (e: CollabEmoji) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {EMOJIS.map((e) => {
        const r = reactions.find((x) => x.emoji === e.key);
        const count = r?.count ?? 0;
        const mine = r?.mine ?? false;
        return (
          <button
            key={e.key}
            disabled={disabled}
            onClick={() => onTap(e.key)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all active:scale-95 ${
              mine
                ? "bg-violet-500/20 border border-violet-400/60"
                : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <span className="text-2xl leading-none">{e.glyph}</span>
            <span className={`text-[10px] font-bold tabular-nums ${mine ? "text-violet-200" : "text-muted-foreground"}`}>
              {count > 0 ? count : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}