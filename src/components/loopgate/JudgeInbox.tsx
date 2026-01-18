import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, Clock, ExternalLink, Play, ChevronRight, 
  Sparkles, MessageSquare, Filter, Check, Loader2
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

function RequestCard({ 
  request, 
  onScore 
}: { 
  request: ReviewRequest; 
  onScore: (request: ReviewRequest) => void;
}) {
  const { thumbnail, loading: thumbnailLoading } = useThumbnail(request.submission_url, request.platform);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
          
          {/* Platform badge */}
          <div className="absolute top-1 left-1">
            <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${
              request.platform === 'tiktok' ? 'bg-black text-white' :
              request.platform === 'instagram' ? 'bg-purple-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {request.platform.slice(0, 2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {request.avatar_url ? (
              <img src={request.avatar_url} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gold">
                  {request.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-medium truncate">@{request.username}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Clock size={10} />
            <span>{formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}</span>
          </div>

          {/* Review tag if present */}
          {request.review_tag && (
            <Badge variant="outline" className="text-[10px] border-gold/30 text-gold mb-2">
              {request.review_tag}
            </Badge>
          )}

          {/* Notes preview */}
          {request.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              <MessageSquare size={10} className="inline mr-1" />
              {request.notes}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={request.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 bg-surface-1 border border-border rounded-lg text-xs font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink size={10} />
              Watch
            </a>
            <button
              onClick={() => onScore(request)}
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
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [scoringRequest, setScoringRequest] = useState<ReviewRequest | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();

      // Subscribe to new requests
      const channel = supabase
        .channel('judge-inbox')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'review_requests' 
        }, () => {
          fetchRequests();
          toast.info('New review request received!');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  async function fetchRequests() {
    setLoading(true);
    try {
      let query = supabase
        .from('review_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleScoreComplete = () => {
    setScoringRequest(null);
    fetchRequests();
    onReviewComplete?.();
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-gold" />
          <h3 className="font-display text-lg">Judge Inbox</h3>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-gold text-black text-xs font-bold rounded-full">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          <button
            onClick={() => { setFilter('pending'); fetchRequests(); }}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'pending' 
                ? 'bg-gold text-black font-bold' 
                : 'bg-surface-1 text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => { setFilter('all'); fetchRequests(); }}
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

      {/* Request List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-surface-1 rounded-xl border border-border">
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-gold" />
          </div>
          <p className="font-display text-lg mb-1">ALL CAUGHT UP</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'pending' 
              ? 'No pending reviews. Check back soon!' 
              : 'No review requests yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {requests.map((request) => (
              <RequestCard 
                key={request.id} 
                request={request} 
                onScore={setScoringRequest}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Scoring Modal */}
      {scoringRequest && (
        <JudgeScoringModal
          request={scoringRequest}
          onClose={() => setScoringRequest(null)}
          onComplete={handleScoreComplete}
        />
      )}
    </div>
  );
}
