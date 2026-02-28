import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Clock,
  Flame, ChevronUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";
import FeedComments from "./FeedComments";
import { cn } from "@/lib/utils";

interface Props {
  submission: FeaturedSubmission;
  rank: number;
  totalEntries: number;
}

export default function DropLeaderboardRow({ submission, rank, totalEntries }: Props) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(submission.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState(submission.downvotes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [voting, setVoting] = useState(false);

  const isScored = submission.status === 'scored';
  const isPending = submission.status === 'pending';
  const netScore = upvotes - downvotes;

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
        if (type === 'up') setUpvotes(v => Math.max(0, v - 1));
        else setDownvotes(v => Math.max(0, v - 1));
      } else {
        const prevVote = userVote;
        await supabase.from('featured_submission_votes').upsert({
          submission_id: submission.id, user_id: user.id, vote_type: type,
        }, { onConflict: 'submission_id,user_id' });
        setUserVote(type);
        if (type === 'up') { setUpvotes(v => v + 1); if (prevVote === 'down') setDownvotes(v => Math.max(0, v - 1)); }
        else { setDownvotes(v => v + 1); if (prevVote === 'up') setUpvotes(v => Math.max(0, v - 1)); }
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
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: rank * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "relative group",
          rank === 1 && "mb-1"
        )}
      >
        {/* Main row */}
        <div className={cn(
          "relative flex items-center gap-0 overflow-hidden transition-all duration-300",
          rank === 1 && "bg-gradient-to-r from-gold/8 via-gold/4 to-transparent border border-gold/20",
          rank === 2 && "bg-gradient-to-r from-foreground/[0.04] to-transparent border border-border/60",
          rank === 3 && "bg-gradient-to-r from-amber-700/[0.06] to-transparent border border-border/40",
          rank > 3 && "bg-surface-1/50 border border-border/20 hover:border-border/50 hover:bg-surface-1",
        )}>
          {/* Rank column — bold & dominant */}
          <div className={cn(
            "flex items-center justify-center shrink-0 w-14 sm:w-16 self-stretch",
            rank === 1 && "bg-gold/10",
            rank === 2 && "bg-foreground/[0.03]",
            rank === 3 && "bg-amber-700/[0.06]",
            rank > 3 && "bg-transparent"
          )}>
            <span className={cn(
              "font-display tabular-nums leading-none",
              rank === 1 && "text-3xl sm:text-4xl text-gold",
              rank === 2 && "text-2xl sm:text-3xl text-foreground/70",
              rank === 3 && "text-2xl sm:text-3xl text-amber-600/70",
              rank > 3 && "text-xl text-muted-foreground/40"
            )}>
              {rank}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-3 pr-3">
            {/* User row */}
            <div className="flex items-center gap-2.5">
              <Link to={`/editor/${submission.user_id}`} className="shrink-0">
                <Avatar className={cn(
                  "border-2 transition-all",
                  rank === 1 ? "w-10 h-10 border-gold/40" : "w-8 h-8 border-border/40"
                )}>
                  <AvatarImage src={submission.avatar_url || ''} />
                  <AvatarFallback className="text-[9px] bg-surface-2 font-bold">
                    {submission.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/editor/${submission.user_id}`} className="flex items-center gap-1.5">
                  <span className={cn(
                    "font-bold truncate block",
                    rank === 1 ? "text-sm text-foreground" : "text-xs text-foreground/90"
                  )}>
                    @{submission.username}
                  </span>
                  {rank === 1 && <Flame className="w-3.5 h-3.5 text-gold shrink-0" />}
                </Link>
                <span className="text-[9px] text-muted-foreground/60">
                  {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Score / Status */}
              <div className="shrink-0 text-right">
                {isScored ? (
                  <div>
                    <span className={cn(
                      "text-xl font-display tabular-nums leading-none",
                      (submission.qoi_score || 0) >= 70 ? "text-gold" :
                      (submission.qoi_score || 0) >= 40 ? "text-foreground" : "text-destructive"
                    )}>
                      {Math.round(submission.qoi_score || 0)}
                    </span>
                    <span className="text-[7px] text-muted-foreground/50 uppercase block tracking-wider">QOI</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/15 px-2 py-1 rounded-full">
                    <Clock className="w-2.5 h-2.5 text-purple-400/70" />
                    <span className="text-[8px] font-bold text-purple-400/80 uppercase">Pending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Link preview — compact inline */}
            {submission.submission_url && (
              <a
                href={submission.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 p-2 bg-surface-0/50 border border-border/30 rounded-lg hover:bg-surface-2/60 transition-colors group/link"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-3 h-3 text-purple-400/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-foreground/80 truncate">Watch on {platformLabel}</p>
                  <p className="text-[8px] text-muted-foreground/50 truncate">{submission.submission_url}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover/link:text-purple-400 transition-colors shrink-0" />
              </a>
            )}

            {/* QOI breakdown */}
            {isScored && submission.quality_score != null && (
              <div className="mt-1.5 flex items-center gap-3 text-[8px]">
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground/50 uppercase">Q</span>
                  <span className="font-bold text-foreground/70 tabular-nums">{Math.round(submission.quality_score)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground/50 uppercase">O</span>
                  <span className="font-bold text-foreground/70 tabular-nums">{Math.round(submission.originality_score || 0)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="text-muted-foreground/50 uppercase">I</span>
                  <span className="font-bold text-foreground/70 tabular-nums">{Math.round(submission.impact_score || 0)}</span>
                </div>
                {submission.feedback && (
                  <p className="text-[8px] text-muted-foreground/40 italic truncate flex-1 ml-1">"{submission.feedback}"</p>
                )}
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center mt-2 gap-0.5">
              <button
                onClick={() => handleVote('up')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all",
                  userVote === 'up'
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-muted-foreground/50 hover:bg-surface-2 hover:text-foreground/70"
                )}
              >
                <ChevronUp className={cn("w-3 h-3", userVote === 'up' && "text-emerald-400")} />
                <span className="font-bold tabular-nums">{upvotes}</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all",
                  userVote === 'down'
                    ? "bg-red-500/15 text-red-400"
                    : "text-muted-foreground/50 hover:bg-surface-2 hover:text-foreground/70"
                )}
              >
                <ThumbsDown className={cn("w-2.5 h-2.5", userVote === 'down' && "text-red-400")} />
                <span className="font-bold tabular-nums">{downvotes}</span>
              </button>
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground/50 hover:bg-surface-2 hover:text-foreground/70 transition-all ml-auto"
              >
                <MessageCircle className="w-2.5 h-2.5" />
                <span className="font-bold tabular-nums">{commentCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Connector line between rows */}
        {rank < totalEntries && (
          <div className="absolute -bottom-px left-7 sm:left-8 w-px h-2 bg-border/20" />
        )}
      </motion.div>

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
