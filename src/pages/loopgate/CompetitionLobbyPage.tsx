import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Clock, Play, Loader2, Send, Music,
  Gavel, Vote, Share2, Copy, Check, ChevronRight
} from "lucide-react";
import { useCompetition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";
import { validatePlatformUrl, getPlatformUrlPlaceholder, type PlatformType } from "@/lib/urlValidation";

const teko = { fontFamily: "Teko, sans-serif" };

export default function CompetitionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    competition, participants, submissions, loading,
    isCreator, hasJoined, hasSubmitted,
    join, start, submit, refetch,
  } = useCompetition(id);

  const [isStarting, setIsStarting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [subUrl, setSubUrl] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("tiktok");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
    if (ok) toast.success("🏆 You're in the lobby!");
    else toast.error("Failed to join");
    setIsJoining(false);
  };

  const handleStart = async () => {
    setIsStarting(true);
    const ok = await start();
    if (ok) toast.success("🚀 Competition is LIVE!");
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
    if (ok) { toast.success("🎬 Edit submitted!"); setShowSubmit(false); setSubUrl(""); }
    else toast.error("Failed to submit");
    setIsSubmitting(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/competition/${competition.slug || competition.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: competition.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!");
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {competition.cover_image_url ? (
          <img src={competition.cover_image_url} alt="" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-white/[0.03] via-surface-2 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/40 backdrop-blur-sm rounded-full">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={handleShare} className="p-2 bg-black/40 backdrop-blur-sm rounded-full">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            {/* League badge */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border backdrop-blur-sm ${
              competition.league === "elite" ? "border-amber-400/20 bg-amber-500/[0.06] text-amber-300"
              : competition.league === "pro" ? "border-blue-400/20 bg-blue-500/[0.06] text-blue-300"
              : "border-white/[0.12] bg-white/[0.04] text-white/70"
            }`}>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em]">{competition.league}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm border border-white/[0.06] rounded">
              {competition.scoring_mode === "judged" ? <Gavel className="w-2.5 h-2.5 text-white/50" /> : <Vote className="w-2.5 h-2.5 text-white/50" />}
              <span className="text-[8px] font-bold uppercase text-white/50">{competition.scoring_mode}</span>
            </div>
            {/* Status */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
              isLobby ? "bg-amber-500/20 text-amber-300 border border-amber-500/20"
              : isLive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
              : "bg-white/10 text-white/50 border border-white/10"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLobby ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`} />
              {competition.status}
            </div>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide" style={teko}>
            {competition.name}
          </h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Creator + meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 border border-white/20">
              <AvatarImage src={competition.creator_avatar_url || ""} />
              <AvatarFallback className="text-[9px] bg-surface-1 text-foreground font-bold">
                {competition.creator_username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-bold text-foreground">@{competition.creator_username}</span>
              <span className="text-[10px] text-muted-foreground ml-2">Host</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {competition.index_reward_pool > 0 && (
              <span className="flex items-center gap-1 font-bold text-gold">
                <Trophy className="w-3 h-3" /> +{competition.index_reward_pool} IDX
              </span>
            )}
          </div>
        </div>

        {/* Description / Theme */}
        {(competition.description || competition.theme) && (
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-3 space-y-1.5">
            {competition.theme && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Music className="w-3.5 h-3.5" /> {competition.theme}
              </div>
            )}
            {competition.description && (
              <p className="text-xs text-muted-foreground/80">{competition.description}</p>
            )}
          </div>
        )}

        {/* ── HOST CONTROLS (Lobby) ── */}
        {isCreator && isLobby && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-1 border border-amber-500/20 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-foreground">{competition.current_players} editor{competition.current_players !== 1 ? "s" : ""} in lobby</span>
            </div>
            <button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:from-emerald-400 hover:to-emerald-500"
              style={{ boxShadow: "0 2px 16px rgba(16,185,129,0.3)" }}
            >
              {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Play className="w-4 h-4" />
                  {canStart ? "Start Competition" : `Need ${2 - competition.current_players} more`}
                </>
              )}
            </button>
            {canStart && (
              <p className="text-[10px] text-muted-foreground text-center">Opens submissions for 24 hours</p>
            )}
          </motion.div>
        )}

        {/* ── JOIN BUTTON ── */}
        {!hasJoined && !isCreator && (isLobby || isLive) && (
          <button
            onClick={handleJoin}
            disabled={isJoining || competition.current_players >= competition.max_players}
            className="w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-[0.12em] flex items-center justify-center gap-2 bg-white text-black font-bold hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ boxShadow: "0 2px 12px rgba(255,255,255,0.08)" }}
          >
            {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><Play className="w-4 h-4" /> {isLobby ? "Join Lobby" : "Join Competition"}</>
            )}
          </button>
        )}

        {/* ── SUBMIT BUTTON ── */}
        {canSubmit && !showSubmit && (
          <button
            onClick={() => setShowSubmit(true)}
            className="w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-[0.12em] flex items-center justify-center gap-2 bg-gradient-to-r from-gold/80 to-amber-500/80 text-black font-bold hover:from-gold hover:to-amber-500 transition-all"
            style={{ boxShadow: "0 4px 20px rgba(212,175,55,0.2)" }}
          >
            <Send className="w-4 h-4" /> Submit Your Edit
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
              className="w-full bg-surface-2 border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSubmit(false)} className="flex-1 py-2.5 rounded-lg text-xs font-bold text-muted-foreground bg-surface-2 border border-white/[0.06]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !subUrl.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-white text-black disabled:opacity-30"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Submit"}
              </button>
            </div>
          </motion.form>
        )}

        {/* ── PARTICIPANTS ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Editors ({participants.length})
              </span>
            </div>
            {competition.deadline && isLive && !deadlinePassed && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(competition.deadline), { addSuffix: true })}
              </span>
            )}
          </div>

          {participants.length === 0 ? (
            <div className="bg-surface-1 border border-dashed border-white/[0.06] rounded-xl p-6 text-center">
              <p className="text-xs text-muted-foreground">No editors yet — be the first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarImage src={p.avatar_url || ""} />
                    <AvatarFallback className="text-[10px] bg-surface-1 text-foreground font-bold">
                      {p.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                    {p.username}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SUBMISSIONS / LEADERBOARD ── */}
        {submissions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Submissions ({submissions.length})
              </span>
            </div>
            <div className="space-y-2">
              {submissions
                .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                .map((sub, i) => (
                <div key={sub.id} className="bg-surface-1 border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                  <span className="text-lg font-black text-muted-foreground/30 w-6 text-center tabular-nums" style={teko}>
                    {i + 1}
                  </span>
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={sub.avatar_url || ""} />
                    <AvatarFallback className="text-[9px] bg-surface-2 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground">{sub.username}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{sub.platform}</span>
                      {sub.score !== null && (
                        <span className="text-[10px] font-bold text-gold">QOI {sub.score}</span>
                      )}
                    </div>
                  </div>
                  {sub.is_winner && (
                    <div className="text-xs font-bold text-gold">🏆 #{sub.winner_place}</div>
                  )}
                  <a
                    href={sub.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] font-bold text-foreground/60 hover:text-foreground"
                  >
                    Watch →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
