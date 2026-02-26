import { useState } from "react";
import { X, Sparkles, Link2, Globe, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { FeedPostItem } from "@/hooks/useFeedPosts";

interface FeedComposeSheetProps {
  open: boolean;
  onClose: () => void;
  userProfile?: { username: string; avatar_url: string | null; league?: string; level?: number } | null;
  onPost: (content: string, postType: FeedPostItem['post_type'], mediaUrl?: string, mediaPlatform?: string) => Promise<void>;
}

const POST_TYPES: { id: FeedPostItem['post_type']; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Post', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'flex', label: 'Flex', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'edit_share', label: 'Edit', icon: <Link2 className="w-3.5 h-3.5" /> },
];

const MAX_CHARS = 280;

export default function FeedComposeSheet({ open, onClose, userProfile, onPost }: FeedComposeSheetProps) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<FeedPostItem['post_type']>('text');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(false);
    onClose();
  };

  const progressPct = Math.min(100, (content.length / MAX_CHARS) * 100);
  const circumference = 2 * Math.PI * 9;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border/30">
            <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/30 transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                canSubmit
                  ? "bg-primary text-primary-foreground shadow-sm active:scale-95"
                  : "bg-primary/30 text-primary-foreground/40 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : "Post"}
            </button>
          </div>

          {/* Compose body */}
          <div className="flex gap-3 px-4 pt-4">
            <Avatar className="w-10 h-10 border border-border/40 shrink-0">
              <AvatarImage src={userProfile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                {(userProfile?.username || 'U')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  postType === 'flex' ? "What's your flex? 🔥" :
                  postType === 'edit_share' ? "Share your latest edit..." :
                  "What's happening?"
                }
                autoFocus
                className="w-full bg-transparent text-foreground text-[17px] placeholder:text-muted-foreground/40 resize-none focus:outline-none leading-relaxed min-h-[120px]"
                maxLength={300}
              />

              {/* Media URL for edit_share */}
              {postType === 'edit_share' && (
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste edit link (TikTok, YT, IG)..."
                  className="w-full bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 mt-2"
                />
              )}
            </div>
          </div>

          {/* Bottom toolbar — fixed to bottom */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 bg-background safe-bottom">
            <div className="flex items-center justify-between px-4 h-12">
              {/* Post type chips */}
              <div className="flex items-center gap-1.5">
                {POST_TYPES.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPostType(opt.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      postType === opt.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Char counter ring */}
              <div className="flex items-center gap-2">
                {content.length > 0 && (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
                      <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" className="stroke-muted/20" />
                      <circle
                        cx="12" cy="12" r="9" fill="none" strokeWidth="2"
                        className={isOverLimit ? 'stroke-destructive' : charsLeft <= 20 ? 'stroke-gold' : 'stroke-primary'}
                        strokeDasharray={`${(progressPct / 100) * circumference} ${circumference}`}
                        strokeLinecap="round"
                        transform="rotate(-90 12 12)"
                      />
                    </svg>
                    {charsLeft <= 20 && (
                      <span className={`text-[11px] font-mono tabular-nums ${isOverLimit ? 'text-destructive' : 'text-gold'}`}>
                        {charsLeft}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
