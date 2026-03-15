import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Play, Zap, Loader2, Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  analyzeVideo,
  type ClipHighlight,
  type AnalysisResult,
} from "@/lib/studioAutoClipper";

type AutoClipperPanelProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  file: File | null;
  duration: number;
  onSelectClip: (start: number, end: number) => void;
  onClose: () => void;
};

export default function AutoClipperPanel({
  videoRef,
  file,
  duration,
  onSelectClip,
  onClose,
}: AutoClipperPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleAnalyze = async () => {
    if (!videoRef.current || !file) return;

    setIsAnalyzing(true);
    setProgress({ stage: "Initializing", percent: 0 });

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const analysisResult = await analyzeVideo(
        videoRef.current,
        audioContextRef.current,
        file,
        sensitivity,
        (stage, percent) => setProgress({ stage, percent })
      );

      setResult(analysisResult);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const handleApplyClip = (clip: ClipHighlight) => {
    onSelectClip(clip.startTime, clip.endTime);
    setSelectedClip(clip.id);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTypeColor = (type: ClipHighlight["type"]) => {
    switch (type) {
      case "beat": return "hsl(280 70% 50%)";
      case "scene": return "hsl(200 70% 50%)";
      case "motion": return "hsl(30 70% 50%)";
      case "combined": return "hsl(45 90% 50%)";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 z-50 w-80 rounded-xl border border-border/60 bg-card/95 p-4 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50 border border-border/40">
            <Scissors className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Auto-Clipper</h3>
            <p className="text-[10px] text-muted-foreground">Detect highlights automatically</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          ×
        </Button>
      </div>

      {!result && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Sensitivity</span>
              <span className="text-xs font-mono text-foreground">{sensitivity.toFixed(1)}x</span>
            </div>
            <Slider
              value={[sensitivity]}
              onValueChange={([v]) => setSensitivity(v)}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !file}
            className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress?.stage} ({progress?.percent}%)
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Analyze Video
              </>
            )}
          </Button>
        </>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Found {result.highlights.length} highlights</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResult(null)}
              className="h-5 text-[10px] px-2"
            >
              Re-analyze
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {result.highlights.map((clip, idx) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedClip === clip.id
                    ? "border-foreground/40 bg-accent/30"
                    : "border-border/40 bg-secondary/30 hover:border-border/60 hover:bg-accent/20"
                }`}
                onClick={() => handleApplyClip(clip)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getTypeColor(clip.type) }}
                    />
                    <span className="text-xs font-medium text-foreground">{clip.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(clip.score)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded uppercase font-medium"
                    style={{
                      backgroundColor: `${getTypeColor(clip.type)}20`,
                      color: getTypeColor(clip.type),
                    }}
                  >
                    {clip.type}
                  </span>
                </div>

                {/* Timeline preview bar */}
                <div className="mt-2 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: getTypeColor(clip.type),
                      width: `${((clip.endTime - clip.startTime) / duration) * 100}%`,
                      marginLeft: `${(clip.startTime / duration) * 100}%`,
                    }}
                  />
                </div>

                <AnimatePresence>
                  {selectedClip === clip.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-2 top-2"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {result.highlights.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Beat
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Scene
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Motion
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Combined
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
