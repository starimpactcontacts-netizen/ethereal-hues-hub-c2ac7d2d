import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Play, Trophy, Clock, ChevronRight } from 'lucide-react';
import { FeedItem } from '@/hooks/useMixedFeed';
import { formatDistanceToNow } from 'date-fns';

interface ArenaEventCardProps {
  item: FeedItem;
}

export default function ArenaEventCard({ item }: ArenaEventCardProps) {
  const navigate = useNavigate();
  const isLive = item.arena_status === 'live';
  const isClosed = item.arena_status === 'closed';

  const handleClick = () => {
    if (item.event_id) {
      navigate(`/arenas/${item.event_id}`);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className="w-full relative overflow-hidden text-left"
    >
      {/* Background gradient based on status */}
      <div className={`absolute inset-0 ${
        isLive 
          ? 'bg-gradient-to-r from-red-500/20 via-orange-500/10 to-red-500/20' 
          : 'bg-gradient-to-r from-surface-1 via-surface-0 to-surface-1'
      }`} />
      
      {/* Animated border for live */}
      {isLive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />
        </div>
      )}
      
      <div className={`relative border ${isLive ? 'border-red-500/50' : 'border-border/50'} p-4`}>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`shrink-0 w-14 h-14 rounded flex items-center justify-center ${
            isLive ? 'bg-red-500/20' : 'bg-surface-1'
          }`}>
            {isLive ? (
              <Play className="w-7 h-7 text-red-400" fill="currentColor" />
            ) : isClosed ? (
              <Trophy className="w-7 h-7 text-gold" />
            ) : (
              <Swords className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <div className="flex items-center gap-1.5 bg-red-500/20 rounded-full px-2 py-0.5">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
                </div>
              )}
              {isClosed && (
                <div className="flex items-center gap-1.5 bg-gold/20 rounded-full px-2 py-0.5">
                  <Trophy className="w-3 h-3 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Finished</span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {/* Title */}
            <h3 className="font-display text-xl text-foreground truncate mb-0.5">
              {item.arena_name || item.title}
            </h3>
            
            {/* League */}
            {item.description && (
              <p className="text-xs text-gold uppercase tracking-[0.15em]">{item.description}</p>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </div>
    </motion.button>
  );
}
