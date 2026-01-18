import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Trophy, Zap, TrendingUp, Star, Crown, 
  Award, ArrowUp, Flame, Users 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  type: 'review' | 'rank_up' | 's_class' | 'arena_win' | 'judge_milestone';
  title: string;
  description: string;
  avatar_url?: string;
  username: string;
  data?: any;
  created_at: string;
}

const feedTypeConfig = {
  review: {
    icon: Trophy,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/20',
  },
  rank_up: {
    icon: ArrowUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  s_class: {
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  arena_win: {
    icon: Award,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  judge_milestone: {
    icon: Star,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
};

function FeedItemCard({ item, index }: { item: FeedItem; index: number }) {
  const config = feedTypeConfig[item.type] || feedTypeConfig.review;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-start gap-3 p-3 bg-card border ${config.borderColor} rounded-lg hover:bg-surface-1 transition-colors`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon size={14} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {item.avatar_url && (
            <img 
              src={item.avatar_url} 
              alt="" 
              className="w-4 h-4 rounded-full"
            />
          )}
          <span className="text-xs font-medium text-foreground">@{item.username}</span>
        </div>
        <p className="text-sm text-foreground">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Score badge if applicable */}
      {item.data?.score && (
        <div className="shrink-0 px-2 py-1 bg-gold/10 border border-gold/30 rounded text-xs font-bold text-gold">
          {item.data.score}
        </div>
      )}
    </motion.div>
  );
}

interface JudgeLiveFeedProps {
  limit?: number;
  compact?: boolean;
}

export default function JudgeLiveFeed({ limit = 10, compact = false }: JudgeLiveFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('live-feed')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_feed' 
      }, (payload) => {
        const newItem = mapActivityToFeedItem(payload.new as any);
        if (newItem) {
          setFeedItems(prev => [newItem, ...prev.slice(0, limit - 1)]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  async function fetchFeed() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const items = (data || [])
        .map(mapActivityToFeedItem)
        .filter(Boolean) as FeedItem[];

      setFeedItems(items);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }

  function mapActivityToFeedItem(activity: any): FeedItem | null {
    if (!activity) return null;

    let type: FeedItem['type'] = 'review';
    let title = activity.title || '';
    let description = activity.description || '';

    switch (activity.activity_type) {
      case 'review_received':
        type = 'review';
        break;
      case 'rank_change':
        type = 'rank_up';
        break;
      case 's_class_score':
        type = 's_class';
        break;
      case 'arena_win':
        type = 'arena_win';
        break;
      case 'judge_milestone':
        type = 'judge_milestone';
        break;
      default:
        type = 'review';
    }

    return {
      id: activity.id,
      type,
      title,
      description,
      avatar_url: activity.avatar_url,
      username: activity.username,
      data: activity.data,
      created_at: activity.created_at,
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3">
          <Activity className="w-6 h-6 text-gold" />
        </div>
        <p className="font-display text-sm mb-1">FEED WARMING UP</p>
        <p className="text-xs text-muted-foreground">Activity will appear here</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {feedItems.slice(0, 5).map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span className="text-gold font-medium">@{item.username}</span>
            <span className="text-muted-foreground truncate">{item.title}</span>
            {item.data?.score && (
              <span className="text-gold font-bold ml-auto">{item.data.score}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-gold animate-pulse" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Live Activity</span>
      </div>
      
      <AnimatePresence>
        {feedItems.map((item, index) => (
          <FeedItemCard key={item.id} item={item} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
}
