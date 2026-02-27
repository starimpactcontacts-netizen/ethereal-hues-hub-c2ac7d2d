import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Music, Trophy, Send, X, Loader2, Clock, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SoftwareLauncherGrid from "./SoftwareLauncherGrid";

export default function SoloModeBanner({ soloId }: { soloId: string }) {
  const { activeSolo, submitEdit, cancelSolo, refetch } = useSoloMode();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSoftware, setShowSoftware] = useState(false);

  // If no active solo or mismatch, don't render
  if (!activeSolo || activeSolo.id !== soloId) return null;

  if (activeSolo.status === "submitted" || activeSolo.status === "judging") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-background" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Edit Submitted!</p>
            <p className="text-sm text-foreground font-medium">Waiting for a judge to score your work</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">You can earn up to 100+ Index points</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSolo.status === "scored") return null;

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error("Paste your video link"); return; }
    setSubmitting(true);
    const ok = await submitEdit(soloId, url.trim(), platform);
    if (ok) {
      toast.success("Edit submitted! A judge will score it soon.");
    } else {
      toast.error("Failed to submit");
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    const result = await cancelSolo(soloId);
    if (!result?.success) {
      toast.error("Couldn't cancel this solo right now. Try again.");
      return;
    }
    if (result.penalized) {
      toast.error(`Solo cancelled — you lost 2 Index points (cancel #${result.cancelCount})`);
    } else {
      toast("Solo session cancelled — first one's free!");
    }
    window.history.replaceState({}, '', '/studio');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gold/10 via-surface-1 to-gold/5 border border-gold/40 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-[10px] text-gold font-bold uppercase tracking-wider">Solo Mode Active</p>
            <p className="text-sm text-foreground font-bold">{activeSolo.theme}</p>
          </div>
        </div>
        <button onClick={handleCancel} className="p-1.5 hover:bg-surface-2 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Song info */}
      <div className="flex items-center gap-2 bg-surface-1 border border-border px-3 py-2">
        <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-[12px] text-foreground font-medium truncate">{activeSolo.song_name}</span>
        {activeSolo.artist_name && (
          <span className="text-[11px] text-muted-foreground">— {activeSolo.artist_name}</span>
        )}
      </div>

      {/* Use any software notice */}
      <div className="bg-accent/5 border border-accent/20 p-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-accent shrink-0" />
          <p className="text-[11px] text-foreground font-semibold">Use any editing software you want</p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed pl-5.5">
          CapCut, Premiere, After Effects, DaVinci — whatever you edit with. 
          Loopgate Studio is optional. Just submit your video link when you're done.
        </p>
        <button
          onClick={() => setShowSoftware(!showSoftware)}
          className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 font-medium pl-5.5 transition-colors"
        >
          {showSoftware ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showSoftware ? "Hide software" : "Browse editing software"}
        </button>
        <AnimatePresence>
          {showSoftware && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <SoftwareLauncherGrid />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 24hr urgency */}
      <div className="flex items-center gap-2 bg-gold/5 border border-gold/20 px-3 py-2">
        <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="text-gold font-bold">Submit within 24 hours</span> for judges to score it higher. 
          The faster you submit, the more Index you can earn.
        </p>
      </div>

      {/* Instructions */}
      <p className="text-[11px] text-muted-foreground">
        Create an edit to "<span className="text-foreground font-medium">{activeSolo.song_name}</span>" 
        with the theme "<span className="text-gold font-medium">{activeSolo.theme}</span>". 
        When done, submit your video link below.
      </p>

      {/* Submit form */}
      {!showForm ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full bg-gold hover:bg-gold/90 transition-colors py-3.5 flex items-center justify-center gap-2 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none" />
          <Send className="w-4 h-4 text-background" />
          <span className="text-[14px] font-black text-background tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
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
                className={`px-3 py-1.5 text-[11px] font-semibold transition-all ${
                  platform === p
                    ? "bg-foreground text-background"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Input
            placeholder="Paste your video URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-surface-1 border-border text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors py-3 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span className="text-sm font-bold text-white">
              {submitting ? "Submitting..." : "Submit Edit"}
            </span>
          </button>
        </motion.div>
      )}

      <div className="flex items-center gap-1.5 justify-center">
        <Trophy className="w-3 h-3 text-gold" />
        <span className="text-[10px] text-gold font-semibold">Earn up to 100+ Index when a judge scores your edit</span>
      </div>
    </motion.div>
  );
}
