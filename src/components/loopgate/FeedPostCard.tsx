import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Sparkles, Trophy, ArrowUp, Link2, MoreHorizontal, Swords } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { FeedPostItem } from "@/hooks/useFeedPosts";
import VerifiedBadge from "./VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import RichMessageContent from "./RichMessageContent";
import LoopReactions from "./LoopReactions";
import { useState, memo } from "react";
import { ReactionGroup } from "@/hooks/useLoopReactions";

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
    case 'flex': return { icon: <Sparkles className="w-3 h-3 text-gold" />, label: 'FLEX' };
    case 'edit_share': return { icon: <Link2 className="w-3 h-3 text-primary" />, label: 'EDIT' };
    case 'milestone': return { icon: <Trophy className="w-3 h-3 text-gold" />, label: 'MILESTONE' };
    default: return null;
  }
}

const FeedPostCard = memo(function FeedPostCard({ post, isLiked, isBookmarked, onLike, onBookmark, onDelete, reactions, onToggleReaction }: FeedPostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
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

              {/* Challenge from post */}
              {!isOwn && !post.is_system && (
                <button
                  onClick={() => navigate('/arena')}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Challenge this editor"
                >
                  <Swords className="w-[15px] h-[15px]" />
                </button>
              )}

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
