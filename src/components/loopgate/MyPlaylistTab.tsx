import { useRef, useState } from 'react';
import { Plus, Trash2, Globe, Lock, Loader2, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserPlaylistTrack } from '@/hooks/useUserPlaylist';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MyPlaylistTabProps {
  tracks: UserPlaylistTrack[];
  loading: boolean;
  uploading: boolean;
  currentTrackId: string | null;
  isPlaying: boolean;
  isLoggedIn: boolean;
  onUpload: (file: File) => void;
  onPlay: (track: UserPlaylistTrack, index: number) => void;
  onDelete: (trackId: string, audioUrl: string) => void;
  onTogglePublic: (trackId: string, isPublic: boolean) => void;
  onUploadCover?: (trackId: string, file: File) => void;
  compact?: boolean;
}

export default function MyPlaylistTab({
  tracks, loading, uploading, currentTrackId, isPlaying, isLoggedIn,
  onUpload, onPlay, onDelete, onTogglePublic, onUploadCover, compact = true,
}: MyPlaylistTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [confirmTrack, setConfirmTrack] = useState<{ id: string; isPublic: boolean } | null>(null);
  const [coverTrackId, setCoverTrackId] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="p-8 text-center">
        <Music size={28} className="mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Sign in to create your own playlist</p>
      </div>
    );
  }

  return (
    <div>
      <AlertDialog open={!!confirmTrack} onOpenChange={(open) => !open && setConfirmTrack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTrack?.isPublic ? 'Make Private?' : 'Make Public?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTrack?.isPublic
                ? 'This track will be removed from curated playlists and only you will be able to hear it.'
                : 'This track will be visible in curated playlists and anyone on LOOPGATE can listen to it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmTrack) { onTogglePublic(confirmTrack.id, confirmTrack.isPublic); setConfirmTrack(null); } }}>
              {confirmTrack?.isPublic ? 'Make Private' : 'Make Public'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && coverTrackId && onUploadCover) onUploadCover(coverTrackId, f);
          setCoverTrackId(null);
          e.target.value = '';
        }}
      />

      {/* Upload button — big touch target */}
      <div className="px-3 py-3 border-b border-border">
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
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40 active:bg-surface-1 min-h-[48px]"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> Uploading...</>
          ) : (
            <><Plus size={16} /> Add Track ({tracks.length}/25)</>
          )}
        </button>
      </div>

      {/* Track list */}
      <div className={compact ? 'max-h-48 overflow-y-auto overscroll-contain' : 'overscroll-contain'}>
        {loading ? (
          <div className="p-6 text-center">
            <Loader2 size={18} className="mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-8 text-center">
            <Music size={24} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Upload MP3s to build your playlist</p>
          </div>
        ) : (
          tracks.map((track, i) => (
            <div
              key={track.id}
              className={`w-full flex items-center gap-3 px-3 py-3 transition-colors ${
                currentTrackId === track.id ? 'bg-emerald-500/10' : 'hover:bg-surface-1'
              }`}
            >
              {/* Cover art — bigger tap target */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onUploadCover) { setCoverTrackId(track.id); coverRef.current?.click(); }
                }}
                className="w-11 h-11 rounded-lg bg-surface-1 overflow-hidden shrink-0 border border-border hover:border-emerald-500/40 transition-colors active:scale-95"
                title="Click to set cover art"
              >
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={14} className={currentTrackId === track.id ? 'text-emerald-500' : 'text-muted-foreground/50'} />
                  </div>
                )}
              </button>
              <button
                onClick={() => onPlay(track, i)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left py-1"
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${currentTrackId === track.id ? 'text-emerald-400' : 'text-foreground'}`}>
                    {track.track_name}
                  </p>
                  {track.artist_name && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist_name}</p>
                  )}
                </div>
                {currentTrackId === track.id && isPlaying && (
                  <div className="flex gap-[2px] items-end h-4 shrink-0">
                    {[0, 1, 2].map(b => (
                      <motion.div key={b} className="w-[3px] bg-emerald-500 rounded-full"
                        animate={{ height: ['5px', '16px', '5px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />
                    ))}
                  </div>
                )}
              </button>
              {/* Actions — bigger tap targets */}
              <button
                onClick={() => setConfirmTrack({ id: track.id, isPublic: track.is_public })}
                className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg active:bg-surface-1"
                title={track.is_public ? 'Public — click to make private' : 'Private — click to make public'}
              >
                {track.is_public ? <Globe size={16} className="text-emerald-500" /> : <Lock size={16} />}
              </button>
              <button
                onClick={() => onDelete(track.id, track.audio_url)}
                className="p-2.5 text-muted-foreground hover:text-red-400 transition-colors rounded-lg active:bg-surface-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
