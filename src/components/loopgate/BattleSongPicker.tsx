import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Check, Loader2 } from "lucide-react";
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
        className="bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Song Picked</p>
          <p className="text-sm text-foreground font-medium truncate">{selectedSongName}</p>
        </div>
        <Music className="w-4 h-4 text-emerald-400 shrink-0" />
      </motion.div>
    );
  }

  return (
    <div className="bg-surface-1 border border-amber-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-500/20 flex items-center justify-center">
          <Music className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Pick Your Song First</h3>
          <p className="text-[9px] text-muted-foreground">Required before you can submit your edit</p>
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
  );
}
