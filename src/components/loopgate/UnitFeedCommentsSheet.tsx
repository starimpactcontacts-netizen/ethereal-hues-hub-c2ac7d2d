import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Trash2, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { usePostComments, FeedComment } from "@/hooks/useUnitFeed";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LoopedX } from "./LoopedX";

interface UnitFeedCommentsSheetProps {
  postId: string;
  onClose: () => void;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  currentUserId,
}: {
  comment: FeedComment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar
          className="w-7 h-7 cursor-pointer shrink-0"
          onClick={() => navigate(`/u/${comment.username}`)}
        >
          <AvatarImage src={comment.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-muted">
            {(comment.display_name || comment.username)[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-background/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold">{comment.display_name || comment.username}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-[13px] break-words">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-0.5 px-1">
            <button
              onClick={() => onReply(comment.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {currentUserId === comment.user_id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[11px] text-muted-foreground hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 space-y-2 border-l-2 border-border/30 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UnitFeedCommentsSheet({ postId, onClose }: UnitFeedCommentsSheetProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = usePostComments(postId);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await addComment(text, replyTo || undefined);
    setText("");
    setReplyTo(null);
    setSending(false);
  };

  const replyComment = replyTo ? comments.find((c) => c.id === replyTo) || comments.flatMap((c) => c.replies || []).find((r) => r.id === replyTo) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col"
        style={{ maxHeight: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm">Comments</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50">
            <LoopedX className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={setReplyTo}
                onDelete={deleteComment}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && replyComment && (
          <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Replying to <span className="font-semibold text-foreground">{replyComment.display_name || replyComment.username}</span>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        )}

        {/* Input */}
        {user && (
          <div className="px-4 py-3 border-t border-border/50 flex gap-2 shrink-0" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="h-9 text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-9 h-9 rounded-lg bg-gold text-black flex items-center justify-center disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
