import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserRound, Plus, Music, Clock, Flame, Crown } from "lucide-react";
import { useCollabs, type CollabSlot } from "@/hooks/useCollabs";
import { ArenaRail, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

const CARD_W = 200;
const CARD_H = 220;

function CompactCollabCard({ slot, rank }: { slot: CollabSlot; rank?: number }) {
  const isLive = slot.status === "live";
  const isOpen = slot.status === "open";
  const statusLabel = isLive
    ? "LIVE"
    : isOpen
      ? "OPEN · NEEDS PARTNER"
      : slot.status.toUpperCase().replace("_", " ");
  const statusColor = isLive
    ? "text-emerald-400"
    : isOpen
      ? "text-violet-300"
      : "text-amber-300";

  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <Link
        to={`/collab/${slot.id}`}
        className="block w-full h-full rounded-2xl p-[1px] active:scale-[0.98] transition-transform"
        style={{
          background: isLive
            ? "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(255,255,255,0.05), rgba(16,185,129,0.45))"
            : "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(255,255,255,0.05), rgba(124,58,237,0.4))",
        }}
      >
        <div
          className="relative w-full h-full rounded-[15px] p-3 flex flex-col overflow-hidden"
          style={{ background: "linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 6%) 100%)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="flex items-center justify-between mb-2">
            {rank !== undefined && rank <= 3 ? (
              <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> #{rank}
              </span>
            ) : (
              <span className={`text-[8px] font-black tracking-widest uppercase ${statusColor}`}>
                {isLive ? "● LIVE" : isOpen ? "○ OPEN" : statusLabel}
              </span>
            )}
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {slot.total_duration_seconds}s
            </span>
          </div>

          <div className="flex items-center -space-x-2 mb-2">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-violet-400/70 bg-[#1a1a1f] flex items-center justify-center text-[10px] font-bold text-white/70">
              {slot.creator_avatar_url ? (
                <img src={slot.creator_avatar_url} alt={slot.creator_username} className="w-full h-full object-cover" />
              ) : (
                slot.creator_username.slice(0, 2).toUpperCase()
              )}
            </div>
            {slot.partner_id ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-violet-400/70 bg-[#1a1a1f] flex items-center justify-center text-[10px] font-bold text-white/70">
                {slot.partner_avatar_url ? (
                  <img src={slot.partner_avatar_url} alt={slot.partner_username ?? ""} className="w-full h-full object-cover" />
                ) : (
                  (slot.partner_username ?? "?").slice(0, 2).toUpperCase()
                )}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-violet-400/60 bg-violet-500/5 flex items-center justify-center text-[8px] font-bold text-violet-300 uppercase">
                Join
              </div>
            )}
          </div>

          <p className="text-[11px] font-bold text-foreground truncate">
            {slot.creator_username}
            <span className={slot.partner_username ? "text-violet-300" : "text-muted-foreground"}>
              {" × "}{slot.partner_username ?? "???"}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate mt-0.5">
            <Music className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{slot.song_title}</span>
          </p>

          <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
            {isLive ? (
              <span className="text-[10px] text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {slot.reaction_score}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground truncate">
                {isOpen ? "Tap to join" : statusLabel}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLive ? "text-emerald-400" : "text-violet-300"}`}>
              {isLive ? "Watch →" : "Open →"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ArenaCollabsSection({ onCreateClick }: { onCreateClick: () => void }) {
  const navigate = useNavigate();
  const { openSlots, liveSlots, topToday, loading } = useCollabs();

  // Merge: live first, then top today (dedupe), then open lobbies
  const seen = new Set<string>();
  const merged: { slot: CollabSlot; rank?: number }[] = [];
  liveSlots.forEach((s) => { if (!seen.has(s.id)) { merged.push({ slot: s }); seen.add(s.id); } });
  topToday.forEach((s, i) => { if (!seen.has(s.id)) { merged.push({ slot: s, rank: i + 1 }); seen.add(s.id); } });
  openSlots.forEach((s) => { if (!seen.has(s.id)) { merged.push({ slot: s }); seen.add(s.id); } });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-violet-300" />
          <span
            className="text-[15px] font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Collabs
          </span>
          <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-violet-500 text-white">NEW</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/collabs")}
            className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1 whitespace-nowrap"
          >
            View All
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-300 border border-violet-400/30 hover:bg-violet-500/10 rounded transition-colors"
          >
            <Plus className="w-3 h-3" /> Create
          </button>
        </div>
      </div>

      {loading ? (
        <ArenaRailSkeleton count={3} />
      ) : (
        <ArenaRail>
          {merged.map(({ slot, rank }) => (
            <CompactCollabCard key={slot.id} slot={slot} rank={rank} />
          ))}

          {/* Create your own — poster */}
          <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={onCreateClick}
              className="relative w-full h-full bg-surface-1 border border-dashed border-violet-400/25 hover:border-violet-400/50 overflow-hidden rounded-2xl cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 p-3 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-400/30 flex items-center justify-center">
                <Plus className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-[12px] font-bold text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                Start a Collab
              </h3>
              <p className="text-[9px] text-muted-foreground leading-snug">Pick a song · split the edit · 7× rewards</p>
            </motion.div>
          </div>
        </ArenaRail>
      )}
    </motion.section>
  );
}
