import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Star, ArrowLeft, Zap, Trophy, Loader2 } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import SongPicker from "./SongPicker";
import { Button } from "@/components/ui/button";
import { useSoloMode, getRandomTheme } from "@/hooks/useSoloMode";
import { toast } from "sonner";

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

  // If user already has an active solo, show resume instead of pick
  if (!soloLoading && activeSolo && phase === "pick") {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-display text-lg flex items-center gap-2">
              <GateIcon className="w-4 h-4 text-gold" /> Solo Mode
            </h1>
          </div>
        </div>
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-gradient-to-br from-gold/10 via-surface-1 to-gold/5 border border-gold/40 p-5 text-center">
            <Star className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-1">Active Solo Session</p>
            <h2 className="text-xl font-black text-foreground mb-1">{activeSolo.theme}</h2>
            <p className="text-[12px] text-muted-foreground">Song: {activeSolo.song_name}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Status: <span className="text-gold font-semibold">{activeSolo.status}</span>
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">You can only have 1 active solo at a time. Complete or cancel this one first.</p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate(`/studio?solo=${activeSolo.id}`)}
            className="w-full relative overflow-hidden">
            <div className="relative bg-gold hover:bg-gold/90 transition-colors py-5 flex items-center justify-center gap-3">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
              <Zap className="w-5 h-5 text-background relative z-10" />
              <span className="text-[20px] font-black text-background relative z-10 tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                {activeSolo.status === 'editing' ? 'CONTINUE EDITING' : 'VIEW SUBMISSION'}
              </span>
            </div>
          </motion.button>
          {activeSolo.status === 'editing' && (
            <button
              onClick={async () => {
                const result = await cancelSolo(activeSolo.id);
                if (!result?.success) {
                  toast.error("Couldn’t cancel this solo right now. Try again.");
                  return;
                }
                if (result.penalized) {
                  toast.error(`Solo cancelled — lost 2 Index (cancel #${result.cancelCount})`);
                } else {
                  toast("Solo cancelled — first one's free!");
                }
              }}
              className="w-full py-2.5 text-[12px] text-muted-foreground hover:text-destructive font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel Solo Session
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

    const solo = await startSolo({
      id: drop.id,
      song_name: drop.song_name,
      artist: drop.artist,
    });

    if (solo) {
      setSoloId(solo.id);
      setTheme(solo.theme);
      setPhase("reveal");
    }
    setSaving(false);
  };

  const goToStudio = () => {
    if (soloId) {
      navigate(`/studio?solo=${soloId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg flex items-center gap-2">
              <GateIcon className="w-4 h-4 text-gold" />
              Solo Mode
            </h1>
            <p className="text-[10px] text-muted-foreground">Pick a song · Get a theme · Edit · Get scored</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 px-2.5 py-1">
            <Trophy className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-gold font-bold">UP TO 100+ IDX</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {phase === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* How it works */}
              <div className="bg-surface-1 border border-border p-3 mb-4">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">How Solo Mode Works</h3>
                <div className="space-y-1.5">
                  {[
                    { step: "1", text: "Pick a featured song below", icon: <Music className="w-3 h-3" /> },
                    { step: "2", text: "Get assigned a random editing theme", icon: <GateIcon className="w-3 h-3" /> },
                    { step: "3", text: "Edit your video and submit", icon: <Zap className="w-3 h-3" /> },
                    { step: "4", text: "A judge scores your work — earn up to 100+ Index", icon: <Trophy className="w-3 h-3" /> },
                  ].map(s => (
                    <div key={s.step} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="w-5 h-5 bg-gold/10 text-gold flex items-center justify-center text-[9px] font-bold shrink-0">
                        {s.step}
                      </span>
                      <span className="text-foreground/60">{s.icon}</span>
                      {s.text}
                    </div>
                  ))}
                </div>
              </div>

              <SongPicker
                onPick={handlePick}
                loading={saving}
                selectedDropId={pickedDrop?.id || null}
              />
            </motion.div>
          )}

          {phase === "reveal" && pickedDrop && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Song chosen */}
              <div className="bg-surface-1 border border-emerald-500/30 p-4 flex items-center gap-3">
                {pickedDrop.poster_url ? (
                  <img src={pickedDrop.poster_url} alt="" className="w-14 h-14 object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-surface-2 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Song Selected</p>
                  <p className="text-sm text-foreground font-bold truncate">{pickedDrop.song_name}</p>
                  <p className="text-[11px] text-muted-foreground">{pickedDrop.artist?.name || "Unknown Artist"}</p>
                </div>
              </div>

              {/* Theme reveal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gold/10 via-surface-1 to-gold/5 border border-gold/40 p-6 text-center"
              >
                <Sparkles className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-1">Your Theme</p>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="text-2xl font-black text-foreground"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {theme}
                </motion.h2>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Edit a video to "{pickedDrop.song_name}" with the theme "{theme}"
                </p>
              </motion.div>

              {/* GO button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileTap={{ scale: 0.98 }}
                onClick={goToStudio}
                className="w-full relative overflow-hidden"
              >
                <div className="relative bg-gold hover:bg-gold/90 transition-colors py-5 flex items-center justify-center gap-3">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent pointer-events-none" />
                  <Zap className="w-5 h-5 text-background relative z-10" />
                  <span className="text-[20px] font-black text-background relative z-10 tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    GO TO STUDIO
                  </span>
                </div>
              </motion.button>

              <p className="text-center text-[11px] text-muted-foreground">
                You'll be taken to the Studio to create and submit your edit
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
