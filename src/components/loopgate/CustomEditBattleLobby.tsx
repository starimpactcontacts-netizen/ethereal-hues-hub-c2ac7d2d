import { motion } from "framer-motion";
import { ArrowLeft, Clock, Copy, Eye, Lock, Share2, UserPlus, Users, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import QuickFightChat from "@/components/loopgate/QuickFightChat";
import { useLobbyMusicMute } from "@/components/loopgate/LobbyMusicPlayer";
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

const P1_COLOR = "#1d6fff";
const P2_COLOR = "#cc1111";

const stripeStyle = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.06) 5px, rgba(255,255,255,0.06) 10px)",
};

function StockDots() {
  return (
    <div className="flex gap-1.5 mt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-white/25" />
      ))}
    </div>
  );
}

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
    .filter((e) => e.user_id !== fight.player_1_id && e.user_id !== viewerId)
    .slice(0, 5);

  const isPrivate = !!fight.is_private;
  const [codeInput, setCodeInput] = useState("");
  const [searchParams] = useSearchParams();
  const [muted, toggleMuted] = useLobbyMusicMute();

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
    <div className="relative min-h-[100dvh] overflow-hidden text-white bg-[#090909]">

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-[#090909] border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="h-9 px-2 -ml-2 flex items-center gap-2 text-white/50 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Arena</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-white/40 tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {fight.view_count || 1}
            </div>
            <button
              onClick={toggleMuted}
              className="h-8 w-8 grid place-items-center border border-white/15 bg-white/[0.04] active:scale-95 transition-transform"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted
                ? <VolumeX className="w-3.5 h-3.5 text-red-400" />
                : <Volume2 className="w-3.5 h-3.5 text-white/50" />}
            </button>
            <button
              onClick={onShare}
              className="h-8 w-8 grid place-items-center border border-white/15 bg-white/[0.04] text-white/50 active:scale-95 transition-transform"
              aria-label="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">

        {/* Title */}
        <div className="text-center mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25 mb-1">
            {isPrivate ? "Private" : "Open"} • {duration} Duration
          </p>
          <h1
            className="text-[46px] leading-[0.88] font-black uppercase text-white"
            style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.02em" }}
          >
            Custom Edit Battle
          </h1>
        </div>

        {/* VS Panel */}
        <div className="border border-white/15 overflow-hidden" style={{ backgroundColor: "#111" }}>
          <div className="h-2.5" style={stripeStyle} />

          {isPrivate && (
            <div className="flex justify-center py-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 border border-white/15 px-3 py-1">
                <Lock className="w-2.5 h-2.5 text-white/35" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
                  Private Lobby
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center px-3 py-5 gap-2">
            {/* P1 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: P1_COLOR }}
                >
                  P1
                </div>
                <div
                  className="w-[96px] h-[96px] border-[3px] overflow-hidden"
                  style={{ borderColor: P1_COLOR }}
                >
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={fight.player_1_avatar_url || ""} className="object-cover w-full h-full" />
                    <AvatarFallback
                      className="rounded-none text-3xl font-black"
                      style={{ backgroundColor: "#050d1f", color: P1_COLOR, fontFamily: "Teko, sans-serif" }}
                    >
                      {fight.player_1_username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span
                className="mt-2.5 max-w-[110px] truncate text-[15px] font-black uppercase text-white"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                {fight.player_1_username}
              </span>
              {isHost && (
                <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em]" style={{ color: P1_COLOR }}>
                  You
                </span>
              )}
              <StockDots />
            </div>

            {/* VS */}
            <div className="shrink-0">
              <span
                className="text-[62px] leading-none font-black text-white block"
                style={{
                  fontFamily: "Teko, sans-serif",
                  textShadow: `2px 2px 0 ${P2_COLOR}, 3px 3px 0 #660000`,
                }}
              >
                VS
              </span>
            </div>

            {/* P2 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mt-3">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: P2_COLOR }}
                >
                  P2
                </div>
                <div
                  className="w-[96px] h-[96px] border-[3px] flex items-center justify-center"
                  style={{ borderColor: P2_COLOR, backgroundColor: "#160000" }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    className="text-[62px] leading-none font-black"
                    style={{ fontFamily: "Teko, sans-serif", color: P2_COLOR }}
                  >
                    ?
                  </motion.span>
                </div>
              </div>
              <span
                className="mt-2.5 text-[15px] font-black uppercase"
                style={{ fontFamily: "Teko, sans-serif", color: P2_COLOR }}
              >
                Open Slot
              </span>
              <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-white/30">
                Tap In
              </span>
              <StockDots />
            </div>
          </div>

          <div className="h-2.5 border-t border-white/10" style={stripeStyle} />
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {isHost ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={onShare}
                className="h-[50px] bg-white text-black flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-[0.12em] active:scale-[0.98] transition-transform"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <Users className="w-4 h-4" /> Invite
              </button>
              <button
                onClick={onCopy}
                className="h-[50px] w-[50px] border border-white/15 bg-white/[0.04] grid place-items-center text-white/50 active:scale-95 transition-transform"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : isPrivate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                <Lock className="w-3 h-3" /> Code Required
              </div>
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER CODE"
                className="w-full h-[50px] border border-white/15 bg-white/[0.04] px-4 text-center text-[20px] font-black tracking-[0.4em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/35"
                style={{ fontFamily: "Teko, sans-serif" }}
              />
              <button
                onClick={() => onJoin(codeInput.trim())}
                disabled={codeInput.trim().length < 4}
                className="h-[52px] w-full bg-white text-black flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-[0.12em] active:scale-[0.98] transition-transform disabled:opacity-30"
                style={{ fontFamily: "Teko, sans-serif" }}
              >
                <UserPlus className="w-5 h-5" /> Accept Battle
              </button>
            </div>
          ) : (
            <button
              onClick={() => onJoin()}
              className="h-[52px] w-full bg-white text-black flex items-center justify-center gap-2 text-[15px] font-black uppercase tracking-[0.12em] active:scale-[0.98] transition-transform"
              style={{ fontFamily: "Teko, sans-serif" }}
            >
              <UserPlus className="w-5 h-5" /> Accept Battle
            </button>
          )}
        </div>

        {/* Join Code */}
        {isPrivate && isHost && fight.join_code && (
          <div className="mt-3 border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Join Code</p>
                <p
                  className="mt-0.5 text-[30px] leading-none font-black tracking-[0.3em] text-white"
                  style={{ fontFamily: "Teko, sans-serif" }}
                >
                  {fight.join_code}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="h-9 w-9 border border-white/15 bg-black/40 grid place-items-center text-white/40 active:scale-95 transition-transform"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-[9px] text-white/20 leading-relaxed">
              Share privately — only people with this code can join.
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

          <div className="border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Open in carousel</p>
                <p className="mt-0.5 text-[12px] text-white/45 truncate">Visible as an edit battle card</p>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {otherEditors.length > 0 ? (
                  otherEditors.map((editor) => (
                    <Avatar key={editor.id} className="w-7 h-7 rounded-none border-2 border-[#090909]">
                      <AvatarImage src={editor.avatar_url || ""} />
                      <AvatarFallback className="rounded-none bg-white/10 text-[10px] font-bold text-white">
                        {editor.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <div className="h-7 px-2.5 border border-white/10 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                    <Clock className="w-2.5 h-2.5" /> First Open
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHost && (
            <button
              onClick={onCancel}
              className="w-full h-10 border border-white/[0.08] text-white/20 text-[10px] font-black uppercase tracking-[0.25em] active:scale-[0.98] transition-transform"
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
