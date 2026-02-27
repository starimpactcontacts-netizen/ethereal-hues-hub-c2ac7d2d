import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Music, ExternalLink, Flame, Trophy, Crown, Star,
  Zap, Gift, Send, ChevronRight, Users, Clock, Eye, Share2, Check,
  TrendingUp, ChevronDown
} from "lucide-react";
import DropSubmissionCard from "@/components/loopgate/DropSubmissionCard";
import DropSubmissionCarousel from "@/components/loopgate/DropSubmissionCarousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDropSubmissions } from "@/hooks/useFeaturedDrops";
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
  const [showGuide, setShowGuide] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const { submissions, loading: subsLoading } = useDropSubmissions(dropId || null);

  useEffect(() => {
    if (!dropId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('*, featured_artists(*)')
        .eq('id', dropId)
        .single();

      if (data) {
        setDrop({ ...data, artist: (data as any).featured_artists } as FeaturedDrop);
        setArtist((data as any).featured_artists as FeaturedArtist);
      }
      setLoading(false);
    };
    fetch();
  }, [dropId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
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
  const scored = submissions.filter(s => s.status === 'scored').sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = submissions.filter(s => s.status === 'pending');
  const userSubmissions = user ? submissions.filter(s => s.user_id === user.id) : [];
  const userSubmissionCount = userSubmissions.length;

  const getFireIndicator = (sub: FeaturedSubmission, rank: number) => {
    if (rank === 1 && scored.length >= 3) return { label: '🔥 TAKING OVER', color: 'text-orange-400' };
    if (rank <= 3 && scored.length >= 5) return { label: '⚡ ON FIRE', color: 'text-amber-400' };
    return null;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/drop/${dropId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: drop.title, text: `Join "${drop.title}" on Loopgate!`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
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
            <button onClick={handleShare} className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-foreground" />}
            </button>
          </div>
        </div>

        {/* Title + Artist — bottom of hero */}
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

        {/* ─── SUBMIT CTA — aggressive, red-tinted glow ─── */}
        {isLive && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-display text-base uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_24px_-4px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_-4px_rgba(16,185,129,0.5)] transition-all"
          >
            <Flame className="w-5 h-5" />
            {userSubmissionCount > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
        {isLive && userSubmissionCount > 0 && (
          <div className="bg-emerald-500/8 border border-emerald-500/20 px-3 py-2 text-center">
            <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> {userSubmissionCount} submitted — keep stacking 🔥
            </p>
          </div>
        )}

        {/* ─── SOUND + REWARDS — tight row ─── */}
        <div className="flex gap-2">
          {drop.song_url ? (
            <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center gap-2.5 bg-surface-1 border border-border hover:border-gold/30 px-3 py-2.5 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{drop.song_name}</p>
                <p className="text-[9px] text-gold font-bold uppercase tracking-wider">⚡ Use this sound</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
            </a>
          ) : (
            <div className="flex-1" />
          )}
          {/* Reward chips */}
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border px-2.5 py-1.5">
              <Zap className="w-3 h-3 text-gold" />
              <span className="text-[10px] font-bold text-foreground tabular-nums">+{drop.xp_reward}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border px-2.5 py-1.5">
              <Trophy className="w-3 h-3 text-gold" />
              <span className="text-[10px] font-bold text-foreground tabular-nums">+{drop.index_reward}</span>
            </div>
          </div>
        </div>

        {/* Song Preview */}
        {drop.song_preview_url && (
          <div className="bg-surface-1 border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-foreground truncate">🔊 Preview</p>
                <p className="text-[9px] text-muted-foreground truncate">{drop.song_name}</p>
              </div>
            </div>
            <audio src={drop.song_preview_url} controls className="w-full h-9" preload="metadata" />
          </div>
        )}

        {/* ─── HOW TO JOIN ─── */}
        {isLive && (
          <div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full py-2 bg-surface-1 border border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2 hover:text-foreground hover:border-gold/30 transition-colors"
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

        {/* Lobby — avatars + countdown */}
        <CompLobbyHeader
          participantTable="featured_submissions"
          filterColumn="drop_id"
          filterId={dropId!}
          deadline={drop.ends_at}
          totalEntries={drop.submission_count}
          accentColor="text-gold"
        />

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

        {/* ═══ EDITS SHOWCASE ═══ */}
        <DropSubmissionCarousel submissions={submissions} loading={subsLoading} />

        {/* ═══ LEADERBOARD — inline, full ═══ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2 tracking-wide">
              <Trophy className="w-4 h-4 text-gold" />
              {scored.length > 0 ? 'LEADERBOARD' : 'SUBMISSIONS'}
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold tabular-nums">{submissions.length} {submissions.length === 1 ? 'ENTRY' : 'ENTRIES'}</span>
          </div>

          {subsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-surface-1 border border-border p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No submissions yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to enter & set the bar 🔥</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scored.map((sub, idx) => (
                <div key={sub.id} className="relative">
                  {getFireIndicator(sub, idx + 1) && (
                    <div className={`flex items-center gap-1 mb-1 ${getFireIndicator(sub, idx + 1)!.color}`}>
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {getFireIndicator(sub, idx + 1)!.label}
                      </span>
                    </div>
                  )}
                  <DropSubmissionCard submission={sub} rank={idx + 1} isTopScorer={idx === 0} />
                </div>
              ))}
              {pending.map((sub) => (
                <DropSubmissionCard key={sub.id} submission={sub} />
              ))}
            </div>
          )}
        </div>

        {/* ═══ LIVE CHAT ═══ */}
        <DropLobbyChat dropId={dropId!} />

        {/* Winner highlights */}
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
        <FeaturedSubmitModal drop={drop} onClose={() => setShowSubmit(false)} />
      )}
    </div>
  );
}
