import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  user_id: string | null;
  username: string;
  avatar_url: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export function useActivityFeed(limit: number = 20) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setActivities(data as ActivityItem[]);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-feed-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_feed'
      }, (payload) => {
        const newActivity = payload.new as ActivityItem;
        setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivities, limit]);

  return { activities, loading, refetch: fetchActivities };
}
