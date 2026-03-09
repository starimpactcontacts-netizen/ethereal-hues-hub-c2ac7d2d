import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Wand2, Play, ChevronRight, X, Film, Music, Palette,
  Zap, ArrowRight, Check, Loader2, Sparkles, Eye, RefreshCw,
  FileVideo, Clock, Type, Scissors
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Types ─── */
interface ClipInfo {
  id: string;
  file: File;
  name: string;
  duration: number;
  resolution: string;
  thumbnail: string | null;
  description: string;
}

interface TimelineCut {
  clip_index: number;
  start_time: number;
  end_time: number;
  timeline_position: number;
  transition_in: string;
  speed: number;
  notes?: string;
}

interface TextOverlay {
  text: string;
  start_time: number;
  duration: number;
  style: string;
  position: string;
}

interface ColorGrade {
  name: string;
  temperature: number;
  contrast: number;
  saturation: number;
  brightness: number;
  filter: string;
}

interface GeneratedTimeline {
  timeline: {
    total_duration: number;
    color_grade: ColorGrade;
    cuts: TimelineCut[];
    text_overlays: TextOverlay[];
    music_sync_notes?: string;
    creative_direction: string;
  };
}

const STYLES = [
  { id: "tiktok_viral", label: "TikTok Viral", icon: Zap, desc: "Fast cuts, zoom transitions, bold text", color: "#FF004F" },
  { id: "cinematic", label: "Cinematic", icon: Film, desc: "Slow burns, fades, moody color", color: "#FFB800" },
  { id: "music_video", label: "Music Video", icon: Music, desc: "Beat-synced, stylized, glitch cuts", color: "#9999FF" },
  { id: "vlog", label: "Vlog", icon: Eye, desc: "Clean, warm, natural flow", color: "#4ADE80" },
  { id: "montage", label: "Montage", icon: Scissors, desc: "Rapid fire, impact, high energy", color: "#FF6B6B" },
];

const PROGRESS_STEPS = [
  "Analyzing clips...",
  "Detecting key moments...",
  "Syncing to beat...",
  "Building cut sequence...",
  "Applying transitions...",
  "Color grading...",
  "Adding text overlays...",
  "Balancing audio...",
  "Polishing edit...",
  "Finalizing timeline...",
];

interface AutoEditWizardProps {
  onClose: () => void;
  onTimelineReady: (timeline: GeneratedTimeline, clips: ClipInfo[]) => void;
}

export default function AutoEditWizard({ onClose, onTimelineReady }: AutoEditWizardProps) {
  const [step, setStep] = useState<"upload" | "style" | "generating" | "review">("upload");
  const [clips, setClips] = useState<ClipInfo[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [musicBpm, setMusicBpm] = useState<number | null>(null);
  const [musicName, setMusicName] = useState("");
  const [generatedTimeline, setGeneratedTimeline] = useState<GeneratedTimeline | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract thumbnail + duration from video file
  const extractClipInfo = useCallback(async (file: File): Promise<Omit<ClipInfo, "description">> => {
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve({ id, file, name: file.name, duration: 0, resolution: "", thumbnail: null });
      }, 8000);

      video.onloadeddata = async () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const resolution = video.videoWidth > 0 ? `${video.videoWidth}x${video.videoHeight}` : "";

        let thumbnail: string | null = null;
        try {
          video.currentTime = Math.min(1, duration * 0.25);
          await new Promise<void>((r) => video.addEventListener("seeked", () => r(), { once: true }));
          await new Promise((r) => setTimeout(r, 200));

          const canvas = document.createElement("canvas");
          canvas.width = 160;
          canvas.height = Math.round(160 * (video.videoHeight / Math.max(video.videoWidth, 1)));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnail = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch { }

        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve({ id, file, name: file.name.replace(/\.[^/.]+$/, ""), duration, resolution, thumbnail });
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve({ id, file, name: file.name, duration: 0, resolution: "", thumbnail: null });
      };
    });
  }, []);

  const handleAddClips = useCallback(async (files: FileList) => {
    const videoFiles = Array.from(files).filter(f => f.type.startsWith("video/")).slice(0, 10);
    if (videoFiles.length === 0) { toast.error("No video files found"); return; }

    toast.loading("Analyzing clips...", { id: "clip-analysis" });
    const infos = await Promise.all(videoFiles.map(extractClipInfo));
    const clipsWithDesc: ClipInfo[] = infos.map(info => ({ ...info, description: "" }));
    setClips(prev => [...prev, ...clipsWithDesc].slice(0, 10));
    toast.dismiss("clip-analysis");
    toast.success(`${videoFiles.length} clip${videoFiles.length > 1 ? "s" : ""} added`);
  }, [extractClipInfo]);

  // Progress simulation during AI generation
  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setProgressIndex(prev => {
        if (prev >= PROGRESS_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  const handleGenerate = useCallback(async () => {
    if (clips.length === 0) return;
    setStep("generating");
    setProgressIndex(0);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("auto-edit", {
        body: {
          clips: clips.map(c => ({
            name: c.name,
            duration: c.duration,
            resolution: c.resolution,
            description: c.description || c.name,
          })),
          style: selectedStyle,
          musicBpm,
          musicName: musicName || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message || "Generation failed");
      if (data?.error) throw new Error(data.error);

      setGeneratedTimeline(data as GeneratedTimeline);
      setProgressIndex(PROGRESS_STEPS.length - 1);
      // Small delay for dramatic reveal
      setTimeout(() => setStep("review"), 800);
    } catch (err: any) {
      console.error("Auto-edit error:", err);
      setError(err.message || "Failed to generate edit");
      setStep("style");
      toast.error(err.message || "Auto-edit failed");
    }
  }, [clips, selectedStyle, musicBpm, musicName]);

  const handleRegenerate = useCallback(() => {
    setGeneratedTimeline(null);
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #9999FF, #FF6B6B)" }}>
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight" style={{ fontFamily: "'Teko', sans-serif", fontSize: "22px", letterSpacing: "0.04em" }}>
              LOOPY AUTO-EDIT
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] -mt-0.5">AI-Powered • One-Click Professional Edits</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="shrink-0 px-5 py-3 flex items-center gap-2">
        {(["upload", "style", "generating", "review"] as const).map((s, i) => {
          const labels = ["Upload Clips", "Select Style", "AI Building", "Review"];
          const icons = [Upload, Palette, Wand2, Eye];
          const Icon = icons[i];
          const isActive = step === s;
          const isDone = ["upload", "style", "generating", "review"].indexOf(step) > i;

          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-[#9999FF]" : "bg-white/10"}`} />}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all
                ${isActive ? "bg-[#9999FF]/20 text-[#9999FF] border border-[#9999FF]/30" :
                  isDone ? "bg-white/[0.06] text-white/50" : "text-white/20"}`}>
                {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{labels[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: UPLOAD ═══ */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-6">

              <div className="text-center mb-8">
                <h2 className="text-xl font-black text-white/90" style={{ fontFamily: "'Teko', sans-serif", fontSize: "28px" }}>
                  DROP YOUR CLIPS
                </h2>
                <p className="text-xs text-white/30 mt-1">Upload 2-10 raw clips. Loopy will find the best moments.</p>
              </div>

              {/* Upload area */}
              <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden"
                onChange={(e) => e.target.files && handleAddClips(e.target.files)} />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 hover:border-[#9999FF]/40 rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group hover:bg-[#9999FF]/[0.03]"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: "linear-gradient(135deg, #9999FF22, #FF6B6B11)" }}>
                  <Upload className="w-7 h-7 text-[#9999FF]/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white/60">Click to add clips</p>
                  <p className="text-[10px] text-white/20 mt-1">MP4, MOV, WEBM • Up to 2GB each • 10 clips max</p>
                </div>
              </button>

              {/* Clip list */}
              {clips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">{clips.length} clip{clips.length > 1 ? "s" : ""} loaded</p>
                  {clips.map((clip, i) => (
                    <div key={clip.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/[0.05] shrink-0">
                        {clip.thumbnail ? (
                          <img src={clip.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileVideo className="w-4 h-4 text-white/15" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white/70 truncate">{clip.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/25">{clip.duration.toFixed(1)}s</span>
                          {clip.resolution && <span className="text-[9px] text-white/25">{clip.resolution}</span>}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Describe this clip..."
                        value={clip.description}
                        onChange={(e) => setClips(prev => prev.map((c, j) => j === i ? { ...c, description: e.target.value } : c))}
                        className="w-40 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/60 placeholder:text-white/15 focus:outline-none focus:border-[#9999FF]/30"
                      />
                      <button onClick={() => setClips(prev => prev.filter((_, j) => j !== i))}
                        className="p-1 hover:bg-white/[0.06] rounded transition-colors">
                        <X className="w-3 h-3 text-white/20" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {clips.length >= 2 && (
                <button onClick={() => setStep("style")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #9999FF, #7B7BFF)", boxShadow: "0 4px 20px rgba(153,153,255,0.3)" }}>
                  Next: Select Style <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {clips.length === 1 && (
                <p className="text-center text-[10px] text-white/20">Add at least 2 clips to continue</p>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 2: STYLE ═══ */}
          {step === "style" && (
            <motion.div key="style" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-6">

              <div className="text-center mb-8">
                <h2 className="text-xl font-black text-white/90" style={{ fontFamily: "'Teko', sans-serif", fontSize: "28px" }}>
                  PICK YOUR VIBE
                </h2>
                <p className="text-xs text-white/30 mt-1">Choose a style preset. Loopy matches cuts, transitions & color to it.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STYLES.map(s => {
                  const isActive = selectedStyle === s.id;
                  return (
                    <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all text-left
                        ${isActive ? "border-[#9999FF]/50 bg-[#9999FF]/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                        <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className={`text-[13px] font-bold ${isActive ? "text-white" : "text-white/60"}`}>{s.label}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{s.desc}</p>
                      </div>
                      {isActive && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center bg-[#9999FF]">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional: Music info */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Music (Optional)</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Song name..."
                    value={musicName}
                    onChange={(e) => setMusicName(e.target.value)}
                    className="flex-1 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/60 placeholder:text-white/15 focus:outline-none focus:border-[#9999FF]/30"
                  />
                  <input
                    type="number"
                    placeholder="BPM"
                    value={musicBpm || ""}
                    onChange={(e) => setMusicBpm(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-20 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/60 placeholder:text-white/15 focus:outline-none focus:border-[#9999FF]/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep("upload")}
                  className="px-4 py-3 rounded-xl text-xs font-bold text-white/40 border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                  Back
                </button>
                <button onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #9999FF, #FF6B6B)", boxShadow: "0 4px 30px rgba(153,153,255,0.3), 0 4px 30px rgba(255,107,107,0.15)" }}>
                  <Wand2 className="w-4 h-4" />
                  Loopy Auto-Edit
                  <Sparkles className="w-3 h-3 opacity-60" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: GENERATING ═══ */}
          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-8">

              {/* Animated orb */}
              <div className="relative w-32 h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "conic-gradient(from 0deg, #9999FF, #FF6B6B, #FFB800, #4ADE80, #9999FF)", opacity: 0.3 }}
                />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-2 rounded-full"
                  style={{ background: "radial-gradient(circle, #9999FF44, transparent 70%)" }}
                />
                <div className="absolute inset-4 rounded-full bg-black/80 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-[#9999FF]" />
                </div>
              </div>

              {/* Progress */}
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #9999FF, #FF6B6B)" }}
                      animate={{ width: `${((progressIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30 font-mono tabular-nums">{Math.round(((progressIndex + 1) / PROGRESS_STEPS.length) * 100)}%</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={progressIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-center text-sm text-white/50 font-medium"
                  >
                    {PROGRESS_STEPS[progressIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="text-[10px] text-white/15 text-center">Loopy is crafting your edit — this takes 15-45 seconds</p>
            </motion.div>
          )}

          {/* ═══ STEP 4: REVIEW ═══ */}
          {step === "review" && generatedTimeline && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-6">

              <div className="text-center mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, delay: 0.2 }}>
                  <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "linear-gradient(135deg, #4ADE8033, #9999FF22)" }}>
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                </motion.div>
                <h2 className="text-xl font-black text-white/90" style={{ fontFamily: "'Teko', sans-serif", fontSize: "28px" }}>
                  YOUR EDIT IS READY
                </h2>
                <p className="text-xs text-white/30 mt-1">
                  {generatedTimeline.timeline.total_duration.toFixed(1)}s edit • {generatedTimeline.timeline.cuts.length} cuts • {generatedTimeline.timeline.text_overlays.length} text overlays
                </p>
              </div>

              {/* Creative Direction */}
              <div className="p-4 rounded-xl bg-[#9999FF]/[0.06] border border-[#9999FF]/20">
                <p className="text-[10px] text-[#9999FF]/60 uppercase tracking-wider font-bold mb-1.5">Creative Direction</p>
                <p className="text-xs text-white/60 leading-relaxed">{generatedTimeline.timeline.creative_direction}</p>
              </div>

              {/* Timeline preview */}
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Scissors className="w-3 h-3" /> Cut Sequence
                </p>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {generatedTimeline.timeline.cuts.map((cut, i) => {
                    const clip = clips[cut.clip_index];
                    const duration = cut.end_time - cut.start_time;
                    return (
                      <div key={i} className="shrink-0 w-28 rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.03]">
                        <div className="h-16 bg-white/[0.04] flex items-center justify-center relative">
                          {clip?.thumbnail ? (
                            <img src={clip.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                          ) : (
                            <Film className="w-4 h-4 text-white/10" />
                          )}
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 rounded text-[8px] font-mono text-white/50">
                            {duration.toFixed(1)}s
                          </div>
                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/70 rounded text-[7px] font-bold text-[#9999FF]/70 uppercase">
                            {cut.transition_in}
                          </div>
                        </div>
                        <div className="p-1.5">
                          <p className="text-[8px] text-white/40 truncate">{clip?.name || `Clip ${cut.clip_index + 1}`}</p>
                          {cut.speed !== 1 && (
                            <p className="text-[7px] text-amber-400/50">{cut.speed}x speed</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color grade */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <Palette className="w-4 h-4 text-[#FFB800]/50 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-white/60">{generatedTimeline.timeline.color_grade.name}</p>
                  <p className="text-[9px] text-white/25">
                    Filter: {generatedTimeline.timeline.color_grade.filter} •
                    Temp: {generatedTimeline.timeline.color_grade.temperature > 0 ? "+" : ""}{generatedTimeline.timeline.color_grade.temperature} •
                    Contrast: {generatedTimeline.timeline.color_grade.contrast > 0 ? "+" : ""}{generatedTimeline.timeline.color_grade.contrast}
                  </p>
                </div>
              </div>

              {/* Text overlays */}
              {generatedTimeline.timeline.text_overlays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Type className="w-3 h-3" /> Text Overlays
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedTimeline.timeline.text_overlays.map((t, i) => (
                      <div key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <p className="text-[11px] font-bold text-white/60">"{t.text}"</p>
                        <p className="text-[8px] text-white/20">@ {t.start_time.toFixed(1)}s • {t.style} • {t.position}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Music sync */}
              {generatedTimeline.timeline.music_sync_notes && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <Music className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-white/30 leading-relaxed">{generatedTimeline.timeline.music_sync_notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={handleRegenerate}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-white/40 border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
                <button onClick={() => onTimelineReady(generatedTimeline, clips)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #4ADE80, #22C55E)", boxShadow: "0 4px 20px rgba(74,222,128,0.25)" }}>
                  <Play className="w-4 h-4" /> Open in Studio
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
