import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Link2, ImagePlus } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { FeedPostItem } from "@/hooks/useFeedPosts";
import GifPicker from "./GifPicker";
import MediaUploadButton from "./MediaUploadButton";

interface FeedPostComposerProps {
  userProfile?: { username: string; avatar_url: string | null; league?: string; level?: number } | null;
  onPost: (content: string, postType: FeedPostItem['post_type'], mediaUrl?: string, mediaPlatform?: string, uploadedMediaUrl?: string, uploadedMediaType?: string) => Promise<void>;
  /** On mobile, tapping opens full-screen sheet instead */
  onMobileTap?: () => void;
}

const POST_TYPE_OPTIONS: { id: FeedPostItem['post_type']; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Loop', icon: null },
  { id: 'flex', label: 'Flex', icon: <GateIcon className="w-3 h-3" /> },
  { id: 'edit_share', label: 'Edit', icon: <Link2 className="w-3 h-3" /> },
];

const MAX_CHARS = 280;

export default function FeedPostComposer({ userProfile, onPost, onMobileTap }: FeedPostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<FeedPostItem['post_type']>('text');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  if (!user) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = (content.trim().length > 0 || selectedGif || uploadedMedia) && !isOverLimit && !submitting;

  const detectPlatform = (url: string): string | undefined => {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram.com")) return "instagram";
    return undefined;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const finalContent = selectedGif ? (content.trim() ? `${content.trim()} ${selectedGif}` : selectedGif) : content.trim();
    const platform = mediaUrl ? detectPlatform(mediaUrl) : undefined;
    
    // Save values then reset immediately for snappy UX
    const saved = { content: finalContent, postType, mediaUrl: mediaUrl.trim() || undefined, platform, uploadedMedia: uploadedMedia ? { ...uploadedMedia } : null };
    
    setContent("");
    setMediaUrl("");
    setPostType('text');
    setIsFocused(false);
    setSelectedGif(null);
    setUploadedMedia(null);
    setShowGifPicker(false);
    setSubmitting(false);

    // Fire in background
    await onPost(saved.content, saved.postType, saved.mediaUrl, saved.platform, saved.uploadedMedia?.url, saved.uploadedMedia?.type);
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
    setUploadedMedia(null);
  };

  // Mobile: show a compact tappable bar that opens full-screen sheet
  if (isMobile && onMobileTap) {
    return (
      <button
        onClick={onMobileTap}
        className="w-full border-b border-border/20 px-4 py-3 flex items-center gap-3 active:bg-muted/10 transition-colors"
      >
        <Avatar className="w-9 h-9 border border-border/30 shrink-0">
          <AvatarImage src={userProfile?.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
            {(userProfile?.username || 'U')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-[14px] text-muted-foreground/50 flex-1 text-left">
          What's happening in the loop?
        </span>
        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-bold">
          Loop
        </span>
      </button>
    );
  }

  // Desktop: full inline composer
  return (
    <div className="border-b border-border/30 px-3 py-3">
      <div className="flex gap-2.5">
        <Avatar className="w-9 h-9 border border-border/50 shrink-0 mt-0.5">
          <AvatarImage src={userProfile?.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold">
            {(userProfile?.username || 'U')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={
              postType === 'flex' ? "Just hit S++ rank 🔥" :
              postType === 'edit_share' ? "Check out my latest edit..." :
              "What's happening in the loop?"
            }
            rows={isFocused ? 3 : 1}
            className="w-full bg-transparent text-foreground text-[14px] placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-snug py-1"
            maxLength={300}
          />

          {uploadedMedia && (
            <div className="mt-1">
              <MediaUploadButton
                onUpload={() => {}}
                uploadedUrl={uploadedMedia.url}
                onClear={() => setUploadedMedia(null)}
              />
            </div>
          )}
          {selectedGif && !uploadedMedia && (
            <div className="relative mt-2 inline-block">
              <img src={selectedGif} alt="Selected GIF" className="max-w-[180px] max-h-[140px] rounded-xl" />
              <button
                onClick={() => setSelectedGif(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center shadow-sm text-[10px]"
              >
                ✕
              </button>
            </div>
          )}

          {(isFocused || content.length > 0 || selectedGif || uploadedMedia) && (
            <div className="flex items-center justify-between mb-2 mt-1">
              <div className="flex items-center gap-1">
                {!uploadedMedia && !selectedGif && (
                  <MediaUploadButton
                    onUpload={(url, type) => { setUploadedMedia({ url, type }); setSelectedGif(null); }}
                    uploadedUrl={null}
                    onClear={() => {}}
                  />
                )}
                <button
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={`px-2 py-1 rounded-full text-[10px] font-black tracking-tight transition-all ${
                    showGifPicker || selectedGif
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  GIF
                </button>
                <span className={`text-[11px] font-mono ml-1 ${
                  isOverLimit ? 'text-destructive' :
                  charsLeft <= 20 ? 'text-gold' :
                  'text-muted-foreground/50'
                }`}>
                  {charsLeft}
                </span>
              </div>
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
                  "Loop"
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

                {postType === 'edit_share' && (
                  <input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Paste edit link (TikTok, YT, IG)..."
                    className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2"
                  />
                )}

                {showGifPicker && (
                  <div className="rounded-xl overflow-hidden border border-border mb-2">
                    <GifPicker
                      onSelect={handleGifSelect}
                      onClose={() => setShowGifPicker(false)}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
