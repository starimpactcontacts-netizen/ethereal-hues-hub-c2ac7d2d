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
  rating: string | null;
  earned_cents: number;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export type SubmissionRating = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export const RATING_PAYOUTS: Record<SubmissionRating, number> = {
  S: 500,
  A: 300,
  B: 100,
  C: 0,
  D: 0,
  F: 0,
};

export const RATING_COLORS: Record<SubmissionRating, string> = {
  S: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  A: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  B: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
  C: 'text-muted-foreground bg-muted/30 border-border/30',
  D: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  F: 'text-red-400 bg-red-500/15 border-red-500/30',
};

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

  const rateSubmission = useCallback(async (submissionId: string, rating: SubmissionRating, feedback: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const earnedCents = RATING_PAYOUTS[rating];
    const status = rating === 'F' ? 'declined' : 'accepted';

    const { error } = await supabase
      .from('commission_submissions')
      .update({
        status,
        rating,
        earned_cents: earnedCents,
        feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      } as any)
      .eq('id', submissionId);

    if (error) throw error;
    await fetch();
  }, [fetch]);

  // Keep legacy reviewSubmission for backwards compat
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

  return { commission, submissions, loading, refresh: fetch, submitEdit, reviewSubmission, rateSubmission };
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  paypal_email: string;
  amount_cents: number;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useEditorEarnings() {
  const [earnings, setEarnings] = useState({ earnings_cents: 0, pending_withdrawal_cents: 0, withdrawn_cents: 0 });
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [profileRes, payoutsRes] = await Promise.all([
      supabase.from('profiles').select('earnings_cents, pending_withdrawal_cents, withdrawn_cents').eq('id', user.id).single(),
      supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setEarnings({
        earnings_cents: (profileRes.data as any).earnings_cents || 0,
        pending_withdrawal_cents: (profileRes.data as any).pending_withdrawal_cents || 0,
        withdrawn_cents: (profileRes.data as any).withdrawn_cents || 0,
      });
    }
    if (payoutsRes.data) setPayouts(payoutsRes.data as PayoutRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const requestPayout = useCallback(async (paypalEmail: string, amountCents: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, earnings_cents, pending_withdrawal_cents, withdrawn_cents')
      .eq('id', user.id)
      .single();

    const available = ((profile as any)?.earnings_cents || 0) - ((profile as any)?.pending_withdrawal_cents || 0) - ((profile as any)?.withdrawn_cents || 0);
    if (amountCents > available) throw new Error('Insufficient balance');

    const { error } = await supabase
      .from('payout_requests')
      .insert({
        user_id: user.id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url,
        paypal_email: paypalEmail,
        amount_cents: amountCents,
      } as any);

    if (error) throw error;

    // Update pending withdrawal
    await supabase
      .from('profiles')
      .update({ pending_withdrawal_cents: ((profile as any)?.pending_withdrawal_cents || 0) + amountCents } as any)
      .eq('id', user.id);

    await fetch();
  }, [fetch]);

  const availableBalance = earnings.earnings_cents - earnings.pending_withdrawal_cents - earnings.withdrawn_cents;

  return { earnings, payouts, loading, refresh: fetch, requestPayout, availableBalance };
}

export function usePayoutQueue() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setRequests(data as PayoutRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const reviewPayout = useCallback(async (requestId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const { error } = await supabase
      .from('payout_requests')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', requestId);

    if (error) throw error;

    // If approved (paid), move from pending to withdrawn
    if (status === 'approved') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_withdrawal_cents, withdrawn_cents')
        .eq('id', request.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            pending_withdrawal_cents: Math.max(0, ((profile as any).pending_withdrawal_cents || 0) - request.amount_cents),
            withdrawn_cents: ((profile as any).withdrawn_cents || 0) + request.amount_cents,
          } as any)
          .eq('id', request.user_id);
      }
    }

    // If rejected, release the pending amount
    if (status === 'rejected') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_withdrawal_cents')
        .eq('id', request.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            pending_withdrawal_cents: Math.max(0, ((profile as any).pending_withdrawal_cents || 0) - request.amount_cents),
          } as any)
          .eq('id', request.user_id);
      }
    }

    await fetch();
  }, [requests, fetch]);

  return { requests, loading, refresh: fetch, reviewPayout };
}
