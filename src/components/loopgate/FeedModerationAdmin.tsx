/**
 * FeedModerationAdmin — Moderate feed posts, delete inappropriate content
 */
import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Trash2, Flag, Eye, AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FeedPost {
  id: string;
  user_id: string;
  username: string;
  content: string | null;
  media_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export default function FeedModerationAdmin() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("feed_posts")
      .select("id, user_id, content, media_url, like_count, comment_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) { setPosts([]); setLoading(false); return; }

    // Fetch usernames
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.username]));

    setPosts(data.map(p => ({
      ...p,
      username: profileMap.get(p.user_id) || "Unknown",
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // Delete comments first
      await supabase.from("feed_comments").delete().eq("post_id", deleteId);
      // Delete likes
      await supabase.from("feed_post_likes").delete().eq("post_id", deleteId);
      // Delete bookmarks
      await supabase.from("feed_post_bookmarks").delete().eq("post_id", deleteId);
      // Delete the post
      const { error } = await supabase.from("feed_posts").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Post deleted");
      setPosts(posts.filter(p => p.id !== deleteId));
    } catch (err) {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
        </div>
      </div>
    );
  }

  const displayPosts = showAll ? posts : posts.slice(0, 10);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <MessageCircle size={14} className="text-violet-400" />
          Feed Moderation
        </h2>
        <span className="text-xs text-muted-foreground">{posts.length} recent posts</span>
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {displayPosts.map((post) => (
          <div key={post.id} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-muted/50 overflow-hidden flex-shrink-0">
              {post.avatar_url ? (
                <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                  {post.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">@{post.username}</span>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {post.content || (post.media_url ? "[Media post]" : "[Empty]")}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span>❤️ {post.like_count}</span>
                <span>💬 {post.comment_count}</span>
                {post.media_url && <span>📎 Media</span>}
              </div>
            </div>
            <button
              onClick={() => setDeleteId(post.id)}
              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex-shrink-0"
              title="Delete post"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {posts.length > 10 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <ChevronDown size={12} />
          Show all {posts.length} posts
        </button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Delete Feed Post
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this post along with all its comments, likes, and bookmarks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
