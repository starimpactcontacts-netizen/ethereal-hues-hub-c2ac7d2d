import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBattles } from "@/hooks/useBattles";

function statusColor(status: string) {
  switch (status) {
    case "active":
    case "judging":
      return "text-emerald-400";
    case "pending":
      return "text-amber-400";
    case "completed":
    case "ended":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}

export default function EditBattlesListPage() {
  const navigate = useNavigate();
  const { battles, loading } = useBattles(["pending", "active", "judging", "completed"]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            <h1 className="text-lg font-bold">Edit Battles</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
        )}
        {!loading && battles.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">No battles yet</div>
        )}
        {battles.map((b: any) => (
          <button
            key={b.id}
            onClick={() => navigate(`/battle/${b.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors text-left"
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={b.challenger_avatar_url || ""} />
              <AvatarFallback>{b.challenger_username?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {b.challenger_username} <span className="text-muted-foreground font-normal">vs</span>{" "}
                {b.opponent_username || "Open"}
              </div>
              <div className={`text-[11px] uppercase tracking-wider font-bold ${statusColor(b.status)}`}>
                {b.status}
              </div>
            </div>
            <Avatar className="w-9 h-9">
              <AvatarImage src={b.opponent_avatar_url || ""} />
              <AvatarFallback>{b.opponent_username?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          </button>
        ))}
      </div>
    </div>
  );
}
