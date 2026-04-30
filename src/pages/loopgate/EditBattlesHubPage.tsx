import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Swords, DollarSign, Flame, Trophy, Clock, Users, Loader2, Zap, Share2, X, Copy, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useCashBattles, useMyCashBattles, useMyCashBattleApplication, type CashBattleApplication } from "@/hooks/useCashBattles";
import { useMyQuickFights, useRecentQuickFights, findQuickFight, leaveQueue, type QuickFight } from "@/hooks/useQuickFight";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import { toast } from "sonner";

type TabKey = "live" | "open" | "cash" | "completed";
type ModeKey = "instant" | "cash";

interface QueueEditor {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  queued_at: string;
}

function formatPrize(cents: number): string {
  if (cents === 0) return "FREE";
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

function BattleRow({ battle, onClick }: { battle: any; onClick: () => void }) {
  const isLive = battle.status === "live";
  const isCompleted =
    battle.status === "completed" ||
    battle.status === "ended" ||
    battle.status === "cancelled" ||
    battle.status === "forfeited";
  const hasCash = (battle.prize_cents ?? 0) > 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(22,22,26,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -16px rgba(0,0,0,0.6)",
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isCompleted
            ? "linear-gradient(90deg, #444, #444)"
            : "linear-gradient(90deg, #3b82f6, transparent 45%, transparent 55%, #ef4444)",
        }}
      />

      <div className="px-4 py-3 flex items-center gap-3">
        {/* Prize/Type badge */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-16">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: hasCash
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #3b82f6, #ef4444)",
            }}
          >
            {hasCash ? (
              <DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />
            ) : (
              <Swords className="w-5 h-5 text-white" strokeWidth={2.5} />
            )}
          </div>
          <span
            className="text-[13px] font-black text-white leading-none"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            {hasCash ? formatPrize(battle.prize_cents) : "1V1"}
          </span>
        </div>

        {/* VS center */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center min-w-0 flex-1">
            <Avatar className="w-9 h-9 ring-2 ring-blue-500/40">
              <AvatarImage src={battle.challenger_avatar_url || ""} />
              <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                {battle.challenger_username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-[10px] font-bold text-blue-300 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {battle.challenger_username}
            </span>
          </div>
          <span className="text-sm font-black text-white/30" style={{ fontFamily: "Teko, sans-serif" }}>
            VS
          </span>
          <div className="flex flex-col items-center min-w-0 flex-1">
            {battle.opponent_username ? (
              <Avatar className="w-9 h-9 ring-2 ring-red-500/40">
                <AvatarImage src={battle.opponent_avatar_url || ""} />
                <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                  {battle.opponent_username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center">
                <span className="text-amber-400/60 text-sm">?</span>
              </div>
            )}
            <span
              className="text-[10px] font-bold text-red-300 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {battle.opponent_username || "TBA"}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex flex-col items-end gap-1 shrink-0 w-16">
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span
                className="text-[10px] font-black uppercase tracking-wider text-red-400"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                LIVE
              </span>
            </div>
          )}
          {!isLive && !isCompleted && (
            <span
              className="text-[10px] font-black uppercase tracking-wider text-amber-400"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {battle.status?.toUpperCase()}
            </span>
          )}
          {isCompleted && (
            <span
              className="text-[10px] font-black uppercase tracking-wider text-zinc-500"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              ENDED
            </span>
          )}
          {battle.ends_at && isLive && (
            <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatTimeLeft(battle.ends_at)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OpenQueueRow({ app, onAccept, isOwn }: { app: CashBattleApplication; onAccept: () => void; isOwn: boolean }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={isOwn ? undefined : onAccept}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-amber-500/20"
      style={{
        background:
          "linear-gradient(180deg, rgba(245,158,11,0.08) 0%, rgba(22,22,26,0.95) 60%)",
        boxShadow: "inset 0 1px 0 rgba(245,158,11,0.1), 0 8px 24px -16px rgba(245,158,11,0.2)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, #f59e0b, transparent, #f59e0b)" }}
      />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-16">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
            <Zap className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
          </div>
          <span
            className="text-[10px] font-black text-amber-400 leading-none uppercase tracking-wider"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            OPEN
          </span>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center min-w-0 flex-1">
            <Avatar className="w-9 h-9 ring-2 ring-blue-500/40">
              <AvatarImage src={app.avatar_url || ""} />
              <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                {app.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-[10px] font-bold text-blue-300 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {app.username}
            </span>
          </div>
          <span className="text-sm font-black text-white/30" style={{ fontFamily: "Teko, sans-serif" }}>
            VS
          </span>
          <div className="flex flex-col items-center min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center bg-amber-500/5">
              <span className="text-amber-400/70 text-sm">?</span>
            </div>
            <span
              className="text-[10px] font-black text-amber-400 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {isOwn ? "WAITING" : "YOU?"}
            </span>
          </div>
        </div>

        <div className="shrink-0 w-16 flex justify-end">
          {!isOwn && (
            <span
              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              ACCEPT
            </span>
          )}
          {isOwn && (
            <span
              className="text-[10px] font-black uppercase tracking-wider text-zinc-500"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              YOURS
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuickFightRow({ fight, onClick }: { fight: QuickFight; onClick: () => void }) {
  const isLive = fight.status === "active" || fight.status === "judging";
  const isCompleted = fight.status === "completed" || fight.status === "cancelled" || fight.status === "forfeited";
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06]"
      style={{
        background: "linear-gradient(180deg, rgba(38,38,42,0.95) 0%, rgba(22,22,26,0.95) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -16px rgba(0,0,0,0.6)",
        opacity: isCompleted ? 0.65 : 1,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isCompleted
            ? "linear-gradient(90deg, #444, #444)"
            : "linear-gradient(90deg, #3b82f6, transparent 45%, transparent 55%, #ef4444)",
        }}
      />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-16">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            <Zap className="w-5 h-5 text-white fill-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-[10px] font-black text-white leading-none uppercase tracking-wider"
            style={{ fontFamily: "Teko, sans-serif" }}
          >
            INSTANT
          </span>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center min-w-0 flex-1">
            <Avatar className="w-9 h-9 ring-2 ring-blue-500/40">
              <AvatarImage src={fight.player_1_avatar_url || ""} />
              <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                {fight.player_1_username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-[10px] font-bold text-blue-300 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {fight.player_1_username}
            </span>
          </div>
          <span className="text-sm font-black text-white/30" style={{ fontFamily: "Teko, sans-serif" }}>
            VS
          </span>
          <div className="flex flex-col items-center min-w-0 flex-1">
            {fight.player_2_username ? (
              <Avatar className="w-9 h-9 ring-2 ring-red-500/40">
                <AvatarImage src={fight.player_2_avatar_url || ""} />
                <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                  {fight.player_2_username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-amber-500/40 flex items-center justify-center">
                <span className="text-amber-400/60 text-sm">?</span>
              </div>
            )}
            <span
              className="text-[10px] font-bold text-red-300 truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {fight.player_2_username || "TBA"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0 w-16">
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span
                className="text-[10px] font-black uppercase tracking-wider text-red-400"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                LIVE
              </span>
            </div>
          )}
          {isCompleted && (
            <span
              className="text-[10px] font-black uppercase tracking-wider text-zinc-500"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {fight.status === "completed" ? "ENDED" : "CXLD"}
            </span>
          )}
          {fight.ends_at && isLive && (
            <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatTimeLeft(fight.ends_at)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Roblox-sexy queue card — other waiting editors you can manually accept
function QueueEditorRow({ editor, isOwn, onAccept }: { editor: QueueEditor; isOwn: boolean; onAccept: () => void }) {
  const waitedSec = Math.max(0, Math.floor((Date.now() - new Date(editor.queued_at).getTime()) / 1000));
  const waited = waitedSec < 60 ? `${waitedSec}s` : `${Math.floor(waitedSec / 60)}m`;
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={isOwn ? undefined : onAccept}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isOwn
          ? "linear-gradient(180deg, rgba(37,99,235,0.18) 0%, rgba(22,22,26,0.95) 100%)"
          : "linear-gradient(180deg, rgba(139,92,246,0.12) 0%, rgba(22,22,26,0.95) 100%)",
        border: isOwn ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(139,92,246,0.3)",
        boxShadow: isOwn
          ? "inset 0 1px 0 rgba(59,130,246,0.2), 0 8px 24px -16px rgba(59,130,246,0.4)"
          : "inset 0 1px 0 rgba(139,92,246,0.15), 0 8px 24px -16px rgba(139,92,246,0.3)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: isOwn
            ? "linear-gradient(90deg, #3b82f6, transparent, #3b82f6)"
            : "linear-gradient(90deg, #8b5cf6, transparent, #ef4444)",
        }}
      />
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Status badge */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-16">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{
              background: isOwn
                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            }}
          >
            <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
          </div>
          <span
            className="text-[10px] font-black leading-none uppercase tracking-wider"
            style={{ fontFamily: "Teko, sans-serif", color: isOwn ? "#60a5fa" : "#c4b5fd" }}
          >
            QUEUE
          </span>
        </div>

        {/* VS layout */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center min-w-0 flex-1">
            <Avatar className="w-9 h-9 ring-2" style={{ boxShadow: isOwn ? "0 0 0 2px rgba(59,130,246,0.5)" : "0 0 0 2px rgba(139,92,246,0.5)" }}>
              <AvatarImage src={editor.avatar_url || ""} />
              <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                {editor.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span
              className="text-[10px] font-bold truncate max-w-full mt-1 uppercase"
              style={{ fontFamily: "Teko, sans-serif", color: isOwn ? "#93c5fd" : "#c4b5fd" }}
            >
              {isOwn ? "YOU" : editor.username}
            </span>
          </div>
          <span className="text-sm font-black text-white/30" style={{ fontFamily: "Teko, sans-serif" }}>
            VS
          </span>
          <div className="flex flex-col items-center min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: "rgba(245,158,11,0.4)" }}>
              <span className="text-amber-400/70 text-sm">?</span>
            </div>
            <span
              className="text-[10px] font-black truncate max-w-full mt-1 uppercase text-amber-400"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              {isOwn ? "WAITING" : "YOU?"}
            </span>
          </div>
        </div>

        {/* Action / status */}
        <div className="shrink-0 w-16 flex flex-col items-end gap-1">
          {isOwn ? (
            <>
              <span
                className="text-[9px] font-black uppercase tracking-wider text-blue-300"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                TAP →
              </span>
              <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {waited}
              </span>
            </>
          ) : (
            <>
              <span
                className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white"
                style={{
                  fontFamily: "Teko, sans-serif",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  boxShadow: "0 4px 12px -4px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                ACCEPT
              </span>
              <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {waited}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function EditBattlesHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const accountPrompt = useAccountPrompt();
  const { battles, loading } = useCashBattles();
  const { battles: myBattles } = useMyCashBattles();
  const { joinPool } = useMyCashBattleApplication();
  const { fights: recentFights, loading: fightsLoading } = useRecentQuickFights(40);
  const { fights: myFights, inQueue: inQuickQueue } = useMyQuickFights();
  const { profile } = useAuth() as any;

  const [mode, setMode] = useState<ModeKey>("instant");
  const [tab, setTab] = useState<TabKey>("live");
  const [pendingApps, setPendingApps] = useState<CashBattleApplication[]>([]);
  const [joining, setJoining] = useState(false);
  const [queueEditors, setQueueEditors] = useState<QueueEditor[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Subscribe to pending apps in real time
  useEffect(() => {
    async function fetchPending() {
      const { data } = await supabase
        .from("cash_battle_applications")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      setPendingApps((data as CashBattleApplication[] | null) || []);
    }
    fetchPending();
    const channel = supabase
      .channel("edit-battles-hub-apps")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cash_battle_applications" },
        () => fetchPending()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime: who's currently waiting in the Quick Match queue
  useEffect(() => {
    async function fetchQueue() {
      const { data } = await (supabase as any)
        .from("quick_fight_queue")
        .select("id, user_id, username, avatar_url, queued_at")
        .gt("expires_at", new Date().toISOString())
        .order("queued_at", { ascending: true });
      setQueueEditors((data as QueueEditor[] | null) || []);
    }
    fetchQueue();
    const channel = supabase
      .channel("edit-battles-hub-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quick_fight_queue" },
        () => fetchQueue()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const liveBattles = useMemo(
    () => battles.filter((b) => b.status === "live"),
    [battles]
  );
  const upcomingBattles = useMemo(
    () => battles.filter((b) => b.status === "upcoming"),
    [battles]
  );
  const cashBattles = useMemo(
    () => battles.filter((b) => (b.prize_cents ?? 0) > 0 && b.status !== "completed" && b.status !== "ended"),
    [battles]
  );
  const completedBattles = useMemo(
    () => battles.filter((b) => b.status === "completed" || b.status === "ended"),
    [battles]
  );

  // Quick fight derived sets
  const liveQuickFights = useMemo(
    () => recentFights.filter((f) => f.status === "active" || f.status === "judging"),
    [recentFights]
  );
  const completedQuickFights = useMemo(
    () => recentFights.filter((f) => f.status === "completed"),
    [recentFights]
  );
  const myActiveQuickFight = myFights.find((f) => f.status === "active" || f.status === "judging" || f.status === "waiting");

  const handleInstantJoin = async () => {
    if (isGuest || !user || !profile) {
      accountPrompt.open("enter_battle" as any);
      return;
    }
    if (myActiveQuickFight) {
      navigate(`/fight/${myActiveQuickFight.id}`);
      return;
    }
    if (inQuickQueue) {
      await leaveQueue(user.id);
      toast("Left the queue");
      return;
    }
    setJoining(true);
    const fightId = await findQuickFight(user.id, profile.username, profile.avatar_url);
    setJoining(false);
    if (fightId) {
      toast.success("⚔️ Match found!");
      navigate(`/fight/${fightId}`);
    } else {
      toast.success("🔍 In queue — we'll match you in seconds");
    }
  };

  const handleCashJoin = async () => {
    if (isGuest) {
      accountPrompt.open("enter_battle" as any);
      return;
    }
    if (myBattles.length > 0) {
      navigate(`/cash-battle/${myBattles[0].id}`);
      return;
    }
    setJoining(true);
    const result = await joinPool();
    setJoining(false);
    if (result && result.state === "live" && result.battleId) {
      navigate(`/cash-battle/${result.battleId}`);
    } else {
      toast.success("You're in the queue — waiting for an opponent");
    }
  };

  const handlePrimaryCTA = mode === "instant" ? handleInstantJoin : handleCashJoin;

  // Accept another editor's queued match — same as joining (RPC will pair us)
  const handleAcceptQueueEditor = async (editor: QueueEditor) => {
    if (isGuest || !user || !profile) {
      accountPrompt.open("enter_battle" as any);
      return;
    }
    if (editor.user_id === user.id) {
      setShowInviteModal(true);
      return;
    }
    setJoining(true);
    const fightId = await findQuickFight(user.id, profile.username, profile.avatar_url);
    setJoining(false);
    if (fightId) {
      toast.success(`⚔️ Matched with @${editor.username}!`);
      navigate(`/fight/${fightId}`);
    } else {
      toast("🔍 Joined the queue — pairing now");
    }
  };

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/edit-battles`;
  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`⚔️ I'm in the Loopgate edit battle queue — jump in and we'll auto-match: ${inviteUrl}`);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Couldn't copy — try sharing instead");
    }
  };
  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Loopgate Edit Battle",
          text: "I'm in the queue — jump in and let's 1v1 ⚔️",
          url: inviteUrl,
        });
      } else {
        handleCopyInvite();
      }
    } catch {}
  };

  const handleAcceptOpen = async (app: CashBattleApplication) => {
    if (isGuest) {
      accountPrompt.open("enter_battle" as any);
      return;
    }
    setJoining(true);
    const result = await joinPool(app.id);
    setJoining(false);
    if (result && result.state === "live" && result.battleId) {
      navigate(`/cash-battle/${result.battleId}`);
    } else {
      toast.success("You're in — waiting for match confirmation");
    }
  };

  // Mode-aware tab counts — Instant uses quick_fights; Cash uses cash_battles
  const liveCount = mode === "instant" ? liveQuickFights.length : liveBattles.length;
  const queueCount = mode === "instant" ? (inQuickQueue ? 1 : 0) : pendingApps.length;
  const completedCount = mode === "instant" ? completedQuickFights.length : completedBattles.length;

  const tabs: { key: TabKey; label: string; count: number; icon: any; color: string }[] = mode === "instant"
    ? [
        { key: "live", label: "Live Now", count: liveCount, icon: Flame, color: "#ef4444" },
        { key: "open", label: "Queue", count: queueCount, icon: Zap, color: "#3b82f6" },
        { key: "completed", label: "Hall of Fame", count: completedCount, icon: Trophy, color: "#fbbf24" },
      ]
    : [
        { key: "live", label: "Live Now", count: liveCount, icon: Flame, color: "#ef4444" },
        { key: "open", label: "Queue", count: queueCount, icon: Zap, color: "#f59e0b" },
        { key: "cash", label: "$ Battles", count: cashBattles.length, icon: DollarSign, color: "#10b981" },
        { key: "completed", label: "Hall of Fame", count: completedCount, icon: Trophy, color: "#fbbf24" },
      ];

  // If user switches mode and current tab is "cash" but mode is instant, snap to live
  useEffect(() => {
    if (mode === "instant" && tab === "cash") setTab("live");
  }, [mode, tab]);

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Helmet>
        <title>Edit Battles — Loopgate</title>
        <meta
          name="description"
          content="Live 1v1 edit battles, open queue, and cash-sponsored matches. Watch, vote, or jump in."
        />
      </Helmet>

      {/* Cinematic header */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(37,99,235,0.55), transparent 50%), radial-gradient(circle at 80% 70%, rgba(239,68,68,0.55), transparent 50%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.25), transparent 60%)",
          }}
        />
        {/* Animated scanline grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(circle at 50% 0%, #000 30%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, #000 100%)" }} />

        <div className="relative px-4 pt-4 pb-5">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={3} />
            Back
          </button>

          {/* LIVE pill */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/40">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-red-400">LIVE ARENA</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-500">SEASON 01</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #8b5cf6 50%, #ef4444 100%)",
                boxShadow: "0 0 20px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <Swords className="w-5 h-5 text-white" strokeWidth={2.8} />
            </div>
            <h1
              className="text-[44px] font-black uppercase text-white leading-[0.85]"
              style={{
                fontFamily: "Teko, sans-serif",
                letterSpacing: "-0.01em",
                textShadow: "0 0 30px rgba(139,92,246,0.4)",
              }}
            >
              Edit Battles
            </h1>
          </div>
          <p className="text-[13px] font-bold text-zinc-300 leading-tight">
            <span className="text-blue-400">Two enter.</span>{" "}
            <span className="text-red-400">One leaves.</span>{" "}
            <span className="text-zinc-500">Pick a side. Drop a fire edit. Take the crown. 👑</span>
          </p>

          {/* Mode toggle — Instant vs Cash */}
          <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm">
            <button
              onClick={() => setMode("instant")}
              className="relative flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-[0.97]"
              style={{
                background: mode === "instant"
                  ? "linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)"
                  : "transparent",
                boxShadow: mode === "instant"
                  ? "0 6px 20px -6px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.25)"
                  : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${mode === "instant" ? "text-white fill-white" : "text-zinc-500"}`} strokeWidth={2.8} />
                <span
                  className={`text-[14px] font-black uppercase tracking-wider ${mode === "instant" ? "text-white" : "text-zinc-400"}`}
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  Instant
                </span>
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-[0.15em] mt-0.5 ${mode === "instant" ? "text-white/70" : "text-zinc-600"}`}>
                Free · IDX + XP
              </span>
            </button>
            <button
              onClick={() => setMode("cash")}
              className="relative flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-[0.97]"
              style={{
                background: mode === "cash"
                  ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  : "transparent",
                boxShadow: mode === "cash"
                  ? "0 6px 20px -6px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.25)"
                  : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                <DollarSign className={`w-3.5 h-3.5 ${mode === "cash" ? "text-white" : "text-zinc-500"}`} strokeWidth={2.8} />
                <span
                  className={`text-[14px] font-black uppercase tracking-wider ${mode === "cash" ? "text-white" : "text-zinc-400"}`}
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  Cash
                </span>
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-[0.15em] mt-0.5 ${mode === "cash" ? "text-white/70" : "text-zinc-600"}`}>
                Win real $$
              </span>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={handlePrimaryCTA}
            disabled={joining}
            className="mt-2.5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black uppercase text-white text-base relative overflow-hidden disabled:opacity-60 group active:scale-[0.98] transition-transform"
            style={{
              background: mode === "instant"
                ? "linear-gradient(90deg, #2563eb 0%, #8b5cf6 50%, #ef4444 100%)"
                : "linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)",
              boxShadow: mode === "instant"
                ? "0 12px 32px -8px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.2)"
                : "0 12px 32px -8px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.2)",
              fontFamily: "Teko, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                animation: "shimmer 2s infinite",
              }}
            />
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 fill-white" strokeWidth={2.8} />
            )}
            {mode === "instant"
              ? (myActiveQuickFight ? "🔥 Resume Your Battle" : inQuickQueue ? "🔍 In Queue — Tap to Cancel" : "⚡ Quick Match — Find Opponent")
              : (myBattles.length > 0 ? "🔥 Resume Cash Battle" : "💰 Smash Queue — Win Cash")}
          </button>

          {/* Stats strip */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <StatChip label="LIVE" value={liveBattles.length} color="#ef4444" icon="🔥" />
            <StatChip label="QUEUED" value={pendingApps.length} color="#f59e0b" icon="⚡" />
            <StatChip
              label="POT"
              value={`$${(cashBattles.reduce((s, b) => s + (b.prize_cents ?? 0), 0) / 100).toFixed(0)}`}
              color="#10b981"
              icon="💰"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: active ? `${t.color}20` : "rgba(255,255,255,0.02)",
                  border: active ? `1px solid ${t.color}50` : "1px solid rgba(255,255,255,0.05)",
                  color: active ? t.color : "#a1a1aa",
                  fontFamily: "Teko, sans-serif",
                  fontSize: 13,
                }}
              >
                <Icon className="w-3 h-3" strokeWidth={2.5} />
                {t.label}
                {t.count > 0 && (
                  <span
                    className="ml-0.5 min-w-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{
                      background: active ? t.color : "rgba(255,255,255,0.08)",
                      color: active ? "#000" : "#a1a1aa",
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2.5"
            >
              {tab === "live" && mode === "instant" && (
                <>
                  {liveQuickFights.length === 0 ? (
                    <EmptyState
                      icon={Flame}
                      title="No live battles right now ⚡"
                      hint="Hit Quick Match — you'll be paired in seconds"
                    />
                  ) : (
                    liveQuickFights.map((f) => (
                      <QuickFightRow key={f.id} fight={f} onClick={() => navigate(`/fight/${f.id}`)} />
                    ))
                  )}
                </>
              )}
              {tab === "live" && mode === "cash" && (
                <>
                  {liveBattles.length === 0 ? (
                    <EmptyState
                      icon={Flame}
                      title="No live cash battles 💰"
                      hint="Sponsored drops hit when you least expect"
                    />
                  ) : (
                    liveBattles.map((b) => (
                      <BattleRow key={b.id} battle={b} onClick={() => navigate(`/cash-battle/${b.id}`)} />
                    ))
                  )}
                  {upcomingBattles.length > 0 && (
                    <>
                      <div className="pt-4 pb-1 flex items-center gap-2">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">⏳ Dropping Soon</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                      </div>
                      {upcomingBattles.map((b) => (
                        <BattleRow key={b.id} battle={b} onClick={() => navigate(`/cash-battle/${b.id}`)} />
                      ))}
                    </>
                  )}
                </>
              )}

              {tab === "open" && mode === "instant" && (
                <>
                  {queueEditors.length === 0 ? (
                    <EmptyState
                      icon={Zap}
                      title="Queue is empty ⚡"
                      hint="Smash Quick Match — you'll auto-pair the second another editor joins"
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 pb-1">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">⚡ {queueEditors.length} Waiting</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                      </div>
                      {queueEditors.map((ed) => (
                        <QueueEditorRow
                          key={ed.id}
                          editor={ed}
                          isOwn={user?.id === ed.user_id}
                          onAccept={() => handleAcceptQueueEditor(ed)}
                        />
                      ))}
                      {inQuickQueue && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 active:scale-[0.98] transition-all"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-blue-300" strokeWidth={2.5} />
                          <span className="text-[12px] font-black uppercase tracking-wider text-blue-300" style={{ fontFamily: "Teko, sans-serif" }}>
                            Invite a friend to accept
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {tab === "open" && mode === "cash" && (
                <>
                  {pendingApps.length === 0 ? (
                    <EmptyState
                      icon={Zap}
                      title="No challengers in line ⚡"
                      hint="Be the spark — drop into queue and let 'em come"
                    />
                  ) : (
                    pendingApps.map((app) => (
                      <OpenQueueRow
                        key={app.id}
                        app={app}
                        isOwn={user?.id === app.user_id}
                        onAccept={() => handleAcceptOpen(app)}
                      />
                    ))
                  )}
                </>
              )}

              {tab === "cash" && (
                <>
                  {cashBattles.length === 0 ? (
                    <EmptyState
                      icon={DollarSign}
                      title="No bag up for grabs rn 💰"
                      hint="Sponsored cash drops hit when you least expect"
                    />
                  ) : (
                    cashBattles.map((b) => (
                      <BattleRow key={b.id} battle={b} onClick={() => navigate(`/cash-battle/${b.id}`)} />
                    ))
                  )}
                </>
              )}

              {tab === "completed" && mode === "instant" && (
                <>
                  {completedQuickFights.length === 0 ? (
                    <EmptyState icon={Trophy} title="History's unwritten 🏆" hint="First win etches your name forever" />
                  ) : (
                    completedQuickFights.map((f) => (
                      <QuickFightRow key={f.id} fight={f} onClick={() => navigate(`/fight/${f.id}`)} />
                    ))
                  )}
                </>
              )}
              {tab === "completed" && mode === "cash" && (
                <>
                  {completedBattles.length === 0 ? (
                    <EmptyState icon={Trophy} title="History's unwritten 🏆" hint="First win etches your name forever" />
                  ) : (
                    completedBattles.map((b) => (
                      <BattleRow key={b.id} battle={b} onClick={() => navigate(`/cash-battle/${b.id}`)} />
                    ))
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="h-24" />

      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl overflow-hidden border border-blue-500/30"
              style={{
                background: "linear-gradient(165deg, #0a1020 0%, #0a0a0d 60%, #100a1a 100%)",
                boxShadow: "0 30px 80px -20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <div className="absolute inset-0 opacity-50" style={{
                  background: "radial-gradient(circle at 30% 0%, rgba(59,130,246,0.3), transparent 60%)",
                }} />
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                <div className="relative flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{
                    background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                    boxShadow: "0 8px 20px -8px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}>
                    <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.8} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[22px] font-black text-white leading-none uppercase" style={{ fontFamily: "Teko, sans-serif" }}>
                      You're in queue
                    </h2>
                    <p className="text-[11px] font-bold text-blue-300/80 uppercase tracking-[0.15em] mt-0.5">Invite a friend to auto-match</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                  {profile && (
                    <Avatar className="w-10 h-10 ring-2 ring-blue-500/40">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="text-xs font-bold bg-zinc-800 text-zinc-300">
                        {profile.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-extrabold text-white leading-tight">@{profile?.username}</div>
                    <div className="text-[11px] text-white/50">Waiting for an opponent — share to pull one in</div>
                  </div>
                </div>
                <p className="text-[11.5px] text-white/55 leading-snug px-1">
                  Anyone who taps your link and joins the queue will instantly auto-pair with you ⚡
                </p>
              </div>

              <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyInvite}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] active:scale-[0.97] transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span className="text-[13px] font-black text-white uppercase" style={{ fontFamily: "Teko, sans-serif" }}>Copy Link</span>
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-white active:scale-[0.97] transition-all"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                    boxShadow: "0 8px 20px -8px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="text-[13px] font-black uppercase" style={{ fontFamily: "Teko, sans-serif" }}>Share</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatChip({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: string }) {
  return (
    <div
      className="rounded-xl px-2.5 py-2 border relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${color}25 0%, rgba(15,15,18,0.9) 100%)`,
        borderColor: `${color}30`,
        boxShadow: `inset 0 1px 0 ${color}30, 0 4px 12px -4px ${color}20`,
      }}
    >
      <div className="flex items-baseline gap-1">
        {icon && <span className="text-[11px] leading-none">{icon}</span>}
        <div
          className="text-2xl font-black leading-none"
          style={{ color, fontFamily: "Teko, sans-serif", textShadow: `0 0 12px ${color}80` }}
        >
          {value}
        </div>
      </div>
      <div className="text-[9px] uppercase tracking-[0.15em] font-black mt-0.5" style={{ color: `${color}aa` }}>
        {label}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <Icon className="w-6 h-6 text-zinc-600" />
      </div>
      <p className="text-sm font-bold text-zinc-400 text-center">{title}</p>
      <p className="text-xs text-zinc-600 text-center">{hint}</p>
    </div>
  );
}