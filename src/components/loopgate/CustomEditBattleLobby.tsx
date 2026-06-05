import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronUp, Clock, Copy, Eye, EyeOff, Lock, Share2, Swords, UserPlus, Users, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import QuickFightChat from "@/components/loopgate/QuickFightChat";
import SmartUsername from "@/components/loopgate/SmartUsername";
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
  onReserve?: (code?: string) => Promise<void>;
  onCancel: () => void;
  onSongPicked?: (drop: any) => Promise<void>;
}

const P1_COLOR = "#1d6fff";
const P2_COLOR = "#cc1111";

const stripeStyle = {
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.06) 5px, rgba(255,255,255,0.06) 10px)",
};

function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    />
  );
}

function ArenaButton({
  onClick,
  icon,
  label,
  large = false,
  disabled = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  large?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full overflow-hidden flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-30 ${large ? 'h-[58px]' : 'h-[50px]'}`}
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.18)' }}
    >
      <DotGrid />
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }} />
      {/* Corner notch top-right */}
      <div className="absolute top-0 right-0">
        <div className="w-2.5 h-px bg-white/30" />
        <div className="w-px h-2.5 bg-white/30 ml-auto" />
      </div>
      {/* Corner notch bottom-left */}
      <div className="absolute bottom-0 left-0">
        <div className="w-2.5 h-px bg-white/30" />
        <div className="w-px h-2.5 bg-white/30" />
      </div>
      <span className="relative z-10 text-white/60">{icon}</span>
      <span
        className="relative z-10 text-white font-black uppercase leading-none"
        style={{ fontFamily: 'Teko, sans-serif', fontSize: large ? 22 : 16, letterSpacing: '0.1em' }}
      >
        {label}
      </span>
    </button>
  );
}

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
  onReserve,
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
  const [reserving, setReserving] = useState(false);
  const [codeHidden, setCodeHidden] = useState(false);
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
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-0">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25">
              {isPrivate ? "Private" : "Open"} • {duration} Duration
            </p>
          </div>
          {/* Custom EDIT BATTLE title image */}
          <img
            src="/edit-battle-title.png"
            alt="Edit Battle"
            draggable={false}
            className="select-none mx-auto block mt-2"
            style={{ maxWidth: '220px', width: '65%', height: 'auto' }}
          />
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
              <SmartUsername
                userId={fight.player_1_id}
                username={fight.player_1_username || ""}
                className="mt-2.5 max-w-[110px] truncate text-[15px] font-black uppercase text-white"
                style={{ fontFamily: "Teko, sans-serif" }}
              />
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
                {fight.player_2_id ? (
                  <div
                    className="w-[96px] h-[96px] border-[3px] overflow-hidden"
                    style={{ borderColor: P2_COLOR }}
                  >
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={fight.player_2_avatar_url || ""} className="object-cover w-full h-full" />
                      <AvatarFallback
                        className="rounded-none text-3xl font-black"
                        style={{ backgroundColor: "#160000", color: P2_COLOR, fontFamily: "Teko, sans-serif" }}
                      >
                        {fight.player_2_username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
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
                )}
              </div>
              {fight.player_2_id ? (
                <>
                  <SmartUsername
                    userId={fight.player_2_id}
                    username={fight.player_2_username || ""}
                    className="mt-2.5 max-w-[110px] truncate text-[15px] font-black uppercase text-white"
                    style={{ fontFamily: "Teko, sans-serif" }}
                  />
                  {viewerId === fight.player_2_id && (
                    <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em]" style={{ color: P2_COLOR }}>
                      You
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span
                    className="mt-2.5 text-[15px] font-black uppercase"
                    style={{ fontFamily: "Teko, sans-serif", color: P2_COLOR }}
                  >
                    Open Slot
                  </span>
                  <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.25em] text-white/30">
                    Tap In
                  </span>
                </>
              )}
              <StockDots />
            </div>
          </div>

          <div className="h-2.5 border-t border-white/10" style={stripeStyle} />
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {isHost ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <ArenaButton onClick={onShare} icon={<Users className="w-4 h-4" />} label="Invite" />
              <button
                onClick={onCopy}
                className="h-[54px] w-[54px] grid place-items-center text-white/50 active:scale-95 transition-transform relative overflow-hidden"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.13)' }}
              >
                <DotGrid />
                <Copy className="relative w-4 h-4 z-10" />
              </button>
            </div>
          ) : isPrivate ? (
            <div className="space-y-2">
              {/* If code came from URL, process silently — don't expose it on screen */}
              {codeInput ? (
                <>
                  <ArenaButton
                    onClick={() => onJoin(codeInput.trim())}
                    icon={<Swords className="w-5 h-5" />}
                    label="Accept Battle"
                    large
                  />
                  <button
                    onClick={async () => {
                      if (!onReserve || reserving) return;
                      setReserving(true);
                      try { await onReserve(codeInput.trim()); } finally { setReserving(false); }
                    }}
                    disabled={reserving}
                    className="w-full h-9 flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-transform disabled:opacity-30"
                  >
                    <UserPlus className="w-3 h-3 text-white/45" />
                    <span
                      className="text-white/55 font-black uppercase leading-none"
                      style={{ fontFamily: 'Teko, sans-serif', fontSize: 13, letterSpacing: '0.18em' }}
                    >
                      {reserving ? '…' : 'Join — Wait For Start'}
                    </span>
                  </button>
                </>
              ) : (
                <>
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
                  <ArenaButton
                    onClick={() => onJoin(codeInput.trim())}
                    disabled={codeInput.trim().length < 4}
                    icon={<UserPlus className="w-5 h-5" />}
                    label="Accept Battle"
                    large
                  />
                </>
              )}
            </div>
          ) : !fight.player_2_id ? (
            /* Open slot — ACCEPT BATTLE primary, JOIN as small secondary below */
            <div className="space-y-2">
              <ArenaButton
                onClick={() => onJoin()}
                icon={<Swords className="w-5 h-5" />}
                label="Accept Battle"
                large
              />
              <button
                onClick={async () => {
                  if (!onReserve || reserving) return;
                  setReserving(true);
                  try { await onReserve(); } finally { setReserving(false); }
                }}
                disabled={reserving}
                className="w-full h-9 flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] active:scale-[0.98] transition-transform disabled:opacity-30"
              >
                <UserPlus className="w-3 h-3 text-white/45" />
                <span
                  className="text-white/55 font-black uppercase leading-none"
                  style={{ fontFamily: 'Teko, sans-serif', fontSize: 13, letterSpacing: '0.18em' }}
                >
                  {reserving ? '…' : 'Join — Wait For Start'}
                </span>
              </button>
            </div>
          ) : viewerId === fight.player_2_id ? (
            /* Viewer already reserved — just show ACCEPT BATTLE */
            <ArenaButton
              onClick={() => onJoin()}
              icon={<Swords className="w-5 h-5" />}
              label="Accept Battle"
              large
            />
          ) : (
            /* Slot taken by someone else */
            <div className="h-[58px] border border-white/10 flex items-center justify-center">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/25" style={{ fontFamily: "Teko, sans-serif" }}>
                Slot Taken
              </span>
            </div>
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
