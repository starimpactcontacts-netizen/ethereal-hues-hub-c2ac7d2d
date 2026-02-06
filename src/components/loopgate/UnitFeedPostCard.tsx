import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, Trash2, MessageCircle, MoreHorizontal, Film, Bell, Trophy, Image, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FeedPost } from "@/hooks/useUnitFeed";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import UnitFeedCommentsSheet from "./UnitFeedCommentsSheet";

interface UnitFeedPostCardProps {
  post: FeedPost;
  isStaff: boolean;
  onReact: (postId: string, emoji: string) => void;
  onPin: (postId: string, isPinned: boolean) => void;
  onDelete: (postId: string) => void;
}

const QUICK_EMOJIS = ["🔥", "❤️", "🐐", "😭", "💀", "⚡"];

const POST_TYPE_BADGES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  edit: { label: "Edit", icon: <Film className="w-3 h-3" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  announcement: { label: "News", icon: <Bell className="w-3 h-3" />, color: "bg-gold/20 text-gold border-gold/30" },
  win: { label: "Win", icon: <Trophy className="w-3 h-3" />, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  logo_preview: { label: "Logo", icon: <Image className="w-3 h-3" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

function getEmbedUrl(url: string, platform: string | null): string | null {
  if (!url) return null;
  if (platform === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (platform === "tiktok" || url.includes("tiktok.com")) {
    const match = url.match(/\/video\/(\d+)/);
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
  }
  return null;
}

export default function UnitFeedPostCard({ post, isStaff, onReact, onPin, onDelete }: UnitFeedPostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isOwner = user?.id === post.user_id;
  const typeBadge = POST_TYPE_BADGES[post.post_type];
  const embedUrl = post.media_url ? getEmbedUrl(post.media_url, post.media_platform) : null;

  return (
    <>
      <motion.div
        layout
        className={`bg-surface-1 border rounded-lg overflow-hidden ${
          post.is_pinned ? "border-gold/40" : "border-border"
        }`}
      >
        {/* Post Header */}
        <div className="p-3 pb-0 flex items-start gap-2.5">
          <Avatar
            className="w-9 h-9 cursor-pointer shrink-0"
            onClick={() => navigate(`/u/${post.username}`)}
          >
            <AvatarImage src={post.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {(post.display_name || post.username || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">{post.display_name || post.username}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${typeBadge.color}`}>
                {typeBadge.icon}
                <span className="ml-1">{typeBadge.label}</span>
              </Badge>
              {post.is_pinned && <Pin className="w-3 h-3 text-gold shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground">
              @{post.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
          {(isStaff || isOwner) && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg min-w-[140px] overflow-hidden"
                  >
                    {isStaff && (
                      <button
                        onClick={() => { onPin(post.id, post.is_pinned); setShowActions(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {post.is_pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                    {(isOwner || isStaff) && (
                      <button
                        onClick={() => { onDelete(post.id); setShowActions(false); }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-3 pt-2">
            <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
          </div>
        )}

        {/* Media Embed */}
        {post.media_url && (
          <div className="px-3 pt-2">
            {embedUrl ? (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
            ) : (
              <a
                href={post.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline bg-background/50 rounded-lg p-3 border border-border/50"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="truncate">{post.media_url}</span>
              </a>
            )}
          </div>
        )}

        {/* Reactions */}
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 flex-wrap">
          {post.reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReact(post.id, r.emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                r.reacted
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-muted/30 border border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <span>{r.emoji}</span>
              <span className="font-semibold">{r.count}</span>
            </button>
          ))}
          {/* Quick react buttons */}
          <div className="flex items-center gap-0.5 ml-1">
            {QUICK_EMOJIS.filter((e) => !post.reactions.find((r) => r.emoji === e)).slice(0, 3).map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(post.id, emoji)}
                className="w-7 h-7 rounded-full hover:bg-muted/50 flex items-center justify-center text-sm opacity-40 hover:opacity-100 transition-opacity"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Button */}
        <div className="px-3 pb-3 pt-1">
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comment_count > 0 ? `${post.comment_count} comment${post.comment_count > 1 ? "s" : ""}` : "Comment"}
          </button>
        </div>
      </motion.div>

      {/* Comments Sheet */}
      <AnimatePresence>
        {showComments && (
          <UnitFeedCommentsSheet postId={post.id} onClose={() => setShowComments(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
