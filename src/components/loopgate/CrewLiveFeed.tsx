import { useCrewActivity } from "@/hooks/useCrewActivity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Zap, Trophy, Users, FileVideo, TrendingUp, Award, Star } from "lucide-react";

interface CrewLiveFeedProps {
  crewId: string;
  members: Array<{
    user_id: string;
    profile: {
      username: string;
      avatar_url: string | null;
    } | null;
  }>;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  join: <Users className="w-3.5 h-3.5 text-green-400" />,
  submission: <FileVideo className="w-3.5 h-3.5 text-blue-400" />,
  level_up: <TrendingUp className="w-3.5 h-3.5 text-purple-400" />,
  rank_change: <Trophy className="w-3.5 h-3.5 text-gold" />,
  achievement: <Award className="w-3.5 h-3.5 text-pink-400" />,
  xp_earned: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
  arena_win: <Star className="w-3.5 h-3.5 text-gold" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  join: "border-green-500/30 bg-green-500/5",
  submission: "border-blue-500/30 bg-blue-500/5",
  level_up: "border-purple-500/30 bg-purple-500/5",
  rank_change: "border-gold/30 bg-gold/5",
  achievement: "border-pink-500/30 bg-pink-500/5",
  xp_earned: "border-yellow-500/30 bg-yellow-500/5",
  arena_win: "border-gold/30 bg-gold/5",
};

export default function CrewLiveFeed({ crewId, members }: CrewLiveFeedProps) {
  const { activities, loading } = useCrewActivity(crewId);

  // Build member lookup
  const memberMap = new Map(
    members.map((m) => [m.user_id, m.profile])
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs">Be the first to make moves!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const memberProfile = activity.user_id ? memberMap.get(activity.user_id) : null;
        const colorClass = ACTIVITY_COLORS[activity.activity_type] || "border-border bg-muted/20";
        
        return (
          <div
            key={activity.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${colorClass} transition-all hover:scale-[1.01]`}
          >
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={memberProfile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-surface-2">
                  {(memberProfile?.username || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                {ACTIVITY_ICONS[activity.activity_type] || <Zap className="w-3 h-3" />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              )}
            </div>
            
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
