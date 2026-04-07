import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Swords, Clock, Flame, Plus, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCashBattles } from "@/hooks/useCashBattles";
import CashBattleApplyModal from "./CashBattleApplyModal";

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

function CashBattleCard({ battle }: { battle: any }) {
  const isLive = battle.status === "live";
  const isUpcoming = battle.status === "upcoming";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className="w-[220px] shrink-0 rounded-2xl overflow-hidden cursor-pointer group relative"
      style={{
        background: "linear-gradient(160deg, rgba(22,22,28,1) 0%, rgba(6,6,8,1) 100%)",
        boxShadow: isLive
          ? "0 0 40px rgba(59,130,246,0.12), 0 0 40px rgba(239,68,68,0.12), 0 12px 40px rgba(0,0,0,0.7)"
          : "0 12px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top accent — blue to red gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #3b82f6, transparent 40%, transparent 60%, #ef4444)",
      }} />

      {/* Prize + Status */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-2xl font-black text-white" style={{ fontFamily: "Teko, sans-serif" }}>
              {formatPrize(battle.prize_cents)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${
              isLive ? "text-red-400" : isUpcoming ? "text-amber-400" : "text-zinc-500"
            }`} style={{ fontFamily: "Teko, sans-serif" }}>
              {battle.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[9px] text-zinc-600">
          <Clock className="w-3 h-3" />
          <span>{battle.duration_hours}h battle</span>
          {isLive && battle.ends_at && (
            <span className="ml-1 text-red-500/70">· {formatTimeLeft(battle.ends_at)} left</span>
          )}
        </div>
      </div>

      {/* VS Display — Blue vs Red UFC corners */}
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Blue corner */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-blue-500/50">
              <AvatarImage src={battle.challenger_avatar_url || ""} />
              <AvatarFallback className="text-sm font-black bg-blue-500/15 text-blue-400">
                {battle.challenger_username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] font-black truncate max-w-[75px] uppercase text-blue-400" style={{ fontFamily: "Teko, sans-serif" }}>
            {battle.challenger_username}
          </span>
        </div>

        {/* VS badge */}
        <div className="mx-2 shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}>
            <span className="text-lg font-black text-white/90" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
          </div>
        </div>

        {/* Red corner */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          {battle.opponent_username ? (
            <>
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-red-500/50">
                  <AvatarImage src={battle.opponent_avatar_url || ""} />
                  <AvatarFallback className="text-sm font-black bg-red-500/15 text-red-400">
                    {battle.opponent_username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[10px] font-black truncate max-w-[75px] uppercase text-red-400" style={{ fontFamily: "Teko, sans-serif" }}>
                {battle.opponent_username}
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <span className="text-lg text-zinc-600">?</span>
              </div>
              <span className="text-[10px] text-zinc-600 uppercase" style={{ fontFamily: "Teko, sans-serif" }}>TBA</span>
            </>
          )}
        </div>
      </div>

      {/* CTA — full-width block button */}
      <div className="px-4 pb-4">
        <div className={`w-full text-center py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider ${
          isLive
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : isUpcoming
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : "bg-zinc-800 text-zinc-400"
        }`} style={{ fontFamily: "Teko, sans-serif" }}>
          {isLive ? "WATCH" : isUpcoming ? "SOON" : "VIEW"}
        </div>
      </div>
    </motion.div>
  );
}

export default function CashBattlesSection() {
  const { battles, loading } = useCashBattles();
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <div className="mb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-black uppercase tracking-wider text-white" style={{ fontFamily: "Teko, sans-serif" }}>
              Cash Battles
            </h2>
            <p className="text-[11px] uppercase tracking-[0.15em]" style={{ fontFamily: "Teko, sans-serif", color: 'rgba(255,255,255,0.5)' }}>
              1v1 · Winner takes all
            </p>
          </div>
        </div>
        <button
          onClick={() => setApplyOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}
        >
          <Plus className="w-3 h-3" />
          <span>Apply</span>
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ paddingLeft: 16, paddingRight: 16 }}>
        {battles.map((battle) => (
          <CashBattleCard key={battle.id} battle={battle} />
        ))}

        {/* Apply teaser card */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => setApplyOpen(true)}
          className="w-[180px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer"
          style={{
            background: 'rgba(59,130,246,0.03)',
            border: '1px dashed rgba(59,130,246,0.2)',
            minHeight: 200,
          }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Swords className="w-6 h-6" style={{ color: 'rgba(239,68,68,0.5)' }} />
          </div>
          <div className="text-center px-4">
            <p className="text-[12px] font-black uppercase" style={{ fontFamily: "Teko, sans-serif", color: 'rgba(239,68,68,0.8)' }}>
              Think you got it?
            </p>
            <p className="text-[9px] text-zinc-600 mt-0.5">
              Apply to compete for real money
            </p>
          </div>
        </motion.div>
      </div>

      <CashBattleApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  );
}
