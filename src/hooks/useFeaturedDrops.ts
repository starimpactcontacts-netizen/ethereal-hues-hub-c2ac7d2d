import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedArtist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  genre: string;
  social_links: Record<string, string>;
  is_active: boolean;
  created_at: string;
}

export interface FeaturedDrop {
  id: string;
  artist_id: string;
  title: string;
  song_name: string;
  song_url: string | null;
  song_preview_url: string | null;
  poster_url: string | null;
  description: string | null;
  status: 'draft' | 'live' | 'judging' | 'closed';
  starts_at: string | null;
  ends_at: string | null;
  xp_reward: number;
  index_reward: number;
  mystery_reward_label: string;
  submission_count: number;
  top_score: number;
  top_scorer_id: string | null;
  top_scorer_username: string | null;
  random_pick_id: string | null;
  random_pick_username: string | null;
  created_at: string;
  // Joined
  artist?: FeaturedArtist;
}

export interface FeaturedSubmission {
  id: string;
  drop_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  status: 'pending' | 'scored' | 'rejected';
  qoi_score: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  feedback: string | null;
  judge_id: string | null;
  judge_username: string | null;
  xp_awarded: number;
  index_awarded: number;
  judged_at: string | null;
  created_at: string;
}

// Fetch active/live featured drops with artist info
export function useFeaturedDrops() {
  const [drops, setDrops] = useState<FeaturedDrop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrops = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('*, featured_artists(*)')
        .in('status', ['live', 'judging', 'closed'])
        .order('created_at', { ascending: false });

      if (data) {
        setDrops(data.map((d: any) => ({
          ...d,
          artist: d.featured_artists,
        })));
      }
      setLoading(false);
    };

    fetchDrops();

    // Realtime
    const channel = supabase
      .channel('featured-drops-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_drops' }, () => fetchDrops())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_submissions' }, () => fetchDrops())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const liveDrops = drops.filter(d => d.status === 'live');
  const closedDrops = drops.filter(d => d.status === 'closed' || d.status === 'judging');

  return { drops, liveDrops, closedDrops, loading };
}

// Fetch submissions for a specific drop
export function useDropSubmissions(dropId: string | null) {
  const [submissions, setSubmissions] = useState<FeaturedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dropId) { setSubmissions([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('featured_submissions')
        .select('*')
        .eq('drop_id', dropId)
        .order('qoi_score', { ascending: false, nullsFirst: false });

      setSubmissions((data as FeaturedSubmission[]) || []);
      setLoading(false);
    };

    fetch();

    const channel = supabase
      .channel(`drop-subs-${dropId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_submissions', filter: `drop_id=eq.${dropId}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

  return { submissions, loading };
}

// Fetch a single artist by slug
export function useFeaturedArtist(slug: string | undefined) {
  const [artist, setArtist] = useState<FeaturedArtist | null>(null);
  const [drops, setDrops] = useState<FeaturedDrop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    const fetch = async () => {
      const { data: artistData } = await supabase
        .from('featured_artists')
        .select('*')
        .eq('slug', slug)
        .single();

      if (artistData) {
        setArtist(artistData as FeaturedArtist);

        const { data: dropsData } = await supabase
          .from('featured_drops')
          .select('*')
          .eq('artist_id', artistData.id)
          .order('created_at', { ascending: false });

        setDrops((dropsData as FeaturedDrop[]) || []);
      }
      setLoading(false);
    };

    fetch();
  }, [slug]);

  return { artist, drops, loading };
}

// Admin: fetch ALL artists, drops, submissions
export function useAdminFeatured() {
  const [artists, setArtists] = useState<FeaturedArtist[]>([]);
  const [drops, setDrops] = useState<FeaturedDrop[]>([]);
  const [submissions, setSubmissions] = useState<FeaturedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [a, d, s] = await Promise.all([
      supabase.from('featured_artists').select('*').order('created_at', { ascending: false }),
      supabase.from('featured_drops').select('*, featured_artists(name, avatar_url)').order('created_at', { ascending: false }),
      supabase.from('featured_submissions').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    setArtists((a.data as FeaturedArtist[]) || []);
    setDrops((d.data || []).map((item: any) => ({
      ...item,
      artist: item.featured_artists,
    })) as FeaturedDrop[]);
    setSubmissions((s.data as FeaturedSubmission[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('admin-featured')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_artists' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_drops' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_submissions' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { artists, drops, submissions, loading, refresh: fetchAll };
}
