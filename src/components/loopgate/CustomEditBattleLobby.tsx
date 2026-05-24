import { motion } from "framer-motion";
import { ArrowLeft, Clock, Copy, Eye, Lock, Share2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import QuickFightChat from "@/components/loopgate/QuickFightChat";
import type { OpenQueueEntry, QuickFight } from "@/hooks/useQuickFight";
import { toast } from "sonner";

interface CustomEditBattleLobbyProps {
  fight: QuickFight;
  isHost: boolean;
  viewerId?: string;
  openQueue: OpenQueueEntry[];
  onBack: () => void;
  onShare: () => void;
  onCopy: () => void;
  onJoin: (code?: string) => void;
  onCancel: () => void;
  onSongPicked?: (drop: any) => Promise<void>;
}

function StockDots() {
  return (
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2.5 h-2.5 rounded-full bg-white border border-black/40" />
      ))}
    </div>
  );
}

const stripeStyle = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.12) 6px, rgba(255,255,255,0.12) 12px)",
};

export default function CustomEditBattleLobby({
  fight,
  isHost,
  viewerId,
  openQueue,
  onBack,
  onShare,
  onCopy,
  onJoin,
  onCancel,
}: CustomEditBattleLobbyProps) {
  const duration =
    fight.duration_minutes >= 60
      ? `${Math.round(fight.duration_minutes / 60)}H`
      : `${fight.duration_minutes}M`;
  const otherEditors = openQueue
    .filter((entry) => entry.user_id !== fight.player_1_id && entry.user_id !== viewerId)
    .slice(0, 5);
  const isPrivate = !!fight.is_private;
  const [codeInput, setCodeInput] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("code");
    if (q && isPrivate) setCodeInput(q.toUpperCase().slice(0, 6));
  }, [searchParams, isPrivate]);

  const handleCopyCode = async () => {
    if (!fight.join_code) return;
    try {
      await navigator.clipboard.writeText(fight.join_code);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden text-white"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b-2 border-white/10"
        style={{ backgroundColor: "#0a0a0f" }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="h-9 px-2 -ml-2 flex items-center gap-2 text-white/60 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Arena</span>
          </button>
          <div className="flex items-center gap-3 text-white/60">
            <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {fight.view_count || 1}
            </div>
            <button
              onClick={onShare}
              className="h-9 w-9 grid place-items-center border-2 border-white/20 bg-white/5 active:scale-95 transition-transform"
              aria-label="Share lobby"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <h1
            className="text-center text-[44px] leading-[0.88] font-black uppercase text-white"
            style={{
              fontFamily: "Teko, sans-serif",
              textShadow: "3px 3px 0px #000, 5px 5px 0px #000",
            }}
          >
            Custom Edit Battle
          </h1>
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-white/40 mt-1">
            {duration} Duration
          </p>
        </motion.div>

        {/* Matchup Panel */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.24 }}
          className="relative mt-5 border-2 border-white/20"
        >
          {/* Top stripe bar */}
          <div className="h-3 w-full border-b-2 border-white/10" style={stripeStyle} />

          {isPrivate && (
            <div className="flex items-center justify-center py-2 border-b border-white/10">
              <div className="flex items-center gap-2 border border-white/20 bg-white/5 px-3 py-1">
                <Lock className="w-3 h-3 text-white/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                  Private Lobby
                </span>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between gap-2 px-3 py-5">
            {/* P1 Portrait */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ backgroundColor: "#FFD700", color: "#000" }}
                >
                  P1
                </div>
                <div
                  className="w-[88px] h-[88px] border-4 overflow-hidden"
                  style={{ borderColor: "#FFD700" }}
                >
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage
                      src={fight.player_1_avatar_url || ""}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback
                      className="rounded-none text-3xl font-black"
                      style={{
                        backgroundColor: "#1a1500",
                        color: "#FFD700",
                        fontFamily: "Teko, sans-serif",
                      }}
                    >
                      {fight.player_1_username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span
                className="mt-3 max-w-[110px] truncate text-[15px] leading-none font-black uppercase text-white"
                style={{
                  fontFamily: "Teko, sans-serif",
                  textShadow: "1px 1px 0 #000",
                }}
              >
                {fight.player_1_username}
              </span>
              {isHost && (
                <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-yellow-400">
                  You
                </span>
              )}
              <StockDots />
            </div>

            {/* VS */}
            <div className="shrink-0 flex flex-col items-center">
              <span
                className="text-[56px] leading-none font-black text-white"
                style={{
                  fontFamily: "Teko, sans-serif",
                  textShadow: "2px 2px 0px #cc0000, 4px 4px 0px #660000",
                }}
              >
                VS
              </span>
            </div>

            {/* P2 Portrait — Open Slot */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: "#cc0000" }}
                >
                  P2
                </div>
                <div
                  className="w-[88px] h-[88px] border-4 flex items-center justify-center"
                  style={{ borderColor: "#cc0000", backgroundColor: "#1a0000" }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "steps(2)" }}
                    className="text-[60px] leading-none font-black"
                    style={{
                      fontFamily: "Teko, sans-serif",
                      color: "#ff2222",
                      textShadow: "2px 2px 0 #000",
                    }}
                  >
                    ?
                  </motion.span>
                </div>
              </div>
              <span
                className="mt-3 text-[15px] leading-none font-black uppercase"
                style={{
                  fontFamily: "Teko, sans-serif",
                  color: "#ff4444",
                  textShadow: "1px 1px 0 #000",
                }}
              >
                Open Slot
              </span>
              <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-red-500">
                Tap In
              </span>
              <StockDots />
            </div>
          </div>

          {/* Bottom stripe bar */}
          <div className="h-3 w-full border-t-2 border-white/10" style={stripeStyle} />
        </motion.section>

        {/* Primary Actions */}
        <div className="mt-5 space-y-3">
          {isHost ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={onShare}
                className="h-14 border-2 border-white bg-white text-black flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <Users className="w-4 h-4" /> Invite
              </button>
              <button
                onClick={onCopy}
                className="h-14 w-14 border-2 border-white/20 bg-white/5 grid place-items-center text-white/60 active:scale-[0.96] transition-transform"
                aria-label="Copy lobby link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          ) : isPrivate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                <Lock className="w-3 h-3" /> Code Required
              </div>
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER CODE"
                className="w-full h-14 border-2 border-white/20 bg-white/5 px-4 text-center text-[20px] font-black tracking-[0.4em] text-white placeholder:text-white/25 focus:outline-none focus:border-white/50"
                style={{ fontFamily: "Teko, sans-serif" }}
              />
              <button
                onClick={() => onJoin(codeInput.trim())}
                disabled={codeInput.trim().length < 4}
                className="h-[60px] w-full border-2 border-white bg-white text-black flex items-center justify-center gap-2 text-[16px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform disabled:opacity-40"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <UserPlus className="w-5 h-5" /> Accept Battle
              </button>
            </div>
          ) : (
            <button
              onClick={() => onJoin()}
              className="h-[60px] w-full border-2 border-white bg-white text-black flex items-center justify-center gap-2 text-[16px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              <UserPlus className="w-5 h-5" /> Accept Battle
            </button>
          )}
        </div>

        {/* Join Code (host + private) */}
        {isPrivate && isHost && fight.join_code && (
          <div className="mt-3 border-2 border-white/20 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">
                  Join Code
                </p>
                <p
                  className="mt-1 text-[28px] leading-none font-black tracking-[0.3em] text-white"
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  {fight.join_code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="h-10 w-10 border-2 border-white/20 bg-black grid place-items-center text-white/60 active:scale-95 transition-transform"
                aria-label="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/30">
              Share this code privately. Only people with the code can accept this battle.
            </p>
          </div>
        )}

        {/* Chat + Carousel */}
        <div className="mt-4 space-y-3">
          <QuickFightChat
            fightId={fight.id}
            player1Id={fight.player_1_id}
            player2Id={fight.player_2_id || ""}
            player1Username={fight.player_1_username}
            player2Username={fight.player_2_username || ""}
          />

          <div className="border-2 border-white/20 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Open in carousel
                </p>
                <p className="mt-0.5 text-[13px] text-white/60 truncate">
                  Visible as an edit battle card
                </p>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {otherEditors.length > 0 ? (
                  otherEditors.map((editor) => (
                    <Avatar
                      key={editor.id}
                      className="w-8 h-8 rounded-none border-2"
                      style={{ borderColor: "#0a0a0f" }}
                    >
                      <AvatarImage src={editor.avatar_url || ""} />
                      <AvatarFallback className="rounded-none bg-white/10 text-[10px] font-bold text-white">
                        {editor.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <div className="h-8 px-3 border border-white/20 bg-black/70 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                    <Clock className="w-3 h-3" /> First Open
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHost && (
            <button
              onClick={onCancel}
              className="w-full h-12 border-2 border-white/15 bg-transparent text-white/35 text-[11px] font-black uppercase tracking-[0.22em] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              Cancel Lobby
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
