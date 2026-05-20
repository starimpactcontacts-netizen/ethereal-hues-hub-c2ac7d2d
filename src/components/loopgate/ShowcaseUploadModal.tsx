import { useRef, useState } from "react";
import { X, Upload, Loader2, Film, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBunny } from "@/lib/bunnyUpload";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  roundNumber?: number;
  onUploaded?: () => void;
}

const ACCEPT = "video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGE_MB = 25;

/**
 * Admin-only modal for adding inspiration drops to the Edit Showcase.
 * Uploads a video (Bunny Stream) or image (Supabase Storage) and inserts
 * an `event_participations` / `round_participations` row flagged `is_showcase=true`.
 * These rows are NOT ranked submissions — they're inspo content only.
 */
export default function ShowcaseUploadModal({ isOpen, onClose, eventId, eventTitle, roundNumber, onUploaded }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const isVideo = !!file && file.type.startsWith("video/");
  const isImage = !!file && file.type.startsWith("image/");
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/") && f.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setBusy(true);
    setProgress(0);
    try {
      let url = "";
      let thumbnailUrl: string | null = null;

      if (isVideo) {
        const res = await uploadToBunny(file, {
          folder: "showcase",
          onProgress: (p) => setProgress(Math.round(p * 100)),
        });
        url = res.mp4Url || res.url;
        thumbnailUrl = res.thumbnailUrl || null;
      } else {
        const ext = file.name.split(".").pop() || "bin";
        const path = `showcase/${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("loop-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("loop-media").getPublicUrl(path);
        url = pub.publicUrl;
        thumbnailUrl = pub.publicUrl;
        setProgress(100);
      }

      const base: any = {
        event_id: eventId,
        user_id: user.id,
        platform: "upload",
        submission_url: url,
        thumbnail_url: thumbnailUrl,
        custom_title: title.trim() || null,
        is_showcase: true,
      };

      if (roundNumber) {
        const { error } = await supabase.from("round_participations").insert({
          ...base,
          round_number: roundNumber,
          status: "active",
          submitted_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_participations").insert({
          ...base,
          status: "approved",
        });
        if (error) throw error;
      }

      toast.success("Added to Edit Showcase");
      onUploaded?.();
      setFile(null);
      setTitle("");
      onClose();
    } catch (err: any) {
      console.error("Showcase upload failed", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-arena-bg/85 backdrop-blur-sm">
      <div className="w-full max-w-md bg-arena-panel rounded-lg overflow-hidden shadow-[0_24px_70px_hsl(var(--arena-bg)/0.55)]">
        <div className="flex items-center justify-between p-4 border-b border-arena-line/40">
          <div>
            <h2 className="font-bold text-arena-ink">Add Showcase Drop</h2>
            <p className="text-xs text-arena-muted">{eventTitle} · Inspo only — not ranked</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-arena-strong rounded-lg text-arena-ink" disabled={busy}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[3/4] rounded-lg bg-arena-strong border-2 border-dashed border-arena-line/50 flex flex-col items-center justify-center gap-2 text-arena-muted hover:text-arena-ink hover:border-arena-amber transition"
            >
              <Upload size={28} />
              <span className="text-[12px] font-black uppercase tracking-[0.16em]">Pick video or photo</span>
              <span className="text-[10px] text-arena-muted/80">MP4 · MOV · WEBM · JPG · PNG · GIF</span>
            </button>
          ) : (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-black">
              {isVideo && previewUrl && (
                <video src={previewUrl} className="w-full h-full object-contain" controls muted playsInline />
              )}
              {isImage && previewUrl && (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
              <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-arena-bg/80 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-arena-ink">
                {isVideo ? <Film size={11} /> : <ImageIcon size={11} />}
                {isVideo ? "Video" : "Image"}
              </div>
              {!busy && (
                <button
                  onClick={() => setFile(null)}
                  className="absolute top-2 right-2 rounded-full bg-arena-bg/80 p-1.5 text-arena-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handlePick}
            className="hidden"
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-arena-muted mb-2">
              Caption (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reference smear frame"
              maxLength={80}
              className="w-full bg-arena-strong rounded-lg px-4 py-3 text-sm text-arena-ink placeholder:text-arena-muted/60 focus:outline-none shadow-[0_0_0_1px_hsl(var(--arena-line)/0.25)] focus:shadow-[0_0_0_1px_hsl(var(--arena-amber))]"
              disabled={busy}
            />
          </div>

          {busy && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-arena-strong overflow-hidden">
                <div className="h-full bg-arena-emerald transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-arena-muted text-center">Uploading… {progress}%</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || busy}
            className="w-full py-4 bg-arena-emerald text-primary font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_12px_30px_hsl(var(--arena-emerald)/0.28)]"
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading…
              </>
            ) : (
              "Add to Showcase"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}