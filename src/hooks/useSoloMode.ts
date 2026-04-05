import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const SOLO_THEMES = [
  "Sad Edit", "Hype Edit", "Dark Edit", "Chill Edit",
  "Anime Edit", "Horror Edit", "Love Edit", "Action Edit",
  "Revenge Edit", "Villain Edit", "Heartbreak Edit", "Rage Edit",
  "Nostalgia Edit", "Motivational Edit", "Psycho Edit", "Betrayal Edit",
  "Flex Edit", "Emotional Edit", "Peaceful Edit", "Chaotic Edit",
];

export function getRandomTheme(): string {
  return SOLO_THEMES[Math.floor(Math.random() * SOLO_THEMES.length)];
}

export interface SoloSubmission {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  drop_id: string | null;
  song_name: string;
  artist_name: string | null;
  theme: string;
  submission_url: string | null;
  submission_platform: string | null;
  thumbnail_url: string | null;
  video_title: string | null;
  submitted_at: string | null;
  judge_id: string | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  qoi_score: number | null;
  judge_notes: string | null;
  judged_at: string | null;
  index_awarded: number;
  is_disqualified: boolean;
  disqualify_reason: string | null;
  status: string;
  created_at: string;
}

export function useSoloMode() {
  const { user, profile } = useAuth();
  const [activeSolo, setActiveSolo] = useState<SoloSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('solo_submissions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['picking_song', 'editing', 'submitted', 'judging'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveSolo(data as SoloSubmission | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const startSolo = useCallback(async (drop: { id: string | null; song_name: string; artist?: { name: string } | null }) => {
    if (!user || !profile) return null;
    const theme = getRandomTheme();
    const { data, error } = await supabase
      .from('solo_submissions')
      .insert({
        user_id: user.id,
        username: profile.username || 'Unknown',
        avatar_url: profile.avatar_url || null,
        drop_id: (drop.id && drop.id !== 'skip') ? drop.id : null,
        song_name: drop.song_name,
        artist_name: drop.artist?.name || null,
        theme,
        status: 'editing',
      })
      .select()
      .single();
    if (!error && data) {
      setActiveSolo(data as SoloSubmission);
      return data as SoloSubmission;
    }
    return null;
  }, [user, profile]);

  const submitEdit = useCallback(async (soloId: string, url: string, platform: string) => {
    const { error } = await supabase
      .from('solo_submissions')
      .update({
        submission_url: url,
        submission_platform: platform,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', soloId);
    if (!error) await fetchActive();
    return !error;
  }, [fetchActive]);

  const cancelSolo = useCallback(async (soloId: string) => {
    if (!user) {
      return { success: false, penalized: false, cancelCount: 0 };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('solo_cancel_count, global_index_score, spendable_index')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, penalized: false, cancelCount: 0 };
    }

    const cancelCount = (profileData as any)?.solo_cancel_count || 0;

    // Mark all current active solos as cancelled to guarantee they no longer appear as active
    const { data: cancelledRows, error: cancelError } = await supabase
      .from('solo_submissions')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .in('status', ['picking_song', 'editing', 'submitted', 'judging'])
      .select('id');

    if (cancelError || !cancelledRows || cancelledRows.length === 0) {
      await fetchActive();
      return { success: false, penalized: false, cancelCount };
    }

    const { error: countError } = await supabase
      .from('profiles')
      .update({ solo_cancel_count: cancelCount + 1 } as any)
      .eq('id', user.id);

    if (countError) {
      await fetchActive();
      return { success: false, penalized: false, cancelCount };
    }

    const penalized = cancelCount >= 1;

    if (penalized) {
      const currentGlobal = (profileData as any)?.global_index_score || 0;
      const currentSpendable = (profileData as any)?.spendable_index || 0;
      await supabase
        .from('profiles')
        .update({
          global_index_score: Math.max(0, currentGlobal - 2),
          spendable_index: Math.max(0, currentSpendable - 2),
        } as any)
        .eq('id', user.id);
    }

    setActiveSolo(null);
    await fetchActive();
    return { success: true, penalized, cancelCount: cancelCount + 1 };
  }, [user, fetchActive]);

  return { activeSolo, loading, startSolo, submitEdit, cancelSolo, refetch: fetchActive };
}

export function useSoloLeaderboard(dropId: string | null) {
  const [entries, setEntries] = useState<SoloSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dropId) { setEntries([]); setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('solo_submissions')
        .select('*')
        .eq('drop_id', dropId)
        .eq('status', 'scored')
        .order('qoi_score', { ascending: false })
        .limit(50);
      setEntries((data || []) as SoloSubmission[]);
      setLoading(false);
    };
    fetch();
  }, [dropId]);

  return { entries, loading };
}
