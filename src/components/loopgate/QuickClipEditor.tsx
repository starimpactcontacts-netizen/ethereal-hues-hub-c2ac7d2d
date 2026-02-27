import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, Check, SkipBack, SkipForward, Scissors, RotateCcw,
  ChevronLeft, Sparkles, Volume2, VolumeX, Gauge, Layers,
  Wand2, SlidersHorizontal, Settings, ArrowUpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  FILTER_PRESETS, TEXT_STYLES, EFFECTS, TRANSITIONS, SPEED_OPTIONS,
  EXPORT_QUALITIES,
  applyEffect, renderTextOverlay, buildComputedFilter, formatTimecode,
  type FilterPreset, type TextStyleKey, type ExportQuality,
} from "@/lib/studioEffects";

type TextOverlay = { id: string; text: string; x: number; y: number; style: TextStyleKey; startTime: number; endTime: number };
type EditorTool = "trim" | "filters" | "text" | "audio" | "speed" | "effects" | "transitions" | "adjust" | "export" | "upscale";

// Adobe Pro accent — Premiere/AE blue-purple
const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

export default function QuickClipEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState<TextStyleKey>("bold");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("standard");
  const [filterTab, setFilterTab] = useState<string>("all");

  // Upscale state
  const upscaleInputRef = useRef<HTMLInputElement>(null);
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleUrl, setUpscaleUrl] = useState<string | null>(null);
  const [upscaleMode, setUpscaleMode] = useState<"2x" | "4x">("2x");
  const [upscaleState, setUpscaleState] = useState<"idle" | "processing" | "done">("idle");
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaleResultUrl, setUpscaleResultUrl] = useState<string | null>(null);
  const [upscaleDims, setUpscaleDims] = useState<{ w: number; h: number } | null>(null);

  const computedFilter = useMemo(() => buildComputedFilter(activeFilter, brightness, contrast, saturation, hueRotate), [activeFilter, brightness, contrast, saturation, hueRotate]);

  const toggleEffect = (effectId: string) => {
    setActiveEffects(prev => prev.includes(effectId) ? prev.filter(e => e !== effectId) : [...prev, effectId]);
  };

  const resetColorGrading = () => { setBrightness(100); setContrast(100); setSaturation(100); setHueRotate(0); };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (f.size > 500 * 1024 * 1024) { toast.error("Max 500MB"); return; }
    setFile(f); setVideoUrl(URL.createObjectURL(f)); setResultUrl(null); setState("idle");
    setProgress(0); setTextOverlays([]); setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null); setAudioName(""); setSpeed(1); setIsFullscreen(true);
    setActiveEffects([]); setActiveTransition(null); resetColorGrading();
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) { toast.error("Please select an audio file"); return; }
    setAudioFile(f); setAudioName(f.name); toast.success("Audio track added");
    e.target.value = "";
  };

  // Thumbnails
  useEffect(() => {
    if (!videoUrl) return;
    const vid = document.createElement("video");
    vid.src = videoUrl; vid.crossOrigin = "anonymous"; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration); setTrimEnd(vid.duration);
      const count = Math.min(14, Math.max(6, Math.floor(vid.duration / 2)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 60;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = []; let i = 0;
      const captureFrame = () => { if (i >= count) { setThumbnails(thumbs); return; } vid.currentTime = i * interval; };
      vid.onseeked = () => { ctx.drawImage(vid, 0, 0, 80, 60); thumbs.push(canvas.toDataURL("image/jpeg", 0.5)); i++; captureFrame(); };
      captureFrame();
    };
  }, [videoUrl]);

  // Video events
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // Canvas render loop
  useEffect(() => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let running = true;
    const draw = () => {
      if (!running) return;
      if (vid.videoWidth && vid.videoHeight) {
        if (canvas.width !== vid.videoWidth || canvas.height !== vid.videoHeight) {
          canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
        }
        ctx.filter = computedFilter;
        ctx.drawImage(vid, 0, 0);
        ctx.filter = "none";
        activeEffects.forEach(effectId => { try { applyEffect(ctx, canvas, effectId, vid.currentTime); } catch { /* */ } });
        textOverlays.forEach((overlay) => {
          if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
            try { renderTextOverlay(ctx, canvas, overlay.text, overlay.x, overlay.y, overlay.style); } catch { /* */ }
          }
        });
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [videoUrl, computedFilter, textOverlays, activeEffects]);

  const togglePlay = () => {
    const vid = videoRef.current; if (!vid) return;
    if (vid.paused) {
      if (vid.currentTime < trimStart || vid.currentTime >= trimEnd) vid.currentTime = trimStart;
      vid.playbackRate = speed; vid.play().catch(() => {}); setPlaying(true);
    } else { vid.pause(); setPlaying(false); }
  };

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !playing) return;
    const check = () => { if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); } };
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlays(prev => [...prev, { id: crypto.randomUUID(), text: textInput, x: 0.5, y: 0.5, style: textStyle, startTime: trimStart, endTime: trimEnd }]);
    setTextInput(""); toast.success("Text added");
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setVideoUrl(null); setResultUrl(null); setState("idle");
    setProgress(0); setTextOverlays([]); setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null); setAudioName(""); setTrimStart(0); setTrimEnd(0);
    setPlaying(false); setThumbnails([]); setSpeed(1); setIsFullscreen(false);
    setActiveEffects([]); setActiveTransition(null); resetColorGrading();
  };

  const seekTo = (time: number) => {
    const vid = videoRef.current; if (!vid) return;
    const clamped = Math.max(0, Math.min(duration, time));
    vid.currentTime = clamped; setCurrentTime(clamped);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = trimStart + pct * (trimEnd - trimStart);
    seekTo(time);
  };

  const startExport = useCallback(async () => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !file) return;
    setState("processing"); setProgress(0);
    const quality = EXPORT_QUALITIES.find(q => q.id === exportQuality) ?? EXPORT_QUALITIES[1];
    const ctx = canvas.getContext("2d")!;
    const exportW = Math.round(vid.videoWidth * quality.resolution);
    const exportH = Math.round(vid.videoHeight * quality.resolution);
    canvas.width = exportW; canvas.height = exportH;
    const stream = canvas.captureStream(quality.fps);
    if (audioFile) {
      try {
        const audioCtx = new AudioContext();
        const buf = await audioFile.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buf);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        source.start(0);
      } catch { /* continue without audio */ }
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: quality.bitrate });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    recorder.start(100);
    vid.currentTime = trimStart; vid.muted = true; vid.playbackRate = 1;
    await vid.play().catch(() => {});
    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) { vid.pause(); recorder.stop(); return; }
      ctx.filter = computedFilter;
      ctx.drawImage(vid, 0, 0, exportW, exportH);
      ctx.filter = "none";
      activeEffects.forEach(effectId => { try { applyEffect(ctx, canvas, effectId, vid.currentTime); } catch { /* */ } });
      textOverlays.forEach((overlay) => {
        if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
          try { renderTextOverlay(ctx, canvas, overlay.text, overlay.x, overlay.y, overlay.style); } catch { /* */ }
        }
      });
      setProgress(Math.min(99, Math.round(((vid.currentTime - trimStart) / exportDuration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    const blob = await resultPromise;
    setResultUrl(URL.createObjectURL(blob));
    setProgress(100); setState("done"); vid.muted = muted; vid.playbackRate = speed;
    canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
    toast.success("Export complete!");
  }, [file, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed, activeEffects, exportQuality]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_loopgate.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const filteredFilters = useMemo(() => filterTab === "all" ? FILTER_PRESETS : FILTER_PRESETS.filter(f => f.category === filterTab), [filterTab]);

  // ─── Upscaler ───
  const handleUpscaleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f2 = e.target.files?.[0];
    if (!f2 || !f2.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (f2.size > 500 * 1024 * 1024) { toast.error("Max 500MB"); return; }
    setUpscaleFile(f2); setUpscaleUrl(URL.createObjectURL(f2));
    setUpscaleResultUrl(null); setUpscaleState("idle"); setUpscaleProgress(0);
    e.target.value = "";
  };
  const startUpscale = useCallback(async () => {
    if (!upscaleUrl || !upscaleFile) return;
    setUpscaleState("processing"); setUpscaleProgress(0);
    const video = document.createElement("video");
    video.src = upscaleUrl; video.muted = true; video.playsInline = true;
    await new Promise<void>((res, rej) => { video.onloadedmetadata = () => res(); video.onerror = () => rej(); });
    const origW = video.videoWidth, origH = video.videoHeight;
    setUpscaleDims({ w: origW, h: origH });
    const scale = upscaleMode === "2x" ? 2 : 4;
    let finalW = origW * scale, finalH = origH * scale;
    if (finalW > 3840 || finalH > 3840) { const r = Math.min(3840 / finalW, 3840 / finalH); finalW = Math.round(finalW * r); finalH = Math.round(finalH * r); }
    finalW = finalW % 2 === 0 ? finalW : finalW + 1; finalH = finalH % 2 === 0 ? finalH : finalH + 1;
    const cvs = document.createElement("canvas"); cvs.width = finalW; cvs.height = finalH;
    const ctx2 = cvs.getContext("2d")!; ctx2.imageSmoothingEnabled = true; ctx2.imageSmoothingQuality = "high";
    const stream = cvs.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.min(finalW * finalH * 8, 40_000_000) });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    recorder.start(100); video.currentTime = 0; await video.play();
    const dur = video.duration;
    const drawLoop = () => {
      if (video.ended || video.paused) { recorder.stop(); return; }
      ctx2.drawImage(video, 0, 0, finalW, finalH);
      setUpscaleProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop(); video.onended = () => recorder.stop();
    const blob = await resultPromise;
    setUpscaleResultUrl(URL.createObjectURL(blob)); setUpscaleProgress(100); setUpscaleState("done");
    toast.success("Video upscaled!"); video.pause(); video.src = "";
  }, [upscaleUrl, upscaleFile, upscaleMode]);
  const handleUpscaleDownload = () => {
    if (!upscaleResultUrl || !upscaleFile) return;
    const a = document.createElement("a"); a.href = upscaleResultUrl;
    a.download = `${upscaleFile.name.replace(/\.[^/.]+$/, "")}_${upscaleMode}_upscaled.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const clearUpscale = () => {
    if (upscaleUrl) URL.revokeObjectURL(upscaleUrl);
    if (upscaleResultUrl) URL.revokeObjectURL(upscaleResultUrl);
    setUpscaleFile(null); setUpscaleUrl(null); setUpscaleResultUrl(null);
    setUpscaleState("idle"); setUpscaleProgress(0); setUpscaleDims(null);
  };

  // ─── Upload Screen ───
  if (!file) {
    return (
      <div className="space-y-5">
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
          className="w-full aspect-[9/16] max-h-[55vh] flex flex-col items-center justify-center gap-5 rounded-2xl transition-all"
          style={{ border: "1px solid #2a2a2a", background: "#151515" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}` }}>
            <Upload className="w-7 h-7" style={{ color: ACCENT }} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-semibold text-base" style={{ color: ACCENT }}>Start Editing</p>
            <p className="text-[11px]" style={{ color: "#666" }}>Tap to upload a clip</p>
            <p className="text-[10px]" style={{ color: "#444" }}>MP4, MOV, WEBM • Max 500MB</p>
          </div>
        </motion.button>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: Scissors, label: "Trim" },
            { icon: Sparkles, label: "18 Effects" },
            { icon: Type, label: "9 Styles" },
            { icon: Wand2, label: "24 Filters" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl p-3.5 flex flex-col items-center gap-2"
              style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
              <Icon className="w-4 h-4" style={{ color: "#555" }} />
              <span className="text-[9px] font-medium" style={{ color: "#666" }}>{label}</span>
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </div>
    );
  }

  // ─── Full Editor ───
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "relative"}`}
        style={{ height: isFullscreen ? "100dvh" : "auto", background: "#0a0a0a" }}>

        {/* ─── Top Bar ─── */}
        <div className="flex items-center gap-3 px-3 py-2.5 flex-shrink-0 safe-top" style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
          <button onClick={() => { if (isFullscreen) setIsFullscreen(false); else clearFile(); }}
            className="p-2 rounded-full transition-all hover:bg-white/5">
            <ChevronLeft className="w-5 h-5" style={{ color: "#aaa" }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "#e0e0e0" }}>{file.name}</p>
            <p className="text-[10px]" style={{ color: "#555" }}>{formatTimecode(trimEnd - trimStart)} clip</p>
          </div>
          <div className="flex items-center gap-1.5">
            {state === "done" ? (
              <button onClick={handleDownload}
                className="h-8 px-4 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                style={{ background: ACCENT, color: "#000" }}>
                <Download className="w-3.5 h-3.5" /> Save
              </button>
            ) : (
              <button onClick={startExport} disabled={state === "processing"}
                className="h-8 px-4 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-30"
                style={{ background: ACCENT, color: "#000" }}>
                {state === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                {state === "processing" ? `${progress}%` : "Export"}
              </button>
            )}
          </div>
        </div>

        {/* ─── Video Preview ─── */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0" style={{ background: "#000" }}>
          <video ref={videoRef} src={videoUrl!} className="hidden" playsInline preload="auto" />
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

          <AnimatePresence>
            {!playing && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          {playing && <button onClick={togglePlay} className="absolute inset-0" />}

          {activeEffects.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[60%]">
              {activeEffects.map(eff => (
                <span key={eff} className="px-2 py-0.5 rounded text-[8px] font-medium"
                  style={{ background: "rgba(0,0,0,0.6)", color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>
                  {EFFECTS.find(e => e.id === eff)?.label}
                </span>
              ))}
            </div>
          )}

          {speed !== 1 && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${ACCENT_BORDER}` }}>
              <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>{speed}x</span>
            </div>
          )}

          <button onClick={() => setMuted(!muted)}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {muted ? <VolumeX className="w-4 h-4" style={{ color: "#666" }} /> : <Volume2 className="w-4 h-4" style={{ color: "#888" }} />}
          </button>

          {state === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.85)" }}>
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
              <p className="text-sm font-medium" style={{ color: "#ccc" }}>Exporting {progress}%</p>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: ACCENT }} />
              </div>
            </div>
          )}

          {state === "done" && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-3 left-3 right-3 rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
              <span className="text-xs font-medium" style={{ color: "#22c55e" }}>Export ready — tap Save</span>
            </motion.div>
          )}
        </div>

        {/* ─── Timeline ─── */}
        <div className="flex-shrink-0" style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
            <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{formatTimecode(currentTime)}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => seekTo(trimStart)} className="p-1.5 rounded-full">
                <SkipBack className="w-4 h-4" style={{ color: "#666" }} />
              </button>
              <button onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${ACCENT_BORDER}`, background: ACCENT_DIM }}>
                {playing ? <Pause className="w-4 h-4" style={{ color: ACCENT }} /> : <Play className="w-4 h-4 ml-0.5" style={{ color: ACCENT }} />}
              </button>
              <button onClick={() => seekTo(trimEnd)} className="p-1.5 rounded-full">
                <SkipForward className="w-4 h-4" style={{ color: "#666" }} />
              </button>
            </div>
            <span className="text-[10px] font-mono" style={{ color: "#444" }}>{formatTimecode(trimEnd - trimStart)}</span>
          </div>

          <div className="px-3 pb-2.5">
            <div ref={timelineRef} onClick={handleTimelineClick}
              className="relative h-14 rounded-xl overflow-hidden cursor-pointer"
              style={{ background: "#111", border: "1px solid #222" }}>
              <div className="absolute inset-0 flex">
                {thumbnails.map((thumb, i) => (
                  <div key={i} className="flex-1 h-full overflow-hidden opacity-50">
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {thumbnails.length === 0 && <div className="flex-1" style={{ background: "#151515" }} />}
              </div>
              {duration > 0 && (
                <>
                  <div className="absolute inset-y-0 left-0 rounded-l-xl" style={{ width: `${(trimStart / duration) * 100}%`, background: "rgba(0,0,0,0.6)" }} />
                  <div className="absolute inset-y-0 right-0 rounded-r-xl" style={{ width: `${((duration - trimEnd) / duration) * 100}%`, background: "rgba(0,0,0,0.6)" }} />
                  <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-l-xl transition-all"
                    style={{ left: `${(trimStart / duration) * 100}%`, background: ACCENT }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max(0, Math.min((trimEnd - 0.5) / duration, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimStart(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }} />
                  <div className="absolute inset-y-0 w-2 cursor-col-resize z-10 rounded-r-xl transition-all"
                    style={{ left: `calc(${(trimEnd / duration) * 100}% - 8px)`, background: ACCENT }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max((trimStart + 0.5) / duration, Math.min(1, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimEnd(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove, { passive: true }); window.addEventListener("touchend", onEnd);
                    }} />
                  <div className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%`, background: "white" }}>
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full" style={{ background: "white", boxShadow: "0 0 4px rgba(255,255,255,0.5)" }} />
                  </div>
                </>
              )}
              {audioName && (
                <div className="absolute bottom-0 left-0 right-0 h-3 flex items-center px-1.5 rounded-b-xl" style={{ background: "rgba(168,85,247,0.08)", borderTop: "1px solid rgba(168,85,247,0.15)" }}>
                  <Music className="w-2 h-2 mr-0.5" style={{ color: "rgba(168,85,247,0.4)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(168,85,247,0.4)" }}>{audioName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tool Panel ─── */}
        <AnimatePresence>
          {activeTool && state === "idle" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="flex-shrink-0 overflow-hidden"
              style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}
            >
              <div className="p-4 max-h-[35vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>

                {activeTool === "filters" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Filters</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "basic", "cinema", "mood", "film"].map(cat => (
                        <button key={cat} onClick={() => setFilterTab(cat)}
                          className="px-2.5 py-1 text-[8px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: filterTab === cat ? ACCENT_DIM : "transparent",
                            color: filterTab === cat ? ACCENT : "#555",
                            border: filterTab === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {filteredFilters.map((preset) => (
                        <button key={preset.name} onClick={() => setActiveFilter(preset)} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                          <div className="w-14 h-14 rounded-lg transition-all"
                            style={{
                              backgroundColor: preset.color,
                              border: activeFilter.name === preset.name ? `2px solid ${ACCENT}` : "2px solid #2a2a2a",
                            }} />
                          <span className="text-[9px] font-medium" style={{ color: activeFilter.name === preset.name ? ACCENT : "#666" }}>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === "effects" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Effects</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {EFFECTS.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        return (
                          <button key={effect.id} onClick={() => toggleEffect(effect.id)}
                            className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            <span className="text-base">{effect.icon}</span>
                            <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#666" }}>{effect.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => setActiveEffects([])}
                        className="w-full py-2 text-[10px] font-medium rounded-lg"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Clear All ({activeEffects.length})
                      </button>
                    )}
                  </div>
                )}

                {activeTool === "transitions" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Transitions</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {TRANSITIONS.map((trans) => {
                        const isActive = activeTransition === trans.id;
                        return (
                          <button key={trans.id} onClick={() => setActiveTransition(isActive ? null : trans.id)}
                            className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                            }}>
                            <span className="text-base">{trans.icon}</span>
                            <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#666" }}>{trans.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTool === "text" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Text</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all"
                      style={{ background: "#151515", border: "1px solid #2a2a2a", color: "#e0e0e0" }}
                      autoFocus />
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.entries(TEXT_STYLES) as [TextStyleKey, typeof TEXT_STYLES[TextStyleKey]][]).map(([key, s]) => (
                        <button key={key} onClick={() => setTextStyle(key)}
                          className="py-2 text-[9px] font-semibold rounded-md transition-all capitalize"
                          style={{
                            background: textStyle === key ? ACCENT_DIM : "#151515",
                            color: textStyle === key ? ACCENT : "#555",
                            border: textStyle === key ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={addTextOverlay} disabled={!textInput.trim()}
                      className="w-full h-10 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                      style={{ background: ACCENT, color: "#000" }}>
                      Add Text
                    </button>
                    {textOverlays.length > 0 && (
                      <div className="space-y-1.5">
                        {textOverlays.map(t => (
                          <div key={t.id} className="flex items-center gap-2 rounded-md px-3 py-2" style={{ background: "#151515", border: "1px solid #222" }}>
                            <Type className="w-3 h-3 flex-shrink-0" style={{ color: "#555" }} />
                            <span className="text-[11px] truncate flex-1" style={{ color: "#aaa" }}>{t.text}</span>
                            <button onClick={() => setTextOverlays(prev => prev.filter(x => x.id !== t.id))}>
                              <X className="w-3 h-3" style={{ color: "#555" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTool === "audio" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Audio</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    {audioName ? (
                      <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#151515", border: "1px solid rgba(168,85,247,0.2)" }}>
                        <Music className="w-4 h-4" style={{ color: "#a855f7" }} />
                        <span className="text-xs truncate flex-1" style={{ color: "#ccc" }}>{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] font-medium" style={{ color: "#ef4444" }}>Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <Music className="w-5 h-5" style={{ color: "#555" }} />
                        <span className="text-xs" style={{ color: "#888" }}>Add Music Track</span>
                      </button>
                    )}
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
                  </div>
                )}

                {activeTool === "speed" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Speed</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {SPEED_OPTIONS.map((s) => (
                        <button key={s} onClick={() => setSpeed(s)}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg transition-all"
                          style={{
                            background: speed === s ? ACCENT_DIM : "#151515",
                            color: speed === s ? ACCENT : "#666",
                            border: speed === s ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                          }}>
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === "trim" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Trim</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] uppercase tracking-wider" style={{ color: "#555" }}>Start</label>
                        <Slider value={[trimStart]} onValueChange={(v) => setTrimStart(Math.min(v[0], trimEnd - 0.5))} min={0} max={duration} step={0.1} />
                        <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{formatTimecode(trimStart)}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] uppercase tracking-wider" style={{ color: "#555" }}>End</label>
                        <Slider value={[trimEnd]} onValueChange={(v) => setTrimEnd(Math.max(v[0], trimStart + 0.5))} min={0} max={duration} step={0.1} />
                        <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{formatTimecode(trimEnd)}</span>
                      </div>
                    </div>
                    <button onClick={() => { setTrimStart(0); setTrimEnd(duration); }}
                      className="text-[10px] h-8 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                      style={{ border: "1px solid #2a2a2a", color: "#888" }}>
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                )}

                {activeTool === "adjust" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Adjust</span>
                      <div className="flex gap-3">
                        <button onClick={resetColorGrading} className="text-[10px] font-medium" style={{ color: ACCENT }}>Reset</button>
                        <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                      </div>
                    </div>
                    {[
                      { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
                      { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
                      { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
                      { label: "Hue", value: hueRotate, set: setHueRotate, min: -180, max: 180 },
                    ].map(({ label, value, set, min, max }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[10px]" style={{ color: "#aaa" }}>{label}</span>
                          <span className="text-[10px] font-mono" style={{ color: "#555" }}>{value}</span>
                        </div>
                        <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTool === "export" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Export Quality</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    <div className="space-y-1.5">
                      {EXPORT_QUALITIES.map((q) => (
                        <button key={q.id} onClick={() => setExportQuality(q.id)}
                          className="w-full text-left px-4 py-3 rounded-lg transition-all"
                          style={{
                            background: exportQuality === q.id ? ACCENT_DIM : "#151515",
                            border: exportQuality === q.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #222",
                          }}>
                          <span className="text-xs font-semibold" style={{ color: exportQuality === q.id ? ACCENT : "#ccc" }}>{q.label}</span>
                          <span className="text-[9px] ml-2" style={{ color: "#555" }}>{q.fps}fps • {(q.bitrate / 1_000_000).toFixed(0)}Mbps</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTool === "upscale" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: "#e0e0e0" }}>Upscale</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px]" style={{ color: "#555" }}>Done</button>
                    </div>
                    {!upscaleFile ? (
                      <button onClick={() => upscaleInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <ArrowUpCircle className="w-6 h-6" style={{ color: ACCENT }} />
                        <span className="text-xs" style={{ color: "#888" }}>Upload Video to Upscale</span>
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                          <Film className="w-4 h-4" style={{ color: "#666" }} />
                          <span className="text-[10px] truncate flex-1" style={{ color: "#ccc" }}>{upscaleFile.name}</span>
                          <button onClick={clearUpscale}><X className="w-3 h-3" style={{ color: "#555" }} /></button>
                        </div>
                        {upscaleState === "idle" && (
                          <>
                            <div className="flex gap-1.5">
                              {(["2x", "4x"] as const).map((m) => (
                                <button key={m} onClick={() => setUpscaleMode(m)}
                                  className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                                  style={{
                                    background: upscaleMode === m ? ACCENT_DIM : "#151515",
                                    color: upscaleMode === m ? ACCENT : "#666",
                                    border: upscaleMode === m ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                                  }}>
                                  {m}
                                </button>
                              ))}
                            </div>
                            <button onClick={startUpscale}
                              className="w-full h-10 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              Upscale {upscaleMode}
                            </button>
                          </>
                        )}
                        {upscaleState === "processing" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                              <span className="text-[10px]" style={{ color: "#ccc" }}>Upscaling {upscaleMode}... {upscaleProgress}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${upscaleProgress}%`, background: ACCENT }} />
                            </div>
                          </div>
                        )}
                        {upscaleState === "done" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                              <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                              <span className="text-[10px] font-medium" style={{ color: "#22c55e" }}>Upscale complete!</span>
                            </div>
                            <button onClick={handleUpscaleDownload}
                              className="w-full h-10 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <Download className="w-3.5 h-3.5 inline mr-1.5" /> Download
                            </button>
                            <button onClick={clearUpscale}
                              className="w-full py-2 text-[10px] rounded-lg"
                              style={{ color: "#888", border: "1px solid #2a2a2a" }}>
                              Upscale Another
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <input ref={upscaleInputRef} type="file" accept="video/*" onChange={handleUpscaleFile} className="hidden" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom Toolbar ─── */}
        <div className="flex-shrink-0" style={{ background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
          <div className="flex items-center justify-center py-1.5 px-2">
            <div className="flex items-center gap-0.5 rounded-full p-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {([
                { id: "trim" as EditorTool, icon: Scissors, label: "Trim" },
                { id: "effects" as EditorTool, icon: Sparkles, label: "FX" },
                { id: "transitions" as EditorTool, icon: Layers, label: "Trans" },
                { id: "filters" as EditorTool, icon: Wand2, label: "Filters" },
                { id: "text" as EditorTool, icon: Type, label: "Text" },
                { id: "audio" as EditorTool, icon: Music, label: "Audio" },
                { id: "speed" as EditorTool, icon: Gauge, label: "Speed" },
                { id: "adjust" as EditorTool, icon: SlidersHorizontal, label: "Adjust" },
                { id: "upscale" as EditorTool, icon: ArrowUpCircle, label: "4K" },
                { id: "export" as EditorTool, icon: Settings, label: "Quality" },
              ]).map(({ id, icon: Icon, label }) => (
                <button key={id}
                  onClick={() => setActiveTool(activeTool === id ? null : id)}
                  className="flex-shrink-0 py-2 px-3 flex flex-col items-center gap-0.5 rounded-lg transition-all duration-150"
                  style={{
                    color: activeTool === id ? ACCENT : "#666",
                    background: activeTool === id ? ACCENT_DIM : "transparent",
                  }}>
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[7px] font-semibold tracking-wider uppercase">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="safe-bottom" />
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
