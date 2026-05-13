import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Play, Check, Scissors, X } from "lucide-react";
import { motion } from "framer-motion";

const teko = { fontFamily: "Teko, sans-serif" };
const CLIP_LEN = 30;

interface Props {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submittedCount: number;
  totalCount: number;
  onUpload: (file: File) => Promise<void>;
}

export default function RobloxLiveCanvas({
  isSubmitting,
  hasSubmitted,
  submittedCount,
  totalCount,
  onUpload,
}: Props) {
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!pickedFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(pickedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  const isVideo = pickedFile?.type.startsWith("video/");
  const max = Math.max(0, duration - CLIP_LEN);
  const end = Math.min(duration, start + CLIP_LEN);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPickedFile(f); setStart(0); }
  };

  const handleSubmit = async () => {
    if (!pickedFile) return;
    await onUpload(pickedFile);
    setPickedFile(null);
  };

  const handlePreview = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    v.play().catch(() => {});
    const stop = setTimeout(() => v.pause(), CLIP_LEN * 1000);
    v.onpause = () => clearTimeout(stop);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Compact preview frame — laptop friendly */}
      <div className="relative aspect-video rounded-xl bg-[#0a0a0d] border border-white/[0.08] overflow-hidden">
        {hasSubmitted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/[0.04]">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-2">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <p className="text-base font-black uppercase tracking-tight text-emerald-400" style={teko}>
              Edit Locked In
            </p>
            <p className="text-[10px] font-bold text-white/40 mt-0.5">
              {submittedCount}/{totalCount} editors in
            </p>
          </div>
        ) : pickedFile && previewUrl ? (
          <>
            {isVideo ? (
              <video
                ref={videoRef}
                src={previewUrl}
                className="w-full h-full object-contain bg-black"
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setDuration(v.duration || 0);
                  v.currentTime = 0;
                }}
                onClick={handlePreview}
              />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-black" />
            )}
            <button
              onClick={() => setPickedFile(null)}
              disabled={isSubmitting}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center disabled:opacity-40"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isSubmitting}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-white" strokeWidth={2.5} />
              )}
            </div>
            <p className="text-lg font-black uppercase tracking-tight text-white" style={teko}>
              Drop Your Edit
            </p>
            <p className="text-[10px] font-bold text-white/40 -mt-1">
              video or photo · pick 30s highlight
            </p>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,image/jpeg,image/png,image/webp"
        onChange={handlePick}
        className="hidden"
      />

      {/* Trim + Submit controls */}
      {pickedFile && !hasSubmitted && (
        <div className="mt-2 space-y-2">
          {isVideo && duration > CLIP_LEN && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/50">
                <span className="flex items-center gap-1">
                  <Scissors className="w-2.5 h-2.5" />
                  Highlight {fmt(start)}–{fmt(end)}
                </span>
                <button onClick={handlePreview} className="flex items-center gap-1 text-violet-400">
                  <Play className="w-2.5 h-2.5" /> Preview
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={max}
                step={0.5}
                value={Math.min(start, max)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setStart(v);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                className="w-full accent-violet-500"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-900 text-base font-black uppercase tracking-[0.12em] disabled:opacity-50 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-transform"
            style={teko}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 inline animate-spin mr-2" /> Uploading…</>
            ) : (
              <>Submit Edit</>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
