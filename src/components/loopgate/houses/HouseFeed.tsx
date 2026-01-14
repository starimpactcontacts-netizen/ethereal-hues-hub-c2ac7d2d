import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  type: 'rank' | 'index' | 'join' | 'win';
  username: string;
  avatar_url: string | null;
  description: string;
  value?: number;
  created_at: string;
}

interface HouseFeedProps {
  houseId: string;
  memberIds: string[];
}

export default function HouseFeed({ houseId, memberIds }: HouseFeedProps) {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberIds.length === 0) {
      setFeedItems([]);
      setLoading(false);
      return;
    }
    
    fetchFeed();
  }, [houseId, memberIds]);

  async function fetchFeed() {
    setLoading(true);
    
    // Fetch recent activity for house members
    const { data: activities } = await supabase
      .from('activity_feed')
      .select('*')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activities) {
      const items: FeedItem[] = activities.map((activity: any) => {
        let type: FeedItem['type'] = 'index';
        let value: number | undefined;
        
        if (activity.activity_type === 'submission') {
          type = 'index';
          value = activity.data?.qoi_score;
        } else if (activity.activity_type === 'rank_change') {
          type = 'rank';
          value = activity.data?.new_rank;
        } else if (activity.activity_type === 'event_win') {
          type = 'win';
        }
        
        return {
          id: activity.id,
          type,
          username: activity.username,
          avatar_url: activity.avatar_url,
          description: activity.title || activity.description,
          value,
          created_at: activity.created_at,
        };
      });
      
      setFeedItems(items);
    }
    
    setLoading(false);
  }

  const getIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'rank': return <TrendingUp size={12} className="text-blue-400" />;
      case 'index': return <Zap size={12} className="text-gold" />;
      case 'win': return <Award size={12} className="text-gold" />;
      case 'join': return <Star size={12} className="text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted/50 rounded" />
        ))}
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {feedItems.map((item, index) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => navigate(`/u/${item.username}`)}
          className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors text-left"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={item.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">
              {item.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">
              <span className="font-medium">{item.username}</span>
              <span className="text-muted-foreground"> {item.description}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            {getIcon(item.type)}
            {item.value !== undefined && (
              <span className="text-xs font-mono text-gold">
                {item.type === 'rank' ? `#${item.value}` : item.value.toFixed(1)}
              </span>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
