import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, Check, VolumeX, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const teko = { fontFamily: "Teko, sans-serif" };

interface FeaturedDrop {
  id: string;
  song_name: string;
  song_preview_url: string | null;
  poster_url: string | null;
  title: string;
  artist: { name: string; avatar_url: string | null } | null;
}

interface SongPickerProps {
  onPick: (drop: FeaturedDrop) => void;
  loading?: boolean;
  selectedDropId?: string | null;
  opponentPicked?: boolean;
}

export default function SongPicker({ onPick, loading, selectedDropId, opponentPicked }: SongPickerProps) {
  const [drops, setDrops] = useState<FeaturedDrop[]>([]);
  const [fetchingDrops, setFetchingDrops] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from("featured_drops")
        .select(`id, song_name, song_preview_url, poster_url, title, artist:featured_artists!featured_drops_artist_id_fkey(name, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        const sorted = (data as unknown as (FeaturedDrop & { is_promoted?: boolean })[])
          .sort((a, b) => ((b as any).is_promoted ? 1 : 0) - ((a as any).is_promoted ? 1 : 0));
        setDrops(sorted);
      }
      setFetchingDrops(false);
    };
    fetchDrops();
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  const togglePlay = (drop: FeaturedDrop) => {
    if (!drop.song_preview_url) return;
    if (playingId === drop.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(drop.song_preview_url);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(drop.id);
  };

  const handleSelect = (drop: FeaturedDrop) => {
    if (loading) return;
    if (audioRef.current) { audioRef.current.pause(); setPlayingId(null); }
    onPick(drop);
  };

  if (fetchingDrops) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground/40">No featured songs available</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-2">
        <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-foreground" style={teko}>
          Featured Tracks
        </span>
        <span className="text-[10px] text-muted-foreground/30 ml-auto" style={teko}>{drops.length} SONGS</span>
      </div>

      {opponentPicked && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold">Opponent has picked</span>
        </div>
      )}

      {/* Song list */}
      {drops.map((drop, index) => {
        const isPlaying = playingId === drop.id;
        const isSelected = selectedDropId === drop.id;
        const hasPreview = !!drop.song_preview_url;
        const artistName = drop.artist?.name || "Unknown";
        const isPromoted = !!(drop as any).is_promoted;

        return (
          <motion.div
            key={drop.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
            onClick={() => !isSelected && handleSelect(drop)}
            className={`
              group flex items-center gap-3 py-2.5 px-2 rounded-2xl transition-all cursor-pointer
              ${isSelected ? "bg-emerald-500/10" : "hover:bg-white/[0.03] active:bg-white/[0.05]"}
            `}
          >
            {/* Play/Pause */}
            <div className="w-9 h-9 shrink-0">
              {hasPreview ? (
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(drop); }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isPlaying
                      ? "bg-foreground text-background"
                      : "bg-white/[0.06] text-muted-foreground/60 group-hover:bg-white/[0.1] group-hover:text-foreground"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/[0.03] flex items-center justify-center">
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Cover art */}
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white/[0.04]">
              {drop.poster_url ? (
                <img src={drop.poster_url} alt={drop.song_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isPromoted && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                <p className={`text-sm font-bold truncate ${isSelected ? "text-emerald-400" : "text-foreground"}`}>
                  {drop.song_name}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground/50 truncate">{artistName}</p>
            </div>

            {/* Status indicator */}
            <div className="shrink-0 w-7 flex items-center justify-center">
              {isSelected ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-background" />
                </motion.div>
              ) : isPlaying ? (
                <div className="flex items-center gap-[2px]">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} animate={{ height: [3, 12, 3] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} className="w-[2px] bg-foreground/60 rounded-full" />
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        );
      })}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span className="text-[10px] text-muted-foreground/40 ml-2">Locking in...</span>
        </div>
      )}
    </div>
  );
}
