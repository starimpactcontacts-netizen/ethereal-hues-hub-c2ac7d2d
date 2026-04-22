import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VoteBarProps {
  battleId: string;
  challengerUsername: string;
  opponentUsername: string | null;
  /** Compact mode for carousel cards */
  compact?: boolean;
}

export default function CashBattleVoteBar({ battleId, challengerUsername, opponentUsername, compact = false }: VoteBarProps) {
  const { user } = useAuth();
  const [blueVotes, setBlueVotes] = useState(0);
  const [redVotes, setRedVotes] = useState(0);
  const [myVote, setMyVote] = useState<"challenger" | "opponent" | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchVotes();
    const channel = supabase
      .channel(`cash-battle-votes-${battleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_battle_votes", filter: `battle_id=eq.${battleId}` }, () => {
        fetchVotes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [battleId, user?.id]);

  async function fetchVotes() {
    const { data } = await supabase
      .from("cash_battle_votes")
      .select("team, user_id")
      .eq("battle_id", battleId);

    const votes = (data as any[]) || [];
    setBlueVotes(votes.filter(v => v.team === "challenger").length);
    setRedVotes(votes.filter(v => v.team === "opponent").length);
    if (user) {
      const mine = votes.find(v => v.user_id === user.id);
      setMyVote(mine ? mine.team : null);
    }
  }

  async function vote(team: "challenger" | "opponent", e: React.MouseEvent) {
    e.stopPropagation();
    if (!user || voting) return;
    setVoting(true);

    if (myVote === team) {
      // Remove vote
      await supabase.from("cash_battle_votes").delete().eq("battle_id", battleId).eq("user_id", user.id);
      setMyVote(null);
    } else if (myVote) {
      // Switch vote
      await supabase.from("cash_battle_votes").update({ team } as any).eq("battle_id", battleId).eq("user_id", user.id);
      setMyVote(team);
    } else {
      // New vote
      await supabase.from("cash_battle_votes").insert({ battle_id: battleId, user_id: user.id, team } as any);
      setMyVote(team);
    }
    setVoting(false);
  }

  const total = blueVotes + redVotes;
  const bluePercent = total > 0 ? (blueVotes / total) * 100 : 50;
  const redPercent = total > 0 ? (redVotes / total) * 100 : 50;

  if (compact) {
    return (
      <div className="px-4 pb-2">
        {/* Clickable team labels */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={(e) => vote("challenger", e)}
            className={`text-[9px] font-black uppercase tracking-wider transition-all ${
              myVote === "challenger" ? "text-blue-400 scale-105" : "text-blue-400/50 hover:text-blue-400/80"
            }`}
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            {blueVotes}
          </button>
          <span className="text-[8px] text-zinc-600 uppercase tracking-widest" style={{ fontFamily: "Teko, sans-serif" }}>
            VOTE
          </span>
          <button
            onClick={(e) => vote("opponent", e)}
            className={`text-[9px] font-black uppercase tracking-wider transition-all ${
              myVote === "opponent" ? "text-red-400 scale-105" : "text-red-400/50 hover:text-red-400/80"
            }`}
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            {redVotes}
          </button>
        </div>
        {/* The bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full transition-all duration-500 ease-out rounded-l-full"
            style={{
              width: `${bluePercent}%`,
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
              minWidth: total > 0 && blueVotes > 0 ? 4 : 0,
            }}
          />
          <div
            className="h-full transition-all duration-500 ease-out rounded-r-full"
            style={{
              width: `${redPercent}%`,
              background: "linear-gradient(90deg, #f87171, #ef4444)",
              minWidth: total > 0 && redVotes > 0 ? 4 : 0,
            }}
          />
        </div>
      </div>
    );
  }

  // Full-size for the detail page
  return (
    <div
      className="mx-4 mb-4 rounded-xl px-3 py-2.5"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header row: label + vote count */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-500" style={{ fontFamily: "Teko, sans-serif" }}>
          Who Wins?
        </p>
        {total > 0 && (
          <p className="text-[9px] font-bold text-zinc-600 tabular-nums">
            {total} vote{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Compact vote chips */}
      <div className="flex items-center gap-1.5 mb-2">
        <button
          onClick={(e) => vote("challenger", e)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            myVote === "challenger" ? "text-white" : "text-blue-300/80 hover:text-blue-200"
          }`}
          style={{
            fontFamily: "Teko, sans-serif",
            background: myVote === "challenger"
              ? "linear-gradient(135deg, rgba(37,99,235,0.35), rgba(59,130,246,0.25))"
              : "rgba(59,130,246,0.08)",
            border: myVote === "challenger" ? "1px solid rgba(96,165,250,0.6)" : "1px solid rgba(59,130,246,0.18)",
            boxShadow: myVote === "challenger" ? "0 0 10px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: "0 0 6px rgba(59,130,246,0.8)" }} />
          <span className="truncate max-w-[80px]">{challengerUsername}</span>
          <span className="tabular-nums opacity-80">{blueVotes}</span>
        </button>

        <span className="text-[8px] font-black text-zinc-600 px-0.5" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>

        <button
          onClick={(e) => vote("opponent", e)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
            myVote === "opponent" ? "text-white" : "text-red-300/80 hover:text-red-200"
          }`}
          style={{
            fontFamily: "Teko, sans-serif",
            background: myVote === "opponent"
              ? "linear-gradient(135deg, rgba(220,38,38,0.35), rgba(239,68,68,0.25))"
              : "rgba(239,68,68,0.08)",
            border: myVote === "opponent" ? "1px solid rgba(248,113,113,0.6)" : "1px solid rgba(239,68,68,0.18)",
            boxShadow: myVote === "opponent" ? "0 0 10px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)" }} />
          <span className="truncate max-w-[80px]">{opponentUsername || "TBA"}</span>
          <span className="tabular-nums opacity-80">{redVotes}</span>
        </button>
      </div>

      {/* Slim progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${bluePercent}%`,
            background: "linear-gradient(90deg, #2563eb, #60a5fa)",
            boxShadow: blueVotes > 0 ? "0 0 8px rgba(59,130,246,0.5)" : "none",
            minWidth: total > 0 && blueVotes > 0 ? 4 : 0,
          }}
        />
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${redPercent}%`,
            background: "linear-gradient(90deg, #f87171, #dc2626)",
            boxShadow: redVotes > 0 ? "0 0 8px rgba(239,68,68,0.5)" : "none",
            minWidth: total > 0 && redVotes > 0 ? 4 : 0,
          }}
        />
      </div>
    </div>
  );
}
