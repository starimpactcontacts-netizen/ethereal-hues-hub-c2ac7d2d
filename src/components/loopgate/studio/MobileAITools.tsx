/**
 * Mobile Smart Tools Panel — Auto Captions, Smart Cuts, Effects Advisor, BG Removal
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Subtitles, Scissors, Sparkles, Eraser,
  Loader2, Check, X, ChevronRight, Zap, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCENT = "#9999FF";
const ACCENT_DIM = "rgba(153,153,255,0.10)";
const ACCENT_BORDER = "rgba(153,153,255,0.22)";
const RED = "#FF004F";

type CaptionSegment = {
  text: string;
  startTime: number;
  endTime: number;
  style: string;
  position: string;
  emphasis?: boolean;
};

type SmartCut = {
  time: number;
  type: string;
  reason: string;
  effect?: string;
};

type EffectSuggestion = {
  filter: string;
  effects: string[];
  transition?: string;
  speed?: number;
  vibe: string;
  tips: string[];
};

type AITool = "captions" | "smart-cuts" | "effects-ai" | "bg-remove";

interface MobileAIToolsProps {
  duration: number;
  onCaptionsGenerated: (captions: CaptionSegment[]) => void;
  onSmartCutsGenerated: (cuts: SmartCut[]) => void;
  onEffectsSuggested: (suggestion: EffectSuggestion) => void;
  onBgRemoveStart: () => void;
  onClose: () => void;
}

const AI_TOOLS: { id: AITool; icon: typeof Wand2; label: string; desc: string; color: string }[] = [
  { id: "captions", icon: Subtitles, label: "Auto Captions", desc: "AI generates timed text overlays", color: "#00D4FF" },
  { id: "smart-cuts", icon: Scissors, label: "Smart Cuts", desc: "AI suggests viral cut points", color: "#FF6B00" },
  { id: "effects-ai", icon: Sparkles, label: "Effect Advisor", desc: "AI picks the perfect combo", color: "#AA44FF" },
  { id: "bg-remove", icon: Eraser, label: "BG Remove", desc: "Chroma-key background removal", color: "#22CC88" },
];

const CAPTION_STYLES = [
  { id: "modern", label: "Modern", desc: "Clean, punchy captions" },
  { id: "dramatic", label: "Dramatic", desc: "Bold, cinematic text" },
  { id: "minimal", label: "Minimal", desc: "Subtle, elegant" },
  { id: "hype", label: "Hype", desc: "Energetic, viral-ready" },
];

export default function MobileAITools({
  duration,
  onCaptionsGenerated,
  onSmartCutsGenerated,
  onEffectsSuggested,
  onBgRemoveStart,
  onClose,
}: MobileAIToolsProps) {
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [loading, setLoading] = useState(false);
  const [captionStyle, setCaptionStyle] = useState("modern");
  const [captionPrompt, setCaptionPrompt] = useState("");
  const [effectsPrompt, setEffectsPrompt] = useState("");
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionSegment[] | null>(null);
  const [generatedCuts, setGeneratedCuts] = useState<SmartCut[] | null>(null);
  const [generatedEffects, setGeneratedEffects] = useState<EffectSuggestion | null>(null);

  // Chroma key state
  const [chromaColor, setChromaColor] = useState("#00FF00");
  const [chromaThreshold, setChromaThreshold] = useState(80);

  const callAI = async (type: string, extraParams: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("studio-ai-captions", {
        body: { type, duration, ...extraParams },
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      const msg = e?.message || "AI request failed";
      if (msg.includes("429") || msg.includes("Rate limit")) {
        toast.error("Rate limited — try again in a moment");
      } else if (msg.includes("402") || msg.includes("Credits")) {
        toast.error("Credits needed — top up in Settings → Workspace → Usage");
      } else {
        toast.error(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaptions = async () => {
    const data = await callAI("generate-captions", {
      transcript: captionPrompt || undefined,
      style: captionStyle,
    });
    if (data?.captions) {
      setGeneratedCaptions(data.captions);
      toast.success(`${data.captions.length} captions generated!`);
    }
  };

  const handleSmartCuts = async () => {
    const data = await callAI("smart-cuts");
    if (data?.cuts) {
      setGeneratedCuts(data.cuts);
      toast.success(`${data.cuts.length} smart cuts suggested! Pacing: ${data.pacing}`);
    }
  };

  const handleEffectsAdvisor = async () => {
    const data = await callAI("suggest-effects", {
      transcript: effectsPrompt || undefined,
    });
    if (data) {
      setGeneratedEffects(data);
      toast.success("Effect combo ready!");
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#0a0a0a" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 safe-top" style={{ borderBottom: "1px solid #1a1a1a" }}>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <X className="w-4 h-4" style={{ color: "#888" }} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Wand2 className="w-4 h-4" style={{ color: RED }} />
          <span className="text-sm font-bold text-white">Loopy AI Studio</span>
        </div>
        <div className="px-2 py-0.5 rounded-full text-[8px] font-bold" style={{ background: "rgba(255,0,79,0.1)", color: RED, border: "1px solid rgba(255,0,79,0.2)" }}>
          POWERED BY AI
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: "none" }}>
        {!activeTool ? (
          /* Tool Selection Grid */
          <div className="space-y-3">
            <p className="text-xs text-center" style={{ color: "#666" }}>Choose a smart tool</p>
            <div className="grid grid-cols-2 gap-2.5">
              {AI_TOOLS.map((tool) => (
                <motion.button
                  key={tool.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTool(tool.id)}
                  className="p-4 rounded-2xl flex flex-col items-start gap-3 text-left transition-all"
                  style={{ background: "#111", border: "1px solid #1a1a1a" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tool.color}15`, border: `1px solid ${tool.color}30` }}>
                    <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{tool.label}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: "#555" }}>{tool.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : activeTool === "captions" ? (
          /* Auto Captions */
          <div className="space-y-4">
            <button onClick={() => { setActiveTool(null); setGeneratedCaptions(null); }} className="flex items-center gap-1 text-xs" style={{ color: "#666" }}>
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <Subtitles className="w-5 h-5" style={{ color: "#00D4FF" }} />
              <h3 className="text-sm font-bold text-white">Auto Captions</h3>
            </div>

            {/* Caption style */}
            <div>
              <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>Style</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CAPTION_STYLES.map((s) => (
                  <button key={s.id} onClick={() => setCaptionStyle(s.id)}
                    className="px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: captionStyle === s.id ? ACCENT_DIM : "#111",
                      border: captionStyle === s.id ? `1px solid ${ACCENT_BORDER}` : "1px solid #1a1a1a",
                    }}>
                    <span className="text-[10px] font-bold block" style={{ color: captionStyle === s.id ? ACCENT : "#ccc" }}>{s.label}</span>
                    <span className="text-[8px]" style={{ color: "#555" }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional transcript */}
            <div>
              <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: "#555" }}>Context (optional)</p>
              <textarea
                value={captionPrompt}
                onChange={(e) => setCaptionPrompt(e.target.value)}
                placeholder="Describe what's happening in the video, or paste a transcript..."
                className="w-full rounded-xl px-3 py-2.5 text-xs resize-none outline-none"
                style={{ background: "#111", border: "1px solid #1a1a1a", color: "#ccc", minHeight: 60 }}
                rows={3}
              />
            </div>

            {/* Generate */}
            <button onClick={handleGenerateCaptions} disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "#00D4FF", color: "#000" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Subtitles className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Captions"}
            </button>

            {/* Results */}
            {generatedCaptions && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold" style={{ color: "#22cc88" }}>
                    <Check className="w-3 h-3 inline mr-1" />{generatedCaptions.length} captions ready
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {generatedCaptions.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                      <span className="text-[8px] font-mono mt-0.5" style={{ color: ACCENT }}>{cap.startTime.toFixed(1)}s</span>
                      <span className="text-[10px] flex-1" style={{ color: cap.emphasis ? "#fff" : "#aaa", fontWeight: cap.emphasis ? 700 : 400 }}>{cap.text}</span>
                      <span className="text-[7px] px-1 rounded" style={{ background: ACCENT_DIM, color: ACCENT }}>{cap.style}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { onCaptionsGenerated(generatedCaptions); onClose(); }}
                  className="w-full h-10 rounded-xl text-xs font-bold"
                  style={{ background: ACCENT, color: "#000" }}>
                  Apply All Captions
                </button>
              </div>
            )}
          </div>
        ) : activeTool === "smart-cuts" ? (
          /* Smart Cuts */
          <div className="space-y-4">
            <button onClick={() => { setActiveTool(null); setGeneratedCuts(null); }} className="flex items-center gap-1 text-xs" style={{ color: "#666" }}>← Back</button>
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5" style={{ color: "#FF6B00" }} />
              <h3 className="text-sm font-bold text-white">Smart Cuts</h3>
            </div>
            <p className="text-[10px]" style={{ color: "#666" }}>AI analyzes your {duration.toFixed(1)}s clip and suggests optimal cut points for viral pacing.</p>

            <button onClick={handleSmartCuts} disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "#FF6B00", color: "#000" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? "Analyzing..." : "Find Smart Cuts"}
            </button>

            {generatedCuts && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold" style={{ color: "#22cc88" }}>
                  <Check className="w-3 h-3 inline mr-1" />{generatedCuts.length} cuts found
                </span>
                <div className="space-y-1.5">
                  {generatedCuts.map((cut, i) => (
                    <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold" style={{ color: "#FF6B00" }}>{cut.time.toFixed(1)}s</span>
                          <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)" }}>
                            {cut.type}
                          </span>
                        </div>
                        {cut.effect && cut.effect !== "none" && (
                          <span className="text-[7px] px-1.5 py-0.5 rounded" style={{ background: ACCENT_DIM, color: ACCENT }}>{cut.effect}</span>
                        )}
                      </div>
                      <p className="text-[9px]" style={{ color: "#666" }}>{cut.reason}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { onSmartCutsGenerated(generatedCuts); onClose(); }}
                  className="w-full h-10 rounded-xl text-xs font-bold"
                  style={{ background: "#FF6B00", color: "#000" }}>
                  Apply Smart Cuts
                </button>
              </div>
            )}
          </div>
        ) : activeTool === "effects-ai" ? (
          /* Effects Advisor */
          <div className="space-y-4">
            <button onClick={() => { setActiveTool(null); setGeneratedEffects(null); }} className="flex items-center gap-1 text-xs" style={{ color: "#666" }}>← Back</button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#AA44FF" }} />
              <h3 className="text-sm font-bold text-white">Effect Advisor</h3>
            </div>

            <textarea
              value={effectsPrompt}
              onChange={(e) => setEffectsPrompt(e.target.value)}
              placeholder="Describe your video vibe... e.g. 'dark phonk edit with bass drops' or 'chill aesthetic lofi'"
              className="w-full rounded-xl px-3 py-2.5 text-xs resize-none outline-none"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#ccc", minHeight: 60 }}
              rows={3}
            />

            <button onClick={handleEffectsAdvisor} disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "#AA44FF", color: "#fff" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Thinking..." : "Get AI Suggestions"}
            </button>

            {generatedEffects && (
              <div className="space-y-3">
                {/* Vibe */}
                <div className="rounded-xl p-3" style={{ background: "rgba(170,68,255,0.06)", border: "1px solid rgba(170,68,255,0.15)" }}>
                  <p className="text-xs font-bold" style={{ color: "#AA44FF" }}>✨ {generatedEffects.vibe}</p>
                </div>

                {/* Recommendations */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-2.5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                    <span className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Filter</span>
                    <p className="text-[11px] font-bold text-white mt-1">{generatedEffects.filter}</p>
                  </div>
                  {generatedEffects.speed && (
                    <div className="rounded-xl p-2.5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                      <span className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Speed</span>
                      <p className="text-[11px] font-bold text-white mt-1">{generatedEffects.speed}x</p>
                    </div>
                  )}
                </div>

                {generatedEffects.effects.length > 0 && (
                  <div>
                    <span className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Effects</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedEffects.effects.map((e) => (
                        <span key={e} className="px-2 py-1 rounded text-[9px] font-bold" style={{ background: ACCENT_DIM, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedEffects.tips.length > 0 && (
                  <div>
                    <span className="text-[8px] uppercase tracking-wider" style={{ color: "#555" }}>Pro Tips</span>
                    <div className="space-y-1 mt-1">
                      {generatedEffects.tips.map((tip, i) => (
                        <p key={i} className="text-[9px] flex items-start gap-1.5" style={{ color: "#888" }}>
                          <ChevronRight className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" style={{ color: "#AA44FF" }} />{tip}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => { onEffectsSuggested(generatedEffects); onClose(); }}
                  className="w-full h-10 rounded-xl text-xs font-bold"
                  style={{ background: "#AA44FF", color: "#fff" }}>
                  Apply Suggestions
                </button>
              </div>
            )}
          </div>
        ) : activeTool === "bg-remove" ? (
          /* BG Remove (Chroma Key) */
          <div className="space-y-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-1 text-xs" style={{ color: "#666" }}>← Back</button>
            <div className="flex items-center gap-2">
              <Eraser className="w-5 h-5" style={{ color: "#22CC88" }} />
              <h3 className="text-sm font-bold text-white">Background Removal</h3>
            </div>

            <div className="rounded-xl p-3" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#FF6B00" }} />
                <p className="text-[10px]" style={{ color: "#888" }}>
                  Chroma key removes a specific color from your video. Works best with green/blue screen footage.
                </p>
              </div>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "#555" }}>Key Color</p>
              <div className="flex gap-2">
                {["#00FF00", "#0000FF", "#FF00FF", "#FFFFFF"].map((c) => (
                  <button key={c} onClick={() => setChromaColor(c)}
                    className="w-10 h-10 rounded-xl transition-all"
                    style={{
                      background: c,
                      border: chromaColor === c ? `3px solid ${ACCENT}` : "3px solid #222",
                      boxShadow: chromaColor === c ? `0 0 12px ${c}44` : "none",
                    }}
                  />
                ))}
                <input type="color" value={chromaColor} onChange={(e) => setChromaColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer" style={{ border: "3px solid #222" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase tracking-wider" style={{ color: "#555" }}>Threshold</span>
                <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{chromaThreshold}</span>
              </div>
              <input type="range" min={10} max={200} value={chromaThreshold}
                onChange={(e) => setChromaThreshold(Number(e.target.value))}
                className="w-full accent-[#22CC88]" />
            </div>

            <button onClick={() => { onBgRemoveStart(); onClose(); }}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: "#22CC88", color: "#000" }}>
              <Eraser className="w-4 h-4" /> Enable Chroma Key
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
