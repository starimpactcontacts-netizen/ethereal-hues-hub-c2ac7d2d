import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Mail, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AuthorityBadge from "@/components/loopgate/AuthorityBadge";
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
  verification_status: boolean;
  activity_status: string | null;
  bio: string | null;
  email: string | null;
  discord: string | null;
  portfolio_url: string | null;
  created_at: string | null;
}

interface ConnectedPlatform {
  id: string;
  platform: string;
  platform_username: string;
  platform_url: string;
}

const activityLabels: Record<string, { label: string; color: string }> = {
  online: { label: "Online", color: "bg-green-500" },
  offline: { label: "Offline", color: "bg-muted-foreground" },
  busy: { label: "Editing", color: "bg-gold" },
};

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'dev';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, activity_status, bio, email, discord, portfolio_url, created_at")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
      }

      // Fetch platforms
      const { data: platformsData } = await supabase
        .from("connected_platforms")
        .select("id, platform, platform_username, platform_url")
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

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData) {
        setRoles(rolesData.map(r => r.role as AppRole));
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

  // Get authority role for display
  const getAuthorityRole = (): 'dev' | 'judge' | null => {
    if (roles.includes('dev')) return 'dev';
    if (roles.includes('judge')) return 'judge';
    return null;
  };

  const authorityRole = getAuthorityRole();

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

  const formatJoinDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

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

          {/* Alias + League + Verified + Authority */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-4xl">{profile.username}</h1>
              {profile.verification_status && <VerifiedBadge size="lg" />}
              {authorityRole && <AuthorityBadge role={authorityRole} size="md" />}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}
            >
              {league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Global Editor{profile.created_at && ` since ${formatJoinDate(profile.created_at)}`}
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

          {/* Activity Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activityLabels[profile.activity_status || 'offline']?.color || 'bg-muted-foreground'}`} />
              <span className="text-xs font-medium">
                {activityLabels[profile.activity_status || 'offline']?.label || 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Bio */}
      {(profile.bio || profile.email || profile.discord || profile.portfolio_url) && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3">
            About
          </h3>
          <div className="bg-surface-1 border border-border p-4 space-y-3">
            {profile.bio && (
              <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
            )}
            
            {(profile.email || profile.discord || profile.portfolio_url) && (
              <div className={`space-y-2 ${profile.bio ? 'pt-3 border-t border-border' : ''}`}>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Mail size={14} />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile.discord && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span>{profile.discord}</span>
                  </div>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Globe size={14} />
                    <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={10} className="flex-shrink-0" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Platforms */}
      {platforms.length > 0 && (
        <section className="px-4 py-4">
          <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
            <ExternalLink size={14} />
            Platforms
          </h3>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <a
                key={platform.id}
                href={platform.platform_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-1 border border-border p-3 flex items-center justify-between hover:border-gold/50 transition-colors block"
              >
                <div>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {platformLabels[platform.platform] || platform.platform}
                    <ExternalLink size={12} className="text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{platform.platform_username}
                  </p>
                </div>
              </a>
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
