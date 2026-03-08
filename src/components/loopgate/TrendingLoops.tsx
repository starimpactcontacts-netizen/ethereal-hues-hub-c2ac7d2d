import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEKO = { fontFamily: 'Teko, sans-serif' };

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('feed_posts')
        .select('id, user_id, content, like_count, comment_count, username, avatar_url, league, uploaded_media_url, uploaded_media_type, created_at')
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      setPosts((data as TrendingPost[]) || []);
      setLoading(false);
    })();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[220px] h-[140px] flex-shrink-0 bg-surface-1 animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
      {posts.map((post, i) => (
        <Link
          key={post.id}
          to="/loop"
          className="group relative w-[220px] flex-shrink-0 snap-start border border-border/20 bg-surface-1/60 hover:border-gold/30 transition-all duration-300 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
        >
          {/* Rank flame for top 3 */}
          {i < 3 && (
            <div className="absolute top-1.5 right-1.5 z-10">
              <Flame size={12} className={cn(
                i === 0 ? "text-gold" : i === 1 ? "text-white/60" : "text-amber-700"
              )} fill="currentColor" />
            </div>
          )}

          {/* Media preview or content */}
          {post.uploaded_media_url && post.uploaded_media_type?.startsWith('image') ? (
            <div className="h-[90px] w-full overflow-hidden">
              <img
                src={post.uploaded_media_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-[90px] w-full p-3 flex items-center">
              <p className="text-[11px] text-foreground/80 line-clamp-4 leading-relaxed">
                {post.content}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-2.5 py-2 border-t border-border/10">
            <div className="flex items-center gap-1.5 mb-1">
              {post.avatar_url ? (
                <img src={post.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-gold">{(post.username || '?').charAt(0).toUpperCase()}</span>
                </div>
              )}
              <span className="text-[10px] font-bold text-foreground truncate">{post.username || 'anon'}</span>
            </div>
            <div className="flex items-center gap-3">
              {post.like_count > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  <Heart size={9} className="text-red-400" fill="currentColor" /> {post.like_count}
                </span>
              )}
              {post.comment_count > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
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
