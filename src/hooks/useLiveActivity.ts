import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveActivityItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  action: string; // 'submitted' | 'reviewed' | 'battled' | 'rated' | 'joined' | 'won'
  target: string; // event name, battle opponent, etc
  score?: number | null;
  timestamp: string;
  type: 'submission' | 'review' | 'battle' | 'judge_video' | 'connection';
}

export function useLiveActivity(limit = 8) {
  const [items, setItems] = useState<LiveActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      // Fetch all activity sources in parallel
      const [roundsRes, eventsRes, reviewsRes, battlesRes, judgeVidsRes] = await Promise.all([
        supabase
          .from('round_participations')
          .select('id, user_id, event_id, qoi_score, submitted_at')
          .not('submission_url', 'is', null)
          .order('submitted_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        supabase
          .from('event_participations')
          .select('id, user_id, event_id, qoi_score, submitted_at')
          .not('submission_url', 'is', null)
          .order('submitted_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        supabase
          .from('review_requests')
          .select('id, user_id, username, avatar_url, judge_username, total_score, reviewed_at, status')
          .eq('status', 'reviewed')
          .order('reviewed_at', { ascending: false })
          .limit(limit),
        supabase
          .from('battles')
          .select('id, challenger_id, challenger_username, challenger_avatar_url, opponent_username, opponent_avatar_url, opponent_id, status, winner_id, updated_at, challenger_score, opponent_score')
          .in('status', ['active', 'completed', 'judging'])
          .order('updated_at', { ascending: false })
          .limit(limit),
        supabase
          .from('judge_rating_videos')
          .select('id, judge_id, title, current_views, submitted_at')
          .order('submitted_at', { ascending: false })
          .limit(limit),
      ]);

      // Collect user & event IDs for enrichment
      const roundData = roundsRes.data || [];
      const eventData = eventsRes.data || [];
      const reviewData = reviewsRes.data || [];
      const battleData = battlesRes.data || [];
      const judgeVidData = judgeVidsRes.data || [];

      const userIds = [...new Set([
        ...roundData.map(r => r.user_id),
        ...eventData.map(e => e.user_id),
        ...judgeVidData.map(j => j.judge_id),
      ])];
      const eventIds = [...new Set([
        ...roundData.map(r => r.event_id),
        ...eventData.map(e => e.event_id),
      ])];

      const [profilesRes, eventsNamesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('id, username, avatar_url').in('id', userIds) : { data: [] },
        eventIds.length > 0 ? supabase.from('events').select('id, title').in('id', eventIds) : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventsNamesRes.data || []).map(e => [e.id, e.title]));

      const all: LiveActivityItem[] = [];

      // Submissions from rounds
      roundData.forEach(r => {
        const p = profileMap.get(r.user_id);
        all.push({
          id: `round-${r.id}`,
          user_id: r.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: 'submitted to',
          target: eventMap.get(r.event_id) || 'Open Arena',
          score: r.qoi_score,
          timestamp: r.submitted_at || new Date().toISOString(),
          type: 'submission',
        });
      });

      // Submissions from events
      eventData.forEach(e => {
        const p = profileMap.get(e.user_id);
        all.push({
          id: `event-${e.id}`,
          user_id: e.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: 'submitted to',
          target: eventMap.get(e.event_id) || 'Event',
          score: e.qoi_score,
          timestamp: e.submitted_at || new Date().toISOString(),
          type: 'submission',
        });
      });

      // Reviews
      reviewData.forEach(r => {
        all.push({
          id: `review-${r.id}`,
          user_id: r.user_id,
          username: r.username || 'editor',
          avatar_url: r.avatar_url || null,
          action: 'got rated by',
          target: r.judge_username || 'a judge',
          score: r.total_score,
          timestamp: r.reviewed_at || new Date().toISOString(),
          type: 'review',
        });
      });

      // Battles
      battleData.forEach(b => {
        const action = b.status === 'active' ? 'is battling' : b.status === 'judging' ? 'awaiting judgement vs' : b.winner_id === b.challenger_id ? 'defeated' : 'lost to';
        all.push({
          id: `battle-${b.id}`,
          user_id: b.challenger_id,
          username: b.challenger_username || 'editor',
          avatar_url: b.challenger_avatar_url || null,
          action,
          target: b.opponent_username || '???',
          score: b.challenger_score,
          timestamp: b.updated_at || new Date().toISOString(),
          type: 'battle',
        });
      });

      // Judge videos
      judgeVidData.forEach(j => {
        const p = profileMap.get(j.judge_id);
        all.push({
          id: `jvid-${j.id}`,
          user_id: j.judge_id,
          username: p?.username || 'judge',
          avatar_url: p?.avatar_url || null,
          action: 'posted',
          target: j.title || 'a rating video',
          score: j.current_views,
          timestamp: j.submitted_at || new Date().toISOString(),
          type: 'judge_video',
        });
      });

      // Sort by timestamp, dedup by user+action combo
      all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set<string>();
      const unique = all.filter(item => {
        const key = `${item.user_id}-${item.action}-${item.target}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique.slice(0, limit));
    } catch (err) {
      console.error('Live activity error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();

    // Real-time subscriptions across all tables
    const channel = supabase
      .channel('live-activity-hub')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_participations' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_participations' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_requests' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'judge_rating_videos' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { items, loading, refetch: fetch };
}
