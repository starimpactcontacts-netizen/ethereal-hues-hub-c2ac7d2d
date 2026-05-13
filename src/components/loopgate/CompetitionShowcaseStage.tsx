import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, Check, Loader2, Crown, Trophy, MessageCircle, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompetitionSubmission } from "@/hooks/useCompetitions";
import { useUnifiedThumbnail } from "@/lib/thumbnail";
import { useBattleAudioUnlock } from "@/hooks/useBattleAudioUnlock";
import { supabase } from "@/integrations/supabase/client";
import { CompetitionVoiceChat } from "@/components/loopgate/CompetitionVoiceChat";
import CompetitionChat from "@/components/loopgate/CompetitionChat";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };
const PER_EDIT_SECONDS = 15;

type Phase = "watching" | "voting" | "submitted";

const REACTIONS = [
  { id: "fire",   emoji: "🔥", label: "FIRE",   color: "from-orange-500 to-red-600" },
  { id: "goat",   emoji: "🐐", label: "GOAT",   color: "from-amber-400 to-yellow-600" },
  { id: "rotten", emoji: "🍅", label: "ROTTEN", color: "from-red-500 to-rose-700" },
  { id: "dead",   emoji: "💀", label: "DEAD",   color: "from-zinc-500 to-zinc-800" },
] as const;
type ReactionId = typeof REACTIONS[number]["id"];

interface FloatingReaction { key: number; emoji: string; x: number; }

function isDirectVideo(url: string) { return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url); }
function isImageFile(url: string) { return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url); }

function StageMedia({ sub, videoRef }: { sub: CompetitionSubmission; videoRef: React.RefObject<HTMLVideoElement> }) {
  const direct = isDirectVideo(sub.submission_url);
  const image = isImageFile(sub.submission_url);
  const thumb = useUnifiedThumbnail(sub.submission_url, sub.platform || "", (sub as any).manual_thumbnail_url, (sub as any).thumbnail_url);
  if (direct) {
    return (
      <video ref={videoRef} src={sub.submission_url} className="absolute inset-0 w-full h-full object-contain bg-black"
        autoPlay playsInline loop preload="auto" />
    );
  }
  if (image) {
    return <img src={sub.submission_url} alt="" className="absolute inset-0 w-full h-full object-contain bg-black" />;
  }
  return (
    <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
      <img src={thumb.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center"><Play className="w-9 h-9 text-white ml-1" fill="currentColor" /></div>
      </div>
    </a>
  );
}

function TileMedia({ sub }: { sub: CompetitionSubmission }) {
  const direct = isDirectVideo(sub.submission_url);
  const image = isImageFile(sub.submission_url);
  const thumb = useUnifiedThumbnail(sub.submission_url, sub.platform || "", (sub as any).manual_thumbnail_url, (sub as any).thumbnail_url);
  if (direct) return <video src={sub.submission_url} muted playsInline preload="metadata" className="w-full h-full object-cover" />;
  if (image) return <img src={sub.submission_url} alt="" className="w-full h-full object-cover" />;
  return <img src={thumb.url} alt="" className="w-full h-full object-cover" />;
}

interface Props {
  competitionId: string;
  competitionName: string;
  theme: string | null | undefined;
  submissions: CompetitionSubmission[];
  myUserId: string | undefined;
  myVoteSubmissionId: string | null;
  votingStartedAt: string | null | undefined;
  votingDeadline: string | null | undefined;
  onVote: (submissionId: string) => Promise<boolean>;
  onClose: () => void;
}

export default function CompetitionShowcaseStage({
  competitionId, competitionName, theme,
  submissions, myUserId, myVoteSubmissionId,
  votingStartedAt, votingDeadline, onVote, onClose,
}: Props) {
  const audioUnlocked = useBattleAudioUnlock();
  const ordered = useMemo(() => [...submissions].sort((a, b) => a.created_at.localeCompare(b.created_at)), [submissions]);

  const startMs = votingStartedAt ? new Date(votingStartedAt).getTime() : null;
  const totalShowcaseMs = ordered.length * PER_EDIT_SECONDS * 1000;

  const compute = () => {
    if (!startMs) return { idx: 0, left: PER_EDIT_SECONDS, done: false };
    const elapsed = Math.max(0, Date.now() - startMs);
    if (elapsed >= totalShowcaseMs) return { idx: ordered.length - 1, left: 0, done: true };
    const idx = Math.min(ordered.length - 1, Math.floor(elapsed / (PER_EDIT_SECONDS * 1000)));
    const intoEdit = elapsed - idx * PER_EDIT_SECONDS * 1000;
    const left = Math.max(0, Math.ceil((PER_EDIT_SECONDS * 1000 - intoEdit) / 1000));
    return { idx, left, done: false };
  };

  const initial = compute();
  const [phase, setPhase] = useState<Phase>(!startMs || !initial.done ? "watching" : (myVoteSubmissionId ? "submitted" : "voting"));
  const [currentIdx, setCurrentIdx] = useState(initial.idx);
  const [secondsLeft, setSecondsLeft] = useState(initial.left);
  const [paused, setPaused] = useState(false);
  const [castingId, setCastingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Chat overlay
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const ch = supabase
      .channel(`comp-chat-unread-${competitionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competition_messages", filter: `competition_id=eq.${competitionId}` }, (payload: any) => {
        if (chatOpen) return;
        if (payload?.new?.user_id && payload.new.user_id === myUserId) return;
        setUnread(c => Math.min(99, c + 1));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [competitionId, chatOpen, myUserId]);
  useEffect(() => { if (chatOpen) setUnread(0); }, [chatOpen]);

  // Floating reactions (broadcast over realtime)
  const [floats, setFloats] = useState<FloatingReaction[]>([]);
  const [counts, setCounts] = useState<Record<ReactionId, number>>({ fire: 0, goat: 0, rotten: 0, dead: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const floatKey = useRef(0);

  // Reset counts when active edit changes
  useEffect(() => {
    setCounts({ fire: 0, goat: 0, rotten: 0, dead: 0 });
    setFloats([]);
  }, [currentIdx]);

  // Realtime broadcast for reactions — viral, ephemeral, no DB
  useEffect(() => {
    if (phase !== "watching") return;
    const channel = supabase.channel(`comp-reactions-${competitionId}`, { config: { broadcast: { self: true } } });
    channelRef.current = channel;
    channel.on("broadcast", { event: "reaction" }, (payload: any) => {
      const { id, idx } = payload?.payload || {};
      if (typeof id !== "string" || idx !== currentIdx) return;
      const def = REACTIONS.find(r => r.id === id);
      if (!def) return;
      setCounts(c => ({ ...c, [id]: c[id as ReactionId] + 1 }));
      const k = ++floatKey.current;
      setFloats(f => [...f, { key: k, emoji: def.emoji, x: 30 + Math.random() * 40 }]);
      setTimeout(() => setFloats(f => f.filter(it => it.key !== k)), 2200);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [competitionId, currentIdx, phase]);

  const fireReaction = (id: ReactionId) => {
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: { id, idx: currentIdx } });
  };

  const current = ordered[currentIdx];

  useEffect(() => {
    const v = videoRef.current;
    if (!v || phase !== "watching") return;
    v.muted = !audioUnlocked;
    v.volume = 1;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }, [audioUnlocked, current?.id, currentIdx, phase]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused]);

  // Synced ticker
  useEffect(() => {
    if (phase !== "watching" || !startMs) return;
    const tick = () => {
      const { idx, left, done } = compute();
      if (done) { setPhase(p => p === "watching" ? (myVoteSubmissionId ? "submitted" : "voting") : p); return; }
      setCurrentIdx(prev => prev !== idx ? idx : prev);
      setSecondsLeft(left);
    };
    tick();
    const i = setInterval(tick, 250);
    return () => clearInterval(i);
  }, [phase, startMs, ordered.length]);

  // Voting countdown
  const [voteSecs, setVoteSecs] = useState(0);
  useEffect(() => {
    if (!votingDeadline) return;
    const tick = () => setVoteSecs(Math.max(0, Math.ceil((new Date(votingDeadline).getTime() - Date.now()) / 1000)));
    tick();
    const i = setInterval(tick, 500);
    return () => clearInterval(i);
  }, [votingDeadline]);

  const handleVote = async (id: string) => {
    if (castingId) return;
    setCastingId(id);
    const ok = await onVote(id);
    setCastingId(null);
    if (ok) { setPhase("submitted"); toast.success("Vote locked in 🔥"); }
    else toast.error("Couldn't cast vote");
  };

  if (ordered.length === 0) return null;

  const progressPct = phase === "watching" ? ((PER_EDIT_SECONDS - secondsLeft) / PER_EDIT_SECONDS) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex flex-col overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Header */}
      <header className="shrink-0 px-3 pt-[env(safe-area-inset-top)] border-b border-white/[0.06] bg-black/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5 py-3">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white/80" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-white/40 leading-none" style={teko}>
              {phase === "watching" ? "Live Showcase" : phase === "voting" ? "Cast Your Vote" : "Live Tally"}
            </p>
            <p className="text-[15px] font-black uppercase tracking-tight text-white truncate leading-tight mt-0.5" style={teko}>
              {theme || competitionName}
            </p>
          </div>
          {phase === "watching" && (
            <div className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10">
              <span className="text-[13px] font-black text-amber-400 tabular-nums" style={teko}>{secondsLeft}s</span>
            </div>
          )}
          {phase !== "watching" && votingDeadline && voteSecs > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10">
              <span className="text-[13px] font-black text-amber-400 tabular-nums" style={teko}>
                {String(Math.floor(voteSecs / 60)).padStart(2, "0")}:{String(voteSecs % 60).padStart(2, "0")}
              </span>
            </div>
          )}
          <button
            onClick={() => setChatOpen(true)}
            className="relative w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center active:scale-95"
            aria-label="Open chat"
          >
            <MessageCircle className="w-4 h-4 text-white/80" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center tabular-nums" style={teko}>
                {unread}
              </span>
            )}
          </button>
        </div>
        {/* Segmented progress */}
        {phase === "watching" && (
          <div className="flex gap-1 pb-2">
            {ordered.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: i < currentIdx ? "100%" : i === currentIdx ? `${progressPct}%` : "0%", transitionDuration: i === currentIdx ? "1000ms" : "0ms" }} />
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto">
        {/* ─── WATCHING ─── */}
        {phase === "watching" && current && (
          <div className="h-full flex flex-col">
            {/* Player */}
            <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <StageMedia sub={current} videoRef={videoRef} />
                </motion.div>
              </AnimatePresence>

              {/* Top overlay — editor identity */}
              <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <Avatar className="w-9 h-9 border-2 border-white/30">
                    <AvatarImage src={current.avatar_url || ""} />
                    <AvatarFallback className="text-[11px] font-black bg-zinc-900 text-white">{current.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/50" style={teko}>Now Showing · {currentIdx + 1}/{ordered.length}</p>
                    <p className="text-[15px] font-black text-white leading-none" style={teko}>@{current.username}</p>
                  </div>
                </div>
              </div>

              {/* Floating reactions */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                  {floats.map(f => (
                    <motion.div
                      key={f.key}
                      initial={{ y: 0, opacity: 0, scale: 0.6 }}
                      animate={{ y: -260, opacity: [0, 1, 1, 0], scale: [0.6, 1.4, 1.2, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.2, ease: "easeOut" }}
                      className="absolute bottom-2 text-4xl"
                      style={{ left: `${f.x}%` }}
                    >
                      {f.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pause */}
              <button
                onClick={() => setPaused(p => !p)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
                aria-label={paused ? "Resume" : "Pause"}
              >
                {paused ? <Play className="w-4 h-4 text-white ml-0.5" /> : <Pause className="w-4 h-4 text-white" />}
              </button>
            </div>

            {/* Reaction bar */}
            <div className="shrink-0 px-3 py-3 border-t border-white/[0.06] bg-[#0A0A0A]">
              <div className="grid grid-cols-4 gap-2">
                {REACTIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => fireReaction(r.id)}
                    className={`relative flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-gradient-to-b ${r.color} active:scale-95 transition-transform shadow-lg overflow-hidden`}
                  >
                    <span className="text-2xl leading-none">{r.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white leading-none" style={teko}>{r.label}</span>
                    {counts[r.id] > 0 && (
                      <span className="absolute top-1 right-1.5 text-[10px] font-black text-white/95 tabular-nums leading-none" style={teko}>
                        {counts[r.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <CompetitionVoiceChat competitionId={competitionId} compact />
              </div>
            </div>
          </div>
        )}

        {/* ─── VOTING ─── */}
        {phase === "voting" && (
          <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-amber-400" style={teko}>Pick The Best</p>
              <h2 className="text-[34px] font-black uppercase tracking-tight leading-none text-white mt-1" style={teko}>Cast Your Vote</h2>
              <p className="text-[11px] text-white/45 mt-1.5">One vote — make it count. You can't vote for yourself.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {ordered.map((sub, i) => {
                const isSelf = sub.user_id === myUserId;
                const isMyVote = myVoteSubmissionId === sub.id;
                const isCasting = castingId === sub.id;
                return (
                  <button
                    key={sub.id}
                    disabled={isSelf || !!castingId}
                    onClick={() => handleVote(sub.id)}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97] ${
                      isMyVote ? "border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]"
                        : isSelf ? "border-white/[0.04] opacity-40 cursor-not-allowed"
                        : "border-white/[0.08] hover:border-amber-400/60"
                    }`}
                  >
                    <TileMedia sub={sub} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/80 border border-white/15 flex items-center justify-center">
                      <span className="text-[14px] font-black text-white leading-none" style={teko}>{i + 1}</span>
                    </div>
                    {isSelf && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 border border-white/15">
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-white/70" style={teko}>You</span>
                      </div>
                    )}
                    {isMyVote && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white/30 flex items-center justify-center">
                        {isCasting ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                      <Avatar className="w-5 h-5 border border-white/20">
                        <AvatarImage src={sub.avatar_url || ""} />
                        <AvatarFallback className="text-[8px] font-bold bg-zinc-900 text-white">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] font-bold text-white truncate" style={teko}>@{sub.username}</span>
                    </div>
                    {isCasting && !isMyVote && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SUBMITTED / TALLY ─── */}
        {phase === "submitted" && (() => {
          const sorted = [...submissions].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
          const totalVotes = sorted.reduce((s, x) => s + (x.vote_count || 0), 0);
          return (
            <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400" style={teko}>Vote Locked In</span>
                </div>
                <h2 className="text-[30px] font-black uppercase tracking-tight leading-none text-white mt-2" style={teko}>Live Tally</h2>
                <p className="text-[11px] text-white/45 mt-1">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far · winner reveals when timer hits 0</p>
              </div>
              <div className="space-y-1.5">
                {sorted.map((sub, i) => {
                  const votes = sub.vote_count || 0;
                  const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  const isMyVote = myVoteSubmissionId === sub.id;
                  const isLeader = i === 0 && votes > 0;
                  return (
                    <div key={sub.id} className={`relative rounded-xl border overflow-hidden ${isLeader ? "border-amber-400/40 bg-amber-400/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="absolute inset-y-0 left-0 transition-all" style={{ width: `${pct}%`, background: isLeader ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.05)" }} />
                      <div className="relative flex items-center gap-2.5 px-3 py-2.5">
                        <span className={`text-[22px] font-black w-6 text-center leading-none ${isLeader ? "text-amber-400" : "text-white/40"}`} style={teko}>{i + 1}</span>
                        <Avatar className={`w-9 h-9 border ${isLeader ? "border-amber-400/60" : "border-white/10"}`}>
                          <AvatarImage src={sub.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold bg-zinc-900 text-white">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-white truncate" style={teko}>@{sub.username}</span>
                            {isLeader && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {isMyVote && <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400" style={teko}>· Your Pick</span>}
                          </div>
                        </div>
                        <div className="text-right leading-none">
                          <span className="text-[18px] font-black text-white tabular-nums" style={teko}>{votes}</span>
                          <span className="text-[9px] text-white/40 ml-0.5" style={teko}>VOTE{votes !== 1 ? "S" : ""}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-2 text-white/30">
                <Trophy className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold" style={teko}>Reveal Inbound</span>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Chat slide-up sheet — keep talking shit / say GGs while showcase plays */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-[10]"
              onClick={() => setChatOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 z-[11] flex flex-col bg-[#0A0A0A] border-t border-white/[0.08] rounded-t-2xl overflow-hidden"
              style={{ height: "78%" }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-[13px] font-black uppercase tracking-[0.2em] text-white" style={teko}>Lobby Chat</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center active:scale-95">
                  <X className="w-4 h-4 text-white/80" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <CompetitionChat competitionId={competitionId} embedded />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}