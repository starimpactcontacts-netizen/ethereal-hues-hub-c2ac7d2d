import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LeagueApplication {
  id: string;
  user_id: string;
  target_league: string;
  current_wins: number;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeagueApplications() {
  const { user, profile } = useAuth();
  const [myApplication, setMyApplication] = useState<LeagueApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyApplication = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('league_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    setMyApplication((data && data.length > 0) ? data[0] as LeagueApplication : null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMyApplication(); }, [fetchMyApplication]);

  const applyForProLeague = async () => {
    if (!user || !profile) return;
    const wins = profile.total_wins || 0;
    if (wins < 2) {
      toast.error('You need at least 2 Arena wins to apply for Pro League');
      return;
    }
    const { error } = await supabase
      .from('league_applications')
      .insert({ user_id: user.id, target_league: 'pro', current_wins: wins });
    if (error) {
      if (error.code === '23505') toast.error('You already have a pending application');
      else toast.error('Failed to submit application');
      return;
    }
    toast.success('Pro League application submitted!');
    fetchMyApplication();
  };

  return { myApplication, loading, applyForProLeague, refetch: fetchMyApplication };
}

// Admin hook
export function useAdminLeagueApplications() {
  const [applications, setApplications] = useState<(LeagueApplication & { username?: string; avatar_url?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('league_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!data || data.length === 0) { setApplications([]); setLoading(false); return; }

    // Fetch profile info
    const userIds = [...new Set((data as LeagueApplication[]).map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    setApplications((data as LeagueApplication[]).map(a => ({
      ...a,
      username: profileMap.get(a.user_id)?.username,
      avatar_url: profileMap.get(a.user_id)?.avatar_url,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const reviewApplication = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('league_applications')
      .update({ status, admin_notes: notes || null, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error('Failed to update'); return; }

    // If approved, update user's league
    if (status === 'approved') {
      const app = applications.find(a => a.id === id);
      if (app) {
        await supabase.from('profiles').update({ league: app.target_league as 'open' | 'pro' | 'elite' }).eq('id', app.user_id);
        toast.success(`Promoted to ${app.target_league.toUpperCase()} League!`);
      }
    } else {
      toast.success('Application rejected');
    }
    fetchAll();
  };

  return { applications, loading, reviewApplication, refetch: fetchAll };
}
