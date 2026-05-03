import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import loopgateLogo from "@/assets/loopgate-logo.png";

const teko = { fontFamily: "Teko, sans-serif" };

interface Props {
  fightId: string;
  redUserId: string;
  blueUserId: string;
  redUsername: string;
  blueUsername: string;
  redAvatarUrl?: string | null;
  blueAvatarUrl?: string | null;
  /** Optional — highlights the active side (e.g. the side currently playing). */
  activeSide?: "red" | "blue" | null;
}

/**
 * Friday Night Funkin'-style vote health bar.
 * Two avatars on each side, animated red/blue split bar in the middle, live vote counts.
 */
export default function FNFVoteScoreboard({
  fightId,
  redUserId,
  blueUserId,
  redUsername,
  blueUsername,
  redAvatarUrl,
  blueAvatarUrl,
  activeSide = null,
}: Props) {
  const [redVotes, setRedVotes] = useState(0);
  const [blueVotes, setBlueVotes] = useState(0);

  useEffect(() => {
    if (!fightId) return;
    const fetchVotes = async () => {
      const { data } = await supabase
        .from("quick_fight_votes")
        .select("voted_for")
        .eq("fight_id", fightId);
      if (!data) return;
      let r = 0,
        b = 0;
      for (const v of data) {
        if (v.voted_for === redUserId) r++;
        else if (v.voted_for === blueUserId) b++;
      }
      setRedVotes(r);
      setBlueVotes(b);
    };
    fetchVotes();
    const ch = supabase
      .channel(`fnf_votes_${fightId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quick_fight_votes", filter: `fight_id=eq.${fightId}` },
        fetchVotes,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fightId, redUserId, blueUserId]);

  const total = redVotes + blueVotes;
  const redBarPct = total === 0 ? 50 : (redVotes / total) * 100;
  const blueBarPct = 100 - redBarPct;
  const leading: "red" | "blue" | null =
    total === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? "red" : "blue";

  const SideAvatar = ({
    side,
    username,
    avatarUrl,
  }: {
    side: "red" | "blue";
    username: string;
    avatarUrl?: string | null;
  }) => {
    const isRed = side === "red";
    const ring = isRed ? "ring-red-500" : "ring-blue-500";
    const glow = isRed ? "0 0 14px rgba(239,68,68,0.7)" : "0 0 14px rgba(59,130,246,0.7)";
    const isActive = activeSide === side;
    return (
      <div
        className={`shrink-0 w-10 h-10 rounded-full overflow-hidden bg-black ring-2 ${ring} ${isActive ? "animate-pulse" : ""}`}
        style={{ boxShadow: glow }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center text-white text-base font-black ${isRed ? "bg-red-500/30" : "bg-blue-500/30"}`}
            style={teko}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-black z-20 px-3 py-2.5 border-y border-white/10">
      <div className="flex items-center gap-2.5">
        <SideAvatar side="red" username={redUsername} avatarUrl={redAvatarUrl} />

        {/* Health bar */}
        <div className="relative flex-1 h-8">
          <div className="absolute inset-0 rounded-full overflow-hidden border border-white/15 bg-black/80 flex">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${redBarPct}%`,
                background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "inset 0 0 12px rgba(239,68,68,0.6)",
              }}
            />
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${blueBarPct}%`,
                background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "inset 0 0 12px rgba(59,130,246,0.6)",
              }}
            />
          </div>

          {/* Vote counts */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            <span
              className="text-[13px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {redVotes}
            </span>
            <span
              className="text-[13px] font-black text-white tabular-nums leading-none"
              style={{ ...teko, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
            >
              {blueVotes}
            </span>
          </div>

          {/* Loopgate chip — sits at the boundary between red & blue (shows who's winning) */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
            style={{ left: `${redBarPct}%` }}
          >
            <div
              className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden"
              style={{
                border: "1.5px solid rgba(255,255,255,0.35)",
                boxShadow:
                  "0 0 14px rgba(0,0,0,0.9), 0 0 18px rgba(239,68,68,0.45), 0 0 18px rgba(59,130,246,0.45)",
              }}
            >
              <img
                src={loopgateLogo}
                alt="Loopgate"
                className="w-7 h-7 object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <SideAvatar side="blue" username={blueUsername} avatarUrl={blueAvatarUrl} />
      </div>

      {/* Sub-row */}
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 truncate max-w-[35%]" style={teko}>
          @{redUsername}
        </span>
        <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-500 tabular-nums" style={teko}>
          {total === 0
            ? "NO VOTES YET"
            : `${total} ${total === 1 ? "VOTE" : "VOTES"}${leading ? ` · ${leading.toUpperCase()} LEADS` : ""}`}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 truncate max-w-[35%] text-right" style={teko}>
          @{blueUsername}
        </span>
      </div>
    </div>
  );
}