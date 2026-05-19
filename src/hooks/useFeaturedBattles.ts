import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Battle } from './useBattles';

export function useFeaturedBattles(limit = 3) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchFeatured() {
      const { data } = await supabase
        .from('battles')
        .select('*')
        .eq('is_featured' as any, true)
        .eq('status', 'completed')
        .order('judged_at', { ascending: false })
        .limit(limit);
      if (mounted) {
        setBattles((data as Battle[]) || []);
        setLoading(false);
      }
    }

    fetchFeatured();

    const channel = supabase
      .channel('featured_battles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => fetchFeatured())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { featuredBattles: battles, loading };
}