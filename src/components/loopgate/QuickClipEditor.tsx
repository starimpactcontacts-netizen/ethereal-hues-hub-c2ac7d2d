import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, Download, Film, Play, Pause, Type, Music, X,
  Loader2, Check, SkipBack, SkipForward, Scissors, RotateCcw,
  ChevronLeft, Sparkles, Volume2, VolumeX, Gauge, Layers,
  Wand2, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// ─── Types & Constants ───
type FilterPreset = { name: string; label: string; filter: string; preview: string };
type TextOverlay = { id: string; text: string; x: number; y: number; style: "bold" | "caption" | "title" | "glow" };
type EditorTool = "trim" | "filters" | "text" | "audio" | "speed" | "effects" | "transitions" | "adjust";

const FILTER_PRESETS: FilterPreset[] = [
  { name: "none", label: "Original", filter: "none", preview: "linear-gradient(135deg, hsl(0 0% 30%), hsl(0 0% 50%))" },
  { name: "cinematic", label: "Cinema", filter: "contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)", preview: "linear-gradient(135deg, hsl(30 30% 25%), hsl(40 40% 45%))" },
  { name: "phonk", label: "Phonk", filter: "contrast(1.4) saturate(1.3) brightness(0.85) hue-rotate(-10deg)", preview: "linear-gradient(135deg, hsl(340 60% 25%), hsl(0 70% 40%))" },
  { name: "noir", label: "Noir", filter: "grayscale(1) contrast(1.3) brightness(0.9)", preview: "linear-gradient(135deg, hsl(0 0% 10%), hsl(0 0% 35%))" },
  { name: "cold", label: "Cold", filter: "saturate(0.7) brightness(1.05) hue-rotate(15deg) contrast(1.1)", preview: "linear-gradient(135deg, hsl(210 50% 25%), hsl(200 60% 50%))" },
  { name: "heat", label: "Heat", filter: "saturate(1.4) brightness(1.05) hue-rotate(-15deg) contrast(1.1)", preview: "linear-gradient(135deg, hsl(15 70% 30%), hsl(30 80% 50%))" },
  { name: "vintage", label: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.8)", preview: "linear-gradient(135deg, hsl(35 40% 25%), hsl(40 50% 45%))" },
  { name: "neon", label: "Neon", filter: "contrast(1.3) saturate(1.6) brightness(1.1)", preview: "linear-gradient(135deg, hsl(280 70% 30%), hsl(180 70% 45%))" },
  { name: "fade", label: "Fade", filter: "contrast(0.85) saturate(0.6) brightness(1.15)", preview: "linear-gradient(135deg, hsl(220 15% 40%), hsl(200 20% 60%))" },
  { name: "chrome", label: "Chrome", filter: "contrast(1.2) saturate(0.4) brightness(1.1)", preview: "linear-gradient(135deg, hsl(200 10% 40%), hsl(210 20% 55%))" },
  { name: "lofi", label: "Lo-Fi", filter: "contrast(1.5) saturate(1.1) brightness(0.8)", preview: "linear-gradient(135deg, hsl(0 40% 20%), hsl(350 30% 35%))" },
  { name: "dream", label: "Dream", filter: "contrast(0.9) saturate(1.3) brightness(1.15)", preview: "linear-gradient(135deg, hsl(270 40% 40%), hsl(280 50% 55%))" },
];

const TEXT_STYLES = {
  bold: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "#000000", label: "Bold" },
  caption: { font: "600 24px 'Inter', sans-serif", color: "#ffffff", stroke: "#000000", label: "Caption" },
  title: { font: "bold 64px 'Bebas Neue', sans-serif", color: "hsl(43, 74%, 49%)", stroke: "#000000", label: "Title" },
  glow: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "rgba(200,150,50,0.8)", label: "Glow" },
};

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const EFFECTS = [
  { id: "glitch", label: "Glitch", icon: "⚡" },
  { id: "shake", label: "Shake", icon: "📳" },
  { id: "zoom_pulse", label: "Zoom", icon: "🔍" },
  { id: "flash", label: "Flash", icon: "💥" },
  { id: "rgb_split", label: "RGB Split", icon: "🌈" },
  { id: "vhs", label: "VHS", icon: "📼" },
  { id: "grain", label: "Grain", icon: "🎞" },
  { id: "light_leak", label: "Leak", icon: "☀️" },
  { id: "mirror", label: "Mirror", icon: "🪞" },
  { id: "pixelate", label: "Pixel", icon: "🟩" },
  { id: "invert", label: "Invert", icon: "🔄" },
  { id: "blur_pulse", label: "Blur", icon: "💨" },
];

const TRANSITIONS = [
  { id: "fade", label: "Fade", icon: "🌅" },
  { id: "dissolve", label: "Dissolve", icon: "✨" },
  { id: "slide_left", label: "Slide L", icon: "⬅" },
  { id: "slide_right", label: "Slide R", icon: "➡" },
  { id: "wipe", label: "Wipe", icon: "🧹" },
  { id: "zoom_in", label: "Zoom In", icon: "🔎" },
  { id: "spin", label: "Spin", icon: "🌀" },
  { id: "glitch_trans", label: "Glitch", icon: "⚡" },
  { id: "flash_trans", label: "Flash", icon: "💫" },
];

// ─── Effect application (shared with desktop) ───
function applyEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, effectId: string, time: number) {
  const w = canvas.width, h = canvas.height;
  switch (effectId) {
    case "glitch": {
      const sliceCount = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < sliceCount; i++) {
        const y = Math.random() * h;
        const sliceH = 2 + Math.random() * 15;
        const offset = (Math.random() - 0.5) * 20;
        const imgData = ctx.getImageData(0, y, w, sliceH);
        ctx.putImageData(imgData, offset, y);
      }
      break;
    }
    case "shake": {
      const ox = (Math.random() - 0.5) * 10;
      const oy = (Math.random() - 0.5) * 10;
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(imgData, ox, oy);
      break;
    }
    case "zoom_pulse": {
      const scale = 1 + Math.sin(time * 4) * 0.03;
      const imgData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
      ctx.putImageData(imgData, 0, 0);
      ctx.restore();
      break;
    }
    case "flash": {
      if (Math.random() < 0.05) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`;
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    case "rgb_split": {
      const imgData = ctx.getImageData(0, 0, w, h);
      const shift = 3 + Math.sin(time * 3) * 2;
      const shifted = ctx.createImageData(w, h);
      for (let y2 = 0; y2 < h; y2++) {
        for (let x = 0; x < w; x++) {
          const idx = (y2 * w + x) * 4;
          const rIdx = (y2 * w + Math.min(w - 1, x + Math.round(shift))) * 4;
          const bIdx = (y2 * w + Math.max(0, x - Math.round(shift))) * 4;
          shifted.data[idx] = imgData.data[rIdx];
          shifted.data[idx + 1] = imgData.data[idx + 1];
          shifted.data[idx + 2] = imgData.data[bIdx + 2];
          shifted.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(shifted, 0, 0);
      break;
    }
    case "vhs": {
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      for (let y2 = 0; y2 < h; y2 += 2) ctx.fillRect(0, y2, w, 1);
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = `hsl(${(time * 60) % 360}, 100%, 50%)`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    }
    case "grain": {
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgData.data.length; i += 16) { // Skip pixels for mobile perf
        const noise = (Math.random() - 0.5) * 25;
        imgData.data[i] += noise;
        imgData.data[i + 1] += noise;
        imgData.data[i + 2] += noise;
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }
    case "light_leak": {
      const gradient = ctx.createRadialGradient(
        w * (0.3 + Math.sin(time * 0.5) * 0.3), h * 0.3, 0,
        w * 0.5, h * 0.5, w * 0.8
      );
      gradient.addColorStop(0, `hsla(${(time * 30) % 60 + 20}, 80%, 60%, 0.12)`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "mirror": {
      const half = ctx.getImageData(0, 0, w / 2, h);
      ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.putImageData(half, w / 2, 0);
      ctx.restore();
      break;
    }
    case "pixelate": {
      const size = 10;
      for (let y2 = 0; y2 < h; y2 += size) {
        for (let x = 0; x < w; x += size) {
          const imgData = ctx.getImageData(x, y2, 1, 1);
          ctx.fillStyle = `rgb(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]})`;
          ctx.fillRect(x, y2, size, size);
        }
      }
      break;
    }
    case "invert": {
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = 255 - imgData.data[i];
        imgData.data[i + 1] = 255 - imgData.data[i + 1];
        imgData.data[i + 2] = 255 - imgData.data[i + 2];
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }
    case "blur_pulse": {
      ctx.globalAlpha = 0.12;
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < 2; i++) {
        ctx.putImageData(imgData, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}

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
  const [textStyle, setTextStyle] = useState<"bold" | "caption" | "title" | "glow">("bold");
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
  
  // Effects & transitions
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  
  // Color grading
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);

  const computedFilter = useMemo(() => {
    const parts: string[] = [];
    if (activeFilter.filter !== "none") parts.push(activeFilter.filter);
    if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
    if (hueRotate !== 0) parts.push(`hue-rotate(${hueRotate}deg)`);
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [activeFilter, brightness, contrast, saturation, hueRotate]);

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
  };

  // Thumbnails
  useEffect(() => {
    if (!videoUrl) return;
    const vid = document.createElement("video");
    vid.src = videoUrl; vid.crossOrigin = "anonymous"; vid.muted = true; vid.preload = "auto";
    vid.onloadedmetadata = () => {
      setDuration(vid.duration); setTrimEnd(vid.duration);
      const count = Math.min(12, Math.max(6, Math.floor(vid.duration / 2)));
      const interval = vid.duration / count;
      const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 60;
      const ctx = canvas.getContext("2d")!;
      const thumbs: string[] = []; let i = 0;
      const captureFrame = () => { if (i >= count) { setThumbnails(thumbs); return; } vid.currentTime = i * interval; };
      vid.onseeked = () => { ctx.drawImage(vid, 0, 0, 80, 60); thumbs.push(canvas.toDataURL("image/jpeg", 0.5)); i++; captureFrame(); };
      captureFrame();
    };
  }, [videoUrl]);

  useEffect(() => {
    const vid = videoRef.current; if (!vid) return;
    const onMeta = () => { setDuration(vid.duration); setTrimEnd(vid.duration); };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => { vid.removeEventListener("loadedmetadata", onMeta); vid.removeEventListener("timeupdate", onTime); };
  }, [videoUrl]);

  // Canvas draw loop with effects
  useEffect(() => {
    const vid = videoRef.current; const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const draw = () => {
      if (vid.videoWidth && vid.videoHeight) {
        canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
        ctx.filter = computedFilter;
        ctx.drawImage(vid, 0, 0);
        ctx.filter = "none";
        // Apply effects
        activeEffects.forEach(effectId => applyEffect(ctx, canvas, effectId, vid.currentTime));
        // Text overlays
        textOverlays.forEach((overlay) => {
          const style = TEXT_STYLES[overlay.style];
          ctx.font = style.font; ctx.textAlign = "center";
          if (overlay.style === "glow") { ctx.shadowColor = "rgba(200,150,50,0.9)"; ctx.shadowBlur = 20; }
          ctx.strokeStyle = style.stroke; ctx.lineWidth = 4;
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
  }, [videoUrl, computedFilter, textOverlays, activeEffects]);

  const togglePlay = () => {
    const vid = videoRef.current; if (!vid) return;
    if (vid.paused) { vid.currentTime = Math.max(vid.currentTime, trimStart); vid.playbackRate = speed; vid.play(); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
  };

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !playing) return;
    const check = () => { if (vid.currentTime >= trimEnd) { vid.pause(); vid.currentTime = trimStart; setPlaying(false); } };
    const id = setInterval(check, 100);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlays(prev => [...prev, { id: crypto.randomUUID(), text: textInput, x: 0.5, y: 0.5, style: textStyle }]);
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

  const seekTo = (time: number) => { if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time); } };

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
    const ctx = canvas.getContext("2d")!;
    canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
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
    vid.currentTime = trimStart; vid.muted = true; vid.playbackRate = 1;
    await vid.play();
    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) { vid.pause(); recorder.stop(); return; }
      ctx.filter = computedFilter; ctx.drawImage(vid, 0, 0); ctx.filter = "none";
      activeEffects.forEach(effectId => applyEffect(ctx, canvas, effectId, vid.currentTime));
      textOverlays.forEach((overlay) => {
        const style = TEXT_STYLES[overlay.style];
        ctx.font = style.font; ctx.textAlign = "center";
        if (overlay.style === "glow") { ctx.shadowColor = "rgba(200,150,50,0.9)"; ctx.shadowBlur = 20; }
        ctx.strokeStyle = style.stroke; ctx.lineWidth = 4;
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
    setProgress(100); setState("done"); vid.muted = muted; vid.playbackRate = speed;
    toast.success("Export complete!");
  }, [file, trimStart, trimEnd, computedFilter, textOverlays, audioFile, muted, speed, activeEffects]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_edited.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60); const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  // ─── Upload Screen ───
  if (!file) {
    return (
      <div className="space-y-4">
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[9/16] max-h-[50vh] border border-border bg-surface-1 hover:bg-surface-1/80 transition-all flex flex-col items-center justify-center gap-4 group rounded-xl">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-gold/15 rounded-xl flex items-center justify-center border border-gold/30 group-hover:bg-gold/25 transition-colors">
            <Upload className="w-7 h-7 text-gold" />
          </motion.div>
          <div className="text-center space-y-1">
            <p className="font-display text-base text-gold">Start Editing</p>
            <p className="text-[11px] text-muted-foreground">Tap to upload a clip</p>
            <p className="text-[10px] text-muted-foreground/60">MP4, MOV, WEBM • Max 500MB</p>
          </div>
        </button>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Scissors, label: "Trim" },
            { icon: Sparkles, label: "Effects" },
            { icon: Type, label: "Text" },
            { icon: Wand2, label: "Filters" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-surface-1 border border-border rounded-lg p-3 flex flex-col items-center gap-1.5">
              <Icon className="w-4 h-4 text-gold/60" />
              <span className="text-[9px] text-muted-foreground">{label}</span>
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
        className={`flex flex-col bg-background ${isFullscreen ? "fixed inset-0 z-50" : "relative"}`}
        style={{ height: isFullscreen ? "100dvh" : "auto" }}>

        {/* ─── Top Bar ─── */}
        <div className="flex items-center gap-3 px-3 py-2 bg-background border-b border-border flex-shrink-0">
          <button onClick={() => { if (isFullscreen) setIsFullscreen(false); else clearFile(); }} className="p-1.5 hover:bg-surface-1 transition-colors rounded-md">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{fmt(trimEnd - trimStart)} clip</p>
          </div>
          <div className="flex items-center gap-1">
            {state === "done" ? (
              <Button onClick={handleDownload} size="sm" className="h-8 bg-gold text-primary-foreground hover:bg-gold/90 text-[11px] font-bold gap-1 rounded-md">
                <Download className="w-3.5 h-3.5" /> Save
              </Button>
            ) : (
              <Button onClick={startExport} size="sm" disabled={state === "processing"} className="h-8 bg-gold text-primary-foreground hover:bg-gold/90 text-[11px] font-bold gap-1 rounded-md">
                {state === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                {state === "processing" ? `${progress}%` : "Export"}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Video Preview ─── */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">
          <video ref={videoRef} src={videoUrl!} className="hidden" playsInline />
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />

          {!playing && (
            <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors">
              <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
            </button>
          )}
          {playing && <button onClick={togglePlay} className="absolute inset-0" />}

          {/* Active effects badges */}
          {activeEffects.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[60%]">
              {activeEffects.map(eff => (
                <span key={eff} className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 border border-gold/30 rounded-sm text-[8px] text-gold font-bold uppercase">
                  {EFFECTS.find(e => e.id === eff)?.label}
                </span>
              ))}
            </div>
          )}

          {speed !== 1 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 border border-gold/30 rounded-sm">
              <span className="text-[10px] text-gold font-bold">{speed}x</span>
            </div>
          )}

          <button onClick={() => setMuted(!muted)} className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10">
            {muted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white/70" />}
          </button>

          {state === "processing" && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-sm font-semibold text-foreground">Exporting... {progress}%</p>
              <div className="w-48 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gold rounded-full" animate={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {state === "done" && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Export ready — tap Save</span>
            </div>
          )}
        </div>

        {/* ─── Timeline ─── */}
        <div className="flex-shrink-0 bg-surface-1 border-t border-border">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="text-[10px] text-gold tabular-nums font-mono">{fmt(currentTime)}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => seekTo(trimStart)} className="p-1"><SkipBack className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={togglePlay} className="w-9 h-9 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center hover:bg-gold/20 transition-colors">
                {playing ? <Pause className="w-4 h-4 text-gold" /> : <Play className="w-4 h-4 text-gold ml-0.5" />}
              </button>
              <button onClick={() => seekTo(trimEnd)} className="p-1"><SkipForward className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums font-mono">{fmt(trimEnd - trimStart)}</span>
          </div>

          <div className="px-3 pb-2">
            <div ref={timelineRef} onClick={handleTimelineClick}
              className="relative h-12 bg-black/40 border border-border rounded-md overflow-hidden cursor-pointer">
              <div className="absolute inset-0 flex">
                {thumbnails.map((thumb, i) => (
                  <div key={i} className="flex-1 h-full overflow-hidden opacity-70">
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {thumbnails.length === 0 && <div className="flex-1 bg-muted/10" />}
              </div>
              {duration > 0 && (
                <>
                  <div className="absolute inset-y-0 left-0 bg-black/60 rounded-l-md" style={{ width: `${(trimStart / duration) * 100}%` }} />
                  <div className="absolute inset-y-0 right-0 bg-black/60 rounded-r-md" style={{ width: `${((duration - trimEnd) / duration) * 100}%` }} />
                  <div className="absolute inset-y-0 w-1 bg-gold cursor-col-resize z-10 rounded-sm"
                    style={{ left: `${(trimStart / duration) * 100}%` }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max(0, Math.min((trimEnd - 0.5) / duration, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimStart(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove); window.addEventListener("touchend", onEnd);
                    }} />
                  <div className="absolute inset-y-0 w-1 bg-gold cursor-col-resize z-10 rounded-sm"
                    style={{ left: `${(trimEnd / duration) * 100}%` }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const rect = timelineRef.current!.getBoundingClientRect();
                      const onMove = (ev: TouchEvent) => { const pct = Math.max((trimStart + 0.5) / duration, Math.min(1, (ev.touches[0].clientX - rect.left) / rect.width)); setTrimEnd(pct * duration); };
                      const onEnd = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
                      window.addEventListener("touchmove", onMove); window.addEventListener("touchend", onEnd);
                    }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none" style={{ left: `${(currentTime / duration) * 100}%` }}>
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                </>
              )}
              {audioName && (
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-purple-500/20 border-t border-purple-500/30 flex items-center px-1 rounded-b-md">
                  <Music className="w-2 h-2 text-purple-400 mr-0.5" />
                  <span className="text-[7px] text-purple-400 truncate">{audioName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tool Panel (slides up) ─── */}
        <AnimatePresence>
          {activeTool && state === "idle" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }} className="flex-shrink-0 bg-surface-1 border-t border-border overflow-hidden">
              <div className="p-3">
                {/* Filters */}
                {activeTool === "filters" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Filters</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {FILTER_PRESETS.map((preset) => (
                        <button key={preset.name} onClick={() => setActiveFilter(preset)} className="flex-shrink-0 flex flex-col items-center gap-1">
                          <div className={`w-14 h-14 border-2 rounded-lg transition-all ${activeFilter.name === preset.name ? "border-gold" : "border-border"}`}
                            style={{ background: preset.preview }} />
                          <span className={`text-[9px] font-semibold ${activeFilter.name === preset.name ? "text-gold" : "text-muted-foreground"}`}>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Effects */}
                {activeTool === "effects" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Effects</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {EFFECTS.map((effect) => {
                        const isActive = activeEffects.includes(effect.id);
                        return (
                          <button key={effect.id} onClick={() => toggleEffect(effect.id)}
                            className={`py-2.5 rounded-lg flex flex-col items-center gap-1 border transition-all ${isActive ? "border-gold bg-gold/10" : "border-border bg-surface-2"}`}>
                            <span className="text-base">{effect.icon}</span>
                            <span className={`text-[8px] font-semibold ${isActive ? "text-gold" : "text-muted-foreground"}`}>{effect.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeEffects.length > 0 && (
                      <button onClick={() => setActiveEffects([])} className="w-full py-1.5 text-[10px] text-destructive font-semibold border border-destructive/20 rounded-md">
                        Clear All
                      </button>
                    )}
                  </div>
                )}

                {/* Transitions */}
                {activeTool === "transitions" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Transitions</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {TRANSITIONS.map((trans) => {
                        const isActive = activeTransition === trans.id;
                        return (
                          <button key={trans.id} onClick={() => setActiveTransition(isActive ? null : trans.id)}
                            className={`py-2.5 rounded-lg flex flex-col items-center gap-1 border transition-all ${isActive ? "border-gold bg-gold/10" : "border-border bg-surface-2"}`}>
                            <span className="text-base">{trans.icon}</span>
                            <span className={`text-[8px] font-semibold ${isActive ? "text-gold" : "text-muted-foreground"}`}>{trans.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Text */}
                {activeTool === "text" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Text</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type your text..."
                      className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" autoFocus />
                    <div className="flex gap-1.5">
                      {(Object.entries(TEXT_STYLES) as [keyof typeof TEXT_STYLES, typeof TEXT_STYLES[keyof typeof TEXT_STYLES]][]).map(([key, s]) => (
                        <button key={key} onClick={() => setTextStyle(key as any)}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase border rounded-md transition-all ${textStyle === key ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <Button onClick={addTextOverlay} className="w-full h-9 bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold rounded-md">
                      Add Text
                    </Button>
                    {textOverlays.length > 0 && (
                      <div className="space-y-1">
                        {textOverlays.map(t => (
                          <div key={t.id} className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1.5">
                            <Type className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-[11px] text-foreground truncate flex-1">{t.text}</span>
                            <button onClick={() => setTextOverlays(prev => prev.filter(x => x.id !== t.id))} className="text-muted-foreground hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Audio */}
                {activeTool === "audio" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Audio</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    {audioName ? (
                      <div className="flex items-center gap-2 bg-background border border-border rounded-md p-2.5">
                        <Music className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-foreground truncate flex-1">{audioName}</span>
                        <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-[10px] text-destructive font-semibold">Remove</button>
                      </div>
                    ) : (
                      <button onClick={() => audioInputRef.current?.click()}
                        className="w-full py-6 border border-dashed border-purple-400/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all flex flex-col items-center gap-2 rounded-lg">
                        <Music className="w-5 h-5 text-purple-400" />
                        <span className="text-xs text-purple-400 font-semibold">Add Music Track</span>
                      </button>
                    )}
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
                  </div>
                )}

                {/* Speed */}
                {activeTool === "speed" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Speed</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {SPEED_OPTIONS.map((s) => (
                        <button key={s} onClick={() => setSpeed(s)}
                          className={`px-3 py-2 text-xs font-bold border rounded-md transition-all ${speed === s ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trim */}
                {activeTool === "trim" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Trim</span>
                      <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-muted-foreground uppercase">Start</label>
                        <input type="range" min={0} max={duration} step={0.1} value={trimStart}
                          onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.5))}
                          className="w-full accent-[hsl(var(--gold))] h-1" />
                        <span className="text-[10px] text-gold tabular-nums font-mono">{fmt(trimStart)}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] text-muted-foreground uppercase">End</label>
                        <input type="range" min={0} max={duration} step={0.1} value={trimEnd}
                          onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.5))}
                          className="w-full accent-[hsl(var(--gold))] h-1" />
                        <span className="text-[10px] text-gold tabular-nums font-mono">{fmt(trimEnd)}</span>
                      </div>
                    </div>
                    <Button onClick={() => { setTrimStart(0); setTrimEnd(duration); }} variant="outline" size="sm" className="text-[10px] h-7 border-border gap-1 rounded-md">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  </div>
                )}

                {/* Adjust / Color Grading */}
                {activeTool === "adjust" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Adjust</span>
                      <div className="flex gap-2">
                        <button onClick={resetColorGrading} className="text-[10px] text-gold font-semibold">Reset</button>
                        <button onClick={() => setActiveTool(null)} className="text-[10px] text-muted-foreground">Done</button>
                      </div>
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
                          <span className="text-[10px] text-gold font-mono tabular-nums">{value}</span>
                        </div>
                        <Slider value={[value]} onValueChange={(v) => set(v[0])} min={min} max={max} step={1} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom Toolbar ─── */}
        <div className="flex-shrink-0 bg-background border-t border-border">
          <div className="flex items-stretch overflow-x-auto scrollbar-hide">
            {([
              { id: "trim" as EditorTool, icon: Scissors, label: "Trim" },
              { id: "effects" as EditorTool, icon: Sparkles, label: "Effects" },
              { id: "transitions" as EditorTool, icon: Layers, label: "Trans" },
              { id: "filters" as EditorTool, icon: Wand2, label: "Filters" },
              { id: "text" as EditorTool, icon: Type, label: "Text" },
              { id: "audio" as EditorTool, icon: Music, label: "Audio" },
              { id: "speed" as EditorTool, icon: Gauge, label: "Speed" },
              { id: "adjust" as EditorTool, icon: SlidersHorizontal, label: "Adjust" },
            ]).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTool(activeTool === id ? null : id)}
                className={`flex-1 min-w-[52px] py-3 flex flex-col items-center gap-0.5 transition-colors ${activeTool === id ? "text-gold bg-gold/5" : "text-muted-foreground"}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[8px] font-semibold uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
          <div className="h-safe-bottom" />
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
