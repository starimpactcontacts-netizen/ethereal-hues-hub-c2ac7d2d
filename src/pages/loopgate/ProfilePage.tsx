import { ExternalLink, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import StatusBadge from "@/components/loopgate/StatusBadge";

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return String(count);
}

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export default function ProfilePage() {
  const { profile, platforms } = useAuth();
  const { rankings } = useRealRankings();
  
  // Keep session active
  useActiveSession();

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const league = profile.league || 'open';
  
  // Find user's rank from real rankings
  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Alias + League */}
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-display text-4xl">{profile.username}</h1>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}>
              {league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Global Editor
          </p>

          {/* Global Rank - Real Data */}
          <div className="my-6 py-6 border-y border-border text-center">
            <p className="font-display text-7xl text-gold">#{userRank}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Global Rank</p>
          </div>

          {/* Stats Grid - Real Data */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.global_index_score || 0).toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Index</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.win_rate || 0).toFixed(0)}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{profile.total_events || 0}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Events</p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
            <StatusBadge status={profile.total_events > 0 ? "live" : "pending"} />
          </div>
        </div>
      </div>

      {/* Platforms */}
      {platforms.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-surface-1 border border-border p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                  <p className="text-xs text-muted-foreground">{platform.platform_username}</p>
                </div>
                <p className="font-display text-xl text-gold">{formatFollowers(platform.follower_count || 0)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No Platforms State */}
      {platforms.length === 0 && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          <p className="text-sm text-muted-foreground">No platforms connected</p>
        </section>
      )}

      {/* Active Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar size={14} />
          Active Events
        </h3>
        <p className="text-sm text-muted-foreground">No active events</p>
      </section>

      {/* Recent Events */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3">
          Recent Events
        </h3>
        <p className="text-sm text-muted-foreground">No recent events</p>
      </section>
    </div>
  );
}
