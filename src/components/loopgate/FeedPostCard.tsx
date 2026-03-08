import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Trophy, ArrowUp, Link2, MoreHorizontal, Swords, X } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { FeedPostItem } from "@/hooks/useFeedPosts";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import RichMessageContent from "./RichMessageContent";
import LoopReactions from "./LoopReactions";
import { useState, memo } from "react";
import { ReactionGroup } from "@/hooks/useLoopReactions";
import { createBattle } from "@/hooks/useBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedPostCardProps {
  post: FeedPostItem;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onDelete: (postId: string) => void;
  reactions?: ReactionGroup[];
  onToggleReaction?: (postId: string, emoji: string) => void;
}

function getLeagueBadge(league?: string) {
  if (league === 'elite') return { label: 'ELITE', cls: 'text-gold bg-gold/10 border-gold/30' };
  if (league === 'pro') return { label: 'PRO', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  return null;
}

function getPostTypeIndicator(type: string) {
  switch (type) {
    case 'flex': return { icon: <GateIcon className="w-3 h-3 text-gold" />, label: 'FLEX' };
    case 'edit_share': return { icon: <Link2 className="w-3 h-3 text-primary" />, label: 'EDIT' };
    case 'milestone': return { icon: <Trophy className="w-3 h-3 text-gold" />, label: 'MILESTONE' };
    default: return null;
  }
}

const FeedPostCard = memo(function FeedPostCard({ post, isLiked, isBookmarked, onLike, onBookmark, onDelete, reactions, onToggleReaction }: FeedPostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showChallengeConfirm, setShowChallengeConfirm] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const isOwn = user?.id === post.user_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    .replace(' ago', '')
    .replace('about ', '')
    .replace('less than a minute', 'now');

  const leagueBadge = getLeagueBadge(post.league);
  const typeIndicator = getPostTypeIndicator(post.post_type);

  const handleShare = () => {
    navigator.share?.({ text: post.content, url: window.location.href });
  };

  const urlMatch = post.media_url || post.content.match(/https?:\/\/[^\s]+/)?.[0];
  const hasUploadedMedia = !!post.uploaded_media_url;
  const isUploadedVideo = hasUploadedMedia && post.uploaded_media_type === 'video';

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`border-b border-border/30 hover:bg-muted/5 transition-colors ${
        post.is_system ? 'bg-gold/[0.02]' : ''
      }`}
    >
      <div className="px-3 pt-2.5 pb-1.5">
        {/* System post indicator */}
        {post.is_system && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-11">
            <ArrowUp className="w-3 h-3 text-gold" />
            <span className="text-[11px] font-semibold text-gold">Platform Update</span>
          </div>
        )}

        <div className="flex gap-2.5">
          {/* Avatar */}
          <button onClick={() => navigate(`/editor/${post.user_id}`)} className="shrink-0 mt-0.5">
            <Avatar className="w-9 h-9 border border-border/50">
              <AvatarImage src={post.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
                {(post.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex items-center gap-1 mb-0.5">
              <button
                onClick={() => navigate(`/editor/${post.user_id}`)}
                className="font-bold text-foreground text-[12px] hover:underline truncate"
              >
                {post.username}
              </button>
              {post.is_verified && <VerifiedBadge size="sm" />}
              {leagueBadge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${leagueBadge.cls}`}>
                  {leagueBadge.label}
                </span>
              )}
              {post.global_index_score != null && post.global_index_score > 0 && (
                <span className="text-[9px] font-bold text-gold">
                  IDX {Math.round(post.global_index_score)}
                </span>
              )}
              <span className="text-muted-foreground text-[11px]">·</span>
              <span className="text-muted-foreground text-[11px] shrink-0">{timeAgo}</span>

              {/* Menu */}
              {isOwn && (
                <div className="ml-auto relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded hover:bg-muted/30">
                    <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                      <button
                        onClick={() => { onDelete(post.id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-red-400 hover:bg-muted/30 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Type badge */}
            {typeIndicator && (
              <div className="flex items-center gap-1 mb-1">
                {typeIndicator.icon}
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{typeIndicator.label}</span>
              </div>
            )}

            {/* Post content */}
            <div className="text-[14px] text-foreground leading-snug whitespace-pre-wrap break-words">
              <RichMessageContent content={post.content} showLinkPreviews={false} />
            </div>

            {/* Uploaded media */}
            {hasUploadedMedia && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border/20 max-w-full">
                {isUploadedVideo ? (
                  <video
                    src={post.uploaded_media_url!}
                    className="w-full max-h-[360px] object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={post.uploaded_media_url!}
                    alt="Loop media"
                    className="w-full max-h-[360px] object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            )}

            {/* Media link preview */}
            {post.media_url && !hasUploadedMedia && (
              <a
                href={post.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] text-primary truncate">{post.media_url}</span>
                </div>
              </a>
            )}

            {/* Emoji Reactions */}
            {reactions && reactions.length > 0 && onToggleReaction && (
              <LoopReactions
                reactions={reactions}
                onToggle={(emoji) => onToggleReaction(post.id, emoji)}
              />
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-2 -ml-2 max-w-[320px]">
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors group">
                <MessageCircle className="w-[15px] h-[15px]" />
                {post.comment_count > 0 && <span className="text-[11px]">{post.comment_count}</span>}
              </button>

              <button
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors group ${
                  isLiked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Heart className="w-[15px] h-[15px]" fill={isLiked ? 'currentColor' : 'none'} />
                {post.like_count > 0 && <span className="text-[11px]">{post.like_count}</span>}
              </button>

              <button
                onClick={() => onBookmark(post.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors group ${
                  isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Bookmark className="w-[15px] h-[15px]" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Share2 className="w-[15px] h-[15px]" />
              </button>

              {/* Challenge from post — Red/Blue gradient swords */}
              {!isOwn && !post.is_system && user && (
                <button
                  onClick={() => setShowChallengeConfirm(true)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full hover:bg-gradient-to-r hover:from-red-500/15 hover:to-blue-500/15 transition-colors group"
                  title="Challenge this editor to a 1v1"
                >
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id={`swords-grad-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <line x1="14.5" y1="17.5" x2="3" y2="6" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="13" y1="19" x2="7" y2="13" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="16" y1="14" x2="18" y2="12" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="9.5" y1="6.5" x2="21" y2="18" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="11" y1="5" x2="17" y2="11" stroke={`url(#swords-grad-${post.id})`} />
                    <line x1="8" y1="10" x2="6" y2="12" stroke={`url(#swords-grad-${post.id})`} />
                  </svg>
                </button>
              )}

              {/* 1v1 Challenge Confirmation Modal */}
              <AnimatePresence>
                {showChallengeConfirm && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                      onClick={() => setShowChallengeConfirm(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
                    >
                      <div className="bg-background border border-border/50 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                        {/* Header — red-to-blue gradient */}
                        <div className="relative bg-gradient-to-r from-red-950/60 to-blue-950/60 p-4 border-b border-border/30">
                          <button onClick={() => setShowChallengeConfirm(false)} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <div className="flex items-center gap-2 mb-1">
                            <Swords className="w-5 h-5 text-red-400" />
                            <h3 className="font-display text-lg text-foreground uppercase tracking-wide">1v1 Edit Battle</h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground">You're about to challenge another editor</p>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* VS display */}
                          <div className="flex items-center justify-center gap-4 py-2">
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">You</p>
                              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                <span className="font-display text-sm text-red-400">⚔️</span>
                              </div>
                            </div>
                            <span className="font-display text-xl text-muted-foreground/40">VS</span>
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Opponent</p>
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto overflow-hidden">
                                {post.avatar_url ? (
                                  <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-display text-sm text-blue-400">{post.username?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-foreground font-semibold mt-1 truncate max-w-[80px]">@{post.username}</p>
                            </div>
                          </div>

                          {/* Rules */}
                          <div className="bg-muted/30 rounded-lg px-3 py-2.5 space-y-1.5">
                            <p className="text-[10px] text-muted-foreground">⏱ 48 hours to submit your edit</p>
                            <p className="text-[10px] text-muted-foreground">🎬 Both editors submit, judges decide</p>
                            <p className="text-[10px] text-muted-foreground">📊 Winner gains Index, loser takes a hit</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setShowChallengeConfirm(false)}
                              className="flex-1 h-10 rounded-lg border border-border/50 text-xs text-muted-foreground font-semibold hover:bg-muted/20 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={challengeLoading}
                              onClick={async () => {
                                setChallengeLoading(true);
                                const { data: myProfile } = await supabase
                                  .from('profiles')
                                  .select('username, avatar_url, league')
                                  .eq('id', user.id)
                                  .single();
                                if (!myProfile) { toast.error('Profile not found'); setChallengeLoading(false); return; }

                                const result = await createBattle(
                                  user.id,
                                  myProfile.username,
                                  myProfile.avatar_url,
                                  myProfile.league || 'open',
                                  48,
                                  'direct',
                                  post.user_id,
                                  post.username,
                                  post.avatar_url,
                                );
                                if (result.success && result.battleId) {
                                  await supabase.from('feed_posts').insert({
                                    user_id: user.id,
                                    content: `⚔️ @${myProfile.username} challenged @${post.username} to a 1v1 Edit Battle!`,
                                    post_type: 'milestone',
                                    is_system: true,
                                    data: { battle_id: result.battleId, challenger: myProfile.username, opponent: post.username },
                                  });
                                  toast.success('Battle challenge sent!');
                                  setShowChallengeConfirm(false);
                                  navigate(`/battle/${result.battleId}`);
                                } else {
                                  toast.error(result.error || 'Failed to create battle');
                                }
                                setChallengeLoading(false);
                              }}
                              className="flex-1 h-10 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:from-red-500 hover:to-blue-500 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              {challengeLoading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <><Swords className="w-3.5 h-3.5" /> Challenge</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Add reaction */}
              {onToggleReaction && (
                <div className="relative">
                  <LoopReactions
                    reactions={[]}
                    onToggle={(emoji) => onToggleReaction(post.id, emoji)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

export default FeedPostCard;
