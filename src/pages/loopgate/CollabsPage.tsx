import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Users, Crown, Flame, Sparkles } from "lucide-react";
import { useCollabs } from "@/hooks/useCollabs";
import { useAuth } from "@/hooks/useAuth";
import CollabSlotCard from "@/components/loopgate/collabs/CollabSlotCard";

type Tab = "lobby" | "live" | "top" | "mine";

export default function CollabsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("lobby");
  const { openSlots, liveSlots, mySlots, topToday, loading } = useCollabs();

  const TABS: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "lobby", label: "Lobby", icon: Users, count: openSlots.length },
    { key: "live", label: "Live", icon: Flame, count: liveSlots.length },
    { key: "top", label: "Top Today", icon: Crown, count: topToday.length },
    { key: "mine", label: "Mine", icon: Sparkles, count: mySlots.length },
  ];

  const list =
    tab === "lobby"
      ? openSlots
      : tab === "live"
        ? liveSlots
        : tab === "top"
          ? topToday
          : mySlots;

  const empty =
    !loading && list.length === 0
      ? tab === "lobby"
        ? "No open collab slots right now. Be the first — create one and find a partner."
        : tab === "live"
          ? "No live collabs yet today."
          : tab === "top"
            ? "Top collabs will appear here once today's reactions roll in."
            : "You haven't started a collab yet. Tap Create Collab."
      : null;

  return (
    <div
      className="relative min-h-screen text-white pb-32 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #1a0b2e 0%, #0f0820 45%, #000000 100%)",
      }}
    >
      {/* Violet stage glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.35), rgba(124,58,237,0.12) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Header */}
      <div className="relative sticky top-0 z-30 backdrop-blur-xl border-b border-white/5"
        style={{ background: "linear-gradient(to bottom, rgba(26,11,46,0.85), rgba(15,8,32,0.7))" }}
      >
        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <button onClick={() => navigate("/arena")} className="-ml-2 p-2 rounded-full active:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h1
              className="text-3xl font-black tracking-tight uppercase leading-none"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              Collabs
            </h1>
            <span className="text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-violet-500 text-white">NEW</span>
          </div>
          <button
            onClick={() => (user ? navigate("/collabs/create") : navigate("/start"))}
            className="rounded-full px-3.5 py-2 bg-gradient-to-b from-violet-400 to-violet-600 text-white text-[11px] font-black tracking-widest uppercase flex items-center gap-1 active:translate-y-[2px] shadow-[0_4px_0_rgba(0,0,0,0.4)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  active
                    ? "bg-white text-black shadow-[0_3px_0_rgba(0,0,0,0.5)]"
                    : "bg-white/[0.06] text-white/70 border border-violet-400/20 backdrop-blur-md"
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

      {/* Hero pitch */}
      {tab === "lobby" && (
        <div className="relative px-4 pt-4">
          <div
            className="rounded-3xl p-4 border border-violet-400/25 backdrop-blur-md shadow-[0_6px_0_rgba(0,0,0,0.4)]"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(15,8,32,0.65) 60%)",
            }}
          >
            <p
              className="text-[18px] font-black tracking-tight leading-tight"
              style={{ fontFamily: "Teko, Inter, system-ui, sans-serif" }}
            >
              PICK A SONG. SPLIT THE EDIT.<br />
              <span className="text-violet-300">CASH THE FIRE.</span>
            </p>
            <p className="text-[11px] text-white/70 mt-1.5 leading-snug">
              2 editors. One track. Each owns a half. Top 3 daily collabs win <span className="text-violet-300 font-bold">7× XP + 7× Index</span> for both partners.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="relative px-4 pt-4 grid grid-cols-1 gap-3">
        {loading && (
          <div className="text-center text-violet-300/60 py-12 text-sm">Loading collabs…</div>
        )}
        {empty && (
          <div className="text-center text-white/50 py-12 text-sm px-6">{empty}</div>
        )}
        {!loading &&
          list.map((s, i) => (
            <CollabSlotCard key={s.id} slot={s} rank={tab === "top" ? i + 1 : undefined} />
          ))}
      </div>
    </div>
  );
}