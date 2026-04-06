import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MissionType = 'artist' | 'brand' | 'film' | 'standard';

export interface MarketplaceBounty {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  requirements: string | null;
  song_name: string | null;
  artist_name: string | null;
  payout_cents: number;
  platform_fee_cents: number;
  max_slots: number;
  status: string;
  deadline: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  submission_count: number;
  accepted_count: number;
  poster_username: string | null;
  poster_avatar_url: string | null;
  poster_rating_avg: number;
  poster_rating_count: number;
  custom_payouts: Record<string, number> | null;
  bounty_type: string;
  is_marketplace: boolean;
  reference_urls: string[] | null;
  mission_type: MissionType;
  client_name: string | null;
  reference_video_url: string | null;
  created_at: string;
}

const PLATFORM_FEE_RATE = 0.10;
const MIN_BOUNTY_CENTS = 500;

export function useBountyMarketplace() {
  const [bounties, setBounties] = useState<MarketplaceBounty[]>([]);
  const [myBounties, setMyBounties] = useState<MarketplaceBounty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('commissions')
      .select('*')
      .eq('is_marketplace', true)
      .order('created_at', { ascending: false });

    if (data) setBounties(data as unknown as MarketplaceBounty[]);
    setLoading(false);
  }, []);

  const fetchMine = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('commissions')
      .select('*')
      .eq('is_marketplace', true)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (data) setMyBounties(data as unknown as MarketplaceBounty[]);
  }, []);

  useEffect(() => { fetchAll(); fetchMine(); }, [fetchAll, fetchMine]);

  const createBounty = useCallback(async (params: {
    title: string;
    description?: string;
    requirements?: string;
    artist_name?: string;
    song_name?: string;
    payout_cents: number;
    max_slots?: number;
    deadline?: string;
    cover_url?: string;
    custom_payouts?: Record<string, number>;
    reference_urls?: string[];
    mission_type?: MissionType;
    client_name?: string;
    reference_video_url?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (params.payout_cents < MIN_BOUNTY_CENTS) {
      throw new Error('Minimum bounty is $5');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    const feeCents = Math.round(params.payout_cents * PLATFORM_FEE_RATE);

    const { data, error } = await supabase
      .from('commissions')
      .insert({
        created_by: user.id,
        title: params.title,
        description: params.description || null,
        requirements: params.requirements || null,
        artist_name: params.artist_name || null,
        song_name: params.song_name || null,
        payout_cents: params.payout_cents,
        platform_fee_cents: feeCents,
        max_slots: params.max_slots || 3,
        deadline: params.deadline || null,
        cover_url: params.cover_url || null,
        thumbnail_url: params.cover_url || null,
        custom_payouts: params.custom_payouts || null,
        reference_urls: params.reference_urls || null,
        poster_username: profile?.username || 'Unknown',
        poster_avatar_url: profile?.avatar_url || null,
        is_marketplace: true,
        bounty_type: 'standard',
        mission_type: params.mission_type || 'standard',
        client_name: params.client_name || null,
        reference_video_url: params.reference_video_url || null,
        status: 'open',
      } as any)
      .select()
      .single();

    if (error) throw error;
    await Promise.all([fetchAll(), fetchMine()]);
    return data;
  }, [fetchAll, fetchMine]);

  const updateBounty = useCallback(async (id: string, updates: Partial<MarketplaceBounty>) => {
    const { error } = await supabase
      .from('commissions')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await Promise.all([fetchAll(), fetchMine()]);
  }, [fetchAll, fetchMine]);

  const closeBounty = useCallback(async (id: string) => {
    await updateBounty(id, { status: 'closed' } as any);
  }, [updateBounty]);

  const openBounties = bounties.filter(b => b.status === 'open' && b.accepted_count < b.max_slots);

  return {
    bounties,
    myBounties,
    openBounties,
    loading,
    refresh: fetchAll,
    createBounty,
    updateBounty,
    closeBounty,
    PLATFORM_FEE_RATE,
    MIN_BOUNTY_CENTS,
  };
}
