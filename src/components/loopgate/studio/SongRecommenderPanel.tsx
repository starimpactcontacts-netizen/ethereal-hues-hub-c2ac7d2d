import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Sparkles, Play, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  analyzeVideoForMusic,
  getRecommendations,
  QUICK_PRESETS,
  type SongRecommendation,
  type VideoAnalysis,
  type SongGenre,
} from "@/lib/studioSongRecommender";

type SongRecommenderPanelProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  sceneChanges: { time: number }[];
  onClose: () => void;
};

export default function SongRecommenderPanel({
  videoRef,
  sceneChanges,
  onClose,
}: SongRecommenderPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<SongRecommendation[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!videoRef.current) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeVideoForMusic(videoRef.current, sceneChanges);
      setAnalysis(result);
      const recs = getRecommendations(result);
      setRecommendations(recs);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = QUICK_PRESETS.find(p => p.id === presetId);
    if (!preset || !analysis) return;
    
    setSelectedPreset(presetId);
    const recs = getRecommendations(
      { ...analysis, estimatedMood: preset.mood },
      preset.genres as SongGenre[]
    );
    setRecommendations(recs);
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      hype: "🔥", chill: "☁️", dark: "🖤", emotional: "💔",
      epic: "⚡", funny: "😂", retro: "📼"
    };
    return emojis[mood] || "🎵";
  };

  const getPacingLabel = (pacing: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      slow: { label: "Slow", color: "text-blue-400" },
      medium: { label: "Medium", color: "text-yellow-400" },
      fast: { label: "Fast", color: "text-orange-400" },
      extreme: { label: "Extreme", color: "text-red-400" },
    };
    return labels[pacing] || { label: pacing, color: "text-foreground" };
  };

  useEffect(() => {
    if (videoRef.current && sceneChanges.length > 0) {
      handleAnalyze();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 z-50 w-80 rounded-xl border border-border/60 bg-card/95 p-4 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Music className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Song Match</h3>
            <p className="text-[10px] text-muted-foreground">Find the perfect track</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          ×
        </Button>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-2" />
          <p className="text-xs text-muted-foreground">Analyzing your edit...</p>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <>
          {/* Analysis Results */}
          <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Video Analysis
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Mood:</span>
                <span className="text-foreground">
                  {getMoodEmoji(analysis.estimatedMood)} {analysis.estimatedMood}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Pacing:</span>
                <span className={getPacingLabel(analysis.estimatedPacing).color}>
                  {getPacingLabel(analysis.estimatedPacing).label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Cuts/min:</span>
                <span className="text-foreground font-mono">
                  {Math.round(analysis.averageCutRate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Tone:</span>
                <span className="text-foreground capitalize">{analysis.colorTemperature}</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Quick Presets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`px-2 py-1 text-[10px] rounded-full border transition-all ${
                    selectedPreset === preset.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/30 text-foreground border-border/40 hover:border-border/60"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Recommended Tracks
            </div>
            {recommendations.map((song, idx) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-2.5 rounded-lg border border-border/30 bg-secondary/20 hover:bg-accent/20 hover:border-border/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">
                        {song.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 uppercase">
                        {Math.round(song.matchScore)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground uppercase">
                    {song.genre}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {song.bpm} BPM
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground">
              Songs are suggestions only. Search your preferred platform.
            </p>
          </div>
        </>
      )}

      {!analysis && !isAnalyzing && (
        <Button
          onClick={handleAnalyze}
          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="h-4 w-4" />
          Analyze My Edit
        </Button>
      )}
    </motion.div>
  );
}
