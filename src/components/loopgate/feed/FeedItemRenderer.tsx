import { FeedItem } from '@/hooks/useMixedFeed';
import EditDropCard from './EditDropCard';
import JudgeReactionCard from './JudgeReactionCard';
import ArenaEventCard from './ArenaEventCard';
import RankMomentCard from './RankMomentCard';
import CrewActivityCard from './CrewActivityCard';

interface FeedItemRendererProps {
  item: FeedItem;
  index: number;
}

export default function FeedItemRenderer({ item, index }: FeedItemRendererProps) {
  // Edit drops get priority styling for first 3 items
  const isPriority = item.type === 'edit_drop' && index < 3;

  switch (item.type) {
    case 'edit_drop':
      return <EditDropCard item={item} priority={isPriority} />;
    case 'judge_reaction':
      return <JudgeReactionCard item={item} />;
    case 'arena_event':
      return <ArenaEventCard item={item} />;
    case 'rank_moment':
      return <RankMomentCard item={item} />;
    case 'crew_activity':
      return <CrewActivityCard item={item} />;
    default:
      return null;
  }
}
