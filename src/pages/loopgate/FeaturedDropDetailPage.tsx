import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Music, ExternalLink, Flame, Trophy, Crown, Star,
  Zap, Send, ChevronRight, Users, Clock, Eye, Share2, Check,
  TrendingUp, ChevronDown, Play, Lock, Video, Award, Link2, Download,
  ListOrdered
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DropSubmissionCard from "@/components/loopgate/DropSubmissionCard";
import DropLeaderboardRow from "@/components/loopgate/DropLeaderboardRow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDropSubmissions } from "@/hooks/useFeaturedDrops";
import { useDropRounds } from "@/hooks/useDropRounds";
import { useDropQueue } from "@/hooks/useDropQueue";
import type { FeaturedDrop, FeaturedArtist, FeaturedSubmission } from "@/hooks/useFeaturedDrops";
import FeaturedSubmitModal from "@/components/loopgate/FeaturedSubmitModal";
import CompLobbyHeader from "@/components/loopgate/CompLobbyHeader";
import DropLobbyChat from "@/components/loopgate/DropLobbyChat";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function FeaturedDropDetailPage() {
  const { dropId } = useParams<{ dropId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [drop, setDrop] = useState<FeaturedDrop | null>(null);
  const [artist, setArtist] = useState<FeaturedArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const { submissions, loading: subsLoading } = useDropSubmissions(resolvedId);
  const { rounds, rankings, activeRound, currentRound } = useDropRounds(resolvedId);
  const { queue, queueCount } = useDropQueue(resolvedId);
  const queueRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dropId) return;
    const fetch = async () => {
      // Try UUID first, then slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dropId);
      const query = supabase
        .from('featured_drops')
        .select('*, featured_artists(*)');
      
      const { data } = isUUID 
        ? await query.eq('id', dropId).single()
        : await query.eq('slug', dropId).single();

      if (data) {
        setDrop({ ...data, artist: (data as any).featured_artists } as FeaturedDrop);
        setArtist((data as any).featured_artists as FeaturedArtist);
        setResolvedId(data.id);
      }
      setLoading(false);
    };
    fetch();
  }, [dropId]);

  // Auto-scroll to queue/active round section on page load
  useEffect(() => {
    if (!loading && drop && queueRef.current) {
      setTimeout(() => {
        queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [loading, drop]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Drop not found</p>
          <Link to="/arena" className="text-destructive text-xs mt-2 block">← Back to Arena</Link>
        </div>
      </div>
    );
  }

  const isLive = drop.status === 'live';
  const isJudging = drop.status === 'judging';
  const isClosed = drop.status === 'closed';

  // Round-based data
  const hasRounds = rounds.length > 0;
  const roundSubs = (roundId: string) => submissions.filter((s: any) => s.round_id === roundId);
  const activeRoundSubs = activeRound ? roundSubs(activeRound.id) : [];
  const slotsLeft = activeRound ? activeRound.max_submissions - activeRoundSubs.length : 0;
  const slotsTotal = activeRound?.max_submissions || 0;
  const slotsFilled = activeRound ? activeRoundSubs.length : 0;
  const allRoundsFull = hasRounds && !rounds.some(r => r.status === 'open');
  const canQueueSubmit = isLive && allRoundsFull && queueCount < 100;

  // For non-round drops, fallback to old behavior
  const allSubs = submissions;
  const scored = allSubs.filter(s => s.status === 'scored').sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = allSubs.filter(s => s.status === 'pending');

  // Clean slug-based link for bios
  const cleanLink = `${window.location.origin}/drop/${(drop as any).slug || dropId}`;

  const downloadAudio = async (url: string, filename: string) => {
    try {
      toast.info('Starting download…');
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download complete — check your files!');
    } catch {
      toast.error('Download failed — try again');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: drop.title, text: `Join "${drop.title}" on Loopgate!`, url: cleanLink });
      } else {
        await navigator.clipboard.writeText(cleanLink);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const handleQuickLink = async () => {
    await navigator.clipboard.writeText(cleanLink);
    setLinkCopied(true);
    toast.success("Clean link copied — paste in your bio!");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const getRoundLabel = (num: number) => {
    if (num === 1) return '3 EDITS';
    if (num === 2) return '5 EDITS';
    if (num === 3) return '10 EDITS';
    return `${10} EDITS`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ HERO — cinematic poster ═══ */}
      <div className="relative">
        <div className="h-56 w-full overflow-hidden">
          {drop.poster_url ? (
            <img src={drop.poster_url} alt={drop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-destructive/30 via-surface-2 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Top nav */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            )}
            {isJudging && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-gold/30 px-2.5 py-1 rounded-full animate-pulse">
                <span className="text-[9px] font-bold text-gold uppercase tracking-wider">⚡ Judging</span>
              </div>
            )}
            <button onClick={handleQuickLink} className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full" title="Copy clean link for bio">
              {linkCopied ? <Check className="w-4 h-4 text-gold" /> : <Link2 className="w-4 h-4 text-foreground" />}
            </button>
            <button onClick={handleShare} className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Title + Artist */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="font-display text-2xl text-foreground tracking-wide leading-none">{drop.title}</h1>
          {artist && (
            <Link to={`/artist/${artist.slug}`} className="inline-flex items-center gap-1.5 mt-2 group">
              <Avatar className="w-5 h-5 border border-gold/40">
                <AvatarImage src={artist.avatar_url || ''} />
                <AvatarFallback className="bg-gold/10 text-[7px] text-gold font-bold">{artist.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-bold text-foreground/80 group-hover:text-foreground transition-colors">{artist.name}</span>
              <span className="text-[8px] font-black text-gold/70 uppercase tracking-wider">Artist</span>
            </Link>
          )}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="px-4 space-y-3 mt-3">

        {/* ═══ ROUND SYSTEM ═══ */}
        {hasRounds && (
          <div ref={queueRef} className="space-y-3">
            {/* Round timeline */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {rounds.map((round) => {
                const isActive = round.status === 'open' || round.status === 'full';
                const isCompleted = round.status === 'completed';
                const isCurrentJudging = round.status === 'judging';
                return (
                  <div
                    key={round.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border shrink-0 transition-colors ${
                      isActive
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : isCurrentJudging
                        ? 'bg-gold/10 border-gold/30 text-gold'
                        : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-surface-1 border-border text-muted-foreground'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">R{round.round_number}</span>
                    <span className="text-[8px] font-bold">{getRoundLabel(round.round_number)}</span>
                    {isCompleted && <Check className="w-3 h-3" />}
                    {isCurrentJudging && <Video className="w-3 h-3" />}
                    {isActive && <Flame className="w-3 h-3" />}
                    {round.status === 'pending' && <Lock className="w-3 h-3" />}
                  </div>
                );
              })}
            </div>

            {/* Active round — SLOT COUNTER (the star of the show) */}
            {activeRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-1 border-2 border-destructive/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg text-foreground tracking-wide">
                      ROUND {activeRound.round_number}
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {slotsLeft > 0
                        ? 'Submit before the slots fill up'
                        : 'All slots filled — waiting for judge'}
                    </p>
                  </div>
                  {activeRound.judge_username && (
                    <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/20 px-2 py-1">
                      <Award className="w-3 h-3 text-gold" />
                      <span className="text-[9px] font-bold text-gold">Judge: @{activeRound.judge_username}</span>
                    </div>
                  )}
                </div>

                {/* Slot visual */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: slotsTotal }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-10 border-2 flex items-center justify-center transition-all ${
                        i < slotsFilled
                          ? 'bg-destructive/15 border-destructive/40'
                          : 'bg-surface-2 border-border border-dashed'
                      }`}
                    >
                      {i < slotsFilled ? (
                        <Check className="w-4 h-4 text-destructive" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 font-bold">?</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Slot counter text */}
                <div className="text-center">
                  <span className={`font-display text-3xl tabular-nums ${
                    slotsLeft === 0 ? 'text-gold' : slotsLeft <= 1 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {slotsLeft}
                  </span>
                  <span className="text-sm text-muted-foreground font-bold">/{slotsTotal}</span>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                    slotsLeft === 0 ? 'text-gold' : slotsLeft <= 1 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {slotsLeft === 0 ? '🔒 ROUND FULL' : slotsLeft === 1 ? '🔥 LAST SLOT' : 'SLOTS LEFT'}
                  </p>
                </div>

                {/* SUBMIT CTA */}
                {slotsLeft > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowSubmit(true)}
                    className="w-full py-4 bg-gradient-to-r from-destructive to-destructive/80 text-white font-display text-base uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px_hsl(var(--destructive)/0.4)] hover:shadow-[0_4px_32px_-4px_hsl(var(--destructive)/0.6)] transition-all"
                  >
                    <Flame className="w-5 h-5" />
                    Submit Your Edit
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* ═══ QUEUE — when all rounds full, editors can still submit ═══ */}
            {allRoundsFull && isLive && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative bg-gradient-to-b from-gold/[0.08] to-surface-1 border-2 border-gold/30 p-5 space-y-4 overflow-hidden"
              >
                {/* Animated glow */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl pointer-events-none"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="font-display text-lg text-foreground tracking-wide flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-5 h-5 text-gold" />
                      </motion.div>
                      NEXT ROUND LOBBY
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      🔥 Round full — drop your edit here to secure your spot
                    </p>
                  </div>
                  <div className="text-right">
                    <motion.span
                      key={queueCount}
                      initial={{ scale: 1.4, color: 'hsl(var(--gold))' }}
                      animate={{ scale: 1, color: queueCount >= 100 ? 'hsl(var(--destructive))' : 'hsl(var(--gold))' }}
                      className="font-display text-3xl tabular-nums block"
                    >
                      {queueCount}
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground font-bold">/100 queued</span>
                  </div>
                </div>

                {/* Queue progress bar */}
                <div className="w-full h-3 bg-surface-2 border border-border overflow-hidden relative z-10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((queueCount / 100) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-gold/50 via-gold to-gold/80 relative"
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </motion.div>
                </div>

                {/* Queue avatars with live pulse */}
                {queue.length > 0 && (
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex -space-x-2">
                      {queue.slice(0, 8).map((q, i) => (
                        <motion.div
                          key={q.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Avatar className="w-7 h-7 border-2 border-background ring-1 ring-gold/20">
                            <AvatarImage src={q.avatar_url || ''} />
                            <AvatarFallback className="bg-gold/10 text-[7px] font-bold text-gold">
                              {q.username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                      ))}
                      {queueCount > 8 && (
                        <div className="w-7 h-7 rounded-full bg-gold/10 border-2 border-background ring-1 ring-gold/20 flex items-center justify-center">
                          <span className="text-[8px] font-black text-gold">+{queueCount - 8}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Filling fast</span>
                    </div>
                  </div>
                )}

                {/* Queue submit CTA */}
                {canQueueSubmit && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setShowSubmit(true)}
                    className="w-full py-4 bg-gradient-to-r from-gold via-gold/90 to-gold/80 text-background font-display text-base uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px_rgba(255,215,0,0.3)] hover:shadow-[0_4px_32px_-4px_rgba(255,215,0,0.5)] transition-all relative z-10"
                  >
                    <Flame className="w-5 h-5" />
                    Join the Queue
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
                {queueCount >= 100 && (
                  <div className="text-center relative z-10 space-y-1">
                    <p className="text-[11px] font-black text-destructive uppercase tracking-widest">
                      🔒 QUEUE FULL — 100/100
                    </p>
                    <p className="text-[9px] text-muted-foreground">Next round drops soon. Stay locked in.</p>
                  </div>
                )}
              </motion.div>
            )}

            {currentRound?.status === 'judging' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gold/5 border-2 border-gold/30 p-4 text-center space-y-2"
              >
                <Video className="w-8 h-8 text-gold mx-auto" />
                <h3 className="font-display text-sm text-gold uppercase tracking-widest">
                  Waiting for Judge Video
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Round {currentRound.round_number} is full — the judge is ranking your edits
                </p>
                {currentRound.judge_username && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Avatar className="w-6 h-6 border border-gold/40">
                      <AvatarImage src={currentRound.judge_avatar_url || ''} />
                      <AvatarFallback className="bg-gold/10 text-[7px] text-gold font-bold">
                        {currentRound.judge_username?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-foreground">@{currentRound.judge_username}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Completed rounds — show judge video + rankings */}
            {rounds.filter(r => r.status === 'completed').map((round) => {
              const roundRankings = rankings.filter(rk => rk.round_id === round.id);
              const roundSubmissions = roundSubs(round.id);
              return (
                <div key={round.id} className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Trophy className="w-4 h-4 text-gold" />
                    <h3 className="font-display text-sm text-foreground uppercase tracking-wider">
                      Round {round.round_number} Results
                    </h3>
                    <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                  </div>

                  {/* Judge video */}
                  {round.judge_video_url && (
                    <a
                      href={round.judge_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 hover:border-gold/40 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <Play className="w-5 h-5 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">Judge's Ranking Video</p>
                        <p className="text-[9px] text-gold font-bold uppercase tracking-wider">
                          by @{round.judge_username}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
                    </a>
                  )}

                  {/* Rankings */}
                  {roundRankings.length > 0 && (
                    <div className="space-y-1.5">
                      {roundRankings.map((rk) => {
                        const sub = roundSubmissions.find(s => s.id === rk.submission_id);
                        if (!sub) return null;
                        return (
                          <div
                            key={rk.id}
                            className={`flex items-center gap-3 p-2.5 border ${
                              rk.rank === 1
                                ? 'bg-gold/5 border-gold/30'
                                : rk.rank === 2
                                ? 'bg-surface-1 border-border'
                                : 'bg-surface-1 border-border/60'
                            }`}
                          >
                            <span className={`text-lg font-display tabular-nums w-8 text-center shrink-0 ${
                              rk.rank === 1 ? 'text-gold' : rk.rank === 2 ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              #{rk.rank}
                            </span>
                            <Avatar className="w-7 h-7 border border-border shrink-0">
                              <AvatarImage src={sub.avatar_url || ''} />
                              <AvatarFallback className="text-[8px] bg-surface-2 font-bold">
                                {sub.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-foreground flex-1 truncate">@{sub.username}</span>
                            {rk.rank === 1 && <Crown className="w-4 h-4 text-gold shrink-0" />}
                            {rk.index_awarded > 0 && (
                              <span className="text-[9px] font-bold text-emerald-400">+{rk.index_awarded} IDX</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ NON-ROUND DROPS (legacy fallback) ═══ */}
        {!hasRounds && (
          <>
            {/* Submit CTA */}
            {isLive && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSubmit(true)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-display text-base uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_-4px_rgba(16,185,129,0.5)] transition-all"
              >
                <Flame className="w-5 h-5" />
                Submit Your Edit
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </>
        )}

        {/* ─── SOUND link ─── */}
        {drop.song_url && (
          <div className="flex items-center bg-surface-1 border border-border hover:border-destructive/30 transition-colors">
            <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 flex-1 min-w-0 group">
              <div className="w-9 h-9 bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{drop.song_name}</p>
                <p className="text-[9px] text-destructive font-bold uppercase tracking-wider">⚡ Use this sound</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-2.5 border-l border-border hover:bg-surface-2 transition-colors shrink-0">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-surface-1 border-border">
                <DropdownMenuItem asChild>
                  <a href={drop.song_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Sound Link
                  </a>
                </DropdownMenuItem>
                {drop.song_preview_url && (
                  <DropdownMenuItem
                    onClick={() => downloadAudio(drop.song_preview_url!, `${drop.song_name || 'preview'}.m4a`)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Preview Audio
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Song Preview */}
        {drop.song_preview_url && (
          <div className="bg-surface-1 border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-destructive/10 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-foreground truncate">🔊 Preview</p>
                <p className="text-[9px] text-muted-foreground truncate">{drop.song_name}</p>
              </div>
              <button
                onClick={() => downloadAudio(drop.song_preview_url!, `${drop.song_name || 'preview'}.m4a`)}
                className="flex items-center gap-1.5 bg-surface-2 border border-border hover:border-destructive/30 px-2 py-1 transition-colors"
                title="Download audio"
              >
                <Download className="w-3 h-3 text-destructive" />
                <span className="text-[8px] font-bold text-foreground uppercase tracking-wider">DL</span>
              </button>
            </div>
            <audio src={drop.song_preview_url} controls className="w-full h-9" preload="metadata" />
          </div>
        )}

        {/* How to join */}
        {isLive && (
          <div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full py-2 bg-surface-1 border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 hover:text-foreground hover:border-destructive/30 transition-colors"
            >
              <Zap className="w-3 h-3 text-gold" />
              How Do I Join?
              <ChevronDown className={`w-3 h-3 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-1 bg-surface-1 border border-border p-3 space-y-2"
              >
                {[
                  { num: '1', text: '🎧 Listen to the song & vibe with it' },
                  { num: '2', text: '🎬 Make a fire edit — any app works' },
                  { num: '3', text: '📱 Post on TikTok, IG, or YouTube' },
                  { num: '4', text: '🔗 Come back & paste the link' },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-surface-2 border border-border flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-gold">{step.num}</span>
                    </div>
                    <p className="text-[10px] font-medium text-foreground">{step.text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Description */}
        {drop.description && (
          <div>
            <button
              onClick={() => setShowDesc(!showDesc)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
            >
              About This Drop
              <ChevronDown className={`w-3 h-3 transition-transform ${showDesc ? 'rotate-180' : ''}`} />
            </button>
            {showDesc && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-muted-foreground leading-relaxed mt-2"
              >
                {drop.description}
              </motion.p>
            )}
          </div>
        )}

        {/* ═══ ALL SUBMISSIONS (leaderboard for non-round, or current round subs) ═══ */}
        {!hasRounds && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h2 className="font-display text-lg text-foreground flex items-center gap-2 tracking-wide">
                <Trophy className="w-4 h-4 text-gold" />
                {scored.length > 0 ? 'LEADERBOARD' : 'SUBMISSIONS'}
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold tabular-nums">{allSubs.length} {allSubs.length === 1 ? 'ENTRY' : 'ENTRIES'}</span>
            </div>

            {subsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : allSubs.length === 0 ? (
              <div className="bg-surface-1 border border-border p-8 text-center">
                <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-muted-foreground">No submissions yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to enter & set the bar 🔥</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scored.map((sub, idx) => (
                  <DropSubmissionCard key={sub.id} submission={sub} rank={idx + 1} isTopScorer={idx === 0} />
                ))}
                {pending.map((sub) => (
                  <DropSubmissionCard key={sub.id} submission={sub} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Round-based submissions — ranked leaderboard */}
        {hasRounds && activeRound && activeRoundSubs.length > 0 && (
          <div>
            {/* Leaderboard header — cinematic */}
            <div className="relative overflow-hidden border border-border/40 mb-px">
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/[0.06] via-transparent to-gold/[0.04]" />
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                      <ListOrdered className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg text-foreground uppercase tracking-wider leading-none">
                      Round {activeRound.round_number} Rankings
                    </h3>
                    <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-widest mt-0.5">
                      Live Leaderboard • {activeRoundSubs.length}/{activeRound.max_submissions} slots
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-2xl font-display text-foreground tabular-nums leading-none">
                    {activeRoundSubs.length}
                  </span>
                  <span className="text-[7px] text-muted-foreground/40 uppercase tracking-widest font-mono">entries</span>
                </div>
              </div>
            </div>

            {/* Ranked entries */}
            <div className="space-y-px">
              {(() => {
                const sorted = [...activeRoundSubs].sort((a, b) => {
                  if (a.status === 'scored' && b.status === 'scored') {
                    return (b.qoi_score || 0) - (a.qoi_score || 0);
                  }
                  return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
                });
                return sorted.map((sub, idx) => (
                  <DropLeaderboardRow
                    key={sub.id}
                    submission={sub}
                    rank={idx + 1}
                    totalEntries={sorted.length}
                  />
                ));
              })()}
            </div>

            {/* Remaining slots teaser */}
            {slotsLeft > 0 && (
              <div className="border border-dashed border-border/30 mt-px">
                <div className="flex items-center justify-center gap-2 py-6 sm:py-8">
                  <div className="flex -space-x-1">
                    {[...Array(Math.min(slotsLeft, 3))].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/15 bg-surface-0/30" />
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-display text-muted-foreground/30 uppercase tracking-wider">
                      {slotsLeft} {slotsLeft === 1 ? 'slot' : 'slots'} remaining
                    </p>
                    <p className="text-[8px] text-muted-foreground/20 font-mono uppercase">
                      Submit to claim your rank
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ LIVE CHAT ═══ */}
        <DropLobbyChat dropId={dropId!} />

        {/* Winners (legacy) */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="space-y-2">
            <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-gold" /> Winners
            </h2>
            {drop.top_scorer_username && (
              <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20">
                <Crown className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gold">@{drop.top_scorer_username}</span>
                  <p className="text-[9px] text-muted-foreground">Top Scorer — {Math.round(drop.top_score)} QOI</p>
                </div>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20">
                <Star className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <span className="text-xs font-bold text-destructive">@{drop.random_pick_username}</span>
                  <p className="text-[9px] text-muted-foreground">Artist's Pick</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmit && drop && (
        <FeaturedSubmitModal
          drop={drop}
          roundId={activeRound?.id || null}
          queueMode={allRoundsFull}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
}
