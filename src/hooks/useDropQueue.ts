import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QueueEntry {
  id: string;
  drop_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  thumbnail_url: string | null;
  video_title: string | null;
  queue_position: number;
  status: 'queued' | 'promoted' | 'rejected';
  promoted_to_round_id: string | null;
  created_at: string;
}

export function useDropQueue(dropId: string | null) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dropId) { setQueue([]); setLoading(false); return; }

    const fetchQueue = async () => {
      const { data } = await supabase
        .from('featured_drop_queue')
        .select('*')
        .eq('drop_id', dropId)
        .eq('status', 'queued')
        .order('queue_position', { ascending: true });

      setQueue((data || []) as unknown as QueueEntry[]);
      setLoading(false);
    };

    fetchQueue();

    const channel = supabase
      .channel(`drop-queue-${dropId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_drop_queue', filter: `drop_id=eq.${dropId}` }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

  return { queue, queueCount: queue.length, loading };
}
