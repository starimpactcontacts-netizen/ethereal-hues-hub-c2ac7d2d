import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Crown, Clock,
  ChevronDown, ChevronUp, Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";
import FeedComments from "./FeedComments";

interface Props {
  submission: FeaturedSubmission;
  rank?: number;
  isTopScorer?: boolean;
}

export default function DropSubmissionCard({ submission, rank, isTopScorer }: Props) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(submission.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState(submission.downvotes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [voting, setVoting] = useState(false);

  const isScored = submission.status === 'scored';
  const isPending = submission.status === 'pending';

  // Fetch user's existing vote + comment count
  useEffect(() => {
    const fetchMeta = async () => {
      // Comment count
      const { count } = await supabase
        .from('feed_comments')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', submission.id)
        .eq('submission_type', 'featured_submission')
        .is('parent_id', null);
      setCommentCount(count || 0);

      if (!user) return;
      // User vote
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
        // Remove vote
        await supabase
          .from('featured_submission_votes')
          .delete()
          .eq('submission_id', submission.id)
          .eq('user_id', user.id);
        setUserVote(null);
        if (type === 'up') setUpvotes(v => Math.max(0, v - 1));
        else setDownvotes(v => Math.max(0, v - 1));
      } else {
        // Upsert vote
        const prevVote = userVote;
        await supabase
          .from('featured_submission_votes')
          .upsert({
            submission_id: submission.id,
            user_id: user.id,
            vote_type: type,
          }, { onConflict: 'submission_id,user_id' });
        setUserVote(type);
        if (type === 'up') {
          setUpvotes(v => v + 1);
          if (prevVote === 'down') setDownvotes(v => Math.max(0, v - 1));
        } else {
          setDownvotes(v => v + 1);
          if (prevVote === 'up') setUpvotes(v => Math.max(0, v - 1));
        }
      }
    } catch {
      toast.error("Vote failed");
    }
    setVoting(false);
  };

  // Detect platform for nice label
  const platformLabel = submission.platform === 'tiktok' ? 'TikTok'
    : submission.platform === 'youtube' ? 'YouTube'
    : submission.platform === 'instagram' ? 'Instagram'
    : submission.platform;

  const netScore = upvotes - downvotes;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border overflow-hidden transition-colors ${
          isTopScorer
            ? 'bg-gold/5 border-gold/30 shadow-[0_0_24px_-6px_rgba(255,215,0,0.12)]'
            : 'bg-surface-1 border-border/60'
        }`}
      >
        {/* Header — user info + rank */}
        <div className="flex items-center gap-3 p-3 pb-2">
          {rank != null && (
            <span className={`text-sm font-bold tabular-nums w-6 text-center shrink-0 ${
              rank === 1 ? 'text-gold' : rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              #{rank}
            </span>
          )}
          {!rank && isPending && (
            <span className="text-sm w-6 text-center text-muted-foreground/40 shrink-0">—</span>
          )}
          <Link to={`/editor/${submission.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 border border-border">
              <AvatarImage src={submission.avatar_url || ''} />
              <AvatarFallback className="text-[9px] bg-surface-2 font-bold">
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
          {isTopScorer && <Crown className="w-4 h-4 text-gold shrink-0" />}
          {isScored && (
            <div className="text-right shrink-0">
              <span className={`text-lg font-bold tabular-nums ${
                (submission.qoi_score || 0) >= 70 ? 'text-gold' : (submission.qoi_score || 0) >= 40 ? 'text-foreground' : 'text-red-400'
              }`}>
                {Math.round(submission.qoi_score || 0)}
              </span>
              <span className="text-[8px] text-muted-foreground ml-0.5 uppercase">QOI</span>
            </div>
          )}
          {isPending && (
            <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full shrink-0">
              <Clock className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-[8px] font-bold text-purple-400 uppercase">Pending</span>
            </div>
          )}
        </div>

        {/* Link preview card */}
        {submission.submission_url && (
          <a
            href={submission.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-3 mb-2 flex items-center gap-3 p-3 bg-surface-0 border border-border/50 rounded-lg hover:bg-surface-2 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">Watch on {platformLabel}</p>
              <p className="text-[9px] text-muted-foreground truncate">{submission.submission_url}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
          </a>
        )}

        {/* QOI breakdown (if scored) */}
        {isScored && submission.quality_score != null && (
          <div className="mx-3 mb-2 flex items-center gap-3 text-[9px]">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase">Q</span>
              <span className="font-bold text-foreground tabular-nums">{Math.round(submission.quality_score)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase">O</span>
              <span className="font-bold text-foreground tabular-nums">{Math.round(submission.originality_score || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase">I</span>
              <span className="font-bold text-foreground tabular-nums">{Math.round(submission.impact_score || 0)}</span>
            </div>
            {submission.feedback && (
              <p className="text-[9px] text-muted-foreground italic truncate flex-1 ml-2">"{submission.feedback}"</p>
            )}
          </div>
        )}

        {/* Action bar — vote + comment */}
        <div className="flex items-center border-t border-border/40 px-3 py-2 gap-1">
          {/* Upvote */}
          <button
            onClick={() => handleVote('up')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              userVote === 'up'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${userVote === 'up' ? 'fill-current' : ''}`} />
            <span className="font-bold tabular-nums">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('down')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              userVote === 'down'
                ? 'bg-red-500/15 text-red-400'
                : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${userVote === 'down' ? 'fill-current' : ''}`} />
            <span className="font-bold tabular-nums">{downvotes}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors ml-auto"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="font-bold tabular-nums">{commentCount}</span>
          </button>
        </div>
      </motion.div>

      {/* Comments sheet */}
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
