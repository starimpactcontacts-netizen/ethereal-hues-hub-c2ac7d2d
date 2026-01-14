import { Link } from "react-router-dom";
import { Trophy, TrendingUp, TrendingDown, Star, UserPlus, Send, Activity } from "lucide-react";
import { useActivityFeed, ActivityItem } from "@/hooks/useActivityFeed";
import { formatDistanceToNow } from "date-fns";

const activityConfig: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  submission: { icon: Send, color: "text-gold", bg: "bg-gold/10" },
  rank_up: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
  rank_down: { icon: TrendingDown, color: "text-red-400", bg: "bg-red-400/10" },
  win: { icon: Trophy, color: "text-gold", bg: "bg-gold/20" },
  achievement: { icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
  new_editor: { icon: UserPlus, color: "text-blue-400", bg: "bg-blue-400/10" },
};

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

function ActivityItemCard({ activity, compact }: { activity: ActivityItem; compact?: boolean }) {
  const config = activityConfig[activity.activity_type] || { icon: Activity, color: "text-foreground", bg: "bg-muted" };
  const Icon = config.icon;
  const eventId = (activity.data as { event_id?: string })?.event_id;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
          <Icon size={12} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: false })}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          {activity.avatar_url ? (
            <img 
              src={activity.avatar_url} 
              alt={activity.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="font-display text-sm text-muted-foreground">
                {activity.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${config.bg} border-2 border-background`}>
            <Icon size={10} className={config.color} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <Link 
              to={activity.user_id ? `/editor/${activity.user_id}` : '#'}
              className="font-semibold hover:text-gold transition-colors"
            >
              {activity.username}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{activity.title}</p>
          {activity.description && (
            <p className="text-xs text-gold mt-1">{activity.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Event Link */}
        {eventId && (
          <Link 
            to={`/event/${eventId}`}
            className="text-[10px] text-gold uppercase tracking-wider hover:underline shrink-0"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ActivityFeed({ limit = 20, compact = false }: ActivityFeedProps) {
  const { activities, loading } = useActivityFeed(limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Activity will appear here when editors submit entries
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-surface-1 border border-border p-3">
        {activities.slice(0, limit).map((activity) => (
          <ActivityItemCard key={activity.id} activity={activity} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItemCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
