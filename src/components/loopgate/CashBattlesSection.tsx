import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Swords, Clock, Trophy, Flame, ChevronRight, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface CashBattle {
  id: string;
  challenger_username: string;
  challenger_avatar_url: string | null;
  opponent_username: string | null;
  opponent_avatar_url: string | null;
  prize_cents: number;
  status: "open" | "live" | "completed";
  duration_hours: number;
  ends_at: string | null;
}

// Placeholder data until backend is wired
const DEMO_BATTLES: CashBattle[] = [
  {
    id: "cash-1",
    challenger_username: "RXZOR",
    challenger_avatar_url: null,
    opponent_username: null,
    opponent_avatar_url: null,
    prize_cents: 2500,
    status: "open",
    duration_hours: 24,
    ends_at: null,
  },
  {
    id: "cash-2",
    challenger_username: "VFXGOD",
    challenger_avatar_url: null,
    opponent_username: "CUTZILLA",
    opponent_avatar_url: null,
    prize_cents: 5000,
    status: "live",
    duration_hours: 12,
    ends_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "cash-3",
    challenger_username: "EDITKING",
    challenger_avatar_url: null,
    opponent_username: "WAVEFX",
    opponent_avatar_url: null,
    prize_cents: 10000,
    status: "live",
    duration_hours: 48,
    ends_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  },
];

function formatPrize(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function formatTimeLeft(endDate: string | null): string {
  if (!endDate) return "TBD";
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function CashBattleCard({ battle }: { battle: CashBattle }) {
  const navigate = useNavigate();
  const isOpen = battle.status === "open";
  const isLive = battle.status === "live";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => {/* navigate to cash battle detail */}}
      className="w-[200px] shrink-0 rounded-xl overflow-hidden cursor-pointer group relative"
      style={{
        background: "linear-gradient(160deg, rgba(22,22,28,1) 0%, rgba(8,8,12,1) 100%)",
        boxShadow: isLive
          ? "0 0 30px rgba(16,185,129,0.12), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
        background: isLive
          ? "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent)"
          : "linear-gradient(90deg, transparent, rgba(234,179,8,0.5), transparent)",
      }} />

      {/* Prize banner */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-lg font-black text-emerald-400" style={{ fontFamily: "Teko, sans-serif" }}>
              {formatPrize(battle.prize_cents)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${
              isLive ? "text-emerald-400" : "text-amber-400"
            }`} style={{ fontFamily: "Teko, sans-serif" }}>
              {isLive ? "LIVE" : "OPEN"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-[8px] text-zinc-500">
          <Clock className="w-2.5 h-2.5" />
          <span>{battle.duration_hours}h battle</span>
          {isLive && <span className="ml-1 text-emerald-500/70">· {formatTimeLeft(battle.ends_at)}</span>}
        </div>
      </div>

      {/* VS Display */}
      <div className="px-3 py-3 flex items-center justify-between">
        {/* Challenger */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Avatar className="w-11 h-11 border-2 border-emerald-500/30">
            <AvatarImage src={battle.challenger_avatar_url || ""} />
            <AvatarFallback className="text-xs font-bold bg-emerald-500/10 text-emerald-400">
              {battle.challenger_username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] font-bold truncate max-w-[65px] uppercase text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
            {battle.challenger_username}
          </span>
        </div>

        {/* VS */}
        <div className="mx-1 shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(234,179,8,0.25))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Swords className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {battle.opponent_username ? (
            <>
              <Avatar className="w-11 h-11 border-2 border-amber-500/30">
                <AvatarImage src={battle.opponent_avatar_url || ""} />
                <AvatarFallback className="text-xs font-bold bg-amber-500/10 text-amber-400">
                  {battle.opponent_username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[9px] font-bold truncate max-w-[65px] uppercase text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
                {battle.opponent_username}
              </span>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-emerald-500/20 flex items-center justify-center bg-white/[0.02]">
                <DollarSign className="w-4 h-4 text-emerald-500/30" />
              </div>
              <span className="text-[9px] text-zinc-600 uppercase" style={{ fontFamily: "Teko, sans-serif" }}>Waiting</span>
            </>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <div className={`w-full text-center py-2 rounded-lg text-[12px] font-black uppercase tracking-wider ${
          isOpen
            ? "bg-emerald-500 text-black"
            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        }`} style={{ fontFamily: "Teko, sans-serif" }}>
          {isOpen ? "ACCEPT — " + formatPrize(battle.prize_cents) : "WATCH LIVE"}
        </div>
      </div>
    </motion.div>
  );
}

export default function CashBattlesSection() {
  const battles = DEMO_BATTLES;

  return (
    <div className="mb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-wider text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
              Cash Battles
            </h2>
            <p className="text-[9px] text-emerald-500/60 uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>
              Real money · winner takes all
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase hover:bg-emerald-500/20 transition-colors">
          <Plus className="w-3 h-3" />
          <span>Create</span>
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ paddingLeft: 16, paddingRight: 16 }}>
        {battles.map((battle) => (
          <CashBattleCard key={battle.id} battle={battle} />
        ))}

        {/* Coming soon teaser */}
        <div className="w-[160px] shrink-0 rounded-xl flex flex-col items-center justify-center gap-2 border border-dashed border-emerald-500/15 bg-emerald-500/[0.02]">
          <Flame className="w-5 h-5 text-emerald-500/30" />
          <span className="text-[10px] text-emerald-500/40 font-bold uppercase text-center px-3" style={{ fontFamily: "Teko, sans-serif" }}>
            More cash battles dropping soon
          </span>
        </div>
      </div>
    </div>
  );
}
