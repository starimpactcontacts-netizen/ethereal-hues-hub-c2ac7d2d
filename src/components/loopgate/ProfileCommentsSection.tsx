import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
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

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feed_posts')
      .select('id, user_id, content, created_at, data')
      .eq('post_type', 'profile_comment')
      .filter('data->>target_profile_id', 'eq', profileUserId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) { setComments([]); setLoading(false); return; }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const pm = new Map(profiles?.map(p => [p.id, p]) || []);
    setComments(data.map(c => ({
      id: c.id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      username: pm.get(c.user_id)?.username || 'editor',
      avatar_url: pm.get(c.user_id)?.avatar_url || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [profileUserId]);

  const handlePost = async () => {
    if (!user || !text.trim() || posting) return;
    setPosting(true);
    const { error } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      content: text.trim(),
      post_type: 'profile_comment',
      data: { target_profile_id: profileUserId, target_username: profileUsername },
    });
    if (error) {
      toast.error('Failed to post comment');
    } else {
      setText('');
      fetchComments();
    }
    setPosting(false);
  };

  const timeAgo = (ts: string) =>
    formatDistanceToNow(new Date(ts), { addSuffix: true })
      .replace(' ago', '').replace('about ', '').replace('less than a minute', 'now');

  return (
    <div className="px-4 py-5">
      {/* Compose */}
      {user ? (
        <div className="flex gap-2 mb-6">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            placeholder={`Say something to @${profileUsername}...`}
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
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <button onClick={() => navigate(`/editor/${c.user_id}`)} className="shrink-0 mt-0.5">
                <Avatar className="w-7 h-7 border border-white/[0.08]">
                  <AvatarImage src={c.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted text-[9px] font-bold">{c.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <div className="inline-block bg-white/[0.04] border border-white/[0.06] px-3 py-2 max-w-full">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <button
                      onClick={() => navigate(`/editor/${c.user_id}`)}
                      className="text-[11px] font-black text-foreground hover:underline tracking-wide"
                    >
                      {c.username}
                    </button>
                    <span className="text-[9px] text-muted-foreground/30">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-snug break-words">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
