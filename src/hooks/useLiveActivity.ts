import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveActivityItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  action: string;
  target: string;
  score?: number | null;
  timestamp: string;
  type: 'submission' | 'review' | 'battle' | 'judge_video' | 'connection' | 'featured_sub' | 'crew_join' | 'hosted_entry' | 'quick_fight' | 'gqt' | 'tournament_join';
}

// Randomized action text for variety
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const submissionVerbs = [
  'submitted to', 'entered', 'dropped an edit in', 'threw down in', 'competed in',
];
const reviewVerbs = [
  'got rated by', 'was judged by', 'received a verdict from', 'got scored by', 'faced the gavel of',
];
const battleActiveVerbs = [
  'is battling', 'is going head-to-head with', 'stepped into the ring vs', 'is clashing with',
];
const battleJudgingVerbs = [
  'awaiting judgement vs', 'pending verdict against', 'in the judges\' hands vs',
];
const battleWonVerbs = [
  'defeated', 'took down', 'outclassed', 'dismantled', 'bodied',
];
const battleLostVerbs = [
  'lost to', 'fell to', 'was eliminated by', 'got outperformed by',
];
const judgeVideoVerbs = [
  'posted', 'dropped', 'published', 'released',
];
const featuredSubVerbs = [
  'submitted an edit for', 'entered the drop by', 'competed for', 'threw down for',
];
const crewJoinVerbs = [
  'joined', 'enlisted in', 'signed up for', 'became a member of',
];
const hostedEntryVerbs = [
  'entered', 'joined the comp', 'submitted to', 'signed up for',
];
const quickFightVerbs = [
  'is quick fighting', 'entered the ring vs', 'is clashing with', 'challenged',
];
const quickFightJudgingVerbs = [
  'awaiting verdict vs', 'pending judgement against',
];
const quickFightWonVerbs = [
  'defeated', 'outclassed', 'took down', 'beat',
];
const gqtVerbs = [
  'took the GQT', 'completed the Gatekeeper Test', 'faced the Gatekeeper', 'tested their skill',
];
const gqtScoredVerbs = [
  'scored on the GQT', 'was rated by the Gatekeeper', 'got classified',
];
const connectionVerbs = [
  'connected with', 'linked up with', 'is now connected to',
];
const tournamentJoinVerbs = [
  'registered for', 'signed up for', 'entered', 'joined the tournament',
];

export function useLiveActivity(limit = 8) {
  const [items, setItems] = useState<LiveActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      // Fetch all activity sources in parallel
      const [roundsRes, eventsRes, reviewsRes, battlesRes, judgeVidsRes, featSubsRes, crewJoinsRes, hostedEntriesRes, quickFightsRes, gqtRes, connectionsRes, tournamentJoinsRes] = await Promise.all([
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
        supabase
          .from('featured_submissions')
          .select('id, user_id, username, avatar_url, drop_id, qoi_score, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        supabase
          .from('crew_members')
          .select('id, user_id, crew_id, joined_at')
          .order('joined_at', { ascending: false })
          .limit(limit),
        supabase
          .from('hosted_competition_submissions')
          .select('id, user_id, username, avatar_url, competition_id, score, submitted_at')
          .order('submitted_at', { ascending: false })
          .limit(limit),
        // Quick fights
        supabase
          .from('quick_fights')
          .select('id, player_1_id, player_1_username, player_1_avatar_url, player_2_id, player_2_username, player_2_avatar_url, status, winner_id, winner_score, updated_at')
          .in('status', ['matched', 'active', 'judging', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(limit),
        // GQT / Gatekeeper submissions
        supabase
          .from('gatekeeper_submissions')
          .select('id, user_id, qoi_score, gqt_rank, status, created_at')
          .order('created_at', { ascending: false })
          .limit(limit),
        // Connections (accepted)
        supabase
          .from('connections')
          .select('id, sender_id, receiver_id, status, responded_at')
          .eq('status', 'accepted')
          .order('responded_at', { ascending: false, nullsFirst: false })
          .limit(limit),
        // Sanctioned tournament joins
        supabase
          .from('sanctioned_tournament_participants')
          .select('id, user_id, tournament_id, joined_at')
          .order('joined_at', { ascending: false })
          .limit(limit),
      ]);

      // Collect user & event IDs for enrichment
      const roundData = roundsRes.data || [];
      const eventData = eventsRes.data || [];
      const reviewData = reviewsRes.data || [];
      const battleData = battlesRes.data || [];
      const judgeVidData = judgeVidsRes.data || [];
      const featSubData = featSubsRes.data || [];
      const crewJoinData = crewJoinsRes.data || [];
      const hostedEntryData = hostedEntriesRes.data || [];
      const quickFightData = quickFightsRes.data || [];
      const gqtData = gqtRes.data || [];
      const connectionData = connectionsRes.data || [];
      const tournamentJoinData = tournamentJoinsRes.data || [];

      const userIds = [...new Set([
        ...roundData.map(r => r.user_id),
        ...eventData.map(e => e.user_id),
        ...judgeVidData.map(j => j.judge_id),
        ...crewJoinData.map(c => c.user_id),
        ...gqtData.map(g => g.user_id),
        ...connectionData.flatMap(c => [c.sender_id, c.receiver_id]),
        ...tournamentJoinData.map(t => t.user_id),
      ])];
      const eventIds = [...new Set([
        ...roundData.map(r => r.event_id),
        ...eventData.map(e => e.event_id),
      ])];
      const crewIds = [...new Set(crewJoinData.map(c => c.crew_id))];
      const dropIds = [...new Set(featSubData.map(f => f.drop_id))];
      const compIds = [...new Set(hostedEntryData.map(h => h.competition_id))];
      const tournamentIds = [...new Set(tournamentJoinData.map(t => t.tournament_id))];

      const [profilesRes, eventsNamesRes, crewNamesRes, dropNamesRes, compNamesRes, tournamentNamesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('id, username, avatar_url').in('id', userIds) : { data: [] },
        eventIds.length > 0 ? supabase.from('events').select('id, title').in('id', eventIds) : { data: [] },
        crewIds.length > 0 ? supabase.from('crews').select('id, name').in('id', crewIds) : { data: [] },
        dropIds.length > 0 ? supabase.from('featured_drops').select('id, title').in('id', dropIds) : { data: [] },
        compIds.length > 0 ? supabase.from('hosted_competitions').select('id, name').in('id', compIds) : { data: [] },
        tournamentIds.length > 0 ? supabase.from('sanctioned_tournaments').select('id, name').in('id', tournamentIds) : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const eventMap = new Map((eventsNamesRes.data || []).map(e => [e.id, e.title]));
      const crewMap = new Map((crewNamesRes.data || []).map(c => [c.id, c.name]));
      const dropMap = new Map((dropNamesRes.data || []).map(d => [d.id, d.title]));
      const compMap = new Map((compNamesRes.data || []).map(c => [c.id, c.name]));
      const tournamentMap = new Map((tournamentNamesRes.data || []).map(t => [t.id, t.name]));

      const all: LiveActivityItem[] = [];

      // Submissions from rounds
      roundData.forEach(r => {
        const p = profileMap.get(r.user_id);
        all.push({
          id: `round-${r.id}`,
          user_id: r.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: pick(submissionVerbs),
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
          action: pick(submissionVerbs),
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
          action: pick(reviewVerbs),
          target: r.judge_username || 'a judge',
          score: r.total_score,
          timestamp: r.reviewed_at || new Date().toISOString(),
          type: 'review',
        });
      });

      // Battles
      battleData.forEach(b => {
        const action = b.status === 'active' 
          ? pick(battleActiveVerbs) 
          : b.status === 'judging' 
            ? pick(battleJudgingVerbs) 
            : b.winner_id === b.challenger_id 
              ? pick(battleWonVerbs) 
              : pick(battleLostVerbs);
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
          action: pick(judgeVideoVerbs),
          target: j.title || 'a rating video',
          score: j.current_views,
          timestamp: j.submitted_at || new Date().toISOString(),
          type: 'judge_video',
        });
      });

      // Featured drop submissions
      featSubData.forEach(f => {
        all.push({
          id: `feat-${f.id}`,
          user_id: f.user_id,
          username: f.username || 'editor',
          avatar_url: f.avatar_url || null,
          action: pick(featuredSubVerbs),
          target: dropMap.get(f.drop_id) || 'a featured drop',
          score: f.qoi_score,
          timestamp: f.created_at || new Date().toISOString(),
          type: 'featured_sub',
        });
      });

      // Crew joins
      crewJoinData.forEach(c => {
        const p = profileMap.get(c.user_id);
        all.push({
          id: `crew-${c.id}`,
          user_id: c.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: pick(crewJoinVerbs),
          target: crewMap.get(c.crew_id) || 'a unit',
          score: null,
          timestamp: c.joined_at || new Date().toISOString(),
          type: 'crew_join',
        });
      });

      // Hosted competition entries
      hostedEntryData.forEach(h => {
        all.push({
          id: `hcomp-${h.id}`,
          user_id: h.user_id,
          username: h.username || 'editor',
          avatar_url: h.avatar_url || null,
          action: pick(hostedEntryVerbs),
          target: compMap.get(h.competition_id) || 'a competition',
          score: h.score,
          timestamp: h.submitted_at || new Date().toISOString(),
          type: 'hosted_entry',
        });
      });

      // Quick fights
      quickFightData.forEach(qf => {
        const action = qf.status === 'completed'
          ? (qf.winner_id === qf.player_1_id ? pick(quickFightWonVerbs) : pick(quickFightWonVerbs))
          : qf.status === 'judging'
            ? pick(quickFightJudgingVerbs)
            : pick(quickFightVerbs);
        all.push({
          id: `qf-${qf.id}`,
          user_id: qf.player_1_id,
          username: qf.player_1_username || 'editor',
          avatar_url: qf.player_1_avatar_url || null,
          action,
          target: qf.player_2_username || '???',
          score: qf.winner_id === qf.player_1_id ? qf.winner_score : null,
          timestamp: qf.updated_at || new Date().toISOString(),
          type: 'quick_fight',
        });
      });

      // GQT submissions
      gqtData.forEach(g => {
        const p = profileMap.get(g.user_id);
        const isScored = g.status === 'scored' && g.qoi_score != null;
        all.push({
          id: `gqt-${g.id}`,
          user_id: g.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: isScored ? pick(gqtScoredVerbs) : pick(gqtVerbs),
          target: isScored ? `${g.gqt_rank || ''} Class` : 'the Gatekeeper',
          score: g.qoi_score,
          timestamp: g.created_at || new Date().toISOString(),
          type: 'gqt',
        });
      });

      // Connections
      connectionData.forEach(c => {
        const sender = profileMap.get(c.sender_id);
        const receiver = profileMap.get(c.receiver_id);
        if (sender && receiver) {
          all.push({
            id: `conn-${c.id}`,
            user_id: c.sender_id,
            username: sender.username || 'editor',
            avatar_url: sender.avatar_url || null,
            action: pick(connectionVerbs),
            target: receiver.username || 'someone',
            score: null,
            timestamp: c.responded_at || new Date().toISOString(),
            type: 'connection',
          });
        }
      });

      // Sanctioned tournament joins
      tournamentJoinData.forEach(t => {
        const p = profileMap.get(t.user_id);
        all.push({
          id: `tourney-${t.id}`,
          user_id: t.user_id,
          username: p?.username || 'editor',
          avatar_url: p?.avatar_url || null,
          action: pick(tournamentJoinVerbs),
          target: tournamentMap.get(t.tournament_id) || 'a tournament',
          score: null,
          timestamp: t.joined_at || new Date().toISOString(),
          type: 'tournament_join',
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'featured_submissions' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crew_members' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hosted_competition_submissions' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gatekeeper_submissions' }, () => fetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => fetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sanctioned_tournament_participants' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { items, loading, refetch: fetch };
}
