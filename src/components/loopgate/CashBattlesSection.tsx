import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Swords, Clock, Info, X, Loader2, Building2, ChevronRight, Plus } from "lucide-react";
import CashBattleVoteBar from "@/components/loopgate/CashBattleVoteBar";
import BattleVoteBarCompact from "@/components/loopgate/BattleVoteBarCompact";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCashBattles, useMyCashBattles, useMyCashBattleApplication, CashBattleApplication } from "@/hooks/useCashBattles";
import { useOpenQuickFightQueue, leaveQueue, type OpenQueueEntry, type QuickFight } from "@/hooks/useQuickFight";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArenaRail, ArenaRailCard, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

function formatPrize(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// Sonic-style golden ring icon with "R" engraved
function RingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ringG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="none" stroke="url(#ringG)" strokeWidth="4" />
      <circle cx="9" cy="9" r="1.2" fill="#fff" opacity="0.85" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#7c2d12" fontFamily="Inter, system-ui, sans-serif">R</text>
    </svg>
  );
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

function CashBattleCard({ battle, currentUserId }: { battle: any; currentUserId?: string }) {
  const navigate = useNavigate();
  const isLive = battle.status === "live";
  const isUpcoming = battle.status === "upcoming";
  const isCompleted = battle.status === "completed" || battle.status === "ended";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/cash-battle/${battle.id}`)}
      className="w-full h-full rounded-2xl overflow-hidden cursor-pointer group relative flex flex-col border border-white/[0.08]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(28,28,32,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)",
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
        {battle.sponsor_name && (
          <div className="flex items-center gap-1 mt-1 min-w-0">
            {battle.sponsor_logo_url ? (
              <img src={battle.sponsor_logo_url} alt="" className="w-3 h-3 rounded-sm object-cover shrink-0" />
            ) : (
              <Building2 className="w-2.5 h-2.5 text-blue-400/70 shrink-0" strokeWidth={2.5} />
            )}
            <span className="text-[9px] text-blue-400/80 font-semibold truncate">by {battle.sponsor_name}</span>
          </div>
        )}
      </div>

      {/* VS Display — Blue vs Red UFC corners */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        {/* Blue corner */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Avatar className="w-11 h-11 ring-1 ring-white/10">
            <AvatarImage src={battle.challenger_avatar_url || ""} />
            <AvatarFallback className="text-sm font-bold bg-zinc-800 text-zinc-300">
              {battle.challenger_username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold truncate max-w-[75px] uppercase text-zinc-200" style={{ fontFamily: "Teko, sans-serif" }}>
            {battle.challenger_username}
          </span>
        </div>

        {/* VS badge */}
        <div className="mx-2 shrink-0">
          <span className="text-base font-black text-white/40" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
        </div>

        {/* Red corner */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {battle.opponent_username ? (
            <>
              <Avatar className="w-11 h-11 ring-1 ring-white/10">
                <AvatarImage src={battle.opponent_avatar_url || ""} />
                <AvatarFallback className="text-sm font-bold bg-zinc-800 text-zinc-300">
                  {battle.opponent_username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-bold truncate max-w-[75px] uppercase text-zinc-200" style={{ fontFamily: "Teko, sans-serif" }}>
                {battle.opponent_username}
              </span>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <span className="text-base text-zinc-600">?</span>
              </div>
              <span className="text-[10px] text-zinc-600 uppercase" style={{ fontFamily: "Teko, sans-serif" }}>TBA</span>
            </>
          )}
        </div>
      </div>

      {/* Hype vote bar — only for live battles with both fighters */}
      {isLive && battle.opponent_username && (
        <div className="px-3">
          <CashBattleVoteBar
            battleId={battle.id}
            challengerUsername={battle.challenger_username}
            opponentUsername={battle.opponent_username}
            compact
          />
        </div>
      )}

      <div className="pb-3" />
    </motion.div>
  );
}

/** Card for a pending application — shows as an open matchup slot anyone can tap to accept */
function OpenMatchupCard({ app, onJoin, onRemoved, currentUserId }: { app: CashBattleApplication; onJoin: () => void; onRemoved?: (id: string) => void; currentUserId?: string }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isOwnApp = currentUserId === app.user_id;

  async function handleCancel() {
    setCancelling(true);
    onRemoved?.(app.id);
    const { error } = await supabase
      .from('cash_battle_applications')
      .delete()
      .eq('id', app.id)
      .eq('user_id', currentUserId || app.user_id);
    if (error) {
      const { error: fallbackError } = await supabase
        .from('cash_battle_applications')
        .update({ status: 'cancelled' } as any)
        .eq('id', app.id)
        .eq('user_id', currentUserId || app.user_id);
      if (fallbackError) toast.error('Failed to cancel');
      else toast.info('Matchup removed');
    } else {
      toast.info('Matchup removed');
    }
    setCancelling(false);
    setConfirmCancel(false);
  }

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={isOwnApp ? undefined : onJoin}
      className="w-full h-full rounded-2xl overflow-hidden cursor-pointer relative flex flex-col border border-white/[0.08]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(28,28,32,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #3b82f6, transparent 40%, transparent 60%, #ef4444)",
      }} />

      {/* Cancel confirmation overlay */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl"
            style={{ background: "rgba(10,10,12,0.95)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[13px] font-black text-white uppercase tracking-wider text-center px-4" style={{ fontFamily: "Teko, sans-serif" }}>
              Cancel matchup?
            </p>
            <p className="text-[10px] text-zinc-400 text-center px-6">You'll leave the queue and can rejoin anytime</p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-red-400 border border-red-500/30"
                style={{ background: "rgba(239,68,68,0.12)" }}
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, Cancel"}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                Go Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {isOwnApp ? "YOUR MATCH" : "OPEN"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 flex items-center justify-between">
        {/* Challenger (the waiting user) */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Avatar className="w-11 h-11 ring-1 ring-white/10">
            <AvatarImage src={app.avatar_url || ""} />
            <AvatarFallback className="text-sm font-bold bg-zinc-800 text-zinc-300">
              {app.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold truncate max-w-[75px] uppercase text-zinc-200" style={{ fontFamily: "Teko, sans-serif" }}>
            {app.username}
          </span>
        </div>

        <div className="mx-2 shrink-0">
          <span className="text-base font-black text-white/40" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
        </div>

        {/* Open opponent slot */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center bg-amber-500/5">
            <span className="text-base text-amber-400/60">?</span>
          </div>
          <span className="text-[10px] font-black uppercase text-amber-400" style={{ fontFamily: "Teko, sans-serif" }}>
            {isOwnApp ? "WAITING" : "YOU?"}
          </span>
        </div>
      </div>

      <div className="px-4 pb-3 mt-auto">
        {isOwnApp && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmCancel(true); }}
            className="w-full text-center py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-red-400/70"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            Cancel
          </button>
        )}
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
                What are Edit Battles?
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          <div className="space-y-3 text-[13px] text-zinc-300 leading-relaxed">
            <p><span className="text-white font-bold">Edit Battles</span> are 1v1 head-to-head edit competitions. Two editors go in, one walks out the winner — judged by community vote or our official judges.</p>
            <p>⚔️ Tap <span className="text-white font-semibold">Challenge</span> to call out a specific editor for a ranked 1v1, or jump into any open matchup instantly.</p>
            <p className="pt-2 border-t border-white/10"><span className="text-white font-bold">💰 Cash Battles</span> are the sponsored tier of Edit Battles — winner takes the entire cash prize.</p>
            <p>🎬 Both editors use the same provided scenepack from a sponsor campaign and submit before the timer runs out.</p>
            <p>⚡ Hit <span className="text-blue-400 font-semibold">Cash</span> above to enter the cash queue, or tap any open <span className="text-amber-400 font-semibold">$$$</span> matchup to accept the fight instantly.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface EditBattlesSectionProps {
  idxBattles?: any[];
  idxBattlesLoading?: boolean;
  quickFights?: QuickFight[];
  myQuickFights?: QuickFight[];
  quickFightsLoading?: boolean;
  renderIdxBattleCard?: (battle: any) => ReactNode;
  onQuickFight?: () => void;
  onChallenge?: () => void;
  isQfSearching?: boolean;
  onCancelQueue?: () => void;
  onOpenLobby?: () => void;
}

function QuickFightCarouselCard({ fight, isMine }: { fight: QuickFight; isMine: boolean }) {
  const navigate = useNavigate();
  const isLive = fight.status === 'active' || fight.status === 'submitted' || fight.status === 'judging';
  const isWaiting = fight.status === 'waiting' && !fight.player_2_id;
  const isCompleted = fight.status === 'completed' || fight.status === 'forfeited' || fight.status === 'cancelled';
  const [votes, setVotes] = useState<{ blue: number; red: number }>({ blue: fight.player_1_votes || 0, red: fight.player_2_votes || 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("quick_fight_votes")
        .select("voted_for")
        .eq("fight_id", fight.id);
      if (cancelled || !data) return;
      const rows = data as { voted_for: string }[];
      setVotes({
        blue: rows.filter(r => r.voted_for === fight.player_1_id).length || fight.player_1_votes || 0,
        red: fight.player_2_id ? rows.filter(r => r.voted_for === fight.player_2_id).length || fight.player_2_votes || 0 : 0,
      });
    }
    load();
    const ch = supabase
      .channel(`qf-votes-${fight.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quick_fight_votes", filter: `fight_id=eq.${fight.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fight.id, fight.player_1_id, fight.player_2_id, fight.player_1_votes, fight.player_2_votes]);

  const statusText = isWaiting ? (isMine ? 'YOUR LOBBY' : 'OPEN') : isLive ? (isMine ? 'YOUR BATTLE' : 'LIVE') : isCompleted ? 'DECIDED' : fight.status;
  const duration = fight.duration_minutes >= 60 ? `${Math.round(fight.duration_minutes / 60)}H` : `${fight.duration_minutes}M`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(`/fight/${fight.id}`)}
      className={`w-full h-full overflow-hidden cursor-pointer group rounded-2xl relative flex flex-col ${isCompleted ? 'opacity-55 grayscale-[60%]' : ''}`}
      style={{
        background: isCompleted
          ? 'linear-gradient(160deg, hsl(var(--surface-2)) 0%, hsl(var(--surface-0)) 100%)'
          : 'linear-gradient(160deg, hsl(var(--surface-2)) 0%, hsl(var(--background)) 100%)',
        boxShadow: isWaiting
          ? '0 0 0 1px hsl(var(--status-live) / 0.28), 0 16px 34px -22px hsl(var(--status-live) / 0.55), inset 0 1px 0 hsl(var(--foreground) / 0.04)'
          : isLive
          ? '0 0 24px hsl(var(--destructive) / 0.15), 0 8px 32px hsl(var(--background) / 0.5), inset 0 1px 0 hsl(var(--foreground) / 0.04)'
          : '0 8px 32px hsl(var(--background) / 0.5), inset 0 1px 0 hsl(var(--foreground) / 0.04)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,hsl(217_91%_60%),transparent_44%,transparent_56%,hsl(0_72%_51%))]" />
      {isWaiting && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--status-live)/0.10),transparent_48%)]" />}

      <div className="relative flex items-center justify-between px-2.5 pt-2 pb-0.5">
        <div className="flex items-center gap-1 min-w-0">
          {(isLive || isWaiting) && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isWaiting ? 'bg-status-live' : 'bg-destructive'}`} />}
          <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isWaiting ? 'text-emerald-400' : isLive ? 'text-red-400' : isCompleted ? 'text-muted-foreground' : 'text-blue-400'}`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
          <Clock className="w-2.5 h-2.5" />
          <span>{duration}</span>
        </div>
      </div>

      <div className="relative px-3 py-3 flex-1 flex items-center">
        <div className="relative flex items-center justify-between w-full">
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <Avatar className={`w-10 h-10 border-2 ${isCompleted ? 'border-border/60' : 'border-blue-500/40'}`}>
              <AvatarImage src={fight.player_1_avatar_url || ''} />
              <AvatarFallback className="text-xs font-bold bg-surface-2 text-blue-300">
                {fight.player_1_username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-bold truncate max-w-[55px] uppercase text-foreground" style={{ fontFamily: 'Teko, sans-serif' }}>
              {fight.player_1_username}
            </span>
          </div>

          <div className="mx-1 shrink-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center border border-border bg-background/70">
              <Swords className="w-3 h-3 text-foreground/70" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            {fight.player_2_id ? (
              <Avatar className={`w-10 h-10 border-2 ${isCompleted ? 'border-border/60' : 'border-red-500/40'}`}>
                <AvatarImage src={fight.player_2_avatar_url || ''} />
                <AvatarFallback className="text-xs font-bold bg-surface-2 text-red-300">
                  {fight.player_2_username?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-500/35 flex items-center justify-center bg-background/60">
                <span className="text-sm text-emerald-400/70 font-bold">?</span>
              </div>
            )}
            <span className={`text-[9px] font-bold truncate max-w-[55px] uppercase ${fight.player_2_id ? 'text-foreground' : 'text-emerald-400'}`} style={{ fontFamily: 'Teko, sans-serif' }}>
              {fight.player_2_username || 'Open'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-3 pb-3 mt-auto space-y-1.5">
        <BattleVoteBarCompact
          blueVotes={votes.blue}
          redVotes={votes.red}
          blueLabel={fight.player_1_username}
          redLabel={fight.player_2_username || undefined}
        />
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em]">
          <span className={`flex items-center gap-1 ${isWaiting ? 'text-emerald-400' : 'text-gold'}`}>
            {isWaiting ? 'Tap to enter lobby' : (
              <>
                <RingIcon className="w-3 h-3" />
                +50 Rings
              </>
            )}
          </span>
          {isMine && <span className="text-muted-foreground">Yours</span>}
        </div>
      </div>
    </motion.div>
  );
}


/** Open queue card — a user is waiting in matchmaking and anyone can accept to instant-pair */
function OpenQueueCard({
  entry,
  isOwn,
  onAccept,
  onCancel,
  onOpenLobby,
}: {
  entry: OpenQueueEntry;
  isOwn: boolean;
  onAccept: () => void;
  onCancel: () => void;
  onOpenLobby?: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={isOwn ? onOpenLobby : onAccept}
      className="w-full h-full rounded-2xl overflow-hidden cursor-pointer relative flex flex-col border border-white/[0.08]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(28,28,32,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Top accent — blue (ranked / free 1v1) */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #3b82f6, transparent 40%, transparent 60%, #ef4444)",
      }} />

      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
              <Swords className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-2xl font-black text-white leading-none" style={{ fontFamily: "Teko, sans-serif" }}>
              1V1
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400" style={{ fontFamily: "Teko, sans-serif" }}>
              {isOwn ? "YOUR QUEUE" : "WAITING"}
            </span>
          </div>
        </div>
      </div>

      {/* VS */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Avatar className="w-11 h-11 ring-1 ring-white/10">
            <AvatarImage src={entry.avatar_url || ""} />
            <AvatarFallback className="text-sm font-bold bg-zinc-800 text-zinc-300">
              {entry.username?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold truncate max-w-[75px] uppercase text-zinc-200" style={{ fontFamily: "Teko, sans-serif" }}>
            {entry.username}
          </span>
        </div>

        <div className="mx-2 shrink-0">
          <span className="text-base font-black text-white/40" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
        </div>

        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center bg-emerald-500/5">
            <span className="text-base text-emerald-400/60">?</span>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-400" style={{ fontFamily: "Teko, sans-serif" }}>
            {isOwn ? "OPEN" : "YOU?"}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-3 pb-3 mt-auto">
        {isOwn ? (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="w-full py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-red-400/80 border border-red-500/20 bg-red-500/[0.06]"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            Cancel Queue
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            className="w-full py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30 bg-emerald-500/[0.10]"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            Accept
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function CashBattlesSection({
  idxBattles = [],
  idxBattlesLoading = false,
  quickFights = [],
  myQuickFights = [],
  quickFightsLoading = false,
  renderIdxBattleCard,
  onQuickFight,
  onChallenge,
  isQfSearching = false,
  onCancelQueue,
  onOpenLobby,
}: EditBattlesSectionProps = {}) {
  const navigate = useNavigate();
  const { battles, loading } = useCashBattles();
  const { battles: myBattles } = useMyCashBattles();
  const { joinPool } = useMyCashBattleApplication();
  const { user } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);
  const { isGuest } = useGuestMode();
  const accountPrompt = useAccountPrompt();
  const [pendingApps, setPendingApps] = useState<CashBattleApplication[]>([]);
  const removedPendingAppIds = useRef(new Set<string>());
  const { entries: openQueue, loading: openQueueLoading } = useOpenQuickFightQueue();
  const endedBattleStatuses = new Set(['completed', 'forfeited', 'ended']);

  // Fetch pending applications with realtime subscription for instant updates
  useEffect(() => {
    async function fetchPending() {
      const { data } = await supabase
        .from('cash_battle_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const visiblePendingApps = ((data as CashBattleApplication[] | null) || []).filter(
        (app) => !removedPendingAppIds.current.has(app.id)
      );
      setPendingApps(visiblePendingApps);
    }
    fetchPending();

    // Realtime subscription for instant card updates
    const channel = supabase
      .channel('cash-battle-apps-carousel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_battle_applications' },
        () => { fetchPending(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
      <div className="flex items-center justify-between px-4 mb-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
          <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #ef4444)' }}>
            <Swords className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </div>
          <h2
            className="text-[15px] font-extrabold tracking-tight text-foreground whitespace-nowrap"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Edit Battles
          </h2>
          <button
            onClick={() => setInfoOpen(true)}
            className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors shrink-0"
            aria-label="About edit battles"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onChallenge && (
            <button
              type="button"
              onClick={onChallenge}
              className="group relative flex items-center gap-1.5 pl-2 pr-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap rounded-md overflow-hidden active:scale-[0.97] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                boxShadow: '0 0 16px -4px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <Plus className="w-3 h-3" strokeWidth={3} />
              Custom Lobby
              <span
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Queue status bar */}
      {isQfSearching && (
        <div className="mx-4 mb-3 flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span className="text-[11px] text-emerald-400 font-medium">Finding you an opponent...</span>
          </div>
          {onCancelQueue && (
            <button
              onClick={onCancelQueue}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.05]"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Horizontal scroll — open matchups first, then existing battles */}
      {(loading || idxBattlesLoading || quickFightsLoading || openQueueLoading) ? <ArenaRailSkeleton count={3} /> : <ArenaRail key={`queue-first-${openQueue.map((entry) => entry.id).join('-')}`}>
        {/* Your own queue card — pinned to the FRONT of the rail while searching */}
        {user?.id && openQueue
          .filter((entry) => entry.user_id === user.id)
          .map((entry) => (
            <ArenaRailCard key={`my-queue-${entry.id}`}>
              <div id="my-queue-card" className="w-full h-full">
                <OpenQueueCard
                  entry={entry}
                  isOwn={true}
                  onAccept={() => {}}
                  onOpenLobby={onOpenLobby}
                  onCancel={async () => {
                    if (user?.id) {
                      await leaveQueue(user.id);
                      onCancelQueue?.();
                      toast('Search cancelled', { duration: 2000 });
                    }
                  }}
                />
              </div>
            </ArenaRailCard>
          ))}

        {/* Open cash matchup cards — second priority (joinable) */}
        {pendingApps.map((app) => (
          <ArenaRailCard key={app.id}>
            <OpenMatchupCard
              app={app}
              onJoin={() => handleAcceptFight(app)}
              onRemoved={(id) => {
                removedPendingAppIds.current.add(id);
                setPendingApps((current) => current.filter((pendingApp) => pendingApp.id !== id));
              }}
              currentUserId={user?.id}
            />
          </ArenaRailCard>
        ))}

        {/* Edit Battle cards — live ones first, ended ones DEPRIORITIZED to the right (still visible). */}
        {/* Quick-Fight battles — from the "Edit Battle · Match Instantly" button */}
        {[...myQuickFights, ...quickFights]
          .filter((fight, index, all) =>
            fight.status !== 'cancelled' &&
            all.findIndex((item) => item.id === fight.id) === index &&
            // Hide private waiting lobbies from public rail (host still sees via myQuickFights)
            !(fight.is_private && fight.status === 'waiting' && fight.player_1_id !== user?.id)
          )
          .sort((a, b) => {
            const owned = (x: QuickFight) => user?.id && (x.player_1_id === user.id || x.player_2_id === user.id) ? 0 : 1;
            const rank = (x: QuickFight) => {
              if (endedBattleStatuses.has(x.status)) return 10;
              if (owned(x) === 0) return 0;
              if (x.status === 'waiting') return 1;
              if (x.status === 'active' || x.status === 'submitted') return 2;
              if (x.status === 'judging') return 3;
              return 4;
            };
            const ra = rank(a);
            const rb = rank(b);
            if (ra !== rb) return ra - rb;
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          })
          .slice(0, 12)
          .map((fight) => (
            <ArenaRailCard key={`quick-${fight.id}`}>
              <QuickFightCarouselCard fight={fight} isMine={!!user?.id && (fight.player_1_id === user.id || fight.player_2_id === user.id)} />
            </ArenaRailCard>
          ))}

        {/* Cash battles hidden per request (including completed/testing ones) */}
        {false && battles
          .filter((battle) => endedBattleStatuses.has(battle.status))
          .sort((a, b) => {
            // Prioritize battles with an active countdown (live + ends_at in the future).
            // Newest live battles surface first; dead/expired/completed get pushed to the far right.
            const now = Date.now();
            const isActive = (x: any) =>
              x.status === 'live' && x.ends_at && new Date(x.ends_at).getTime() > now;
            const bucket = (x: any) => {
              if (endedBattleStatuses.has(x.status)) return 10; // ended → far right
              if (isActive(x)) return 0;            // live + timer still running
              if (x.status === 'upcoming') return 1; // about to start
              if (x.status === 'live') return 2;     // live but timer expired (stale)
              return 3;                              // completed / ended graveyard
            };
            const ba = bucket(a);
            const bb = bucket(b);
            if (ba !== bb) return ba - bb;
            // Within the same bucket, newest first (most recently created/started)
            const ta = new Date(a.starts_at || a.created_at || 0).getTime();
            const tb = new Date(b.starts_at || b.created_at || 0).getTime();
            return tb - ta;
          })
          .map((battle) => (
            <ArenaRailCard key={battle.id}>
              <CashBattleCard battle={battle} currentUserId={user?.id} />
            </ArenaRailCard>
          ))}

        {/* Join teaser — only show if no pending apps */}
        {pendingApps.length === 0 && battles.length === 0 && idxBattles.length === 0 && quickFights.length === 0 && (
          <ArenaRailCard>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={handleEnter}
              className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer"
              style={{
                background: 'rgba(59,130,246,0.03)',
                border: '1px dashed rgba(59,130,246,0.2)',
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
          </ArenaRailCard>
        )}
      </ArenaRail>}

      <CashBattleInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
