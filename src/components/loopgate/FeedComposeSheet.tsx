import { useState } from "react";
import { X, Sparkles, Link2, Globe } from "lucide-react";
import GifPicker from "./GifPicker";
import MediaUploadButton from "./MediaUploadButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { FeedPostItem } from "@/hooks/useFeedPosts";

interface FeedComposeSheetProps {
  open: boolean;
  onClose: () => void;
  userProfile?: { username: string; avatar_url: string | null; league?: string; level?: number } | null;
  onPost: (content: string, postType: FeedPostItem['post_type'], mediaUrl?: string, mediaPlatform?: string, uploadedMediaUrl?: string, uploadedMediaType?: string) => Promise<void>;
}

const POST_TYPES: { id: FeedPostItem['post_type']; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Loop', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'flex', label: 'Flex', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'edit_share', label: 'Edit', icon: <Link2 className="w-3.5 h-3.5" /> },
];

const MAX_CHARS = 280;

export default function FeedComposeSheet({ open, onClose, userProfile, onPost }: FeedComposeSheetProps) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postType, setPostType] = useState<FeedPostItem['post_type']>('text');
  const [submitting, setSubmitting] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

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
    await onPost(
      finalContent,
      postType,
      mediaUrl.trim() || undefined,
      platform,
      uploadedMedia?.url,
      uploadedMedia?.type,
    );
    setContent("");
    setMediaUrl("");
    setPostType('text');
    setSelectedGif(null);
    setUploadedMedia(null);
    setSubmitting(false);
    onClose();
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
    setUploadedMedia(null);
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
          className="fixed inset-0 z-[60] bg-background flex flex-col safe-top"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border/30 shrink-0">
            <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/30 transition-colors">
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <div className="flex items-center gap-1.5">
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
                </div>
              )}

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
                ) : "Loop"}
              </button>
            </div>
          </div>

          {/* Post type chips + media buttons */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/15 shrink-0">
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

            <div className="ml-auto flex items-center gap-1">
              {/* Upload button */}
              {!uploadedMedia && !selectedGif && (
                <MediaUploadButton
                  onUpload={(url, type) => { setUploadedMedia({ url, type }); setSelectedGif(null); }}
                  uploadedUrl={null}
                  onClear={() => {}}
                />
              )}
              {/* GIF button */}
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all ${
                  showGifPicker || selectedGif
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                GIF
              </button>
            </div>
          </div>

          {/* Compose body */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-3 px-4 pt-4 pb-24">
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
                    "What's happening in the loop?"
                  }
                  autoFocus
                  className="w-full bg-transparent text-foreground text-[17px] placeholder:text-muted-foreground/40 resize-none focus:outline-none leading-relaxed min-h-[160px]"
                  maxLength={300}
                  style={{ caretColor: 'hsl(var(--primary))' }}
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

                {/* Uploaded media preview */}
                {uploadedMedia && (
                  <div className="mt-3">
                    <MediaUploadButton
                      onUpload={() => {}}
                      uploadedUrl={uploadedMedia.url}
                      onClear={() => setUploadedMedia(null)}
                    />
                  </div>
                )}

                {/* Selected GIF preview */}
                {selectedGif && !uploadedMedia && (
                  <div className="relative mt-3 inline-block">
                    <img src={selectedGif} alt="Selected GIF" className="max-w-[200px] max-h-[160px] rounded-xl" />
                    <button
                      onClick={() => setSelectedGif(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* GIF Picker */}
                {showGifPicker && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-border">
                    <GifPicker
                      onSelect={handleGifSelect}
                      onClose={() => setShowGifPicker(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-border/20 bg-background/95 backdrop-blur px-4 py-2 safe-bottom shrink-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground/70">
                {uploadedMedia ? `${uploadedMedia.type === 'video' ? 'Video' : 'Image'} attached ✓` :
                 selectedGif ? 'GIF attached ✓' : 
                 postType === 'edit_share' ? 'Add your edit link' : 'Write your loop'}
              </p>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${
                  canSubmit
                    ? "bg-primary text-primary-foreground shadow-sm active:scale-95"
                    : "bg-primary/30 text-primary-foreground/40 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : "Loop"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
