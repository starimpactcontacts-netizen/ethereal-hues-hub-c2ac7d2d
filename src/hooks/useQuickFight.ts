import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface QuickFight {
  id: string;
  player_1_id: string;
  player_1_username: string;
  player_1_avatar_url: string | null;
  player_2_id: string | null;
  player_2_username: string | null;
  player_2_avatar_url: string | null;
  status: 'waiting' | 'active' | 'submitted' | 'judging' | 'completed' | 'forfeited' | 'cancelled';
  player_1_submission_url: string | null;
  player_1_submitted_at: string | null;
  player_2_submission_url: string | null;
  player_2_submitted_at: string | null;
  judge_id: string | null;
  judge_username: string | null;
  winner_id: string | null;
  winner_score: number | null;
  loser_score: number | null;
  judge_notes: string | null;
  judged_at: string | null;
  duration_minutes: number;
  matched_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  view_count: number;
  created_at: string;
}

export interface QuickFightMessage {
  id: string;
  fight_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  is_auto_text: boolean;
  is_system: boolean;
  created_at: string;
}

// Instant matchmaking
export async function findQuickFight(userId: string, username: string, avatarUrl: string | null): Promise<string | null> {
  const { data, error } = await supabase.rpc('quick_fight_match', {
    p_user_id: userId,
    p_username: username,
    p_avatar_url: avatarUrl,
  });
  if (error) {
    console.error('Matchmaking error:', error);
    return null;
  }
  return data as string | null; // null = in queue, string = fight ID
}

// Submit edit
export async function submitQuickFight(fightId: string, userId: string, url: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('quick_fight_submit', {
    p_fight_id: fightId,
    p_user_id: userId,
    p_url: url,
  });
  return !error && data === true;
}

// Leave queue
export async function leaveQueue(userId: string): Promise<void> {
  await supabase.from('quick_fight_queue').delete().eq('user_id', userId);
}

// Single fight hook
export function useQuickFight(fightId: string | undefined) {
  const [fight, setFight] = useState<QuickFight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fightId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('quick_fights')
        .select('*')
        .eq('id', fightId)
        .maybeSingle();
      if (data) setFight(data as unknown as QuickFight);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`qf_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights', filter: `id=eq.${fightId}` },
        (payload) => { if (payload.new) setFight(payload.new as unknown as QuickFight); }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fightId]);

  return { fight, loading };
}

// Active quick fights for current user
export function useMyQuickFights() {
  const { user } = useAuth();
  const [fights, setFights] = useState<QuickFight[]>([]);
  const [inQueue, setInQueue] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const fetchAll = async () => {
      // Active fights
      const { data: fightData } = await supabase
        .from('quick_fights')
        .select('*')
        .or(`player_1_id.eq.${user.id},player_2_id.eq.${user.id}`)
        .in('status', ['active', 'judging', 'waiting'])
        .order('created_at', { ascending: false });
      setFights((fightData as unknown as QuickFight[]) || []);

      // Queue status
      const { data: queueData } = await supabase
        .from('quick_fight_queue')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setInQueue(!!queueData);
      setLoading(false);
    };
    fetchAll();

    const channel = supabase
      .channel('my_quick_fights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_queue' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return { fights, inQueue, loading };
}

// Quick fight messages
export function useQuickFightMessages(fightId: string | undefined) {
  const [messages, setMessages] = useState<QuickFightMessage[]>([]);

  useEffect(() => {
    if (!fightId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('quick_fight_messages')
        .select('*')
        .eq('fight_id', fightId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as unknown as QuickFightMessage[]);
    };
    fetch();

    const channel = supabase
      .channel(`qf_msgs_${fightId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quick_fight_messages', filter: `fight_id=eq.${fightId}` },
        (payload) => { setMessages(prev => [...prev, payload.new as unknown as QuickFightMessage]); }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fightId]);

  return { messages };
}

// Pending quick fights for judges
export function usePendingJudgeFights() {
  const [fights, setFights] = useState<QuickFight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('quick_fights')
        .select('*')
        .eq('status', 'judging')
        .is('judge_id', null)
        .order('created_at', { ascending: true });
      setFights((data as unknown as QuickFight[]) || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('judge_quick_fights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { fights, loading };
}

// All recent quick fights (for feed/spectating)
export function useRecentQuickFights(limit = 20) {
  const [fights, setFights] = useState<QuickFight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('quick_fights')
        .select('*')
        .in('status', ['active', 'judging', 'completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(limit);
      setFights((data as unknown as QuickFight[]) || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('recent_quick_fights')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fights' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { fights, loading };
}
