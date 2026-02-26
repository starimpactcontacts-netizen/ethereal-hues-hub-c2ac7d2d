import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, Film, Play, Pause, Type, Sliders, Music, X, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FilterPreset = {
  name: string;
  label: string;
  filter: string;
};

const FILTER_PRESETS: FilterPreset[] = [
  { name: "none", label: "Original", filter: "none" },
  { name: "cinematic", label: "Cinematic", filter: "contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)" },
  { name: "phonk", label: "Phonk", filter: "contrast(1.4) saturate(1.3) brightness(0.85) hue-rotate(-10deg)" },
  { name: "noir", label: "Noir", filter: "grayscale(1) contrast(1.3) brightness(0.9)" },
  { name: "cold", label: "Cold", filter: "saturate(0.7) brightness(1.05) hue-rotate(15deg) contrast(1.1)" },
  { name: "heat", label: "Heat", filter: "saturate(1.4) brightness(1.05) hue-rotate(-15deg) contrast(1.1)" },
  { name: "vintage", label: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.8)" },
];

type TextOverlay = {
  text: string;
  x: number;
  y: number;
  style: "bold" | "caption" | "title";
};

const TEXT_STYLES = {
  bold: { font: "bold 48px 'Bebas Neue', sans-serif", color: "#ffffff", stroke: "#000000" },
  caption: { font: "600 24px 'Inter', sans-serif", color: "#ffffff", stroke: "#000000" },
  title: { font: "bold 64px 'Bebas Neue', sans-serif", color: "hsl(43, 74%, 49%)", stroke: "#000000" },
};

type ProcessingState = "idle" | "processing" | "done";
type EditorTab = "filters" | "text" | "audio" | "trim";

export default function QuickClipEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState<"bold" | "caption" | "title">("bold");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [activeTab, setActiveTab] = useState<EditorTab>("filters");
  const [state, setState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      toast.error("Max 500MB");
      return;
    }
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setState("idle");
    setProgress(0);
    setTextOverlay(null);
    setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null);
    setAudioName("");
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }
    setAudioFile(f);
    setAudioName(f.name);
    toast.success("Audio track added");
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onMeta = () => {
      setDuration(vid.duration);
      setTrimEnd(vid.duration);
    };
    const onTime = () => setCurrentTime(vid.currentTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTime);
    return () => {
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("timeupdate", onTime);
    };
  }, [videoUrl]);

  // Canvas draw loop for preview
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
        ctx.filter = activeFilter.filter;
        ctx.drawImage(vid, 0, 0);
        ctx.filter = "none";

        // Draw text overlay
        if (textOverlay) {
          const style = TEXT_STYLES[textOverlay.style];
          ctx.font = style.font;
          ctx.textAlign = "center";
          ctx.strokeStyle = style.stroke;
          ctx.lineWidth = 4;
          ctx.strokeText(textOverlay.text, canvas.width * textOverlay.x, canvas.height * textOverlay.y);
          ctx.fillStyle = style.color;
          ctx.fillText(textOverlay.text, canvas.width * textOverlay.x, canvas.height * textOverlay.y);
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [videoUrl, activeFilter, textOverlay]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.currentTime = Math.max(vid.currentTime, trimStart);
      vid.play();
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
    }
  };

  // Enforce trim bounds during playback
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playing) return;
    const check = () => {
      if (vid.currentTime >= trimEnd) {
        vid.pause();
        vid.currentTime = trimStart;
        setPlaying(false);
      }
    };
    const id = setInterval(check, 100);
    return () => clearInterval(id);
  }, [playing, trimEnd, trimStart]);

  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    setTextOverlay({ text: textInput, x: 0.5, y: 0.5, style: textStyle });
    toast.success("Text overlay added");
  };

  const clearFile = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setVideoUrl(null);
    setResultUrl(null);
    setState("idle");
    setProgress(0);
    setTextOverlay(null);
    setActiveFilter(FILTER_PRESETS[0]);
    setAudioFile(null);
    setAudioName("");
    setTrimStart(0);
    setTrimEnd(0);
    setPlaying(false);
  };

  const startExport = useCallback(async () => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas || !file) return;

    setState("processing");
    setProgress(0);

    const ctx = canvas.getContext("2d")!;
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;

    const stream = canvas.captureStream(30);

    // Mix audio if provided
    let audioCtx: AudioContext | null = null;
    let audioSource: AudioBufferSourceNode | null = null;
    if (audioFile) {
      audioCtx = new AudioContext();
      const buf = await audioFile.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buf);
      audioSource = audioCtx.createBufferSource();
      audioSource.buffer = decoded;
      const dest = audioCtx.createMediaStreamDestination();
      audioSource.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: Math.min(vid.videoWidth * vid.videoHeight * 8, 40_000_000),
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const resultPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    recorder.start(100);
    if (audioSource) audioSource.start(0);

    vid.currentTime = trimStart;
    vid.muted = true;
    await vid.play();

    const exportDuration = trimEnd - trimStart;
    const drawLoop = () => {
      if (vid.currentTime >= trimEnd || vid.ended) {
        vid.pause();
        recorder.stop();
        if (audioSource) audioSource.stop();
        if (audioCtx) audioCtx.close();
        return;
      }
      ctx.filter = activeFilter.filter;
      ctx.drawImage(vid, 0, 0);
      ctx.filter = "none";
      if (textOverlay) {
        const style = TEXT_STYLES[textOverlay.style];
        ctx.font = style.font;
        ctx.textAlign = "center";
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 4;
        ctx.strokeText(textOverlay.text, canvas.width * textOverlay.x, canvas.height * textOverlay.y);
        ctx.fillStyle = style.color;
        ctx.fillText(textOverlay.text, canvas.width * textOverlay.x, canvas.height * textOverlay.y);
      }
      setProgress(Math.min(99, Math.round(((vid.currentTime - trimStart) / exportDuration) * 100)));
      requestAnimationFrame(drawLoop);
    };
    drawLoop();

    const blob = await resultPromise;
    const url = URL.createObjectURL(blob);
    setResultUrl(url);
    setProgress(100);
    setState("done");
    vid.muted = false;
    toast.success("Export complete!");
  }, [file, trimStart, trimEnd, activeFilter, textOverlay, audioFile]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_edited.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!file) {
    return (
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video border-2 border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 transition-all flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 bg-gold/15 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gold" />
          </div>
          <div className="text-center">
            <p className="font-display text-sm text-gold">Upload Your Clip</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">MP4, MOV, WEBM • Max 500MB</p>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Canvas Preview */}
      <div className="relative bg-black border border-border overflow-hidden">
        <video ref={videoRef} src={videoUrl!} className="hidden" playsInline muted={false} />
        <canvas ref={canvasRef} className="w-full aspect-video object-contain" />
        <button onClick={clearFile} className="absolute top-2 right-2 w-7 h-7 bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors">
          <X className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={togglePlay} className="absolute bottom-2 left-2 w-8 h-8 bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors">
          {playing ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground" />}
        </button>
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5">
          <span className="text-[10px] text-foreground tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
      </div>

      {/* Trim Timeline */}
      <div className="bg-surface-1 border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="label-xs text-muted-foreground">Trim</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatTime(trimStart)} — {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)})
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={trimStart}
            onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.5))}
            className="flex-1 accent-gold h-1"
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={trimEnd}
            onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.5))}
            className="flex-1 accent-gold h-1"
          />
        </div>
      </div>

      {/* Tab Bar */}
      {state === "idle" && (
        <div className="flex border border-border bg-surface-1">
          {(["filters", "text", "audio"] as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab ? "bg-gold/10 text-gold border-b-2 border-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "filters" && <Sliders className="w-3.5 h-3.5 mx-auto mb-0.5" />}
              {tab === "text" && <Type className="w-3.5 h-3.5 mx-auto mb-0.5" />}
              {tab === "audio" && <Music className="w-3.5 h-3.5 mx-auto mb-0.5" />}
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {activeTab === "filters" && state === "idle" && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setActiveFilter(preset)}
              className={`flex-shrink-0 px-3 py-2 border text-[11px] font-semibold uppercase tracking-wider transition-all ${
                activeFilter.name === preset.name
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-surface-1 text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Text Panel */}
      {activeTab === "text" && state === "idle" && (
        <div className="bg-surface-1 border border-border p-3 space-y-3">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your text..."
            className="w-full bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
          />
          <div className="flex gap-2">
            {(["bold", "caption", "title"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setTextStyle(s)}
                className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                  textStyle === s ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={addTextOverlay} className="flex-1 h-8 bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold">
              Add Text
            </Button>
            {textOverlay && (
              <Button onClick={() => setTextOverlay(null)} variant="outline" className="h-8 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Audio Panel */}
      {activeTab === "audio" && state === "idle" && (
        <div className="bg-surface-1 border border-border p-3 space-y-3">
          {audioName ? (
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-gold" />
              <span className="text-xs text-foreground truncate flex-1">{audioName}</span>
              <button onClick={() => { setAudioFile(null); setAudioName(""); }} className="text-xs text-destructive">Remove</button>
            </div>
          ) : (
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-3 border border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4 text-gold" />
              <span className="text-xs text-gold font-semibold">Add Music Track</span>
            </button>
          )}
          <p className="text-[10px] text-muted-foreground">Audio will be mixed into the exported video. Original video audio will be muted.</p>
          <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
        </div>
      )}

      {/* Progress */}
      {state === "processing" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-1 border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-4 h-4 text-gold animate-spin" />
            <span className="text-sm font-medium">Exporting...</span>
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted/30 overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-gold to-amber-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}

      {/* Actions */}
      {state === "idle" && (
        <Button onClick={startExport} className="w-full h-12 bg-gold text-primary-foreground hover:bg-gold/90 font-display text-base gap-2">
          <Film className="w-4 h-4" />
          Export Clip
        </Button>
      )}

      {state === "done" && resultUrl && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-emerald-400">Export Complete!</p>
          </div>
          <Button onClick={handleDownload} className="w-full h-12 bg-gold text-primary-foreground hover:bg-gold/90 font-display text-base gap-2">
            <Download className="w-4 h-4" />
            Download Video
          </Button>
          <Button onClick={clearFile} variant="ghost" className="w-full text-xs text-muted-foreground">
            Edit Another Clip
          </Button>
        </motion.div>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
