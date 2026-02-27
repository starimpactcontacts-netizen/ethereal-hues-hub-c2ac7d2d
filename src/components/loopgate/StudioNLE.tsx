import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, Download, Film, Play, Pause, Type, Sliders, Music, X,
  Loader2, Check, SkipBack, SkipForward, Scissors, RotateCcw,
  Sparkles, Volume2, VolumeX, Gauge, Plus, FolderOpen, Image,
  Maximize2, Minimize2, Monitor, Layers, Eye, EyeOff,
  ChevronRight, Trash2, Copy, ZoomIn, ZoomOut, Undo, Redo,
  Move, GripVertical, FileVideo, Wand2, SlidersHorizontal,
  Square, AlignCenter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// ─── Types ───
type FilterPreset = {
  name: string;
  label: string;
  filter: string;
  color: string;
};

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  style: "bold" | "caption" | "title" | "glow";
};

type MediaItem = {
  id: string;
  file: File;
  url: string;
  thumbnail: string;
  duration: number;
  name: string;
  type: "video" | "audio" | "image";
};

type TimelineTrack = {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "effect";
  visible: boolean;
  locked: boolean;
};

type ToolTab = "media" | "audio" | "text" | "effects" | "transitions" | "filters" | "adjust";
type PropertyTab = "details" | "color" | "speed";

// ─── Constants ───
const FILTER_PRESETS: FilterPreset[] = [
  { name: "none", label: "Original", filter: "none", color: "hsl(0 0% 30%)" },
  { name: "cinematic", label: "Cinema", filter: "contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)", color: "hsl(30 30% 35%)" },
  { name: "phonk", label: "Phonk", filter: "contrast(1.4) saturate(1.3) brightness(0.85) hue-rotate(-10deg)", color: "hsl(340 60% 30%)" },
  { name: "noir", label: "Noir", filter: "grayscale(1) contrast(1.3) brightness(0.9)", color: "hsl(0 0% 20%)" },
  { name: "cold", label: "Cold", filter: "saturate(0.7) brightness(1.05) hue-rotate(15deg) contrast(1.1)", color: "hsl(210 50% 35%)" },
  { name: "heat", label: "Heat", filter: "saturate(1.4) brightness(1.05) hue-rotate(-15deg) contrast(1.1)", color: "hsl(15 70% 35%)" },
  { name: "vintage", label: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.8)", color: "hsl(35 40% 35%)" },
  { name: "neon", label: "Neon", filter: "contrast(1.3) saturate(1.6) brightness(1.1)", color: "hsl(280 70% 40%)" },
  { name: "fade", label: "Fade", filter: "contrast(0.85) saturate(0.6) brightness(1.15)", color: "hsl(220 15% 45%)" },
  { name: "chrome", label: "Chrome", filter: "contrast(1.2) saturate(0.4) brightness(1.1)", color: "hsl(200 10% 50%)" },
  { name: "lofi", label: "Lo-Fi", filter: "contrast(1.5) saturate(1.1) brightness(0.8)", color: "hsl(0 40% 25%)" },
  { name: "dream", label: "Dream", filter: "contrast(0.9) saturate(1.3) brightness(1.15) blur(0.3px)", color: "hsl(270 40% 50%)" },
];

const TEXT_STYLES = {
  bold: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "#000000", label: "Bold" },
  caption: { font: "600 24px 'Inter', sans-serif", color: "#ffffff", stroke: "#000000", label: "Caption" },
  title: { font: "bold 64px 'Bebas Neue', sans-serif", color: "hsl(43, 74%, 49%)", stroke: "#000000", label: "Title" },
  glow: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "rgba(200,150,50,0.8)", label: "Glow" },
};

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const TOOL_TABS: { id: ToolTab; icon: typeof Film; label: string }[] = [
  { id: "media", icon: FileVideo, label: "Media" },
  { id: "audio", icon: Music, label: "Audio" },
  { id: "text", icon: Type, label: "Text" },
  { id: "effects", icon: Sparkles, label: "Effects" },
  { id: "transitions", icon: Layers, label: "Transitions" },
  { id: "filters", icon: Wand2, label: "Filters" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
];

// ─── Main Component ───
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
  const [textStyle, setTextStyle] = useState<"bold" | "caption" | "title" | "glow">("bold");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // UI state
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>("media");
  const [activePropertyTab, setActivePropertyTab] = useState<PropertyTab>("details");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Color grading state
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);

  // Active media
  const activeMedia = useMemo(
    () => mediaItems.find((m) => m.id === activeMediaId) ?? null,
    [mediaItems, activeMediaId]
  );

  // Tracks
  const [tracks] = useState<TimelineTrack[]>([
    { id: "v1", name: "Video 1", type: "video", visible: true, locked: false },
    { id: "a1", name: "Audio 1", type: "audio", visible: true, locked: false },
    { id: "t1", name: "Text", type: "text", visible: true, locked: false },
  ]);

  const videoUrl = activeMedia?.url ?? null;

  // Computed filter string
  const computedFilter = useMemo(() => {
    const parts: string[] = [];
    if (activeFilter.filter !== "none") parts.push(activeFilter.filter);
    if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
    if (hueRotate !== 0) parts.push(`hue-rotate(${hueRotate}deg)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [activeFilter, brightness, contrast, saturation, hueRotate]);

  // ─── File Handling ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("video/") && !f.type.startsWith("image/") && !f.type.startsWith("audio/")) {
        toast.error(`Unsupported file: ${f.name}`);
        return;
      }
      if (f.size > 500 * 1024 * 1024) { toast.error("Max 500MB per file"); return; }

      const url = URL.createObjectURL(f);
      const id = crypto.randomUUID();
      const type = f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : "image";

      if (type === "video") {
        const vid = document.createElement("video");
        vid.src = url;
        vid.muted = true;
        vid.preload = "auto";
        vid.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 160;
          canvas.height = 90;
          vid.currentTime = 1;
          vid.onseeked = () => {
            canvas.getContext("2d")!.drawImage(vid, 0, 0, 160, 90);
            const thumb = canvas.toDataURL("image/jpeg", 0.6);
            const item: MediaItem = { id, file: f, url, thumbnail: thumb, duration: vid.duration, name: f.name, type };
            setMediaItems((prev) => [...prev, item]);
            if (!activeMediaId) setActiveMediaId(id);
          };
        };
      } else {
        const item: MediaItem = { id, file: f, url, thumbnail: "", duration: 0, name: f.name, type };
        setMediaItems((prev) => [...prev, item]);
      }
    });
    // Reset input
    e.target.value = "";
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) { toast.error("Please select an audio file"); return; }
    setAudioFile(f);
    setAudioName(f.name);
    toast.success("Audio track added");
    e.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((m) => m.id !== id);
    });
    if (activeMediaId === id) {
      setActiveMediaId(mediaItems.find((m) => m.id !== id)?.id ?? null);
    }
  };

  // ─── Timeline Thumbnails ───
  useEffect(() => {
    if (!videoUrl) { setThumbnails([]); return; }
    const vid = document.createElement("video");
    vid.src = videoUrl;
    vid.crossOrigin = "anonymous";
    vid.muted = true;
    vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration);
      setTrimEnd(vid.duration);
      const count = Math.min(20, Math.max(8, Math.floor(vid.duration / 1.5)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas");
      canvas.width = 80;
      canvas.height = 45;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = [];
      let i = 0;
      const captureFrame = () => {
        if (i >= count) { setThumbnails(thumbs); return; }
        vid.currentTime = i * interval;
      };
      vid.onseeked = () => {
        ctx.drawImage(vid, 0, 0, 80, 45);
        thumbs.push(canvas.toDataURL("image/jpeg", 0.4));
        i++;
        captureFrame();
      };
      captureFrame();
    };
  }, [videoUrl]);

  // ─── Video Events ───
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // ─── Canvas Render Loop ───
  useEffect(() => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      if (vid.videoWidth && vid.videoHeight) {
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        ctx.filter = computedFilter;
        ctx.drawImage(vid, 0, 0);
        ctx.filter = "none";
        textOverlays.forEach((overlay) => {
          const style = TEXT_STYLES[overlay.style];
          ctx.font = style.font;
          ctx.textAlign = "center";
          if (overlay.style === "glow") { ctx.shadowColor = "rgba(200,150,50,0.9)"; ctx.shadowBlur = 20; }
          ctx.strokeStyle = style.stroke;
          ctx.lineWidth = 4;
          ctx.strokeText(overlay.text, canvas.width * overlay.x, canvas.height * overlay.y);
          ctx.fillStyle = style.color;
          ctx.fillText(overlay.text, canvas.width * overlay.x, canvas.height * overlay.y);
          ctx.shadowBlur = 0;
        });
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [videoUrl, computedFilter, textOverlays]);

  // ─── Playback Controls ───
  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.currentTime = Math.max(vid.currentTime, trimStart);
      vid.playbackRate = speed;
      vid.play();
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playing) return;
    const check = () => {
      if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); }
    };
    const id = setInterval(check, 100);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const seekTo = (time: number) => {
    if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time); }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pct * duration);
  };

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlays((prev) => [...prev, { id: crypto.randomUUID(), text: textInput, x: 0.5, y: 0.5, style: textStyle }]);
    setTextInput("");
    toast.success("Text overlay added");
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Export ───
  const startExport = useCallback(async () => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas || !activeMedia) return;
    setState("processing");
    setProgress(0);
    const ctx = canvas.getContext("2d")!;
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    const stream = canvas.captureStream(30);
    if (audioFile) {
      const audioCtx = new AudioContext();
      const buf = await audioFile.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buf);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      source.start(0);
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.min(vid.videoWidth * vid.videoHeight * 8, 40_000_000) });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const resultPromise = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    recorder.start(100);
    vid.currentTime = trimStart;
    vid.muted = true;
    vid.playbackRate = 1;
    await vid.play();
    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) { vid.pause(); recorder.stop(); return; }
      ctx.filter = computedFilter;
      ctx.drawImage(vid, 0, 0);
      ctx.filter = "none";
      textOverlays.forEach((overlay) => {
        const style = TEXT_STYLES[overlay.style];
        ctx.font = style.font;
        ctx.textAlign = "center";
        if (overlay.style === "glow") { ctx.shadowColor = "rgba(200,150,50,0.9)"; ctx.shadowBlur = 20; }
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 4;
        ctx.strokeText(overlay.text, canvas.width * overlay.x, canvas.height * overlay.y);
        ctx.fillStyle = style.color;
        ctx.fillText(overlay.text, canvas.width * overlay.x, canvas.height * overlay.y);
        ctx.shadowBlur = 0;
      });
      setProgress(Math.min(99, Math.round(((vid.currentTime - trimStart) / exportDuration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
    const blob = await resultPromise;
    setResultUrl(URL.createObjectURL(blob));
    setProgress(100);
    setState("done");
    vid.muted = muted;
    vid.playbackRate = speed;
    toast.success("Export complete!");
  }, [activeMedia, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed]);

  const handleDownload = () => {
    if (!resultUrl || !activeMedia) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${activeMedia.name.replace(/\.[^/.]+$/, "")}_edited.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const f = Math.floor((t % 1) * 30);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
  };

  const resetColorGrading = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotate(0);
  };

  // ─── RENDER ───
  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--surface-0))] overflow-hidden select-none">
      {/* ═══ TOP TOOLBAR ═══ */}
      <div className="h-10 flex items-center bg-[hsl(var(--surface-1))] border-b border-border px-2 gap-1 flex-shrink-0">
        {/* Tool tabs */}
        {TOOL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveToolTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
              activeToolTab === tab.id
                ? "text-[hsl(var(--gold))] bg-[hsl(var(--gold))/0.08]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => { setTrimStart(0); setTrimEnd(duration); resetColorGrading(); setActiveFilter(FILTER_PRESETS[0]); }}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Undo">
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-muted-foreground/40 cursor-not-allowed" title="Redo">
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {state === "done" ? (
            <Button onClick={handleDownload} size="sm" className="h-7 bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--gold))/0.9] text-[11px] font-bold gap-1">
              <Download className="w-3 h-3" />
              Export
            </Button>
          ) : (
            <Button onClick={startExport} size="sm" disabled={state === "processing" || !activeMedia}
              className="h-7 bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--gold))/0.9] text-[11px] font-bold gap-1 disabled:opacity-40">
              {state === "processing" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
              {state === "processing" ? `${progress}%` : "Export"}
            </Button>
          )}
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex-1 flex min-h-0">
        {/* ─── LEFT PANEL: Media/Tool Browser ─── */}
        <div className="w-[280px] flex-shrink-0 bg-[hsl(var(--surface-1))] border-r border-border flex flex-col">
          {/* Panel content based on active tab */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* MEDIA TAB */}
            {activeToolTab === "media" && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Import</span>
                  <span className="text-[10px] text-muted-foreground">{mediaItems.length} items</span>
                </div>

                {/* Import area */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border border-dashed border-border hover:border-[hsl(var(--gold))/0.5] bg-[hsl(var(--surface-0))] transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 bg-[hsl(var(--gold))/0.1] flex items-center justify-center group-hover:bg-[hsl(var(--gold))/0.2] transition-colors">
                    <Plus className="w-5 h-5 text-[hsl(var(--gold))]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-[hsl(var(--gold))]">Import</p>
                    <p className="text-[9px] text-muted-foreground">Drag and drop videos, photos, and audio files here</p>
                  </div>
                </button>

                {/* Media grid */}
                {mediaItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveMediaId(item.id)}
                        className={`relative group cursor-pointer border transition-all ${
                          activeMediaId === item.id ? "border-[hsl(var(--gold))]" : "border-border hover:border-foreground/20"
                        }`}
                      >
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} className="w-full aspect-video object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full aspect-video bg-[hsl(var(--surface-2))] flex items-center justify-center">
                            {item.type === "audio" ? <Music className="w-5 h-5 text-muted-foreground" /> : <Image className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <p className="text-[8px] text-white/80 truncate">{item.name}</p>
                          {item.duration > 0 && (
                            <p className="text-[7px] text-white/50">{fmt(item.duration)}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 items-center justify-center hidden group-hover:flex transition-all"
                        >
                          <X className="w-3 h-3 text-white/70" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* No media placeholder */}
                {mediaItems.length === 0 && (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-[11px] text-muted-foreground">No media? Create with these tools</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { icon: Wand2, label: "AI media" },
                        { icon: Square, label: "AI avatars" },
                        { icon: Monitor, label: "Record" },
                      ].map(({ icon: Icon, label }) => (
                        <button key={label} className="py-3 bg-[hsl(var(--surface-2))] border border-border flex flex-col items-center gap-1.5 hover:border-foreground/20 transition-all">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AUDIO TAB */}
            {activeToolTab === "audio" && (
              <div className="p-3 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Audio</span>
                {audioName ? (
                  <div className="flex items-center gap-2 bg-[hsl(var(--surface-0))] border border-border p-2.5">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-foreground truncate flex-1">{audioName}</span>
                    <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] text-destructive font-semibold">×</button>
                  </div>
                ) : (
                  <button onClick={() => audioInputRef.current?.click()}
                    className="w-full py-6 border border-dashed border-purple-400/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-semibold">Add Music Track</span>
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground">Replaces original audio in export</p>
              </div>
            )}

            {/* TEXT TAB */}
            {activeToolTab === "text" && (
              <div className="p-3 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Text</span>
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your text..."
                  className="w-full bg-[hsl(var(--surface-0))] border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--gold))/0.5]"
                  onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(TEXT_STYLES) as [keyof typeof TEXT_STYLES, typeof TEXT_STYLES[keyof typeof TEXT_STYLES]][]).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setTextStyle(key as any)}
                      className={`py-2 text-[10px] font-bold uppercase border transition-all ${
                        textStyle === key ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))/0.08] text-[hsl(var(--gold))]" : "border-border text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <Button onClick={addTextOverlay} disabled={!textInput.trim()} className="w-full h-9 bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--gold))/0.9] text-xs font-bold">
                  Add Text
                </Button>

                {textOverlays.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Overlays</span>
                    {textOverlays.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 bg-[hsl(var(--surface-0))] border border-border px-2 py-1.5">
                        <Type className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[11px] text-foreground truncate flex-1">{t.text}</span>
                        <button onClick={() => removeTextOverlay(t.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FILTERS TAB */}
            {activeToolTab === "filters" && (
              <div className="p-3 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setActiveFilter(preset)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-full aspect-square border-2 transition-all ${
                          activeFilter.name === preset.name ? "border-[hsl(var(--gold))]" : "border-border hover:border-foreground/20"
                        }`}
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className={`text-[9px] font-semibold ${
                        activeFilter.name === preset.name ? "text-[hsl(var(--gold))]" : "text-muted-foreground"
                      }`}>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* EFFECTS TAB */}
            {activeToolTab === "effects" && (
              <div className="p-3 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Effects</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Glitch", "Shake", "Zoom Pulse", "Flash", "RGB Split", "Blur", "VHS", "Grain", "Light Leak"].map((effect) => (
                    <button key={effect} className="py-3 bg-[hsl(var(--surface-2))] border border-border flex flex-col items-center gap-1 hover:border-foreground/20 transition-all">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{effect}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/60 text-center">Coming soon — drag to timeline to apply</p>
              </div>
            )}

            {/* TRANSITIONS TAB */}
            {activeToolTab === "transitions" && (
              <div className="p-3 space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Transitions</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Fade", "Dissolve", "Slide", "Wipe", "Zoom", "Spin", "Blur", "Glitch", "Flash"].map((t) => (
                    <button key={t} className="py-3 bg-[hsl(var(--surface-2))] border border-border flex flex-col items-center gap-1 hover:border-foreground/20 transition-all">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{t}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/60 text-center">Coming soon — drop between clips</p>
              </div>
            )}

            {/* ADJUST TAB */}
            {activeToolTab === "adjust" && (
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Color Grading</span>
                  <button onClick={resetColorGrading} className="text-[10px] text-muted-foreground hover:text-[hsl(var(--gold))]">Reset</button>
                </div>
                {[
                  { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
                  { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
                  { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
                  { label: "Hue Rotate", value: hueRotate, set: setHueRotate, min: -180, max: 180 },
                ].map(({ label, value, set, min, max }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground">{label}</span>
                      <span className="text-[10px] text-[hsl(var(--gold))] tabular-nums font-mono">{value}{label === "Hue Rotate" ? "°" : "%"}</span>
                    </div>
                    <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} className="w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── CENTER: Player/Preview ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Player */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">
            {videoUrl ? (
              <>
                <video ref={videoRef} src={videoUrl} className="hidden" playsInline />
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

                {/* Play overlay */}
                {!playing && (
                  <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
                    <div className="w-14 h-14 bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors">
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    </div>
                  </button>
                )}
                {playing && <button onClick={togglePlay} className="absolute inset-0" />}

                {/* Speed badge */}
                {speed !== 1 && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 border border-[hsl(var(--gold))/0.3]">
                    <span className="text-[10px] text-[hsl(var(--gold))] font-bold">{speed}x</span>
                  </div>
                )}

                {/* Filter badge */}
                {activeFilter.name !== "none" && (
                  <div className="absolute top-3 left-16 bg-black/60 backdrop-blur-sm px-2 py-0.5 border border-white/10">
                    <span className="text-[10px] text-white/70">{activeFilter.label}</span>
                  </div>
                )}

                {/* Processing overlay */}
                {state === "processing" && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[hsl(var(--gold))] animate-spin" />
                    <p className="text-sm font-semibold text-foreground">Exporting... {progress}%</p>
                    <div className="w-48 h-1 bg-muted/30">
                      <motion.div className="h-full bg-[hsl(var(--gold))]" animate={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[hsl(var(--surface-2))] flex items-center justify-center">
                  <FileVideo className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-display text-foreground">Player</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Import media to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Player controls bar */}
          <div className="h-10 bg-[hsl(var(--surface-1))] border-t border-border flex items-center px-3 gap-2 flex-shrink-0">
            <span className="text-[10px] text-[hsl(var(--gold))] tabular-nums font-mono w-20">{fmt(currentTime)}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => seekTo(trimStart)} className="p-1 text-muted-foreground hover:text-foreground"><SkipBack className="w-3.5 h-3.5" /></button>
              <button onClick={togglePlay} className="w-8 h-8 bg-[hsl(var(--gold))/0.1] border border-[hsl(var(--gold))/0.3] flex items-center justify-center hover:bg-[hsl(var(--gold))/0.2] transition-colors">
                {playing ? <Pause className="w-4 h-4 text-[hsl(var(--gold))]" /> : <Play className="w-4 h-4 text-[hsl(var(--gold))] ml-0.5" />}
              </button>
              <button onClick={() => seekTo(trimEnd)} className="p-1 text-muted-foreground hover:text-foreground"><SkipForward className="w-3.5 h-3.5" /></button>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums font-mono w-20">/ {fmt(duration)}</span>
            <div className="flex-1" />
            <button onClick={() => setMuted(!muted)} className="p-1.5 text-muted-foreground hover:text-foreground">
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-muted-foreground hover:text-foreground">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ─── RIGHT PANEL: Properties ─── */}
        <div className="w-[260px] flex-shrink-0 bg-[hsl(var(--surface-1))] border-l border-border flex flex-col">
          {/* Property tabs */}
          <div className="flex border-b border-border">
            {([
              { id: "details" as PropertyTab, label: "Details" },
              { id: "color" as PropertyTab, label: "Color" },
              { id: "speed" as PropertyTab, label: "Speed" },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePropertyTab(tab.id)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activePropertyTab === tab.id
                    ? "text-[hsl(var(--gold))] border-b-2 border-[hsl(var(--gold))]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
            {/* Details */}
            {activePropertyTab === "details" && activeMedia && (
              <div className="space-y-3">
                {[
                  { label: "Name", value: activeMedia.name },
                  { label: "Type", value: activeMedia.type.toUpperCase() },
                  { label: "Duration", value: fmt(activeMedia.duration) },
                  { label: "Size", value: `${(activeMedia.file.size / 1024 / 1024).toFixed(1)} MB` },
                  { label: "Trim", value: `${fmt(trimStart)} → ${fmt(trimEnd)}` },
                  { label: "Filter", value: activeFilter.label },
                  { label: "Speed", value: `${speed}x` },
                  { label: "Text layers", value: `${textOverlays.length}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <span className="text-[10px] text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activePropertyTab === "details" && !activeMedia && (
              <div className="text-center py-8">
                <p className="text-[11px] text-muted-foreground">Select media to see details</p>
              </div>
            )}

            {/* Color */}
            {activePropertyTab === "color" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Adjustments</span>
                  <button onClick={resetColorGrading} className="text-[9px] text-[hsl(var(--gold))]">Reset</button>
                </div>
                {[
                  { label: "Brightness", value: brightness, set: setBrightness, min: 0, max: 200 },
                  { label: "Contrast", value: contrast, set: setContrast, min: 0, max: 200 },
                  { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 200 },
                  { label: "Hue", value: hueRotate, set: setHueRotate, min: -180, max: 180 },
                ].map(({ label, value, set, min, max }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-foreground">{label}</span>
                      <span className="text-[10px] text-[hsl(var(--gold))] font-mono tabular-nums">{value}</span>
                    </div>
                    <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} />
                  </div>
                ))}
              </div>
            )}

            {/* Speed */}
            {activePropertyTab === "speed" && (
              <div className="space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Playback Speed</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`py-2.5 text-xs font-bold border transition-all ${
                        speed === s ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))/0.08] text-[hsl(var(--gold))]" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-muted-foreground">Custom</span>
                  <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={0.1} max={4} step={0.05} />
                  <span className="text-[10px] text-[hsl(var(--gold))] font-mono">{speed.toFixed(2)}x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM: Timeline ═══ */}
      <div className="h-[200px] flex-shrink-0 bg-[hsl(var(--surface-1))] border-t border-border flex flex-col">
        {/* Timeline toolbar */}
        <div className="h-8 flex items-center px-3 gap-2 border-b border-border flex-shrink-0">
          <button className="p-1 text-muted-foreground hover:text-foreground"><Scissors className="w-3.5 h-3.5" /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
          <button className="p-1 text-muted-foreground hover:text-foreground"><Copy className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[10px] text-[hsl(var(--gold))] font-mono tabular-nums">{fmt(currentTime)}</span>
          <div className="flex-1" />
          <button onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))} className="p-1 text-muted-foreground hover:text-foreground">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] text-muted-foreground w-8 text-center">{Math.round(timelineZoom * 100)}%</span>
          <button onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))} className="p-1 text-muted-foreground hover:text-foreground">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline tracks */}
        <div className="flex-1 flex min-h-0">
          {/* Track headers */}
          <div className="w-[100px] flex-shrink-0 border-r border-border">
            {tracks.map((track) => (
              <div key={track.id} className="h-[52px] flex items-center px-2 gap-1 border-b border-border/50">
                <button className="p-0.5 text-muted-foreground hover:text-foreground">
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <span className="text-[9px] text-muted-foreground truncate">{track.name}</span>
              </div>
            ))}
          </div>

          {/* Timeline content */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative">
            {/* Timecode ruler */}
            <div className="h-5 border-b border-border/50 flex items-end px-0 sticky top-0 bg-[hsl(var(--surface-1))] z-10">
              {duration > 0 && Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 relative" style={{ width: `${60 * timelineZoom}px` }}>
                  <div className="absolute bottom-0 left-0 w-px h-2 bg-border" />
                  <span className="absolute bottom-1 left-1 text-[7px] text-muted-foreground/60 font-mono">
                    {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>

            {/* Video track */}
            <div
              ref={timelineRef}
              onClick={handleTimelineClick}
              className="h-[52px] border-b border-border/50 relative cursor-pointer"
            >
              {activeMedia && duration > 0 && (
                <div
                  className="absolute top-1 bottom-1 bg-[hsl(var(--gold))/0.15] border border-[hsl(var(--gold))/0.3] overflow-hidden flex"
                  style={{
                    left: `${(trimStart / duration) * duration * 60 * timelineZoom}px`,
                    width: `${((trimEnd - trimStart) / duration) * duration * 60 * timelineZoom}px`,
                  }}
                >
                  {thumbnails.map((thumb, i) => (
                    <div key={i} className="flex-1 h-full overflow-hidden opacity-70">
                      <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ))}
                  {/* Trim handles */}
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-[hsl(var(--gold))] cursor-col-resize hover:w-2 transition-all" />
                  <div className="absolute inset-y-0 right-0 w-1.5 bg-[hsl(var(--gold))] cursor-col-resize hover:w-2 transition-all" />
                </div>
              )}
              {!activeMedia && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/40">Drag material here and start to create</span>
                </div>
              )}
            </div>

            {/* Audio track */}
            <div className="h-[52px] border-b border-border/50 relative">
              {audioName && duration > 0 && (
                <div className="absolute top-1 bottom-1 left-0 bg-purple-500/15 border border-purple-500/30 flex items-center px-2 gap-1"
                  style={{ width: `${duration * 60 * timelineZoom}px` }}>
                  <Music className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  <span className="text-[8px] text-purple-400 truncate">{audioName}</span>
                </div>
              )}
            </div>

            {/* Text track */}
            <div className="h-[52px] border-b border-border/50 relative">
              {textOverlays.map((t, i) => (
                <div key={t.id} className="absolute top-1 bottom-1 bg-emerald-500/15 border border-emerald-500/30 flex items-center px-2"
                  style={{ left: `${i * 80}px`, width: `${Math.max(120, duration * 20) * timelineZoom}px` }}>
                  <Type className="w-3 h-3 text-emerald-400 mr-1 flex-shrink-0" />
                  <span className="text-[8px] text-emerald-400 truncate">{t.text}</span>
                </div>
              ))}
            </div>

            {/* Playhead */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                style={{ left: `${(currentTime / duration) * duration * 60 * timelineZoom}px` }}
              >
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />
      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
    </div>
  );
}