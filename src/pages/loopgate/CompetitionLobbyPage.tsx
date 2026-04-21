import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Clock, Play, Loader2, Send,
  Share2, Check, MessageCircle, Layers, Pencil, X, ThumbsUp, Sparkles
} from "lucide-react";
import { useCompetition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow, isPast, differenceInSeconds } from "date-fns";
import { validatePlatformUrl, getPlatformUrlPlaceholder, detectPlatform, type PlatformType } from "@/lib/urlValidation";
import { useAutoplayVideo } from "@/hooks/useAutoplayVideo";
import CompetitionChat from "@/components/loopgate/CompetitionChat";
import CompetitionLeaderboard from "@/components/loopgate/CompetitionLeaderboard";

const teko = { fontFamily: "Teko, sans-serif" };

function LiveCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, differenceInSeconds(new Date(deadline), new Date())));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, differenceInSeconds(new Date(deadline), new Date()));
      setRemaining(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  if (remaining <= 0) return <span className="text-red-400 font-bold text-sm tracking-wider" style={teko}>TIME'S UP</span>;

  return (
    <div className="flex items-center gap-0.5">
      {h > 0 && (
        <>
          <span className="text-sm font-bold text-red-400 tabular-nums" style={teko}>{String(h).padStart(2, '0')}h</span>
          <span className="text-red-400/40 text-xs">:</span>
        </>
      )}
      <span className="text-sm font-bold text-red-400 tabular-nums" style={teko}>{String(m).padStart(2, '0')}m</span>
      <span className="text-red-400/40 text-xs">:</span>
      <span className="text-sm font-bold text-red-400 tabular-nums" style={teko}>{String(s).padStart(2, '0')}s</span>
    </div>
  );
}

export default function CompetitionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    competition, participants, submissions, loading,
    isCreator, hasJoined, hasSubmitted, hasUpvoted,
    join, start, submit, toggleUpvote, updateInspo,
  } = useCompetition(id);

  

  const [isStarting, setIsStarting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [subUrl, setSubUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInspoForm, setShowInspoForm] = useState(false);
  const [inspoUrl, setInspoUrl] = useState("");
  const [savingInspo, setSavingInspo] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inspoVideoRef = useAutoplayVideo(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">Competition not found</p>
        </div>
      </div>
    );
  }

  const isLobby = competition.status === "lobby";
  const isLive = competition.status === "live";
  const deadlinePassed = competition.deadline ? isPast(new Date(competition.deadline)) : false;
  const canSubmit = isLive && !deadlinePassed && hasJoined && !hasSubmitted;
  const canStart = isCreator && isLobby && competition.current_players >= 2;

  const handleJoin = async () => {
    if (!user) { navigate("/start"); return; }
    setIsJoining(true);
    const ok = await join();
    if (ok) toast.success("You're in!");
    else toast.error("Failed to join");
    setIsJoining(false);
  };

  const handleStart = async () => {
    setIsStarting(true);
    const ok = await start();
    if (ok) toast.success("Competition is LIVE!");
    else toast.error("Failed to start");
    setIsStarting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUrl.trim()) return;
    const validation = validatePlatformUrl(platform, subUrl);
    if (!validation.valid) { toast.error(validation.error || "Invalid URL"); return; }
    setIsSubmitting(true);
    const ok = await submit(subUrl.trim(), platform);
    if (ok) { toast.success("Edit submitted!"); setShowSubmit(false); setSubUrl(""); }
    else toast.error("Failed to submit");
    setIsSubmitting(false);
  };

  const handleShare = async () => {
    const cleanUrl = `${window.location.origin}/competition/${competition.slug || competition.id}`;
    const shareText = `🏆 ${competition.name}\n\n${competition.theme ? `Theme: ${competition.theme}\n` : ''}${competition.current_players}/${competition.max_players} editors competing${competition.index_reward_pool > 0 ? ` · +${competition.index_reward_pool} IDX reward` : ''}\n\nJoin the lobby 👇`;
    try {
      if (navigator.share) await navigator.share({ title: competition.name, text: shareText, url: cleanUrl });
      else {
        await navigator.clipboard.writeText(`${shareText}\n${cleanUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!");
      }
    } catch {}
  };

  const handleUpvote = async () => {
    if (!user) { navigate("/start"); return; }
    await toggleUpvote();
  };

  const handleSaveInspo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inspoUrl.trim();
    if (!trimmed) return;
    const detected = detectPlatform(trimmed);
    if (!detected) { toast.error("Use a TikTok, Instagram, or YouTube link"); return; }
    const validation = validatePlatformUrl(detected, trimmed);
    if (!validation.valid) { toast.error(validation.error || "Invalid URL"); return; }
    setSavingInspo(true);
    const ok = await updateInspo({ url: trimmed, platform: detected });
    if (ok) { toast.success("Inspo edit added!"); setShowInspoForm(false); setInspoUrl(""); }
    else toast.error("Failed to save");
    setSavingInspo(false);
  };

  // Detect if inspo URL is a direct video file (mp4/webm) — then we can autoplay inline.
  const inspoIsDirectVideo = useMemo(() => {
    const u = competition?.inspo_video_url || "";
    return /\.(mp4|webm|mov)(\?|$)/i.test(u);
  }, [competition?.inspo_video_url]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden">
        {competition.inspo_video_url && inspoIsDirectVideo ? (
          <video
            ref={inspoVideoRef}
            src={competition.inspo_video_url}
            poster={competition.inspo_thumbnail_url || competition.cover_image_url || undefined}
            className="w-full h-52 object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : competition.cover_image_url ? (
          <img src={competition.cover_image_url} alt="" className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-white/[0.03] via-surface-2 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Nav */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/50 backdrop-blur-sm rounded-full">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-2.5 h-8 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
                hasUpvoted
                  ? "bg-emerald-500/90 text-white"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
              aria-label="Upvote"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-current" : ""}`} />
              <span className="text-[11px] font-bold tabular-nums" style={teko}>
                {competition.upvote_count || 0}
              </span>
            </button>
            <button onClick={handleShare} className="p-2 bg-black/50 backdrop-blur-sm rounded-full">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1.5">
            {/* League */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black/50 backdrop-blur-sm border border-white/[0.12] rounded">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/80" style={teko}>
                {competition.league === "elite" ? "ELITE" : competition.league === "pro" ? "PRO" : "OPEN"} LEAGUE
              </span>
            </div>
            {/* Status — no green badge, just subtle amber/white text */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/[0.08]">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? "bg-red-500" : "bg-amber-400"}`} />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/70" style={teko}>
                {isLobby ? "AWAITING START" : isLive ? "IN PROGRESS" : competition.status.toUpperCase()}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wide leading-none" style={teko}>
            {competition.name}
          </h1>
        </div>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {/* ═══ HOST + META ═══ */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(`/u/${competition.creator_username}`)} className="flex items-center gap-2 group">
            <Avatar className="w-7 h-7 border border-white/20">
              <AvatarImage src={competition.creator_avatar_url || ""} />
              <AvatarFallback className="text-[9px] bg-surface-1 text-foreground font-bold">
                {competition.creator_username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-bold text-foreground group-hover:underline">@{competition.creator_username}</span>
              <span className="text-[10px] text-muted-foreground/50 ml-1.5">Host</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            {isLive && competition.deadline && !deadlinePassed && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-red-400" />
                <LiveCountdown deadline={competition.deadline} />
              </div>
            )}
            {competition.index_reward_pool > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
                <Trophy className="w-3 h-3" /> +{competition.index_reward_pool} IDX
              </span>
            )}
          </div>
        </div>

        {/* ═══ THEME — simple inline text, no box ═══ */}
        {(competition.theme || competition.description) && (
          <div className="flex items-start gap-2 px-1">
            <Layers className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
            <div>
              {competition.theme && <p className="text-sm font-bold text-foreground">{competition.theme}</p>}
              {competition.description && <p className="text-xs text-muted-foreground/50 mt-0.5">{competition.description}</p>}
            </div>
          </div>
        )}

        {/* ═══ INSPO EDIT — embedded player (when not a direct video) ═══ */}
        {competition.inspo_video_url && !inspoIsDirectVideo && (
          <a
            href={competition.inspo_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative rounded-xl overflow-hidden border border-white/[0.08] bg-surface-2 group"
          >
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {competition.inspo_thumbnail_url ? (
                <img src={competition.inspo_thumbnail_url} alt="Inspo edit" className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-8 h-8 text-white/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90" style={teko}>Inspo Edit</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-white/60">{competition.inspo_video_platform}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-active:opacity-100">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
          </a>
        )}

        {/* ═══ ADD INSPO EDIT — creator only, when none set ═══ */}
        {isCreator && !competition.inspo_video_url && !showInspoForm && (
          <button
            onClick={() => setShowInspoForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/70" style={teko}>
              Add Inspo Edit
            </span>
          </button>
        )}

        {isCreator && showInspoForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleSaveInspo}
            className="space-y-2"
          >
            <p className="text-[10px] text-muted-foreground/60 px-1">
              Drop a TikTok / Instagram / YouTube link to inspire editors. It'll autoplay in your lobby.
            </p>
            <input
              value={inspoUrl}
              onChange={e => setInspoUrl(e.target.value)}
              placeholder="https://tiktok.com/..."
              className="w-full bg-surface-2 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-amber-400/40"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowInspoForm(false); setInspoUrl(""); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-muted-foreground bg-surface-2 border border-white/[0.06]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingInspo || !inspoUrl.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                {savingInspo ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Save Inspo"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ═══ GO EDIT — visible when live + joined + hasn't submitted ═══ */}
        {isLive && hasJoined && !hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-[0.2em]" style={teko}>ROUND IS OPEN</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (competition.theme) params.set("theme", competition.theme);
                  if (competition.description) params.set("instructions", competition.description);
                  if (competition.id) params.set("comp_id", competition.id);
                  navigate(`/studio?${params.toString()}`);
                }}
                className="flex-[2] py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  boxShadow: "0 4px 24px rgba(239,68,68,0.25)",
                  ...teko,
                }}
              >
                <Pencil className="w-5 h-5" />
                <span className="text-[18px] font-extrabold uppercase tracking-[0.15em]">GO EDIT</span>
              </button>
              <button
                onClick={() => setShowSubmit(true)}
                className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(142 76% 36%))",
                  color: "#fff",
                  boxShadow: "0 4px 24px rgba(34,197,94,0.25)",
                  ...teko,
                }}
              >
                <Send className="w-4 h-4" />
                <span className="text-[14px] font-extrabold uppercase tracking-[0.1em]">SUBMIT</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/30 text-center">Use any editing software you like (CapCut, Adobe, etc.) — submit your link when ready</p>
          </motion.div>
        )}

        {/* ═══ PRIMARY ACTION ═══ */}
        {isCreator && isLobby && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                background: canStart ? "linear-gradient(135deg, #10B981, #059669)" : "rgba(255,255,255,0.04)",
                color: canStart ? "#fff" : "rgba(255,255,255,0.3)",
                boxShadow: canStart ? "0 4px 24px rgba(16,185,129,0.3)" : "none",
                ...teko,
              }}
            >
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="text-[16px] font-extrabold uppercase tracking-[0.15em]">
                    {canStart ? "START COMPETITION" : `NEED ${2 - competition.current_players} MORE TO START`}
                  </span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {!hasJoined && !isCreator && (isLobby || isLive) && (
          <button
            onClick={handleJoin}
            disabled={isJoining || competition.current_players >= competition.max_players}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(16,185,129,0.3)",
              ...teko,
            }}
          >
            {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-[16px] font-extrabold uppercase tracking-[0.15em]">
                  {isLobby ? "JOIN LOBBY" : "JOIN COMPETITION"}
                </span>
              </>
            )}
          </button>
        )}

        {hasSubmitted && (
          <div className="text-center py-2">
            <span className="text-xs font-bold text-emerald-400">✓ Edit Submitted</span>
          </div>
        )}

        {/* Submit form */}
        {showSubmit && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div className="flex gap-2">
              {(["tiktok", "instagram", "youtube"] as PlatformType[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase transition-all border ${
                    platform === p
                      ? "bg-white/10 border-white/20 text-foreground"
                      : "bg-surface-2 border-white/[0.06] text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              value={subUrl}
              onChange={e => setSubUrl(e.target.value)}
              placeholder={getPlatformUrlPlaceholder(platform)}
              className="w-full bg-surface-2 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-red-500/40"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSubmit(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-muted-foreground bg-surface-2 border border-white/[0.06]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !subUrl.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Submit"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ═══ QUICK ACTIONS — borderless ═══ */}
        <div className="flex gap-2">
          <button
            onClick={() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider" style={teko}>Chat</span>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider" style={teko}>
              {participants.length} Editor{participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ═══ LEADERBOARD ═══ */}
        <CompetitionLeaderboard submissions={submissions} />

        {/* ═══ EDITORS ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
              Editors ({participants.length})
            </span>
          </div>
          {participants.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center py-3">No editors yet — be the first</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {participants.map(p => (
                <button key={p.id} onClick={() => navigate(`/u/${p.username}`)} className="flex flex-col items-center gap-1 group">
                  <Avatar className="w-10 h-10 border border-white/10 group-hover:border-white/30 transition-all">
                    <AvatarImage src={p.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] bg-surface-1 text-foreground font-bold">
                      {p.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] text-muted-foreground/60 group-hover:text-foreground truncate max-w-[48px] text-center transition-colors">
                    {p.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ LIVE CHAT ═══ */}
        <div ref={chatRef}>
          <CompetitionChat competitionId={competition.id} />
        </div>
      </div>
    </div>
  );
}
