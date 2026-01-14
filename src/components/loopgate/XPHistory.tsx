import { useXPHistory, XPHistoryEntry } from "@/hooks/useXP";
import { Loader2, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Action labels for display
const actionLabels: Record<string, string> = {
  app_open: "Opened App",
  check_rankings: "Checked Rankings",
  check_arenas: "Visited Arenas",
  view_crew: "Viewed Crew",
  update_profile: "Updated Profile",
  enter_event: "Joined Event",
  submit_edit: "Submitted Edit",
  receive_review: "Received Review",
  dnf: "Event Participation",
  top_10: "Top 10 Finish",
  top_3: "Top 3 Finish",
  event_win: "Event Win",
  enter_top_50: "Entered Top 50",
  enter_top_10: "Entered Top 10",
  rank_1: "Reached #1",
  join_crew: "Joined Crew",
  create_crew: "Created Crew",
  crew_chat: "Crew Chat",
  arena_chat: "Arena Chat",
  verify_platform: "Platform Verified",
  login_streak: "Login Streak",
  invite_sent: "Sent Invite",
  invite_joined: "Friend Joined",
  invite_submitted: "Friend Submitted (24h)",
};

interface XPHistoryProps {
  limit?: number;
}

export default function XPHistory({ limit = 10 }: XPHistoryProps) {
  const { history, loading } = useXPHistory(limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No XP activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start exploring to earn XP!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <XPHistoryRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function XPHistoryRow({ entry }: { entry: XPHistoryEntry }) {
  const label = actionLabels[entry.action] || entry.action;
  const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-surface-1 border border-border">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {entry.description && (
          <p className="text-[10px] text-muted-foreground truncate">{entry.description}</p>
        )}
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
          {timeAgo}
        </p>
      </div>
      <div className="flex-shrink-0 ml-3">
        <span className="text-gold font-semibold text-sm">
          +{entry.xp_amount} XP
        </span>
      </div>
    </div>
  );
}
