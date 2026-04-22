import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Check, Sparkles, Zap } from "lucide-react";
import SongPicker from "./SongPicker";

interface FeaturedDrop {
  id: string;
  song_name: string;
  song_preview_url: string | null;
  poster_url: string | null;
  title: string;
  artist: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface BattleSongPickerProps {
  onSongPicked: (drop: FeaturedDrop) => Promise<void>;
  selectedSongName?: string | null;
  opponentPicked?: boolean;
  compact?: boolean;
}

export default function BattleSongPicker({ onSongPicked, selectedSongName, opponentPicked, compact }: BattleSongPickerProps) {
  const [saving, setSaving] = useState(false);
  const [pickedDropId, setPickedDropId] = useState<string | null>(null);

  if (selectedSongName) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-[1px]"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.55), rgba(16,185,129,0.15) 50%, rgba(124,58,237,0.4))' }}
      >
        <div
          className="rounded-[15px] p-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 6%) 100%)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Check className="w-5 h-5 text-background" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Song Locked In</p>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-[1px] text-[9px] font-bold text-emerald-300">
                <Zap className="w-2.5 h-2.5" /> +50 XP
              </span>
            </div>
            <p className="text-sm text-foreground font-semibold truncate">{selectedSongName}</p>
          </div>
          <Music className="w-4 h-4 text-emerald-400/70 shrink-0" />
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-[1px]"
      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.5), rgba(255,255,255,0.04) 45%, rgba(124,58,237,0.45))' }}
    >
      <div
        className="relative rounded-[15px] p-4"
        style={{ background: 'linear-gradient(160deg, hsl(0 0% 11%) 0%, hsl(0 0% 6%) 100%)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Music className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[13px] font-bold text-foreground tracking-tight">Pick a Song from the Library</h3>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-[1px] text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" /> +50 XP
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Optional — bonus XP awarded on submit</p>
          </div>
        </div>
      <SongPicker
        onPick={async (drop) => {
          setSaving(true);
          setPickedDropId(drop.id);
          await onSongPicked(drop);
          setSaving(false);
        }}
        loading={saving}
        selectedDropId={pickedDropId}
        opponentPicked={opponentPicked}
      />
      </div>
    </div>
  );
}
