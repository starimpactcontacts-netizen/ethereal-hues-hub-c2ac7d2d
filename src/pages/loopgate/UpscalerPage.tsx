import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Upload, Download, Film, Sparkles, Check, Loader2, X, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type UpscaleMode = '2x' | '4x';
type ProcessingState = 'idle' | 'loading' | 'processing' | 'done' | 'error';

export default function UpscalerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<UpscaleMode>('2x');
  const [state, setState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      toast.error("File too large. Max 500MB.");
      return;
    }
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setState('idle');
    setProgress(0);
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setVideoUrl(null);
    setResultUrl(null);
    setState('idle');
    setProgress(0);
    setOriginalDimensions(null);
  };

  const startUpscale = useCallback(async () => {
    if (!videoUrl || !file) return;

    setState('loading');
    setProgress(0);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
    });

    const origW = video.videoWidth;
    const origH = video.videoHeight;
    setOriginalDimensions({ w: origW, h: origH });

    const scale = mode === '2x' ? 2 : 4;
    const targetW = origW * scale;
    const targetH = origH * scale;

    // Cap at 3840 (4K) on longest side
    let finalW = targetW;
    let finalH = targetH;
    if (finalW > 3840 || finalH > 3840) {
      const ratio = Math.min(3840 / finalW, 3840 / finalH);
      finalW = Math.round(finalW * ratio);
      finalH = Math.round(finalH * ratio);
    }

    // Make dimensions even for codec compatibility
    finalW = finalW % 2 === 0 ? finalW : finalW + 1;
    finalH = finalH % 2 === 0 ? finalH : finalH + 1;

    const canvas = document.createElement('canvas');
    canvas.width = finalW;
    canvas.height = finalH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    setState('processing');

    // Use MediaRecorder to capture canvas output
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: Math.min(finalW * finalH * 8, 40_000_000), // adaptive bitrate, cap 40mbps
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const resultPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
    });

    recorder.start(100); // collect data every 100ms

    // Play video and draw frames to canvas
    video.currentTime = 0;
    await video.play();

    const duration = video.duration;
    const drawLoop = () => {
      if (video.ended || video.paused) {
        recorder.stop();
        return;
      }
      ctx.drawImage(video, 0, 0, finalW, finalH);
      setProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();

    video.onended = () => {
      recorder.stop();
    };

    const blob = await resultPromise;
    const url = URL.createObjectURL(blob);
    setResultUrl(url);
    setProgress(100);
    setState('done');
    toast.success("Video upscaled! Download ready.");

    // Cleanup
    video.pause();
    video.src = '';
  }, [videoUrl, file, mode]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const ext = 'webm';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_${mode}_upscaled.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const scale = mode === '2x' ? 2 : 4;
  const outputW = originalDimensions ? Math.min(originalDimensions.w * scale, 3840) : null;
  const outputH = originalDimensions ? Math.min(originalDimensions.h * scale, 3840) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              4K Upscaler
            </h1>
            <p className="text-[10px] text-muted-foreground">Upscale your edits for free</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gold" />
                </div>
                <div className="text-center">
                  <p className="font-display text-sm text-gold">Upload Your Edit</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">MP4, MOV, WEBM • Max 500MB</p>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                <video
                  ref={videoRef}
                  src={videoUrl!}
                  className="w-full aspect-video object-contain"
                  controls={state === 'idle' || state === 'done'}
                  muted
                  playsInline
                />
                {/* Clear button */}
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-3 h-3 text-gold" />
                    <span className="text-[10px] text-white/80 truncate">{file.name}</span>
                    <span className="text-[10px] text-white/50 ml-auto">{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Scale Mode Selector */}
        {file && state !== 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <button
              onClick={() => setMode('2x')}
              className={`flex-1 py-3 rounded-xl border font-display text-lg transition-all ${
                mode === '2x'
                  ? 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'border-border bg-surface-1 text-muted-foreground hover:border-foreground/30'
              }`}
            >
              2×
              <span className="block text-[9px] font-sans font-normal opacity-60 mt-0.5">HD → Full HD</span>
            </button>
            <button
              onClick={() => setMode('4x')}
              className={`flex-1 py-3 rounded-xl border font-display text-lg transition-all ${
                mode === '4x'
                  ? 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'border-border bg-surface-1 text-muted-foreground hover:border-foreground/30'
              }`}
            >
              4×
              <span className="block text-[9px] font-sans font-normal opacity-60 mt-0.5">HD → 4K</span>
            </button>
          </motion.div>
        )}

        {/* Processing Progress */}
        {(state === 'loading' || state === 'processing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-1 border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-4 h-4 text-gold animate-spin" />
              <span className="text-sm font-medium">
                {state === 'loading' ? 'Loading video...' : `Upscaling ${mode}...`}
              </span>
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            {originalDimensions && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {originalDimensions.w}×{originalDimensions.h} → {outputW}×{outputH}
              </p>
            )}
          </motion.div>
        )}

        {/* Start Button */}
        {file && state === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={startUpscale}
              className="w-full h-12 bg-gold text-black hover:bg-gold/90 font-display text-base gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Upscale {mode}
            </Button>
          </motion.div>
        )}

        {/* Result */}
        {state === 'done' && resultUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-400">Upscale Complete!</p>
                {originalDimensions && (
                  <p className="text-[10px] text-muted-foreground">
                    {originalDimensions.w}×{originalDimensions.h} → {outputW}×{outputH}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleDownload}
              className="w-full h-12 bg-gold text-black hover:bg-gold/90 font-display text-base gap-2"
            >
              <Download className="w-4 h-4" />
              Download Upscaled Video
            </Button>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(resultUrl);
                toast.success("Link copied! (valid this session)");
              }}
              variant="outline"
              className="w-full gap-2 text-xs"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copy Download Link
            </Button>

            <Button
              onClick={clearFile}
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
            >
              Upscale Another Video
            </Button>
          </motion.div>
        )}

        {/* Info */}
        <div className="bg-surface-1 border border-border rounded-xl p-3 space-y-2">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">How it works</h3>
          <ul className="space-y-1.5">
            {[
              "Upload your edit (MP4, MOV, WEBM)",
              "Choose 2× or 4× resolution boost",
              "Processing happens in your browser — 100% free",
              "Download the upscaled version instantly",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}