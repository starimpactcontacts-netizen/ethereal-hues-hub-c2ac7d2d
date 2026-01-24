import { motion } from 'framer-motion';
import { Gavel, CheckCircle, AlertTriangle, Trophy, Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FeedItem } from '@/hooks/useMixedFeed';
import { formatDistanceToNow } from 'date-fns';

interface JudgeReactionCardProps {
  item: FeedItem;
}

const reactionStyles = {
  approved: {
    icon: CheckCircle,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    emoji: '🔥',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    emoji: '⚠️',
  },
  winner: {
    icon: Trophy,
    bg: 'bg-gold/15',
    border: 'border-gold/40',
    text: 'text-gold',
    emoji: '🏆',
  },
  milestone: {
    icon: Star,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    emoji: '⭐',
  },
};

export default function JudgeReactionCard({ item }: JudgeReactionCardProps) {
  // Determine reaction type from data
  const score = (item.data?.score as number) || 0;
  const reactionType = score >= 90 ? 'winner' : score >= 70 ? 'approved' : 'warning';
  const isMilestone = item.title?.toLowerCase().includes('milestone');
  const style = isMilestone ? reactionStyles.milestone : reactionStyles[reactionType];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative ${style.bg} border ${style.border} backdrop-blur-sm p-4 overflow-hidden`}
    >
      {/* Glow accent */}
      <div className={`absolute top-0 left-0 w-1 h-full ${style.text} opacity-60`} />
      
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Judge indicator */}
        <div className={`shrink-0 w-10 h-10 rounded-full ${style.bg} border ${style.border} flex items-center justify-center`}>
          <Gavel className={`w-5 h-5 ${style.text}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judge Review</span>
            <span className="text-lg">{style.emoji}</span>
          </div>
          
          <p className="text-sm font-medium text-foreground mb-1">{item.title}</p>
          
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          )}
          
          {/* User who received */}
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="w-5 h-5 border border-border">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-surface-1">
                {item.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">@{item.username}</span>
            <span className="text-[10px] text-muted-foreground/50">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Score badge if exists */}
        {score > 0 && (
          <div className={`shrink-0 px-3 py-2 ${style.bg} border ${style.border} rounded flex flex-col items-center`}>
            <span className={`font-display text-2xl ${style.text}`}>{score}</span>
            <span className="text-[8px] uppercase tracking-wider text-muted-foreground">QOI</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
