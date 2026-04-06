/**
 * EditAnalyzerAdmin — Frame-by-frame video edit analyzer (Admin/Judge tool only)
 * Upload a video → extracts frames → AI analyzes → returns S-F grade with detailed breakdown
 */
import { useState, useRef, useCallback } from "react";
import { Upload, Play, Loader2, Film, AlertTriangle, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FrameData {
  dataUrl: string;
  timestamp: string;
}

interface FrameAnalysis {
  frame_index: number;
  timestamp_label: string;
  observations: string;
  score_impact: string;
}

interface EditAnalysis {
  emotion: number;
  creativity: number;
  sync: number;
  identity: number;
  execution: number;
  total: number;
  grade: string;
  frame_analysis: FrameAnalysis[];
  strengths: string[];
  weaknesses: string[];
  technical_verdict: string;
  creative_verdict: string;
  sync_verdict: string;
  recommended_grade: string;
  grade_justification: string;
  improvement_notes: string;
  judge_summary: string;
}

const GRADE_COLORS: Record<string, string> = {
  "S++": "#FFD700",
  "S+": "#FFD700",
  "S": "#22c55e",
  "A": "#3b82f6",
  "B": "#8b5cf6",
  "C": "#f59e0b",
  "D": "#ef4444",
  "F": "#dc2626",
};

const PILLARS = [
  { key: "emotion", label: "Emotion", max: 15 },
  { key: "creativity", label: "Creativity", max: 25 },
  { key: "sync", label: "Sync", max: 25 },
  { key: "identity", label: "Identity", max: 10 },
  { key: "execution", label: "Execution", max: 25 },
];

export default function EditAnalyzerAdmin() {
  const [collapsed, setCollapsed] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<EditAnalysis | null>(null);
  const [editorNotes, setEditorNotes] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [frameCount, setFrameCount] = useState(8);
  const [showFrameDetails, setShowFrameDetails] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large — max 100MB");
      return;
    }
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setFrames([]);
    setAnalysis(null);
  }, []);

  const extractFrames = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) return;
    setExtracting(true);
    setFrames([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video"));
        if (video.readyState >= 1) resolve();
      });

      const duration = video.duration;
      if (!duration || duration <= 0) {
        toast.error("Could not determine video duration");
        setExtracting(false);
        return;
      }

      // Set canvas to video dimensions (capped for performance)
      const maxDim = 720;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const extractedFrames: FrameData[] = [];
      const interval = duration / (frameCount + 1);

      for (let i = 1; i <= frameCount; i++) {
        const time = interval * i;
        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            extractedFrames.push({
              dataUrl,
              timestamp: `${mins}:${secs.toString().padStart(2, "0")}`,
            });
            resolve();
          };
          video.currentTime = time;
        });
      }

      setFrames(extractedFrames);
      toast.success(`Extracted ${extractedFrames.length} frames`);
    } catch (err) {
      console.error("Frame extraction error:", err);
      toast.error("Failed to extract frames");
    } finally {
      setExtracting(false);
    }
  }, [videoUrl, frameCount]);

  const analyzeEdit = useCallback(async () => {
    if (frames.length === 0) {
      toast.error("Extract frames first");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-edit", {
        body: {
          frames: frames.map((f) => ({ dataUrl: f.dataUrl, timestamp: f.timestamp })),
          editorNotes: editorNotes || undefined,
          videoTitle: videoTitle || videoFile?.name || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
      toast.success(`Analysis complete — Grade: ${data.grade}`);
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [frames, editorNotes, videoTitle, videoFile]);

  const gradeColor = analysis ? GRADE_COLORS[analysis.grade] || "#888" : "#888";

  return (
    <section className="rounded-xl border border-border/60 bg-surface-1 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-foreground">Edit Analyzer</h3>
            <p className="text-[10px] text-muted-foreground">Frame-by-frame AI analysis • S-F grading</p>
          </div>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Upload Section */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {videoFile ? videoFile.name : "Upload Video Edit"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    MP4, MOV, WebM • Max 100MB
                  </span>
                </button>

                {videoUrl && (
                  <div className="space-y-3">
                    {/* Hidden video element for frame extraction */}
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full rounded-lg max-h-48 object-contain bg-black/50"
                      crossOrigin="anonymous"
                      preload="auto"
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Frames to Extract
                        </label>
                        <select
                          value={frameCount}
                          onChange={(e) => setFrameCount(Number(e.target.value))}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
                        >
                          <option value={4}>4 frames</option>
                          <option value={6}>6 frames</option>
                          <option value={8}>8 frames (recommended)</option>
                          <option value={12}>12 frames</option>
                          <option value={16}>16 frames (detailed)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Video Title (optional)
                        </label>
                        <input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="e.g. Jujutsu Flow Edit"
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Judge Notes (optional)
                      </label>
                      <textarea
                        value={editorNotes}
                        onChange={(e) => setEditorNotes(e.target.value)}
                        placeholder="Any context for the analysis — e.g. 'Check sync quality' or 'Focus on color grading'"
                        rows={2}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
                      />
                    </div>

                    {/* Extract Frames Button */}
                    <button
                      onClick={extractFrames}
                      disabled={extracting}
                      className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Extracting Frames...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Extract {frameCount} Frames
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Extracted Frames Preview */}
              {frames.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Extracted Frames ({frames.length})
                    </span>
                    <button
                      onClick={() => setShowFrameDetails(!showFrameDetails)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      {showFrameDetails ? "Hide" : "Show"} Full
                    </button>
                  </div>

                  <div className={`grid gap-1.5 ${showFrameDetails ? "grid-cols-2" : "grid-cols-4"}`}>
                    {frames.map((frame, i) => (
                      <div key={i} className="relative group rounded overflow-hidden border border-border/40">
                        <img
                          src={frame.dataUrl}
                          alt={`Frame ${i + 1}`}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5">
                          <span className="text-[9px] font-mono text-white">
                            F{i + 1} • {frame.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={analyzeEdit}
                    disabled={analyzing}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing Edit Frame-by-Frame...
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4" />
                        Analyze Edit
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Analysis Results */}
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-t border-border/40 pt-4"
                >
                  {/* Grade Badge */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center border-2"
                      style={{ borderColor: gradeColor, backgroundColor: `${gradeColor}15` }}
                    >
                      <span
                        className="text-3xl font-black"
                        style={{ color: gradeColor }}
                      >
                        {analysis.grade}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-black text-foreground">
                        {analysis.total}<span className="text-sm text-muted-foreground font-normal">/100</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{analysis.judge_summary}</p>
                    </div>
                  </div>

                  {/* Pillar Scores */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">QOI Breakdown</span>
                    {PILLARS.map((p) => {
                      const score = analysis[p.key as keyof EditAnalysis] as number;
                      const pct = (score / p.max) * 100;
                      return (
                        <div key={p.key} className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground w-16 shrink-0">{p.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: pct >= 80 ? "#22c55e" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-foreground w-10 text-right">
                            {score}/{p.max}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Verdicts */}
                  <div className="space-y-3">
                    {[
                      { label: "Technical", text: analysis.technical_verdict },
                      { label: "Creative", text: analysis.creative_verdict },
                      { label: "Sync / Flow", text: analysis.sync_verdict },
                    ].map((v) => (
                      <div key={v.label} className="p-3 rounded-lg bg-background border border-border/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{v.label}</span>
                        <p className="text-xs text-foreground mt-1 leading-relaxed">{v.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Strengths</span>
                      <ul className="mt-1.5 space-y-1">
                        {analysis.strengths?.map((s, i) => (
                          <li key={i} className="text-[11px] text-foreground leading-snug">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Weaknesses</span>
                      <ul className="mt-1.5 space-y-1">
                        {analysis.weaknesses?.map((w, i) => (
                          <li key={i} className="text-[11px] text-foreground leading-snug">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Frame-by-Frame Analysis */}
                  {analysis.frame_analysis && analysis.frame_analysis.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Frame-by-Frame Analysis</span>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {analysis.frame_analysis.map((fa, i) => (
                          <div key={i} className="flex gap-2 p-2 rounded-lg bg-background border border-border/30">
                            {frames[fa.frame_index - 1] && (
                              <img
                                src={frames[fa.frame_index - 1].dataUrl}
                                alt={`Frame ${fa.frame_index}`}
                                className="w-20 h-12 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-foreground">
                                  Frame {fa.frame_index} — {fa.timestamp_label}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  fa.score_impact?.toLowerCase().includes("positive")
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : fa.score_impact?.toLowerCase().includes("negative")
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-zinc-500/20 text-zinc-400"
                                }`}>
                                  {fa.score_impact?.toLowerCase().includes("positive") ? "↑" : fa.score_impact?.toLowerCase().includes("negative") ? "↓" : "—"}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-3">
                                {fa.observations}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grade Justification */}
                  <div className="p-3 rounded-lg bg-background border border-border/40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Grade Justification</span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{analysis.grade_justification}</p>
                  </div>

                  {/* Improvement Notes */}
                  {analysis.improvement_notes && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Improvement Notes</span>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{analysis.improvement_notes}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
