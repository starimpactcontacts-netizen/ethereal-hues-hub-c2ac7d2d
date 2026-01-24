import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Crown, Star, Zap } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FeedItem } from '@/hooks/useMixedFeed';
import { formatDistanceToNow } from 'date-fns';

interface RankMomentCardProps {
  item: FeedItem;
}

export default function RankMomentCard({ item }: RankMomentCardProps) {
  const navigate = useNavigate();
  
  // Determine if it's a climb or S-tier entry
  const isSClass = item.title?.toLowerCase().includes('s-tier') || item.title?.toLowerCase().includes('s class');
  const isClimb = item.title?.toLowerCase().includes('climb') || item.title?.toLowerCase().includes('+');
  const isRankUp = !isSClass && isClimb;

  const handleProfile = () => {
    if (item.user_id) {
      navigate(`/editor/${item.user_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden ${
        isSClass 
          ? 'bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-purple-500/20 border border-purple-500/30' 
          : 'bg-gradient-to-r from-emerald-500/10 via-surface-0 to-emerald-500/10 border border-emerald-500/20'
      } p-4`}
    >
      {/* Shimmer for S-class */}
      {isSClass && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-purple-500/10 to-transparent" />
        </div>
      )}
      
      <div className="relative flex items-center gap-4">
        {/* Icon */}
        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          isSClass ? 'bg-purple-500/20' : 'bg-emerald-500/20'
        }`}>
          {isSClass ? (
            <Crown className="w-6 h-6 text-purple-400" />
          ) : (
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isSClass ? 'text-purple-400' : 'text-emerald-400'
            }`}>
              {isSClass ? '✦ S-TIER ENTRY' : '📈 RANK UP'}
            </span>
          </div>
          
          {/* Title */}
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          
          {/* User row */}
          <button 
            onClick={handleProfile}
            className="flex items-center gap-2 mt-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-5 h-5 border border-border">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-surface-1">
                {item.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">@{item.username}</span>
            <span className="text-[10px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </button>
        </div>

        {/* Score/change indicator */}
        {item.data?.score && (
          <div className={`shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded ${
            isSClass ? 'bg-purple-500/20' : 'bg-emerald-500/20'
          }`}>
            <span className={`font-display text-2xl ${isSClass ? 'text-purple-400' : 'text-emerald-400'}`}>
              {String(item.data.score)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
