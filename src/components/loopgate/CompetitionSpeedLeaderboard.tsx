import { useMemo } from "react";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";

interface Props {
  submissions: CompetitionSubmission[];
  startedAt: string | null;
  currentUserId: string | null;
  totalEditors: number;
}

function fmt(ms: number) {
  if (!isFinite(ms) || ms < 0) return "--:--";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function CompetitionSpeedLeaderboard({
  submissions,
  startedAt,
  currentUserId,
  totalEditors,
}: Props) {
  const ranked = useMemo(() => {
    const start = startedAt ? new Date(startedAt).getTime() : null;
    return [...submissions]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((s, i) => ({
        ...s,
        place: i + 1,
        elapsedMs: start ? new Date(s.created_at).getTime() - start : 0,
      }));
  }, [submissions, startedAt]);

  if (ranked.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#101015] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-[11px] font-extrabold uppercase tracking-tight text-white">
            Speed Leaderboard
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          {ranked.length}/{totalEditors} in
        </span>
      </div>

      <div>
        {ranked.map((row) => {
          const isMe = row.user_id === currentUserId;
          const medal =
            row.place === 1
              ? "text-yellow-400"
              : row.place === 2
              ? "text-zinc-300"
              : row.place === 3
              ? "text-amber-600"
              : "text-zinc-600";
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0 ${
                isMe ? "bg-emerald-500/[0.06]" : ""
              }`}
            >
              <span className={`w-6 text-center font-black text-sm tabular-nums ${medal}`}>
                {row.place}
              </span>
              {row.avatar_url ? (
                <img
                  src={row.avatar_url}
                  alt={row.username}
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-400">
                  {row.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate tracking-tight">
                  {row.username}
                  {isMe && (
                    <span className="ml-1.5 text-[9px] font-mono uppercase tracking-tight text-emerald-400">
                      you
                    </span>
                  )}
                </p>
              </div>
              <span className="font-mono text-sm font-bold tabular-nums text-sky-400">
                {fmt(row.elapsedMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}