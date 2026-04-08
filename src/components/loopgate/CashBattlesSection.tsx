import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, Swords, Clock, Zap, Info, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCashBattles, useMyCashBattles, useMyCashBattleApplication, CashBattleApplication } from "@/hooks/useCashBattles";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  const isLive = battle.status === "live";
  const isUpcoming = battle.status === "upcoming";
  const isCompleted = battle.status === "completed" || battle.status === "ended";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/cash-battle/${battle.id}`)}
      className="w-[220px] shrink-0 rounded-2xl overflow-hidden cursor-pointer group relative"
      style={{
        background: isCompleted
          ? "linear-gradient(160deg, rgba(30,30,30,1) 0%, rgba(18,18,18,1) 100%)"
          : "linear-gradient(160deg, rgba(22,22,28,1) 0%, rgba(6,6,8,1) 100%)",
        boxShadow: isLive
          ? "0 0 40px rgba(59,130,246,0.12), 0 0 40px rgba(239,68,68,0.12), 0 12px 40px rgba(0,0,0,0.7)"
          : "0 12px 40px rgba(0,0,0,0.6)",
        filter: isCompleted ? "grayscale(60%)" : "none",
        opacity: isCompleted ? 0.55 : 1,
      }}
    >
      {/* Top accent — blue to red gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: isCompleted
          ? "linear-gradient(90deg, #555, #555)"
          : "linear-gradient(90deg, #3b82f6, transparent 40%, transparent 60%, #ef4444)",
      }} />

      {/* TESTING overlay for completed */}
      {isCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-1.5 rounded-lg" style={{ background: "rgba(234,179,8,0.95)" }}>
            <span className="text-sm font-black text-black uppercase tracking-widest" style={{ fontFamily: "Teko, sans-serif", fontSize: 18 }}>
              TESTING
            </span>
          </div>
        </div>
      )}

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
        {battle.sponsor_name && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {battle.sponsor_logo_url ? (
              <img src={battle.sponsor_logo_url} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />
            ) : (
              <span className="text-[8px]">🏢</span>
            )}
            <span className="text-[9px] text-blue-400/80 font-semibold truncate">by {battle.sponsor_name}</span>
          </div>
        )}
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

/** Card for a pending application — shows as an open matchup slot anyone can tap to accept */
function OpenMatchupCard({ app, onJoin }: { app: CashBattleApplication; onJoin: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onJoin}
      className="w-[220px] shrink-0 rounded-2xl overflow-hidden cursor-pointer relative"
      style={{
        background: "linear-gradient(160deg, rgba(22,22,28,1) 0%, rgba(6,6,8,1) 100%)",
        boxShadow: "0 0 30px rgba(59,130,246,0.08), 0 0 30px rgba(239,68,68,0.08), 0 12px 40px rgba(0,0,0,0.7)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #3b82f6, transparent 40%, transparent 60%, #ef4444)",
      }} />

      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
              <DollarSign className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-2xl font-black text-white" style={{ fontFamily: "Teko, sans-serif" }}>
              $$$
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400" style={{ fontFamily: "Teko, sans-serif" }}>
              OPEN
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1 text-[9px] text-zinc-600">
          <Clock className="w-3 h-3" />
          <span>24h battle</span>
        </div>
      </div>

      <div className="px-4 py-4 flex items-center justify-between">
        {/* Challenger (the waiting user) */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="relative">
            <Avatar className="w-14 h-14 ring-2 ring-blue-500/50">
              <AvatarImage src={app.avatar_url || ""} />
              <AvatarFallback className="text-sm font-black bg-blue-500/15 text-blue-400">
                {app.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-[10px] font-black truncate max-w-[75px] uppercase text-blue-400" style={{ fontFamily: "Teko, sans-serif" }}>
            {app.username}
          </span>
        </div>

        <div className="mx-2 shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}>
            <span className="text-lg font-black text-white/90" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
          </div>
        </div>

        {/* Open opponent slot */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center bg-amber-500/5">
            <span className="text-lg text-amber-400/60">?</span>
          </div>
          <span className="text-[10px] font-black uppercase text-amber-400" style={{ fontFamily: "Teko, sans-serif" }}>
            YOU?
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="w-full text-center py-2.5 rounded-xl text-[13px] font-black uppercase tracking-wider border" style={{
          fontFamily: "Teko, sans-serif",
          background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(239,68,68,0.15))",
          borderColor: "rgba(239,68,68,0.3)",
          color: "#fff",
        }}>
          ACCEPT FIGHT
        </div>
      </div>
    </motion.div>
  );
}

function CashBattleInfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden"
        style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
                <Swords className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider" style={{ fontFamily: "Teko, sans-serif" }}>
                What are Cash Battles?
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          <div className="space-y-3 text-[13px] text-zinc-300 leading-relaxed">
            <p><span className="text-white font-bold">Cash Battles</span> are sponsored 1v1 edit competitions where the winner takes the entire cash prize.</p>
            <p>🎬 Two editors go head-to-head using a provided scenepack from a sponsor campaign. You submit your TikTok edit before the timer runs out.</p>
            <p>💰 The best edit wins the full prize pool — judged by the sponsor or community vote.</p>
            <p>⚡ Hit <span className="text-blue-400 font-semibold">Accept Fight</span> on any open matchup to jump in instantly.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CashBattlesSection() {
  const navigate = useNavigate();
  const { battles, loading } = useCashBattles();
  const { battles: myBattles } = useMyCashBattles();
  const { joinPool } = useMyCashBattleApplication();
  const { user } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);
  const { isGuest } = useGuestMode();
  const accountPrompt = useAccountPrompt();
  const [pendingApps, setPendingApps] = useState<CashBattleApplication[]>([]);

  // Fetch pending applications (open matchup slots) — exclude current user's own
  useEffect(() => {
    async function fetchPending() {
      let query = supabase
        .from('cash_battle_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const { data } = await query;
      const apps = (data as CashBattleApplication[] | null) || [];
      // Filter out current user's own application
      setPendingApps(user ? apps.filter(a => a.user_id !== user.id) : apps);
    }
    fetchPending();
    const interval = setInterval(fetchPending, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const handleEnter = async () => {
    if (isGuest) {
      accountPrompt.open('enter_battle' as any);
      return;
    }
    if (myBattles.length > 0) {
      navigate(`/cash-battle/${myBattles[0].id}`);
      return;
    }
    const result = await joinPool();
    if (result && result.state === 'live' && result.battleId) {
      navigate(`/cash-battle/${result.battleId}`);
    } else {
      toast.success("You're live — waiting for an opponent");
    }
  };

  const handleAcceptFight = async (app: CashBattleApplication) => {
    if (isGuest) {
      accountPrompt.open('enter_battle' as any);
      return;
    }
    const result = await joinPool(app.id);
    if (result && result.state === 'live' && result.battleId) {
      navigate(`/cash-battle/${result.battleId}`);
    } else {
      toast.success("You're live — waiting for match confirmation");
    }
  };

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
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                1v1 · Winner takes all
              </p>
              {pendingApps.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-0.5" style={{ background: "rgba(234,179,8,0.85)", fontFamily: "Teko, sans-serif" }}>
                  {pendingApps.length} OPEN
                </span>
              )}
              <button onClick={() => setInfoOpen(true)} className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <Info className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleEnter}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}
        >
          <Zap className="w-3 h-3" />
          <span>Join Battle</span>
        </button>
      </div>

      {/* Horizontal scroll — open matchups first, then existing battles */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ paddingLeft: 16, paddingRight: 16 }}>
        {/* Open matchup cards from pending applications */}
        {pendingApps.map((app) => (
          <OpenMatchupCard key={app.id} app={app} onJoin={() => handleAcceptFight(app)} />
        ))}

        {/* Existing battles */}
        {battles.map((battle) => (
          <CashBattleCard key={battle.id} battle={battle} />
        ))}

        {/* Join teaser — only show if no pending apps */}
        {pendingApps.length === 0 && (
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={handleEnter}
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
                Waiting for opponent
              </p>
              <p className="text-[9px] text-zinc-600 mt-0.5">
                Jump straight into a live-ready 1v1 screen
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <CashBattleInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
