import { useState } from "react";
import { X } from "lucide-react";
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

const MAX_CHARS = 280;

export default function FeedComposeSheet({ open, onClose, userProfile, onPost }: FeedComposeSheetProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const canSubmit = (content.trim().length > 0 || selectedGif || uploadedMedia) && !isOverLimit && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const finalContent = selectedGif ? (content.trim() ? `${content.trim()} ${selectedGif}` : selectedGif) : content.trim();

    const savedContent = finalContent;
    const savedUploadedMedia = uploadedMedia ? { ...uploadedMedia } : null;

    setContent("");
    setSelectedGif(null);
    setUploadedMedia(null);
    setSubmitting(false);
    onClose();

    await onPost(
      savedContent,
      'text',
      undefined,
      undefined,
      savedUploadedMedia?.url,
      savedUploadedMedia?.type,
    );
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
    setUploadedMedia(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ zIndex: 9999 }}
    >
      {/* Safe area spacer for notch */}
      <div className="shrink-0" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

      {/* Media buttons + Close */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/15 shrink-0">
        {!uploadedMedia && !selectedGif && (
          <MediaUploadButton
            onUpload={(url, type) => { setUploadedMedia({ url, type }); setSelectedGif(null); }}
            uploadedUrl={null}
            onClear={() => {}}
          />
        )}
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

        {content.length > 0 && (
          <span className={`text-[11px] font-mono tabular-nums ${
            isOverLimit ? 'text-destructive' : charsLeft <= 20 ? 'text-gold' : 'text-muted-foreground/50'
          }`}>
            {charsLeft}
          </span>
        )}

        <button
          onClick={onClose}
          className="ml-auto w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <X className="w-4 h-4 text-black" strokeWidth={2.5} />
        </button>
      </div>

      {/* Compose body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-3 px-4 pt-4 pb-32">
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
              placeholder="What's on your mind?"
              autoFocus
              className="w-full bg-transparent text-foreground text-[17px] placeholder:text-muted-foreground/40 resize-none focus:outline-none leading-relaxed min-h-[160px]"
              maxLength={300}
              style={{ caretColor: 'hsl(var(--primary))' }}
            />

            {uploadedMedia && (
              <div className="mt-3">
                <MediaUploadButton
                  onUpload={() => {}}
                  uploadedUrl={uploadedMedia.url}
                  onClear={() => setUploadedMedia(null)}
                />
              </div>
            )}

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

      {/* Bottom POST button */}
      <div
        className="border-t border-border/20 bg-background px-4 pt-3 pb-24 shrink-0"
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl text-[16px] font-black tracking-wider transition-all ${
            canSubmit
              ? "bg-foreground text-background shadow-lg active:scale-[0.98]"
              : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          ) : "POST"}
        </button>
      </div>
    </div>
  );
}
