import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StatusBadge from "@/components/loopgate/StatusBadge";
import loopgateLogo from "@/assets/loopgate-logo.png";

interface PublicProfile {
  id: string;
  username: string;
  league: string;
  global_index_score: number;
  win_rate: number;
  total_events: number;
  total_wins: number;
  avatar_url: string | null;
}

interface ConnectedPlatform {
  id: string;
  platform: string;
  platform_username: string;
  follower_count: number;
}

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

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, league, global_index_score, win_rate, total_events, total_wins, avatar_url")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
      }

      // Fetch platforms
      const { data: platformsData } = await supabase
        .from("connected_platforms")
        .select("id, platform, platform_username, follower_count")
        .eq("user_id", userId);

      if (platformsData) {
        setPlatforms(platformsData as ConnectedPlatform[]);
      }

      // Calculate rank
      const { data: rankings } = await supabase
        .from("profiles")
        .select("id")
        .order("global_index_score", { ascending: false });

      if (rankings) {
        const userRank = rankings.findIndex((r) => r.id === userId) + 1;
        setRank(userRank > 0 ? userRank : null);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Editor not found</p>
        <button
          onClick={() => navigate("/index")}
          className="text-gold text-sm underline"
        >
          Back to Index
        </button>
      </div>
    );
  }

  const league = profile.league || "open";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <img src={loopgateLogo} alt="LOOPGATE" className="h-5" />
          <div className="w-8" />
        </div>
      </header>

      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Avatar */}
          {profile.avatar_url && (
            <div className="flex justify-center mb-4">
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-2 border-gold"
              />
            </div>
          )}

          {/* Alias + League */}
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-display text-4xl">{profile.username}</h1>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}
            >
              {league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Global Editor
          </p>

          {/* Global Rank */}
          <div className="my-6 py-6 border-y border-border text-center">
            <p className="font-display text-7xl text-gold">
              #{rank || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">
              Global Rank
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">
                {Number(profile.global_index_score || 0).toFixed(1)}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Index
              </p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">
                {Number(profile.win_rate || 0).toFixed(0)}%
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Win Rate
              </p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">
                {profile.total_events || 0}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Events
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Status
            </span>
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
                  <p className="font-semibold text-sm">
                    {platformLabels[platform.platform] || platform.platform}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {platform.platform_username}
                  </p>
                </div>
                <p className="font-display text-xl text-gold">
                  {formatFollowers(platform.follower_count || 0)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {platforms.length === 0 && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          <p className="text-sm text-muted-foreground">No platforms connected</p>
        </section>
      )}
    </div>
  );
}
