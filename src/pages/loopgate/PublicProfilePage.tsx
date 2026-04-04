import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Globe, Share2, Video } from "lucide-react";
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
import MessageButton from "@/components/loopgate/MessageButton";
import PublicJudgeVideos from "@/components/loopgate/PublicJudgeVideos";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { getRankFromScore } from "@/data/gqtConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "@icons-pack/react-simple-icons";
import ConnectButton from "@/components/loopgate/ConnectButton";
import { Users } from "lucide-react";
import StatsRadarChart from "@/components/loopgate/StatsRadarChart";
// IndexEarnBadge removed — Index is NOT money
import { useEquippedBadges } from "@/hooks/useEquippedBadges";
import LinkTreePreview from "@/components/loopgate/LinkTreePreview";
import type { LinkPageSettings, EditorLink } from "@/hooks/useEditorLinkPage";

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
  connection_count: number;
  profile_bg_color: string | null;
  profile_bg_image_url: string | null;
  earnings_cents: number;
  show_earnings: boolean;
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
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userCrew, setUserCrew] = useState<{ id: string; name: string; emblem: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'edits' | 'links' | 'about'>('edits');
   const [submissionCount, setSubmissionCount] = useState(0);
   const [videoCount, setVideoCount] = useState(0);
   const [isJudge, setIsJudge] = useState(false);
   const [realStats, setRealStats] = useState<{ totalEvents: number; winRate: number; totalWins: number }>({ totalEvents: 0, winRate: 0, totalWins: 0 });
   const [realConnectionCount, setRealConnectionCount] = useState(0);
  const [linkPageSettings, setLinkPageSettings] = useState<LinkPageSettings | null>(null);
  const [editorLinks, setEditorLinks] = useState<EditorLink[]>([]);
  const { hasEquippedOG } = useEquippedBadges(resolvedUserId || undefined);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      // Resolve by UUID or username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      const { data: profileData } = await supabase
        .from("profiles")
         .select("id, username, display_name, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, activity_status, bio, email, discord, portfolio_url, created_at, crew_id, xp, level, archetype, software, best_gatekeeper_qoi, is_founding_member, connection_count, profile_bg_color, profile_bg_image_url, earnings_cents, show_earnings")
        .eq(isUUID ? "id" : "username", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
        setResolvedUserId(profileData.id);
        
        // Fetch unit if user has one
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
        .eq("user_id", profileData.id);

      if (platformsData) {
        setPlatforms(platformsData as ConnectedPlatform[]);
      }

      // Calculate rank
      const { data: rankings } = await supabase
        .from("profiles")
        .select("id")
        .order("global_index_score", { ascending: false });

      if (rankings) {
        const userRank = rankings.findIndex((r) => r.id === profileData.id) + 1;
        setRank(userRank > 0 ? userRank : null);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profileData.id);

      if (rolesData) {
        const userRoles = rolesData.map(r => r.role as AppRole);
        setRoles(userRoles);
        const userIsJudge = userRoles.includes('judge');
        setIsJudge(userIsJudge);
        if (userIsJudge) setActiveTab('videos');
        
        // Fetch judge video count if judge
        if (userIsJudge) {
          const { count: vidCount } = await supabase
            .from('judge_rating_videos')
            .select('*', { count: 'exact', head: true })
            .eq('judge_id', profileData.id);
          setVideoCount(vidCount || 0);
        }
      }

      // Fetch submission count and activity stats in parallel
      const uid = profileData.id;
      const [eventParts, roundParts, hostedSubs, battlesData, friendlyTournaments, sanctionedTournaments, hostedWins, eventWins, friendlyWins, sanctionedWins] = await Promise.all([
        supabase
          .from("event_participations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("round_participations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        supabase
          .from("hosted_competition_submissions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        // Get all completed battles where user participated
        supabase
          .from("battles")
          .select("challenger_id, opponent_id, winner_id")
          .eq("status", "completed")
          .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`),
        // Friendly tournaments
        supabase
          .from("friendly_tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        // Sanctioned tournaments - THE KEY TABLE
        supabase
          .from("sanctioned_tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        // Hosted comp wins (1st place)
        supabase
          .from("hosted_competition_submissions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("winner_place", 1),
        // Official event wins (final_rank = 1)
        supabase
          .from("event_participations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("final_rank", 1),
        // Friendly tournament wins
        supabase
          .from("friendly_tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("final_rank", 1),
        // Sanctioned tournament wins (final_rank = 1)
        supabase
          .from("sanctioned_tournament_participants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("final_rank", 1),
      ]);
      
      const battles = battlesData.data || [];
      const battleCount = battles.length;
      const battleWins = battles.filter(b => b.winner_id === uid).length;

      const submissionTotal = (eventParts.count || 0) + (roundParts.count || 0) + (hostedSubs.count || 0) + battleCount;
      setSubmissionCount(submissionTotal);
      
      // Calculate real event stats - include ALL event types
      const eventCount = (roundParts.count || 0) + (hostedSubs.count || 0) + (eventParts.count || 0) + (friendlyTournaments.count || 0) + (sanctionedTournaments.count || 0);
      
      // Total wins from ALL sources
      const totalWins = battleWins + (hostedWins.count || 0) + (eventWins.count || 0) + (friendlyWins.count || 0) + (sanctionedWins.count || 0);
      const totalEvents = eventCount + battleCount;
      const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;
      
      setRealStats({ totalEvents, winRate, totalWins });

      // Fetch real connection count
      const { count: connCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
      setRealConnectionCount(connCount || 0);

      // Fetch link page
      const [linkPageRes, linksRes] = await Promise.all([
        supabase.from("editor_link_pages").select("*").eq("user_id", profileData.id).eq("is_published", true).maybeSingle(),
        supabase.from("editor_links").select("*").eq("user_id", profileData.id).eq("is_active", true).order("sort_order", { ascending: true }),
      ]);
      if (linkPageRes.data) setLinkPageSettings(linkPageRes.data as unknown as LinkPageSettings);
      if (linksRes.data) setEditorLinks(linksRes.data as unknown as EditorLink[]);

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
    const shareUrl = `${window.location.origin}/u/${profile?.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.display_name || profile?.username} on LOOPGATE`, url: shareUrl });
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

   // Get background gradient based on color selection
   const bgColorGradients: Record<string, string> = {
     gold: 'from-gold/20 via-gold/5 to-transparent',
     purple: 'from-purple-500/20 via-purple-500/5 to-transparent',
     cyan: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
     red: 'from-red-500/20 via-red-500/5 to-transparent',
     emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
     zinc: 'from-zinc-400/20 via-zinc-400/5 to-transparent',
   };
 
   const bgAccentColors: Record<string, string> = {
     gold: 'rgba(212,175,55,0.08)',
     purple: 'rgba(168,85,247,0.08)',
     cyan: 'rgba(6,182,212,0.08)',
     red: 'rgba(239,68,68,0.08)',
     emerald: 'rgba(16,185,129,0.08)',
     zinc: 'rgba(161,161,170,0.08)',
   };
 
   const selectedBgColor = profile.profile_bg_color || 'gold';
   const hasBgImage = profile.profile_bg_image_url && profile.level >= 3;
 
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden">
        {/* Background */}
        {hasBgImage ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.profile_bg_image_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${bgAccentColors[selectedBgColor] || bgAccentColors.gold} 0%, transparent 50%)`
          }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        <div className="relative z-10">
          {/* Top bar — back, activity status, share */}
          <div className="px-4 pt-3 pb-0 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activityLabels[profile.activity_status || 'offline']?.color || 'bg-muted-foreground'}`} />
                <span className="text-[9px] text-muted-foreground">
                  {activityLabels[profile.activity_status || 'offline']?.label || 'Offline'}
                </span>
              </div>
              <button onClick={handleShare} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Profile core */}
          <div className="px-5 pt-3 pb-3 flex flex-col items-center text-center">
            {/* Avatar — smaller */}
            <div className="mb-2 relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-b from-gold/30 to-transparent opacity-60" />
              <Avatar className="relative w-20 h-20 border-2 border-foreground/10">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} className="object-cover" />
                <AvatarFallback className="bg-surface-1 text-muted-foreground text-xl font-display">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name + badges */}
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap justify-center">
              <h1 className="font-display text-lg tracking-wide leading-none">{profile.display_name || profile.username}</h1>
              {profile.level > 1 && <LevelBadge level={profile.level} size="sm" />}
              {profile.verification_status && <VerifiedBadge size="md" />}
              {authorityRole && <AuthorityBadge role={authorityRole} size="md" />}
              {(hasEquippedOG || profile.is_founding_member) && <FoundingBadge size="sm" />}
            </div>
            <p className="text-[11px] text-muted-foreground/60 mb-3">@{profile.username}</p>

            {/* TikTok stats row */}
            <div className="flex items-center justify-center mb-3 w-full max-w-[280px]">
              <div className="flex-1 flex flex-col items-center">
                <span className="font-display text-base font-bold tabular-nums leading-none">{isJudge ? videoCount : submissionCount}</span>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5">{isJudge ? 'Videos' : 'Edits'}</span>
              </div>
              <div className="w-px h-7 bg-border/30" />
              <div className="flex-1 flex flex-col items-center">
                <span className="font-display text-base font-bold tabular-nums leading-none">{realConnectionCount}</span>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5">Connections</span>
              </div>
              <div className="w-px h-7 bg-border/30" />
              <div className="flex-1 flex flex-col items-center">
                <span className="font-display text-base font-bold tabular-nums leading-none text-gold">#{rank || '—'}</span>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5">Rank</span>
              </div>
            </div>

            {/* TikTok-style buttons: Connect (wide, primary) | Message (outlined) | dropdown */}
            <div className="flex items-center gap-1.5 w-full max-w-[300px] mb-2">
              <div className="flex-1">
                <ConnectButton targetUserId={profile.id} className="w-full" />
              </div>
              <MessageButton userId={profile.id} username={profile.username} variant="icon" />
              {isJudge && (
                <button
                  onClick={() => navigate(`/judge/${profile.username}`)}
                  className="h-9 px-3 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity"
                >
                  Rate
                </button>
              )}
            </div>

            {/* Unit badge */}
            {userCrew && (
              <div className="mb-1.5">
                <CrewBadge crew={userCrew} size="md" />
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-[12px] text-foreground/70 max-w-[280px] text-center leading-relaxed mb-1.5">
                {profile.bio}
              </p>
            )}

            {/* Social icons */}
            {platforms.length > 0 && (
              <div className="flex items-center gap-3">
                {platforms.map((p) => {
                  const Icon = p.platform === 'tiktok' ? SiTiktok
                    : p.platform === 'instagram' ? SiInstagram
                    : p.platform === 'youtube' ? SiYoutube
                    : p.platform === 'x' ? SiX
                    : ExternalLink;
                  return (
                    <a key={p.id} href={p.platform_url} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground/50 hover:text-foreground transition-colors">
                      <Icon size={14} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/20">
        <div className="flex">
          {isJudge && (
            <button onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'videos' ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground/50 hover:text-foreground'
              }`}>
              <Video size={11} /> Videos
            </button>
          )}
          <button onClick={() => setActiveTab('edits')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'edits' ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground/50 hover:text-foreground'
            }`}>
            Edits
          </button>
          {platforms.length > 0 && (
            <button onClick={() => setActiveTab('links')}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTab === 'links' ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground/50 hover:text-foreground'
              }`}>
              Links
            </button>
          )}
          <button onClick={() => setActiveTab('about')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'about' ? 'text-gold border-b-2 border-gold' : 'text-muted-foreground/50 hover:text-foreground'
            }`}>
            About
          </button>
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'videos' && isJudge ? (
        <PublicJudgeVideos userId={resolvedUserId || ''} />
      ) : activeTab === 'edits' ? (
        <SubmissionGrid userId={resolvedUserId || ''} />
      ) : activeTab === 'links' ? (
        linkPageSettings ? (
          <LinkTreePreview
            settings={linkPageSettings}
            links={editorLinks}
            profile={profile}
            isPublic
            platforms={platforms}
            stats={{ classLetter: editorClass.letter, indexScore: profile.global_index_score || 0, rank: rank || 0 }}
          />
        ) : (
          <div className="px-4 py-5 space-y-2">
            {platforms.map((p) => {
              const PlatformIcon = p.platform === 'tiktok' ? SiTiktok
                : p.platform === 'instagram' ? SiInstagram
                : p.platform === 'youtube' ? SiYoutube
                : Globe;
              return (
                <a key={p.id} href={p.platform_url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 bg-foreground/[0.03] border border-border/20 rounded-lg hover:border-gold/30 transition-all">
                  <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <PlatformIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-foreground">{platformLabels[p.platform] || p.platform}</p>
                    <p className="text-[10px] text-muted-foreground/50 truncate">@{p.platform_username}</p>
                  </div>
                  <ExternalLink size={12} className="text-muted-foreground/30 group-hover:text-gold transition-colors" />
                </a>
              );
            })}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 bg-foreground/[0.03] border border-border/20 rounded-lg hover:border-gold/30 transition-all">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Globe size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs text-foreground">Portfolio</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate">{profile.portfolio_url.replace(/^https?:\/\//, '').split('/')[0]}</p>
                </div>
                <ExternalLink size={12} className="text-muted-foreground/30 group-hover:text-gold transition-colors" />
              </a>
            )}
          </div>
        )
      ) : (
        <div className="px-4 py-5 space-y-5">
          {/* Pentagon Radar Stats */}
          <div className="bg-foreground/[0.03] border border-border/20 rounded-xl p-3">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1 text-center font-bold">Performance</p>
            <StatsRadarChart
              indexScore={profile.global_index_score || 0}
              winRate={realStats.winRate}
              totalEvents={realStats.totalEvents}
              classLetter={editorClass.letter}
              league={league}
            />
            {/* Stat values row below chart */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="text-center">
                <p className={`font-display text-sm leading-none ${leagueColors[league]?.split(' ')[0] || 'text-muted-foreground'}`}>
                  {league === 'elite' ? 'ELT' : league === 'pro' ? 'PRO' : 'OPN'}
                </p>
                <p className="text-[7px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">League</p>
              </div>
              <div className="text-center">
                <p className={`font-display text-sm leading-none ${editorClass.color}`}>{editorClass.letter}</p>
                <p className="text-[7px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Class</p>
              </div>
              <div className="text-center">
                <p className="font-display text-sm text-gold leading-none tabular-nums">{Number(profile.global_index_score || 0).toFixed(1)}</p>
                <p className="text-[7px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Index</p>
              </div>
              <div className="text-center">
                <p className="font-display text-sm leading-none tabular-nums">{realStats.winRate.toFixed(0)}%</p>
                <p className="text-[7px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Wins</p>
              </div>
              <div className="text-center">
                <p className="font-display text-sm leading-none tabular-nums">{realStats.totalEvents}</p>
                <p className="text-[7px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Events</p>
              </div>
            </div>
          </div>

          {/* Earnings — only if shown */}
          {profile.show_earnings && (
            <div className="flex items-center gap-3 p-3 bg-foreground/[0.03] border border-border/20 rounded-lg">
              <span className="text-emerald-400 font-display text-lg">${((profile.earnings_cents || 0) / 100).toFixed(0)}</span>
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Lifetime Earned</span>
            </div>
          )}

          {/* Member Since */}
          {profile.created_at && (
            <div>
              <p className="text-[9px] text-gold/70 uppercase tracking-widest mb-0.5 font-bold">On LOOPGATE Since</p>
              <p className="text-sm font-display text-foreground/80">
                {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Software */}
          {profile.software && profile.software.length > 0 && (
            <div>
              <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-2">Software</p>
              <SoftwareBadges software={profile.software} size="sm" />
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Bio</p>
              <p className="text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Contact */}
          {(profile.discord || profile.portfolio_url) && (
            <div className="space-y-2">
              <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Contact</p>
              {profile.discord && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>{profile.discord}</span>
                </div>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-gold transition-colors">
                  <Globe size={14} />
                  <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={10} className="flex-shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
