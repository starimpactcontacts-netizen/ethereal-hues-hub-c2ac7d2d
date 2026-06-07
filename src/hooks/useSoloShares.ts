import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SoloShare {
  id: string;
  user_id: string;
  slug: string;
  username: string;
  avatar_url: string | null;
  video_url: string;
  platform: string;
  title: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  total_ratings: number;
  avg_rating: number;
  rings_earned: number;
  views: number;
  is_active: boolean;
  created_at: string;
  timer_minutes?: number | null;
  started_at?: string | null;
  deadline_at?: string | null;
  is_overtime?: boolean;
  start_offset_seconds?: number;
  song_name?: string | null;
  scenepack_url?: string | null;
}

export interface SoloShareRating {
  id: string;
  share_id: string;
  rater_user_id: string | null;
  rater_nickname: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
}

function randomSlug(len = 7) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function hashIp(seed: string) {
  // Coarse client-side fingerprint hash — not used for security, just dedupe
  const data = new TextEncoder().encode(seed);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function getOrCreateFingerprint(): string {
  const key = 'lg_fp';
  let v = localStorage.getItem(key);
  if (!v) {
    v = `${Date.now()}-${Math.random().toString(36).slice(2)}-${navigator.userAgent.slice(0, 32)}`;
    localStorage.setItem(key, v);
  }
  return v;
}

export function useMySoloShares() {
  const { user } = useAuth();
  const [shares, setShares] = useState<SoloShare[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setShares([]); setLoading(false); return; }
    const { data } = await supabase
      .from('solo_shares' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setShares((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);
  return { shares, loading, refetch };
}

export function useLatestSoloShares(limit = 12) {
  const [shares, setShares] = useState<SoloShare[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from('solo_shares' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    setShares((data as any) || []);
    setLoading(false);
  }, [limit]);

  useEffect(() => { refetch(); }, [refetch]);
  return { shares, loading, refetch };
}

export function useSoloShareBySlug(slug: string | undefined) {
  const [share, setShare] = useState<SoloShare | null>(null);
  const [ratings, setRatings] = useState<SoloShareRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('solo_shares' as any)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setShare(data as any);
    const { data: r } = await supabase
      .from('solo_share_ratings' as any)
      .select('*')
      .eq('share_id', (data as any).id)
      .order('created_at', { ascending: false });
    setRatings((r as any) || []);
    setLoading(false);
  }, [slug]);

  useEffect(() => { refetch(); }, [refetch]);

  return { share, ratings, loading, notFound, refetch };
}

export async function createSoloShare(input: {
  user_id: string;
  username: string;
  avatar_url: string | null;
  video_url: string;
  platform: string;
  title?: string | null;
  caption?: string | null;
  timer_minutes?: number | null;
  started_at?: string | null;
  deadline_at?: string | null;
  is_overtime?: boolean;
  start_offset_seconds?: number;
  song_name?: string | null;
  scenepack_url?: string | null;
  thumbnail_url?: string | null;
}): Promise<SoloShare | null> {
  // Try a few times in case of slug collision
  for (let i = 0; i < 5; i++) {
    const slug = randomSlug();
    const { data, error } = await supabase
      .from('solo_shares' as any)
      .insert({ ...input, slug })
      .select()
      .single();
    if (!error && data) return data as any;
    if (error && !`${error.message}`.toLowerCase().includes('duplicate')) return null;
  }
  return null;
}

export async function submitSoloShareRating(input: {
  share_id: string;
  stars: number;
  comment?: string | null;
  rater_nickname?: string | null;
  rater_user_id?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const fp = getOrCreateFingerprint();
  const rater_ip_hash = await hashIp(fp + ':' + input.share_id);
  const { error } = await supabase
    .from('solo_share_ratings' as any)
    .insert({
      share_id: input.share_id,
      stars: input.stars,
      comment: input.comment || null,
      rater_nickname: input.rater_nickname || null,
      rater_user_id: input.rater_user_id || null,
      rater_ip_hash,
    });
  if (error) {
    if (`${error.message}`.toLowerCase().includes('duplicate')) {
      return { ok: false, error: 'You already rated this edit.' };
    }
    if (`${error.code}` === '42501' || `${error.message}`.toLowerCase().includes('row-level')) {
      return { ok: false, error: "You can't rate your own edit." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}