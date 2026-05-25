import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Music, Film, Search, Play, Pause, Plus, Trash2, Star, StarOff, Loader2, ExternalLink, Check, Upload, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { toast } from "sonner";

type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

const DIFF: Record<Difficulty, { label: string; cls: string }> = {
  easy:      { label: 'Easy',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  normal:    { label: 'Normal',    cls: 'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  hard:      { label: 'Hard',      cls: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  nightmare: { label: 'Nightmare', cls: 'text-red-400 bg-red-500/10 border-red-500/25' },
};
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'nightmare'];

interface RadioTrack {
  id: string;
  song_name: string;
  artist_name: string | null;
  audio_url: string;
  preview_url: string | null;
  cover_url: string | null;
  deezer_id: number | null;
  is_featured: boolean;
  is_priority: boolean;
  track_order: number;
  created_at: string;
  difficulty: Difficulty | null;
}

interface ScenepackRow {
  id: string;
  title: string;
  series: string | null;
  preview_video_url: string | null;
  thumbnail_url: string | null;
  scenepack_youtube_url: string | null;
  scenepack_gdrive_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { title: string; cover_medium?: string; cover_small?: string };
  preview: string;
  link?: string;
}

async function uploadFileToBunny(file: File, folder: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-sign-upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, folder }),
    }
  );
  if (!res.ok) throw new Error(`Bunny sign failed: ${res.status}`);
  const { uploadUrl, accessKey, cdnUrl } = await res.json();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { AccessKey: accessKey },
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
  return cdnUrl;
}

/* =========================================================================
   Library Management — Songs + Scenepacks
   ========================================================================= */
export default function LibraryManagementSection() {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        <Music size={14} /> Library Management
      </h2>
      <div className="bg-card border border-border rounded-lg p-3">
        <Tabs defaultValue="songs">
          <TabsList className="grid grid-cols-2 w-full mb-3">
            <TabsTrigger value="songs" className="text-xs gap-1.5">
              <Music size={12} /> Songs
            </TabsTrigger>
            <TabsTrigger value="scenepacks" className="text-xs gap-1.5">
              <Film size={12} /> Scenepacks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="songs"><SongsManager /></TabsContent>
          <TabsContent value="scenepacks"><ScenepacksManager /></TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

/* ============================ SONGS ============================ */
function SongsManager() {
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [adding, setAddingId] = useState<number | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("radio_tracks")
      .select("*")
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    setTracks((data as any as RadioTrack[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    return () => { audioRef.current?.pause(); };
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("deezer-search", {
        body: { query: q.trim(), limit: 30 },
      });
      if (error) throw error;
      const tracks: DeezerTrack[] = Array.isArray(data?.data) ? data.data : [];
      setResults(tracks.filter((t) => t.preview));
    } catch (e: any) {
      toast.error(e?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const togglePreview = (url: string | null) => {
    if (!url) return;
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(url);
    a.volume = 0.6;
    a.play().catch(() => {});
    a.onended = () => setPlayingUrl((p) => (p === url ? null : p));
    audioRef.current = a;
    setPlayingUrl(url);
  };

  const addFromDeezer = async (t: DeezerTrack) => {
    setAddingId(t.id);
    try {
      const cover = t.album?.cover_medium || t.album?.cover_small || null;
      const { error } = await supabase.from("radio_tracks").insert({
        song_name: t.title,
        artist_name: t.artist?.name || "Unknown",
        audio_url: t.preview,
        preview_url: t.preview,
        cover_url: cover,
        deezer_id: t.id,
        is_featured: true,
      } as any);
      if (error) throw error;
      toast.success(`Added "${t.title}"`);
      load();
    } catch (e: any) {
      if (String(e?.message || "").includes("duplicate")) {
        toast.error("Already in library");
      } else {
        toast.error(e?.message || "Failed to add");
      }
    } finally {
      setAddingId(null);
    }
  };

  const removeTrack = async (id: string) => {
    if (!confirm("Remove this song from the library?")) return;
    const { error } = await supabase.from("radio_tracks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    setTracks((t) => t.filter((x) => x.id !== id));
  };

  const togglePriority = async (t: RadioTrack) => {
    const next = !t.is_priority;
    const { error } = await supabase.from("radio_tracks").update({ is_priority: next }).eq("id", t.id);
    if (error) return toast.error(error.message);
    setTracks((arr) => arr.map((x) => (x.id === t.id ? { ...x, is_priority: next } : x)));
  };

  const toggleFeatured = async (t: RadioTrack) => {
    const next = !t.is_featured;
    const { error } = await supabase.from("radio_tracks").update({ is_featured: next }).eq("id", t.id);
    if (error) return toast.error(error.message);
    setTracks((arr) => arr.map((x) => (x.id === t.id ? { ...x, is_featured: next } : x)));
  };

  const setDifficulty = async (id: string, diff: Difficulty | null) => {
    const { error } = await supabase.from("radio_tracks").update({ difficulty: diff } as any).eq("id", id);
    if (error) return toast.error(error.message);
    setTracks((arr) => arr.map((x) => (x.id === id ? { ...x, difficulty: diff } : x)));
  };

  const existingIds = new Set(tracks.map((t) => t.deezer_id).filter(Boolean) as number[]);

  return (
    <div className="space-y-4">
      {/* Deezer search */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Search Deezer (global catalog)
        </Label>
        <div className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(query); }}
              placeholder="Song, artist, album…"
              className="pl-8 h-9 text-xs"
            />
          </div>
          <Button size="sm" onClick={() => search(query)} disabled={searching || !query.trim()}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border bg-background/30">
            {results.map((t) => {
              const exists = existingIds.has(t.id);
              const isPlaying = playingUrl === t.preview;
              return (
                <div key={t.id} className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => togglePreview(t.preview)}
                    className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/60 flex items-center justify-center shrink-0"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                  {t.album?.cover_small ? (
                    <img src={t.album.cover_small} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist?.name}</p>
                  </div>
                  {exists ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 px-2">
                      <Check size={12} /> Added
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addFromDeezer(t)}
                      disabled={adding === t.id}
                      className="h-7 text-[10px] gap-1"
                    >
                      {adding === t.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual upload toggle */}
      <div>
        <button
          onClick={() => setShowManual((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-border hover:border-border/80 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Upload size={11} /> Manual Upload (Underground / No Deezer)
          </span>
          {showManual ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showManual && (
          <ManualUploadForm onAdded={() => { load(); setShowManual(false); }} />
        )}
      </div>

      {/* Existing library */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Library ({tracks.length})
          </Label>
          <button onClick={load} className="text-[10px] text-muted-foreground hover:text-foreground">
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : tracks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No songs yet. Search Deezer above to add some.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {tracks.map((t) => {
              const url = t.preview_url || t.audio_url;
              const isPlaying = playingUrl === url;
              const diff = t.difficulty;
              return (
                <div key={t.id} className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => togglePreview(url)}
                    className="w-9 h-9 rounded-full bg-muted/30 hover:bg-muted/60 flex items-center justify-center shrink-0"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-muted shrink-0 flex items-center justify-center">
                      <Music size={14} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                      {t.song_name}
                      {!t.is_featured && <span className="text-[8px] uppercase text-muted-foreground/60">hidden</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.artist_name || "Unknown"}</p>
                  </div>
                  {/* Difficulty selector */}
                  <select
                    value={diff || ""}
                    onChange={(e) => setDifficulty(t.id, (e.target.value as Difficulty) || null)}
                    className={`text-[9px] h-6 rounded border px-1 bg-background/50 cursor-pointer outline-none ${diff ? DIFF[diff].cls : "border-border text-muted-foreground"}`}
                    title="Set difficulty"
                  >
                    <option value="">— diff</option>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{DIFF[d].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => togglePriority(t)}
                    title={t.is_priority ? "Unfeature" : "Feature"}
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${t.is_priority ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t.is_priority ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                  </button>
                  <button
                    onClick={() => toggleFeatured(t)}
                    title={t.is_featured ? "Hide from picker" : "Show in picker"}
                    className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    {t.is_featured ? <StarOff size={14} /> : <Star size={14} />}
                  </button>
                  <button
                    onClick={() => removeTrack(t.id)}
                    className="w-7 h-7 rounded-md text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ MANUAL UPLOAD ============================ */
function ManualUploadForm({ onAdded }: { onAdded: () => void }) {
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!songName.trim()) return toast.error("Song name is required");
    if (!audioFile) return toast.error("Audio file is required");

    setUploading(true);
    try {
      setProgress("Uploading audio…");
      const audioUrl = await uploadFileToBunny(audioFile, "radio-tracks/audio");

      let coverUrl: string | null = null;
      if (coverFile) {
        setProgress("Uploading cover…");
        coverUrl = await uploadFileToBunny(coverFile, "radio-tracks/covers");
      }

      setProgress("Saving to library…");
      const { error } = await supabase.from("radio_tracks").insert({
        song_name: songName.trim(),
        artist_name: artistName.trim() || null,
        audio_url: audioUrl,
        preview_url: audioUrl,
        cover_url: coverUrl,
        deezer_id: null,
        is_featured: true,
        difficulty: difficulty || null,
      } as any);
      if (error) throw error;

      toast.success(`"${songName.trim()}" added to library`);
      onAdded();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border p-3 space-y-2 bg-background/30">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Song Name *</Label>
          <Input
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="e.g. Deep Frequency"
            className="h-8 text-xs mt-0.5"
            disabled={uploading}
          />
        </div>
        <div>
          <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Artist</Label>
          <Input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Optional"
            className="h-8 text-xs mt-0.5"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Difficulty</Label>
        <div className="flex gap-1.5 mt-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              disabled={uploading}
              onClick={() => setDifficulty(difficulty === d ? "" : d)}
              className={`flex-1 text-[9px] font-semibold py-1 rounded border transition-all ${
                difficulty === d
                  ? DIFF[d].cls
                  : "border-border text-muted-foreground hover:border-border/60"
              }`}
            >
              {DIFF[d].label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio file */}
      <div>
        <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Audio File * (mp3, wav, m4a)</Label>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => audioInputRef.current?.click()}
          className={`mt-0.5 w-full h-9 rounded-md border border-dashed text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
            audioFile
              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
              : "border-border text-muted-foreground hover:border-border/60"
          }`}
        >
          <Music size={12} />
          {audioFile ? audioFile.name : "Choose audio file"}
        </button>
      </div>

      {/* Cover image */}
      <div>
        <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Cover Image (jpg, png, webp)</Label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => coverInputRef.current?.click()}
          className={`mt-0.5 w-full h-9 rounded-md border border-dashed text-[10px] flex items-center justify-center gap-1.5 transition-colors ${
            coverFile
              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
              : "border-border text-muted-foreground hover:border-border/60"
          }`}
        >
          <ImageIcon size={12} />
          {coverFile ? coverFile.name : "Choose cover image (optional)"}
        </button>
      </div>

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={uploading || !songName.trim() || !audioFile}
        className="w-full"
      >
        {uploading ? (
          <><Loader2 size={13} className="animate-spin mr-1.5" />{progress || "Uploading…"}</>
        ) : (
          <><Upload size={13} className="mr-1.5" />Upload Song</>
        )}
      </Button>
    </div>
  );
}

/* ============================ SCENEPACKS ============================ */
function ScenepacksManager() {
  const [packs, setPacks] = useState<ScenepackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    series: "",
    thumbnail_url: "",
    preview_video_url: "",
    scenepack_youtube_url: "",
    scenepack_gdrive_url: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scenepack_pool")
      .select("*")
      .order("active", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setPacks((data as any as ScenepackRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const { error } = await supabase.from("scenepack_pool").insert({
      title: form.title.trim(),
      series: form.series.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      preview_video_url: form.preview_video_url.trim() || null,
      scenepack_youtube_url: form.scenepack_youtube_url.trim() || null,
      scenepack_gdrive_url: form.scenepack_gdrive_url.trim() || null,
      active: true,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Scenepack added");
    setForm({ title: "", series: "", thumbnail_url: "", preview_video_url: "", scenepack_youtube_url: "", scenepack_gdrive_url: "" });
    load();
  };

  const toggleActive = async (p: ScenepackRow) => {
    const next = !p.active;
    const { error } = await supabase.from("scenepack_pool").update({ active: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    setPacks((arr) => arr.map((x) => (x.id === p.id ? { ...x, active: next } : x)));
  };

  const removePack = async (id: string) => {
    if (!confirm("Delete this scenepack? This cannot be undone.")) return;
    const { error } = await supabase.from("scenepack_pool").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPacks((arr) => arr.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-lg border border-border p-3 space-y-2 bg-background/30">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Add Scenepack</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Title (e.g. Bleach TYBW)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-8 text-xs" />
          <Input placeholder="Series (optional)" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} className="h-8 text-xs" />
        </div>
        <Input placeholder="Thumbnail URL" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="h-8 text-xs" />
        <Input placeholder="Preview video URL (mp4, loops in picker)" value={form.preview_video_url} onChange={(e) => setForm({ ...form, preview_video_url: e.target.value })} className="h-8 text-xs" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="YouTube download URL" value={form.scenepack_youtube_url} onChange={(e) => setForm({ ...form, scenepack_youtube_url: e.target.value })} className="h-8 text-xs" />
          <Input placeholder="Google Drive URL" value={form.scenepack_gdrive_url} onChange={(e) => setForm({ ...form, scenepack_gdrive_url: e.target.value })} className="h-8 text-xs" />
        </div>
        <Button size="sm" onClick={create} disabled={saving || !form.title.trim()} className="w-full">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} className="mr-1" /> Add Scenepack</>}
        </Button>
      </div>

      {/* List */}
      <div>
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Pool ({packs.length})
        </Label>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : packs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No scenepacks yet.</p>
        ) : (
          <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {packs.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted shrink-0 flex items-center justify-center">
                    <Film size={16} className="text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                    {p.title}
                    {!p.active && <span className="text-[8px] uppercase text-muted-foreground/60">inactive</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.series || "—"}</p>
                </div>
                {(p.scenepack_youtube_url || p.scenepack_gdrive_url) && (
                  <a
                    href={p.scenepack_youtube_url || p.scenepack_gdrive_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground flex items-center justify-center"
                    title="Open download link"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => toggleActive(p)}
                  className={`text-[10px] px-2 h-7 rounded-md border ${p.active ? "border-emerald-500/40 text-emerald-300" : "border-border text-muted-foreground"}`}
                >
                  {p.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => removePack(p.id)}
                  className="w-7 h-7 rounded-md text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
