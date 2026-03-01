import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Star, StarOff, Loader2, Music, Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RadioTrack {
  id: string;
  song_name: string;
  artist_name: string | null;
  audio_url: string;
  cover_url: string | null;
  is_priority: boolean;
  track_order: number;
  created_at: string;
}

export default function RadioAdmin() {
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // For editing cover on existing tracks
  const editCoverRef = useRef<HTMLInputElement>(null);
  const [editingCoverTrackId, setEditingCoverTrackId] = useState<string | null>(null);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from('radio_tracks')
      .select('*')
      .order('is_priority', { ascending: false })
      .order('track_order', { ascending: true });
    setTracks((data as RadioTrack[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTracks(); }, []);

  const uploadCoverImage = async (file: File, prefix: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be under 5MB');
      return null;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `radio/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('track-covers').upload(path, file, { contentType: file.type });
    if (error) {
      toast.error('Cover upload failed');
      return null;
    }
    const { data: urlData } = supabase.storage.from('track-covers').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleUpload = async () => {
    if (!selectedFile || !songName.trim()) {
      toast.error('Song name and file are required');
      return;
    }

    setUploading(true);

    // Upload cover if selected
    let coverUrl: string | null = null;
    if (selectedCover) {
      coverUrl = await uploadCoverImage(selectedCover, 'cover');
      if (!coverUrl && selectedCover) {
        // Cover upload failed but we can continue without it
      }
    }

    const ext = selectedFile.name.split('.').pop() || 'mp3';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('radio-tracks')
      .upload(path, selectedFile, { contentType: selectedFile.type });

    if (uploadErr) {
      toast.error('Upload failed: ' + uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('radio-tracks').getPublicUrl(path);

    const { error: insertErr } = await supabase
      .from('radio_tracks')
      .insert({
        song_name: songName.trim(),
        artist_name: artistName.trim() || null,
        audio_url: urlData.publicUrl,
        cover_url: coverUrl,
        track_order: tracks.length,
      });

    if (insertErr) {
      toast.error('Failed to save track');
    } else {
      toast.success('Track added to LOOPGATE Radio');
      setSongName('');
      setArtistName('');
      setSelectedFile(null);
      setSelectedCover(null);
      setCoverPreview(null);
      setShowForm(false);
      fetchTracks();
    }
    setUploading(false);
  };

  const handleCoverSelect = (file: File | null) => {
    setSelectedCover(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  const handleEditCover = async (trackId: string, file: File) => {
    const coverUrl = await uploadCoverImage(file, 'cover');
    if (coverUrl) {
      await supabase.from('radio_tracks').update({ cover_url: coverUrl }).eq('id', trackId);
      toast.success('Cover art updated');
      fetchTracks();
    }
    setEditingCoverTrackId(null);
  };

  const deleteTrack = async (track: RadioTrack) => {
    const urlParts = track.audio_url.split('/radio-tracks/');
    if (urlParts[1]) {
      await supabase.storage.from('radio-tracks').remove([urlParts[1]]);
    }
    await supabase.from('radio_tracks').delete().eq('id', track.id);
    toast.success('Track removed');
    fetchTracks();
  };

  const togglePriority = async (track: RadioTrack) => {
    await supabase.from('radio_tracks').update({ is_priority: !track.is_priority }).eq('id', track.id);
    fetchTracks();
  };

  return (
    <section className="bg-surface-0 border border-border rounded-lg p-4 mb-6">
      {/* Hidden input for editing cover on existing tracks */}
      <input
        ref={editCoverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && editingCoverTrackId) handleEditCover(editingCoverTrackId, f);
          e.target.value = '';
        }}
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
          <Music size={14} />
          LOOPGATE Radio
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          <Plus size={14} /> Add Song
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-surface-1 rounded-lg border border-border space-y-3">
          <div>
            <Label className="text-xs">Song Name *</Label>
            <Input value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="e.g. Midnight Aura" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Artist Name</Label>
            <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="e.g. LOOPGATE" className="mt-1 h-8 text-sm" />
          </div>
          {/* Cover Art */}
          <div>
            <Label className="text-xs">Cover Art</Label>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleCoverSelect(e.target.files?.[0] || null)}
            />
            <div className="mt-1 flex items-center gap-3">
              {coverPreview ? (
                <div className="relative w-14 h-14 rounded-md overflow-hidden border border-border">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { handleCoverSelect(null); }}
                    className="absolute top-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-bl"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <button
                onClick={() => coverRef.current?.click()}
                className="flex items-center gap-2 flex-1 py-2 px-3 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-emerald-500/50 hover:text-foreground transition-colors"
              >
                <Image size={14} />
                {selectedCover ? 'Change cover' : 'Add cover image'}
              </button>
            </div>
          </div>
          {/* Audio file */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.m4a,.wav,audio/*"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 w-full py-2 px-3 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-emerald-500/50 hover:text-foreground transition-colors"
            >
              <Upload size={14} />
              {selectedFile ? selectedFile.name : 'Select audio file (MP3, M4A, WAV)'}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !songName.trim() || !selectedFile}
              className="flex-1 py-2 bg-emerald-500 text-black rounded-md text-xs font-bold disabled:opacity-40 hover:bg-emerald-400 transition-colors"
            >
              {uploading ? <><Loader2 size={12} className="inline animate-spin mr-1" /> Uploading...</> : 'Add to Radio'}
            </button>
            <button onClick={() => { setShowForm(false); setSelectedFile(null); setSelectedCover(null); setCoverPreview(null); }} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-4 text-center">
          <Loader2 size={16} className="mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : tracks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No radio tracks yet. Add some aura songs!</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-1 transition-colors">
              {/* Cover art thumbnail — clickable to change */}
              <button
                onClick={() => {
                  setEditingCoverTrackId(track.id);
                  editCoverRef.current?.click();
                }}
                className="w-8 h-8 rounded bg-surface-1 overflow-hidden shrink-0 border border-border hover:border-emerald-500/40 transition-colors"
                title="Click to change cover art"
              >
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={12} className={track.is_priority ? 'text-emerald-500' : 'text-muted-foreground/50'} />
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{track.song_name}</p>
                {track.artist_name && <p className="text-[9px] text-muted-foreground truncate">{track.artist_name}</p>}
              </div>
              {track.is_priority && (
                <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase">Priority</span>
              )}
              <button
                onClick={() => togglePriority(track)}
                className="p-1 text-muted-foreground hover:text-emerald-500 transition-colors"
                title={track.is_priority ? 'Remove priority' : 'Set as priority (plays first)'}
              >
                {track.is_priority ? <Star size={14} className="text-emerald-500 fill-emerald-500" /> : <StarOff size={14} />}
              </button>
              <button
                onClick={() => deleteTrack(track)}
                className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
