import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Plus, Music, Clock, Flame, UserPlus, Zap } from "lucide-react";
import { useCollabs, type CollabSlot } from "@/hooks/useCollabs";
import { Trophy } from "lucide-react";
import { useCollabBattles, type CollabBattle } from "@/hooks/useCollabBattles";
import { ArenaRail, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

const CARD_W = 260;
const CARD_H = 220;

function useCountdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ENDED";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}H ${m}M` : `${m}M`;
}

function DuoMini({ slot, side }: { slot: CollabSlot; side: "L" | "R" }) {
  const ring = side === "L" ? "border-violet-400/80" : "border-sky-400/80";
  const accent = side === "L" ? "text-violet-300" : "text-sky-300";
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-1.5 ${side === "R" ? "flex-row-reverse" : ""}`}>
        <div className={`flex ${side === "L" ? "-space-x-1.5" : "-space-x-1.5 flex-row-reverse space-x-reverse"}`}>
          {[slot.creator_avatar_url, slot.partner_avatar_url].map((u, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full overflow-hidden border ${ring} bg-[#0a0612] flex items-center justify-center text-[8px] font-black text-white/80`}
            >
              {u ? <img src={u} alt="" className="w-full h-full object-cover" /> : "?"}
            </div>
          ))}
        </div>
        <span className={`text-[8px] font-black tracking-widest uppercase ${accent}`}>
          DUO {side === "L" ? "A" : "B"}
        </span>
      </div>
      <p className={`text-[10px] font-bold text-white truncate mt-1 ${side === "R" ? "text-right" : ""}`}>
        {slot.creator_username.slice(0, 6)}
        <span className={accent}>×</span>
        {(slot.partner_username ?? "?").slice(0, 6)}
      </p>
    </div>
  );
}

function BattleCard({ battle }: { battle: CollabBattle }) {
  const cd = useCountdown(battle.ends_at);
  const total = battle.score_a + battle.score_b;
  const pctA = total > 0 ? Math.round((battle.score_a / total) * 100) : 50;
  const pctB = 100 - pctA;
  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <Link
        to={`/duo-battle/${battle.id}`}
        className="block w-full h-full rounded-2xl p-[1.5px] active:scale-[0.98] transition-transform shadow-[0_5px_0_rgba(0,0,0,0.45)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(255,255,255,0.04) 50%, rgba(56,189,248,0.6))",
        }}
      >
        <div
          className="relative w-full h-full rounded-[14px] p-3 flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,10,40,0.97) 0%, rgba(8,4,18,0.98) 100%)",
          }}
        >
          {/* meta */}
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              <span className="text-[8px] font-black tracking-widest text-rose-300 uppercase">LIVE</span>
            </span>
            <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {cd}
            </span>
          </div>

          {/* duos + VS */}
          <div className="flex items-center gap-1.5 mb-2">
            <DuoMini slot={battle.slot_a} side="L" />
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <div
                className="absolute inset-0 bg-white/[0.05] border border-white/15"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              />
              <span
                className="relative text-white text-[10px] font-black"
                style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
              >
                VS
              </span>
            </div>
            <DuoMini slot={battle.slot_b} side="R" />
          </div>

          {/* scores */}
          <div className="flex items-center justify-between px-1">
            <span
              className="text-violet-300 text-[22px] font-black leading-none"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              {battle.score_a.toFixed(1)}
            </span>
            <span
              className="text-sky-300 text-[22px] font-black leading-none"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              {battle.score_b.toFixed(1)}
            </span>
          </div>

          {/* split bar */}
          <div className="mt-1.5 h-1 rounded-full overflow-hidden bg-white/5 flex">
            <div className="h-full bg-violet-400" style={{ width: `${pctA}%` }} />
            <div className="h-full bg-sky-400" style={{ width: `${pctB}%` }} />
          </div>

          {/* footer */}
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/5">
            <span className="flex items-center gap-2 text-[9px] text-white/60 font-mono">
              <span className="flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-violet-300" />
                {battle.reactions_a}
              </span>
              <span className="flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-sky-300" />
                {battle.reactions_b}
              </span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" />
              ENTER
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function OpenSeatCard({ slot }: { slot: CollabSlot }) {
  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <Link
        to={`/collab/${slot.id}`}
        className="block w-full h-full rounded-2xl p-[1.5px] active:scale-[0.98] transition-transform shadow-[0_5px_0_rgba(0,0,0,0.4)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(255,255,255,0.04) 50%, rgba(124,58,237,0.4))",
        }}
      >
        <div
          className="relative w-full h-full rounded-[14px] p-3 flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,14,55,0.96) 0%, rgba(10,5,22,0.98) 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-black tracking-[0.18em] uppercase text-violet-300 flex items-center gap-1">
              <UserPlus className="w-2.5 h-2.5" />
              SEAT OPEN
            </span>
            <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {slot.total_duration_seconds}s
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 my-2 flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-400/80 bg-[#0a0612] flex items-center justify-center text-[11px] font-black text-white/80">
                {slot.creator_avatar_url ? (
                  <img src={slot.creator_avatar_url} alt={slot.creator_username} className="w-full h-full object-cover" />
                ) : (
                  slot.creator_username.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-[9px] text-white/70 font-bold truncate max-w-[70px]">
                {slot.creator_username}
              </span>
            </div>

            <span
              className="text-violet-300/60 text-[20px] font-black px-1"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              +
            </span>

            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-violet-300/60 bg-violet-500/[0.06] flex items-center justify-center animate-pulse">
                <UserPlus className="w-5 h-5 text-violet-300" />
              </div>
              <span className="text-[9px] text-violet-300 font-black uppercase tracking-wider">
                YOU?
              </span>
            </div>
          </div>

          <div className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5 mb-2">
            <Music className="w-3 h-3 text-violet-300 shrink-0" />
            <span className="text-[10px] text-white/80 font-bold truncate">{slot.song_title}</span>
          </div>

          <div className="rounded-xl py-1.5 text-center bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_3px_0_rgba(0,0,0,0.4)]">
            JOIN DUO
          </div>
        </div>
      </Link>
    </div>
  );
}

function LiveDuoCard({ slot }: { slot: CollabSlot }) {
  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <Link
        to={`/collab/${slot.id}`}
        className="block w-full h-full rounded-2xl p-[1.5px] active:scale-[0.98] transition-transform shadow-[0_5px_0_rgba(0,0,0,0.45)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(255,255,255,0.04) 50%, rgba(56,189,248,0.6))",
        }}
      >
        <div
          className="relative w-full h-full rounded-[14px] p-3 flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,10,40,0.97) 0%, rgba(8,4,18,0.98) 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              <span className="text-[8px] font-black tracking-widest text-rose-300 uppercase">LIVE DUO</span>
            </span>
            <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              {slot.total_reactions}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <DuoMini slot={slot} side="L" />
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <div
                className="absolute inset-0 bg-white/[0.05] border border-white/15"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              />
              <span
                className="relative text-white text-[10px] font-black"
                style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
              >
                VS
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-row-reverse">
                <div className="flex -space-x-1.5 flex-row-reverse space-x-reverse">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border border-dashed border-sky-400/60 bg-sky-500/[0.06] flex items-center justify-center"
                    >
                      <UserPlus className="w-3 h-3 text-sky-300" />
                    </div>
                  ))}
                </div>
                <span className="text-[8px] font-black tracking-widest uppercase text-sky-300">
                  CHALLENGER
                </span>
              </div>
              <p className="text-[10px] font-bold text-sky-300/80 truncate mt-1 text-right">
                AWAITING
              </p>
            </div>
          </div>

          <div className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5 mb-2">
            <Music className="w-3 h-3 text-violet-300 shrink-0" />
            <span className="text-[10px] text-white/80 font-bold truncate">{slot.song_title}</span>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-[9px] text-white/60 font-mono flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-amber-300" />
              {slot.reaction_score.toFixed(1)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" />
              WATCH
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ArenaCollabsSection({ onCreateClick }: { onCreateClick: () => void }) {
  const navigate = useNavigate();
  const { openSlots, liveSlots, loading: loadingSlots } = useCollabs();
  const { liveBattles, loading: loadingBattles } = useCollabBattles();
  const loading = loadingSlots || loadingBattles;

  // Slots already in a live battle — exclude from standalone live-duo rail
  const inBattle = new Set<string>();
  liveBattles.forEach((b) => {
    inBattle.add(b.slot_a_id);
    inBattle.add(b.slot_b_id);
  });
  const standaloneLive = liveSlots.filter((s) => !inBattle.has(s.id));

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-violet-300" />
          <span
            className="text-[15px] font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Duo Battles
          </span>
          <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/collabs")}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-1"
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
          {liveBattles.map((b) => <BattleCard key={b.id} battle={b} />)}
          {standaloneLive.map((s) => <LiveDuoCard key={s.id} slot={s} />)}
          {openSlots.map((s) => <OpenSeatCard key={s.id} slot={s} />)}

          {/* Create poster */}
          <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={onCreateClick}
              className="relative w-full h-full bg-violet-500/[0.04] border border-dashed border-violet-400/40 hover:border-violet-400/60 overflow-hidden rounded-2xl cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 p-3 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/40 flex items-center justify-center">
                <Plus className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground">
                Post Your Seat
              </h3>
              <p className="text-[9px] text-white/50 leading-snug">Pick song · split edit · ship</p>
            </motion.div>
          </div>
        </ArenaRail>
      )}
    </motion.section>
  );
}
