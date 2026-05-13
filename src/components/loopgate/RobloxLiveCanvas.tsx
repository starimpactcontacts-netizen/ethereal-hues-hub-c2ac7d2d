import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Play, Check, MessageCircle, X, Scissors } from "lucide-react";
import { motion } from "framer-motion";

const teko = { fontFamily: "Teko, sans-serif" };
const CLIP_LEN = 30;

interface Props {
  theme?: string | null;
  deadline?: string | null;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submittedCount: number;
  totalCount: number;
  chatMessageCount: number;
  onUpload: (file: File) => Promise<void>;
  onOpenChat: () => void;
}

function fmtTime(deadline?: string | null) {
  if (!deadline) return "--:--";
  const diff = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RobloxLiveCanvas({
  theme,
  deadline,
  isSubmitting,
  hasSubmitted,
  submittedCount,
  totalCount,
  chatMessageCount,
  onUpload,
  onOpenChat,
}: Props) {
  const [tick, setTick] = useState(0);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!pickedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pickedFile]);

  const isVideo = pickedFile?.type.startsWith("video/");
  const max = Math.max(0, duration - CLIP_LEN);
  const end = Math.min(duration, start + CLIP_LEN);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPickedFile(f);
      setStart(0);
    }
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
      className="rounded-3xl bg-[#0d0d12] border border-white/10 overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#15151c] border-b border-white/[0.06]">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40" style={teko}>
            Theme
          </p>
          <p className="text-lg font-black uppercase tracking-tight text-violet-400 truncate leading-none mt-0.5" style={teko}>
            {theme || "Open"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40" style={teko}>
            Time Left
          </p>
          <p className="text-lg font-black tabular-nums text-sky-400 leading-none mt-0.5" style={teko}>
            {fmtTime(deadline)}
          </p>
        </div>
      </div>

      {/* Big preview frame */}
      <div className="p-3">
        <div className="relative aspect-[4/5] rounded-2xl bg-[#f5f5f7] overflow-hidden flex items-center justify-center">
          {hasSubmitted ? (
            <div className="text-center px-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-3">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <p className="text-xl font-black uppercase tracking-tight text-zinc-900" style={teko}>
                Edit Submitted
              </p>
              <p className="text-xs font-bold text-zinc-500 mt-1">
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
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center disabled:opacity-40"
                aria-label="Remove file"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center gap-3 px-8 py-10 rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
                {isSubmitting ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Upload className="w-7 h-7 text-white" strokeWidth={2.5} />
                )}
              </div>
              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-tight text-zinc-900" style={teko}>
                  Upload Edit
                </p>
                <p className="text-[11px] font-bold text-zinc-500 mt-0.5">
                  Tap to pick a video or photo
                </p>
              </div>
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
          <div className="mt-3 space-y-3 px-1">
            {isVideo && duration > CLIP_LEN && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3 h-3" />
                    Highlight {fmt(start)}–{fmt(end)}
                  </span>
                  <span>Total {fmt(duration)}</span>
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
                <button
                  onClick={handlePreview}
                  className="w-full py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white text-[11px] font-extrabold uppercase tracking-widest"
                  style={teko}
                >
                  <Play className="w-3 h-3 inline mr-1" />
                  Preview 30s
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-zinc-900 text-lg font-black uppercase tracking-[0.12em] disabled:opacity-50 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-transform"
              style={teko}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 inline animate-spin mr-2" /> Uploading…</>
              ) : (
                <>Submit</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Thin chat preview bar */}
      <button
        onClick={onOpenChat}
        className="w-full flex items-center gap-2 px-4 py-3 bg-black/60 backdrop-blur-sm border-t border-white/[0.06] active:bg-black/80 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
        <span className="text-[11px] text-white/60 truncate flex-1 text-left">
          {chatMessageCount > 0
            ? `${chatMessageCount} message${chatMessageCount === 1 ? "" : "s"} · tap to view`
            : "Live chat — tap to open"}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-400" style={teko}>
          Chat
        </span>
      </button>
    </motion.div>
  );
}