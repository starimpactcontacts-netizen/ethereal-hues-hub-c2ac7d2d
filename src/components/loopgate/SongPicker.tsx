import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, Check, Volume2, VolumeX, Loader2, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const confirmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from("featured_drops")
        .select(`
          id, song_name, song_preview_url, poster_url, title,
          artist:featured_artists!featured_drops_artist_id_fkey(name, avatar_url)
        `)
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

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (drop: FeaturedDrop) => {
    if (!drop.song_preview_url) return;

    if (playingId === drop.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(drop.song_preview_url);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(drop.id);
  };

  const handleSelect = (drop: FeaturedDrop) => {
    if (loading) return;
    setHighlightedId(drop.id);
    // Play a short confirmation tick sound
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const handleConfirm = useCallback(() => {
    const drop = drops.find(d => d.id === highlightedId);
    if (!drop || loading) return;
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onPick(drop);
  }, [highlightedId, drops, loading, onPick]);

  const highlightedDrop = drops.find(d => d.id === highlightedId);

  if (fetchingDrops) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No featured songs available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Pick Your Song
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Choose a featured artist track to edit to
          </p>
        </div>
        {opponentPicked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full"
          >
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">Opponent picked</span>
          </motion.div>
        )}
      </div>

      {/* Confirm Button — grey when no selection, green + pulse when selected */}
      <AnimatePresence mode="wait">
        <motion.button
          key={highlightedId || "empty"}
          onClick={handleConfirm}
          disabled={!highlightedId || loading}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            w-full py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm uppercase tracking-wider transition-all
            ${highlightedId
              ? "bg-emerald-500 text-background hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
              : "bg-white/[0.06] text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Locking In...
            </>
          ) : highlightedId ? (
            <motion.span
              className="flex items-center gap-2"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Rocket className="w-4 h-4" />
              Lock In — {highlightedDrop?.song_name}
            </motion.span>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Select a Song Below
            </>
          )}
        </motion.button>
      </AnimatePresence>

      {/* Song List */}
      <div className="space-y-1">
        {drops.map((drop, index) => {
          const isPlaying = playingId === drop.id;
          const isHighlighted = highlightedId === drop.id;
          const isSelected = selectedDropId === drop.id;
          const hasPreview = !!drop.song_preview_url;
          const artistName = drop.artist?.name || "Unknown Artist";
          const isPromoted = !!(drop as any).is_promoted;

          return (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`
                group flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer
                ${isSelected
                  ? "bg-emerald-500/15 border border-emerald-500/40"
                  : isHighlighted
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : isPromoted
                      ? "bg-gold/[0.04] border border-gold/30 hover:border-gold/50"
                      : "hover:bg-white/[0.04] border border-transparent"
                }
              `}
              onClick={() => !isSelected && handleSelect(drop)}
            >
              {/* Play Button */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {hasPreview ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(drop);
                    }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${isPlaying
                        ? "bg-emerald-500 text-background shadow-lg shadow-emerald-500/30"
                        : "bg-white/[0.06] text-muted-foreground group-hover:bg-white/[0.1] group-hover:text-foreground"
                      }
                    `}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" fill="currentColor" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                    )}
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Cover Art */}
              <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-2">
                {drop.poster_url ? (
                  <img src={drop.poster_url} alt={drop.song_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-emerald-800/20">
                    <Music className="w-4 h-4 text-emerald-400/60" />
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium truncate ${isSelected || isHighlighted ? "text-emerald-400" : isPromoted ? "text-gold" : "text-foreground"}`}>
                    {drop.song_name}
                  </p>
                  {isPromoted && !isSelected && !isHighlighted && (
                    <span className="text-[7px] font-bold text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{artistName}</p>
              </div>

              {/* Check / Bars */}
              <div className="shrink-0">
                {isHighlighted || isSelected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-background" />
                  </motion.div>
                ) : isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 14, 4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="w-[3px] bg-emerald-400 rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4 text-transparent group-hover:text-muted-foreground/40 transition-colors" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
