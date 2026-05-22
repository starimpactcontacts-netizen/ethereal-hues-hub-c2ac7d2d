import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { QuickFight } from './useQuickFight';

/**
 * Featured Edit Battles = quick_fights flagged is_featured by admin.
 * Pulls live/waiting/judging/completed so Hub shows real recent matchups.
 */
export function useFeaturedBattles(limit = 3) {
  const [fights, setFights] = useState<QuickFight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchFeatured() {
      const { data } = await (supabase.from('quick_fights') as any)
        .select('*')
        .eq('is_featured', true)
        .not('status', 'in', '(forfeited,cancelled)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (mounted) {
        setFights((data as QuickFight[]) || []);
        setLoading(false);
      }
    }

    fetchFeatured();

    const channel = supabase
      .channel('featured_quick_fights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetchFeatured())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { featuredBattles: fights, loading };
}