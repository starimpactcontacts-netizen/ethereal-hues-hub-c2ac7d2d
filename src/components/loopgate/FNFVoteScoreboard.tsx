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
    <div className="w-full select-none" style={{ background: "#000", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}>
      {/* 1px broadcast highlight at top */}
      <div className="w-full h-px" style={{ background: "linear-gradient(90deg, rgba(200,0,0,0.7) 0%, rgba(255,255,255,0.12) 50%, rgba(0,60,200,0.7) 100%)" }} />

      {/* ── HUD bar ── */}
      <div className="flex items-stretch" style={{ height: 28 }}>

        {/* Red name */}
        <div
          className="flex-1 flex items-center justify-end min-w-0 overflow-hidden"
          style={{ paddingRight: 8, background: "linear-gradient(90deg, #000 50%, rgba(160,10,10,0.22))" }}
        >
          <motion.span
            className="font-black uppercase truncate"
            style={{
              ...TEKO,
              fontSize: 17,
              letterSpacing: "0.1em",
              lineHeight: 1,
              color: "#fff",
              textShadow: leading === "red"
                ? "-3px 0 #ff0000, 3px 0 rgba(255,180,180,0.9), 0 0 18px rgba(255,30,30,0.6)"
                : "-1px 0 rgba(200,20,20,0.55), 1px 0 rgba(255,255,255,0.5)",
            }}
            animate={leading === "red" ? { opacity: [1, 0.8, 1] } : { opacity: 1 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {redUsername}
          </motion.span>
        </div>

        {/* RED corner block — flat solid, hard cut */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 36, background: "#cc1010" }}
        >
          <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", color: "#fff" }}>
            RED
          </span>
        </div>

        {/* Center — score */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{ minWidth: 52, background: "#070707", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          {total > 0 ? (
            <div className="flex items-baseline gap-[4px] leading-none">
              <span style={{ ...TEKO, fontSize: 17, fontWeight: 900, color: "#f87171", letterSpacing: "0.02em" }}>
                {redVotes}
              </span>
              <span style={{ ...TEKO, fontSize: 11, color: "rgba(255,255,255,0.18)", fontWeight: 900 }}>–</span>
              <span style={{ ...TEKO, fontSize: 17, fontWeight: 900, color: "#60a5fa", letterSpacing: "0.02em" }}>
                {blueVotes}
              </span>
            </div>
          ) : (
            <span style={{ ...TEKO, fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.18)", letterSpacing: "0.3em" }}>
              VS
            </span>
          )}
        </div>

        {/* BLUE corner block — flat solid, hard cut */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 36, background: "#1040cc" }}
        >
          <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", color: "#fff" }}>
            BLUE
          </span>
        </div>

        {/* Blue name */}
        <div
          className="flex-1 flex items-center min-w-0 overflow-hidden"
          style={{ paddingLeft: 8, background: "linear-gradient(270deg, #000 50%, rgba(10,40,180,0.22))" }}
        >
          <motion.span
            className="font-black uppercase truncate"
            style={{
              ...TEKO,
              fontSize: 17,
              letterSpacing: "0.1em",
              lineHeight: 1,
              color: "#fff",
              textShadow: leading === "blue"
                ? "3px 0 #0044ff, -3px 0 rgba(160,200,255,0.9), 0 0 18px rgba(30,80,255,0.6)"
                : "1px 0 rgba(20,60,210,0.55), -1px 0 rgba(255,255,255,0.5)",
            }}
            animate={leading === "blue" ? { opacity: [1, 0.8, 1] } : { opacity: 1 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {blueUsername}
          </motion.span>
        </div>
      </div>

      {/* ── Vote split bar ── */}
      <div className="flex w-full" style={{ height: 2 }}>
        <motion.div
          style={{ background: "#cc1010", height: "100%" }}
          animate={{ width: `${redPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <div className="flex-1" style={{ background: "#1040cc", height: "100%" }} />
      </div>
    </div>
  );
}
