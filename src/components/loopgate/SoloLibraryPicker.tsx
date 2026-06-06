import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Music, Play, Pause, Check, VolumeX, Loader2, Film, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const teko = { fontFamily: "Teko, sans-serif" };

export interface LibrarySong {
  id: string;
  song_name: string;
  artist_name: string | null;
  cover_url: string | null;
  preview_url: string | null;
}

export interface LibraryScenepack {
  id: string;
  title: string;
  thumbnail_url: string | null;
  pack_count: number | null;
}

interface Props {
  selectedSongId?: string | null;
  selectedPackId?: string | null;
  onPickSong: (s: LibrarySong | null) => void;
  onPickPack: (p: LibraryScenepack | null) => void;
}

export default function SoloLibraryPicker({ selectedSongId, selectedPackId, onPickSong, onPickPack }: Props) {
  const [songs, setSongs] = useState<LibrarySong[]>([]);
  const [packs, setPacks] = useState<LibraryScenepack[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("battle_songs" as any)
        .select("id, song_name, artist_name, cover_url, preview_url, audio_url, is_priority")
        .eq("is_featured", true)
        .order("is_priority", { ascending: false })
        .limit(80);
      const rows = (data as any[] | null) || [];
      setSongs(rows.map((t) => ({
        id: t.id,
        song_name: t.song_name,
        artist_name: t.artist_name,
        cover_url: t.cover_url,
        preview_url: t.preview_url || t.audio_url || null,
      })));
      setLoadingSongs(false);
    })();
    (async () => {
      const { data } = await supabase
        .from("scenepack_pool")
        .select("id, title, thumbnail_url, pack_count")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(40);
      const rows = (data as any[] | null) || [];
      setPacks(rows.map((p) => ({
        id: p.id,
        title: p.title,
        thumbnail_url: p.thumbnail_url,
        pack_count: p.pack_count,
      })));
      setLoadingPacks(false);
    })();
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  const togglePlay = (s: LibrarySong) => {
    if (!s.preview_url) return;
    if (playingId === s.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(s.preview_url);
    a.volume = 0.6;
    a.play().catch(() => {});
    a.onended = () => setPlayingId(null);
    audioRef.current = a;
    setPlayingId(s.id);
  };

  return (
    <div className="space-y-8">
      {/* Scenepacks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Film className="w-3.5 h-3.5 text-amber-400/80" />
          <span className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-white" style={teko}>Scenepacks</span>
          <span className="ml-auto text-[10px] text-white/30" style={teko}>{packs.length} PACKS</span>
        </div>
        {loadingPacks ? (
          <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-amber-400 animate-spin" /></div>
        ) : packs.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-4">No scenepacks available</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {packs.map((p) => {
              const sel = selectedPackId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPickPack(sel ? null : p)}
                  className={`relative w-[120px] shrink-0 snap-start rounded-2xl overflow-hidden border transition-all active:scale-[0.97] ${
                    sel ? "border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.35)]" : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ aspectRatio: "2/3" }}
                >
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center"><Film className="w-5 h-5 text-white/30" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                    <p className="text-[11px] font-extrabold text-white leading-tight line-clamp-2">{p.title}</p>
                    {p.pack_count != null && (
                      <p className="text-[9px] text-white/50 mt-0.5">{p.pack_count} clips</p>
                    )}
                  </div>
                  {sel && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Songs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-3.5 h-3.5 text-amber-400/80" />
          <span className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-white" style={teko}>Song Library</span>
          <span className="ml-auto text-[10px] text-white/30" style={teko}>{songs.length} TRACKS</span>
        </div>
        {loadingSongs ? (
          <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-amber-400 animate-spin" /></div>
        ) : songs.length === 0 ? (
          <p className="text-[11px] text-white/30 text-center py-4">No tracks in the library yet</p>
        ) : (
          <div className="max-h-[320px] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
            {songs.map((s, i) => {
              const isPlaying = playingId === s.id;
              const sel = selectedSongId === s.id;
              const hasPrev = !!s.preview_url;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => onPickSong(sel ? null : s)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    sel ? "bg-amber-400/10" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="w-9 h-9 shrink-0">
                    {hasPrev ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePlay(s); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                          isPlaying ? "bg-amber-400 text-black border-amber-400" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {isPlaying
                          ? <Pause className="w-3.5 h-3.5" fill="currentColor" />
                          : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
                      </button>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <VolumeX className="w-3.5 h-3.5 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10">
                    {s.cover_url ? (
                      <img src={s.cover_url} alt={s.song_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="w-3.5 h-3.5 text-white/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${sel ? "text-amber-300" : "text-white"}`}>{s.song_name}</p>
                    <p className="text-[10px] text-white/40 truncate">{s.artist_name || "Unknown artist"}</p>
                  </div>
                  {sel && (
                    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        {songs.length > 6 && (
          <div className="flex items-center justify-center gap-1 pt-2 text-white/30">
            <span className="text-[9px] uppercase tracking-wider">Scroll for more</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        )}
      </section>
    </div>
  );
}