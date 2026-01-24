import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Globe, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AuthorityBadge from "@/components/loopgate/AuthorityBadge";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import CrewBadge from "@/components/loopgate/CrewBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
import SubmissionGrid from "@/components/loopgate/SubmissionGrid";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { getRankFromScore } from "@/data/gqtConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
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
  crew_id: string | null;
  xp: number;
  level: number;
  archetype: string | null;
  software: string[] | null;
  best_gatekeeper_qoi: number | null;
  is_founding_member: boolean;
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

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'dev' | 'enterprise';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userCrew, setUserCrew] = useState<{ id: string; name: string; emblem: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edits' | 'about'>('edits');
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, activity_status, bio, email, discord, portfolio_url, created_at, crew_id, xp, level, archetype, software, best_gatekeeper_qoi")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
        
        // Fetch crew if user has one
        if (profileData.crew_id) {
          const { data: crewData } = await supabase
            .from("crews")
            .select("id, name, emblem, avatar_url")
            .eq("id", profileData.crew_id)
            .single();
          setUserCrew(crewData);
        }
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

      // Fetch submission count
      const [eventParts, roundParts] = await Promise.all([
        supabase
          .from("event_participations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("round_participations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      setSubmissionCount((eventParts.count || 0) + (roundParts.count || 0));

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
  const isEnterprise = roles.includes('enterprise');

  // Calculate GQT Class letter
  const getEditorClass = (): { letter: string; color: string } => {
    if (profile?.best_gatekeeper_qoi && profile.best_gatekeeper_qoi > 0) {
      const rankConfig = getRankFromScore(profile.best_gatekeeper_qoi);
      return { letter: rankConfig.rank, color: rankConfig.color };
    }
    if (profile && profile.level >= 2) {
      return { letter: 'D', color: 'text-orange-400' };
    }
    return { letter: 'F', color: 'text-muted-foreground' };
  };

  const editorClass = profile ? getEditorClass() : { letter: 'F', color: 'text-muted-foreground' };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/editor/${userId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.username || 'Editor'} on LOOPGATE`, url: shareUrl });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Profile link copied!");
    }
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
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Hero Header */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        
        <div className="relative z-10">
          {/* Top Bar - Clean */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div className="w-8" /> {/* Spacer */}
            <button 
              onClick={handleShare}
              className="p-1.5 -mr-1.5 text-muted-foreground hover:text-white"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Profile Info - Compact */}
          <div className="px-4 pt-3 pb-3 flex flex-col items-center text-center">
            {/* Avatar - Neutral colors */}
            <div className="mb-2">
              <Avatar className="w-16 h-16 border-2 border-border">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl font-display">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name & Badges - Compact */}
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap justify-center">
              <h1 className="font-display text-lg">{profile.display_name || profile.username}</h1>
              {profile.level > 1 && <LevelBadge level={profile.level} size="sm" />}
              {profile.verification_status && <VerifiedBadge size="md" />}
              {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
              {profile.is_founding_member && <FoundingBadge size="sm" />}
            </div>
            
            {profile.display_name && (
              <p className="text-[10px] text-muted-foreground mb-1">@{profile.username}</p>
            )}

            {/* League Badge - Compact */}
            <span className={`text-[8px] font-semibold uppercase tracking-[0.12em] border px-1.5 py-0.5 mb-2 ${leagueColors[league]}`}>
              {league}
            </span>

            {/* Stats Row - Compact inline */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-center px-2">
                <p className="font-display text-base text-white">{submissionCount}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Edits</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center px-2">
                <p className="font-display text-base text-gold">#{rank || "—"}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Rank</p>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="text-center px-2">
                <p className="font-display text-base text-white">{Number(profile.global_index_score || 0).toFixed(1)}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Index</p>
              </div>
            </div>

            {/* Crew Badge & Activity - Single row */}
            <div className="flex items-center gap-3">
              {userCrew && <CrewBadge crew={userCrew} size="sm" />}
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activityLabels[profile.activity_status || 'offline']?.color || 'bg-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground">
                  {activityLabels[profile.activity_status || 'offline']?.label || 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('edits')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'edits'
                ? 'text-gold border-b-2 border-gold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Edits
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'about'
                ? 'text-gold border-b-2 border-gold'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'edits' ? (
        <SubmissionGrid userId={userId || ''} />
      ) : (
        <div className="px-4 py-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 bg-surface-1 border border-border">
              <p className={`font-display text-2xl ${editorClass.color}`}>
                {editorClass.letter}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Class
              </p>
            </div>
            <div className="text-center p-3 bg-surface-1 border border-border">
              <p className="font-display text-2xl">
                {Number(profile.global_index_score || 0).toFixed(1)}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Index
              </p>
            </div>
            <div className="text-center p-3 bg-surface-1 border border-border">
              <p className="font-display text-2xl">
                {Number(profile.win_rate || 0).toFixed(0)}%
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Win Rate
              </p>
            </div>
            <div className="text-center p-3 bg-surface-1 border border-border">
              <p className="font-display text-2xl">
                {profile.total_events || 0}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                Events
              </p>
            </div>
          </div>

          {/* Software */}
          {profile.software && profile.software.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Software</p>
              <SoftwareBadges software={profile.software} size="sm" />
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          {(profile.discord || profile.portfolio_url) && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact</p>
              {profile.discord && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
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
                  <Globe size={16} />
                  <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={12} className="flex-shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ExternalLink size={12} />
                Platforms
              </p>
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
          )}

        </div>
      )}
    </div>
  );
}
