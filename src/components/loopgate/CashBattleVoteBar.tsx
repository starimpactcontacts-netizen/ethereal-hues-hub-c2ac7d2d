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
            HYPE
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
    <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-[11px] font-black text-center uppercase tracking-[0.2em] text-zinc-500 mb-3" style={{ fontFamily: "Teko, sans-serif" }}>
        Who you got?
      </p>

      <div className="flex items-center gap-2 mb-2">
        {/* Blue vote button */}
        <button
          onClick={(e) => vote("challenger", e)}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${
            myVote === "challenger"
              ? "ring-2 ring-blue-400 bg-blue-500/20 text-blue-300"
              : "bg-blue-500/8 text-blue-400/70 hover:bg-blue-500/15"
          }`}
          style={{ fontFamily: "Teko, sans-serif", border: myVote === "challenger" ? "none" : "1px solid rgba(59,130,246,0.15)" }}
        >
          🔵 {challengerUsername} ({blueVotes})
        </button>

        {/* Red vote button */}
        <button
          onClick={(e) => vote("opponent", e)}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider transition-all ${
            myVote === "opponent"
              ? "ring-2 ring-red-400 bg-red-500/20 text-red-300"
              : "bg-red-500/8 text-red-400/70 hover:bg-red-500/15"
          }`}
          style={{ fontFamily: "Teko, sans-serif", border: myVote === "opponent" ? "none" : "1px solid rgba(239,68,68,0.15)" }}
        >
          🔴 {opponentUsername || "TBA"} ({redVotes})
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full transition-all duration-700 ease-out rounded-l-full"
          style={{
            width: `${bluePercent}%`,
            background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            boxShadow: blueVotes > 0 ? "0 0 12px rgba(59,130,246,0.4)" : "none",
            minWidth: total > 0 && blueVotes > 0 ? 6 : 0,
          }}
        />
        <div
          className="h-full transition-all duration-700 ease-out rounded-r-full"
          style={{
            width: `${redPercent}%`,
            background: "linear-gradient(90deg, #f87171, #ef4444)",
            boxShadow: redVotes > 0 ? "0 0 12px rgba(239,68,68,0.4)" : "none",
            minWidth: total > 0 && redVotes > 0 ? 6 : 0,
          }}
        />
      </div>

      {total > 0 && (
        <p className="text-[9px] text-zinc-600 text-center mt-2">
          {total} vote{total !== 1 ? "s" : ""} · purely for hype
        </p>
      )}
    </div>
  );
}
