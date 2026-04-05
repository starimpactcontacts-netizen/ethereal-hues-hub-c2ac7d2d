import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Music, ArrowLeft, Zap, Trophy, Loader2, SkipForward, Star } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import SongPicker from "./SongPicker";
import { useSoloMode, getRandomTheme } from "@/hooks/useSoloMode";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };

interface FeaturedDrop {
  id: string;
  song_name: string;
  song_preview_url: string | null;
  poster_url: string | null;
  title: string;
  artist: { name: string; avatar_url: string | null } | null;
}

export default function SoloModeFlow({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { startSolo, activeSolo, loading: soloLoading, cancelSolo } = useSoloMode();
  const [phase, setPhase] = useState<"pick" | "reveal" | "go">("pick");
  const [saving, setSaving] = useState(false);
  const [pickedDrop, setPickedDrop] = useState<FeaturedDrop | null>(null);
  const [theme, setTheme] = useState("");
  const [soloId, setSoloId] = useState<string | null>(null);

  // If user already has an active solo, show resume
  if (!soloLoading && activeSolo && phase === "pick") {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
            <div className="flex-1">
              <span className="text-[14px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>Solo Mode</span>
            </div>
          </div>
        </div>
        <div className="px-4 pt-6 space-y-4">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.2em]" style={teko}>Active Session</p>
              <h2 className="text-xl font-black text-foreground mt-1">{activeSolo.theme}</h2>
              <p className="text-xs text-muted-foreground/50 mt-1">{activeSolo.song_name}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", boxShadow: "0 4px 24px rgba(239,68,68,0.25)", ...teko }}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[18px] font-extrabold uppercase tracking-[0.15em]">
              {activeSolo.status === 'editing' ? 'CONTINUE EDITING' : 'VIEW SUBMISSION'}
            </span>
          </button>

          {activeSolo.status === 'editing' && (
            <button
              onClick={async () => {
                const result = await cancelSolo(activeSolo.id);
                if (!result?.success) { toast.error("Couldn't cancel right now"); return; }
                if (result.penalized) toast.error(`Solo cancelled — lost 2 Index (cancel #${result.cancelCount})`);
                else toast("Solo cancelled — first one's free!");
              }}
              className="w-full py-2.5 text-[11px] text-muted-foreground/40 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
            >
              Cancel Session
            </button>
          )}
        </div>
      </div>
    );
  }

  const handlePick = async (drop: FeaturedDrop) => {
    setSaving(true);
    setPickedDrop(drop);
    const newTheme = getRandomTheme();
    setTheme(newTheme);
    const solo = await startSolo({ id: drop.id, song_name: drop.song_name, artist: drop.artist });
    if (solo) { setSoloId(solo.id); setTheme(solo.theme); setPhase("reveal"); }
    setSaving(false);
  };

  const handleSkipSongs = async () => {
    // Skip song selection — use "Any Song" and go straight to theme
    setSaving(true);
    const fakeDrop: FeaturedDrop = {
      id: "skip",
      song_name: "Your Choice",
      song_preview_url: null,
      poster_url: null,
      title: "Any Song",
      artist: null,
    };
    setPickedDrop(fakeDrop);
    const solo = await startSolo({ id: "skip", song_name: "Your Choice", artist: null });
    if (solo) { setSoloId(solo.id); setTheme(solo.theme); setPhase("reveal"); }
    setSaving(false);
  };

  const goToStudio = () => {
    if (soloId) navigate(`/studio?solo=${soloId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GateIcon className="w-4 h-4 text-amber-400" />
              <span className="text-[16px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>Solo Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-400/30">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-bold" style={teko}>100+ IDX</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {phase === "pick" && (
            <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
              {/* Skip songs option */}
              <button
                onClick={handleSkipSongs}
                disabled={saving}
                className="w-full mb-4 py-3 rounded-2xl flex items-center justify-center gap-2 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <SkipForward className="w-4 h-4 text-muted-foreground/60" />
                    <span className="text-xs font-bold text-muted-foreground/60">Skip — use your own song</span>
                  </>
                )}
              </button>

              <SongPicker onPick={handlePick} loading={saving} selectedDropId={pickedDrop?.id || null} />
            </motion.div>
          )}

          {phase === "reveal" && pickedDrop && (
            <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5 pt-4">
              {/* Song chosen */}
              <div className="flex items-center gap-3 px-1">
                {pickedDrop.poster_url ? (
                  <img src={pickedDrop.poster_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.15em]" style={teko}>Song Locked</p>
                  <p className="text-sm text-foreground font-bold truncate">{pickedDrop.song_name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{pickedDrop.artist?.name || "Your choice"}</p>
                </div>
              </div>

              {/* Theme reveal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4"
                >
                  <GateIcon className="w-7 h-7 text-amber-400" />
                </motion.div>
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.25em] mb-2" style={teko}>Your Theme</p>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="text-3xl font-black text-foreground"
                  style={teko}
                >
                  {theme}
                </motion.h2>
              </motion.div>

              {/* GO button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={goToStudio}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", boxShadow: "0 4px 24px rgba(239,68,68,0.25)", ...teko }}
              >
                <Zap className="w-5 h-5" />
                <span className="text-[18px] font-extrabold uppercase tracking-[0.15em]">GO TO STUDIO</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
