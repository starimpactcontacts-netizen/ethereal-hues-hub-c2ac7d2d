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

      {/* Hint */}
      <div className="flex items-center gap-1.5 px-1 mb-1">
        <Play className="w-2.5 h-2.5 text-muted-foreground/40" fill="currentColor" />
        <span className="text-[10px] text-muted-foreground/40 italic">Tap play to preview · tap song to select</span>
      </div>

      {opponentPicked && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold">Opponent has picked</span>
        </div>
      )}

      {/* Scrollable song list */}
      <div className="max-h-[280px] overflow-y-auto overscroll-contain rounded-xl border border-border/40 bg-surface-1/50 divide-y divide-border/20">
        {drops.map((drop, index) => {
          const isPlaying = playingId === drop.id;
          const isSelected = selectedDropId === drop.id;
          const hasPreview = !!drop.song_preview_url;
          const artistName = drop.artist?.name || "Unknown";
          const isPromoted = !!(drop as any).is_promoted;

          return (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => !isSelected && handleSelect(drop)}
              className={`
                group flex items-center gap-3 py-3 px-3 transition-all cursor-pointer
                ${isSelected
                  ? "bg-emerald-500/10"
                  : "hover:bg-muted/10 active:bg-muted/20"
                }
              `}
            >
              {/* Play/Pause button — bigger & more visible */}
              <div className="w-10 h-10 shrink-0">
                {hasPreview ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(drop); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                      isPlaying
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted/20 text-foreground border-border hover:bg-muted/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    {isPlaying
                      ? <Pause className="w-4 h-4" fill="currentColor" />
                      : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    }
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted/10 border border-border/30 flex items-center justify-center">
                    <VolumeX className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Cover art */}
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-muted/10 border border-border/20">
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
                <p className="text-[10px] text-muted-foreground/50 truncate">
                  {artistName} • {drop.title}
                </p>
              </div>

              {/* Status indicator */}
              <div className="shrink-0 w-8 flex items-center justify-center">
                {isSelected ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-background" />
                  </motion.div>
                ) : isPlaying ? (
                  <div className="flex items-center gap-[2px]">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ height: [3, 14, 3] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }} className="w-[2px] bg-foreground/60 rounded-full" />
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll fade hint at bottom */}
      {drops.length > 4 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wider">Scroll for more</span>
          <motion.div animate={{ y: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-muted-foreground/30">
            <ChevronDown className="w-3 h-3" />
          </motion.div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span className="text-[10px] text-muted-foreground/40 ml-2">Locking in...</span>
        </div>
      )}
    </div>
  );
}
