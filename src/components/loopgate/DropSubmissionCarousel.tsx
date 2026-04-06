import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Crown, Clock,
  Play, Eye
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";
import { useUnifiedThumbnail, LOOPGATE_PLACEHOLDER } from "@/lib/thumbnail";
import FeedComments from "./FeedComments";
import loopgateLogo from "@/assets/loopgate-logo.png";

// ── Branded fallback when thumbnail fails ──
function BrandedFallback({ username }: { username: string }) {
  // Deterministic gradient from username
  const gradients = [
    "from-purple-900 via-fuchsia-900 to-pink-900",
    "from-indigo-900 via-purple-900 to-violet-900",
    "from-rose-900 via-pink-900 to-fuchsia-900",
    "from-cyan-900 via-teal-900 to-emerald-900",
    "from-amber-900 via-orange-900 to-red-900",
    "from-blue-900 via-indigo-900 to-purple-900",
  ];
  const idx = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradients[idx]} flex flex-col items-center justify-center gap-2`}>
      <img src={loopgateLogo} alt="Loopgate" className="w-10 h-10 opacity-40" />
      <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">@{username}</span>
    </div>
  );
}

// ── Single carousel card ──
function SubmissionShowcaseCard({ submission, rank, isTopScorer }: {
  submission: FeaturedSubmission;
  rank?: number;
  isTopScorer?: boolean;
}) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(submission.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState(submission.downvotes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [voting, setVoting] = useState(false);

  const thumb = useUnifiedThumbnail(submission.submission_url, submission.platform);
  const isScored = submission.status === 'scored';
  const isPending = submission.status === 'pending';
  const thumbFailed = thumb.status === 'error';

  useEffect(() => {
    const fetchMeta = async () => {
      const { count } = await supabase
        .from('feed_comments')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', submission.id)
        .eq('submission_type', 'featured_submission')
        .is('parent_id', null);
      setCommentCount(count || 0);

      if (!user) return;
      const { data } = await supabase
        .from('featured_submission_votes')
        .select('vote_type')
        .eq('submission_id', submission.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setUserVote(data.vote_type as 'up' | 'down');
    };
    fetchMeta();
  }, [submission.id, user]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) { toast.error("Log in to vote"); return; }
    if (voting) return;
    setVoting(true);
    try {
      if (userVote === type) {
        await supabase.from('featured_submission_votes').delete()
          .eq('submission_id', submission.id).eq('user_id', user.id);
        setUserVote(null);
        type === 'up' ? setUpvotes(v => Math.max(0, v - 1)) : setDownvotes(v => Math.max(0, v - 1));
      } else {
        const prev = userVote;
        await supabase.from('featured_submission_votes').upsert({
          submission_id: submission.id, user_id: user.id, vote_type: type,
        }, { onConflict: 'submission_id,user_id' });
        setUserVote(type);
        if (type === 'up') { setUpvotes(v => v + 1); if (prev === 'down') setDownvotes(v => Math.max(0, v - 1)); }
        else { setDownvotes(v => v + 1); if (prev === 'up') setUpvotes(v => Math.max(0, v - 1)); }
      }
    } catch { toast.error("Vote failed"); }
    setVoting(false);
  };

  const platformLabel = submission.platform === 'tiktok' ? 'TikTok'
    : submission.platform === 'youtube' ? 'YouTube'
    : submission.platform === 'instagram' ? 'Instagram'
    : submission.platform;

  return (
    <>
      <div className="w-[280px] shrink-0 snap-start rounded-xl border border-border/60 bg-surface-1 overflow-hidden">
        {/* ── Thumbnail ── */}
        <a
          href={submission.submission_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-[16/9] w-full overflow-hidden bg-surface-2 group"
        >
          {thumbFailed ? (
            <BrandedFallback username={submission.username} />
          ) : (
            <img
              src={thumb.url}
              alt={`@${submission.username}'s edit`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.querySelector('.fallback-wrap')?.classList.remove('hidden');
              }}
            />
          )}
          {/* Hidden fallback for img error */}
          <div className="fallback-wrap hidden absolute inset-0">
            <BrandedFallback username={submission.username} />
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>

          {/* Platform badge */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
            {platformLabel}
          </div>

          {/* Rank badge */}
          {rank != null && (
            <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              rank === 1
                ? 'bg-gold text-background shadow-lg shadow-gold/30'
                : rank <= 3
                ? 'bg-foreground/90 text-background'
                : 'bg-black/60 backdrop-blur-sm text-white'
            }`}>
              {rank === 1 ? <Crown className="w-3.5 h-3.5" /> : `#${rank}`}
            </div>
          )}

          {/* Pending badge */}
          {isPending && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple-500/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5 text-white" />
              <span className="text-[8px] font-bold text-white uppercase">Pending</span>
            </div>
          )}

          {/* QOI score overlay */}
          {isScored && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
              <span className={`text-base font-bold tabular-nums ${
                (submission.qoi_score || 0) >= 70 ? 'text-gold' : (submission.qoi_score || 0) >= 40 ? 'text-white' : 'text-red-400'
              }`}>
                {Math.round(submission.qoi_score || 0)}
              </span>
              <span className="text-[7px] text-white/60 uppercase">QOI</span>
            </div>
          )}
        </a>

        {/* ── User info ── */}
        <div className="p-3 pb-2">
          <Link to={`/editor/${submission.user_id}`} className="flex items-center gap-2">
            <Avatar className="w-7 h-7 border border-border">
              <AvatarImage src={submission.avatar_url || ''} />
              <AvatarFallback className="text-[8px] bg-surface-2 font-bold">
                {submission.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground truncate block">@{submission.username}</span>
              <span className="text-[9px] text-muted-foreground">
                {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
              </span>
            </div>
          </Link>

          {/* Judge feedback snippet */}
          {isScored && submission.feedback && (
            <p className="text-[9px] text-muted-foreground italic mt-1.5 line-clamp-2">
              "{submission.feedback}"
            </p>
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center border-t border-border/40 px-2 py-1.5 gap-0.5">
          <button
            onClick={() => handleVote('up')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
              userVote === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted-foreground hover:bg-surface-2'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${userVote === 'up' ? 'fill-current' : ''}`} />
            <span className="font-bold tabular-nums">{upvotes}</span>
          </button>
          <button
            onClick={() => handleVote('down')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
              userVote === 'down' ? 'bg-red-500/15 text-red-400' : 'text-muted-foreground hover:bg-surface-2'
            }`}
          >
            <ThumbsDown className={`w-3 h-3 ${userVote === 'down' ? 'fill-current' : ''}`} />
            <span className="font-bold tabular-nums">{downvotes}</span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:bg-surface-2 transition-colors ml-auto"
          >
            <MessageCircle className="w-3 h-3" />
            <span className="font-bold tabular-nums">{commentCount}</span>
          </button>
          <a
            href={submission.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-muted-foreground hover:bg-surface-2 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <FeedComments
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        submissionId={submission.id}
        submissionType="featured_submission"
        username={submission.username}
      />
    </>
  );
}

// ── Main carousel ──
interface Props {
  submissions: FeaturedSubmission[];
  loading: boolean;
}

export default function DropSubmissionCarousel({ submissions, loading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scored = submissions.filter(s => s.status === 'scored').sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = submissions.filter(s => s.status === 'pending');
  const all = [...scored, ...pending];

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="w-[280px] shrink-0 rounded-xl bg-surface-1 border border-border/40 overflow-hidden">
              <div className="aspect-[16/9] bg-surface-2 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-24 bg-surface-2 rounded animate-pulse" />
                <div className="h-2 w-16 bg-surface-2 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (all.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          Edits
          <span className="text-[9px] font-normal">({all.length})</span>
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 pl-4"
      >
        {scored.map((sub, idx) => (
          <SubmissionShowcaseCard
            key={sub.id}
            submission={sub}
            rank={idx + 1}
            isTopScorer={idx === 0}
          />
        ))}
        {pending.map((sub) => (
          <SubmissionShowcaseCard key={sub.id} submission={sub} />
        ))}
      </div>
    </div>
  );
}
