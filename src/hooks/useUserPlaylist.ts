import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPlaylistTrack {
  id: string;
  user_id: string;
  track_name: string;
  artist_name: string | null;
  audio_url: string;
  duration_seconds: number | null;
  is_public: boolean;
  track_order: number;
  created_at: string;
}

export function useUserPlaylist(userId: string | null) {
  const [myTracks, setMyTracks] = useState<UserPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchTracks = useCallback(async () => {
    if (!userId) { setMyTracks([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('user_radio_tracks')
      .select('*')
      .eq('user_id', userId)
      .order('track_order', { ascending: true });
    setMyTracks((data as UserPlaylistTrack[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const uploadTrack = useCallback(async (file: File) => {
    if (!userId) { toast.error('Sign in to upload tracks'); return; }
    if (myTracks.length >= 25) { toast.error('Max 25 tracks — delete one first'); return; }

    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav)$/i)) {
      toast.error('Only MP3, M4A, or WAV files');
      return;
    }
    if (file.size > 15 * 1024 * 1024) { toast.error('Max 15MB per file'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'mp3';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('user-radio')
      .upload(path, file, { contentType: file.type });

    if (uploadErr) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('user-radio').getPublicUrl(path);
    const trackName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

    const { error: insertErr } = await supabase
      .from('user_radio_tracks')
      .insert({
        user_id: userId,
        track_name: trackName,
        audio_url: urlData.publicUrl,
        track_order: myTracks.length,
      });

    if (insertErr) {
      toast.error(insertErr.message.includes('25') ? 'Max 25 tracks reached' : 'Failed to save track');
    } else {
      toast.success('Track added to My Playlist');
      fetchTracks();
    }
    setUploading(false);
  }, [userId, myTracks.length, fetchTracks]);

  const deleteTrack = useCallback(async (trackId: string, audioUrl: string) => {
    const urlParts = audioUrl.split('/user-radio/');
    if (urlParts[1]) {
      await supabase.storage.from('user-radio').remove([urlParts[1]]);
    }
    await supabase.from('user_radio_tracks').delete().eq('id', trackId);
    fetchTracks();
    toast.success('Track removed');
  }, [fetchTracks]);

  const togglePublic = useCallback(async (trackId: string, currentPublic: boolean) => {
    await supabase
      .from('user_radio_tracks')
      .update({ is_public: !currentPublic })
      .eq('id', trackId);
    fetchTracks();
  }, [fetchTracks]);

  return { myTracks, loading, uploading, uploadTrack, deleteTrack, togglePublic, refetch: fetchTracks };
}

/** Fetch public playlists from other users */
export function useCuratedPlaylists() {
  const [playlists, setPlaylists] = useState<{ user_id: string; username: string; avatar_url: string | null; tracks: UserPlaylistTrack[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get all public tracks grouped by user
      const { data: tracks } = await supabase
        .from('user_radio_tracks')
        .select('*')
        .eq('is_public', true)
        .order('track_order', { ascending: true })
        .limit(200);

      if (!tracks || tracks.length === 0) {
        setPlaylists([]);
        setLoading(false);
        return;
      }

      // Group by user_id
      const grouped: Record<string, UserPlaylistTrack[]> = {};
      for (const t of tracks as UserPlaylistTrack[]) {
        if (!grouped[t.user_id]) grouped[t.user_id] = [];
        grouped[t.user_id].push(t);
      }

      // Fetch usernames
      const userIds = Object.keys(grouped);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
      }

      const result = userIds.map(uid => ({
        user_id: uid,
        username: profileMap[uid]?.username || 'Unknown',
        avatar_url: profileMap[uid]?.avatar_url || null,
        tracks: grouped[uid],
      }));

      setPlaylists(result);
      setLoading(false);
    };
    fetch();
  }, []);

  return { playlists, loading };
}
