import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Flame, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendingPost {
  id: string;
  user_id: string;
  content: string;
  like_count: number;
  comment_count: number;
  username?: string;
  avatar_url?: string | null;
  league?: string;
  uploaded_media_url?: string | null;
  uploaded_media_type?: string | null;
  created_at: string;
}

export default function TrendingLoops({ limit = 10 }: { limit?: number }) {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('feed_posts')
      .select('id, user_id, content, like_count, comment_count, uploaded_media_url, uploaded_media_type, created_at')
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data || data.length === 0) { setPosts([]); setLoading(false); return; }

    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, league')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enriched: TrendingPost[] = data.map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...p,
        username: profile?.username || undefined,
        avatar_url: profile?.avatar_url || null,
        league: profile?.league || undefined,
      };
    });

    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [limit]);

  if (loading) {
    return (
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[200px] h-[260px] shrink-0 bg-surface-1 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
      {posts.map((post, i) => (
        <Link
          key={post.id}
          to="/loop"
          className="shrink-0 w-[200px] group relative aspect-[3/4] rounded-xl overflow-hidden border border-border/20 bg-surface-1"
        >
          {post.uploaded_media_url ? (
            post.uploaded_media_type?.startsWith('video') ? (
              <div className="relative w-full h-full">
                <video src={post.uploaded_media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : (
              <img src={post.uploaded_media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            )
          ) : (
            <div className="w-full h-full p-3 flex items-center justify-center bg-surface-1">
              <p className="text-[11px] text-foreground/70 line-clamp-6 text-center leading-relaxed">{post.content}</p>
            </div>
          )}

          {/* Rank badge */}
          {i < 3 && (
            <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Flame size={10} className={cn(
                i === 0 ? "text-gold" : i === 1 ? "text-white/60" : "text-amber-700"
              )} fill="currentColor" />
            </div>
          )}

          {/* Bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-8">
            <div className="flex items-center gap-1.5">
              {post.avatar_url ? (
                <img src={post.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-gold">{(post.username || '?').charAt(0).toUpperCase()}</span>
                </div>
              )}
              <span className="text-[10px] font-bold text-white truncate">{post.username || 'anon'}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              {post.like_count > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-white/60">
                  <Heart size={9} className="text-red-400" fill="currentColor" /> {post.like_count}
                </span>
              )}
              {post.comment_count > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-white/60">
                  <MessageCircle size={9} /> {post.comment_count}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
