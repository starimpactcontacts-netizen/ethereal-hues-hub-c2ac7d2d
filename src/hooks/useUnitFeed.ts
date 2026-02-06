import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface FeedPost {
  id: string;
  crew_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  post_type: "edit" | "announcement" | "win" | "logo_preview";
  content: string | null;
  media_url: string | null;
  media_platform: string | null;
  thumbnail_url: string | null;
  is_pinned: boolean;
  created_at: string;
  reactions: ReactionGroup[];
  comment_count: number;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  content: string;
  created_at: string;
  replies?: FeedComment[];
}

export type FeedFilter = "all" | "edit" | "announcement" | "win" | "logo_preview";

export function useUnitFeed(crewId: string | undefined) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!crewId) return;
    setLoading(true);

    let query = supabase
      .from("unit_feed_posts")
      .select("*")
      .eq("crew_id", crewId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("post_type", filter);
    }

    const { data: postsData, error } = await query;
    if (error) {
      console.error("Error fetching feed:", error);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = postsData.map((p) => p.id);

    // Fetch reactions and comment counts in parallel
    const [{ data: reactionsData }, { data: commentsCount }] = await Promise.all([
      supabase.from("unit_feed_reactions").select("*").in("post_id", postIds),
      supabase.from("unit_feed_comments").select("post_id").in("post_id", postIds),
    ]);

    const enriched: FeedPost[] = postsData.map((post) => {
      const postReactions = reactionsData?.filter((r) => r.post_id === post.id) || [];
      const emojiMap = new Map<string, { count: number; reacted: boolean }>();
      postReactions.forEach((r) => {
        const existing = emojiMap.get(r.emoji) || { count: 0, reacted: false };
        existing.count++;
        if (r.user_id === user?.id) existing.reacted = true;
        emojiMap.set(r.emoji, existing);
      });

      const reactions: ReactionGroup[] = Array.from(emojiMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        reacted: data.reacted,
      }));

      const commentCount = commentsCount?.filter((c) => c.post_id === post.id).length || 0;

      return {
        ...post,
        post_type: post.post_type as FeedPost["post_type"],
        reactions,
        comment_count: commentCount,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [crewId, filter, user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    if (!crewId) return;

    channelRef.current = supabase
      .channel(`unit-feed-${crewId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_feed_posts", filter: `crew_id=eq.${crewId}` }, () => {
        fetchPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_feed_reactions" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [crewId, fetchPosts]);

  const createPost = useCallback(
    async (postType: FeedPost["post_type"], content: string, mediaUrl?: string, mediaPlatform?: string) => {
      if (!crewId || !user || !profile) return null;

      const { data, error } = await supabase
        .from("unit_feed_posts")
        .insert({
          crew_id: crewId,
          user_id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          post_type: postType,
          content: content || null,
          media_url: mediaUrl || null,
          media_platform: mediaPlatform || null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create post");
        return null;
      }
      toast.success("Posted!");
      return data;
    },
    [crewId, user, profile]
  );

  const toggleReaction = useCallback(
    async (postId: string, emoji: string) => {
      if (!user) return;

      const existing = posts
        .find((p) => p.id === postId)
        ?.reactions.find((r) => r.emoji === emoji && r.reacted);

      if (existing) {
        await supabase.from("unit_feed_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("emoji", emoji);
      } else {
        await supabase.from("unit_feed_reactions").insert({ post_id: postId, user_id: user.id, emoji });
      }
    },
    [user, posts]
  );

  const togglePin = useCallback(
    async (postId: string, isPinned: boolean) => {
      const { error } = await supabase.from("unit_feed_posts").update({ is_pinned: !isPinned }).eq("id", postId);
      if (error) toast.error("Failed to pin post");
    },
    []
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const { error } = await supabase.from("unit_feed_posts").delete().eq("id", postId);
      if (error) toast.error("Failed to delete post");
    },
    []
  );

  return { posts, loading, filter, setFilter, createPost, toggleReaction, togglePin, deletePost, refresh: fetchPosts };
}

export function usePostComments(postId: string | undefined) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("unit_feed_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Organize into threads
      const topLevel: FeedComment[] = [];
      const replyMap = new Map<string, FeedComment[]>();

      data.forEach((c) => {
        const comment = c as FeedComment;
        if (comment.parent_id) {
          const existing = replyMap.get(comment.parent_id) || [];
          existing.push(comment);
          replyMap.set(comment.parent_id, existing);
        } else {
          topLevel.push({ ...comment, replies: [] });
        }
      });

      topLevel.forEach((c) => {
        c.replies = replyMap.get(c.id) || [];
      });

      setComments(topLevel);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!postId || !user || !profile || !content.trim()) return null;

      const { error } = await supabase.from("unit_feed_comments").insert({
        post_id: postId,
        parent_id: parentId || null,
        user_id: user.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        content: content.trim(),
      });

      if (error) {
        toast.error("Failed to add comment");
        return null;
      }
      fetchComments();
      return true;
    },
    [postId, user, profile, fetchComments]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const { error } = await supabase.from("unit_feed_comments").delete().eq("id", commentId);
      if (!error) fetchComments();
    },
    [fetchComments]
  );

  return { comments, loading, addComment, deleteComment, refresh: fetchComments };
}
