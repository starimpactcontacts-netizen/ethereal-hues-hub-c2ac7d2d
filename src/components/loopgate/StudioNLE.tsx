import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, SkipBack, SkipForward, Scissors, RotateCcw,
  Sparkles, Volume2, VolumeX, Plus, Image,
  Layers, Eye, EyeOff,
  Trash2, Copy, ZoomIn, ZoomOut, Undo, Redo,
  FileVideo, Wand2, SlidersHorizontal, Keyboard, Settings,
  Mic, ArrowUpCircle, Check
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
type ToolTab = "media" | "audio" | "text" | "effects" | "transitions" | "filters" | "adjust" | "export" | "upscale";
type HistoryEntry = { filter: FilterPreset; effects: string[]; brightness: number; contrast: number; saturation: number; hueRotate: number; speed: number; trimStart: number; trimEnd: number; textOverlays: TextOverlay[] };

// Adobe Pro accent — Premiere/AE blue-purple
const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";

const TOOL_TABS: { id: ToolTab; icon: typeof Film; label: string }[] = [
  { id: "media", icon: FileVideo, label: "Media" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "text", icon: Type, label: "Text" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "transitions", icon: Layers, label: "Transitions" },
  { id: "filters", icon: Wand2, label: "Filters" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjustment" },
  { id: "upscale", icon: ArrowUpCircle, label: "Upscale" },
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
  const [activeToolTab, setActiveToolTab] = useState<ToolTab | null>("media");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>("high");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [effectCategory, setEffectCategory] = useState<string>("all");

  // Upscale state
  const upscaleInputRef = useRef<HTMLInputElement>(null);
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleUrl, setUpscaleUrl] = useState<string | null>(null);
  const [upscaleMode, setUpscaleMode] = useState<"2x" | "4x">("2x");
  const [upscaleState, setUpscaleState] = useState<"idle" | "processing" | "done">("idle");
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const [upscaleResultUrl, setUpscaleResultUrl] = useState<string | null>(null);
  const [upscaleDims, setUpscaleDims] = useState<{ w: number; h: number } | null>(null);

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

  // ─── Upscaler ───
  const handleUpscaleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (f.size > 500 * 1024 * 1024) { toast.error("Max 500MB"); return; }
    setUpscaleFile(f); setUpscaleUrl(URL.createObjectURL(f));
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
    const canvas = document.createElement("canvas"); canvas.width = finalW; canvas.height = finalH;
    const ctx = canvas.getContext("2d")!; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.min(finalW * finalH * 8, 40_000_000) });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    recorder.start(100); video.currentTime = 0; await video.play();
    const dur = video.duration;
    const drawLoop = () => {
      if (video.ended || video.paused) { recorder.stop(); return; }
      ctx.drawImage(video, 0, 0, finalW, finalH);
      setUpscaleProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    video.onended = () => recorder.stop();
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

  // ─── RENDER ───
  return (
    <div className="h-full flex flex-col overflow-hidden select-none" style={{ background: "#0a0a0a" }}>

      {/* ═══ TOP TOOLBAR — CapCut style ═══ */}
      <div className="h-11 flex items-center px-2 gap-1 flex-shrink-0 z-20" style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
        {TOOL_TABS.map((tab) => {
          const isActive = activeToolTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setActiveToolTab(isActive ? null : tab.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-md transition-all duration-150"
              style={{
                color: isActive ? ACCENT : "#8a8a8a",
                background: isActive ? ACCENT_DIM : "transparent",
              }}>
              <tab.icon className="w-4 h-4" />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button onClick={undo} disabled={historyIndex <= 0}
            className="p-1.5 rounded-md transition-all disabled:opacity-20 hover:bg-white/5"
            style={{ color: "#8a8a8a" }}><Undo className="w-4 h-4" /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-md transition-all disabled:opacity-20 hover:bg-white/5"
            style={{ color: "#8a8a8a" }}><Redo className="w-4 h-4" /></button>
        </div>

        <div className="w-px h-5 mx-1" style={{ background: "#2a2a2a" }} />

        {state === "done" ? (
          <button onClick={handleDownload}
            className="h-8 px-5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-90"
            style={{ background: ACCENT, color: "#000" }}>
            <Download className="w-3.5 h-3.5" /> Save
          </button>
        ) : (
          <button onClick={startExport} disabled={state === "processing" || !activeMedia}
            className="h-8 px-5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: ACCENT, color: "#000" }}>
            {state === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {state === "processing" ? `${progress}%` : "Export"}
          </button>
        )}
      </div>

      {/* ═══ MAIN AREA — 3-column ═══ */}
      <div className="flex-1 flex min-h-0">

        {/* ─── LEFT PANEL ─── */}
        <AnimatePresence mode="wait">
          {activeToolTab && (
            <motion.div
              key={activeToolTab}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className="flex-shrink-0 overflow-hidden flex flex-col"
              style={{ background: "#1a1a1a", borderRight: "1px solid #2a2a2a" }}
            >
              {/* Panel sidebar nav */}
              <div className="flex items-center h-9 px-3 flex-shrink-0" style={{ borderBottom: "1px solid #222" }}>
                <span className="text-xs font-semibold" style={{ color: "#e0e0e0" }}>
                  {TOOL_TABS.find(t => t.id === activeToolTab)?.label}
                </span>
                <div className="flex-1" />
                <button onClick={() => setActiveToolTab(null)} className="p-1 rounded hover:bg-white/5 transition-all">
                  <X className="w-3.5 h-3.5" style={{ color: "#666" }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "none" }}>
                {/* MEDIA */}
                {activeToolTab === "media" && (
                  <>
                    {/* Import drop zone */}
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/5"
                      style={{ border: `1px dashed #333`, background: "#151515" }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ACCENT_DIM }}>
                        <Plus className="w-5 h-5" style={{ color: ACCENT }} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium" style={{ color: ACCENT }}>Import</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>Drag and drop videos, photos, and audio files here</p>
                      </div>
                    </button>

                    <p className="text-[10px] text-center" style={{ color: "#444" }}>No media? Create with these tools</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: Sparkles, label: "AI media" },
                        { icon: Image, label: "AI avatars" },
                        { icon: Mic, label: "Record" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} className="py-4 rounded-lg flex flex-col items-center gap-2 transition-all hover:bg-white/5"
                          style={{ border: "1px solid #2a2a2a", background: "#151515" }}>
                          <Icon className="w-5 h-5" style={{ color: "#666" }} />
                          <span className="text-[10px]" style={{ color: "#888" }}>{label}</span>
                        </button>
                      ))}
                    </div>

                    {mediaItems.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-2">
                        {mediaItems.map((item) => (
                          <div key={item.id}
                            onClick={() => setActiveMediaId(item.id)}
                            className="relative group cursor-pointer rounded-md overflow-hidden transition-all"
                            style={{ border: activeMediaId === item.id ? `2px solid ${ACCENT}` : "2px solid transparent" }}>
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.name} className="w-full aspect-video object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full aspect-video flex items-center justify-center" style={{ background: "#1e1e1e" }}>
                                {item.type === "audio" ? <Music className="w-5 h-5" style={{ color: "#444" }} /> : <Image className="w-5 h-5" style={{ color: "#444" }} />}
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 p-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                              <p className="text-[8px] text-white/80 truncate">{item.name}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center hidden group-hover:flex"
                              style={{ background: "rgba(0,0,0,0.7)" }}>
                              <X className="w-2.5 h-2.5 text-white/70" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* EFFECTS */}
                {activeToolTab === "effects" && (
                  <>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "distort", "color", "style", "light"].map(cat => (
                        <button key={cat} onClick={() => setEffectCategory(cat)}
                          className="px-2.5 py-1 text-[9px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: effectCategory === cat ? ACCENT_DIM : "transparent",
                            color: effectCategory === cat ? ACCENT : "#666",
                            border: effectCategory === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {filteredEffects.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        return (
                          <button key={effect.id}
                            onClick={() => toggleEffect(effect.id)}
                            className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                            style={{
                              background: isActive ? ACCENT_DIM : "#151515",
                              border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            <span className="text-base">{effect.icon}</span>
                            <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#888" }}>{effect.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => { pushHistory(); setActiveEffects([]); }}
                        className="w-full py-2 text-[10px] font-medium rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                        Clear All ({activeEffects.length})
                      </button>
                    )}
                  </>
                )}

                {/* TRANSITIONS */}
                {activeToolTab === "transitions" && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {TRANSITIONS.map((trans) => {
                      const isActive = activeTransition === trans.id;
                      return (
                        <button key={trans.id}
                          onClick={() => setActiveTransition(isActive ? null : trans.id)}
                          className="py-3 rounded-lg flex flex-col items-center gap-1.5 transition-all"
                          style={{
                            background: isActive ? ACCENT_DIM : "#151515",
                            border: isActive ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          }}>
                          <span className="text-base">{trans.icon}</span>
                          <span className="text-[8px] font-medium" style={{ color: isActive ? ACCENT : "#888" }}>{trans.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* FILTERS */}
                {activeToolTab === "filters" && (
                  <>
                    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {["all", "basic", "cinema", "mood", "film"].map(cat => (
                        <button key={cat} onClick={() => setFilterCategory(cat)}
                          className="px-2.5 py-1 text-[9px] font-semibold rounded-md flex-shrink-0 transition-all capitalize"
                          style={{
                            background: filterCategory === cat ? ACCENT_DIM : "transparent",
                            color: filterCategory === cat ? ACCENT : "#666",
                            border: filterCategory === cat ? `1px solid ${ACCENT_BORDER}` : "1px solid transparent",
                          }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {filteredFilters.map((preset) => (
                        <button key={preset.name}
                          onClick={() => { pushHistory(); setActiveFilter(preset); }}
                          className="flex flex-col items-center gap-1.5">
                          <div className="w-full aspect-square rounded-lg transition-all"
                            style={{
                              backgroundColor: preset.color,
                              border: activeFilter.name === preset.name ? `2px solid ${ACCENT}` : "2px solid #2a2a2a",
                              boxShadow: activeFilter.name === preset.name ? `0 0 10px ${ACCENT}33` : "none",
                            }} />
                          <span className="text-[8px] font-medium" style={{ color: activeFilter.name === preset.name ? ACCENT : "#888" }}>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* TEXT */}
                {activeToolTab === "text" && (
                  <>
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all"
                      style={{ background: "#151515", border: `1px solid #2a2a2a`, color: "#e0e0e0" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = ACCENT}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
                      onKeyDown={(e) => e.key === "Enter" && addTextOverlay()} />
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.entries(TEXT_STYLES) as [TextStyleKey, typeof TEXT_STYLES[TextStyleKey]][]).map(([key, s]) => (
                        <button key={key} onClick={() => setTextStyle(key)}
                          className="py-2 text-[9px] font-semibold rounded-md transition-all capitalize"
                          style={{
                            background: textStyle === key ? ACCENT_DIM : "#151515",
                            color: textStyle === key ? ACCENT : "#666",
                            border: textStyle === key ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={addTextOverlay} disabled={!textInput.trim()}
                      className="w-full h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                      style={{ background: ACCENT, color: "#000" }}>
                      Add Text
                    </button>
                    {textOverlays.length > 0 && (
                      <div className="space-y-1 pt-2" style={{ borderTop: "1px solid #222" }}>
                        {textOverlays.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ background: "#151515", border: "1px solid #222" }}>
                            <Type className="w-3 h-3 flex-shrink-0" style={{ color: "#555" }} />
                            <span className="text-[10px] truncate flex-1" style={{ color: "#aaa" }}>{t.text}</span>
                            <button onClick={() => removeTextOverlay(t.id)} className="hover:opacity-70"><X className="w-3 h-3" style={{ color: "#555" }} /></button>
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
                      <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)" }}>
                          <Music className="w-4 h-4" style={{ color: "#a855f7" }} />
                        </div>
                        <span className="text-xs truncate flex-1" style={{ color: "#ccc" }}>{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] font-medium" style={{ color: "#ef4444" }}>Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/3"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <Music className="w-6 h-6" style={{ color: "#555" }} />
                        <span className="text-xs" style={{ color: "#888" }}>Add Music Track</span>
                        <span className="text-[10px]" style={{ color: "#444" }}>MP3, WAV, AAC</span>
                      </button>
                    )}
                  </>
                )}

                {/* ADJUST */}
                {activeToolTab === "adjust" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium" style={{ color: "#888" }}>Color Grading</span>
                      <button onClick={resetColorGrading} className="text-[10px] font-medium" style={{ color: ACCENT }}>Reset</button>
                    </div>
                    {[
                      { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
                      { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
                      { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
                      { label: "Hue Rotate", value: hueRotate, set: setHueRotate, min: -180, max: 180 },
                    ].map(({ label, value, set, min, max }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px]" style={{ color: "#aaa" }}>{label}</span>
                          <span className="text-[10px] font-mono" style={{ color: "#666" }}>{value}{label === "Hue Rotate" ? "°" : "%"}</span>
                        </div>
                        <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} className="w-full" />
                      </div>
                    ))}
                  </>
                )}

                {/* EXPORT */}
                {activeToolTab === "export" && (
                  <>
                    <div className="space-y-1.5">
                      {EXPORT_QUALITIES.map((q) => (
                        <button key={q.id}
                          onClick={() => setExportQuality(q.id)}
                          className="w-full text-left px-3 py-3 rounded-lg transition-all"
                          style={{
                            background: exportQuality === q.id ? ACCENT_DIM : "#151515",
                            border: exportQuality === q.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                          }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold" style={{ color: exportQuality === q.id ? ACCENT : "#ccc" }}>{q.label}</span>
                            <span className="text-[9px]" style={{ color: "#555" }}>{q.fps}fps</span>
                          </div>
                          <p className="text-[9px] mt-0.5" style={{ color: "#444" }}>
                            {Math.round(q.resolution * 100)}% • {(q.bitrate / 1_000_000).toFixed(0)}Mbps
                          </p>
                        </button>
                      ))}
                    </div>
                    <div className="pt-3 space-y-2" style={{ borderTop: "1px solid #222" }}>
                      <span className="text-[10px] font-medium" style={{ color: "#666" }}>Speed</span>
                      <div className="flex flex-wrap gap-1">
                        {SPEED_OPTIONS.map((s) => (
                          <button key={s} onClick={() => { pushHistory(); setSpeed(s); }}
                            className="px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all"
                            style={{
                              background: speed === s ? ACCENT_DIM : "#151515",
                              color: speed === s ? ACCENT : "#666",
                              border: speed === s ? `1px solid ${ACCENT_BORDER}` : "1px solid #2a2a2a",
                            }}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* UPSCALE */}
                {activeToolTab === "upscale" && (
                  <>
                    {!upscaleFile ? (
                      <button onClick={() => upscaleInputRef.current?.click()}
                        className="w-full py-8 rounded-lg flex flex-col items-center gap-3 transition-all hover:bg-white/5"
                        style={{ border: "1px dashed #333", background: "#151515" }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ACCENT_DIM }}>
                          <ArrowUpCircle className="w-5 h-5" style={{ color: ACCENT }} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium" style={{ color: ACCENT }}>Upload Video to Upscale</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>MP4, MOV, WEBM • Max 500MB</p>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#151515", border: "1px solid #2a2a2a" }}>
                          <Film className="w-4 h-4 flex-shrink-0" style={{ color: "#666" }} />
                          <span className="text-[10px] truncate flex-1" style={{ color: "#ccc" }}>{upscaleFile.name}</span>
                          <button onClick={clearUpscale} className="hover:opacity-70"><X className="w-3 h-3" style={{ color: "#555" }} /></button>
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
                                  <span className="block text-[8px] font-normal mt-0.5" style={{ color: "#555" }}>
                                    {m === "2x" ? "HD → Full HD" : "HD → 4K"}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <button onClick={startUpscale}
                              className="w-full h-9 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <ArrowUpCircle className="w-3.5 h-3.5 inline mr-1.5" />
                              Upscale {upscaleMode}
                            </button>
                          </>
                        )}

                        {upscaleState === "processing" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                              <span className="text-[10px]" style={{ color: "#ccc" }}>Upscaling {upscaleMode}...</span>
                              <span className="text-[10px] font-mono ml-auto" style={{ color: "#666" }}>{upscaleProgress}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${upscaleProgress}%`, background: ACCENT }} />
                            </div>
                            {upscaleDims && (
                              <p className="text-[9px] text-center" style={{ color: "#555" }}>
                                {upscaleDims.w}×{upscaleDims.h} → {Math.min(upscaleDims.w * (upscaleMode === "2x" ? 2 : 4), 3840)}×{Math.min(upscaleDims.h * (upscaleMode === "2x" ? 2 : 4), 3840)}
                              </p>
                            )}
                          </div>
                        )}

                        {upscaleState === "done" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                              <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                              <span className="text-[10px] font-medium" style={{ color: "#22c55e" }}>Upscale complete!</span>
                            </div>
                            <button onClick={handleUpscaleDownload}
                              className="w-full h-9 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: ACCENT, color: "#000" }}>
                              <Download className="w-3.5 h-3.5 inline mr-1.5" />
                              Download
                            </button>
                            <button onClick={clearUpscale}
                              className="w-full py-2 text-[10px] rounded-lg transition-all hover:bg-white/5"
                              style={{ color: "#888", border: "1px solid #2a2a2a" }}>
                              Upscale Another
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <input ref={upscaleInputRef} type="file" accept="video/*" onChange={handleUpscaleFile} className="hidden" />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CENTER: Player ─── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "#0a0a0a" }}>
          {/* Player label */}
          <div className="h-8 flex items-center px-3 flex-shrink-0" style={{ background: "#141414", borderBottom: "1px solid #1e1e1e" }}>
            <span className="text-[11px] font-medium" style={{ color: "#888" }}>Player</span>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0" style={{ background: "#0a0a0a" }}>
            {videoUrl ? (
              <>
                <video ref={videoRef} src={videoUrl} className="hidden" playsInline preload="auto" />
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

                <AnimatePresence>
                  {!playing && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
                {playing && <button onClick={togglePlay} className="absolute inset-0" />}

                {activeEffects.length > 0 && (
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {activeEffects.map(eff => (
                      <span key={eff} className="px-2 py-0.5 rounded text-[8px] font-medium"
                        style={{ background: "rgba(0,0,0,0.6)", color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>
                        {EFFECTS.find(e => e.id === eff)?.label}
                      </span>
                    ))}
                  </div>
                )}

                {state === "processing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.85)" }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
                    <p className="text-sm font-medium" style={{ color: "#ccc" }}>Exporting {progress}%</p>
                    <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: ACCENT }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="text-center space-y-4 group cursor-pointer p-10">
                <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <Play className="w-7 h-7" style={{ color: "#444" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#666" }}>Import media to preview</p>
                </div>
              </button>
            )}

            {/* Shortcuts overlay */}
            <AnimatePresence>
              {showShortcuts && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center p-8" style={{ background: "rgba(0,0,0,0.9)" }}>
                  <div className="max-w-lg w-full rounded-xl p-6" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>Keyboard Shortcuts</span>
                      <button onClick={() => setShowShortcuts(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4" style={{ color: "#666" }} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                      {[
                        ["Space", "Play / Pause"], ["← →", "Seek ±1s"], ["Shift+← →", "Seek ±5s"],
                        ["J / K / L", "Back / Play / Fwd"], ["I", "Set In Point"], ["O", "Set Out Point"],
                        ["M", "Toggle Mute"], ["[ ]", "Speed ↓ / ↑"], ["⌘Z", "Undo"],
                        ["⌘⇧Z", "Redo"], ["⌘S", "Export"], ["?", "Shortcuts"],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-center gap-3">
                          <kbd className="px-2 py-0.5 rounded font-mono text-[10px] min-w-[44px] text-center" style={{ background: "#222", border: "1px solid #333", color: ACCENT }}>{key}</kbd>
                          <span style={{ color: "#888" }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player controls */}
          <div className="h-10 flex items-center px-3 gap-3 flex-shrink-0" style={{ background: "#141414", borderTop: "1px solid #1e1e1e" }}>
            <span className="text-[10px] font-mono w-20" style={{ color: "#888" }}>{formatTimecode(currentTime, true)}</span>
            <span style={{ color: "#333" }}>/</span>
            <span className="text-[10px] font-mono w-20" style={{ color: "#555" }}>{formatTimecode(duration, true)}</span>
            <div className="flex-1" />
            <button onClick={() => seekTo(trimStart)} className="p-1 rounded hover:bg-white/5"><SkipBack className="w-4 h-4" style={{ color: "#666" }} /></button>
            <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5" style={{ border: "1px solid #333" }}>
              {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
            </button>
            <button onClick={() => seekTo(trimEnd)} className="p-1 rounded hover:bg-white/5"><SkipForward className="w-4 h-4" style={{ color: "#666" }} /></button>
            <div className="flex-1" />
            <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/5">
              {muted ? <VolumeX className="w-4 h-4" style={{ color: "#666" }} /> : <Volume2 className="w-4 h-4" style={{ color: "#666" }} />}
            </button>
            <button onClick={() => setSpeed(SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(speed) + 1) % SPEED_OPTIONS.length])}
              className="px-2 py-0.5 text-[10px] font-semibold rounded transition-all hover:bg-white/5" style={{ color: "#888" }}>
              {speed}x
            </button>
            <button onClick={() => setShowShortcuts(prev => !prev)} className="p-1 rounded hover:bg-white/5">
              <Keyboard className="w-4 h-4" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        {/* ─── RIGHT PANEL — Details ─── */}
        <div className="w-[260px] flex-shrink-0 flex flex-col" style={{ background: "#1a1a1a", borderLeft: "1px solid #2a2a2a" }}>
          <div className="h-8 flex items-center px-3" style={{ borderBottom: "1px solid #222" }}>
            <span className="text-[11px] font-medium" style={{ color: ACCENT }}>Details</span>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {activeMedia ? (
              <>
                <div className="space-y-2.5">
                  {[
                    ["Name", activeMedia.name],
                    ["Duration", formatTimecode(activeMedia.duration)],
                    ["Type", activeMedia.type.toUpperCase()],
                    ["Trim", `${formatTimecode(trimStart)} — ${formatTimecode(trimEnd)}`],
                    ["Speed", `${speed}x`],
                    ["Filter", activeFilter.label],
                    ["Effects", activeEffects.length > 0 ? `${activeEffects.length} active` : "None"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-start">
                      <span className="text-[10px]" style={{ color: "#666" }}>{label}:</span>
                      <span className="text-[10px] font-medium text-right max-w-[140px] truncate" style={{ color: "#ccc" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[10px] text-center pt-8" style={{ color: "#444" }}>No media selected</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TIMELINE — Bottom ═══ */}
      <div className="flex-shrink-0 flex flex-col" style={{ height: 170, background: "#141414", borderTop: "1px solid #2a2a2a" }}>
        {/* Timeline toolbar */}
        <div className="h-7 flex items-center px-3 gap-1.5 flex-shrink-0" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <button onClick={splitAtPlayhead} className="p-1 rounded hover:bg-white/5"><Scissors className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <button className="p-1 rounded hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <button className="p-1 rounded hover:bg-white/5"><Copy className="w-3.5 h-3.5" style={{ color: "#666" }} /></button>
          <div className="w-px h-3.5 mx-1" style={{ background: "#2a2a2a" }} />
          <button onClick={() => setMuted(!muted)} className="p-1 rounded hover:bg-white/5">
            <Volume2 className="w-3.5 h-3.5" style={{ color: "#666" }} />
          </button>
          <div className="flex-1" />
          <span className="text-[9px] font-mono" style={{ color: "#555" }}>
            {formatTimecode(trimStart)} — {formatTimecode(trimEnd)}
          </span>
          <div className="w-px h-3.5 mx-1" style={{ background: "#2a2a2a" }} />
          <div className="flex items-center gap-0.5">
            <button onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))} className="p-0.5 rounded hover:bg-white/5">
              <ZoomOut className="w-3 h-3" style={{ color: "#666" }} />
            </button>
            <div className="w-16 h-1 rounded-full mx-1 relative" style={{ background: "#2a2a2a" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${((timelineZoom - 0.5) / 3.5) * 100}%`, background: "#555" }} />
            </div>
            <button onClick={() => setTimelineZoom(Math.min(4, timelineZoom + 0.25))} className="p-0.5 rounded hover:bg-white/5">
              <ZoomIn className="w-3 h-3" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Track labels */}
          <div className="w-[70px] flex-shrink-0" style={{ borderRight: "1px solid #1e1e1e" }}>
            {tracks.map((track) => (
              <div key={track.id} className="h-[33px] flex items-center px-2 gap-1" style={{ borderBottom: "1px solid #1a1a1a" }}>
                <button className="p-0.5">
                  {track.visible ? <Eye className="w-2.5 h-2.5" style={{ color: "#555" }} /> : <EyeOff className="w-2.5 h-2.5" style={{ color: "#333" }} />}
                </button>
                <span className="text-[8px] font-medium truncate" style={{ color: "#666" }}>{track.name}</span>
              </div>
            ))}
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative" style={{ scrollbarWidth: "none" }}>
            {/* Time ruler */}
            <div className="h-4 flex items-end sticky top-0 z-10" style={{ borderBottom: "1px solid #1e1e1e", background: "#141414" }}>
              {duration > 0 && Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 relative" style={{ width: `${60 * timelineZoom}px` }}>
                  <div className="absolute bottom-0 left-0 w-px h-2" style={{ background: "#2a2a2a" }} />
                  <span className="absolute bottom-0.5 left-1 text-[6px] font-mono" style={{ color: "#444" }}>
                    {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Video track */}
            <div ref={timelineRef} onClick={handleTimelineClick} className="h-[33px] relative cursor-pointer" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {activeMedia && duration > 0 && (
                <div className="absolute top-1 bottom-1 rounded overflow-hidden flex"
                  style={{
                    left: `${(trimStart / duration) * duration * 60 * timelineZoom}px`,
                    width: `${((trimEnd - trimStart) / duration) * duration * 60 * timelineZoom}px`,
                    background: "rgba(0,209,193,0.08)",
                    border: `1px solid ${ACCENT_BORDER}`,
                  }}>
                  {thumbnails.map((thumb, i) => (
                    <div key={i} className="flex-1 h-full overflow-hidden opacity-60">
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {/* Trim handles */}
                  <div className="absolute inset-y-0 left-0 w-1 cursor-col-resize rounded-l transition-all" style={{ background: ACCENT }} />
                  <div className="absolute inset-y-0 right-0 w-1 cursor-col-resize rounded-r transition-all" style={{ background: ACCENT }} />
                </div>
              )}
              {!activeMedia && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px]" style={{ color: "#333" }}>Drag material here and start to create</span>
                </div>
              )}
            </div>

            {/* Audio track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {audioName && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 rounded flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px`, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <Music className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(168,85,247,0.5)" }}>{audioName}</span>
                </div>
              )}
            </div>

            {/* Text track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {textOverlays.map((t) => (
                <div key={t.id} className="absolute top-1 bottom-1 rounded flex items-center px-2"
                  style={{
                    left: `${t.startTime * 60 * timelineZoom}px`,
                    width: `${Math.max(60, (t.endTime - t.startTime) * 60 * timelineZoom)}px`,
                    background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                  }}>
                  <Type className="w-3 h-3 mr-1 flex-shrink-0" style={{ color: "rgba(34,197,94,0.5)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(34,197,94,0.5)" }}>{t.text}</span>
                </div>
              ))}
            </div>

            {/* Effects track */}
            <div className="h-[33px] relative" style={{ borderBottom: "1px solid #1a1a1a" }}>
              {activeEffects.length > 0 && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 rounded flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px`, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(251,191,36,0.4)" }} />
                  <span className="text-[7px] truncate" style={{ color: "rgba(251,191,36,0.4)" }}>{activeEffects.map(e => EFFECTS.find(ef => ef.id === e)?.label).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Playhead */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none"
                style={{ left: `${(currentTime / duration) * duration * 60 * timelineZoom}px`, background: "white" }}>
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: "white", boxShadow: "0 0 4px rgba(255,255,255,0.5)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
    </div>
  );
}
