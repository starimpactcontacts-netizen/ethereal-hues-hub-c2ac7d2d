import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSoloVote(submissionId: string | undefined) {
  const { user } = useAuth();
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;

    const fetchVotes = async () => {
      // Get counts from solo_submissions
      const { data: sub } = await supabase
        .from('solo_submissions')
        .select('upvotes, downvotes')
        .eq('id', submissionId)
        .single();
      
      if (sub) {
        setUpvotes((sub as any).upvotes || 0);
        setDownvotes((sub as any).downvotes || 0);
      }

      // Get user's vote
      if (user) {
        const { data: vote } = await supabase
          .from('solo_submission_votes' as any)
          .select('vote_type')
          .eq('submission_id', submissionId)
          .eq('user_id', user.id)
          .maybeSingle();
        setMyVote((vote as any)?.vote_type || null);
      }
      setLoading(false);
    };

    fetchVotes();

    // Realtime subscription
    const channel = supabase
      .channel(`solo-votes-${submissionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'solo_submission_votes',
        filter: `submission_id=eq.${submissionId}`,
      }, () => {
        // Refetch counts
        supabase
          .from('solo_submissions')
          .select('upvotes, downvotes')
          .eq('id', submissionId)
          .single()
          .then(({ data }) => {
            if (data) {
              setUpvotes((data as any).upvotes || 0);
              setDownvotes((data as any).downvotes || 0);
            }
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [submissionId, user]);

  const vote = useCallback(async (type: 'up' | 'down') => {
    if (!user || !submissionId) return;

    if (myVote === type) {
      // Remove vote
      await supabase
        .from('solo_submission_votes' as any)
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', user.id);
      setMyVote(null);
      if (type === 'up') setUpvotes(v => Math.max(0, v - 1));
      else setDownvotes(v => Math.max(0, v - 1));
    } else {
      // Upsert vote
      if (myVote) {
        // Remove old vote count optimistically
        if (myVote === 'up') setUpvotes(v => Math.max(0, v - 1));
        else setDownvotes(v => Math.max(0, v - 1));
      }
      
      // Delete existing then insert (upsert pattern)
      await supabase
        .from('solo_submission_votes' as any)
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', user.id);
      
      await supabase
        .from('solo_submission_votes' as any)
        .insert({ submission_id: submissionId, user_id: user.id, vote_type: type });
      
      setMyVote(type);
      if (type === 'up') setUpvotes(v => v + 1);
      else setDownvotes(v => v + 1);
    }
  }, [user, submissionId, myVote]);

  return { myVote, upvotes, downvotes, vote, loading };
}
