import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Music, ExternalLink, Flame, Trophy, Crown, Star,
  Zap, Gift, Send, ChevronRight, Users, Clock, Eye, Share2, Check, Copy
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDropSubmissions } from "@/hooks/useFeaturedDrops";
import type { FeaturedDrop, FeaturedArtist } from "@/hooks/useFeaturedDrops";
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
  const userSubmitted = user ? submissions.some(s => s.user_id === user.id) : false;

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
          <div className="flex items-center gap-2 mt-1">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-muted-foreground">{drop.song_name}</span>
            {drop.song_url && (
              <a href={drop.song_url} target="_blank" rel="noopener noreferrer"
                className="text-purple-400 text-[10px] flex items-center gap-0.5 hover:underline">
                <ExternalLink className="w-3 h-3" /> Listen
              </a>
            )}
          </div>
        </div>

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

        {/* CTA */}
        {isLive && !userSubmitted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => profile ? setShowSubmit(true) : navigate('/start')}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-purple-500/20"
          >
            <Flame className="w-4 h-4" />
            Submit Your Edit
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
        {userSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
            <p className="text-sm text-emerald-400 font-medium flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> Your edit is submitted!
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Waiting for QOI score from a judge.</p>
          </div>
        )}

        {/* ═══ LEADERBOARD ═══ */}
        <div className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            {scored.length > 0 ? 'Leaderboard' : 'Submissions'}
            <span className="text-[9px] text-muted-foreground font-normal">({submissions.length} total)</span>
          </h2>

          {subsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-surface-1 border border-border rounded-lg p-6 text-center">
              <Flame className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No submissions yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Scored entries */}
              {scored.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    idx === 0
                      ? 'bg-gold/10 border-gold/40 shadow-[0_0_20px_-4px_rgba(255,215,0,0.15)]'
                      : idx === 1
                      ? 'bg-surface-1 border-border/60'
                      : 'bg-surface-0 border-border/40'
                  }`}
                >
                  <span className={`text-sm font-bold tabular-nums w-6 text-center shrink-0 ${
                    idx === 0 ? 'text-gold' : idx === 1 ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    #{idx + 1}
                  </span>
                  <Link to={`/editor/${sub.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={sub.avatar_url || ''} />
                      <AvatarFallback className="text-[9px] bg-surface-2 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground truncate block">@{sub.username}</span>
                      <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>
                    </div>
                  </Link>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className={`text-sm font-bold tabular-nums ${
                        (sub.qoi_score || 0) >= 70 ? 'text-gold' : (sub.qoi_score || 0) >= 40 ? 'text-foreground' : 'text-red-400'
                      }`}>
                        {Math.round(sub.qoi_score || 0)}
                      </span>
                      <span className="text-[8px] text-muted-foreground ml-0.5">QOI</span>
                    </div>
                    {idx === 0 && <Crown className="w-4 h-4 text-gold" />}
                  </div>
                  {sub.submission_url && (
                    <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-md bg-surface-2 border border-border hover:bg-surface-1 transition-colors">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </motion.div>
              ))}

              {/* Pending entries */}
              {pending.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-0 border border-border/30">
                  <span className="text-sm font-bold tabular-nums w-6 text-center text-muted-foreground/40 shrink-0">—</span>
                  <Link to={`/editor/${sub.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className="w-8 h-8 border border-border opacity-70">
                      <AvatarImage src={sub.avatar_url || ''} />
                      <AvatarFallback className="text-[9px] bg-surface-2 font-bold">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground/70 truncate block">@{sub.username}</span>
                      <span className="text-[9px] text-muted-foreground">Awaiting score</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5 text-purple-400" />
                    <span className="text-[8px] font-bold text-purple-400 uppercase">Pending</span>
                  </div>
                  {sub.submission_url && (
                    <a href={sub.submission_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-md bg-surface-2 border border-border hover:bg-surface-1 transition-colors">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </div>
              ))}
            </div>
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
