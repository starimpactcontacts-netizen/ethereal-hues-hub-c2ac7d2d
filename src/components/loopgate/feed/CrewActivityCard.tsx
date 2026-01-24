import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Swords, Trophy, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FeedItem } from '@/hooks/useMixedFeed';
import { formatDistanceToNow } from 'date-fns';

interface CrewActivityCardProps {
  item: FeedItem;
}

const activityIcons: Record<string, typeof Users> = {
  recruit: UserPlus,
  join: UserPlus,
  arena: Swords,
  win: Trophy,
  showdown: Swords,
  chat: MessageSquare,
  default: Users,
};

export default function CrewActivityCard({ item }: CrewActivityCardProps) {
  const navigate = useNavigate();
  
  // Determine activity type from title
  const titleLower = item.title?.toLowerCase() || '';
  const activityType = 
    titleLower.includes('recruit') ? 'recruit' :
    titleLower.includes('join') ? 'join' :
    titleLower.includes('arena') ? 'arena' :
    titleLower.includes('win') ? 'win' :
    titleLower.includes('showdown') ? 'showdown' :
    'default';
  
  const Icon = activityIcons[activityType] || activityIcons.default;

  const handleClick = () => {
    if (item.crew_id) {
      navigate(`/crews/${item.crew_id}`);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className="w-full relative bg-surface-0/80 border border-border/50 hover:border-gold/30 p-4 text-left transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Crew emblem or icon */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
          {item.crew_emblem ? (
            <span className="text-lg">{item.crew_emblem}</span>
          ) : (
            <Icon className="w-5 h-5 text-gold" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Crew Activity</span>
            <span className="text-[10px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {/* Title */}
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          
          {/* Description */}
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          )}
          
          {/* Crew name */}
          {item.crew_name && (
            <div className="flex items-center gap-2 mt-2">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-gold">{item.crew_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
