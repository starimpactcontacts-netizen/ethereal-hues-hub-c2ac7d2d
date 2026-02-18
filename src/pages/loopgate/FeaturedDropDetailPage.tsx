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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

  // Fire indicators: count how many users each person beat
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
      {/* Hero / Poster */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden">
          {drop.poster_url ? (
            <img src={drop.poster_url} alt={drop.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
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

        {/* Artist chip */}
        {artist && (
          <Link to={`/artist/${artist.slug}`} className="absolute bottom-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur border border-border rounded-full pl-1 pr-3 py-1">
            <Avatar className="w-6 h-6 border border-purple-500/40">
              <AvatarImage src={artist.avatar_url || ''} />
              <AvatarFallback className="bg-purple-500/20 text-[8px] text-purple-300 font-bold">{artist.name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-foreground">{artist.name}</span>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[7px] px-1 py-0">ARTIST</Badge>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="px-4 space-y-4 mt-4">
        {/* Title & Song */}
        <div>
          <h1 className="font-display text-xl text-foreground tracking-wide">{drop.title}</h1>
        </div>

        {/* ═══ SOUND LINK — big & clear ═══ */}
        {drop.song_url && (
          <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
            className="block bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 hover:bg-purple-500/15 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{drop.song_name}</p>
                <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider mt-0.5">⚡ Post using this sound</p>
              </div>
              <ExternalLink className="w-5 h-5 text-purple-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 leading-snug">Use this exact sound so all edits link to the same track — helps the artist & boosts your reach.</p>
          </a>
        )}

        {/* Song Preview Player — big & proud */}
        {drop.song_preview_url && (
          <div className="bg-surface-1 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">🔊 Song Preview</p>
                <p className="text-[10px] text-muted-foreground truncate">{drop.song_name}</p>
              </div>
            </div>
            <audio
              src={drop.song_preview_url}
              controls
              className="w-full h-10 rounded-lg"
              preload="metadata"
            />
          </div>
        )}

        {/* ═══ HOW TO ENTER — dead simple steps ═══ */}
        {isLive && userSubmissionCount === 0 && (
          <div className="bg-surface-1 border border-purple-500/20 rounded-xl p-4 space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> How To Enter
            </h2>
            <div className="space-y-2.5">
              {[
                { num: '1', icon: '🎧', label: 'Listen to the song', sub: 'Hit play above & vibe with it' },
                { num: '2', icon: '🎬', label: 'Make your edit', sub: 'Use the song in your video edit — any app works' },
                { num: '3', icon: '📱', label: 'Post it', sub: 'Upload to TikTok, Instagram, or YouTube' },
                { num: '4', icon: '🔗', label: 'Submit the link below', sub: 'Paste your post link & you\'re in!' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">{step.num}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">{step.icon} {step.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Rewards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <Zap className="w-4 h-4 text-brand mx-auto mb-1" />
            <span className="text-sm font-bold text-foreground tabular-nums">+{drop.xp_reward}</span>
            <p className="text-[8px] text-muted-foreground uppercase">XP</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <Trophy className="w-4 h-4 text-brand mx-auto mb-1" />
            <span className="text-sm font-bold text-foreground tabular-nums">+{drop.index_reward}</span>
            <p className="text-[8px] text-muted-foreground uppercase">INDEX</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <Gift className="w-4 h-4 text-gold mx-auto mb-1" />
            <span className="text-[10px] font-bold text-foreground truncate block">{drop.mystery_reward_label || '???'}</span>
            <p className="text-[8px] text-muted-foreground uppercase">Mystery</p>
          </div>
        </div>

        {/* Description */}
        {drop.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{drop.description}</p>
        )}

        {/* CTA — always show if live (multiple submissions allowed) */}
        {isLive && (
          <div className="space-y-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-purple-500/20"
            >
              <Flame className="w-4 h-4" />
              {userSubmissionCount > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            {userSubmissionCount > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> {userSubmissionCount} edit{userSubmissionCount > 1 ? 's' : ''} submitted
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Submit as many as you want — keep climbing the leaderboard 🔥
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ EDITS SHOWCASE CAROUSEL ═══ */}
        <DropSubmissionCarousel submissions={submissions} loading={subsLoading} />

        {/* ═══ LEADERBOARD — Top 3 only ═══ */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            {scored.length > 0 ? 'Leaderboard' : 'Submissions'}
            <span className="text-[9px] text-muted-foreground font-normal">({submissions.length} total)</span>
          </h2>

          {subsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-xl p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No submissions yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Be the first to enter & set the bar 🔥</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Show top 3 scored + pending (max 3 pending if no scored) */}
              {scored.slice(0, 3).map((sub, idx) => (
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
              {scored.length < 3 && pending.slice(0, 3 - scored.length).map((sub) => (
                <DropSubmissionCard key={sub.id} submission={sub} />
              ))}
            </div>
          )}

          {/* View Full Leaderboard button */}
          {submissions.length > 3 && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-full py-3 bg-surface-1 border border-border rounded-xl text-xs font-bold text-foreground flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors">
                  <Trophy className="w-3.5 h-3.5 text-gold" />
                  View Full Leaderboard
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[9px] px-1.5 py-0">
                    {submissions.length}
                  </Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] bg-background border-border overflow-hidden flex flex-col">
                <SheetHeader className="shrink-0">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <Trophy className="w-5 h-5 text-gold" />
                    Full Leaderboard
                    <span className="text-xs text-muted-foreground font-normal">({submissions.length} entries)</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto flex-1 space-y-2.5 pb-8 mt-4">
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
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* ═══ LIVE CHAT ═══ */}
        <DropLobbyChat dropId={dropId!} />

        {/* Winner highlights */}
        {(drop.top_scorer_username || drop.random_pick_username) && (
          <div className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" /> Winners
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
