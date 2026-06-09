import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VersusInspoBattle {
  id: string;
  creator_id: string;
  creator_username: string;
  creator_avatar_url: string | null;
  inspo_video_url: string;
  inspo_thumbnail_url: string | null;
  inspo_duration_sec: number | null;
  inspo_source_label: string | null;
  song_name: string;
  song_artist: string | null;
  title: string;
  caption: string | null;
  creator_submission_url: string | null;
  creator_submission_platform: string | null;
  creator_submission_thumbnail: string | null;
  status: 'editing' | 'voting' | 'decided' | 'cancelled';
  voting_started_at: string | null;
  voting_ends_at: string | null;
  creator_votes: number;
  inspo_votes: number;
  total_votes: number;
  winner: 'creator' | 'inspo' | 'tie' | null;
  rings_awarded: number;
  index_awarded: number;
  xp_awarded: number;
  views: number;
  created_at: string;
  updated_at: string;
}

const TABLE = 'versus_inspo_battles' as any;
const VOTES = 'versus_inspo_votes' as any;

export function useVersusInspoList(limit = 30) {
  const [battles, setBattles] = useState<VersusInspoBattle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    // best-effort: resolve any expired battles
    (supabase.rpc as any)('close_due_versus_inspo_battles').then(() => {});
    const { data } = await (supabase.from(TABLE) as any)
      .select('*')
      .in('status', ['voting', 'decided'])
      .order('created_at', { ascending: false })
      .limit(limit);
    setBattles((data || []) as VersusInspoBattle[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('versus_inspo_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'versus_inspo_battles' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  return { battles, loading, refetch: fetchAll };
}

export function useVersusInspoBattle(id: string | undefined) {
  const { user } = useAuth();
  const [battle, setBattle] = useState<VersusInspoBattle | null>(null);
  const [loading, setLoading] = useState(true);
  const [myVote, setMyVote] = useState<'creator' | 'inspo' | null>(null);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    const { data } = await (supabase.from(TABLE) as any).select('*').eq('id', id).maybeSingle();
    setBattle(data as VersusInspoBattle | null);
    setLoading(false);
  }, [id]);

  const fetchMyVote = useCallback(async () => {
    if (!id || !user) { setMyVote(null); return; }
    const { data } = await (supabase.from(VOTES) as any)
      .select('vote')
      .eq('battle_id', id)
      .eq('voter_id', user.id)
      .maybeSingle();
    setMyVote((data?.vote as any) || null);
  }, [id, user]);

  useEffect(() => {
    fetchOne();
    fetchMyVote();
    if (!id) return;
    const ch = supabase
      .channel(`versus_inspo_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'versus_inspo_battles', filter: `id=eq.${id}` }, () => fetchOne())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, fetchOne, fetchMyVote]);

  const vote = useCallback(async (side: 'creator' | 'inspo') => {
    if (!user || !id) return { ok: false, error: 'Not signed in' };
    const { error } = await (supabase.from(VOTES) as any).insert({
      battle_id: id,
      voter_id: user.id,
      vote: side,
    });
    if (error) return { ok: false, error: error.message };
    setMyVote(side);
    await fetchOne();
    return { ok: true };
  }, [id, user, fetchOne]);

  return { battle, loading, myVote, vote, refetch: fetchOne };
}

export function useMyVersusInspo() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<VersusInspoBattle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    if (!user) { setBattles([]); setLoading(false); return; }
    const { data } = await (supabase.from(TABLE) as any)
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    setBattles((data || []) as VersusInspoBattle[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMine(); }, [fetchMine]);
  return { battles, loading, refetch: fetchMine };
}

export async function createVersusInspoBattle(input: {
  creator_id: string;
  creator_username: string;
  creator_avatar_url: string | null;
  inspo_video_url: string;
  inspo_thumbnail_url?: string | null;
  inspo_source_label?: string | null;
  song_name: string;
  song_artist?: string | null;
  title: string;
  caption?: string | null;
}) {
  const { data, error } = await (supabase.from(TABLE) as any)
    .insert({ ...input, status: 'editing' })
    .select()
    .single();
  return { data: data as VersusInspoBattle | null, error };
}

export async function submitVersusInspoEdit(
  id: string,
  url: string,
  platform: string,
  thumbnail: string | null = null,
) {
  const now = new Date();
  const ends = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const { error } = await (supabase.from(TABLE) as any)
    .update({
      creator_submission_url: url,
      creator_submission_platform: platform,
      creator_submission_thumbnail: thumbnail,
      status: 'voting',
      voting_started_at: now.toISOString(),
      voting_ends_at: ends.toISOString(),
    })
    .eq('id', id);
  return { error };
}