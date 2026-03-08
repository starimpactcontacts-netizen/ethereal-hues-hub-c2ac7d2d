import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trophy, Loader2, X, Music } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ACCENT = "#9999FF";

/**
 * Compact submit button for inside the Studio editor toolbar.
 * Shows a gold "Submit Edit" pill when a solo is active, expanding into a form on click.
 */
export default function StudioSubmitButton() {
  const { activeSolo, submitEdit } = useSoloMode();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [submitting, setSubmitting] = useState(false);

  if (!activeSolo) return null;
  if (activeSolo.status !== "editing" && activeSolo.status !== "picking_song") return null;

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error("Paste your video link"); return; }
    setSubmitting(true);
    const ok = await submitEdit(activeSolo.id, url.trim(), platform);
    if (ok) { toast.success("Edit submitted! A judge will score it soon."); setOpen(false); }
    else toast.error("Failed to submit");
    setSubmitting(false);
  };



  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-bold transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000", boxShadow: "0 2px 8px rgba(255,215,0,0.25)" }}
      >
        <Send className="w-3 h-3" />
        Submit Edit
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl p-4 z-50"
            style={{ background: "#1a1a1e", border: "1px solid rgba(255,215,0,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[11px] text-yellow-400 font-bold uppercase tracking-wider">Solo Submit</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/[0.06]">
                <X className="w-3.5 h-3.5 text-white/30" />
              </button>
            </div>

            {/* Theme & Song */}
            <div className="mb-3 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-yellow-400/70 font-semibold">{activeSolo.theme}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Music className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] text-white/60 truncate">{activeSolo.song_name}</span>
              </div>
            </div>

            {/* Platform picker */}
            <div className="flex gap-1.5 mb-2">
              {["youtube", "tiktok", "instagram"].map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
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

            {/* URL input */}
            <Input
              placeholder="Paste your video URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/20 rounded-lg mb-2"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
              <span className="text-xs font-bold text-white">{submitting ? "Submitting..." : "Submit"}</span>
            </button>

            <div className="flex items-center gap-1 justify-center mt-2">
              <Trophy className="w-2.5 h-2.5 text-yellow-400/60" />
              <span className="text-[9px] text-yellow-400/50 font-medium">Earn up to 100+ Index</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
