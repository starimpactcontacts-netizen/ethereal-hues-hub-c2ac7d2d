import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const TEKO = { fontFamily: "Teko, sans-serif" };

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
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "quick_fight_votes",
        filter: `fight_id=eq.${fightId}`,
      }, fetchVotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, redUserId, blueUserId]);

  const total = redVotes + blueVotes;
  const leading: "red" | "blue" | null =
    total === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? "red" : "blue";
  const redPct = total > 0 ? (redVotes / total) * 100 : 50;

  return (
    <div className="w-full bg-black select-none">
      {/* ── HUD bar ── */}
      <div className="flex items-stretch h-9" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Red name */}
        <div className="flex-1 flex items-center justify-end pr-2.5 min-w-0 overflow-hidden"
          style={{ background: "linear-gradient(90deg, #000 60%, rgba(180,20,20,0.18))" }}
        >
          <motion.span
            className="font-black uppercase truncate"
            style={{
              ...TEKO,
              fontSize: 20,
              letterSpacing: "0.08em",
              color: "#fff",
              textShadow: leading === "red"
                ? "-2px 0 #ff2020, 2px 0 rgba(255,200,200,0.7), 0 0 14px rgba(255,40,40,0.55)"
                : "-1px 0 rgba(220,30,30,0.5), 1px 0 rgba(255,255,255,0.6)",
            }}
            animate={leading === "red" ? { opacity: [1, 0.85, 1] } : { opacity: 1 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {redUsername}
          </motion.span>
        </div>

        {/* RED corner block */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 42,
            background: "linear-gradient(180deg, #e02020 0%, #b01010 100%)",
            borderLeft: "1px solid rgba(255,80,80,0.3)",
          }}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white" style={TEKO}>
            RED
          </span>
        </div>

        {/* Center — votes / VS */}
        <div
          className="flex flex-col items-center justify-center shrink-0 border-x"
          style={{
            minWidth: 62,
            background: "#060606",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {total > 0 ? (
            <>
              <div className="flex items-baseline gap-[5px] leading-none">
                <span className="font-black tabular-nums text-red-400" style={{ ...TEKO, fontSize: 19 }}>
                  {redVotes}
                </span>
                <span className="text-white/20 font-black" style={{ ...TEKO, fontSize: 13 }}>—</span>
                <span className="font-black tabular-nums text-blue-400" style={{ ...TEKO, fontSize: 19 }}>
                  {blueVotes}
                </span>
              </div>
              <span className="text-[6px] uppercase tracking-[0.24em] text-white/25 leading-none mt-0.5">
                VOTES
              </span>
            </>
          ) : (
            <span className="font-black uppercase text-white/20" style={{ ...TEKO, fontSize: 17, letterSpacing: "0.28em" }}>
              VS
            </span>
          )}
        </div>

        {/* BLUE corner block */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 42,
            background: "linear-gradient(180deg, #1a6ae8 0%, #1040b0 100%)",
            borderRight: "1px solid rgba(80,140,255,0.3)",
          }}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white" style={TEKO}>
            BLUE
          </span>
        </div>

        {/* Blue name */}
        <div className="flex-1 flex items-center pl-2.5 min-w-0 overflow-hidden"
          style={{ background: "linear-gradient(270deg, #000 60%, rgba(20,60,200,0.18))" }}
        >
          <motion.span
            className="font-black uppercase truncate"
            style={{
              ...TEKO,
              fontSize: 20,
              letterSpacing: "0.08em",
              color: "#fff",
              textShadow: leading === "blue"
                ? "2px 0 #2060ff, -2px 0 rgba(180,210,255,0.7), 0 0 14px rgba(40,100,255,0.55)"
                : "1px 0 rgba(30,70,220,0.5), -1px 0 rgba(255,255,255,0.6)",
            }}
            animate={leading === "blue" ? { opacity: [1, 0.85, 1] } : { opacity: 1 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {blueUsername}
          </motion.span>
        </div>
      </div>

      {/* ── Vote split bar ── */}
      <div className="flex h-[3px] w-full">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #c01010, #ef4444)" }}
          animate={{ width: `${redPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <div
          className="flex-1 h-full"
          style={{ background: "linear-gradient(90deg, #3b82f6, #1040c0)" }}
        />
      </div>
    </div>
  );
}
