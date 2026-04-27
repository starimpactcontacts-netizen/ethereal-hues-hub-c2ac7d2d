/**
 * StudioAIBrain — Advanced AI panel with instant rating, style learning, scene detection
 * Pre-submit QOI check + personalized style DNA
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Sparkles, Eye, Target, TrendingUp, Shield, Star,
  ChevronRight, Loader2, Scan, Dna, Crosshair, Activity, X,
  CheckCircle2, AlertTriangle, Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCENT = "#9999FF";
const RED = "#FF004F";
const GREEN = "#00FF88";
const GOLD = "#FFD700";

type RatingResult = {
  quality_score: number;
  originality_score: number;
  impact_score: number;
  overall_qoi: number;
  tier: string;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  arena_ready: boolean;
  predicted_percentile: number;
  style_tags: string[];
};

type StyleDNA = {
  style_dna: {
    archetype: string;
    signature_moves: string[];
    color_profile: string;
    pacing_style: string;
    energy_level: number;
    uniqueness_score: number;
  };
  recommended_presets: { name: string; description: string; filter: string; effects: string[]; speed: number }[];
  growth_areas: string[];
  similar_creators: string[];
};

type SceneData = {
  scenes: { start: number; end: number; type: string; energy: number; description: string }[];
  key_moments: { time: number; type: string; importance: number; suggested_effect?: string; description: string }[];
  optimal_trim: { start: number; end: number; reason: string };
  energy_map: { time: number; energy: number }[];
  pacing_recommendation: string;
};

type AITab = "rate" | "style" | "scenes";

interface EditSnapshot {
  duration: number;
  originalDuration: number;
  filter: string;
  effects: string[];
  speed: number;
  textCount: number;
  transition: string | null;
  hasAdjustments: boolean;
  cropPreset: string | null;
  keyframeCount: number;
  maskCount: number;
  blendMode: string;
  stickerCount: number;
  hasAudio: boolean;
  motionTemplates: number;
  chromaEnabled: boolean;
  stabilized: boolean;
}

interface StudioAIBrainProps {
  open: boolean;
  onClose: () => void;
  editSnapshot: EditSnapshot;
  onApplyTrim?: (start: number, end: number) => void;
  onAddMarkers?: (markers: { time: number; type: string; label: string }[]) => void;
}

function ScoreRing({ score, label, color, size = 52 }: { score: number; label: string; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <motion.span
        className="absolute text-sm font-black"
        style={{ color, lineHeight: `${size}px`, width: size, textAlign: "center" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        {score}
      </motion.span>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    ELITE: "#FFD700", PRO: "#9999FF", RISING: "#00FF88", DEVELOPING: "#FF8800", ROOKIE: "#FF004F",
  };
  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.8 }}
      className="px-3 py-1 rounded-lg font-black text-xs tracking-[0.2em] uppercase"
      style={{
        background: `${colors[tier] || "#666"}15`,
        border: `1px solid ${colors[tier] || "#666"}30`,
        color: colors[tier] || "#666",
        boxShadow: `0 0 20px ${colors[tier] || "#666"}15`,
      }}
    >
      {tier}
    </motion.div>
  );
}

export default function StudioAIBrain({ open, onClose, editSnapshot, onApplyTrim, onAddMarkers }: StudioAIBrainProps) {
  const [tab, setTab] = useState<AITab>("rate");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<RatingResult | null>(null);
  const [styleDNA, setStyleDNA] = useState<StyleDNA | null>(null);
  const [scenes, setScenes] = useState<SceneData | null>(null);
  const [scanPhase, setScanPhase] = useState(0);

  const SCAN_PHASES = ["Analyzing composition...", "Evaluating color science...", "Measuring pacing...", "Judging creativity...", "Computing QOI..."];

  const runRating = async () => {
    setLoading(true);
    setRating(null);
    setScanPhase(0);

    const phaseInterval = setInterval(() => {
      setScanPhase(p => Math.min(p + 1, SCAN_PHASES.length - 1));
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke("studio-ai-brain", {
        body: { type: "rate-edit", editData: editSnapshot },
      });
      if (error) throw error;
      setRating(data as RatingResult);
    } catch (e: any) {
      toast.error(e?.message || "Rating failed");
    } finally {
      clearInterval(phaseInterval);
      setLoading(false);
    }
  };

  const runStyleAnalysis = async () => {
    setLoading(true);
    setStyleDNA(null);
    try {
      // Gather style history from current edit as seed
      const history = {
        filters_used: [editSnapshot.filter],
        effects_used: editSnapshot.effects,
        avg_speed: editSnapshot.speed,
        avg_duration: editSnapshot.duration,
        text_usage: editSnapshot.textCount > 2 ? "heavy" : editSnapshot.textCount > 0 ? "moderate" : "minimal",
        color_temperature: editSnapshot.hasAdjustments ? "custom" : "neutral",
        sessions: 1,
      };
      const { data, error } = await supabase.functions.invoke("studio-ai-brain", {
        body: { type: "learn-style", styleHistory: history },
      });
      if (error) throw error;
      setStyleDNA(data as StyleDNA);
    } catch (e: any) {
      toast.error(e?.message || "Style analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const runSceneDetection = async () => {
    setLoading(true);
    setScenes(null);
    try {
      const { data, error } = await supabase.functions.invoke("studio-ai-brain", {
        body: {
          type: "detect-scenes",
          clipInfo: {
            duration: editSnapshot.originalDuration,
            contentType: "short-form",
            hasAudio: editSnapshot.hasAudio,
          },
        },
      });
      if (error) throw error;
      setScenes(data as SceneData);
    } catch (e: any) {
      toast.error(e?.message || "Scene detection failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const tabs: { id: AITab; icon: typeof Brain; label: string }[] = [
    { id: "rate", icon: Target, label: "Rate" },
    { id: "style", icon: Dna, label: "Style DNA" },
    { id: "scenes", icon: Scan, label: "Scenes" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: "linear-gradient(180deg, #09090c 0%, #0a0a12 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: RED }} />
            <span className="text-sm font-black tracking-wider uppercase" style={{ color: "#fff" }}>Loopy Brain</span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${RED}15`, color: RED, border: `1px solid ${RED}25` }}>v2.0</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl active:scale-90" style={{ background: "rgba(255,255,255,0.04)" }}>
            <X className="w-4 h-4" style={{ color: "#666" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
              style={{
                background: tab === t.id ? `${ACCENT}12` : "rgba(255,255,255,0.02)",
                border: `1px solid ${tab === t.id ? `${ACCENT}25` : "rgba(255,255,255,0.04)"}`,
                color: tab === t.id ? ACCENT : "#555",
              }}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-6" style={{ scrollbarWidth: "none" }}>
          {/* ═══ RATE TAB ═══ */}
          {tab === "rate" && (
            <div className="space-y-4 pt-2">
              {!rating && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="text-center py-6 space-y-3">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                      <Crosshair className="w-12 h-12 mx-auto" style={{ color: RED }} />
                    </motion.div>
                    <h3 className="text-lg font-black uppercase tracking-wider" style={{ color: "#fff" }}>Pre-Submit Check</h3>
                    <p className="text-xs" style={{ color: "#666" }}>
                      Get an instant QOI diagnostic before submitting to the Arena.
                      Our AI judges your edit like a real Loopgate judge would.
                    </p>
                  </div>

                  <div className="rounded-2xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Current Edit Summary</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Duration", value: `${editSnapshot.duration.toFixed(1)}s` },
                        { label: "Filter", value: editSnapshot.filter || "None" },
                        { label: "Effects", value: `${editSnapshot.effects.length}` },
                        { label: "Speed", value: `${editSnapshot.speed}x` },
                        { label: "Texts", value: `${editSnapshot.textCount}` },
                        { label: "Layers", value: `${editSnapshot.maskCount + editSnapshot.stickerCount}` },
                      ].map(s => (
                        <div key={s.label} className="text-center py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <div className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>{s.label}</div>
                          <div className="text-xs font-bold" style={{ color: "#aaa" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={runRating}
                    className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${RED}, #CC0040)`,
                      boxShadow: `0 4px 20px ${RED}30`,
                      color: "#fff",
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Crosshair className="w-4 h-4" /> Run QOI Diagnostic
                    </span>
                  </button>
                </motion.div>
              )}

              {loading && tab === "rate" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Scan className="w-10 h-10 mx-auto" style={{ color: RED }} />
                  </motion.div>
                  <motion.p
                    key={scanPhase}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: ACCENT }}
                  >
                    {SCAN_PHASES[scanPhase]}
                  </motion.p>
                  <div className="w-48 mx-auto h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: RED }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${((scanPhase + 1) / SCAN_PHASES.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              )}

              {rating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* QOI Score Display */}
                  <div className="rounded-2xl p-4 text-center space-y-3" style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div className="flex items-center justify-center gap-2">
                      <TierBadge tier={rating.tier} />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                      className="text-5xl font-black" style={{ color: "#fff" }}
                    >
                      {rating.overall_qoi}
                    </motion.div>
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#666" }}>Overall QOI</p>
                    <p className="text-xs italic" style={{ color: "#888" }}>{rating.verdict}</p>
                  </div>

                  {/* Pillar Scores */}
                  <div className="flex justify-around py-2">
                    <div className="relative"><ScoreRing score={rating.quality_score} label="Quality" color="#00AAFF" /></div>
                    <div className="relative"><ScoreRing score={rating.originality_score} label="Origin" color={GOLD} /></div>
                    <div className="relative"><ScoreRing score={rating.impact_score} label="Impact" color={RED} /></div>
                  </div>

                  {/* Arena Ready */}
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{
                    background: rating.arena_ready ? `${GREEN}08` : `${RED}08`,
                    border: `1px solid ${rating.arena_ready ? `${GREEN}20` : `${RED}20`}`,
                  }}>
                    {rating.arena_ready
                      ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: GREEN }} />
                      : <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: RED }} />
                    }
                    <div>
                      <div className="text-xs font-bold" style={{ color: rating.arena_ready ? GREEN : RED }}>
                        {rating.arena_ready ? "Arena Ready ✓" : "Needs Work"}
                      </div>
                      <div className="text-[10px]" style={{ color: "#666" }}>
                        Predicted top {100 - rating.predicted_percentile}% of submissions
                      </div>
                    </div>
                  </div>

                  {/* Style Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {rating.style_tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}15` }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Strengths */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: GREEN }}>
                      <Star className="w-3 h-3" /> Strengths
                    </span>
                    {rating.strengths.map((s, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: "#aaa" }}>
                        <span style={{ color: GREEN }}>+</span> {s}
                      </div>
                    ))}
                  </div>

                  {/* Weaknesses */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: RED }}>
                      <AlertTriangle className="w-3 h-3" /> Improve
                    </span>
                    {rating.weaknesses.map((w, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: "#aaa" }}>
                        <span style={{ color: RED }}>–</span> {w}
                      </div>
                    ))}
                  </div>

                  {/* Tips */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: GOLD }}>
                      <Flame className="w-3 h-3" /> Pro Tips
                    </span>
                    {rating.tips.map((t, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: "#aaa" }}>
                        <span style={{ color: GOLD }}>{i + 1}.</span> {t}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setRating(null)} className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#666", border: "1px solid rgba(255,255,255,0.06)" }}>
                    Re-scan
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* ═══ STYLE DNA TAB ═══ */}
          {tab === "style" && (
            <div className="space-y-4 pt-2">
              {!styleDNA && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="text-center py-6 space-y-3">
                    <Dna className="w-12 h-12 mx-auto" style={{ color: ACCENT }} />
                    <h3 className="text-lg font-black uppercase tracking-wider" style={{ color: "#fff" }}>Style DNA</h3>
                    <p className="text-xs" style={{ color: "#666" }}>
                      AI analyzes your editing patterns to discover your unique style archetype
                      and generate personalized presets just for you.
                    </p>
                  </div>
                  <button onClick={runStyleAnalysis} className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #7777DD)`, boxShadow: `0 4px 20px ${ACCENT}30`, color: "#fff" }}>
                    <span className="flex items-center justify-center gap-2"><Dna className="w-4 h-4" /> Analyze My Style</span>
                  </button>
                </motion.div>
              )}

              {loading && tab === "style" && (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: ACCENT }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#555" }}>Decoding your style DNA...</p>
                </div>
              )}

              {styleDNA && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="rounded-2xl p-4 text-center space-y-2" style={{
                    background: `linear-gradient(135deg, ${ACCENT}08, transparent)`,
                    border: `1px solid ${ACCENT}15`,
                  }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                      className="text-2xl font-black uppercase tracking-wider" style={{ color: "#fff" }}>
                      {styleDNA.style_dna.archetype}
                    </motion.div>
                    <div className="flex justify-center gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-black" style={{ color: ACCENT }}>{styleDNA.style_dna.uniqueness_score}</div>
                        <div className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Unique</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-black" style={{ color: GOLD }}>{styleDNA.style_dna.energy_level}/10</div>
                        <div className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Energy</div>
                      </div>
                    </div>
                    <div className="text-[10px] capitalize" style={{ color: "#888" }}>
                      {styleDNA.style_dna.pacing_style} pacing · {styleDNA.style_dna.color_profile}
                    </div>
                  </div>

                  {/* Signature Moves */}
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Signature Moves</span>
                    {styleDNA.style_dna.signature_moves.map((m, i) => (
                      <div key={i} className="text-[11px] flex items-start gap-2" style={{ color: "#aaa" }}>
                        <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} /> {m}
                      </div>
                    ))}
                  </div>

                  {/* Recommended Presets */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: GOLD }}>AI-Generated Presets For You</span>
                    {styleDNA.recommended_presets.map((p, i) => (
                      <div key={i} className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="text-xs font-bold" style={{ color: "#ddd" }}>{p.name}</div>
                        <div className="text-[10px]" style={{ color: "#666" }}>{p.description}</div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: `${ACCENT}10`, color: ACCENT }}>{p.filter}</span>
                          {p.effects.slice(0, 3).map(e => (
                            <span key={e} className="px-1.5 py-0.5 rounded text-[8px]" style={{ background: "rgba(255,255,255,0.04)", color: "#666" }}>{e}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Similar Creators */}
                  <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Edits Like</span>
                    <div className="text-[11px]" style={{ color: "#aaa" }}>{styleDNA.similar_creators.join(" · ")}</div>
                  </div>

                  <button onClick={() => setStyleDNA(null)} className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#666", border: "1px solid rgba(255,255,255,0.06)" }}>
                    Re-analyze
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* ═══ SCENES TAB ═══ */}
          {tab === "scenes" && (
            <div className="space-y-4 pt-2">
              {!scenes && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="text-center py-6 space-y-3">
                    <Scan className="w-12 h-12 mx-auto" style={{ color: GREEN }} />
                    <h3 className="text-lg font-black uppercase tracking-wider" style={{ color: "#fff" }}>Scene Detection</h3>
                    <p className="text-xs" style={{ color: "#666" }}>
                      AI identifies scene boundaries, action peaks, and the perfect cut points
                      in your clip for maximum engagement.
                    </p>
                  </div>
                  <button onClick={runSceneDetection} className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg, ${GREEN}, #00CC66)`, boxShadow: `0 4px 20px ${GREEN}30`, color: "#000" }}>
                    <span className="flex items-center justify-center gap-2"><Scan className="w-4 h-4" /> Detect Scenes</span>
                  </button>
                </motion.div>
              )}

              {loading && tab === "scenes" && (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: GREEN }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#555" }}>Scanning frames...</p>
                </div>
              )}

              {scenes && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Energy Map */}
                  <div className="rounded-2xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Energy Map</span>
                    <div className="flex items-end gap-[2px] h-12">
                      {scenes.energy_map.map((p, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{ background: p.energy > 70 ? RED : p.energy > 40 ? GOLD : GREEN }}
                          initial={{ height: 0 }}
                          animate={{ height: `${p.energy}%` }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] capitalize" style={{ color: "#666" }}>
                      Pacing: {scenes.pacing_recommendation.replace(/_/g, " ")}
                    </div>
                  </div>

                  {/* Optimal Trim */}
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: `${GREEN}06`, border: `1px solid ${GREEN}15` }}>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Optimal Trim</div>
                      <div className="text-xs" style={{ color: "#aaa" }}>{scenes.optimal_trim.start.toFixed(1)}s → {scenes.optimal_trim.end.toFixed(1)}s</div>
                      <div className="text-[10px]" style={{ color: "#666" }}>{scenes.optimal_trim.reason}</div>
                    </div>
                    {onApplyTrim && (
                      <button
                        onClick={() => {
                          onApplyTrim(scenes.optimal_trim.start, scenes.optimal_trim.end);
                          toast.success("Trim applied!");
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase active:scale-95"
                        style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}25` }}
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  {/* Scenes */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: "#555" }}>Detected Scenes</span>
                    {scenes.scenes.map((s, i) => (
                      <div key={i} className="rounded-xl p-2.5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-8 text-center">
                          <Activity className="w-3.5 h-3.5 mx-auto" style={{ color: s.energy > 7 ? RED : s.energy > 4 ? GOLD : GREEN }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold capitalize" style={{ color: "#ddd" }}>{s.type}</div>
                          <div className="text-[9px] truncate" style={{ color: "#666" }}>{s.description}</div>
                        </div>
                        <div className="text-[9px] font-mono flex-shrink-0" style={{ color: "#555" }}>
                          {s.start.toFixed(1)}–{s.end.toFixed(1)}s
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Key Moments */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Key Moments</span>
                      {onAddMarkers && (
                        <button
                          onClick={() => {
                            onAddMarkers(scenes.key_moments.map(m => ({
                              time: m.time,
                              type: m.type,
                              label: m.description.slice(0, 20),
                            })));
                            toast.success(`${scenes.key_moments.length} markers added to timeline`);
                          }}
                          className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg active:scale-95"
                          style={{ background: `${GOLD}10`, color: GOLD }}
                        >
                          Add All as Markers
                        </button>
                      )}
                    </div>
                    {scenes.key_moments.map((m, i) => (
                      <div key={i} className="rounded-xl p-2.5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="w-8 text-center text-[10px] font-mono font-bold" style={{ color: GOLD }}>{m.time.toFixed(1)}s</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold capitalize" style={{ color: "#ddd" }}>{m.type.replace(/_/g, " ")}</div>
                          <div className="text-[9px] truncate" style={{ color: "#666" }}>{m.description}</div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: m.importance }).map((_, j) => (
                            <div key={j} className="w-1 h-1 rounded-full" style={{ background: m.importance > 7 ? RED : GOLD }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setScenes(null)} className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#666", border: "1px solid rgba(255,255,255,0.06)" }}>
                    Re-detect
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
