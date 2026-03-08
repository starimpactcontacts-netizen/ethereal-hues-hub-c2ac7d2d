import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSubmission {
  id: string;
  event_id: string;
  submission_url: string;
  platform: string;
  status: string;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  qoi_score: number | null;
  final_rank: number | null;
  submitted_at: string;
  thumbnail_url: string | null;
  custom_title: string | null;
  source: 'standard' | 'round' | 'sanctioned' | 'featured' | 'battle';
  is_hidden?: boolean;
  event?: {
    id: string;
    title: string;
    status: string;
    poster_url: string | null;
  };
}

export function useUserSubmissions(targetUserId?: string) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = targetUserId || user?.id;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;

  const fetchSubmissions = useCallback(async () => {
    if (!userId) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    // Fetch all sources in parallel
    const [standardRes, roundRes, sanctionedRes, featuredRes, battlesRes, hiddenRes] = await Promise.all([
      supabase.from('event_participations').select('*').eq('user_id', userId).order('submitted_at', { ascending: false }),
      supabase.from('round_participations').select('*').eq('user_id', userId).not('submission_url', 'is', null).order('submitted_at', { ascending: false }),
      supabase.from('sanctioned_tournament_participants').select('*, sanctioned_tournaments!inner(id, name, status)').eq('user_id', userId).not('submission_url', 'is', null).order('submitted_at', { ascending: false }),
      supabase.from('featured_submissions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('battles').select('*').or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`).not('status', 'eq', 'pending').order('created_at', { ascending: false }),
      supabase.from('hidden_edits').select('source, source_id').eq('user_id', userId),
    ]);

    // Build hidden set
    const hiddenSet = new Set(
      (hiddenRes.data || []).map((h: any) => `${h.source}:${h.source_id}`)
    );

    const allSubmissions: UserSubmission[] = [];

    // Standard event participations
    for (const s of standardRes.data || []) {
      allSubmissions.push({
        id: s.id, event_id: s.event_id, submission_url: s.submission_url, platform: s.platform,
        status: s.status || 'pending', quality_score: s.quality_score, originality_score: s.originality_score,
        impact_score: s.impact_score, qoi_score: s.qoi_score, final_rank: s.final_rank,
        submitted_at: s.submitted_at, thumbnail_url: s.thumbnail_url || null,
        custom_title: (s as any).custom_title || null, source: 'standard',
        is_hidden: hiddenSet.has(`standard:${s.id}`),
      });
    }

    // Round participations
    for (const s of roundRes.data || []) {
      allSubmissions.push({
        id: s.id, event_id: s.event_id, submission_url: s.submission_url!, platform: s.platform || 'tiktok',
        status: s.status || 'pending', quality_score: s.quality_score, originality_score: s.originality_score,
        impact_score: s.impact_score, qoi_score: s.qoi_score, final_rank: null,
        submitted_at: s.submitted_at || s.created_at, thumbnail_url: (s as any).thumbnail_url || null,
        custom_title: (s as any).custom_title || null, source: 'round',
        is_hidden: hiddenSet.has(`round:${s.id}`),
      });
    }

    // Sanctioned tournaments
    for (const s of sanctionedRes.data || []) {
      allSubmissions.push({
        id: s.id, event_id: s.tournament_id, submission_url: s.submission_url!, platform: s.submission_platform || 'tiktok',
        status: s.qoi_score ? 'scored' : 'pending', quality_score: null, originality_score: null,
        impact_score: null, qoi_score: s.qoi_score, final_rank: s.final_rank,
        submitted_at: s.submitted_at || s.joined_at, thumbnail_url: (s as any).thumbnail_url || null,
        custom_title: (s as any).custom_title || null, source: 'sanctioned',
        is_hidden: hiddenSet.has(`sanctioned:${s.id}`),
      });
    }

    // Featured submissions (drops/solos)
    for (const s of featuredRes.data || []) {
      // Avoid duplicates if already in event_participations
      allSubmissions.push({
        id: s.id, event_id: s.drop_id, submission_url: s.submission_url, platform: s.platform || 'tiktok',
        status: s.qoi_score ? 'scored' : (s.status || 'pending'),
        quality_score: s.quality_score, originality_score: s.originality_score,
        impact_score: s.impact_score, qoi_score: s.qoi_score, final_rank: null,
        submitted_at: s.created_at || '', thumbnail_url: s.thumbnail_url || null,
        custom_title: s.video_title || null, source: 'featured',
        is_hidden: hiddenSet.has(`featured:${s.id}`),
      });
    }

    // Battles — extract the user's side
    for (const b of battlesRes.data || []) {
      const isChallenger = b.challenger_id === userId;
      const subUrl = isChallenger ? b.challenger_submission_url : b.opponent_submission_url;
      const thumbUrl = isChallenger ? b.challenger_thumbnail_url : b.opponent_thumbnail_url;
      const platform = isChallenger ? b.challenger_submission_platform : b.opponent_submission_platform;
      const score = isChallenger ? b.challenger_score : b.opponent_score;
      const submittedAt = isChallenger ? b.challenger_submitted_at : b.opponent_submitted_at;

      if (!subUrl) continue;

      allSubmissions.push({
        id: b.id, event_id: b.id, submission_url: subUrl, platform: platform || 'tiktok',
        status: score ? 'scored' : 'pending', quality_score: null, originality_score: null,
        impact_score: null, qoi_score: score, final_rank: b.winner_id === userId ? 1 : null,
        submitted_at: submittedAt || b.created_at, thumbnail_url: thumbUrl || null,
        custom_title: b.theme_song_name ? `Battle: ${b.theme_song_name}` : 'Battle',
        source: 'battle',
        is_hidden: hiddenSet.has(`battle:${b.id}`),
      });
    }

    // Deduplicate by submission_url (keep highest priority source)
    const seen = new Map<string, UserSubmission>();
    for (const sub of allSubmissions) {
      const key = sub.submission_url;
      if (!seen.has(key) || (sub.qoi_score && !seen.get(key)!.qoi_score)) {
        seen.set(key, sub);
      }
    }
    const deduped = Array.from(seen.values());

    // Sort by date
    deduped.sort((a, b) => new Date(b.submitted_at || '').getTime() - new Date(a.submitted_at || '').getTime());

    // If viewing someone else's profile, filter hidden
    if (!isOwnProfile) {
      setSubmissions(deduped.filter(s => !s.is_hidden));
    } else {
      setSubmissions(deduped);
    }
    setLoading(false);
  }, [userId, isOwnProfile]);

  useEffect(() => {
    fetchSubmissions();
    if (!userId) return;
    const channel = supabase
      .channel(`user-submissions-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participations', filter: `user_id=eq.${userId}` }, () => fetchSubmissions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchSubmissions]);

  const toggleHidden = async (submission: UserSubmission) => {
    if (!user?.id) return;
    if (submission.is_hidden) {
      await supabase.from('hidden_edits').delete().eq('user_id', user.id).eq('source', submission.source).eq('source_id', submission.id);
    } else {
      await supabase.from('hidden_edits').insert({ user_id: user.id, source: submission.source, source_id: submission.id });
    }
    await fetchSubmissions();
  };

  return { submissions, loading, refetch: fetchSubmissions, toggleHidden };
}
