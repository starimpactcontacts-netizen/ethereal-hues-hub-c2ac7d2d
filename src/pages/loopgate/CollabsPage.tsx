import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Swords, Users, Flame, Clock, Music, Trophy, Sparkles, UserPlus, Zap, Crown } from "lucide-react";
import { useCollabs, type CollabSlot } from "@/hooks/useCollabs";
import { useCollabBattles, type CollabBattle } from "@/hooks/useCollabBattles";
import { useAuth } from "@/hooks/useAuth";

type Tab = "live" | "lobby" | "top" | "mine";

/* ------------------------------------------------------------------ */
/*  countdown                                                          */
/* ------------------------------------------------------------------ */
function useCountdown(iso: string) {
  const [, force] = useState(0);
  useMemo(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ENDED";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}H ${m}M` : `${m}M`;
}

/* ------------------------------------------------------------------ */
/*  duo avatar pair                                                    */
/* ------------------------------------------------------------------ */
function DuoFaces({ slot, side }: { slot: CollabSlot; side: "L" | "R" }) {
  const order: Array<{ url: string | null; name: string }> =
    side === "L"
      ? [
          { url: slot.creator_avatar_url, name: slot.creator_username },
          { url: slot.partner_avatar_url, name: slot.partner_username ?? "?" },
        ]
      : [
          { url: slot.partner_avatar_url, name: slot.partner_username ?? "?" },
          { url: slot.creator_avatar_url, name: slot.creator_username },
        ];
  return (
    <div className={`flex ${side === "L" ? "-space-x-3" : "-space-x-3 flex-row-reverse space-x-reverse"}`}>
      {order.map((p, i) => (
        <div
          key={i}
          className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
            side === "L" ? "border-violet-400/80" : "border-sky-400/80"
          } bg-[#0a0612] flex items-center justify-center text-[11px] font-black text-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.5)]`}
        >
          {p.url ? (
            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            p.name.slice(0, 2).toUpperCase()
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  bracket battle row                                                 */
/* ------------------------------------------------------------------ */
function BracketRow({ battle, index }: { battle: CollabBattle; index: number }) {
  const cd = useCountdown(battle.ends_at);
  const total = (battle.score_a ?? 0) + (battle.score_b ?? 0);
  const pctA = total > 0 ? Math.round((battle.score_a / total) * 100) : 50;
  const pctB = 100 - pctA;
  const aLeads = battle.score_a > battle.score_b;
  const bLeads = battle.score_b > battle.score_a;

  const SideBlock = ({
    slot,
    side,
    score,
    pct,
    leads,
  }: {
    slot: CollabSlot;
    side: "L" | "R";
    score: number;
    pct: number;
    leads: boolean;
  }) => {
    const accent = side === "L" ? "violet" : "sky";
    return (
      <div
        className={`flex-1 min-w-0 rounded-2xl p-3 border ${
          leads
            ? side === "L"
              ? "border-violet-400/60 bg-violet-500/[0.08]"
              : "border-sky-400/60 bg-sky-500/[0.08]"
            : "border-white/10 bg-white/[0.03]"
        } backdrop-blur-md`}
      >
        <div className={`flex items-center gap-2.5 ${side === "R" ? "flex-row-reverse" : ""}`}>
          <DuoFaces slot={slot} side={side} />
          <div className={`min-w-0 flex-1 ${side === "R" ? "text-right" : ""}`}>
            <p className="text-[12px] font-bold text-white truncate leading-tight">
              {slot.creator_username}
              <span className={`text-${accent}-300`}>{" × "}</span>
              <span className="text-white/80">{slot.partner_username ?? "?"}</span>
            </p>
            <p className={`text-[9px] uppercase tracking-widest text-${accent}-300/80 mt-0.5 font-black`}>
              DUO {side === "L" ? "A" : "B"}
            </p>
          </div>
        </div>
        <div className={`mt-2 flex items-baseline gap-1.5 ${side === "R" ? "justify-end" : ""}`}>
          <span
            className={`text-${accent}-300 text-[28px] font-black leading-none`}
            style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
          >
            {score.toFixed(1)}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-white/50">{pct}%</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative"
    >
      {/* meta strip */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span
          className="text-[10px] font-black tracking-[0.18em] uppercase text-white/50"
          style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
        >
          BATTLE #{battle.id.slice(0, 6).toUpperCase()}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
          </span>
          <span className="text-[10px] font-black tracking-widest text-rose-300 uppercase">LIVE</span>
          <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {cd}
          </span>
        </span>
      </div>

      {/* bracket */}
      <div
        className="rounded-3xl p-[1.5px] shadow-[0_8px_0_rgba(0,0,0,0.45)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(255,255,255,0.05) 50%, rgba(56,189,248,0.6))",
        }}
      >
        <div
          className="rounded-[22px] p-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,10,40,0.95) 0%, rgba(8,4,18,0.97) 100%)",
          }}
        >
          <div className="flex items-stretch gap-2">
            <SideBlock slot={battle.slot_a} side="L" score={battle.score_a} pct={pctA} leads={aLeads} />

            {/* hex VS */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-white/[0.04] border border-white/15"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                />
                <span
                  className="relative text-white text-[16px] font-black tracking-tight"
                  style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
                >
                  VS
                </span>
              </div>
            </div>

            <SideBlock slot={battle.slot_b} side="R" score={battle.score_b} pct={pctB} leads={bLeads} />
          </div>

          {/* split bar */}
          <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-white/5 flex">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
              style={{ width: `${pctA}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-700"
              style={{ width: `${pctB}%` }}
            />
          </div>

          {/* footer cheers + watch */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[10px] text-white/60 font-mono">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-violet-300" />
                {battle.reactions_a}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-300" />
                {(battle.judge_score_a + battle.judge_score_b).toFixed(0)}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-sky-300" />
                {battle.reactions_b}
              </span>
            </div>
            <Link
              to={`/duo-battle/${battle.id}`}
              className="rounded-xl px-4 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest active:translate-y-[1px] shadow-[0_3px_0_rgba(0,0,0,0.5)] flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3" />
              ENTER
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  open slot card (lobby grid)                                        */
/* ------------------------------------------------------------------ */
function OpenSlotCard({ slot }: { slot: CollabSlot }) {
  return (
    <Link
      to={`/collab/${slot.id}`}
      className="block rounded-2xl p-[1.5px] active:scale-[0.98] transition-transform shadow-[0_5px_0_rgba(0,0,0,0.4)]"
      style={{
        background:
          "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(255,255,255,0.04) 50%, rgba(124,58,237,0.45))",
      }}
    >
      <div
        className="rounded-[14px] p-3 h-full flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,14,55,0.95) 0%, rgba(10,5,22,0.98) 100%)",
        }}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[8px] font-black tracking-[0.18em] uppercase text-violet-300 flex items-center gap-1">
            <UserPlus className="w-2.5 h-2.5" />
            SEAT OPEN
          </span>
          <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {slot.total_duration_seconds}s
          </span>
        </div>

        {/* duo seats */}
        <div className="flex items-center justify-center gap-2 my-2">
          {/* creator seat (filled) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-400/80 bg-[#0a0612] flex items-center justify-center text-[11px] font-black text-white/80">
              {slot.creator_avatar_url ? (
                <img src={slot.creator_avatar_url} alt={slot.creator_username} className="w-full h-full object-cover" />
              ) : (
                slot.creator_username.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="text-[9px] text-white/70 font-bold truncate max-w-[60px]">
              {slot.creator_username}
            </span>
          </div>

          {/* + */}
          <span
            className="text-violet-300/60 text-[20px] font-black px-1"
            style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
          >
            +
          </span>

          {/* empty seat */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-violet-300/60 bg-violet-500/[0.06] flex items-center justify-center animate-pulse">
              <UserPlus className="w-5 h-5 text-violet-300" />
            </div>
            <span className="text-[9px] text-violet-300 font-black uppercase tracking-wider">
              YOU?
            </span>
          </div>
        </div>

        {/* song */}
        <div className="mt-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 flex items-center gap-1.5">
          <Music className="w-3 h-3 text-violet-300 shrink-0" />
          <span className="text-[10px] text-white/80 font-bold truncate">{slot.song_title}</span>
        </div>

        {/* CTA */}
        <div className="mt-2.5 rounded-xl py-2 text-center bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_3px_0_rgba(0,0,0,0.4)] active:translate-y-[1px]">
          JOIN DUO
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  page                                                               */
/* ------------------------------------------------------------------ */
export default function CollabsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("live");
  const { openSlots, mySlots, topToday, loading: loadingSlots } = useCollabs();
  const { liveBattles, loading: loadingBattles } = useCollabBattles();

  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "live", label: "Live Bracket", icon: Swords, count: liveBattles.length },
    { key: "lobby", label: "Open Lobby", icon: Users, count: openSlots.length },
    { key: "top", label: "Top Today", icon: Crown, count: topToday.length },
    { key: "mine", label: "Mine", icon: Sparkles, count: mySlots.length },
  ];

  const loading = tab === "live" ? loadingBattles : loadingSlots;

  return (
    <div
      className="relative min-h-screen text-white pb-32 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #150826 0%, #0a0418 45%, #000000 100%)",
      }}
    >
      {/* atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 25% 0%, rgba(168,85,247,0.30), transparent 55%), radial-gradient(ellipse at 80% 10%, rgba(56,189,248,0.22), transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* HEADER */}
      <div
        className="relative sticky top-0 z-30 backdrop-blur-xl border-b border-white/5"
        style={{
          background:
            "linear-gradient(to bottom, rgba(21,8,38,0.9), rgba(10,4,24,0.75))",
        }}
      >
        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <button onClick={() => navigate("/arena")} className="-ml-2 p-2 rounded-full active:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1
              className="text-[34px] font-black tracking-tight uppercase leading-none"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              Duo Battles
            </h1>
            <span className="text-[8px] font-black tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
              LIVE
            </span>
          </div>
          <button
            onClick={() => (user ? navigate("/collabs/create") : navigate("/start"))}
            className="rounded-full px-3.5 py-2 bg-white text-black text-[11px] font-black tracking-widest uppercase flex items-center gap-1 active:translate-y-[2px] shadow-[0_4px_0_rgba(0,0,0,0.5)]"
          >
            <Plus className="w-3.5 h-3.5" />
            CREATE
          </button>
        </div>

        {/* HUD stats */}
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: "LIVE", value: liveBattles.length, color: "text-rose-300", border: "border-rose-400/30" },
            { label: "OPEN", value: openSlots.length, color: "text-violet-300", border: "border-violet-400/30" },
            { label: "TOP 24H", value: topToday.length, color: "text-sky-300", border: "border-sky-400/30" },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl px-2.5 py-1.5 bg-white/[0.03] border ${s.border} backdrop-blur-md flex items-baseline justify-between`}
            >
              <span
                className={`${s.color} text-[20px] font-black leading-none`}
                style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
              >
                {s.value}
              </span>
              <span className="text-[9px] font-black tracking-widest text-white/50 uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-widest transition-all ${
                  active
                    ? "bg-white text-black shadow-[0_3px_0_rgba(0,0,0,0.5)]"
                    : "bg-white/[0.05] text-white/70 border border-white/10 backdrop-blur-md"
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] ${active ? "text-black/60" : "text-violet-300"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO PITCH (only on live) */}
      {tab === "live" && (
        <div className="relative px-4 pt-4">
          <div
            className="rounded-3xl p-4 border border-white/10 backdrop-blur-md shadow-[0_6px_0_rgba(0,0,0,0.4)] overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.28) 0%, rgba(0,0,0,0.45) 50%, rgba(56,189,248,0.28) 100%)",
            }}
          >
            <p
              className="text-[24px] font-black tracking-tight leading-none"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              <span className="text-violet-300">DUO</span> vs <span className="text-sky-300">DUO</span>.
              ONE WINNER.
            </p>
            <p className="text-[11px] text-white/70 mt-1.5 leading-snug">
              Two editors collab on one song, then their edit clashes against another duo.
              Cheers + judge QOI decide. Winners split <span className="text-amber-300 font-black">7× XP + Index</span>.
            </p>
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="relative px-4 pt-4">
        {loading && (
          <div className="text-center text-violet-300/60 py-12 text-sm">Loading…</div>
        )}

        {/* LIVE BRACKET */}
        {tab === "live" && !loading && (
          <>
            {liveBattles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] py-12 px-6 text-center">
                <Swords className="w-8 h-8 text-violet-300 mx-auto mb-2" />
                <p className="text-white text-[13px] font-bold mb-1">No live brackets yet</p>
                <p className="text-white/50 text-[11px] leading-snug max-w-[260px] mx-auto">
                  Two duos need to ship to start a battle. Form yours from the lobby.
                </p>
                <button
                  onClick={() => setTab("lobby")}
                  className="mt-3 rounded-xl px-4 py-2 bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  Open Lobby
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {liveBattles.map((b, i) => (
                  <BracketRow key={b.id} battle={b} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* OPEN LOBBY */}
        {tab === "lobby" && !loading && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-[22px] font-black uppercase tracking-tight leading-none"
                style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
              >
                Find a Partner
              </h2>
              <span className="text-[9px] font-black tracking-widest text-white/50 uppercase">
                {openSlots.length} OPEN
              </span>
            </div>

            {openSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] py-12 px-6 text-center">
                <UserPlus className="w-8 h-8 text-violet-300 mx-auto mb-2" />
                <p className="text-white text-[13px] font-bold mb-1">Lobby empty</p>
                <p className="text-white/50 text-[11px] leading-snug max-w-[260px] mx-auto">
                  Be the first to post a duo seat. Pick a song, claim half, ship.
                </p>
                <button
                  onClick={() => (user ? navigate("/collabs/create") : navigate("/start"))}
                  className="mt-3 rounded-xl px-4 py-2 bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest"
                >
                  Post a Seat
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {openSlots.map((s) => (
                  <OpenSlotCard key={s.id} slot={s} />
                ))}
                {/* always-on create card */}
                <button
                  onClick={() => (user ? navigate("/collabs/create") : navigate("/start"))}
                  className="rounded-2xl border border-dashed border-violet-400/40 bg-violet-500/[0.04] flex flex-col items-center justify-center gap-2 p-3 min-h-[180px] active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/40 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-violet-300" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white">
                    Post Your Seat
                  </p>
                  <p className="text-[9px] text-white/50 leading-snug text-center px-2">
                    Pick song · split edit · ship
                  </p>
                </button>
              </div>
            )}
          </>
        )}

        {/* TOP TODAY */}
        {tab === "top" && !loading && (
          <>
            <h2
              className="text-[22px] font-black uppercase tracking-tight leading-none mb-3"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              Top Duos · 24h
            </h2>
            {topToday.length === 0 ? (
              <div className="text-center text-white/50 py-12 text-sm px-6">
                Top duos will appear once cheers roll in.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topToday.map((s, i) => (
                  <Link
                    key={s.id}
                    to={`/collab/${s.id}`}
                    className="rounded-2xl p-3 bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-3 active:scale-[0.99] transition-transform"
                  >
                    <span
                      className="text-[28px] font-black w-8 text-center text-amber-300"
                      style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex -space-x-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-violet-400/70 bg-[#0a0612]">
                        {s.creator_avatar_url && (
                          <img src={s.creator_avatar_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-400/70 bg-[#0a0612]">
                        {s.partner_avatar_url && (
                          <img src={s.partner_avatar_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">
                        {s.creator_username} <span className="text-violet-300">×</span>{" "}
                        {s.partner_username ?? "?"}
                      </p>
                      <p className="text-[10px] text-white/50 truncate">{s.song_title}</p>
                    </div>
                    <span className="text-[12px] font-black text-orange-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {s.reaction_score}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* MINE */}
        {tab === "mine" && !loading && (
          <>
            <h2
              className="text-[22px] font-black uppercase tracking-tight leading-none mb-3"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              Your Duos
            </h2>
            {mySlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] py-12 px-6 text-center">
                <Sparkles className="w-8 h-8 text-violet-300 mx-auto mb-2" />
                <p className="text-white text-[13px] font-bold mb-1">No duos yet</p>
                <p className="text-white/50 text-[11px]">Post a seat or join an open lobby.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {mySlots.map((s) => (
                  <OpenSlotCard key={s.id} slot={s} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
