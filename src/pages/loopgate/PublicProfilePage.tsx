import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Globe, Share2, Video, Trophy, Swords, TrendingUp, Calendar, Zap } from "lucide-react";
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
import { getRankFromScore } from "@/data/gqtConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiTiktok, SiInstagram, SiYoutube, SiX } from "@icons-pack/react-simple-icons";
import ConnectButton from "@/components/loopgate/ConnectButton";
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

const activityLabels: Record<string, { label: string; color: string; glow: string }> = {
  online: { label: "Online", color: "bg-emerald-400", glow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]" },
  offline: { label: "Offline", color: "bg-muted-foreground/50", glow: "" },
  busy: { label: "Editing", color: "bg-gold", glow: "shadow-[0_0_8px_rgba(212,175,55,0.6)]" },
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
  const [linkPageSettings, setLinkPageSettings] = useState<LinkPageSettings | null>(null);
  const [editorLinks, setEditorLinks] = useState<EditorLink[]>([]);
  const { hasEquippedOG } = useEquippedBadges(resolvedUserId || undefined);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name, league, global_index_score, win_rate, total_events, total_wins, avatar_url, verification_status, activity_status, bio, email, discord, portfolio_url, created_at, crew_id, xp, level, archetype, software, best_gatekeeper_qoi, is_founding_member, connection_count, profile_bg_color, profile_bg_image_url, earnings_cents, show_earnings")
        .eq(isUUID ? "id" : "username", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
        setResolvedUserId(profileData.id);
        
        if (profileData.crew_id) {
          const { data: crewData } = await supabase
            .from("crews")
            .select("id, name, emblem, avatar_url")
            .eq("id", profileData.crew_id)
            .single();
          setUserCrew(crewData);
        }
      }

      const { data: platformsData } = await supabase
        .from("connected_platforms")
        .select("id, platform, platform_username, platform_url")
        .eq("user_id", profileData.id);

      if (platformsData) setPlatforms(platformsData as ConnectedPlatform[]);

      const { data: rankings } = await supabase
        .from("profiles")
        .select("id")
        .order("global_index_score", { ascending: false });

      if (rankings) {
        const userRank = rankings.findIndex((r) => r.id === profileData.id) + 1;
        setRank(userRank > 0 ? userRank : null);
      }

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
        
        if (userIsJudge) {
          const { count: vidCount } = await supabase
            .from('judge_rating_videos')
            .select('*', { count: 'exact', head: true })
            .eq('judge_id', profileData.id);
          setVideoCount(vidCount || 0);
        }
      }

      const uid = profileData.id;
      const [eventParts, roundParts, hostedSubs, battlesData, friendlyTournaments, sanctionedTournaments, hostedWins, eventWins, friendlyWins, sanctionedWins] = await Promise.all([
        supabase.from("event_participations").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("round_participations").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("hosted_competition_submissions").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("battles").select("challenger_id, opponent_id, winner_id").eq("status", "completed").or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`),
        supabase.from("friendly_tournament_participants").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("sanctioned_tournament_participants").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("hosted_competition_submissions").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("winner_place", 1),
        supabase.from("event_participations").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("final_rank", 1),
        supabase.from("friendly_tournament_participants").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("final_rank", 1),
        supabase.from("sanctioned_tournament_participants").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("final_rank", 1),
      ]);
      
      const submissionTotal = (eventParts.count || 0) + (roundParts.count || 0);
      setSubmissionCount(submissionTotal);
      
      const eventCount = (roundParts.count || 0) + (hostedSubs.count || 0) + (eventParts.count || 0) + (friendlyTournaments.count || 0) + (sanctionedTournaments.count || 0);
      const battles = battlesData.data || [];
      const battleCount = battles.length;
      const battleWins = battles.filter(b => b.winner_id === uid).length;
      const totalWins = battleWins + (hostedWins.count || 0) + (eventWins.count || 0) + (friendlyWins.count || 0) + (sanctionedWins.count || 0);
      const totalEvents = eventCount + battleCount;
      const winRate = totalEvents > 0 ? (totalWins / totalEvents) * 100 : 0;
      
      setRealStats({ totalEvents, winRate, totalWins });

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

  const leagueConfig: Record<string, { label: string; color: string; bg: string }> = {
    elite: { label: "Elite", color: "text-gold", bg: "bg-gold/10 border-gold/30" },
    pro: { label: "Pro", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
    open: { label: "Open", color: "text-muted-foreground", bg: "bg-muted/30 border-border" },
  };

  const getAuthorityRole = (): 'dev' | 'judge' | null => {
    if (roles.includes('dev')) return 'dev';
    if (roles.includes('judge')) return 'judge';
    return null;
  };

  const authorityRole = getAuthorityRole();

  const getEditorClass = (): { letter: string; color: string } => {
    if (profile?.best_gatekeeper_qoi && profile.best_gatekeeper_qoi > 0) {
      const rankConfig = getRankFromScore(profile.best_gatekeeper_qoi);
      return { letter: rankConfig.rank, color: rankConfig.color };
    }
    if (profile && profile.level >= 2) return { letter: 'D', color: 'text-orange-400' };
    return { letter: 'F', color: 'text-muted-foreground' };
  };

  const editorClass = profile ? getEditorClass() : { letter: 'F', color: 'text-muted-foreground' };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/u/${profile?.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile?.display_name || profile?.username} on LOOPGATE`, url: shareUrl });
      } catch { /* cancelled */ }
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
        <button onClick={() => navigate("/index")} className="text-gold text-sm underline">Back to Index</button>
      </div>
    );
  }

  const league = profile.league || "open";
  const leagueStyle = leagueConfig[league] || leagueConfig.open;
  const activity = activityLabels[profile.activity_status || 'offline'] || activityLabels.offline;
  const indexScore = Number(profile.global_index_score || 0).toFixed(1);

  const bgAccentHues: Record<string, string> = {
    gold: '43, 74%, 49%',
    purple: '270, 70%, 55%',
    cyan: '190, 90%, 50%',
    red: '0, 70%, 50%',
    emerald: '160, 70%, 40%',
    zinc: '240, 5%, 50%',
  };
  const selectedHue = bgAccentHues[profile.profile_bg_color || 'gold'] || bgAccentHues.gold;
  const hasBgImage = profile.profile_bg_image_url && profile.level >= 3;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ═══ CINEMATIC HERO ═══ */}
      <div className="relative overflow-hidden">
        {/* Background — blurred avatar or custom bg */}
        {hasBgImage ? (
          <div 
            className="absolute inset-0 h-[340px] bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${profile.profile_bg_image_url})`, filter: 'blur(2px)' }}
          />
        ) : profile.avatar_url ? (
          <div 
            className="absolute inset-0 h-[340px] bg-cover bg-center scale-150 opacity-30"
            style={{ backgroundImage: `url(${profile.avatar_url})`, filter: 'blur(60px) saturate(1.5)' }}
          />
        ) : (
          <div 
            className="absolute inset-0 h-[340px]"
            style={{ background: `radial-gradient(ellipse at 50% 0%, hsla(${selectedHue}, 0.15), transparent 70%)` }}
          />
        )}

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 h-[340px] bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 h-[340px]" style={{ background: `radial-gradient(ellipse at 50% 30%, hsla(${selectedHue}, 0.08), transparent 60%)` }} />
        
        {/* Top nav */}
        <div className="relative z-20 px-4 pt-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full bg-background/40 backdrop-blur-md border border-border/30 hover:bg-background/60 transition-all">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <button onClick={handleShare} className="p-2 -mr-2 rounded-full bg-background/40 backdrop-blur-md border border-border/30 hover:bg-background/60 transition-all">
            <Share2 size={14} className="text-foreground" />
          </button>
        </div>

        {/* ═══ AVATAR + IDENTITY ═══ */}
        <div className="relative z-10 flex flex-col items-center pt-6 pb-5 px-4">
          {/* Avatar with animated ring */}
          <div className="relative mb-4 group">
            {/* Outer glow ring */}
            <div 
              className="absolute -inset-2 rounded-full opacity-60 blur-md"
              style={{ background: `conic-gradient(from 0deg, hsla(${selectedHue}, 0.5), transparent 40%, hsla(${selectedHue}, 0.3) 60%, transparent 80%, hsla(${selectedHue}, 0.5))` }}
            />
            {/* Inner ring */}
            <div 
              className="absolute -inset-1 rounded-full"
              style={{ background: `conic-gradient(from 180deg, hsla(${selectedHue}, 0.6), hsla(${selectedHue}, 0.1) 25%, hsla(${selectedHue}, 0.4) 50%, hsla(${selectedHue}, 0.1) 75%, hsla(${selectedHue}, 0.6))` }}
            />
            <Avatar className="relative w-28 h-28 border-[3px] border-background shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} className="object-cover" />
              <AvatarFallback className="bg-surface-1 text-muted-foreground text-3xl font-display">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Activity indicator */}
            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${activity.color} ${activity.glow} border-2 border-background`} />
          </div>

          {/* Name + badges row */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap justify-center">
            <h1 className="font-display text-[28px] tracking-wide leading-none text-foreground uppercase">
              {profile.display_name || profile.username}
            </h1>
            {profile.level > 1 && <LevelBadge level={profile.level} size="sm" />}
            {profile.verification_status && <VerifiedBadge size="md" />}
            {authorityRole && <AuthorityBadge role={authorityRole} size="md" />}
            {(hasEquippedOG || profile.is_founding_member) && <FoundingBadge size="sm" />}
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">@{profile.username}</p>

          {/* Crew + Activity */}
          <div className="flex items-center gap-2.5 mb-4">
            {userCrew && <CrewBadge crew={userCrew} size="md" />}
            {profile.archetype && <ArchetypeBadge archetype={profile.archetype} size="sm" />}
          </div>

          {/* ═══ INDEX HERO CARD — the main prestige metric ═══ */}
          <div className="w-full max-w-sm mb-4">
            <div 
              className="relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-xl p-4"
              style={{ background: `linear-gradient(135deg, hsla(${selectedHue}, 0.06), hsla(0, 0%, 7%, 0.9) 60%)` }}
            >
              <div className="flex items-center justify-between">
                {/* Index Score */}
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[42px] leading-none text-gold tabular-nums tracking-tight">{indexScore}</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gold/80 uppercase tracking-[0.2em] font-bold">Index</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
                  </div>
                </div>
                {/* Rank */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <TrendingUp size={12} className="text-muted-foreground" />
                    <span className="font-display text-2xl text-foreground tabular-nums">#{rank || "—"}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Global Rank</span>
                </div>
              </div>
              {/* Bottom stats strip */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${leagueStyle.bg} ${leagueStyle.color}`}>
                  {leagueStyle.label}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Swords size={10} /> 
                  <span className="tabular-nums font-bold text-foreground">{realStats.totalEvents}</span> events
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Trophy size={10} /> 
                  <span className="tabular-nums font-bold text-foreground">{realStats.winRate.toFixed(0)}%</span> win
                </div>
                {profile.show_earnings && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 ml-auto">
                    <span className="font-bold tabular-nums">${((profile.earnings_cents || 0) / 100).toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ ACTION BUTTONS ═══ */}
          <div className="flex items-center gap-2.5 mb-4 w-full max-w-sm">
            {isJudge && (
              <button
                onClick={() => navigate(`/judge/${profile.username}`)}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity"
              >
                Get Rated
              </button>
            )}
            <div className="flex-1">
              <ConnectButton targetUserId={profile.id} />
            </div>
            <MessageButton userId={profile.id} username={profile.username} variant="icon" />
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/80 max-w-sm text-center leading-relaxed mb-3">
              {profile.bio}
            </p>
          )}
          
          {/* Platform pills */}
          {platforms.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {platforms.map((p) => {
                const Icon = p.platform === 'tiktok' ? SiTiktok 
                  : p.platform === 'instagram' ? SiInstagram 
                  : p.platform === 'youtube' ? SiYoutube 
                  : p.platform === 'x' ? SiX
                  : ExternalLink;
                return (
                  <a
                    key={p.id}
                    href={p.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-1/80 backdrop-blur-sm border border-border/50 rounded-full text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                  >
                    <Icon size={12} />
                    {platformLabels[p.platform] || p.platform}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border/50">
        <div className="flex px-2">
          {isJudge && (
            <TabButton active={activeTab === 'videos'} onClick={() => setActiveTab('videos')} icon={<Video size={13} />} label="Videos" />
          )}
          <TabButton active={activeTab === 'edits'} onClick={() => setActiveTab('edits')} label="Edits" />
          {platforms.length > 0 && (
            <TabButton active={activeTab === 'links'} onClick={() => setActiveTab('links')} label="Links" />
          )}
          <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} label="About" />
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
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
          <div className="px-4 py-6 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4 font-bold">Connected Platforms</p>
            {platforms.map((p) => {
              const PlatformIcon = p.platform === 'tiktok' ? SiTiktok 
                : p.platform === 'instagram' ? SiInstagram 
                : p.platform === 'youtube' ? SiYoutube 
                : Globe;
              return (
                <a key={p.id} href={p.platform_url} target="_blank" rel="noopener noreferrer" 
                  className="group flex items-center gap-4 p-4 bg-surface-1 border border-border/50 rounded-xl hover:border-gold/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <PlatformIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{platformLabels[p.platform] || p.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">@{p.platform_username}</p>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              );
            })}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" 
                className="group flex items-center gap-4 p-4 bg-surface-1 border border-border/50 rounded-xl hover:border-gold/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Globe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">Portfolio</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.portfolio_url.replace(/^https?:\/\//, '').split('/')[0]}</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            )}
          </div>
        )
      ) : (
        <AboutTab 
          profile={profile} 
          league={league} 
          leagueStyle={leagueStyle} 
          editorClass={editorClass} 
          indexScore={indexScore} 
          realStats={realStats} 
          platforms={platforms} 
        />
      )}
    </div>
  );
}

// ─── Tab Button Component ─────────────────────────────────────────
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 relative ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
      }`}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />
      )}
    </button>
  );
}

// ─── About Tab Component ─────────────────────────────────────────
function AboutTab({ profile, league, leagueStyle, editorClass, indexScore, realStats, platforms }: {
  profile: PublicProfile;
  league: string;
  leagueStyle: { label: string; color: string; bg: string };
  editorClass: { letter: string; color: string };
  indexScore: string;
  realStats: { totalEvents: number; winRate: number; totalWins: number };
  platforms: ConnectedPlatform[];
}) {
  return (
    <div className="px-4 py-5 space-y-5">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="League" value={leagueStyle.label} valueClass={leagueStyle.color} icon={<Zap size={12} />} />
        <StatCard label="Class" value={editorClass.letter} valueClass={editorClass.color} icon={<Trophy size={12} />} />
        <StatCard label="Wins" value={String(realStats.totalWins)} icon={<Swords size={12} />} />
      </div>

      {/* Member Since */}
      {profile.created_at && (
        <div className="flex items-center gap-3 p-4 bg-surface-1 border border-border/50 rounded-xl">
          <Calendar size={16} className="text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">On Loopgate Since</p>
            <p className="text-sm font-display text-foreground">
              {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Software */}
      {profile.software && profile.software.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Software</p>
          <SoftwareBadges software={profile.software} size="sm" />
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Bio</p>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Contact */}
      {(profile.discord || profile.portfolio_url) && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Contact</p>
          {profile.discord && (
            <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border/50 rounded-xl text-sm text-muted-foreground">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>{profile.discord}</span>
            </div>
          )}
          {profile.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" 
              className="flex items-center gap-3 p-3 bg-surface-1 border border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
              <Globe size={16} className="shrink-0" />
              <span className="truncate">{profile.portfolio_url.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={12} className="shrink-0 ml-auto" />
            </a>
          )}
        </div>
      )}

      {/* Platforms in About */}
      {platforms.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
            <ExternalLink size={10} /> Platforms
          </p>
          {platforms.map((platform) => (
            <a key={platform.id} href={platform.platform_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-surface-1 border border-border/50 rounded-xl hover:border-foreground/20 transition-all">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  {platformLabels[platform.platform] || platform.platform}
                  <ExternalLink size={10} className="text-muted-foreground" />
                </p>
                <p className="text-xs text-muted-foreground">@{platform.platform_username}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────
function StatCard({ label, value, valueClass, icon }: { label: string; value: string; valueClass?: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center p-4 bg-surface-1 border border-border/50 rounded-xl">
      {icon && <div className="flex justify-center mb-1.5 text-muted-foreground">{icon}</div>}
      <p className={`font-display text-2xl tabular-nums ${valueClass || 'text-foreground'}`}>{value}</p>
      <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}
