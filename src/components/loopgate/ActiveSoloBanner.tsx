import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Music, Trophy, Send, Clock, Info, X, Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const STEPS = [
  { num: 1, text: "Open your preferred editing software (CapCut, Premiere, etc.)" },
  { num: 2, text: "Create an edit using the song & theme assigned below" },
  { num: 3, text: "Upload your edit to YouTube, TikTok, or Instagram" },
  { num: 4, text: "Paste your video link here and hit Submit" },
];

export default function ActiveSoloBanner() {
  const { activeSolo, submitEdit, cancelSolo } = useSoloMode();
  const [showGuide, setShowGuide] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!activeSolo) return null;

  // Already submitted
  if (activeSolo.status === "submitted" || activeSolo.status === "judging") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Edit Submitted!</p>
            <p className="text-sm text-white/90 font-medium">Waiting for a judge to score your work</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSolo.status === "scored" || activeSolo.status === "cancelled") return null;

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error("Paste your video link"); return; }
    setSubmitting(true);
    const ok = await submitEdit(activeSolo.id, url.trim(), platform);
    if (ok) toast.success("Edit submitted! A judge will score it soon.");
    else toast.error("Failed to submit");
    setSubmitting(false);
  };

  const handleCancel = async () => {
    const result = await cancelSolo(activeSolo.id);
    setShowCancelConfirm(false);
    if (!result?.success) { toast.error("Couldn't cancel. Try again."); return; }
    if (result.penalized) toast.error(`Solo cancelled — you lost 2 Index points (cancel #${result.cancelCount})`);
    else toast("Solo session cancelled — first one's free!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(20,20,28,0.9) 50%, rgba(255,215,0,0.03) 100%)", border: "1px solid rgba(255,215,0,0.15)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,215,0,0.12)" }}>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Solo Mode Active</p>
            <p className="text-[15px] text-white font-bold tracking-tight">{activeSolo.theme}</p>
          </div>
        </div>
        <button onClick={() => setShowCancelConfirm(true)} className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="Cancel Solo">
          <X className="w-4 h-4 text-white/30" />
        </button>
      </div>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[12px] text-red-300 font-semibold">Cancel this solo?</p>
                  <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                    Your first cancel is free. After that, each cancel costs <span className="text-red-400 font-bold">2 Index points</span>.
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      Keep editing
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      Yes, cancel solo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Song */}
      <div className="mx-4 mt-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-[12px] text-white/80 font-medium truncate">{activeSolo.song_name}</span>
        {activeSolo.artist_name && <span className="text-[11px] text-white/30">— {activeSolo.artist_name}</span>}
      </div>

      {/* What to do guide */}
      <div className="mx-4 mt-3">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-[11px] font-semibold transition-colors"
          style={{ color: "rgba(153,153,255,0.8)" }}
        >
          <Info className="w-3.5 h-3.5" />
          {showGuide ? "Hide guide" : "What do I do?"}
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 pb-1">
                {STEPS.map(s => (
                  <div key={s.num} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: "rgba(153,153,255,0.12)", color: "rgba(153,153,255,0.7)" }}
                    >
                      {s.num}
                    </span>
                    <p className="text-[11px] text-white/50 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 24hr tip */}
      <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.08)" }}>
        <Clock className="w-3.5 h-3.5 text-yellow-500/60 shrink-0" />
        <p className="text-[10px] text-white/35">
          <span className="text-yellow-400 font-bold">Submit within 24 hours</span> for judges to score it higher.
        </p>
      </div>

      {/* Submit area */}
      <div className="px-4 pt-3 pb-4">
        {!showForm ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2 relative overflow-hidden transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", boxShadow: "0 4px 20px rgba(255,215,0,0.2)" }}
          >
            <Send className="w-4 h-4 text-black" />
            <span className="text-[14px] font-black text-black tracking-tight" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              SUBMIT YOUR EDIT
            </span>
          </motion.button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex gap-2">
              {["youtube", "tiktok", "instagram"].map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                  style={{
                    background: platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.05)",
                    color: platform === p ? "#000" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <Input
              placeholder="Paste your video URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/25 rounded-lg"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              <span className="text-sm font-bold text-white">{submitting ? "Submitting..." : "Submit Edit"}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 justify-center pb-3">
        <Trophy className="w-3 h-3 text-yellow-400" />
        <span className="text-[10px] text-yellow-400/70 font-semibold">Earn up to 100+ Index when a judge scores your edit</span>
      </div>
    </motion.div>
  );
}
