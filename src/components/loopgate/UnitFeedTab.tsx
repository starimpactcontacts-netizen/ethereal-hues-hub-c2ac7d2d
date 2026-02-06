import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, Trash2, MessageCircle, Film, Bell, Trophy, Image, Send, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUnitFeed, FeedPost, FeedFilter } from "@/hooks/useUnitFeed";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { LoopedX } from "./LoopedX";
import UnitFeedPostCard from "./UnitFeedPostCard";
import UnitFeedComposer from "./UnitFeedComposer";

interface UnitFeedTabProps {
  crewId: string;
  isStaff: boolean;
}

const FILTER_OPTIONS: { id: FeedFilter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: null },
  { id: "edit", label: "Edits", icon: <Film className="w-3 h-3" /> },
  { id: "announcement", label: "News", icon: <Bell className="w-3 h-3" /> },
  { id: "win", label: "Wins", icon: <Trophy className="w-3 h-3" /> },
  { id: "logo_preview", label: "Logos", icon: <Image className="w-3 h-3" /> },
];

export default function UnitFeedTab({ crewId, isStaff }: UnitFeedTabProps) {
  const { user } = useAuth();
  const isMember = !!user; // simplified - in reality check membership
  const { posts, loading, filter, setFilter, createPost, toggleReaction, togglePin, deletePost } = useUnitFeed(crewId);
  const [showComposer, setShowComposer] = useState(false);

  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === opt.id
                ? "bg-gold text-black"
                : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* New Post Button */}
      {isMember && (
        <button
          onClick={() => setShowComposer(true)}
          className="w-full bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-3 text-muted-foreground hover:text-foreground hover:border-gold/30 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Share an edit, upload, or announcement...</span>
        </button>
      )}

      {/* Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <UnitFeedComposer
            isStaff={isStaff}
            onPost={async (type, content, mediaUrl, platform) => {
              await createPost(type, content, mediaUrl, platform);
              setShowComposer(false);
            }}
            onClose={() => setShowComposer(false)}
          />
        )}
      </AnimatePresence>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            <Pin className="w-3.5 h-3.5" />
            Pinned
          </div>
          {pinnedPosts.map((post) => (
            <UnitFeedPostCard
              key={post.id}
              post={post}
              isStaff={isStaff}
              onReact={toggleReaction}
              onPin={togglePin}
              onDelete={deletePost}
            />
          ))}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : regularPosts.length === 0 && pinnedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-display text-lg text-muted-foreground mb-2">No Posts Yet</h3>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Share edits, wins, and logos with your unit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {regularPosts.map((post) => (
            <UnitFeedPostCard
              key={post.id}
              post={post}
              isStaff={isStaff}
              onReact={toggleReaction}
              onPin={togglePin}
              onDelete={deletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
