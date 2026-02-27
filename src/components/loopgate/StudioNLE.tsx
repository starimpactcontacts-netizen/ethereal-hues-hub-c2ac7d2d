import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, SkipBack, SkipForward, Scissors, RotateCcw,
  Sparkles, Volume2, VolumeX, Plus, Image,
  Layers, Eye, EyeOff,
  Trash2, Copy, ZoomIn, ZoomOut, Undo, Redo,
  FileVideo, Wand2, SlidersHorizontal, Keyboard, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  FILTER_PRESETS, TEXT_STYLES, EFFECTS, TRANSITIONS, SPEED_OPTIONS,
  EXPORT_QUALITIES,
  applyEffect, renderTextOverlay, buildComputedFilter, formatTimecode,
  type FilterPreset, type TextStyleKey, type ExportQuality,
} from "@/lib/studioEffects";

// ─── Types ───
type TextOverlay = { id: string; text: string; x: number; y: number; style: TextStyleKey; startTime: number; endTime: number };
type MediaItem = { id: string; file: File; url: string; thumbnail: string; duration: number; name: string; type: "video" | "audio" | "image" };
type TimelineTrack = { id: string; name: string; type: "video" | "audio" | "text" | "effect"; visible: boolean; locked: boolean };
type ToolTab = "media" | "audio" | "text" | "effects" | "transitions" | "filters" | "adjust" | "export";
type HistoryEntry = { filter: FilterPreset; effects: string[]; brightness: number; contrast: number; saturation: number; hueRotate: number; speed: number; trimStart: number; trimEnd: number; textOverlays: TextOverlay[] };

const TOOL_TABS: { id: ToolTab; icon: typeof Film; label: string }[] = [
  { id: "media", icon: FileVideo, label: "Media" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "transitions", icon: Layers, label: "Trans" },
  { id: "filters", icon: Wand2, label: "Filters" },
  { id: "text", icon: Type, label: "Text" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  { id: "export", icon: Settings, label: "Export" },
];

export default function StudioNLE() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Core state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
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
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);

  // UI state
  const [activeToolTab, setActiveToolTab] = useState<ToolTab | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("high");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [effectCategory, setEffectCategory] = useState<string>("all");

  // Color grading
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);

  // Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const activeMedia = useMemo(() => mediaItems.find((m) => m.id === activeMediaId) ?? null, [mediaItems, activeMediaId]);
  const [tracks] = useState<TimelineTrack[]>([
    { id: "v1", name: "Video", type: "video", visible: true, locked: false },
    { id: "a1", name: "Audio", type: "audio", visible: true, locked: false },
    { id: "t1", name: "Text", type: "text", visible: true, locked: false },
    { id: "e1", name: "FX", type: "effect", visible: true, locked: false },
  ]);

  const videoUrl = activeMedia?.url ?? null;
  const computedFilter = useMemo(() => buildComputedFilter(activeFilter, brightness, contrast, saturation, hueRotate), [activeFilter, brightness, contrast, saturation, hueRotate]);
  const filteredFilters = useMemo(() => filterCategory === "all" ? FILTER_PRESETS : FILTER_PRESETS.filter(f => f.category === filterCategory), [filterCategory]);
  const filteredEffects = useMemo(() => effectCategory === "all" ? EFFECTS : EFFECTS.filter(e => e.category === effectCategory), [effectCategory]);

  // ─── Undo/Redo ───
  const pushHistory = useCallback(() => {
    const entry: HistoryEntry = { filter: activeFilter, effects: [...activeEffects], brightness, contrast, saturation, hueRotate, speed, trimStart, trimEnd, textOverlays: [...textOverlays] };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex(prev => prev + 1);
  }, [activeFilter, activeEffects, brightness, contrast, saturation, hueRotate, speed, trimStart, trimEnd, textOverlays, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    setActiveFilter(entry.filter); setActiveEffects(entry.effects);
    setBrightness(entry.brightness); setContrast(entry.contrast);
    setSaturation(entry.saturation); setHueRotate(entry.hueRotate);
    setSpeed(entry.speed); setTrimStart(entry.trimStart); setTrimEnd(entry.trimEnd);
    setTextOverlays(entry.textOverlays);
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    setActiveFilter(entry.filter); setActiveEffects(entry.effects);
    setBrightness(entry.brightness); setContrast(entry.contrast);
    setSaturation(entry.saturation); setHueRotate(entry.hueRotate);
    setSpeed(entry.speed); setTrimStart(entry.trimStart); setTrimEnd(entry.trimEnd);
    setTextOverlays(entry.textOverlays);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); seekTo(Math.max(0, currentTime - (e.shiftKey ? 5 : 1))); break;
        case "ArrowRight": e.preventDefault(); seekTo(Math.min(duration, currentTime + (e.shiftKey ? 5 : 1))); break;
        case "j": seekTo(Math.max(0, currentTime - 5)); break;
        case "k": togglePlay(); break;
        case "l": seekTo(Math.min(duration, currentTime + 5)); break;
        case "i": setTrimStart(currentTime); pushHistory(); toast.success("In point set"); break;
        case "o": setTrimEnd(currentTime); pushHistory(); toast.success("Out point set"); break;
        case "s": if (e.ctrlKey || e.metaKey) { e.preventDefault(); startExport(); } break;
        case "z": if (e.ctrlKey || e.metaKey) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); } break;
        case "m": setMuted(prev => !prev); break;
        case "[": setSpeed(prev => SPEED_OPTIONS[Math.max(0, SPEED_OPTIONS.indexOf(prev) - 1)]); break;
        case "]": setSpeed(prev => SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, SPEED_OPTIONS.indexOf(prev) + 1)]); break;
        case "Home": seekTo(trimStart); break;
        case "End": seekTo(trimEnd); break;
        case "?": setShowShortcuts(prev => !prev); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentTime, duration, trimStart, trimEnd, playing]);

  // ─── File Handling ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("video/") && !f.type.startsWith("image/") && !f.type.startsWith("audio/")) {
        toast.error(`Unsupported file: ${f.name}`); return;
      }
      if (f.size > 500 * 1024 * 1024) { toast.error("Max 500MB per file"); return; }
      const url = URL.createObjectURL(f);
      const id = crypto.randomUUID();
      const type = f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "image";
      if (type === "video") {
        const vid = document.createElement("video");
        vid.src = url; vid.muted = true; vid.preload = "auto";
        vid.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 160; canvas.height = 90;
          vid.currentTime = 1;
          vid.onseeked = () => {
            canvas.getContext("2d")!.drawImage(vid, 0, 0, 160, 90);
            const thumb = canvas.toDataURL("image/jpeg", 0.6);
            setMediaItems((prev) => [...prev, { id, file: f, url, thumbnail: thumb, duration: vid.duration, name: f.name, type }]);
            if (!activeMediaId) setActiveMediaId(id);
          };
        };
      } else {
        setMediaItems((prev) => [...prev, { id, file: f, url, thumbnail: "", duration: 0, name: f.name, type }]);
        if (!activeMediaId && type === "image") setActiveMediaId(id);
      }
    });
    e.target.value = "";
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) { toast.error("Please select an audio file"); return; }
    setAudioFile(f); setAudioName(f.name); toast.success("Audio track added");
    e.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMediaItems((prev) => { const item = prev.find((m) => m.id === id); if (item) URL.revokeObjectURL(item.url); return prev.filter((m) => m.id !== id); });
    if (activeMediaId === id) setActiveMediaId(mediaItems.find((m) => m.id !== id)?.id ?? null);
  };

  const toggleEffect = (effectId: string) => {
    pushHistory();
    setActiveEffects(prev => prev.includes(effectId) ? prev.filter(e => e !== effectId) : [...prev, effectId]);
  };

  // ─── Timeline Thumbnails ───
  useEffect(() => {
    if (!videoUrl) { setThumbnails([]); return; }
    const vid = document.createElement("video");
    vid.src = videoUrl; vid.crossOrigin = "anonymous"; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration); setTrimEnd(vid.duration);
      const count = Math.min(24, Math.max(8, Math.floor(vid.duration / 1.2)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 45;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = []; let i = 0;
      const captureFrame = () => { if (i >= count) { setThumbnails(thumbs); return; } vid.currentTime = i * interval; };
      vid.onseeked = () => { ctx.drawImage(vid, 0, 0, 80, 45); thumbs.push(canvas.toDataURL("image/jpeg", 0.4)); i++; captureFrame(); };
      captureFrame();
    };
  }, [videoUrl]);

  // ─── Video Events ───
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // ─── Canvas Render Loop ───
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
        activeEffects.forEach(effectId => {
          try { applyEffect(ctx, canvas, effectId, vid.currentTime); } catch { /* graceful */ }
        });
        textOverlays.forEach((overlay) => {
          if (vid.currentTime >= overlay.startTime && vid.currentTime <= overlay.endTime) {
            try { renderTextOverlay(ctx, canvas, overlay.text, overlay.x, overlay.y, overlay.style); } catch { /* graceful */ }
          }
        });
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [videoUrl, computedFilter, textOverlays, activeEffects]);

  // ─── Playback Controls ───
  const togglePlay = useCallback(() => {
    const vid = videoRef.current; if (!vid || !videoUrl) return;
    if (vid.paused) {
      if (vid.currentTime < trimStart || vid.currentTime >= trimEnd) vid.currentTime = trimStart;
      vid.playbackRate = speed; vid.play().catch(() => {}); setPlaying(true);
    } else { vid.pause(); setPlaying(false); }
  }, [trimStart, trimEnd, speed, videoUrl]);

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !playing) return;
    const check = () => { if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); } };
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const seekTo = useCallback((time: number) => {
    const vid = videoRef.current; if (!vid) return;
    const clamped = Math.max(0, Math.min(duration, time));
    vid.currentTime = clamped; setCurrentTime(clamped);
  }, [duration]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pct * duration);
  };

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    pushHistory();
    setTextOverlays((prev) => [...prev, { id: crypto.randomUUID(), text: textInput, x: 0.5, y: 0.5, style: textStyle, startTime: trimStart, endTime: trimEnd }]);
    setTextInput(""); toast.success("Text overlay added");
  };

  const removeTextOverlay = (id: string) => { pushHistory(); setTextOverlays((prev) => prev.filter((t) => t.id !== id)); };

  const splitAtPlayhead = () => {
    if (!activeMedia || currentTime <= trimStart || currentTime >= trimEnd) return;
    pushHistory(); toast.success(`Split at ${formatTimecode(currentTime, true)}`);
  };

  const resetColorGrading = () => { pushHistory(); setBrightness(100); setContrast(100); setSaturation(100); setHueRotate(0); };

  // ─── Export ───
  const startExport = useCallback(async () => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !activeMedia) return;
    setState("processing"); setProgress(0);
    const quality = EXPORT_QUALITIES.find(q => q.id === exportQuality) ?? EXPORT_QUALITIES[2];
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
      } catch { /* audio error, continue without */ }
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
  }, [activeMedia, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed, activeEffects, exportQuality]);

  const handleDownload = () => {
    if (!resultUrl || !activeMedia) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `${activeMedia.name.replace(/\.[^/.]+$/, "")}_loopgate.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ─── Glass Panel Component ───
  const GlassPanel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-surface-0/80 backdrop-blur-xl border border-border/50 ${className}`}>{children}</div>
  );

  // ─── RENDER ───
  return (
    <div className="h-full flex flex-col bg-black overflow-hidden select-none">
      {/* ═══ TOP BAR — Glassmorphism ═══ */}
      <GlassPanel className="h-12 flex items-center px-4 gap-3 flex-shrink-0 z-20 rounded-none border-x-0 border-t-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-foreground tracking-[0.15em]">STUDIO</span>
          <span className="text-[8px] text-gold/90 bg-gold/8 border border-gold/20 px-1.5 py-[1px] rounded-full font-bold tracking-[0.2em]">PRO</span>
        </div>
        <div className="flex-1" />

        {/* Undo/Redo — minimal pill */}
        <div className="flex items-center bg-surface-2/60 rounded-full p-0.5 gap-0.5">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all rounded-full hover:bg-surface-3/50" title="Undo">
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all rounded-full hover:bg-surface-3/50" title="Redo">
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        <button onClick={() => setShowShortcuts(prev => !prev)} className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-surface-2/50" title="Shortcuts (?)">
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        <button onClick={() => { pushHistory(); setTrimStart(0); setTrimEnd(duration); resetColorGrading(); setActiveFilter(FILTER_PRESETS[0]); setActiveEffects([]); }}
          className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-surface-2/50" title="Reset All">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-6 bg-border/30" />

        {state === "done" ? (
          <Button onClick={handleDownload} size="sm" className="h-9 bg-gold text-primary-foreground hover:bg-gold/90 text-[11px] font-bold gap-1.5 rounded-full px-5 shadow-[0_0_20px_hsl(var(--gold)/0.2)]">
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        ) : (
          <Button onClick={startExport} size="sm" disabled={state === "processing" || !activeMedia}
            className="h-9 bg-gold text-primary-foreground hover:bg-gold/90 text-[11px] font-bold gap-1.5 rounded-full px-5 disabled:opacity-30 shadow-[0_0_20px_hsl(var(--gold)/0.15)]">
            {state === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
            {state === "processing" ? `${progress}%` : "Export"}
          </Button>
        )}
      </GlassPanel>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex min-h-0">
        {/* ─── CENTER: Preview ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">
            {videoUrl ? (
              <>
                <video ref={videoRef} src={videoUrl} className="hidden" playsInline preload="auto" />
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-sm" />

                {/* Play overlay */}
                <AnimatePresence>
                  {!playing && (
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <motion.div
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                        className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                      >
                        <Play className="w-7 h-7 text-white ml-1" />
                      </motion.div>
                    </motion.button>
                  )}
                </AnimatePresence>
                {playing && <button onClick={togglePlay} className="absolute inset-0" />}

                {/* Effect badges — glass */}
                {activeEffects.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {activeEffects.map(eff => (
                      <motion.div key={eff} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-black/50 backdrop-blur-md px-2.5 py-1 border border-gold/20 rounded-full">
                        <span className="text-[9px] text-gold font-semibold tracking-wide">{EFFECTS.find(e => e.id === eff)?.label}</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Speed + filter badges */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {speed !== 1 && (
                    <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 border border-gold/20 rounded-full">
                      <span className="text-[10px] text-gold font-bold">{speed}x</span>
                    </div>
                  )}
                  {activeFilter.name !== "none" && (
                    <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 border border-white/10 rounded-full">
                      <span className="text-[10px] text-white/80 font-medium">{activeFilter.label}</span>
                    </div>
                  )}
                </div>

                {/* Export overlay */}
                {state === "processing" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-gold animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-gold font-bold">{progress}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground/80">Exporting</p>
                    <div className="w-56 h-1 bg-surface-2 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="text-center space-y-5 group cursor-pointer p-12"
              >
                <div className="w-20 h-20 mx-auto bg-surface-1/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-border/30 group-hover:border-gold/30 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-base font-display text-foreground tracking-wider">IMPORT MEDIA</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Video, Image, Audio • Max 500MB</p>
                </div>
              </motion.button>
            )}

            {/* Shortcuts overlay */}
            <AnimatePresence>
              {showShortcuts && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 backdrop-blur-xl z-30 flex items-center justify-center p-8">
                  <div className="max-w-lg w-full bg-surface-1/50 backdrop-blur-md rounded-2xl border border-border/30 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-display text-foreground tracking-[0.15em]">KEYBOARD SHORTCUTS</h3>
                      <button onClick={() => setShowShortcuts(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-surface-2/50 transition-all"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                      {[
                        ["Space", "Play / Pause"], ["← →", "Seek ±1s"], ["Shift+← →", "Seek ±5s"],
                        ["J / K / L", "Back / Play / Fwd"], ["I", "Set In Point"], ["O", "Set Out Point"],
                        ["M", "Toggle Mute"], ["[ ]", "Speed ↓ / ↑"], ["⌘Z", "Undo"],
                        ["⌘⇧Z", "Redo"], ["⌘S", "Export"], ["Home / End", "Go to In / Out"],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-center gap-3">
                          <kbd className="bg-surface-2/80 border border-border/30 rounded-md px-2 py-0.5 font-mono text-[10px] text-gold/80 min-w-[44px] text-center">{key}</kbd>
                          <span className="text-muted-foreground">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Player Controls — Glass ─── */}
          <GlassPanel className="h-14 flex items-center px-5 gap-4 flex-shrink-0 rounded-none border-x-0">
            <span className="text-[11px] text-gold/80 tabular-nums font-mono w-[85px]">{formatTimecode(currentTime, true)}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => seekTo(trimStart)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-surface-2/50">
                <SkipBack className="w-4 h-4" />
              </button>
              <motion.button
                onClick={togglePlay} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                className="w-11 h-11 bg-gold/10 border border-gold/25 rounded-full flex items-center justify-center hover:bg-gold/15 transition-all"
              >
                {playing ? <Pause className="w-5 h-5 text-gold" /> : <Play className="w-5 h-5 text-gold ml-0.5" />}
              </motion.button>
              <button onClick={() => seekTo(trimEnd)} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-surface-2/50">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground/60 tabular-nums font-mono w-[85px]">{formatTimecode(duration, true)}</span>
            <div className="flex-1" />

            <button onClick={splitAtPlayhead} className="p-2 text-muted-foreground hover:text-gold transition-all rounded-full hover:bg-surface-2/50" title="Split">
              <Scissors className="w-4 h-4" />
            </button>
            <button onClick={() => setSpeed(SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(speed) + 1) % SPEED_OPTIONS.length])}
              className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-gold border border-border/30 rounded-full transition-all hover:border-gold/30 hover:bg-gold/5">
              {speed}x
            </button>
            <button onClick={() => setMuted(!muted)} className="p-2 text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-surface-2/50">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </GlassPanel>
        </div>

        {/* ─── SIDE PANEL — Glass, smooth animation ─── */}
        <AnimatePresence mode="wait">
          {activeToolTab && (
            <motion.div
              key={activeToolTab}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="flex-shrink-0 bg-surface-0/90 backdrop-blur-xl border-l border-border/30 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-12 border-b border-border/20 flex-shrink-0">
                <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-[0.15em]">
                  {TOOL_TABS.find(t => t.id === activeToolTab)?.label}
                </span>
                <button onClick={() => setActiveToolTab(null)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-surface-2/50 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
                {/* MEDIA */}
                {activeToolTab === "media" && (
                  <>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-5 border border-dashed border-border/40 hover:border-gold/40 bg-surface-1/40 hover:bg-surface-1/60 transition-all flex items-center justify-center gap-2.5 rounded-xl">
                      <Plus className="w-5 h-5 text-gold/70" />
                      <span className="text-xs font-semibold text-gold/80">Import Media</span>
                    </motion.button>
                    {mediaItems.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {mediaItems.map((item) => (
                          <motion.div key={item.id} whileHover={{ scale: 1.02 }}
                            onClick={() => setActiveMediaId(item.id)}
                            className={`relative group cursor-pointer border rounded-xl overflow-hidden transition-all ${activeMediaId === item.id ? "border-gold/50 shadow-[0_0_12px_hsl(var(--gold)/0.1)]" : "border-border/30 hover:border-foreground/15"}`}>
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.name} className="w-full aspect-video object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full aspect-video bg-surface-2/50 flex items-center justify-center">
                                {item.type === "audio" ? <Music className="w-5 h-5 text-muted-foreground/50" /> : <Image className="w-5 h-5 text-muted-foreground/50" />}
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="text-[9px] text-white/80 truncate font-medium">{item.name}</p>
                              {item.duration > 0 && <p className="text-[7px] text-white/40">{formatTimecode(item.duration)}</p>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center hidden group-hover:flex transition-all border border-white/10">
                              <X className="w-3 h-3 text-white/70" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* EFFECTS */}
                {activeToolTab === "effects" && (
                  <>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                      {["all", "distort", "color", "style", "light"].map(cat => (
                        <button key={cat} onClick={() => setEffectCategory(cat)}
                          className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-full border transition-all flex-shrink-0 ${effectCategory === cat ? "border-gold/40 bg-gold/8 text-gold" : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredEffects.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        return (
                          <motion.button key={effect.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                            onClick={() => toggleEffect(effect.id)}
                            className={`py-3.5 rounded-xl flex flex-col items-center gap-2 border transition-all ${isActive ? "border-gold/40 bg-gold/8 shadow-[0_0_16px_hsl(var(--gold)/0.1)]" : "border-border/20 bg-surface-1/30 hover:border-border/40 hover:bg-surface-1/50"}`}>
                            <span className="text-lg">{effect.icon}</span>
                            <span className={`text-[9px] font-semibold ${isActive ? "text-gold" : "text-muted-foreground"}`}>{effect.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => { pushHistory(); setActiveEffects([]); }}
                        className="w-full py-2.5 text-[10px] text-destructive/80 font-semibold border border-destructive/15 rounded-xl hover:bg-destructive/5 transition-all">
                        Clear All Effects ({activeEffects.length})
                      </button>
                    )}
                  </>
                )}

                {/* TRANSITIONS */}
                {activeToolTab === "transitions" && (
                  <>
                    <p className="text-[10px] text-muted-foreground/60">Select transition between clips</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TRANSITIONS.map((trans) => {
                        const isActive = activeTransition === trans.id;
                        return (
                          <motion.button key={trans.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTransition(isActive ? null : trans.id)}
                            className={`py-3.5 rounded-xl flex flex-col items-center gap-2 border transition-all ${isActive ? "border-gold/40 bg-gold/8" : "border-border/20 bg-surface-1/30 hover:border-border/40"}`}>
                            <span className="text-lg">{trans.icon}</span>
                            <span className={`text-[9px] font-semibold ${isActive ? "text-gold" : "text-muted-foreground"}`}>{trans.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* FILTERS */}
                {activeToolTab === "filters" && (
                  <>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                      {["all", "basic", "cinema", "mood", "film"].map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-full border transition-all flex-shrink-0 ${filterCategory === cat ? "border-gold/40 bg-gold/8 text-gold" : "border-border/30 text-muted-foreground hover:text-foreground"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {filteredFilters.map((preset) => (
                        <motion.button key={preset.name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { pushHistory(); setActiveFilter(preset); }}
                          className="flex flex-col items-center gap-2">
                          <div className={`w-full aspect-square rounded-xl border-2 transition-all ${activeFilter.name === preset.name ? "border-gold/50 shadow-[0_0_12px_hsl(var(--gold)/0.15)]" : "border-border/20 hover:border-border/40"}`}
                            style={{ backgroundColor: preset.color }} />
                          <span className={`text-[9px] font-semibold ${activeFilter.name === preset.name ? "text-gold" : "text-muted-foreground"}`}>{preset.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}

                {/* TEXT */}
                {activeToolTab === "text" && (
                  <>
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full bg-surface-1/50 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/30 focus:bg-surface-1/70 transition-all"
                      onKeyDown={(e) => e.key === "Enter" && addTextOverlay()} />
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.entries(TEXT_STYLES) as [TextStyleKey, typeof TEXT_STYLES[TextStyleKey]][]).map(([key, s]) => (
                        <button key={key} onClick={() => setTextStyle(key)}
                          className={`py-2.5 text-[9px] font-bold uppercase border rounded-xl transition-all ${textStyle === key ? "border-gold/40 bg-gold/8 text-gold" : "border-border/20 text-muted-foreground hover:border-border/40"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <Button onClick={addTextOverlay} disabled={!textInput.trim()}
                      className="w-full h-10 bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold rounded-xl disabled:opacity-30">
                      Add Text
                    </Button>
                    {textOverlays.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t border-border/20">
                        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">Active ({textOverlays.length})</span>
                        {textOverlays.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 bg-surface-1/30 border border-border/20 rounded-lg px-3 py-2">
                            <Type className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                            <span className="text-[11px] text-foreground/80 truncate flex-1">{t.text}</span>
                            <span className="text-[8px] text-muted-foreground/40">{formatTimecode(t.startTime)}</span>
                            <button onClick={() => removeTextOverlay(t.id)} className="text-muted-foreground/40 hover:text-destructive transition-all"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* AUDIO */}
                {activeToolTab === "audio" && (
                  <>
                    {audioName ? (
                      <div className="flex items-center gap-3 bg-surface-1/30 border border-purple-500/20 rounded-xl p-3.5">
                        <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <Music className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-xs text-foreground/80 truncate flex-1">{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-destructive/60 font-semibold text-[10px] hover:text-destructive transition-all">Remove</button>
                      </div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full py-10 border border-dashed border-purple-400/20 bg-purple-500/3 hover:bg-purple-500/6 transition-all flex flex-col items-center gap-3 rounded-xl">
                        <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center">
                          <Music className="w-5 h-5 text-purple-400/70" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-purple-400/80 font-semibold block">Add Music Track</span>
                          <span className="text-[9px] text-muted-foreground/40 mt-0.5 block">MP3, WAV, AAC</span>
                        </div>
                      </motion.button>
                    )}
                    <p className="text-[10px] text-muted-foreground/40">Replaces original audio in export</p>
                  </>
                )}

                {/* ADJUST */}
                {activeToolTab === "adjust" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em]">Color Grading</span>
                      <button onClick={resetColorGrading} className="text-[10px] text-gold/70 font-semibold hover:text-gold transition-all">Reset</button>
                    </div>
                    {[
                      { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
                      { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
                      { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
                      { label: "Hue Rotate", value: hueRotate, set: setHueRotate, min: -180, max: 180 },
                    ].map(({ label, value, set, min, max }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-foreground/70">{label}</span>
                          <span className="text-[10px] text-gold/60 tabular-nums font-mono">{value}{label === "Hue Rotate" ? "°" : "%"}</span>
                        </div>
                        <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} className="w-full" />
                      </div>
                    ))}
                  </>
                )}

                {/* EXPORT SETTINGS */}
                {activeToolTab === "export" && (
                  <>
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em]">Export Quality</p>
                    <div className="space-y-2">
                      {EXPORT_QUALITIES.map((q) => (
                        <motion.button key={q.id} whileHover={{ scale: 1.01 }}
                          onClick={() => setExportQuality(q.id)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${exportQuality === q.id ? "border-gold/40 bg-gold/6 shadow-[0_0_12px_hsl(var(--gold)/0.08)]" : "border-border/20 bg-surface-1/20 hover:border-border/40"}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${exportQuality === q.id ? "text-gold" : "text-foreground/80"}`}>{q.label}</span>
                            <span className="text-[9px] text-muted-foreground/50">{q.fps}fps</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground/40 mt-0.5">
                            {Math.round(q.resolution * 100)}% resolution • {(q.bitrate / 1_000_000).toFixed(0)}Mbps
                          </p>
                        </motion.button>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border/20 space-y-3">
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em]">Playback Speed</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SPEED_OPTIONS.map((s) => (
                          <button key={s} onClick={() => { pushHistory(); setSpeed(s); }}
                            className={`px-3 py-1.5 text-[10px] font-bold border rounded-full transition-all ${speed === s ? "border-gold/40 bg-gold/8 text-gold" : "border-border/20 text-muted-foreground hover:border-border/40"}`}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ TIMELINE — Refined ═══ */}
      <GlassPanel className="h-[170px] flex-shrink-0 flex flex-col rounded-none border-x-0 border-b-0">
        <div className="h-8 flex items-center px-3 gap-2 border-b border-border/20 flex-shrink-0">
          <button onClick={splitAtPlayhead} className="p-1 text-muted-foreground hover:text-gold transition-all rounded-md hover:bg-surface-2/30" title="Split"><Scissors className="w-3.5 h-3.5" /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-2/30"><Trash2 className="w-3.5 h-3.5" /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-2/30"><Copy className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-border/20" />
          <span className="text-[10px] text-gold/70 font-mono tabular-nums">{formatTimecode(currentTime, true)}</span>
          <div className="flex-1" />
          <span className="text-[9px] text-muted-foreground/40">Trim: {formatTimecode(trimStart)} — {formatTimecode(trimEnd)}</span>
          <div className="w-px h-4 bg-border/20" />
          <div className="flex items-center bg-surface-2/40 rounded-full p-0.5">
            <button onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))} className="p-1 text-muted-foreground hover:text-foreground rounded-full">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[8px] text-muted-foreground/50 w-7 text-center">{Math.round(timelineZoom * 100)}%</span>
            <button onClick={() => setTimelineZoom(Math.min(4, timelineZoom + 0.25))} className="p-1 text-muted-foreground hover:text-foreground rounded-full">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-[80px] flex-shrink-0 border-r border-border/15">
            {tracks.map((track) => (
              <div key={track.id} className="h-[33px] flex items-center px-2 gap-1.5 border-b border-border/10">
                <button className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-all">
                  {track.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                </button>
                <span className="text-[8px] text-muted-foreground/50 truncate font-medium">{track.name}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden relative">
            {/* Time ruler */}
            <div className="h-4 border-b border-border/10 flex items-end sticky top-0 bg-surface-0/80 backdrop-blur-sm z-10">
              {duration > 0 && Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 relative" style={{ width: `${60 * timelineZoom}px` }}>
                  <div className="absolute bottom-0 left-0 w-px h-2 bg-border/20" />
                  <span className="absolute bottom-0.5 left-1 text-[6px] text-muted-foreground/30 font-mono">
                    {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Video track */}
            <div ref={timelineRef} onClick={handleTimelineClick} className="h-[33px] border-b border-border/10 relative cursor-pointer">
              {activeMedia && duration > 0 && (
                <div className="absolute top-1 bottom-1 bg-gold/10 border border-gold/20 rounded-lg overflow-hidden flex"
                  style={{ left: `${(trimStart / duration) * duration * 60 * timelineZoom}px`, width: `${((trimEnd - trimStart) / duration) * duration * 60 * timelineZoom}px` }}>
                  {thumbnails.map((thumb, i) => (
                    <div key={i} className="flex-1 h-full overflow-hidden opacity-60">
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ))}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gold/60 cursor-col-resize hover:bg-gold transition-all rounded-l-lg" />
                  <div className="absolute inset-y-0 right-0 w-1 bg-gold/60 cursor-col-resize hover:bg-gold transition-all rounded-r-lg" />
                </div>
              )}
              {!activeMedia && <div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] text-muted-foreground/20">Import media to start</span></div>}
            </div>

            {/* Audio track */}
            <div className="h-[33px] border-b border-border/10 relative">
              {audioName && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 bg-purple-500/8 border border-purple-500/20 rounded-lg flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px` }}>
                  <Music className="w-3 h-3 text-purple-400/60 flex-shrink-0" />
                  <span className="text-[7px] text-purple-400/60 truncate">{audioName}</span>
                </div>
              )}
            </div>

            {/* Text track */}
            <div className="h-[33px] border-b border-border/10 relative">
              {textOverlays.map((t) => (
                <div key={t.id} className="absolute top-1 bottom-1 bg-emerald-500/8 border border-emerald-500/20 rounded-lg flex items-center px-2"
                  style={{ left: `${t.startTime * 60 * timelineZoom}px`, width: `${Math.max(60, (t.endTime - t.startTime) * 60 * timelineZoom)}px` }}>
                  <Type className="w-3 h-3 text-emerald-400/60 mr-1 flex-shrink-0" />
                  <span className="text-[7px] text-emerald-400/60 truncate">{t.text}</span>
                </div>
              ))}
            </div>

            {/* Effects track */}
            <div className="h-[33px] border-b border-border/10 relative">
              {activeEffects.length > 0 && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 bg-amber-500/8 border border-amber-500/20 rounded-lg flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px` }}>
                  <Sparkles className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
                  <span className="text-[7px] text-amber-400/60 truncate">{activeEffects.map(e => EFFECTS.find(ef => ef.id === e)?.label).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Playhead */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-20 pointer-events-none"
                style={{ left: `${(currentTime / duration) * duration * 60 * timelineZoom}px` }}>
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* ═══ BOTTOM TOOL BAR — Pill-style ═══ */}
      <GlassPanel className="h-[52px] flex items-center justify-center px-4 flex-shrink-0 rounded-none border-x-0 border-b-0">
        <div className="flex items-center gap-1 bg-surface-2/30 rounded-full p-1">
          {TOOL_TABS.map((tab) => {
            const isActive = activeToolTab === tab.id;
            return (
              <motion.button key={tab.id}
                onClick={() => setActiveToolTab(isActive ? null : tab.id)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3.5 rounded-full transition-all duration-200 ${isActive ? "bg-gold/10 text-gold" : "text-muted-foreground/60 hover:text-foreground/80"}`}>
                <tab.icon className="w-4 h-4" />
                <span className="text-[8px] font-semibold tracking-wide">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </GlassPanel>

      <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
    </div>
  );
}
