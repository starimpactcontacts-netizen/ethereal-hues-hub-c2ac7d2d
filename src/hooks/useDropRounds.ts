import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DropRound {
  id: string;
  drop_id: string;
  round_number: number;
  max_submissions: number;
  status: 'pending' | 'open' | 'full' | 'judging' | 'completed';
  judge_id: string | null;
  judge_username: string | null;
  judge_avatar_url: string | null;
  judge_video_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface RoundRanking {
  id: string;
  round_id: string;
  submission_id: string;
  rank: number;
  index_awarded: number;
  xp_awarded: number;
  created_at: string;
}

export function useDropRounds(dropId: string | null) {
  const [rounds, setRounds] = useState<DropRound[]>([]);
  const [rankings, setRankings] = useState<RoundRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dropId) { setRounds([]); setRankings([]); setLoading(false); return; }

    const fetchRounds = async () => {
      const { data: roundsData } = await supabase
        .from('featured_drop_rounds')
        .select('*')
        .eq('drop_id', dropId)
        .order('round_number', { ascending: true });

      const mapped = (roundsData || []) as unknown as DropRound[];
      setRounds(mapped);

      // Fetch rankings for all rounds
      if (mapped.length > 0) {
        const roundIds = mapped.map(r => r.id);
        const { data: rankData } = await supabase
          .from('featured_round_rankings')
          .select('*')
          .in('round_id', roundIds)
          .order('rank', { ascending: true });
        setRankings((rankData || []) as unknown as RoundRanking[]);
      }

      setLoading(false);
    };

    fetchRounds();

    const channel = supabase
      .channel(`drop-rounds-${dropId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_drop_rounds', filter: `drop_id=eq.${dropId}` }, () => fetchRounds())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_round_rankings' }, () => fetchRounds())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

  const activeRound = rounds.find(r => r.status === 'open' || r.status === 'full');
  const currentRound = activeRound || rounds.find(r => r.status === 'judging') || rounds[rounds.length - 1];

  return { rounds, rankings, loading, activeRound, currentRound };
}
