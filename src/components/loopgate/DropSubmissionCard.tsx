import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Crown, Clock, Play, ChevronUp, MessageCircle, ExternalLink
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { FeaturedSubmission } from "@/hooks/useFeaturedDrops";
import FeedComments from "./FeedComments";
import { cn } from "@/lib/utils";

const teko = { fontFamily: 'Teko, sans-serif' };

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

  const scoreColor = (submission.qoi_score || 0) >= 70 ? "text-gold" 
    : (submission.qoi_score || 0) >= 40 ? "text-foreground" 
    : "text-red-400";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (rank || 0) * 0.04, duration: 0.3 }}
      >
        {/* Main clickable row — opens the edit */}
        <a
          href={submission.submission_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-0 rounded-xl overflow-hidden transition-all group",
            isTopScorer
              ? "bg-gradient-to-r from-gold/8 via-gold/4 to-transparent border border-gold/25"
              : isPending
                ? "bg-surface-1/40 border border-border/20"
                : "bg-surface-1 border border-border/40 hover:border-border/70"
          )}
        >
          {/* Rank */}
          <div className={cn(
            "w-12 self-stretch flex items-center justify-center shrink-0",
            isTopScorer && "bg-gold/10"
          )}>
            {rank != null ? (
              <span className={cn(
                "font-display tabular-nums leading-none",
                rank === 1 && "text-2xl text-gold font-bold",
                rank === 2 && "text-xl text-foreground/70 font-bold",
                rank === 3 && "text-xl text-amber-600/70 font-bold",
                rank != null && rank > 3 && "text-lg text-muted-foreground/40"
              )} style={teko}>
                {rank}
              </span>
            ) : (
              <span className="text-muted-foreground/30 text-sm">—</span>
            )}
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 py-3 pr-2">
            <Avatar className={cn(
              "border-2 shrink-0",
              isTopScorer ? "w-10 h-10 border-gold/40" : "w-8 h-8 border-border/30"
            )}>
              <AvatarImage src={submission.avatar_url || ''} />
              <AvatarFallback className="text-[9px] bg-surface-2 font-bold">
                {submission.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "font-bold truncate block",
                  isTopScorer ? "text-sm text-foreground" : "text-xs text-foreground/90"
                )}>
                  {submission.username}
                </span>
                {isTopScorer && <Crown className="w-3.5 h-3.5 text-gold shrink-0" />}
              </div>
              {/* Feedback quote or status */}
              {isScored && submission.feedback ? (
                <p className="text-[9px] text-muted-foreground/60 italic truncate mt-0.5">
                  "{submission.feedback}"
                </p>
              ) : isPending ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-purple-400/60" />
                  <span className="text-[8px] text-purple-400/70 uppercase font-bold tracking-wider">Awaiting Review</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Score + Watch */}
          <div className="flex items-center gap-3 pr-3 shrink-0">
            {isScored && (
              <div className="text-right">
                <span className={cn("text-2xl font-display tabular-nums leading-none", scoreColor)} style={teko}>
                  {Math.round(submission.qoi_score || 0)}
                </span>
                <span className="text-[7px] text-muted-foreground/50 uppercase block tracking-wider">QOI</span>
              </div>
            )}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              "bg-foreground/5 group-hover:bg-foreground/10"
            )}>
              <Play className="w-3.5 h-3.5 text-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </a>

        {/* Micro action bar — only vote arrows + comments, ultra compact */}
        <div className="flex items-center gap-0.5 pl-12 py-1">
          <button
            onClick={() => handleVote('up')}
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all",
              userVote === 'up' ? "text-emerald-400" : "text-muted-foreground/30 hover:text-muted-foreground/60"
            )}
          >
            <ChevronUp className="w-3 h-3" />
            <span className="font-bold tabular-nums">{upvotes}</span>
          </button>
          <button
            onClick={() => handleVote('down')}
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all rotate-180-icon",
              userVote === 'down' ? "text-red-400" : "text-muted-foreground/30 hover:text-muted-foreground/60"
            )}
          >
            <ChevronUp className="w-3 h-3 rotate-180" />
            <span className="font-bold tabular-nums rotate-180-fix">{downvotes}</span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-all ml-auto mr-3"
          >
            <MessageCircle className="w-2.5 h-2.5" />
            <span className="font-bold tabular-nums">{commentCount}</span>
          </button>
        </div>
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
