import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Plus, Music, Clock, UserPlus } from "lucide-react";
import { useCollabs, type CollabSlot } from "@/hooks/useCollabs";
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

function Avatar({ url, name, ring }: { url: string | null; name: string; ring: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-full overflow-hidden border-2 ${ring} bg-[#0a0612] flex items-center justify-center text-[11px] font-black text-white/80`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function DuoSide({
  creatorName,
  creatorAvatar,
  partnerName,
  partnerAvatar,
  team,
}: {
  creatorName: string;
  creatorAvatar: string | null;
  partnerName: string | null;
  partnerAvatar: string | null;
  team: "blue" | "red";
}) {
  const ring = team === "blue" ? "border-blue-500/60" : "border-red-500/60";
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className="flex -space-x-2">
        <Avatar url={creatorAvatar} name={creatorName} ring={ring} />
        {partnerName ? (
          <Avatar url={partnerAvatar} name={partnerName} ring={ring} />
        ) : (
          <div className={`w-10 h-10 rounded-full border-2 border-dashed ${ring} bg-white/[0.02] flex items-center justify-center`}>
            <span className="text-sm text-white/30 font-bold">?</span>
          </div>
        )}
      </div>
      <span
        className="text-[10px] font-bold text-foreground uppercase truncate max-w-[90px] leading-tight text-center"
        style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.04em" }}
      >
        {creatorName}
        {partnerName ? ` × ${partnerName}` : ""}
      </span>
    </div>
  );
}

function CardShell({
  to,
  children,
  isLive,
}: {
  to: string;
  children: React.ReactNode;
  isLive?: boolean;
}) {
  return (
    <div className="shrink-0 snap-start" style={{ width: CARD_W, height: CARD_H }}>
      <Link
        to={to}
        className="block w-full h-full overflow-hidden rounded-2xl relative"
        style={{
          background: "linear-gradient(160deg, rgba(30,30,40,1) 0%, rgba(10,10,15,1) 100%)",
          boxShadow: isLive
            ? "0 0 24px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: isLive
              ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)"
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          }}
        />
        {children}
      </Link>
    </div>
  );
}

function BattleCard({ battle }: { battle: CollabBattle }) {
  const cd = useCountdown(battle.ends_at);
  const blue = battle.reactions_a;
  const red = battle.reactions_b;
  const tot = blue + red || 1;
  const bluePct = Math.round((blue / tot) * 100);
  const redPct = 100 - bluePct;
  return (
    <CardShell to={`/duo-battle/${battle.id}`} isLive>
      <div className="relative w-full h-full p-3 flex flex-col">
        {/* status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <Clock className="w-2.5 h-2.5" />
            <span>{cd}</span>
          </div>
        </div>

        {/* VS */}
        <div className="relative px-1 py-2 flex-1 flex items-center">
          <div className="relative flex items-center justify-between w-full">
            <DuoSide
              creatorName={battle.slot_a.creator_username}
              creatorAvatar={battle.slot_a.creator_avatar_url}
              partnerName={battle.slot_a.partner_username}
              partnerAvatar={battle.slot_a.partner_avatar_url}
              team="blue"
            />
            <div className="mx-1 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(239,68,68,0.25))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Swords className="w-3 h-3 text-white/70" />
              </div>
            </div>
            <DuoSide
              creatorName={battle.slot_b.creator_username}
              creatorAvatar={battle.slot_b.creator_avatar_url}
              partnerName={battle.slot_b.partner_username}
              partnerAvatar={battle.slot_b.partner_avatar_url}
              team="red"
            />
          </div>
        </div>

        {/* blue vs red bar */}
        <div className="mt-auto">
          <div className="h-1.5 rounded-full overflow-hidden bg-white/5 flex">
            <div className="h-full bg-blue-500" style={{ width: `${bluePct}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${redPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1 text-[9px] font-bold tabular-nums">
            <span className="text-blue-400">{blue}</span>
            <span className="text-red-400">{red}</span>
          </div>
        </div>
      </div>
    </CardShell>
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
    <CardShell to={`/collab/${slot.id}`} isLive>
      <div className="relative w-full h-full p-3 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <Music className="w-2.5 h-2.5" />
            <span className="truncate max-w-[110px]">{slot.song_title}</span>
          </div>
        </div>

        <div className="relative px-1 py-2 flex-1 flex items-center">
          <div className="relative flex items-center justify-between w-full">
            <DuoSide
              creatorName={slot.creator_username}
              creatorAvatar={slot.creator_avatar_url}
              partnerName={slot.partner_username}
              partnerAvatar={slot.partner_avatar_url}
              team="blue"
            />
            <div className="mx-1 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(239,68,68,0.25))",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Swords className="w-3 h-3 text-white/70" />
              </div>
            </div>
            {/* awaiting challenger duo */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="flex -space-x-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-dashed border-red-500/60 bg-white/[0.02] flex items-center justify-center"
                  >
                    <UserPlus className="w-4 h-4 text-red-400/70" />
                  </div>
                ))}
              </div>
              <span
                className="text-[10px] font-bold uppercase text-zinc-500 leading-tight"
                style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.04em" }}
              >
                Awaiting
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto h-1.5 rounded-full overflow-hidden bg-white/5 flex">
          <div className="h-full bg-blue-500/40" style={{ width: `100%` }} />
        </div>
      </div>
    </CardShell>
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
