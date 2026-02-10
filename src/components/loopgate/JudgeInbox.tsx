import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, Clock, ExternalLink, Play, 
  Sparkles, MessageSquare, Check, Loader2, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThumbnail } from '@/hooks/useThumbnail';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import JudgeScoringModal from './JudgeScoringModal';

interface ReviewRequest {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  status: string;
  requested_at: string;
  review_tag?: string;
  notes?: string;
}

interface InboxItem {
  id: string; // judge_inbox id
  review_request_id: string;
  dismissed: boolean;
  request: ReviewRequest;
}

function RequestCard({ 
  item, 
  onScore,
  onDismiss
}: { 
  item: InboxItem;
  onScore: (item: InboxItem) => void;
  onDismiss: (inboxId: string) => void;
}) {
  const { thumbnail, loading: thumbnailLoading } = useThumbnail(item.request.submission_url, item.request.platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-gold/50 transition-colors"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-20 aspect-[9/16] bg-surface-1 rounded-lg overflow-hidden shrink-0">
          {thumbnailLoading ? (
            <div className="absolute inset-0 animate-pulse bg-surface-2" />
          ) : thumbnail ? (
            <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={20} className="text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute top-1 left-1">
            <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
              item.request.platform === 'tiktok' ? 'bg-black text-white' :
              item.request.platform === 'instagram' ? 'bg-purple-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {item.request.platform.slice(0, 2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {item.request.avatar_url ? (
                <img src={item.request.avatar_url} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-gold">
                    {item.request.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium truncate">@{item.request.username}</span>
            </div>
            {/* Dismiss button */}
            <button
              onClick={() => onDismiss(item.id)}
              className="p-1 hover:bg-surface-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Remove from inbox"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Clock size={10} />
            <span>{formatDistanceToNow(new Date(item.request.requested_at), { addSuffix: true })}</span>
          </div>

          {item.request.review_tag && (
            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold mb-2">
              {item.request.review_tag}
            </Badge>
          )}

          {item.request.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              <MessageSquare size={10} className="inline mr-1" />
              {item.request.notes}
            </p>
          )}

          <div className="flex gap-2">
            <a
              href={item.request.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 bg-surface-1 border border-border rounded-lg text-xs font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink size={10} />
              Watch
            </a>
            <button
              onClick={() => onScore(item)}
              className="flex-1 py-1.5 bg-gold text-black rounded-lg text-xs font-bold hover:bg-gold/90 transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles size={10} />
              Score
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface JudgeInboxProps {
  onReviewComplete?: () => void;
}

export default function JudgeInbox({ onReviewComplete }: JudgeInboxProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [scoringItem, setScoringItem] = useState<InboxItem | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchInbox();

      const channel = supabase
        .channel('judge-inbox-realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'judge_inbox',
          filter: `judge_id=eq.${user.id}`
        }, () => {
          fetchInbox();
          toast.info('New submission in your inbox!');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  async function fetchInbox() {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch judge_inbox entries for this judge
      let query = supabase
        .from('judge_inbox')
        .select('id, review_request_id, dismissed')
        .eq('judge_id', user.id)
        .order('added_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('dismissed', false);
      }

      const { data: inboxData, error: inboxError } = await query;
      if (inboxError) throw inboxError;

      if (!inboxData || inboxData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch the actual review requests
      const requestIds = inboxData.map(i => i.review_request_id);
      const { data: requests, error: reqError } = await supabase
        .from('review_requests')
        .select('*')
        .in('id', requestIds);

      if (reqError) throw reqError;

      const requestMap = new Map((requests || []).map(r => [r.id, r]));

      const mapped: InboxItem[] = inboxData
        .map(inbox => {
          const req = requestMap.get(inbox.review_request_id);
          if (!req) return null;
          return {
            id: inbox.id,
            review_request_id: inbox.review_request_id,
            dismissed: inbox.dismissed || false,
            request: req as ReviewRequest,
          };
        })
        .filter(Boolean) as InboxItem[];

      setItems(mapped);
    } catch (error) {
      console.error('Error fetching inbox:', error);
    } finally {
      setLoading(false);
    }
  }

  async function dismissItem(inboxId: string) {
    const { error } = await supabase
      .from('judge_inbox')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', inboxId);

    if (error) {
      toast.error('Failed to dismiss');
      return;
    }

    setItems(prev => prev.filter(i => i.id !== inboxId));
    toast.success('Removed from inbox');
  }

  const handleScoreComplete = () => {
    setScoringItem(null);
    fetchInbox();
    onReviewComplete?.();
  };

  const activeCount = items.filter(i => !i.dismissed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg">Judge Inbox</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-gold text-black text-xs font-bold rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => { setFilter('active'); setTimeout(fetchInbox, 0); }}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'active' 
                ? 'bg-gold text-black font-bold' 
                : 'bg-surface-1 text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => { setFilter('all'); setTimeout(fetchInbox, 0); }}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-gold text-black font-bold' 
                : 'bg-surface-1 text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-surface-1 rounded-xl border border-border">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-gold" />
          </div>
          <p className="font-display text-lg mb-1">ALL CAUGHT UP</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'active' 
              ? 'No active reviews. Check back soon!' 
              : 'No review requests yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <RequestCard 
                key={item.id} 
                item={item} 
                onScore={setScoringItem}
                onDismiss={dismissItem}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Scoring Modal */}
      {scoringItem && (
        <JudgeScoringModal
          request={scoringItem.request}
          onClose={() => setScoringItem(null)}
          onComplete={handleScoreComplete}
        />
      )}
    </div>
  );
}
