import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActiveBattle {
  id: string;
  status: string;
  challenger_username: string;
  opponent_username: string | null;
  challenger_avatar_url: string | null;
  opponent_avatar_url: string | null;
  ends_at: string | null;
  challenger_id: string;
  opponent_id: string | null;
  is_rapid: boolean;
  judge_id: string | null;
}

export function useActiveBattles() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<ActiveBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setBattles([]);
      setLoading(false);
      return;
    }

    const fetchActive = async () => {
      const { data } = await supabase
        .from('battles')
        .select('id, status, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, ends_at, challenger_id, opponent_id, is_rapid, judge_id')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id},judge_id.eq.${user.id}`)
        .in('status', ['pending', 'active', 'judging'])
        .order('created_at', { ascending: false });

      setBattles((data as ActiveBattle[]) || []);
      setLoading(false);
    };

    fetchActive();

    // Real-time updates
    const channel = supabase
      .channel('my_active_battles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => {
        fetchActive();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return { activeBattles: battles, hasActiveBattle: battles.length > 0, loading };
}
