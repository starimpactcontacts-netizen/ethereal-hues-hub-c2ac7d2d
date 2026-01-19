import { useCrewPresence } from "@/hooks/useCrewPresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Circle, Gamepad2, BarChart3 } from "lucide-react";

interface CrewOnlineIndicatorProps {
  crewId: string;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  arena: "bg-blue-500",
  gqt: "bg-purple-500",
  idle: "bg-yellow-500",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  arena: <Gamepad2 className="w-2.5 h-2.5" />,
  gqt: <BarChart3 className="w-2.5 h-2.5" />,
};

export default function CrewOnlineIndicator({ crewId }: CrewOnlineIndicatorProps) {
  const { onlineMembers, onlineCount } = useCrewPresence(crewId);

  if (onlineCount === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Circle className="w-2 h-2 fill-muted-foreground/30" />
        <span className="text-xs">No one online</span>
      </div>
    );
  }

  // Show first 5 avatars, then +X more
  const displayMembers = onlineMembers.slice(0, 5);
  const remaining = onlineCount - 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
        </div>
        <span className="text-xs font-medium text-green-400">{onlineCount} Online</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {displayMembers.map((member) => (
          <div key={member.user_id} className="relative group">
            <Avatar className="w-7 h-7 border-2 border-background">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {member.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator */}
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background flex items-center justify-center ${STATUS_COLORS[member.status || "online"]}`}
            >
              {STATUS_ICONS[member.status || "online"]}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {member.username}
            </div>
          </div>
        ))}
        
        {remaining > 0 && (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
