import { useRef } from 'react';
import { Plus, Trash2, Globe, Lock, Radio, Loader2, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRadioTrack } from '@/hooks/useUserRadio';

interface MyRadioTabProps {
  tracks: UserRadioTrack[];
  loading: boolean;
  uploading: boolean;
  currentTrackId: string | null;
  isPlaying: boolean;
  isLoggedIn: boolean;
  onUpload: (file: File) => void;
  onPlay: (track: UserRadioTrack, index: number) => void;
  onDelete: (trackId: string, audioUrl: string) => void;
  onTogglePublic: (trackId: string, isPublic: boolean) => void;
}

export default function MyRadioTab({
  tracks, loading, uploading, currentTrackId, isPlaying, isLoggedIn,
  onUpload, onPlay, onDelete, onTogglePublic,
}: MyRadioTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) {
    return (
      <div className="p-6 text-center">
        <Music size={24} className="mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Sign in to create your own radio</p>
      </div>
    );
  }

  return (
    <div>
      {/* Upload button */}
      <div className="px-3 py-2 border-b border-border">
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.m4a,.wav,audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || tracks.length >= 25}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading...</>
          ) : (
            <><Plus size={14} /> Add Track ({tracks.length}/25)</>
          )}
        </button>
      </div>

      {/* Track list */}
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <Loader2 size={16} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-6 text-center">
            <Radio size={20} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-[10px] text-muted-foreground">Upload MP3s to build your radio</p>
          </div>
        ) : (
          tracks.map((track, i) => (
            <div
              key={track.id}
              className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${
                currentTrackId === track.id ? 'bg-emerald-500/10' : 'hover:bg-surface-1'
              }`}
            >
              <button
                onClick={() => onPlay(track, i)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left"
              >
                <div className="w-7 h-7 rounded-sm bg-surface-1 flex items-center justify-center shrink-0">
                  <Music size={12} className={currentTrackId === track.id ? 'text-emerald-500' : 'text-muted-foreground/50'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${currentTrackId === track.id ? 'text-emerald-400' : 'text-foreground'}`}>
                    {track.track_name}
                  </p>
                  {track.artist_name && (
                    <p className="text-[9px] text-muted-foreground truncate">{track.artist_name}</p>
                  )}
                </div>
                {currentTrackId === track.id && isPlaying && (
                  <div className="flex gap-[2px] items-end h-3 shrink-0">
                    {[0, 1, 2].map(b => (
                      <motion.div
                        key={b}
                        className="w-[2px] bg-emerald-500 rounded-full"
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }}
                      />
                    ))}
                  </div>
                )}
              </button>
              {/* Actions */}
              <button
                onClick={() => onTogglePublic(track.id, track.is_public)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={track.is_public ? 'Public — click to make private' : 'Private — click to make public'}
              >
                {track.is_public ? <Globe size={12} className="text-emerald-500" /> : <Lock size={12} />}
              </button>
              <button
                onClick={() => onDelete(track.id, track.audio_url)}
                className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
