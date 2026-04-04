import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Clock, Play, Loader2, Send,
  Share2, Check, MessageCircle, ExternalLink
} from "lucide-react";
import { useCompetition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";
import CompetitionChat from "@/components/loopgate/CompetitionChat";

const teko = { fontFamily: "Teko, sans-serif" };

export default function CompetitionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    competition, participants, submissions, loading,
    isCreator, hasJoined, hasSubmitted,
    join, start, submit,
  } = useCompetition(id);

  const [isStarting, setIsStarting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [subUrl, setSubUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

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
    const url = `${window.location.origin}/competition/${competition.slug || competition.id}`;
    try {
      if (navigator.share) await navigator.share({ title: competition.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ═══ HERO ═══ */}
      <div className="relative overflow-hidden">
        {competition.cover_image_url ? (
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
          <button onClick={handleShare} className="p-2 bg-black/50 backdrop-blur-sm rounded-full">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1.5">
            {/* League */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-black/50 backdrop-blur-sm border border-white/[0.12] rounded">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/80" style={teko}>
                {competition.league === "elite" ? "ELITE" : competition.league === "pro" ? "PRO" : "OPEN"} LEAGUE
              </span>
            </div>
            {/* Status */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${
              isLive ? "bg-emerald-500/20 border border-emerald-500/20" : "bg-amber-500/20 border border-amber-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${isLive ? "text-emerald-300" : "text-amber-300"}`} style={teko}>
                {isLobby ? "Awaiting Start" : isLive ? "Live" : competition.status}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wide leading-none" style={teko}>
            {competition.name}
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
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
            {competition.deadline && isLive && !deadlinePassed && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(competition.deadline), { addSuffix: true })}
              </span>
            )}
            {competition.index_reward_pool > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
                <Trophy className="w-3 h-3" /> +{competition.index_reward_pool} IDX
              </span>
            )}
          </div>
        </div>

        {/* ═══ THEME / DESCRIPTION ═══ */}
        {(competition.theme || competition.description) && (
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-3.5">
            {competition.theme && (
              <p className="text-sm font-bold text-foreground mb-1">{competition.theme}</p>
            )}
            {competition.description && (
              <p className="text-xs text-muted-foreground/60">{competition.description}</p>
            )}
          </div>
        )}

        {/* ═══ PRIMARY ACTION ═══ */}
        {/* Host: Start button */}
        {isCreator && isLobby && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
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

        {/* Join */}
        {!hasJoined && !isCreator && (isLobby || isLive) && (
          <button
            onClick={handleJoin}
            disabled={isJoining || competition.current_players >= competition.max_players}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
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

        {/* Submit */}
        {canSubmit && !showSubmit && (
          <button
            onClick={() => setShowSubmit(true)}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(239,68,68,0.25)",
              ...teko,
            }}
          >
            <Send className="w-4 h-4" />
            <span className="text-[16px] font-extrabold uppercase tracking-[0.15em]">SUBMIT YOUR EDIT</span>
          </button>
        )}

        {hasSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <span className="text-xs font-bold text-emerald-400">✓ Edit Submitted</span>
          </div>
        )}

        {/* Submit form */}
        {showSubmit && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleSubmit}
            className="bg-surface-1 border border-white/[0.06] rounded-xl p-4 space-y-3"
          >
            <div className="flex gap-2">
              {(["tiktok", "instagram", "youtube"] as PlatformType[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all border ${
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
              className="w-full bg-surface-2 border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-red-500/40"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSubmit(false)} className="flex-1 py-2.5 rounded-lg text-xs font-bold text-muted-foreground bg-surface-2 border border-white/[0.06]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !subUrl.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-all"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Submit"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ═══ QUICK ACTIONS BAR ═══ */}
        <div className="flex gap-2">
          <button
            onClick={() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-1 border border-white/[0.06] rounded-xl hover:border-red-500/20 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider" style={teko}>Chat</span>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface-1 border border-white/[0.06] rounded-xl">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider" style={teko}>
              {participants.length} Editor{participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ═══ LEADERBOARD / SUBMISSIONS ═══ */}
        {submissions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
                Leaderboard
              </span>
            </div>
            <div className="space-y-1.5">
              {submissions
                .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                .map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-1 border border-white/[0.06] rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-2xl font-black text-muted-foreground/20 w-7 text-center" style={teko}>
                    {i + 1}
                  </span>
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={sub.avatar_url || ""} />
                    <AvatarFallback className="text-[9px] bg-surface-2 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground">{sub.username}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50 uppercase">{sub.platform}</span>
                      {sub.score !== null && (
                        <span className="text-[10px] font-bold text-gold">QOI {sub.score}</span>
                      )}
                    </div>
                  </div>
                  {sub.is_winner && (
                    <span className="text-xs font-bold text-gold">🏆</span>
                  )}
                  <a
                    href={sub.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground/50 hover:text-foreground transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EDITORS ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
              Editors ({participants.length})
            </span>
          </div>
          {participants.length === 0 ? (
            <div className="bg-surface-1 border border-dashed border-white/[0.06] rounded-xl p-6 text-center">
              <p className="text-xs text-muted-foreground/40">No editors yet — be the first</p>
            </div>
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
