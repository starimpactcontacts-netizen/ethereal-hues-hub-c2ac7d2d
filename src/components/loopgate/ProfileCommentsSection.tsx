import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
  parent_id: string | null;
  replies: ProfileComment[];
}

interface Props {
  profileUserId: string;
  profileUsername: string;
}

export default function ProfileCommentsSection({ profileUserId, profileUsername }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [openReplies, setOpenReplies] = useState<Set<string>>(new Set());

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feed_posts')
      .select('id, user_id, content, created_at, data')
      .eq('post_type', 'profile_comment')
      .filter('data->>target_profile_id', 'eq', profileUserId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data || data.length === 0) { setComments([]); setLoading(false); return; }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const pm = new Map(profiles?.map(p => [p.id, p]) || []);
    const flat: ProfileComment[] = data.map(c => ({
      id: c.id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      username: pm.get(c.user_id)?.username || 'editor',
      avatar_url: pm.get(c.user_id)?.avatar_url || null,
      parent_id: ((c.data as any)?.parent_comment_id as string) || null,
      replies: [],
    }));
    const byId = new Map(flat.map(c => [c.id, c]));
    const roots: ProfileComment[] = [];
    flat.forEach(c => {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies.push(c);
      } else {
        roots.push(c);
      }
    });
    roots.reverse(); // newest top-level first
    setComments(roots);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [profileUserId]);

  const handlePost = async () => {
    if (!user || !text.trim() || posting) return;
    setPosting(true);
    const content = replyTo ? text.trim() : text.trim();
    const { error } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      content,
      post_type: 'profile_comment',
      data: {
        target_profile_id: profileUserId,
        target_username: profileUsername,
        ...(replyTo ? { parent_comment_id: replyTo.id, reply_to_username: replyTo.username } : {}),
      },
    });
    if (error) {
      toast.error('Failed to post comment');
    } else {
      setText('');
      if (replyTo) setOpenReplies(prev => new Set(prev).add(replyTo.id));
      setReplyTo(null);
      fetchComments();
    }
    setPosting(false);
  };

  const timeAgo = (ts: string) =>
    formatDistanceToNow(new Date(ts), { addSuffix: true })
      .replace(' ago', '').replace('about ', '').replace('less than a minute', 'now');

  const toggleReplies = (id: string) => {
    setOpenReplies(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const Row = ({ c, isReply = false }: { c: ProfileComment; isReply?: boolean }) => (
    <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
      <button onClick={() => navigate(`/editor/${c.user_id}`)} className="shrink-0 mt-0.5">
        <Avatar className="w-7 h-7 border border-white/[0.08] rounded-sm">
          <AvatarImage src={c.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="bg-muted text-[9px] font-bold rounded-sm">
            {c.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <button
            onClick={() => navigate(`/editor/${c.user_id}`)}
            className="text-[12px] font-black text-foreground hover:underline tracking-wide uppercase truncate"
          >
            {c.username}
          </button>
          <span className="text-[10px] text-muted-foreground/40 shrink-0 uppercase tracking-wider">
            {timeAgo(c.created_at)}
          </span>
        </div>
        <p className="text-[13px] text-foreground/85 leading-snug break-words mt-0.5">{c.content}</p>
        {user && !isReply && (
          <button
            onClick={() => setReplyTo({ id: c.id, username: c.username })}
            className="text-[10px] text-muted-foreground/50 hover:text-foreground mt-1.5 uppercase tracking-wider font-bold"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-3 py-5">
      {/* Compose */}
      {user ? (
        <div className="mb-5">
          {replyTo && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border border-b-0 border-white/[0.08]">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Replying to <span className="text-foreground font-bold">@{replyTo.username}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="text-[10px] text-muted-foreground/60 hover:text-foreground uppercase tracking-wider">Cancel</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder={replyTo ? `Reply to @${replyTo.username}...` : `Say something to @${profileUsername}...`}
              rows={2}
              maxLength={280}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] text-foreground text-[13px] placeholder:text-muted-foreground/30 px-3 py-2.5 resize-none focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className="px-3 bg-foreground text-background flex items-center justify-center disabled:opacity-25 transition-opacity"
              style={{ minWidth: 44 }}
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/40 text-center mb-5">Sign in to leave a comment</p>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-foreground/30">No comments yet</p>
          {user && <p className="text-xs text-muted-foreground/25 mt-1">Be the first to leave one</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => {
            const open = openReplies.has(c.id);
            return (
              <div key={c.id} className="space-y-1.5">
                <Row c={c} />
                {c.replies.length > 0 && (
                  <button
                    onClick={() => toggleReplies(c.id)}
                    className="flex items-center gap-1 ml-3 text-[10px] text-muted-foreground/60 hover:text-foreground uppercase tracking-wider font-bold"
                  >
                    {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {open ? 'Hide' : `View ${c.replies.length} ${c.replies.length === 1 ? 'reply' : 'replies'}`}
                  </button>
                )}
                {open && c.replies.length > 0 && (
                  <div className="ml-6 space-y-1.5">
                    {c.replies.map(r => <Row key={r.id} c={r} isReply />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
