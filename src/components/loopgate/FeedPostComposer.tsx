import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Link2, Sparkles, Trophy, Zap } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { FeedPostItem } from "@/hooks/useFeedPosts";

interface FeedPostComposerProps {
  userProfile?: { username: string; avatar_url: string | null; league?: string; level?: number } | null;
  onPost: (content: string, postType: FeedPostItem['post_type'], mediaUrl?: string, mediaPlatform?: string) => Promise<void>;
}

const POST_TYPE_OPTIONS: { id: FeedPostItem['post_type']; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Post', icon: null },
  { id: 'flex', label: 'Flex', icon: <Sparkles className="w-3 h-3" /> },
  { id: 'edit_share', label: 'Edit', icon: <Link2 className="w-3 h-3" /> },
];

const MAX_CHARS = 280;

export default function FeedPostComposer({ userProfile, onPost }: FeedPostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<FeedPostItem['post_type']>('text');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  if (!user) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !submitting;

  const detectPlatform = (url: string): string | undefined => {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram.com")) return "instagram";
    return undefined;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const platform = mediaUrl ? detectPlatform(mediaUrl) : undefined;
    await onPost(content.trim(), postType, mediaUrl.trim() || undefined, platform);
    setContent("");
    setMediaUrl("");
    setPostType('text');
    setIsFocused(false);
    setSubmitting(false);
  };

  return (
    <div className="border-b border-border/30 px-3 py-3">
      <div className="flex gap-2.5">
        {/* Avatar */}
        <Avatar className="w-9 h-9 border border-border/50 shrink-0 mt-0.5">
          <AvatarImage src={userProfile?.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
            {(userProfile?.username || 'U')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Input area */}
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={
              postType === 'flex' ? "Just hit S++ rank 🔥" :
              postType === 'edit_share' ? "Check out my latest edit..." :
              "What's happening in your edit life?"
            }
            rows={isFocused ? 3 : 1}
            className="w-full bg-transparent text-foreground text-[14px] placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-snug py-1"
            maxLength={300}
          />

          {(isFocused || content.length > 0) && (
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-mono ${
                isOverLimit ? 'text-destructive' :
                charsLeft <= 20 ? 'text-gold' :
                'text-muted-foreground/50'
              }`}>
                {charsLeft}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                  canSubmit
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Post"
                )}
              </button>
            </div>
          )}

          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                {/* Post type chips */}
                <div className="flex items-center gap-1.5 mb-2">
                  {POST_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPostType(opt.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        postType === opt.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/30"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Media URL for edit_share */}
                {postType === 'edit_share' && (
                  <input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Paste edit link (TikTok, YT, IG)..."
                    className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
