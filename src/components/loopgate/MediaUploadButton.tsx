import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MediaUploadButtonProps {
  onUpload: (url: string, type: 'image' | 'video') => void;
  uploadedUrl: string | null;
  onClear: () => void;
}

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

export default function MediaUploadButton({ onUpload, uploadedUrl, onClear }: MediaUploadButtonProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return;

    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not signed in');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-upload`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-file-name': file.name,
          'x-file-type': file.type,
          'Content-Type': file.type,
        },
        body: file,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Upload failed (${res.status})`);
      }
      const { url: cdnUrl } = await res.json();
      onUpload(cdnUrl, isVideo ? 'video' : 'image');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Upload failed — try again');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (uploadedUrl) {
    const isVideo = uploadedUrl.match(/\.(mp4|webm|mov)(\?|$)/i);
    return (
      <div className="relative mt-2 inline-block max-w-full">
        {isVideo ? (
          <video
            src={uploadedUrl}
            className="max-w-[220px] max-h-[160px] rounded-xl object-cover"
            controls
            muted
          />
        ) : (
          <img
            src={uploadedUrl}
            alt="Upload preview"
            className="max-w-[220px] max-h-[160px] rounded-xl object-cover"
          />
        )}
        <button
          onClick={onClear}
          className="absolute -top-2 -right-2 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
        title="Upload image or video"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFile}
        className="hidden"
      />
    </>
  );
}
