import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export function useLoopReactions(postIds: string[]) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, ReactionGroup[]>>({});

  const fetchReactions = useCallback(async () => {
    if (postIds.length === 0) return;

    const { data, error } = await supabase
      .from('feed_post_reactions')
      .select('post_id, emoji, user_id')
      .in('post_id', postIds);

    if (error) { console.error('Error fetching reactions:', error); return; }

    const grouped: Record<string, Record<string, { count: number; userIds: Set<string> }>> = {};
    
    (data || []).forEach(r => {
      if (!grouped[r.post_id]) grouped[r.post_id] = {};
      if (!grouped[r.post_id][r.emoji]) grouped[r.post_id][r.emoji] = { count: 0, userIds: new Set() };
      grouped[r.post_id][r.emoji].count++;
      grouped[r.post_id][r.emoji].userIds.add(r.user_id);
    });

    const result: Record<string, ReactionGroup[]> = {};
    Object.entries(grouped).forEach(([postId, emojis]) => {
      result[postId] = Object.entries(emojis)
        .map(([emoji, data]) => ({
          emoji,
          count: data.count,
          hasReacted: user ? data.userIds.has(user.id) : false,
        }))
        .sort((a, b) => b.count - a.count);
    });

    setReactions(result);
  }, [postIds.join(','), user?.id]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  // Realtime subscription
  useEffect(() => {
    if (postIds.length === 0) return;
    const channel = supabase
      .channel('loop-reactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_post_reactions' }, () => {
        fetchReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postIds.join(','), fetchReactions]);

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) return;
    
    const existing = reactions[postId]?.find(r => r.emoji === emoji);
    
    if (existing?.hasReacted) {
      // Optimistic remove
      setReactions(prev => {
        const updated = { ...prev };
        updated[postId] = (updated[postId] || []).map(r =>
          r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), hasReacted: false } : r
        ).filter(r => r.count > 0);
        return updated;
      });
      await supabase.from('feed_post_reactions').delete()
        .eq('post_id', postId).eq('user_id', user.id).eq('emoji', emoji);
    } else {
      // Optimistic add
      setReactions(prev => {
        const updated = { ...prev };
        const postReactions = [...(updated[postId] || [])];
        const idx = postReactions.findIndex(r => r.emoji === emoji);
        if (idx >= 0) {
          postReactions[idx] = { ...postReactions[idx], count: postReactions[idx].count + 1, hasReacted: true };
        } else {
          postReactions.push({ emoji, count: 1, hasReacted: true });
        }
        updated[postId] = postReactions;
        return updated;
      });
      await supabase.from('feed_post_reactions').insert({
        post_id: postId, user_id: user.id, emoji,
      });
    }
  };

  return { reactions, toggleReaction };
}
