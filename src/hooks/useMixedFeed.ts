import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Unified feed item types
export type FeedItemType = 
  | 'edit_drop' 
  | 'judge_reaction' 
  | 'arena_event' 
  | 'rank_moment' 
  | 'crew_activity';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  created_at: string;
  
  // User info (for edit_drop, rank_moment)
  user_id?: string;
  username?: string;
  avatar_url?: string | null;
  
  // Edit drop specific
  submission_url?: string;
  platform?: string;
  qoi_score?: number | null;
  index_score?: number;
  event_title?: string;
  event_id?: string;
  
  // Crew info
  crew_id?: string;
  crew_name?: string;
  crew_emblem?: string;
  
  // Arena/event info
  arena_name?: string;
  arena_status?: string;
  
  // Generic content
  title: string;
  description?: string;
  data?: Record<string, unknown>;
}

export function useMixedFeed(limit: number = 30) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      // Fetch multiple data sources in parallel
      const [
        submissionsRes,
        activityRes,
        eventsRes,
      ] = await Promise.all([
        // Recent submissions (edit drops)
        supabase
          .from('round_participations')
          .select('id, user_id, event_id, submission_url, platform, qoi_score, submitted_at')
          .not('submission_url', 'is', null)
          .order('submitted_at', { ascending: false })
          .limit(15),
        
        // Activity feed (rank changes, judge reactions, etc.)
        supabase
          .from('activity_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15),
        
        // Live/recent events (arena events)
        supabase
          .from('events')
          .select('id, title, status, start_date, end_date, league')
          .in('status', ['live', 'closed'])
          .order('start_date', { ascending: false })
          .limit(5),
      ]);

      const submissions = submissionsRes.data || [];
      const activities = activityRes.data || [];
      const events = eventsRes.data || [];

      // Get user profiles for submissions
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      const eventIds = [...new Set([...submissions.map(s => s.event_id), ...events.map(e => e.id)])];
      
      const [profilesRes, eventDetailsRes] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('profiles').select('id, username, avatar_url, global_index_score, crew_id').in('id', userIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase.from('events').select('id, title').in('id', eventIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventDetailsRes.data || []).map(e => [e.id, e]));

      // Transform submissions to edit drops
      const editDrops: FeedItem[] = submissions.map(s => {
        const profile = profileMap.get(s.user_id);
        const event = eventMap.get(s.event_id);
        return {
          id: `edit_${s.id}`,
          type: 'edit_drop' as const,
          created_at: s.submitted_at || new Date().toISOString(),
          user_id: s.user_id,
          username: profile?.username || 'editor',
          avatar_url: profile?.avatar_url,
          submission_url: s.submission_url!,
          platform: s.platform || 'tiktok',
          qoi_score: s.qoi_score,
          index_score: profile?.global_index_score || 0,
          event_id: s.event_id,
          event_title: event?.title || 'Arena',
          title: `New edit from @${profile?.username || 'editor'}`,
        };
      });

      // Transform activities
      const feedActivities: FeedItem[] = activities.map(a => {
        let type: FeedItemType = 'rank_moment';
        
        if (a.activity_type === 'review_received' || a.activity_type === 'judge_milestone') {
          type = 'judge_reaction';
        } else if (a.activity_type === 'rank_change' || a.activity_type === 's_class_score') {
          type = 'rank_moment';
        } else if (a.activity_type === 'arena_win') {
          type = 'arena_event';
        } else if (a.activity_type?.includes('crew')) {
          type = 'crew_activity';
        }

        return {
          id: `activity_${a.id}`,
          type,
          created_at: a.created_at,
          user_id: a.user_id,
          username: a.username,
          avatar_url: a.avatar_url,
          title: a.title,
          description: a.description,
          data: a.data as Record<string, unknown>,
        };
      });

      // Transform events to arena events
      const arenaEvents: FeedItem[] = events.map(e => ({
        id: `arena_${e.id}`,
        type: 'arena_event' as const,
        created_at: e.start_date || new Date().toISOString(),
        event_id: e.id,
        arena_name: e.title,
        arena_status: e.status,
        title: e.status === 'live' ? `${e.title} is LIVE` : `${e.title} concluded`,
        description: `${e.league} League`,
      }));

      // Merge and sort all items by date
      const allItems = [...editDrops, ...feedActivities, ...arenaEvents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching mixed feed:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFeed();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('mixed-feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'round_participations'
      }, () => fetchFeed())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_feed'
      }, () => fetchFeed())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeed]);

  return { items, loading, refetch: fetchFeed };
}
