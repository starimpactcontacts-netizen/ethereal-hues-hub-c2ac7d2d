import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Clock, Play, Loader2,
  Share2, Check, MessageCircle, Layers, Pencil, X, ThumbsUp, Sparkles, Upload, Volume2, VolumeX, CheckCircle2, Circle, LogOut, Crown, Info, Timer, Vote, Gavel, Trash2, Copy
} from "lucide-react";
import { useCompetition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { isPast, differenceInSeconds } from "date-fns";
import { useAutoplayVideo } from "@/hooks/useAutoplayVideo";
import { supabase } from "@/integrations/supabase/client";
import CompetitionChat from "@/components/loopgate/CompetitionChat";
import CompetitionLeaderboard from "@/components/loopgate/CompetitionLeaderboard";
import CompetitionVoting from "@/components/loopgate/CompetitionVoting";
import CompetitionWinnerCard from "@/components/loopgate/CompetitionWinnerCard";
import { setLobbyMusicActive, useLobbyMusicMute } from "@/components/loopgate/LobbyMusicPlayer";
import ThemeRevealModal, { pickAutoTheme } from "@/components/loopgate/ThemeRevealModal";
import { LobbyDefaultCover } from "@/components/loopgate/LobbyDefaultCover";
import CompetitionVoiceChat from "@/components/loopgate/CompetitionVoiceChat";
import CompetitionSpeedLeaderboard from "@/components/loopgate/CompetitionSpeedLeaderboard";
import RobloxLiveCanvas from "@/components/loopgate/RobloxLiveCanvas";
import CompetitionShowcaseStage from "@/components/loopgate/CompetitionShowcaseStage";

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

function LiveCountdownSky({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, differenceInSeconds(new Date(deadline), new Date())));
  useEffect(() => {
    const i = setInterval(() => setRemaining(Math.max(0, differenceInSeconds(new Date(deadline), new Date()))), 1000);
    return () => clearInterval(i);
  }, [deadline]);
  if (remaining <= 0) return <span className="text-red-500 text-sm font-black tracking-wider" style={teko}>0:00</span>;
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const txt = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return <span className="text-sky-500 text-base font-black tracking-wider tabular-nums" style={teko}>{txt}</span>;
}

function VoteWindowCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, differenceInSeconds(new Date(deadline), new Date())));
  useEffect(() => {
    const i = setInterval(() => {
      setRemaining(Math.max(0, differenceInSeconds(new Date(deadline), new Date())));
    }, 500);
    return () => clearInterval(i);
  }, [deadline]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <span className="tabular-nums text-amber-400 font-black" style={teko}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function CompetitionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    competition, participants, submissions, loading,
    isCreator, hasJoined, hasSubmitted, hasUpvoted, isReady, readyCount,
    myVoteSubmissionId,
    join, joinWithCode, submit, toggleUpvote, updateInspo, toggleReady, leave, kick,
    startVoting, castVote, finalizeVoting,
  } = useCompetition(id);

  

  const [isJoining, setIsJoining] = useState(false);
  const [isReadying, setIsReadying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [musicMuted, toggleMusicMuted] = useLobbyMusicMute();
  const [lobbyTab, setLobbyTab] = useState<"members" | "chat">("members");
  const [chatMessageCount, setChatMessageCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoTrimId, setAutoTrimId] = useState<string | null>(null);
  const [showInspoForm, setShowInspoForm] = useState(false);
  const [savingInspo, setSavingInspo] = useState(false);
  const inspoFileInputRef = useRef<HTMLInputElement>(null);
  const submitFileInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inspoVideoRef = useAutoplayVideo(true);
  const [inspoMuted, setInspoMuted] = useState(true);
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [showThemeReveal, setShowThemeReveal] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const themeRevealedRef = useRef<string | null>(null);
  const [infoIdx, setInfoIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setInfoIdx((i) => i + 1), 3800);
    return () => clearInterval(id);
  }, []);
  // Tick once per second during the live showcase so the leaderboard reveals
  // exactly when the synchronized 15s/edit playback ends — no waiting on poll.
  const [phaseNow, setPhaseNow] = useState(() => Date.now());
  useEffect(() => {
    if (competition?.status !== "voting") return;
    const i = setInterval(() => setPhaseNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [competition?.status]);

  // Chat counter + unread badge — fetches initial total and listens for new messages.
  // Unread increments only when the chat tab isn't visible; resets when user opens chat.
  // IMPORTANT: must use the resolved competition UUID (id param can be a slug).
  const competitionId = competition?.id;
  useEffect(() => {
    if (!competitionId) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('competition_messages' as any)
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competitionId);
      if (!cancelled && typeof count === 'number') setChatMessageCount(count);
    })();
    const channel = supabase
      .channel(`comp-chat-count-${competitionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'competition_messages',
        filter: `competition_id=eq.${competitionId}`,
      }, (payload: any) => {
        setChatMessageCount(c => c + 1);
        const isSystem = payload?.new?.is_system;
        if (!isSystem) {
          setChatUnread(prev => (lobbyTabRef.current === 'chat' ? 0 : prev + 1));
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [competitionId]);

  // Mirror lobbyTab in a ref so the realtime callback always sees the latest value.
  const lobbyTabRef = useRef<"members" | "chat">("members");
  useEffect(() => {
    lobbyTabRef.current = lobbyTab;
    if (lobbyTab === "chat") setChatUnread(0);
  }, [lobbyTab]);

  const toggleInspoMute = () => {
    const v = inspoVideoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      v.play().catch(() => {});
    }
    setInspoMuted(next);
  };

  // Detect if inspo URL is a direct video file (mp4/webm) — then we can autoplay inline.
  // MUST be declared before any early return to keep hook order stable.
  const inspoIsDirectVideo = useMemo(() => {
    const u = competition?.inspo_video_url || "";
    const p = competition?.inspo_video_platform || "";
    // Platform "upload" = uploaded video. Also fallback to extension sniff.
    return p === "upload" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
  }, [competition?.inspo_video_url, competition?.inspo_video_platform]);

  // Lobby music: only while we're actually waiting in the lobby. The moment the
  // host starts the comp (status flips to live/voting/completed), kill the music.
  useEffect(() => {
    const inLobby = competition?.status === "lobby";
    setLobbyMusicActive(inLobby);
    return () => setLobbyMusicActive(false);
  }, [competition?.status]);

  // Theme reveal — fires the moment the host transitions lobby → live.
  // Only show once per competition load; auto-dismisses inside the modal.
  useEffect(() => {
    if (!competition) return;
    const prev = prevStatusRef.current;
    const curr = competition.status;
    // First load: if we mount directly into "live" within ~30s of start, also reveal.
    if (prev === null) {
      prevStatusRef.current = curr;
      if (curr === "live" && competition.started_at) {
        const startedMs = new Date(competition.started_at).getTime();
        if (Date.now() - startedMs < 30_000 && themeRevealedRef.current !== competition.id) {
          themeRevealedRef.current = competition.id;
          setShowThemeReveal(true);
        }
      }
      return;
    }
    if (prev === "lobby" && curr === "live" && themeRevealedRef.current !== competition.id) {
      themeRevealedRef.current = competition.id;
      setShowThemeReveal(true);
    }
    prevStatusRef.current = curr;
  }, [competition?.status, competition?.id, competition?.started_at]);

  // Auto-transition: when the edit window closes, flip live → voting (creator triggers it,
  // any viewer triggers as fallback so it never gets stuck).
  useEffect(() => {
    if (!competition) return;
    if (competition.status !== "live") return;
    if (!competition.deadline) return;
    const deadlineMs = new Date(competition.deadline).getTime();
    const tick = () => {
      if (Date.now() >= deadlineMs && competition.status === "live") {
        startVoting();
      }
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [competition?.status, competition?.deadline]);

  // Auto-transition early when every editor has submitted — voting/leaderboard starts after edits are in.
  useEffect(() => {
    if (!competition || competition.status !== "live") return;
    if (participants.length === 0) return;
    const submittedUserIds = new Set(submissions.map((submission) => submission.user_id));
    const everyoneSubmitted = participants.every((participant) => submittedUserIds.has(participant.user_id));
    if (everyoneSubmitted) startVoting();
  }, [competition?.status, participants, submissions]);

  const votingStartedAt = (competition as any)?.voting_started_at as string | null | undefined;
  const votingDeadline = (competition as any)?.voting_deadline as string | null | undefined;
  const showcaseMs = submissions.length * 30 * 1000;
  const showcaseEndsAt = votingStartedAt ? new Date(votingStartedAt).getTime() + showcaseMs : null;
  const votingDeadlineMs = votingDeadline ? new Date(votingDeadline).getTime() : null;
  const showcaseDone = competition?.status === "voting" && showcaseEndsAt !== null && phaseNow >= showcaseEndsAt;
  const votingWindowOpen = competition?.status === "voting" && submissions.length > 0 && showcaseDone && votingDeadlineMs !== null && phaseNow < votingDeadlineMs;

  // Auto-finalize only after the full showcase. Flow is always:
  // 15s per edit → 3-minute voting modal → reveal when all votes are in or timer hits 0.
  useEffect(() => {
    if (!competition || competition.status !== "voting") return;
    if (submissions.length === 0) {
      finalizeVoting();
      return;
    }

    if (!showcaseDone) return;

    // Single submission → winner only after its 15s showcase has played.
    if (submissions.length === 1) {
      finalizeVoting();
      return;
    }

    const totalVotes = submissions.reduce((sum, s) => sum + (s.vote_count || 0), 0);
    const eligibleVoterCount = submissions.length; // each submitter votes once (not for self, but for someone)
    if (totalVotes >= eligibleVoterCount) {
      finalizeVoting();
      return;
    }

    if (votingDeadlineMs !== null && phaseNow >= votingDeadlineMs) {
      finalizeVoting();
      return;
    }

    if (votingDeadlineMs !== null) {
      const timeout = window.setTimeout(() => finalizeVoting(), Math.max(0, votingDeadlineMs - Date.now()) + 250);
      return () => window.clearTimeout(timeout);
    }
  }, [competition?.status, submissions, showcaseDone, votingDeadlineMs, phaseNow]);

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
  const isVoting = competition.status === "voting";
  const isCompleted = competition.status === "completed";

  // ═══ Full-screen Showcase Stage — owns the entire voting flow ═══
  // Renders showcase → vote → live tally as an immersive overlay so the lobby
  // page is no longer a stack-of-everything. Mount as early as possible (before
  // the lobby/live early-returns can hide it).
  const showcaseStage = isVoting && submissions.length > 0 && votingStartedAt ? (
    <CompetitionShowcaseStage
      competitionId={competition.id}
      competitionName={competition.name}
      theme={resolvedTheme.theme}
      submissions={submissions}
      myUserId={user?.id}
      myVoteSubmissionId={myVoteSubmissionId}
      votingStartedAt={votingStartedAt}
      votingDeadline={votingDeadline}
      onVote={castVote}
      onClose={() => navigate("/arena")}
    />
  ) : null;

  // Resolve theme for the reveal modal — fall back to auto-generated if host left it blank.
  const hostTheme = (competition.theme || "").trim();
  const resolvedTheme = hostTheme
    ? { theme: hostTheme, info: competition.description || "Show what you got. Make every frame count.", auto: false }
    : { ...pickAutoTheme(competition.id), auto: true };
  const deadlinePassed = competition.deadline ? isPast(new Date(competition.deadline)) : false;
  const canSubmit = isLive && !deadlinePassed && hasJoined && !hasSubmitted;
  const submittedEditorCount = submissions.length;
  const totalEditorCount = participants.length || competition.current_players || competition.max_players;

  const handleJoin = async () => {
    if (!user) { navigate("/start"); return; }
    // Private rooms — prompt for code unless host.
    // Detect private via either flag or presence of a join_code so the modal
    // still opens if the `is_private` field is missing from the payload.
    const looksPrivate = !!(competition?.is_private || (competition as any)?.join_code);
    if (looksPrivate && competition?.creator_id !== user.id) {
      setJoinCodeError(null);
      setJoinCodeInput("");
      setShowJoinCode(true);
      return;
    }
    setIsJoining(true);
    const ok = await join();
    if (ok) toast.success("You're in!");
    else toast.error("Failed to join — if this is a private lobby, tap 'Have a code?' below.");
    setIsJoining(false);
  };

  const submitJoinCode = async () => {
    const code = joinCodeInput.replace(/\s+/g, "").toUpperCase();
    if (!code) { setJoinCodeError("Enter the code"); return; }
    setIsJoining(true);
    setJoinCodeError(null);
    const res = await joinWithCode(code);
    setIsJoining(false);
    if (res.ok) {
      setShowJoinCode(false);
      toast.success("You're in!");
    } else if (res.error === "invalid_code") {
      setJoinCodeError("Wrong code — double-check with the host.");
    } else if (res.error === "full") {
      setJoinCodeError("This lobby is full.");
    } else if (res.error === "closed") {
      setJoinCodeError("This lobby is no longer accepting players.");
    } else if (res.error === "not_authenticated") {
      setJoinCodeError("You need to sign in first.");
    } else {
      setJoinCodeError(res.error || "Couldn't join. Try again.");
    }
  };

  const handleReady = async () => {
    if (!user) { navigate("/start"); return; }
    setIsReadying(true);
    const ok = await toggleReady();
    if (!ok) toast.error("Couldn't update ready state");
    setIsReadying(false);
  };

  const handleLeave = async () => {
    if (!user) return;
    setIsLeaving(true);
    const ok = await leave();
    if (ok) { toast.success("Left the lobby"); navigate("/arena"); }
    else { toast.error("Couldn't leave"); setIsLeaving(false); }
  };

  const handleDeleteRoom = async () => {
    if (!competition || !isCreator) return;
    if (!window.confirm("Delete this room? This can't be undone.")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("competitions").delete().eq("id", competition.id);
    if (error) {
      toast.error("Couldn't delete room");
      setIsDeleting(false);
      return;
    }
    toast.success("Room deleted");
    navigate("/arena");
  };

  const uploadSubmissionFile = async (file: File) => {
    if (!user || !profile || !competition) { navigate("/start"); return; }
    if (!canSubmit) return;
    if (file.size > 500 * 1024 * 1024) { toast.error("Keep uploads under 500MB"); return; }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Upload a video or photo edit"); return; }

    setIsSubmitting(true);
    try {
      const rawExt = file.name.split(".").pop()?.toLowerCase();
      const ext = rawExt || (isVideo ? "mp4" : "jpg");
      const path = `${user.id}/competition-submissions/${competition.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("loop-media")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("loop-media").getPublicUrl(path);
      const newId = await submit(urlData.publicUrl, isVideo ? "upload" : "image");
      if (newId) {
        toast.success("Edit uploaded!");
        if (isVideo) setAutoTrimId(newId);
      } else {
        toast.error("Failed to submit");
      }
    } catch (err: any) {
      console.error("Submission upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
      if (submitFileInputRef.current) submitFileInputRef.current.value = "";
    }
  };

  const handleSubmissionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadSubmissionFile(file);
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

  const joinCodeModal = (
    <AnimatePresence>
      {showJoinCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/80 px-5"
          onClick={() => !isJoining && setShowJoinCode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-300" style={teko}>
                🔒 Private Lobby
              </span>
              <button
                onClick={() => !isJoining && setShowJoinCode(false)}
                className="text-foreground/40 hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-foreground/60 mb-3">Enter the join code from the host.</p>
            <input
              autoFocus
              value={joinCodeInput}
              onChange={(e) => { setJoinCodeInput(e.target.value); setJoinCodeError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") submitJoinCode(); }}
              placeholder="CODE"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.4em] uppercase text-foreground outline-none focus:border-fuchsia-400/60"
              style={teko}
            />
            {joinCodeError && (
              <p className="mt-2 text-[11px] text-red-400">{joinCodeError}</p>
            )}
            <button
              onClick={submitJoinCode}
              disabled={isJoining || !joinCodeInput.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2"
              style={teko}
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter Lobby"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Generate a thumbnail from a video file's first frame
  const generateVideoThumb = (file: File): Promise<Blob | null> =>
    new Promise((resolve) => {
      let settled = false;
      const done = (b: Blob | null) => { if (!settled) { settled = true; resolve(b); } };
      // Hard safety timeout — never let thumb gen block the upload
      const timeout = setTimeout(() => done(null), 5000);
      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
        video.onloadeddata = () => {
          try {
            video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
          } catch { clearTimeout(timeout); done(null); }
        };
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 720;
          canvas.height = video.videoHeight || 1280;
          const ctx = canvas.getContext("2d");
          if (!ctx) { clearTimeout(timeout); return done(null); }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => { clearTimeout(timeout); done(b); }, "image/jpeg", 0.85);
        };
        video.onerror = () => { clearTimeout(timeout); done(null); };
      } catch { clearTimeout(timeout); done(null); }
    });

  const handleInspoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !competition) return;
    if (file.size > 100 * 1024 * 1024) { toast.error("Keep it under 100MB"); return; }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Upload a video or image"); return; }

    setSavingInspo(true);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${user.id}/inspo-${competition.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("loop-media")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("loop-media").getPublicUrl(path);

      // Auto-thumbnail for videos
      let thumbUrl: string | null = null;
      if (isVideo) {
        const thumb = await generateVideoThumb(file);
        if (thumb) {
          const thumbPath = `${user.id}/inspo-${competition.id}-${Date.now()}.jpg`;
          const { error: thumbErr } = await supabase.storage
            .from("loop-media")
            .upload(thumbPath, thumb, { contentType: "image/jpeg", upsert: false });
          if (!thumbErr) {
            thumbUrl = supabase.storage.from("loop-media").getPublicUrl(thumbPath).data.publicUrl;
          }
        }
      }

      const ok = await updateInspo({
        url: urlData.publicUrl,
        platform: isVideo ? "upload" : "image",
        thumbnail_url: thumbUrl,
      });
      if (ok) { toast.success("Inspo edit added!"); setShowInspoForm(false); }
      else toast.error("Failed to save");
    } catch (err: any) {
      console.error("Inspo upload error:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setSavingInspo(false);
      if (inspoFileInputRef.current) inspoFileInputRef.current.value = "";
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // LOBBY ROOM — dedicated interface (members + chat + ready bar)
  // ═══════════════════════════════════════════════════════════════
  if (isLobby) {
    const privateJoinCode = (competition.join_code || "").trim().toUpperCase();
    const roomCode = competition.is_private && privateJoinCode
      ? privateJoinCode
      : (competition.slug || competition.id).slice(0, 6).toUpperCase();
    const cap = competition.max_players;
    const memberCount = participants.length;

    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>
        {/* ── HEADER ── */}
        <header className="shrink-0 px-4 pt-[env(safe-area-inset-top)] border-b border-white/[0.06] backdrop-blur-sm" style={{ backgroundColor: 'rgba(10,10,10,0.95)' }}>
          <div className="flex items-center gap-2.5 py-3">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.04] active:scale-95 transition">
              <ArrowLeft className="w-[18px] h-[18px] text-foreground/70" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-black text-foreground uppercase leading-none truncate tracking-tight" style={teko}>
                {competition.name}
              </h1>
              {(() => {
                const lines = [
                  `Battle starts when all ${cap} editors ready up`,
                  `Lobby fills to ${cap}/${cap} — then it's GO`,
                  "Tap READY to lock in your slot",
                  competition.index_reward_pool > 0
                    ? `Winner takes ${competition.index_reward_pool} IDX`
                    : "Winner earns rings + bragging rights",
                  "Invite friends to fill the lobby faster",
                ];
                const line = lines[infoIdx % lines.length];
                return (
                  <div className="h-3.5 mt-0.5 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={infoIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/40 truncate"
                      >
                        {line}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMusicMuted}
                aria-label={musicMuted ? 'Unmute lobby music' : 'Mute lobby music'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] active:scale-95 transition"
              >
                {musicMuted
                  ? <VolumeX className="w-[15px] h-[15px] text-foreground/55" />
                  : <Volume2 className="w-[15px] h-[15px] text-foreground/75" />}
              </button>
              <button
                onClick={() => setShowInfo(true)}
                aria-label="How edit competitions work"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] active:scale-95 transition"
              >
                <Info className="w-[15px] h-[15px] text-foreground/75" />
              </button>
              <button
                onClick={handleShare}
                className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/15 active:scale-95 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-extrabold tracking-[0.2em]" style={teko}>ROOM</span>
              </button>
              {isCreator && isLobby && (
                <button
                  onClick={handleDeleteRoom}
                  disabled={isDeleting}
                  aria-label="Delete room"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.03] hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400 text-foreground/70 active:scale-95 transition disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <Trash2 className="w-[15px] h-[15px]" />}
                </button>
              )}
            </div>
          </div>
          {isCreator && competition.is_private && privateJoinCode && (
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(privateJoinCode);
                  toast.success(`Code ${privateJoinCode} copied`);
                } catch {
                  toast.error("Couldn't copy code");
                }
              }}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 -mx-1 mb-1.5 rounded-md hover:bg-emerald-500/[0.06] active:scale-[0.99] transition"
              aria-label="Copy join code"
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-300/70 shrink-0">
                Share Code
              </span>
              <span className="font-mono text-[13px] font-bold tracking-[0.35em] text-emerald-200 tabular-nums leading-none ml-auto">
                {privateJoinCode}
              </span>
              <Copy className="w-3 h-3 text-emerald-300/80 shrink-0" />
            </button>
          )}
        </header>

        {/* ── INFO MODAL ── */}
        {showInfo && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm bg-[#0c0c0e] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 mx-0 sm:mx-3 max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[20px] font-black text-foreground uppercase leading-none tracking-tight" style={teko}>
                    How It Works
                  </h3>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground/50 mt-1.5" style={teko}>
                    Edit Competition
                  </p>
                </div>
                <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] active:scale-95 transition">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", title: "Join the Lobby", desc: "Editors gather in the room. Need at least 2 players to start. Host kicks it off when the squad's ready." },
                  { icon: Timer, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: "30 Minute Edit Window", desc: "Once it goes live, you've got 30 minutes to drop your edit on the given theme. No extensions, no excuses." },
                  { icon: Vote, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", title: "Community Vote", desc: "After submissions close, everyone votes for the best edit. Most votes wins the bag." },
                  { icon: Gavel, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", title: "Judge Verdict", desc: "Some comps get a Loopgate judge to lock in the final winner instead of community vote — keeps it fair on high-stakes rooms." },
                ].map((step, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${step.bg}`}>
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                      <step.icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-extrabold uppercase tracking-wider text-foreground leading-none" style={teko}>
                        {step.title}
                      </h4>
                      <p className="text-[12px] text-foreground/65 mt-1.5 leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowInfo(false)}
                className="mt-4 w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white border border-emerald-400/30"
                style={teko}
              >
                <span className="text-[14px] font-extrabold uppercase tracking-[0.2em]">Got It</span>
              </button>
            </div>
          </div>
        )}

        {/* ── MOBILE TAB SWITCHER (Roblox-style chunky pills) ── */}
        <div className="md:hidden shrink-0 px-3 pt-3">
          <div className="relative grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/[0.035] border border-white/[0.07] shadow-inner">
            <button
              onClick={() => setLobbyTab("members")}
              className={`relative h-11 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                lobbyTab === "members"
                  ? "bg-gradient-to-b from-white to-white/90 text-black shadow-[0_6px_18px_-6px_rgba(255,255,255,0.45)] ring-1 ring-white/40"
                  : "text-foreground/55 hover:text-foreground/80"
              }`}
            >
              <Users className="w-4 h-4" strokeWidth={2.6} />
              <span className="text-[13px] font-extrabold uppercase tracking-[0.08em] leading-none" style={teko}>
                Squad
              </span>
              <span className={`min-w-[28px] text-center text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-md leading-none ${
                lobbyTab === "members" ? "bg-black/10 text-black" : "bg-white/[0.07] text-foreground/55"
              }`} style={teko}>
                {memberCount}/{cap}
              </span>
            </button>
            <button
              onClick={() => setLobbyTab("chat")}
              className={`relative h-11 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                lobbyTab === "chat"
                  ? "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_6px_18px_-6px_rgba(239,68,68,0.65)] ring-1 ring-red-400/40"
                  : "text-foreground/55 hover:text-foreground/80"
              }`}
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2.6} />
              <span className="text-[13px] font-extrabold uppercase tracking-[0.08em] leading-none" style={teko}>
                Chat
              </span>
              <span className={`min-w-[28px] text-center text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-md leading-none ${
                lobbyTab === "chat" ? "bg-white/15 text-white" : "bg-white/[0.07] text-foreground/55"
              }`} style={teko}>
                {chatMessageCount}
              </span>
              {lobbyTab !== "chat" && chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#0A0A0A] shadow-[0_2px_8px_rgba(239,68,68,0.6)] animate-pulse">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── BODY: Members + Chat ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-hidden">
          {/* MEMBERS PANEL */}
          <section className={`${lobbyTab === "members" ? "flex" : "hidden"} md:flex flex-col min-h-0 rounded-xl border border-white/[0.07] overflow-hidden`} style={{ backgroundColor: '#111114' }}>
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-foreground/60" style={teko}>
                Members
              </span>
              <span className="text-[11px] font-bold tabular-nums text-foreground/50" style={teko}>
                {memberCount}/{cap}
              </span>
            </div>
            {(hasJoined || isCreator) && (isLobby || isLive) && (
              <CompetitionVoiceChat competitionId={competition.id} compact />
            )}
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
              {participants.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 text-center py-6">No editors yet</p>
              ) : participants.map(p => {
                const isHost = p.user_id === competition.creator_id;
                const isMe = p.user_id === user?.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border transition-all ${
                      p.is_ready
                        ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                        : "border-white/[0.05] bg-white/[0.015]"
                    }`}
                  >
                    <button
                      onClick={() => navigate(`/u/${p.username}`)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 group"
                    >
                      <div className="relative shrink-0">
                        <Avatar className={`w-7 h-7 border ${p.is_ready ? "border-emerald-500/60" : "border-white/10"}`}>
                          <AvatarImage src={p.avatar_url || ""} />
                          <AvatarFallback className="text-[9px] bg-surface-2 text-foreground font-bold">
                            {p.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {p.is_ready && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface-1 flex items-center justify-center">
                            <Check className="w-1.5 h-1.5 text-white" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className={`text-[12px] font-extrabold uppercase tracking-wider truncate group-hover:underline ${
                        p.is_ready ? "text-emerald-400" : isMe ? "text-foreground" : "text-foreground/80"
                      }`} style={teko}>
                        {p.username}{isMe && " (you)"}
                      </span>
                    </button>
                    {isHost && (
                      <span className="shrink-0 h-5 px-1.5 inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10">
                        <Crown className="w-2.5 h-2.5 text-gold" />
                        <span className="text-[9px] font-extrabold tracking-[0.2em] text-gold leading-none" style={teko}>HOST</span>
                      </span>
                    )}
                    {isCreator && !isHost && isLobby && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Kick ${p.username} from the room?`)) return;
                          const ok = await kick(p.user_id);
                          if (ok) toast.success(`${p.username} was kicked`);
                          else toast.error("Couldn't kick");
                        }}
                        title="Kick"
                        className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition"
                      >
                        <X className="w-3 h-3" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
              {/* empty slots */}
              {Array.from({ length: Math.max(0, cap - memberCount) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-dashed border-white/[0.05]">
                  <div className="w-7 h-7 rounded-full bg-white/[0.02] border border-dashed border-white/[0.06]" />
                  <span className="text-[11px] uppercase tracking-wider text-foreground/20" style={teko}>Empty slot</span>
                </div>
              ))}
            </div>
          </section>

          {/* CHAT PANEL */}
          <section className={`${lobbyTab === "chat" ? "flex" : "hidden"} md:flex flex-col min-h-0 rounded-xl border border-white/[0.07] overflow-hidden`} style={{ backgroundColor: '#111114' }}>
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-400" style={teko}>
                Chat
              </span>
              <span className="text-[10px] font-bold tabular-nums text-foreground/40" style={teko}>
                {chatMessageCount} {chatMessageCount === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex">
              <CompetitionChat competitionId={competition.id} embedded />
            </div>
          </section>
        </div>

        {/* ── ACTION BAR ── */}
        <footer className="shrink-0 border-t border-white/[0.06] backdrop-blur-sm px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)]" style={{ backgroundColor: 'rgba(10,10,10,0.95)' }}>
          {!hasJoined ? (
            <button
              onClick={handleJoin}
              disabled={isJoining || memberCount >= cap}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white border border-emerald-400/30 disabled:opacity-30 disabled:hover:bg-emerald-500 transition active:scale-[0.98]"
              style={teko}
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Play className="w-4 h-4" strokeWidth={2.5} />
                  <span className="text-[15px] font-extrabold uppercase tracking-[0.08em] leading-none">Join Lobby</span>
                </>
              )}
            </button>
          ) : (
            <>
              <div className="flex items-stretch gap-2">
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="flex-1 h-12 rounded-xl border border-white/[0.1] bg-white/[0.02] text-foreground/70 hover:bg-white/[0.05] hover:text-foreground flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] leading-none" style={teko}>Leave</span>
                </button>
                <button
                  onClick={handleReady}
                  disabled={isReadying}
                  className={`flex-[2] h-12 rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 border ${
                    isReady
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 border-emerald-400/30 text-white"
                  }`}
                  style={teko}
                >
                  {isReadying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      {isReady ? <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <Circle className="w-[18px] h-[18px]" strokeWidth={2.5} />}
                      <span className="text-[14px] font-extrabold uppercase tracking-[0.2em] leading-none">
                        {isReady ? "You're Ready" : "Ready Up"}
                      </span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground/55 mt-2 tracking-[0.2em] uppercase font-bold" style={teko}>
                {memberCount < 2
                  ? "Need 1 more editor — share the room"
                  : `${readyCount}/${memberCount} ready · starts when everyone's set`}
              </p>
            </>
          )}
        </footer>
        {joinCodeModal}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LIVE / SCORED — original full-detail page
  // ═══════════════════════════════════════════════════════════════
  // ── FOCUSED LIVE ARENA — gaming HUD, no clutter ─────────────
  if (isLive && (hasJoined || isCreator)) {
    return (
      <div className="min-h-screen bg-[#07070a] pb-32 text-white">
        <ThemeRevealModal
          open={showThemeReveal}
          onClose={() => setShowThemeReveal(false)}
          theme={resolvedTheme.theme}
          info={resolvedTheme.info}
          isAutoGenerated={resolvedTheme.auto}
          competitionName={competition.name}
        />
        {/* Slim top HUD */}
        <div
          className="sticky top-0 z-40"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
        >
          <div className="px-3 pb-2 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="shrink-0 w-10 h-10 rounded-full bg-[#0e0e14] border border-white/10 flex items-center justify-center active:scale-95 shadow-lg"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>

            {/* White pill bar */}
            <div className="flex-1 min-w-0 flex items-center gap-3 bg-white rounded-2xl pl-4 pr-2 py-2 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)]">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-zinc-400 leading-none" style={teko}>
                  Theme:
                </p>
                <p className="text-lg font-black uppercase tracking-tight text-violet-600 truncate leading-tight mt-0.5" style={teko}>
                  {resolvedTheme.theme}
                </p>
              </div>

              {/* Status pill */}
              <div className="shrink-0 flex flex-col items-center px-2.5 py-1 rounded-xl bg-violet-500 text-white shadow-[0_4px_10px_-2px_rgba(139,92,246,0.6)]">
                <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] leading-none opacity-80" style={teko}>
                  Status
                </span>
                <span className="text-sm font-black uppercase tracking-wider leading-none mt-0.5" style={teko}>
                  Live
                </span>
              </div>

              {/* Timer */}
              {competition.deadline && !deadlinePassed && (
                <div className="shrink-0 flex flex-col items-center pr-1">
                  <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] leading-none text-zinc-400" style={teko}>
                    Length
                  </span>
                  <div className="leading-none mt-0.5">
                    <LiveCountdownSky deadline={competition.deadline} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 pt-4 space-y-4">
          {/* Compact canvas */}
          <RobloxLiveCanvas
            isSubmitting={isSubmitting}
            hasSubmitted={hasSubmitted}
            submittedCount={submittedEditorCount}
            totalCount={totalEditorCount}
            onUpload={uploadSubmissionFile}
          />

          {/* Voice chat — push to talk row */}
          <div className="max-w-sm mx-auto rounded-xl bg-[#101015] border border-white/[0.06] p-2">
            <CompetitionVoiceChat competitionId={competition.id} compact />
          </div>

          {/* Speed leaderboard — fastest submitters */}
          <CompetitionSpeedLeaderboard
            submissions={submissions}
            startedAt={competition.started_at}
            currentUserId={user?.id ?? null}
            totalEditors={totalEditorCount}
          />

          {/* Live chat */}
          <div ref={chatRef} className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#101015]">
            <CompetitionChat competitionId={competition.id} />
          </div>
        </div>
        {joinCodeModal}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <ThemeRevealModal
        open={showThemeReveal}
        onClose={() => setShowThemeReveal(false)}
        theme={resolvedTheme.theme}
        info={resolvedTheme.info}
        isAutoGenerated={resolvedTheme.auto}
        competitionName={competition.name}
      />
      {/* ═══ HERO ═══ */}
      <div className={`relative overflow-hidden ${competition.inspo_video_url && inspoIsDirectVideo ? 'h-[420px]' : ''}`}>
        {competition.inspo_video_url && inspoIsDirectVideo ? (
          <>
            <video
              ref={inspoVideoRef}
              src={competition.inspo_video_url}
              poster={competition.inspo_thumbnail_url || competition.cover_image_url || undefined}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            {/* INSPO badge — top center */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
              <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white" style={teko}>
                  Inspo Edit
                </span>
              </div>
            </div>
            {/* Mute toggle — bottom right of hero */}
            <button
              onClick={toggleInspoMute}
              className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-all hover:bg-black/80"
              aria-label={inspoMuted ? "Unmute" : "Mute"}
            >
              {inspoMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </>
        ) : (
          competition.cover_image_url ? (
            <img
              src={competition.cover_image_url}
              alt=""
              loading="lazy"
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52">
              <LobbyDefaultCover name={competition.name} variant="hero" />
            </div>
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/40 pointer-events-none" />

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

        {/* Add Inspo Edit removed per request */}

        {isCreator && showInspoForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <p className="text-[10px] text-muted-foreground/60 px-1">
              Upload a video or image from your device — it'll autoplay in your lobby with an auto-generated thumbnail.
            </p>
            <input
              ref={inspoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
              onChange={handleInspoFile}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInspoForm(false)}
                disabled={savingInspo}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-muted-foreground bg-surface-2 border border-white/[0.06] disabled:opacity-30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => inspoFileInputRef.current?.click()}
                disabled={savingInspo}
                className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                {savingInspo ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Choose Video / Photo</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ LIVE EDITING ACTIONS — file-first submission flow ═══ */}
        {isLive && hasJoined && (
          <RobloxLiveCanvas
            isSubmitting={isSubmitting}
            hasSubmitted={hasSubmitted}
            submittedCount={submittedEditorCount}
            totalCount={totalEditorCount}
            onUpload={uploadSubmissionFile}
          />
        )}

        {/* ═══ READY UP — lobby state, both joined editors can ready ═══ */}
        {isLobby && hasJoined && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <button
              onClick={handleReady}
              disabled={isReadying}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: isReady
                  ? "rgba(16,185,129,0.12)"
                  : "linear-gradient(135deg, #10B981, #059669)",
                color: isReady ? "#10B981" : "#fff",
                border: isReady ? "1px solid rgba(16,185,129,0.4)" : "none",
                boxShadow: isReady ? "none" : "0 4px 24px rgba(16,185,129,0.3)",
                ...teko,
              }}
            >
              {isReadying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {isReady ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  <span className="text-[16px] font-extrabold uppercase tracking-[0.15em]">
                    {isReady ? "READY — TAP TO UNREADY" : "READY UP"}
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-muted-foreground/50">
              {competition.current_players < 2
                ? `Waiting for 1 more editor — share the lobby`
                : `${readyCount}/${competition.current_players} ready · starts when everyone's ready`}
            </p>
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
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 text-center">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-emerald-400" style={teko}>Edit Submitted</span>
            {isLive && (
              <p className="mt-1 text-[10px] text-foreground/45">
                Waiting for timer or all edits — {submittedEditorCount}/{totalEditorCount} submitted
              </p>
            )}
          </div>
        )}

        {/* ═══ SPEED LEADERBOARD — fastest submitters ═══ */}
        {(isLive || isVoting || isCompleted) && submissions.length > 0 && (
          <CompetitionSpeedLeaderboard
            submissions={submissions}
            startedAt={competition.started_at}
            currentUserId={user?.id ?? null}
            totalEditors={totalEditorCount}
          />
        )}

        {/* ═══ LEADERBOARD — completed only. Hidden entirely during showcase + voting. ═══ */}
        {isCompleted && (
          <CompetitionLeaderboard
            submissions={submissions}
            isCompleted={isCompleted}
            isVoting={isVoting}
            onVote={castVote}
            myVoteSubmissionId={myVoteSubmissionId}
            currentUserId={user?.id ?? null}
          />
        )}

        {/* ═══ WINNER SHARE CARD CTA — completed only ═══ */}
        {isCompleted && submissions.length > 0 && (() => {
          const sorted = [...submissions].sort((a, b) => {
            const va = a.vote_count ?? 0;
            const vb = b.vote_count ?? 0;
            if (vb !== va) return vb - va;
            return b.created_at.localeCompare(a.created_at);
          });
          const winner = sorted[0];
          const runnerUp = sorted[1] ?? null;
          return (
            <>
              <button
                onClick={() => setShowWinnerCard(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black uppercase tracking-[0.14em] text-[12px] active:scale-[0.98] transition-transform shadow-[0_0_24px_rgba(252,211,77,0.25)]"
                style={teko}
              >
                <Crown className="w-4 h-4" />
                Generate Winner Card
                <Share2 className="w-4 h-4" />
              </button>
              <CompetitionWinnerCard
                isOpen={showWinnerCard}
                onClose={() => setShowWinnerCard(false)}
                competitionId={competition.id}
                competitionName={competition.name}
                winner={winner}
                runnerUp={runnerUp}
                totalEditors={participants.length || submissions.length}
              />
            </>
          );
        })()}

        {/* ═══ EDITORS — with ready badges in lobby ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
              Editors ({participants.length})
            </span>
            {isLobby && participants.length > 0 && (
              <span className="text-[10px] text-emerald-400/70 font-bold ml-1">
                · {readyCount} ready
              </span>
            )}
          </div>
          {participants.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center py-3">No editors yet — be the first</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {participants.map(p => (
                <button key={p.id} onClick={() => navigate(`/u/${p.username}`)} className="flex flex-col items-center gap-1 group">
                  <div className="relative">
                    <Avatar className={`w-10 h-10 border transition-all ${p.is_ready ? "border-emerald-500/70" : "border-white/10 group-hover:border-white/30"}`}>
                      <AvatarImage src={p.avatar_url || ""} />
                      <AvatarFallback className="text-[10px] bg-surface-1 text-foreground font-bold">
                        {p.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {p.is_ready && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
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

      {/* ═══ FULL-SCREEN SHOWCASE STAGE — owns showcase / vote / tally ═══ */}
      <AnimatePresence>{showcaseStage}</AnimatePresence>

      {/* ═══ JOIN CODE MODAL ═══ */}
      {joinCodeModal}
    </div>
  );
}
