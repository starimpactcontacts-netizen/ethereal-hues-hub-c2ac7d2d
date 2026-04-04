import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Music, ExternalLink, Flame, Trophy, Crown, Star,
  Zap, Send, ChevronRight, Users, Clock, Eye, Share2, Check,
  TrendingUp, ChevronDown, Play, Lock, Video, Award, Link2, Download,
  ListOrdered, MessageCircle, Info, X, Swords
} from "lucide-react";

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

const teko = { fontFamily: 'Teko, sans-serif' };

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
  const [showDesc, setShowDesc] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { submissions, loading: subsLoading } = useDropSubmissions(resolvedId);
  const { rounds, rankings, activeRound, currentRound } = useDropRounds(resolvedId);
  const { queue, queueCount } = useDropQueue(resolvedId);
  const queueRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dropId) return;
    const fetch = async () => {
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

  // Fetch chat count + realtime
  useEffect(() => {
    if (!dropId) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('featured_drop_messages' as any)
        .select('*', { count: 'exact', head: true })
        .eq('drop_id', dropId);
      setChatCount(count || 0);
    };
    fetchCount();

    const channel = supabase
      .channel(`drop-chat-count-${dropId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'featured_drop_messages',
        filter: `drop_id=eq.${dropId}`
      }, () => {
        setChatCount(c => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

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

  const hasRounds = rounds.length > 0;
  const roundSubs = (roundId: string) => submissions.filter((s: any) => s.round_id === roundId);
  const activeRoundSubs = activeRound ? roundSubs(activeRound.id) : [];
  const slotsLeft = activeRound ? activeRound.max_submissions - activeRoundSubs.length : 0;
  const slotsTotal = activeRound?.max_submissions || 0;
  const slotsFilled = activeRound ? activeRoundSubs.length : 0;
  const allRoundsFull = hasRounds && !rounds.some(r => r.status === 'open');
  const canQueueSubmit = isLive && allRoundsFull && queueCount < 100;

  const allSubs = submissions;
  const scored = allSubs.filter(s => s.status === 'scored').sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = allSubs.filter(s => s.status === 'pending');

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
          <h1 className="text-3xl text-foreground tracking-wider leading-none uppercase font-bold" style={teko}>{drop.title}</h1>
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

      {/* ═══ LOBBY ACTION BAR ═══ */}
      <div className="px-4 mt-2 flex items-center gap-2">
        {/* Chat quick-link */}
        <button
          onClick={() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex-1 flex items-center gap-2.5 px-3 py-2.5 bg-foreground/[0.04] border border-foreground/[0.08] hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all active:scale-[0.98] touch-manipulation group"
        >
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-red-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground uppercase tracking-wider" style={teko}>
            Live Chat
          </span>
          {chatCount > 0 && (
            <motion.span
              key={chatCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black"
            >
              {chatCount}
            </motion.span>
          )}
        </button>

        {/* Info button */}
        <button
          onClick={() => setShowInfoDrawer(!showInfoDrawer)}
          className="flex items-center gap-2 px-3 py-2.5 bg-foreground/[0.04] border border-foreground/[0.08] hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-all active:scale-[0.98] touch-manipulation group"
        >
          <Info className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground uppercase tracking-wider" style={teko}>
            How It Works
          </span>
        </button>

        {/* Participant count */}
        <div className="flex items-center gap-1.5 px-2.5 py-2.5 bg-foreground/[0.04] border border-foreground/[0.08]">
          <Users className="w-3.5 h-3.5 text-foreground/30" />
          <span className="text-sm font-bold text-foreground/40 tabular-nums" style={teko}>
            {allSubs.length + queueCount}
          </span>
        </div>
      </div>

      {/* Info Drawer */}
      <AnimatePresence>
        {showInfoDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mx-4 mt-1"
          >
            <div className="border-2 border-emerald-500/20 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400 uppercase tracking-wider" style={teko}>Official Event</span>
                </div>
                <button onClick={() => setShowInfoDrawer(false)} className="text-foreground/30 hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { icon: '🎧', title: 'Listen', desc: 'Grab the song and vibe with it' },
                  { icon: '🎬', title: 'Edit', desc: 'Make a fire edit — any app, any style' },
                  { icon: '📱', title: 'Post', desc: 'Upload to TikTok, IG, or YouTube' },
                  { icon: '🔗', title: 'Submit', desc: 'Paste the link here to enter' },
                  { icon: '⚡', title: 'Get Rated', desc: 'A judge scores your edit 0–100 QOI' },
                  { icon: '🏆', title: 'Win', desc: 'Best edit + random pick split the prize' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs">{step.icon}</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground uppercase tracking-wider" style={teko}>{step.title}</span>
                      <p className="text-[10px] text-foreground/40 leading-snug">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-foreground/[0.03] border border-foreground/[0.06] p-2.5 text-center">
                <p className="text-[10px] text-foreground/30 leading-relaxed">
                  Rounds fill up fast. Once full, join the <span className="text-gold font-bold">Next Round Queue</span> to secure your spot.
                  Judges rate edits on <span className="text-red-400 font-bold">Quality · Originality · Impact</span>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BODY ═══ */}
      <div className="px-4 space-y-3 mt-3">

        {/* ═══ PRIZE CALLOUT ═══ */}
        {drop.prize_usd > 0 && (
          <div className="flex items-center gap-3 py-2">
            <span
              className="text-6xl text-emerald-400 font-bold leading-none"
              style={{ ...teko, textShadow: '0 0 16px rgba(16,185,129,0.5), 0 6px 30px rgba(16,185,129,0.35), 0 14px 50px rgba(16,185,129,0.2)' }}
            >
              ${drop.prize_usd}
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider" style={teko}>Cash Prize</p>
              <p className="text-[10px] text-muted-foreground">Best edit + random pick win</p>
            </div>
          </div>
        )}

        {/* ═══ ROUND SYSTEM ═══ */}
        {hasRounds && (
          <div ref={queueRef} className="space-y-4">
            {/* Round timeline — inline pills, no boxes */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {rounds.map((round) => {
                const isActive = round.status === 'open' || round.status === 'full';
                const isCompleted = round.status === 'completed';
                const isCurrentJudging = round.status === 'judging';
                return (
                  <div
                    key={round.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 shrink-0 transition-colors ${
                      isActive
                        ? 'bg-destructive/10 text-destructive'
                        : isCurrentJudging
                        ? 'bg-gold/10 text-gold'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-foreground/[0.04] text-muted-foreground'
                    }`}
                  >
                    <span className="text-sm font-bold uppercase tracking-wider" style={teko}>R{round.round_number}</span>
                    <span className="text-[11px] font-bold" style={teko}>{getRoundLabel(round.round_number)}</span>
                    {isCompleted && <Check className="w-3 h-3" />}
                    {isCurrentJudging && <Video className="w-3 h-3" />}
                    {isActive && <Flame className="w-3 h-3" />}
                    {round.status === 'pending' && <Lock className="w-3 h-3" />}
                  </div>
                );
              })}
            </div>

            {/* Active round — streamlined */}
            {activeRound && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl text-foreground tracking-wider uppercase font-bold" style={teko}>
                      Round {activeRound.round_number}
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {slotsLeft > 0
                        ? 'Submit before the slots fill up'
                        : 'All slots filled — waiting for judge'}
                    </p>
                  </div>
                  {activeRound.judge_username && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gold/10">
                      <Award className="w-3 h-3 text-gold" />
                      <span className="text-[9px] font-bold text-gold">Judge: @{activeRound.judge_username}</span>
                    </div>
                  )}
                </div>

                {/* Slot visual — flat, no individual borders */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: slotsTotal }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-9 flex items-center justify-center transition-all ${
                        i < slotsFilled
                          ? 'bg-destructive/15'
                          : 'bg-foreground/[0.04]'
                      }`}
                    >
                      {i < slotsFilled ? (
                        <Check className="w-4 h-4 text-destructive" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30 font-bold">?</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Counter + CTA inline */}
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl tabular-nums font-bold ${
                      slotsLeft === 0 ? 'text-gold' : slotsLeft <= 1 ? 'text-destructive' : 'text-foreground'
                    }`} style={teko}>
                      {slotsLeft}
                    </span>
                    <span className="text-lg text-muted-foreground font-bold" style={teko}>/{slotsTotal}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ml-1 ${
                      slotsLeft === 0 ? 'text-gold' : slotsLeft <= 1 ? 'text-destructive' : 'text-muted-foreground'
                    }`} style={teko}>
                      {slotsLeft === 0 ? '🔒 Full' : slotsLeft === 1 ? '🔥 Last Slot' : 'Open'}
                    </span>
                  </div>

                  {slotsLeft > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowSubmit(true)}
                      className="ml-auto relative overflow-hidden px-5 py-3 bg-gradient-to-r from-destructive to-destructive/80 text-white flex items-center gap-2 shadow-[0_4px_24px_-4px_hsl(var(--destructive)/0.4)] hover:shadow-[0_4px_32px_-4px_hsl(var(--destructive)/0.6)] transition-all"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                      <Flame className="w-4 h-4 relative z-10" />
                      <span className="text-lg uppercase tracking-wider relative z-10 font-bold" style={teko}>Submit</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══ QUEUE — borderless, gradient bg only ═══ */}
            {allRoundsFull && isLive && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative bg-gradient-to-b from-gold/[0.08] to-transparent p-5 space-y-4 overflow-hidden"
              >
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 bg-gold/10 rounded-full blur-3xl pointer-events-none"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-2xl text-foreground tracking-wider uppercase font-bold flex items-center gap-2" style={teko}>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-5 h-5 text-gold" />
                      </motion.div>
                      Next Round Lobby
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
                      className="text-4xl tabular-nums block font-bold"
                      style={teko}
                    >
                      {queueCount}
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground font-bold">/100 queued</span>
                  </div>
                </div>

                {/* Queue progress bar */}
                <div className="w-full h-2.5 bg-foreground/[0.06] overflow-hidden relative z-10">
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

                {/* Queue avatars */}
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
                    className="w-full relative overflow-hidden py-4 bg-gradient-to-r from-gold via-gold/90 to-gold/80 text-background flex items-center justify-center gap-3 shadow-[0_4px_24px_-4px_rgba(255,215,0,0.3)] hover:shadow-[0_4px_32px_-4px_rgba(255,215,0,0.5)] transition-all relative z-10"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                    <Flame className="w-5 h-5 relative z-10" />
                    <span className="text-xl uppercase tracking-wider relative z-10 font-bold" style={teko}>Join the Queue</span>
                    <ChevronRight className="w-5 h-5 relative z-10" />
                  </motion.button>
                )}
                {queueCount >= 100 && (
                  <div className="text-center relative z-10 space-y-1">
                    <p className="text-base font-bold text-destructive uppercase tracking-widest" style={teko}>
                      🔒 Queue Full — 100/100
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
                className="bg-gold/[0.04] p-4 text-center space-y-2"
              >
                <Video className="w-8 h-8 text-gold mx-auto" />
                <h3 className="text-xl text-gold uppercase tracking-widest font-bold" style={teko}>
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

            {/* Completed rounds — clean divider style */}
            {rounds.filter(r => r.status === 'completed').map((round) => {
              const roundRankings = rankings.filter(rk => rk.round_id === round.id);
              const roundSubmissions = roundSubs(round.id);
              return (
                <div key={round.id} className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gold" />
                    <h3 className="text-lg text-foreground uppercase tracking-wider font-bold" style={teko}>
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
                      className="flex items-center gap-3 p-3 bg-gold/[0.04] hover:bg-gold/[0.08] transition-colors group"
                    >
                      <div className="w-10 h-10 bg-gold/10 flex items-center justify-center shrink-0">
                        <Play className="w-5 h-5 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground" style={teko}>Judge's Ranking Video</p>
                        <p className="text-[9px] text-gold font-bold uppercase tracking-wider">
                          by @{round.judge_username}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
                    </a>
                  )}

                  {/* Rankings — no individual borders */}
                  {roundRankings.length > 0 && (
                    <div className="space-y-px">
                      {roundRankings.map((rk) => {
                        const sub = roundSubmissions.find(s => s.id === rk.submission_id);
                        if (!sub) return null;
                        return (
                          <div
                            key={rk.id}
                            className={`flex items-center gap-3 p-2.5 ${
                              rk.rank === 1 ? 'bg-gold/[0.06]' : 'bg-foreground/[0.02]'
                            }`}
                          >
                            <span className={`text-xl tabular-nums w-8 text-center shrink-0 font-bold ${
                              rk.rank === 1 ? 'text-gold' : rk.rank === 2 ? 'text-foreground' : 'text-muted-foreground'
                            }`} style={teko}>
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
            {isLive && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSubmit(true)}
                className="w-full relative overflow-hidden py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center gap-3 shadow-[0_4px_24px_-4px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_-4px_rgba(16,185,129,0.5)] transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                <Flame className="w-5 h-5 relative z-10" />
                <span className="text-xl uppercase tracking-wider relative z-10 font-bold" style={teko}>Submit Your Edit</span>
                <ChevronRight className="w-5 h-5 relative z-10" />
              </motion.button>
            )}
          </>
        )}

        {/* ─── SOUND — merged single section ─── */}
        {(drop.song_url || drop.song_preview_url) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-destructive/10 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate" style={teko}>{drop.song_name}</p>
                <p className="text-[9px] text-destructive font-bold uppercase tracking-wider">⚡ Use this sound</p>
              </div>
              {drop.song_url && (
                <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 hover:bg-foreground/[0.06] transition-colors">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              {drop.song_preview_url && (
                <button
                  onClick={() => downloadAudio(drop.song_preview_url!, `${drop.song_name || 'preview'}.m4a`)}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-destructive/10 hover:bg-destructive/20 transition-colors"
                  title="Download audio"
                >
                  <Download className="w-3 h-3 text-destructive" />
                  <span className="text-[8px] font-bold text-foreground uppercase tracking-wider">DL</span>
                </button>
              )}
            </div>
            {drop.song_preview_url && (
              <audio src={drop.song_preview_url} controls className="w-full h-9" preload="metadata" />
            )}
          </div>
        )}

        {/* Description — inline toggle */}
        {drop.description && (
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest hover:text-foreground/80 transition-colors"
            style={teko}
          >
            About This Drop
            <ChevronDown className={`w-3 h-3 transition-transform ${showDesc ? 'rotate-180' : ''}`} />
          </button>
        )}
        {showDesc && drop.description && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-muted-foreground leading-relaxed -mt-1"
          >
            {drop.description}
          </motion.p>
        )}

        {/* ═══ ALL SUBMISSIONS — Best Edits ═══ */}
        {!hasRounds && (
          <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl text-foreground flex items-center gap-2 tracking-wider uppercase font-bold" style={teko}>
                  <Trophy className="w-4 h-4 text-gold" />
                  Best Edits
                </h2>
                {drop?.song_name && (
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5 pl-6">
                    for "{drop.song_name}"
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground font-bold tabular-nums" style={teko}>{allSubs.length} {allSubs.length === 1 ? 'Entry' : 'Entries'}</span>
            </div>

            {subsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : allSubs.length === 0 ? (
              <div className="p-8 text-center">
                <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-lg font-bold text-muted-foreground" style={teko}>No Edits Yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to enter & set the bar 🔥</p>
              </div>
            ) : (
              <>
                {/* ── Top Edits Carousel ── */}
                {scored.length > 0 && (
                  <div className="-mx-4">
                    <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
                      {scored.slice(0, 8).map((sub, idx) => (
                        <a
                          key={sub.id}
                          href={sub.submission_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 snap-start w-[140px] group"
                        >
                          <div className={cn(
                            "relative rounded-xl overflow-hidden border transition-all",
                            idx === 0 ? "border-gold/30" : "border-border/30 hover:border-border/60"
                          )}>
                            {/* Thumbnail */}
                            <div className="aspect-[9/12] bg-surface-2 relative">
                              {sub.thumbnail_url ? (
                                <img src={sub.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-surface-2 to-surface-1">
                                  <Video className="w-6 h-6 text-muted-foreground/20" />
                                </div>
                              )}
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                              {/* Rank badge */}
                              <div className={cn(
                                "absolute top-1.5 left-1.5 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-display font-bold",
                                idx === 0 ? "bg-gold text-black" : "bg-black/70 text-foreground/80 border border-border/30"
                              )}>
                                {idx + 1}
                              </div>
                              {/* Play icon */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-8 h-8 text-white drop-shadow-lg" />
                              </div>
                              {/* Bottom info */}
                              <div className="absolute bottom-0 inset-x-0 p-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Avatar className="w-4 h-4 border border-white/20">
                                    <AvatarImage src={sub.avatar_url || ''} />
                                    <AvatarFallback className="text-[6px] bg-surface-2">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-[9px] font-bold text-white truncate">@{sub.username}</span>
                                </div>
                                {sub.qoi_score != null && (
                                  <div className="flex items-center gap-1">
                                    <span className={cn(
                                      "text-sm font-display font-bold leading-none",
                                      (sub.qoi_score || 0) >= 70 ? "text-gold" : "text-white/90"
                                    )}>
                                      {Math.round(sub.qoi_score)}
                                    </span>
                                    <span className="text-[7px] text-white/50 uppercase">QOI</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Full List ── */}
                <div className="space-y-2">
                  {scored.map((sub, idx) => (
                    <DropSubmissionCard key={sub.id} submission={sub} rank={idx + 1} isTopScorer={idx === 0} />
                  ))}
                  {pending.map((sub) => (
                    <DropSubmissionCard key={sub.id} submission={sub} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Round-based submissions — ranked leaderboard */}
        {hasRounds && activeRound && activeRoundSubs.length > 0 && (
          <div className="space-y-1">
            {/* Leaderboard header — lightweight */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-destructive" />
                <h3 className="text-xl text-foreground uppercase tracking-wider leading-none font-bold" style={teko}>
                  Round {activeRound.round_number} Rankings
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              </div>
              <span className="text-sm text-muted-foreground font-bold tabular-nums" style={teko}>
                {activeRoundSubs.length}/{activeRound.max_submissions}
              </span>
            </div>

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

            {slotsLeft > 0 && (
              <div className="flex items-center justify-center gap-2 py-4 opacity-30">
                <span className="text-sm uppercase tracking-wider font-bold" style={teko}>
                  {slotsLeft} {slotsLeft === 1 ? 'slot' : 'slots'} remaining
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══ LIVE CHAT ═══ */}
        <div ref={chatRef}>
          <DropLobbyChat dropId={dropId!} />
        </div>

        {/* Winners (legacy) */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="space-y-2 pt-2">
            <h2 className="text-lg uppercase tracking-widest text-foreground flex items-center gap-2 font-bold" style={teko}>
              <Crown className="w-3.5 h-3.5 text-gold" /> Winners
            </h2>
            {drop.top_scorer_username && (
              <div className="flex items-center gap-3 p-3 bg-gold/[0.06]">
                <Crown className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gold">@{drop.top_scorer_username}</span>
                  <p className="text-[9px] text-muted-foreground">Top Scorer — {Math.round(drop.top_score)} QOI</p>
                </div>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-3 p-3 bg-destructive/[0.04]">
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
