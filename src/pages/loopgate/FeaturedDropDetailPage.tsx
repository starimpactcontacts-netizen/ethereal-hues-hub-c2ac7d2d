import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Music, ExternalLink, Flame, Trophy, Crown, Star,
  Zap, Gift, Send, ChevronRight, Users, Clock, Eye, Share2, Check, Copy,
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
          <Link to="/arena" className="text-purple-400 text-xs mt-2 block">← Back to Arena</Link>
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
  const allRanked = [...scored, ...pending];

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
      {/* ═══ HERO ═══ */}
      <div className="relative">
        <div className="h-52 w-full overflow-hidden">
          {drop.poster_url ? (
            <img src={drop.poster_url} alt={drop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        {/* Nav */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 bg-background/80 backdrop-blur border border-border rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1 bg-emerald-500/90 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white uppercase">Live</span>
              </div>
            )}
            {isJudging && (
              <div className="flex items-center gap-1 bg-amber-500/90 px-2.5 py-1 rounded-full animate-pulse">
                <span className="text-[9px] font-bold text-background uppercase">⚡ Judging</span>
              </div>
            )}
            <button onClick={handleShare} className="p-2 bg-background/80 backdrop-blur border border-border rounded-full">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Title + Artist overlaid at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="font-display text-xl text-foreground tracking-wide leading-tight">{drop.title}</h1>
          {artist && (
            <Link to={`/artist/${artist.slug}`} className="inline-flex items-center gap-1.5 mt-1.5">
              <Avatar className="w-5 h-5 border border-purple-500/40">
                <AvatarImage src={artist.avatar_url || ''} />
                <AvatarFallback className="bg-purple-500/20 text-[7px] text-purple-300 font-bold">{artist.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-bold text-foreground/80">{artist.name}</span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[7px] px-1 py-0">ARTIST</Badge>
            </Link>
          )}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="px-4 space-y-3 mt-3">

        {/* ─── SUBMIT CTA ─── */}
        {isLive && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
            className="w-full py-4 bg-emerald-500 text-white font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors"
          >
            <Flame className="w-5 h-5" />
            {userSubmissionCount > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
        {isLive && userSubmissionCount > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-center">
            <p className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" /> {userSubmissionCount} edit{userSubmissionCount > 1 ? 's' : ''} submitted — keep climbing 🔥
            </p>
          </div>
        )}

        {/* ─── SONG + REWARDS — compact row ─── */}
        <div className="flex gap-2">
          {/* Song link — takes most space */}
          {drop.song_url && (
            <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center gap-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl px-3 py-2.5 hover:bg-purple-500/15 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{drop.song_name}</p>
                <p className="text-[9px] text-purple-400 font-medium uppercase tracking-wider">⚡ Use this sound</p>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )}
          {/* Rewards — compact chips */}
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border rounded-lg px-2 py-1.5">
              <Zap className="w-3 h-3 text-brand" />
              <span className="text-[10px] font-bold text-foreground tabular-nums">+{drop.xp_reward}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border rounded-lg px-2 py-1.5">
              <Trophy className="w-3 h-3 text-brand" />
              <span className="text-[10px] font-bold text-foreground tabular-nums">+{drop.index_reward}</span>
            </div>
          </div>
        </div>

        {/* Song Preview Player */}
        {drop.song_preview_url && (
          <div className="bg-surface-1 border border-purple-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-foreground truncate">🔊 Preview</p>
                <p className="text-[9px] text-muted-foreground truncate">{drop.song_name}</p>
              </div>
            </div>
            <audio
              src={drop.song_preview_url}
              controls
              className="w-full h-9 rounded-lg"
              preload="metadata"
            />
          </div>
        )}

        {/* ─── HOW TO JOIN — collapsible ─── */}
        {isLive && (
          <div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500/15 transition-colors"
            >
              <Zap className="w-3 h-3" />
              How Do I Join?
              <ChevronDown className={`w-3 h-3 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 bg-surface-1 border border-purple-500/20 rounded-xl p-3 space-y-2"
              >
                {[
                  { num: '1', text: '🎧 Listen to the song & vibe with it' },
                  { num: '2', text: '🎬 Make a fire edit — any app works' },
                  { num: '3', text: '📱 Post on TikTok, IG, or YouTube' },
                  { num: '4', text: '🔗 Come back & paste the link' },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-purple-400">{step.num}</span>
                    </div>
                    <p className="text-[10px] font-medium text-foreground">{step.text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Lobby Header — live avatars + countdown */}
        <CompLobbyHeader
          participantTable="featured_submissions"
          filterColumn="drop_id"
          filterId={dropId!}
          deadline={drop.ends_at}
          totalEntries={drop.submission_count}
          accentColor="text-purple-400"
        />

        {/* Description — collapsible */}
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

        {/* ═══ EDITS SHOWCASE CAROUSEL ═══ */}
        <DropSubmissionCarousel submissions={submissions} loading={subsLoading} />

        {/* ═══ LEADERBOARD — always inline, full ═══ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              {scored.length > 0 ? 'Leaderboard' : 'Submissions'}
            </h2>
            <span className="text-[10px] text-muted-foreground tabular-nums">{submissions.length} {submissions.length === 1 ? 'entry' : 'entries'}</span>
          </div>

          {subsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-xl p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No submissions yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to enter & set the bar 🔥</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Scored entries first, then pending */}
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
                  <DropSubmissionCard
                    submission={sub}
                    rank={idx + 1}
                    isTopScorer={idx === 0}
                  />
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
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-gold" /> Winners
            </h2>
            {drop.top_scorer_username && (
              <div className="flex items-center gap-3 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                <Crown className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <span className="text-xs font-bold text-gold">@{drop.top_scorer_username}</span>
                  <p className="text-[9px] text-muted-foreground">Top Scorer — {Math.round(drop.top_score)} QOI</p>
                </div>
              </div>
            )}
            {drop.random_pick_username && (
              <div className="flex items-center gap-3 p-3 bg-brand/10 border border-brand/30 rounded-lg">
                <Star className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <span className="text-xs font-bold text-brand">@{drop.random_pick_username}</span>
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
