import { useState, useEffect, useRef } from 'react';
import { Heart, Reply, Send, Loader2, MessageCircle, ChevronDown, Smile } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import GifPicker from './GifPicker';

const isGifUrl = (text: string) =>
  text.includes('tenor.com') || text.includes('giphy.com') || /\.(gif|gifv)(\?|$)/i.test(text);

interface Comment {
  id: string;
  content: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  like_count: number;
  reply_count: number;
  created_at: string;
  parent_id: string | null;
  isLiked?: boolean;
  replies?: Comment[];
}

interface Props {
  submissionId: string;
  submissionType: 'arena' | 'review' | 'battle' | 'judge_video';
}

export default function FeedInlineComments({ submissionId, submissionType }: Props) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showGifPicker, setShowGifPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data: commentsData, error } = await supabase
          .from('feed_comments')
          .select('*')
          .eq('submission_id', submissionId)
          .eq('submission_type', submissionType)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds.length > 0 ? userIds : ['']);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        let likedIds: string[] = [];
        if (user) {
          const ids = commentsData?.map(c => c.id) || [];
          const { data: likes } = await supabase
            .from('feed_comment_likes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', ids.length > 0 ? ids : ['']);
          likedIds = likes?.map(l => l.comment_id) || [];
        }

        setComments((commentsData || []).map(c => ({
          ...c,
          username: profileMap.get(c.user_id)?.username || 'Unknown',
          avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
          isLiked: likedIds.includes(c.id)
        })));
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [submissionId, submissionType, user]);

  const loadReplies = async (parentId: string) => {
    if (expandedReplies.has(parentId)) {
      setExpandedReplies(prev => { const n = new Set(prev); n.delete(parentId); return n; });
      return;
    }
    try {
      const { data } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds.length > 0 ? userIds : ['']);
      const pm = new Map(profs?.map(p => [p.id, p]) || []);

      let likedIds: string[] = [];
      if (user) {
        const ids = data?.map(c => c.id) || [];
        const { data: likes } = await supabase
          .from('feed_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', ids.length > 0 ? ids : ['']);
        likedIds = likes?.map(l => l.comment_id) || [];
      }

      const replies: Comment[] = (data || []).map(c => ({
        ...c,
        username: pm.get(c.user_id)?.username || 'Unknown',
        avatar_url: pm.get(c.user_id)?.avatar_url || null,
        isLiked: likedIds.includes(c.id)
      }));

      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies } : c));
      setExpandedReplies(prev => new Set(prev).add(parentId));
    } catch (err) {
      console.error('Error loading replies:', err);
    }
  };

  const submitContent = async (content: string) => {
    if (!user || !profile) {
      toast.error('You must be signed in to comment');
      return;
    }
    if (!content.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('feed_comments')
        .insert({
          submission_id: submissionId,
          submission_type: submissionType,
          user_id: user.id,
          content: content.trim(),
          parent_id: replyingTo?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('Comment insert error:', error);
        throw error;
      }

      const obj: Comment = {
        ...data,
        username: profile.username || 'Unknown',
        avatar_url: profile.avatar_url || null,
        isLiked: false
      };

      if (replyingTo) {
        setComments(prev => prev.map(c =>
          c.id === replyingTo.id
            ? { ...c, reply_count: c.reply_count + 1, replies: [...(c.replies || []), obj] }
            : c
        ));
        if (!expandedReplies.has(replyingTo.id)) {
          setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
        }
        setReplyingTo(null);
      } else {
        setComments(prev => [obj, ...prev]);
      }
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = () => submitContent(newComment);

  const handleGifSelect = (gifUrl: string) => {
    setShowGifPicker(false);
    submitContent(gifUrl);
  };

  const toggleLike = async (comment: Comment, isReply = false, parentId?: string) => {
    if (!user) { toast.error('Sign in to like'); return; }
    const wasLiked = comment.isLiked;
    const update = (c: Comment) =>
      c.id === comment.id ? { ...c, isLiked: !wasLiked, like_count: c.like_count + (wasLiked ? -1 : 1) } : c;

    if (isReply && parentId) {
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: c.replies?.map(update) } : c));
    } else {
      setComments(prev => prev.map(update));
    }

    try {
      if (wasLiked) {
        await supabase.from('feed_comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
      } else {
        await supabase.from('feed_comment_likes').insert({ comment_id: comment.id, user_id: user.id });
      }
    } catch {
      // revert silently
    }
  };

  return (
    <div className="px-4 py-3">
      {/* Comment input */}
      <div className="relative">
        {showGifPicker && (
          <div className="fixed inset-x-0 bottom-[120px] z-50 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="bg-card border border-border rounded-xl shadow-2xl max-h-[300px] overflow-hidden">
              <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-foreground text-[10px]">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            {replyingTo && (
              <div className="absolute -top-5 left-0 text-[10px] text-muted-foreground">
                Replying to <span className="text-primary">@{replyingTo.username}</span>
                <button onClick={() => setReplyingTo(null)} className="ml-1 text-muted-foreground hover:text-foreground">✕</button>
              </div>
            )}
            <input
              ref={inputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "Post a reply..." : "Sign in to reply"}
              disabled={!user}
              className="w-full bg-surface-2 border border-border rounded-full px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            disabled={!user}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!user || !newComment.trim() || sending}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">No replies yet. Start the thread.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map(comment => (
            <div key={comment.id}>
              <ThreadComment
                comment={comment}
                onLike={() => toggleLike(comment)}
                onReply={() => { setReplyingTo(comment); inputRef.current?.focus(); }}
                onLoadReplies={() => loadReplies(comment.id)}
                isExpanded={expandedReplies.has(comment.id)}
              />
              {expandedReplies.has(comment.id) && comment.replies && (
                <div className="ml-10 border-l border-border/40 pl-3 space-y-0">
                  {comment.replies.map(reply => (
                    <ThreadComment
                      key={reply.id}
                      comment={reply}
                      onLike={() => toggleLike(reply, true, comment.id)}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadComment({
  comment, onLike, onReply, onLoadReplies, isExpanded, isReply
}: {
  comment: Comment;
  onLike: () => void;
  onReply?: () => void;
  onLoadReplies?: () => void;
  isExpanded?: boolean;
  isReply?: boolean;
}) {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className="flex gap-2.5 py-2.5">
      <Avatar className={isReply ? "w-6 h-6" : "w-7 h-7"}>
        <AvatarImage src={comment.avatar_url || undefined} />
        <AvatarFallback className="bg-muted text-foreground text-[10px]">
          {comment.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground text-xs">@{comment.username}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
        </div>
        {isGifUrl(comment.content) ? (
          <img src={comment.content} alt="GIF" className="max-w-[200px] rounded-lg mt-1" loading="lazy" />
        ) : (
          <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <button onClick={onLike} className="flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors">
            <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            {comment.like_count > 0 && <span className="text-[11px]">{comment.like_count}</span>}
          </button>
          {onReply && !isReply && (
            <button onClick={onReply} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-[11px]">
              <Reply className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {!isReply && comment.reply_count > 0 && onLoadReplies && (
            <button onClick={onLoadReplies} className="flex items-center gap-1 text-primary text-[11px] hover:underline">
              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              {isExpanded ? 'Hide' : `${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
