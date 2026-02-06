import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Bell, Trophy, Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FeedPost } from "@/hooks/useUnitFeed";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoopedX } from "./LoopedX";

interface UnitFeedComposerProps {
  isStaff: boolean;
  onPost: (type: FeedPost["post_type"], content: string, mediaUrl?: string, mediaPlatform?: string) => Promise<void>;
  onClose: () => void;
}

const POST_TYPES: { id: FeedPost["post_type"]; label: string; icon: React.ReactNode; staffOnly: boolean }[] = [
  { id: "edit", label: "Edit Upload", icon: <Film className="w-4 h-4" />, staffOnly: false },
  { id: "win", label: "Win / Achievement", icon: <Trophy className="w-4 h-4" />, staffOnly: false },
  { id: "logo_preview", label: "Logo Preview", icon: <Image className="w-4 h-4" />, staffOnly: true },
  { id: "announcement", label: "Announcement", icon: <Bell className="w-4 h-4" />, staffOnly: true },
];

export default function UnitFeedComposer({ isStaff, onPost, onClose }: UnitFeedComposerProps) {
  const isMobile = useIsMobile();
  const [postType, setPostType] = useState<FeedPost["post_type"]>("edit");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableTypes = POST_TYPES.filter((t) => !t.staffOnly || isStaff);

  const detectPlatform = (url: string): string | undefined => {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("streamable.com")) return "streamable";
    return undefined;
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl.trim()) return;
    setSubmitting(true);
    const platform = detectPlatform(mediaUrl);
    await onPost(postType, content.trim(), mediaUrl.trim() || undefined, platform);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: isMobile ? 200 : 0, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: isMobile ? 200 : 0, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold">New Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50">
            <LoopedX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Post Type Selector */}
          <div className="flex gap-2 flex-wrap">
            {availableTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setPostType(type.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  postType === type.id
                    ? "bg-gold text-black"
                    : "bg-surface-1 text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === "edit"
                ? "Share your latest edit..."
                : postType === "announcement"
                ? "Write an announcement..."
                : postType === "win"
                ? "Share your win! 🏆"
                : "Upload a logo preview..."
            }
            className="min-h-[80px] resize-none bg-background"
          />

          {/* Media URL */}
          {(postType === "edit" || postType === "logo_preview") && (
            <div>
              <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">
                Link (TikTok, YouTube, Instagram, Streamable)
              </label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://vm.tiktok.com/..."
                className="h-10"
              />
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !mediaUrl.trim())}
            className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
