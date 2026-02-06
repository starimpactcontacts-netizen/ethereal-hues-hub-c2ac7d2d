import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Shield, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface PresenceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
  status?: "online" | "arena" | "gqt" | "idle";
}

interface Member {
  user_id: string;
  role: "owner" | "officer" | "member";
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ChannelMembersListProps {
  members: Member[];
  onlineMembers: PresenceState[];
}

const STATUS_COLORS = {
  online: "bg-green-500",
  arena: "bg-red-500",
  gqt: "bg-purple-500",
  idle: "bg-yellow-500",
  offline: "bg-muted-foreground/30",
};

const STATUS_LABELS = {
  online: "Online",
  arena: "In Arena",
  gqt: "Taking GQT",
  idle: "Away",
  offline: "Offline",
};

export default function ChannelMembersList({ members, onlineMembers }: ChannelMembersListProps) {
  const navigate = useNavigate();

  // Create a set of online user IDs for quick lookup
  const onlineUserIds = new Set(onlineMembers.map((m) => m.user_id));
  const presenceMap = new Map(onlineMembers.map((m) => [m.user_id, m]));

  // Separate online and offline members
  const online = members.filter((m) => onlineUserIds.has(m.user_id));
  const offline = members.filter((m) => !onlineUserIds.has(m.user_id));

  // Sort by role priority
  const sortByRole = (a: Member, b: Member) => {
    const order = { owner: 0, officer: 1, member: 2 };
    return order[a.role] - order[b.role];
  };

  const renderMember = (member: Member, isOnline: boolean) => {
    const presence = presenceMap.get(member.user_id);
    const status = presence?.status || "offline";
    const displayName = member.profile?.display_name || member.profile?.username || "Unknown";

    return (
      <button
        key={member.user_id}
        onClick={() => navigate(`/u/${member.profile?.username}`)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors group"
      >
        <div className="relative">
          <Avatar className="w-8 h-8">
            <AvatarImage src={member.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-muted">
              {displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-1",
              STATUS_COLORS[isOnline ? status : "offline"]
            )}
          />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "text-sm truncate",
                isOnline ? "text-foreground" : "text-muted-foreground/60"
              )}
            >
              {displayName}
            </span>
            {member.role === "owner" && <Crown className="w-3 h-3 text-gold shrink-0" />}
            {member.role === "officer" && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
          </div>
          {isOnline && status !== "online" && (
            <p className="text-[10px] text-muted-foreground">{STATUS_LABELS[status]}</p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-56 bg-surface-1 border-l border-border flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* Online Members */}
        {online.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-2 mb-1">
              Online — {online.length}
            </h4>
            <div className="space-y-0.5">
              {online.sort(sortByRole).map((member) => renderMember(member, true))}
            </div>
          </div>
        )}

        {/* Offline Members */}
        {offline.length > 0 && (
          <div>
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-2 mb-1">
              Offline — {offline.length}
            </h4>
            <div className="space-y-0.5">
              {offline.sort(sortByRole).map((member) => renderMember(member, false))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
