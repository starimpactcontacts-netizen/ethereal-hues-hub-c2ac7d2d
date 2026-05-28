import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const teko = { fontFamily: "Teko, sans-serif" };

interface Props {
  fightId: string;
  redUserId: string;
  blueUserId: string;
  redUsername: string;
  blueUsername: string;
  redAvatarUrl?: string | null;
  blueAvatarUrl?: string | null;
  activeSide?: "red" | "blue" | null;
}

export default function FNFVoteScoreboard({
  fightId,
  redUserId,
  blueUserId,
  redUsername,
  blueUsername,
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
      let r = 0, b = 0;
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
    return () => { supabase.removeChannel(ch); };
  }, [fightId, redUserId, blueUserId]);

  const total = redVotes + blueVotes;
  const leading: "red" | "blue" | null =
    total === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? "red" : "blue";

  return (
    <div className="relative bg-[#080808]">
      {/* The bar — NAME [RED] score [BLUE] NAME */}
      <div className="flex items-stretch h-11 border-y border-white/[0.06]">

        {/* Red name — right-aligned */}
        <div
          className="flex-1 flex items-center justify-end pr-2.5 min-w-0"
          style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.07))" }}
        >
          <span
            className="font-black uppercase text-white truncate"
            style={{
              ...teko,
              fontSize: 19,
              letterSpacing: "0.07em",
              textShadow: "-2px 0 rgba(255,40,40,0.6), 1px 0 rgba(255,255,255,0.85)",
            }}
          >
            {redUsername}
          </span>
        </div>

        {/* RED tag */}
        <div
          className="flex items-center justify-center px-2.5 shrink-0"
          style={{ background: "rgba(220,38,38,0.95)" }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white" style={teko}>
            RED
          </span>
        </div>

        {/* Center score */}
        <div
          className="flex flex-col items-center justify-center px-3 shrink-0"
          style={{ background: "#0d0d0d", minWidth: 64 }}
        >
          {total > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="font-black text-red-400 tabular-nums" style={{ ...teko, fontSize: 20 }}>
                  {redVotes}
                </span>
                <span className="text-white/20 text-base">·</span>
                <span className="font-black text-blue-400 tabular-nums" style={{ ...teko, fontSize: 20 }}>
                  {blueVotes}
                </span>
              </div>
              <span className="text-[6px] uppercase tracking-[0.22em] text-white/25 mt-px">
                {leading === "red" ? "RED LEADS" : leading === "blue" ? "BLUE LEADS" : "TIED"}
              </span>
            </>
          ) : (
            <span
              className="text-[11px] uppercase tracking-[0.2em] text-white/25 font-black"
              style={teko}
            >
              VS
            </span>
          )}
        </div>

        {/* BLUE tag */}
        <div
          className="flex items-center justify-center px-2.5 shrink-0"
          style={{ background: "rgba(37,99,235,0.95)" }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white" style={teko}>
            BLUE
          </span>
        </div>

        {/* Blue name — left-aligned */}
        <div
          className="flex-1 flex items-center pl-2.5 min-w-0"
          style={{ background: "linear-gradient(270deg, transparent, rgba(59,130,246,0.07))" }}
        >
          <span
            className="font-black uppercase text-white truncate"
            style={{
              ...teko,
              fontSize: 19,
              letterSpacing: "0.07em",
              textShadow: "2px 0 rgba(40,100,255,0.6), -1px 0 rgba(255,255,255,0.85)",
            }}
          >
            {blueUsername}
          </span>
        </div>
      </div>
    </div>
  );
}
