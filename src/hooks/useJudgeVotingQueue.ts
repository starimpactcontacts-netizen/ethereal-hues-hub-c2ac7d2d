import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BattleSource =
  | 'battle'
  | 'cash_battle'
  | 'quick_fight'
  | 'competition'
  | 'solo'
  | 'gatekeeper'
  | 'featured';

export interface JudgeVoteItem {
  id: string;
  source: BattleSource;
  player_1_username: string;
  player_1_avatar_url: string | null;
  player_2_username: string | null;
  player_2_avatar_url: string | null;
  prize_label: string | null;
  created_at: string;
  route: string;
}

export function useJudgeVotingQueue() {
  const [items, setItems] = useState<JudgeVoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [battles, cash, quick, comps, solos, gates, feats] = await Promise.all([
      supabase
        .from('battles')
        .select('id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, challenger_submission_url, opponent_submission_url, created_at, status, judge_id')
        .in('status', ['judging', 'active'])
        .is('judge_id', null)
        .not('challenger_submission_url', 'is', null)
        .not('opponent_submission_url', 'is', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('cash_battles')
        .select('id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, challenger_submission_url, opponent_submission_url, prize_cents, created_at, status')
        .in('status', ['judging', 'voting', 'active'])
        .not('challenger_submission_url', 'is', null)
        .not('opponent_submission_url', 'is', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('quick_fights')
        .select('id, player_1_username, player_2_username, player_1_avatar_url, player_2_avatar_url, created_at, status, judge_id, player_1_submission_url, player_2_submission_url')
        .eq('status', 'judging')
        .is('judge_id', null)
        .not('player_1_submission_url', 'is', null)
        .not('player_2_submission_url', 'is', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('competitions')
        .select('id, slug, name, creator_username, creator_avatar_url, created_at, status')
        .in('status', ['voting', 'judging'])
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('solo_submissions')
        .select('id, username, avatar_url, theme, song_name, created_at, status, judge_id')
        .eq('status', 'judging')
        .is('judge_id', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('gatekeeper_submissions')
        .select('id, user_id, status, created_at, judge_id, editing_style, submission_url')
        .eq('status', 'pending')
        .is('judge_id', null)
        .order('created_at', { ascending: true })
        .limit(50),
      supabase
        .from('featured_submissions')
        .select('id, username, avatar_url, status, created_at, judge_id, song_name, artist_name')
        .eq('status', 'pending')
        .is('judge_id', null)
        .order('created_at', { ascending: true })
        .limit(50),
    ]);

    const merged: JudgeVoteItem[] = [];

    // Resolve usernames for gatekeeper entries
    const gateUserIds = Array.from(new Set((gates.data ?? []).map((g: any) => g.user_id).filter(Boolean)));
    const gateProfiles = gateUserIds.length
      ? (await supabase.from('profiles').select('id, username, avatar_url').in('id', gateUserIds)).data ?? []
      : [];
    const gateProfileMap = new Map<string, { username: string; avatar_url: string | null }>();
    gateProfiles.forEach((p: any) => gateProfileMap.set(p.id, { username: p.username, avatar_url: p.avatar_url }));

    (battles.data ?? []).forEach((b: any) => merged.push({
      id: b.id, source: 'battle',
      player_1_username: b.challenger_username,
      player_1_avatar_url: b.challenger_avatar_url,
      player_2_username: b.opponent_username,
      player_2_avatar_url: b.opponent_avatar_url,
      prize_label: '+20 IDX',
      created_at: b.created_at,
      route: `/battle/${b.id}`,
    }));

    (cash.data ?? []).forEach((b: any) => merged.push({
      id: b.id, source: 'cash_battle',
      player_1_username: b.challenger_username,
      player_1_avatar_url: b.challenger_avatar_url,
      player_2_username: b.opponent_username,
      player_2_avatar_url: b.opponent_avatar_url,
      prize_label: b.prize_cents ? `$${(b.prize_cents / 100).toFixed(0)}` : 'CASH',
      created_at: b.created_at,
      route: `/cash-battle/${b.id}`,
    }));

    (quick.data ?? []).forEach((q: any) => merged.push({
      id: q.id, source: 'quick_fight',
      player_1_username: q.player_1_username,
      player_1_avatar_url: q.player_1_avatar_url,
      player_2_username: q.player_2_username,
      player_2_avatar_url: q.player_2_avatar_url,
      prize_label: '+15 JXP',
      created_at: q.created_at,
      route: `/fight/${q.id}`,
    }));

    (comps.data ?? []).forEach((c: any) => merged.push({
      id: c.id, source: 'competition',
      player_1_username: c.name || c.creator_username,
      player_1_avatar_url: c.creator_avatar_url,
      player_2_username: null,
      player_2_avatar_url: null,
      prize_label: 'LOBBY',
      created_at: c.created_at,
      route: `/competition/${c.slug || c.id}`,
    }));

    (solos.data ?? []).forEach((s: any) => merged.push({
      id: s.id, source: 'solo',
      player_1_username: s.username || 'editor',
      player_1_avatar_url: s.avatar_url,
      player_2_username: s.theme || s.song_name || null,
      player_2_avatar_url: null,
      prize_label: '+10 IDX',
      created_at: s.created_at,
      route: `/solo/${s.id}`,
    }));

    (gates.data ?? []).forEach((g: any) => merged.push({
      id: g.id, source: 'gatekeeper',
      player_1_username: gateProfileMap.get(g.user_id)?.username || 'editor',
      player_1_avatar_url: gateProfileMap.get(g.user_id)?.avatar_url || null,
      player_2_username: null,
      player_2_avatar_url: null,
      prize_label: '+25 JXP',
      created_at: g.created_at,
      route: `/judge/gatekeeper/${g.id}`,
    }));

    (feats.data ?? []).forEach((f: any) => merged.push({
      id: f.id, source: 'featured',
      player_1_username: f.username || 'editor',
      player_1_avatar_url: f.avatar_url,
      player_2_username: f.song_name ? `${f.song_name}${f.artist_name ? ' — ' + f.artist_name : ''}` : null,
      player_2_avatar_url: null,
      prize_label: '+20 JXP',
      created_at: f.created_at,
      route: `/judge/queue?featured=${f.id}`,
    }));

    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setItems(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('judge_voting_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_battles' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solo_submissions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gatekeeper_submissions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_submissions' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { items, loading, refetch: fetchAll };
}
