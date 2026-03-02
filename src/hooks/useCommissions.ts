import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Commission {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  song_name: string | null;
  artist_name: string | null;
  payout_cents: number;
  max_slots: number;
  status: string;
  deadline: string | null;
  thumbnail_url: string | null;
  submission_count: number;
  accepted_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionSubmission {
  id: string;
  commission_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string | null;
  message: string | null;
  status: string;
  feedback: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCommissions(data as Commission[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCommission = useCallback(async (params: Partial<Commission>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('commissions')
      .insert({ ...params, created_by: user.id } as any)
      .select()
      .single();
    
    if (error) throw error;
    await fetch();
    return data;
  }, [fetch]);

  const updateCommission = useCallback(async (id: string, updates: Partial<Commission>) => {
    const { error } = await supabase
      .from('commissions')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { commissions, loading, refresh: fetch, createCommission, updateCommission };
}

export function useCommissionDetail(id: string | undefined) {
  const [commission, setCommission] = useState<Commission | null>(null);
  const [submissions, setSubmissions] = useState<CommissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [commRes, subRes] = await Promise.all([
      supabase.from('commissions').select('*').eq('id', id).single(),
      supabase.from('commission_submissions').select('*').eq('commission_id', id).order('created_at', { ascending: false }),
    ]);

    if (commRes.data) setCommission(commRes.data as Commission);
    if (subRes.data) setSubmissions(subRes.data as CommissionSubmission[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const submitEdit = useCallback(async (params: { submission_url: string; platform?: string; message?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('commission_submissions')
      .insert({
        commission_id: id,
        user_id: user.id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url,
        ...params,
      } as any);

    if (error) throw error;
    await fetch();
  }, [id, fetch]);

  const reviewSubmission = useCallback(async (submissionId: string, status: 'accepted' | 'declined', feedback: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('commission_submissions')
      .update({
        status,
        feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      } as any)
      .eq('id', submissionId);

    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { commission, submissions, loading, refresh: fetch, submitEdit, reviewSubmission };
}
