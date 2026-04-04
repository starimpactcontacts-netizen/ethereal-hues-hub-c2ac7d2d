import { useState, useRef } from "react";
import { Bug, Lightbulb, MessageSquare, ImagePlus, X, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubmitTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-400" },
  { value: "suggestion", label: "Idea", icon: Lightbulb, color: "text-gold" },
  { value: "other", label: "Other", icon: MessageSquare, color: "text-primary" },
] as const;

export default function SubmitTicketModal({ open, onOpenChange }: SubmitTicketModalProps) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<string>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `tickets/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("loop-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("loop-media").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) {
      toast.error("Fill in the subject and message");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        username: (profile as any)?.username || "unknown",
        avatar_url: (profile as any)?.avatar_url || null,
        category,
        subject: subject.trim(),
        message: message.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success("Ticket submitted! We'll look into it 🙏");
      setSubject("");
      setMessage("");
      setImageUrl(null);
      setCategory("bug");
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] bg-card border-border/50 p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-sm font-bold">Report or Suggest</DialogTitle>
          <p className="text-[10px] text-muted-foreground">found a bug? got an idea? lmk 🤝</p>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {/* Category chips */}
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    active
                      ? "bg-white/10 border border-white/20 text-foreground"
                      : "bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon size={12} className={active ? cat.color : ""} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Subject */}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="what's going on?"
            maxLength={100}
            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="describe it... the more detail the faster we fix it"
            maxLength={2000}
            rows={4}
            className="w-full bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
          />

          {/* Image preview */}
          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="attachment" className="max-h-[120px] rounded-xl border border-border/30" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {uploading ? "uploading..." : "attach screenshot"}
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !subject.trim() || !message.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
