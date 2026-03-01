import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPlaylistTrack {
  id: string;
  user_id: string;
  track_name: string;
  artist_name: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_public: boolean;
  track_order: number;
  created_at: string;
}

export function useUserPlaylist(userId: string | null) {
  const [myTracks, setMyTracks] = useState<UserPlaylistTrack[]>([]);
  const [playlistName, setPlaylistName] = useState<string>('My Playlist');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch playlist name from profile
  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('playlist_name').eq('id', userId).single()
      .then(({ data }) => {
        if (data?.playlist_name) setPlaylistName(data.playlist_name);
      });
  }, [userId]);

  const renamePlaylist = useCallback(async (name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed || !userId) return;
    setPlaylistName(trimmed);
    await supabase.from('profiles').update({ playlist_name: trimmed }).eq('id', userId);
  }, [userId]);

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

  const uploadCover = useCallback(async (trackId: string, file: File) => {
    if (!userId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover must be under 5MB');
      return;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('track-covers').upload(path, file, { contentType: file.type });
    if (error) {
      toast.error('Cover upload failed');
      return;
    }
    const { data: urlData } = supabase.storage.from('track-covers').getPublicUrl(path);
    await supabase.from('user_radio_tracks').update({ cover_url: urlData.publicUrl }).eq('id', trackId);
    toast.success('Cover art updated');
    fetchTracks();
  }, [userId, fetchTracks]);

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

  return { myTracks, loading, uploading, playlistName, renamePlaylist, uploadTrack, uploadCover, deleteTrack, togglePublic, refetch: fetchTracks };
}

/** Fetch public playlists from other users */
export function useCuratedPlaylists() {
  const [playlists, setPlaylists] = useState<{ user_id: string; username: string; avatar_url: string | null; playlist_name: string | null; tracks: UserPlaylistTrack[] }[]>([]);
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
        .select('id, username, avatar_url, playlist_name')
        .in('id', userIds);

      const profileMap: Record<string, { username: string; avatar_url: string | null; playlist_name: string | null }> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url, playlist_name: (p as any).playlist_name };
      }

      const result = userIds.map(uid => ({
        user_id: uid,
        username: profileMap[uid]?.username || 'Unknown',
        avatar_url: profileMap[uid]?.avatar_url || null,
        playlist_name: profileMap[uid]?.playlist_name || null,
        tracks: grouped[uid],
      }));

      setPlaylists(result);
      setLoading(false);
    };
    fetch();
  }, []);

  return { playlists, loading };
}
