import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AURA_CFG, type AuraSlug } from "@/components/loopgate/AuraUsername";

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

function nameStyle(side: "red" | "blue", isLeading: boolean, aura?: string | null): React.CSSProperties {
  const base: React.CSSProperties = {
    ...TEKO,
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "0.09em",
    lineHeight: 1,
    color: "#fff",
  };
  if (aura && AURA_CFG[aura as AuraSlug]) {
    const cfg = AURA_CFG[aura as AuraSlug];
    return { ...base, animation: cfg.animation, ...(cfg.color ? { color: cfg.color } : {}) };
  }
  if (side === "red") {
    return {
      ...base,
      textShadow: isLeading
        ? "-4px 0 #ff0000, 4px 0 rgba(255,200,200,0.95), 0 0 22px rgba(255,20,20,0.65), 0 0 2px rgba(255,80,80,0.4)"
        : "-2px 0 rgba(220,0,0,0.8), 2px 0 rgba(255,220,220,0.6)",
    };
  }
  return {
    ...base,
    textShadow: isLeading
      ? "4px 0 #0044ff, -4px 0 rgba(180,210,255,0.95), 0 0 22px rgba(20,80,255,0.65), 0 0 2px rgba(80,140,255,0.4)"
      : "2px 0 rgba(0,50,220,0.8), -2px 0 rgba(200,220,255,0.6)",
  };
}

export default function FNFVoteScoreboard({
  fightId, redUserId, blueUserId, redUsername, blueUsername,
}: Props) {
  const [redVotes, setRedVotes] = useState(0);
  const [blueVotes, setBlueVotes] = useState(0);
  const [redAura, setRedAura] = useState<string | null>(null);
  const [blueAura, setBlueAura] = useState<string | null>(null);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "quick_fight_votes", filter: `fight_id=eq.${fightId}` }, fetchVotes)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fightId, redUserId, blueUserId]);

  // Fetch equipped auras for both players
  useEffect(() => {
    if (!redUserId && !blueUserId) return;
    supabase
      .from("profiles")
      .select("id, equipped_aura")
      .in("id", [redUserId, blueUserId].filter(Boolean))
      .then(({ data }) => {
        if (!data) return;
        for (const p of data) {
          if (p.id === redUserId) setRedAura((p as any).equipped_aura ?? null);
          if (p.id === blueUserId) setBlueAura((p as any).equipped_aura ?? null);
        }
      });
  }, [redUserId, blueUserId]);

  const total = redVotes + blueVotes;
  const leading: "red" | "blue" | null =
    total === 0 ? null : redVotes === blueVotes ? null : redVotes > blueVotes ? "red" : "blue";
  const redPct = total > 0 ? (redVotes / total) * 100 : 50;

  return (
    <div className="w-full select-none bg-background">
      <div className="w-full" style={{ height: 2, background: "linear-gradient(90deg, #cc0000 0%, #cc0000 40%, rgba(255,255,255,0.15) 50%, #0033cc 60%, #0033cc 100%)" }} />

      <div
        className="flex items-stretch relative"
        style={{ height: 30, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)" }}
      >
        {/* Red name */}
        <div className="flex-1 flex items-center justify-end min-w-0 overflow-hidden"
          style={{ paddingRight: 7, background: "linear-gradient(90deg, hsl(var(--background)) 40%, rgba(140,0,0,0.28) 100%)" }}>
          <motion.span
            className="font-black uppercase truncate"
            style={nameStyle("red", leading === "red", redAura)}
            animate={!redAura && leading === "red" ? { opacity: [1, 0.78, 1] } : { opacity: 1 }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          >
            {redUsername}
          </motion.span>
        </div>

        <div className="flex items-center justify-center shrink-0"
          style={{ width: 38, background: "#cc0000", boxShadow: "inset 0 1px 0 rgba(255,100,100,0.3), 2px 0 12px rgba(200,0,0,0.4)" }}>
          <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", color: "#fff" }}>RED</span>
        </div>

        <div className="flex items-center justify-center shrink-0"
          style={{ minWidth: 56, background: "hsl(var(--background))", borderLeft: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {total > 0 ? (
            <div className="flex items-baseline gap-[5px]">
              <span style={{ ...TEKO, fontSize: 18, fontWeight: 900, color: "#ff4444", letterSpacing: "0.02em", lineHeight: 1 }}>{redVotes}</span>
              <span style={{ ...TEKO, fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 900, lineHeight: 1 }}>–</span>
              <span style={{ ...TEKO, fontSize: 18, fontWeight: 900, color: "#4488ff", letterSpacing: "0.02em", lineHeight: 1 }}>{blueVotes}</span>
            </div>
          ) : (
            <span style={{ ...TEKO, fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.15)", letterSpacing: "0.32em", lineHeight: 1 }}>VS</span>
          )}
        </div>

        <div className="flex items-center justify-center shrink-0"
          style={{ width: 38, background: "#0033cc", boxShadow: "inset 0 1px 0 rgba(100,150,255,0.3), -2px 0 12px rgba(0,50,200,0.4)" }}>
          <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", color: "#fff" }}>BLUE</span>
        </div>

        {/* Blue name */}
        <div className="flex-1 flex items-center min-w-0 overflow-hidden"
          style={{ paddingLeft: 7, background: "linear-gradient(270deg, hsl(var(--background)) 40%, rgba(0,30,140,0.28) 100%)" }}>
          <motion.span
            className="font-black uppercase truncate"
            style={nameStyle("blue", leading === "blue", blueAura)}
            animate={!blueAura && leading === "blue" ? { opacity: [1, 0.78, 1] } : { opacity: 1 }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          >
            {blueUsername}
          </motion.span>
        </div>
      </div>

      <div className="flex w-full" style={{ height: 2 }}>
        <motion.div style={{ background: "#cc0000", height: "100%" }} animate={{ width: `${redPct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
        <div className="flex-1" style={{ background: "#0033cc", height: "100%" }} />
      </div>
    </div>
  );
}
