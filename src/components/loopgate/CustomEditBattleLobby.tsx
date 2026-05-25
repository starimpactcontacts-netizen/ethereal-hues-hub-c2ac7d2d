import { motion } from "framer-motion";
import { ArrowLeft, Clock, Copy, Eye, Lock, Share2, UserPlus, Users, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
        <div key={i} className="w-2 h-2 rounded-full bg-white/30 border border-white/20" />
      ))}
    </div>
  );
}

const stripeStyle = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.07) 6px, rgba(255,255,255,0.07) 12px)",
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
  const [muted, setMuted] = useState(() => localStorage.getItem("lobby_muted") === "1");

  useEffect(() => {
    const q = searchParams.get("code");
    if (q && isPrivate) setCodeInput(q.toUpperCase().slice(0, 6));
  }, [searchParams, isPrivate]);

  useEffect(() => {
    localStorage.setItem("lobby_muted", muted ? "1" : "0");
    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((el) => {
      el.muted = muted;
    });
  }, [muted]);

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
      style={{ backgroundColor: "#07070d" }}
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 top-[28%] w-72 h-72 rounded-full opacity-[0.07] blur-3xl"
          style={{ backgroundColor: "#FFD700" }}
        />
        <div
          className="absolute -right-16 top-[28%] w-72 h-72 rounded-full opacity-[0.09] blur-3xl"
          style={{ backgroundColor: "#cc0000" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 opacity-30"
          style={{
            background: "linear-gradient(to top, #07070d 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b border-white/[0.08]"
        style={{ backgroundColor: "rgba(7,7,13,0.92)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="h-9 px-2 -ml-2 flex items-center gap-2 text-white/50 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Arena</span>
          </button>

          <div className="flex items-center gap-2 text-white/50">
            <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {fight.view_count || 1}
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              className="h-9 w-9 grid place-items-center border border-white/15 bg-white/5 active:scale-95 transition-all rounded-sm"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted
                ? <VolumeX className="w-4 h-4 text-red-400" />
                : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onShare}
              className="h-9 w-9 grid place-items-center border border-white/15 bg-white/5 active:scale-95 transition-transform rounded-sm"
              aria-label="Share lobby"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30 mb-1">
            {isPrivate ? "Private" : "Open"} Battle
          </p>
          <h1
            className="text-[52px] leading-[0.85] font-black uppercase text-white"
            style={{
              fontFamily: "Teko, sans-serif",
              textShadow: "0 0 40px rgba(255,215,0,0.15), 3px 3px 0px #000",
            }}
          >
            Custom Edit Battle
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/35 mt-1.5">
            {duration} Duration
          </p>
        </motion.div>

        {/* VS Matchup Panel */}
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.06, duration: 0.22 }}
          className="relative mt-6 border border-white/15 overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          {/* Top stripe */}
          <div className="h-2.5 w-full border-b border-white/10" style={stripeStyle} />

          {/* Private badge */}
          {isPrivate && (
            <div className="flex items-center justify-center py-2 border-b border-white/[0.07]">
              <div className="flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-1">
                <Lock className="w-2.5 h-2.5 text-white/40" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                  Private Lobby
                </span>
              </div>
            </div>
          )}

          <div className="relative flex items-start justify-between gap-2 px-4 py-6">
            {/* P1 */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ backgroundColor: "#FFD700", color: "#000" }}
                >
                  P1
                </div>
                {/* Gold outer glow */}
                <div
                  className="absolute inset-0 opacity-40 blur-xl"
                  style={{ backgroundColor: "#FFD700", transform: "scale(1.4)" }}
                />
                <div
                  className="relative w-[90px] h-[90px] border-[3px] overflow-hidden"
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
                        backgroundColor: "#1a1200",
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
                className="mt-3 max-w-[110px] truncate text-[16px] leading-none font-black uppercase text-white"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                {fight.player_1_username}
              </span>
              {isHost && (
                <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-yellow-400">
                  You
                </span>
              )}
              <StockDots />
            </div>

            {/* VS */}
            <div className="shrink-0 flex flex-col items-center pt-3">
              <span
                className="text-[64px] leading-none font-black"
                style={{
                  fontFamily: "Teko, sans-serif",
                  color: "#fff",
                  textShadow: "2px 2px 0px #cc0000, 4px 4px 0px #660000, 0 0 30px rgba(204,0,0,0.4)",
                }}
              >
                VS
              </span>
            </div>

            {/* P2 — Open Slot */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: "#cc0000" }}
                >
                  P2
                </div>
                {/* Red outer glow */}
                <div
                  className="absolute inset-0 opacity-30 blur-xl"
                  style={{ backgroundColor: "#cc0000", transform: "scale(1.4)" }}
                />
                <div
                  className="relative w-[90px] h-[90px] border-[3px] flex items-center justify-center"
                  style={{ borderColor: "#cc0000", backgroundColor: "#120000" }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 0.85, repeat: Infinity, ease: "steps(2)" }}
                    className="text-[64px] leading-none font-black"
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
                className="mt-3 text-[16px] leading-none font-black uppercase"
                style={{
                  fontFamily: "Teko, sans-serif",
                  color: "#ff4444",
                }}
              >
                Open Slot
              </span>
              <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-red-500/70">
                Tap In
              </span>
              <StockDots />
            </div>
          </div>

          {/* Bottom stripe */}
          <div className="h-2.5 w-full border-t border-white/10" style={stripeStyle} />
        </motion.section>

        {/* Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2 }}
          className="mt-4 space-y-2.5"
        >
          {isHost ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={onShare}
                className="h-[52px] border border-white bg-white text-black flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <Users className="w-4 h-4" /> Invite
              </button>
              <button
                onClick={onCopy}
                className="h-[52px] w-[52px] border border-white/15 bg-white/5 grid place-items-center text-white/50 active:scale-[0.96] transition-transform"
                aria-label="Copy lobby link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : isPrivate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                <Lock className="w-3 h-3" /> Code Required
              </div>
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER CODE"
                className="w-full h-[52px] border border-white/15 bg-white/[0.04] px-4 text-center text-[20px] font-black tracking-[0.4em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/40"
                style={{ fontFamily: "Teko, sans-serif" }}
              />
              <button
                onClick={() => onJoin(codeInput.trim())}
                disabled={codeInput.trim().length < 4}
                className="h-[56px] w-full border border-white bg-white text-black flex items-center justify-center gap-2 text-[16px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform disabled:opacity-30"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <UserPlus className="w-5 h-5" /> Accept Battle
              </button>
            </div>
          ) : (
            <button
              onClick={() => onJoin()}
              className="h-[56px] w-full border border-white bg-white text-black flex items-center justify-center gap-2 text-[16px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              <UserPlus className="w-5 h-5" /> Accept Battle
            </button>
          )}
        </motion.div>

        {/* Join Code (host + private) */}
        {isPrivate && isHost && fight.join_code && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.2 }}
            className="mt-3 border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                  Join Code
                </p>
                <p
                  className="mt-0.5 text-[32px] leading-none font-black tracking-[0.35em] text-white"
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  {fight.join_code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="h-10 w-10 border border-white/15 bg-black/50 grid place-items-center text-white/50 active:scale-95 transition-transform"
                aria-label="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/25 leading-relaxed">
              Share privately — only people with this code can join.
            </p>
          </motion.div>
        )}

        {/* Chat + Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.22 }}
          className="mt-4 space-y-3"
        >
          <QuickFightChat
            fightId={fight.id}
            player1Id={fight.player_1_id}
            player2Id={fight.player_2_id || ""}
            player1Username={fight.player_1_username}
            player2Username={fight.player_2_username || ""}
          />

          <div className="border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Open in carousel
                </p>
                <p className="mt-0.5 text-[12px] text-white/50 truncate">
                  Visible as an edit battle card
                </p>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {otherEditors.length > 0 ? (
                  otherEditors.map((editor) => (
                    <Avatar
                      key={editor.id}
                      className="w-7 h-7 rounded-none border-2"
                      style={{ borderColor: "#07070d" }}
                    >
                      <AvatarImage src={editor.avatar_url || ""} />
                      <AvatarFallback className="rounded-none bg-white/10 text-[10px] font-bold text-white">
                        {editor.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <div className="h-7 px-2.5 border border-white/15 bg-black/50 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                    <Clock className="w-2.5 h-2.5" /> First Open
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHost && (
            <button
              onClick={onCancel}
              className="w-full h-11 border border-white/10 bg-transparent text-white/25 text-[10px] font-black uppercase tracking-[0.25em] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              Cancel Lobby
            </button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
