import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Swords, Clock, Info, X, Loader2, Building2, ChevronRight } from "lucide-react";
import CashBattleVoteBar from "@/components/loopgate/CashBattleVoteBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCashBattles, useMyCashBattles, useMyCashBattleApplication, CashBattleApplication } from "@/hooks/useCashBattles";
import { useOpenQuickFightQueue, leaveQueue, type OpenQueueEntry } from "@/hooks/useQuickFight";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArenaRail, ArenaRailCard, ArenaRailSkeleton } from "@/components/loopgate/ArenaCarouselSystem";

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
function OpenMatchupCard({ app, onJoin, currentUserId }: { app: CashBattleApplication; onJoin: () => void; currentUserId?: string }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const isOwnApp = currentUserId === app.user_id;

  async function handleCancel() {
    setCancelling(true);
    const { error } = await supabase
      .from('cash_battle_applications')
      .update({ status: 'cancelled' } as any)
      .eq('id', app.id)
      .eq('user_id', app.user_id);
    if (error) {
      toast.error('Failed to cancel');
    } else {
      toast.info('Matchup cancelled');
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
  renderIdxBattleCard?: (battle: any) => ReactNode;
  onQuickFight?: () => void;
  onChallenge?: () => void;
  isQfSearching?: boolean;
  onCancelQueue?: () => void;
}

/** Open queue card — a user is waiting in matchmaking and anyone can accept to instant-pair */
function OpenQueueCard({
  entry,
  isOwn,
  onAccept,
  onCancel,
}: {
  entry: OpenQueueEntry;
  isOwn: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={isOwn ? undefined : onAccept}
      className="w-full h-full rounded-2xl overflow-hidden cursor-pointer relative flex flex-col border border-white/[0.08]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(28,28,32,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Top accent — emerald (ranked / free 1v1) */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: "linear-gradient(90deg, #10b981, transparent 40%, transparent 60%, #ef4444)",
      }} />

      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #ef4444)' }}>
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
  renderIdxBattleCard,
  onQuickFight,
  onChallenge,
  isQfSearching = false,
  onCancelQueue,
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
  const { entries: openQueue } = useOpenQuickFightQueue();

  // Fetch pending applications with realtime subscription for instant updates
  useEffect(() => {
    async function fetchPending() {
      const { data } = await supabase
        .from('cash_battle_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      setPendingApps((data as CashBattleApplication[] | null) || []);
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
          <button
            onClick={handleEnter}
            className="relative flex items-center gap-0.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] transition-colors whitespace-nowrap"
          >
            <DollarSign className="w-3 h-3" />
            Cash
            {pendingApps.length > 0 && (
              <span className="ml-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                {pendingApps.length}
              </span>
            )}
          </button>
          {onChallenge && (
            <button
              onClick={onChallenge}
              className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-300 rounded-md border border-red-500/30 bg-red-500/[0.08] hover:bg-red-500/[0.15] transition-colors whitespace-nowrap"
            >
              <Swords className="w-3 h-3" />
              Fight
            </button>
          )}
          <button
            onClick={() => navigate('/edit-battles')}
            className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1 whitespace-nowrap"
            aria-label="View all edit battles"
          >
            All
            <ChevronRight className="w-3 h-3" />
          </button>
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
      {(loading || idxBattlesLoading) ? <ArenaRailSkeleton count={3} /> : <ArenaRail>
        {/* Ranked IDX 1v1 battles — surfaced FIRST to drive non-cash activity */}
        {renderIdxBattleCard && [...idxBattles]
          .sort((a: any, b: any) => {
            const rank = (x: any) => {
              if (x.status === 'active') return 0;
              if (x.status === 'pending') return 1;
              if (x.status === 'judging') return 2;
              return 3; // completed / other
            };
            const ra = rank(a);
            const rb = rank(b);
            if (ra !== rb) return ra - rb;
            const ta = new Date(a.starts_at || a.created_at || 0).getTime();
            const tb = new Date(b.starts_at || b.created_at || 0).getTime();
            return tb - ta;
          })
          .slice(0, 10)
          .map((battle: any) => (
            <ArenaRailCard key={`idx-${battle.id}`}>
              {renderIdxBattleCard(battle)}
            </ArenaRailCard>
          ))}

        {/* Open matchup cards from pending applications */}
        {pendingApps.map((app) => (
          <ArenaRailCard key={app.id}>
            <OpenMatchupCard app={app} onJoin={() => handleAcceptFight(app)} currentUserId={user?.id} />
          </ArenaRailCard>
        ))}

        {/* Existing battles — hide cancelled, show live first */}
        {battles
          .filter((b) => b.status !== 'cancelled')
          .sort((a, b) => {
            // Prioritize battles with an active countdown (live + ends_at in the future).
            // Newest live battles surface first; dead/expired/completed get pushed to the far right.
            const now = Date.now();
            const isActive = (x: any) =>
              x.status === 'live' && x.ends_at && new Date(x.ends_at).getTime() > now;
            const bucket = (x: any) => {
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
        {pendingApps.length === 0 && battles.length === 0 && idxBattles.length === 0 && (
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
