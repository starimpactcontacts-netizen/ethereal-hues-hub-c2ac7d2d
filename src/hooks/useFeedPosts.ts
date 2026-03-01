import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeedPostItem {
  id: string;
  user_id: string;
  content: string;
  post_type: 'text' | 'flex' | 'edit_share' | 'milestone';
  media_url: string | null;
  media_platform: string | null;
  uploaded_media_url: string | null;
  uploaded_media_type: string | null;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  share_count: number;
  is_system: boolean;
  data: Record<string, any>;
  created_at: string;
  // Joined
  username?: string;
  avatar_url?: string | null;
  league?: string;
  level?: number;
  is_verified?: boolean;
  global_index_score?: number;
}

export function useFeedPosts(limit = 30) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) { console.error('Error fetching feed posts:', error); setLoading(false); return; }

    const userIds = [...new Set((data || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, league, level, verification_status, global_index_score')
      .in('id', userIds.length > 0 ? userIds : ['']);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const enriched: FeedPostItem[] = (data || []).map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...p,
        data: (p.data as Record<string, any>) || {},
        post_type: p.post_type as FeedPostItem['post_type'],
        uploaded_media_url: (p as any).uploaded_media_url || null,
        uploaded_media_type: (p as any).uploaded_media_type || null,
        username: profile?.username || 'editor',
        avatar_url: profile?.avatar_url || null,
        league: profile?.league || 'open',
        level: profile?.level || 1,
        is_verified: !!profile?.verification_status,
        global_index_score: profile?.global_index_score || 0,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [limit]);

  // Fetch user's likes/bookmarks
  useEffect(() => {
    if (!user) return;
    const fetchInteractions = async () => {
      const [likesRes, bookmarksRes] = await Promise.all([
        supabase.from('feed_post_likes').select('post_id').eq('user_id', user.id),
        supabase.from('feed_post_bookmarks').select('post_id').eq('user_id', user.id),
      ]);
      setLikedPostIds(new Set((likesRes.data || []).map(l => l.post_id)));
      setBookmarkedPostIds(new Set((bookmarksRes.data || []).map(b => b.post_id)));
    };
    fetchInteractions();
  }, [user]);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('feed-posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = async (content: string, postType: FeedPostItem['post_type'] = 'text', mediaUrl?: string, mediaPlatform?: string, uploadedMediaUrl?: string, uploadedMediaType?: string) => {
    if (!user) return;
    const { error } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      content: content.slice(0, 280),
      post_type: postType,
      media_url: mediaUrl || null,
      media_platform: mediaPlatform || null,
      uploaded_media_url: uploadedMediaUrl || null,
      uploaded_media_type: uploadedMediaType || null,
    });
    if (error) console.error('Error creating post:', error);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPostIds.has(postId);
    if (isLiked) {
      setLikedPostIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p));
      await supabase.from('feed_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      setLikedPostIds(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p));
      await supabase.from('feed_post_likes').insert({ post_id: postId, user_id: user.id });
    }
  };

  const toggleBookmark = async (postId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedPostIds.has(postId);
    if (isBookmarked) {
      setBookmarkedPostIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmark_count: Math.max(0, p.bookmark_count - 1) } : p));
      await supabase.from('feed_post_bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      setBookmarkedPostIds(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmark_count: p.bookmark_count + 1 } : p));
      await supabase.from('feed_post_bookmarks').insert({ post_id: postId, user_id: user.id });
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('feed_posts').delete().eq('id', postId).eq('user_id', user.id);
  };

  return { posts, loading, likedPostIds, bookmarkedPostIds, createPost, toggleLike, toggleBookmark, deletePost, refetch: fetchPosts };
}
