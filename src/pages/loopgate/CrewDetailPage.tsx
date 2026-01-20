import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, 
  LogOut, UserPlus, Check, X, Share2, TrendingUp, Coins, Copy, Link2, Calendar, 
  Trophy, Hash, Bell, BarChart3, FileVideo, ExternalLink, ChevronRight, Send, Trash2,
  Swords, Circle
} from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewInviteModal from "@/components/loopgate/CrewInviteModal";
import CrewBadge from "@/components/loopgate/CrewBadge";
import CrewLiveFeed from "@/components/loopgate/CrewLiveFeed";
import CrewOnlineIndicator from "@/components/loopgate/CrewOnlineIndicator";
import CrewExtendedRoleBadge from "@/components/loopgate/CrewExtendedRoleBadge";
import CrewRivalCard from "@/components/loopgate/CrewRivalCard";
import CrewLevelBadge from "@/components/loopgate/CrewLevelBadge";
import CrewChallengesPanel from "@/components/loopgate/CrewChallengesPanel";
import { useCrewRivalries } from "@/hooks/useCrewRivalries";
import { useCrewPresence } from "@/hooks/useCrewPresence";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  min_league: "open" | "pro" | "elite";
  join_type: string;
  member_count: number;
  owner_id: string;
  avatar_url: string | null;
  discord_url: string | null;
  is_featured: boolean;
  banner_url: string | null;
  banner_color: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "officer" | "member";
  extended_role: "ace_editor" | "veteran" | "challenger" | "recruiter" | "judge" | null;
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    league: string;
    xp?: number;
    level?: number;
    global_index_score?: number;
  } | null;
}

interface JoinRequest {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    league: string;
  } | null;
}

interface CrewStats {
  totalXP: number;
  totalIndex: number;
  crewLevel: number;
}

interface ActivityItem {
  id: string;
  type: 'join' | 'submission' | 'level_up' | 'achievement';
  username: string;
  avatar_url: string | null;
  message: string;
  timestamp: string;
}

interface Announcement {
  id: string;
  crew_id: string;
  author_id: string;
  message: string;
  created_at: string;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CrewSubmission {
  id: string;
  user_id: string;
  event_id: string;
  submission_url: string;
  platform: string;
  qoi_score: number | null;
  submitted_at: string;
  user?: {
    username: string;
    avatar_url: string | null;
  };
  event?: {
    title: string;
  };
}

type ChannelType = 'announcements' | 'events' | 'leaderboard' | 'members' | 'submissions' | 'feed' | 'rivals';

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-12 h-12" />,
  crown: <Crown className="w-12 h-12" />,
  users: <Users className="w-12 h-12" />,
  star: <Star className="w-12 h-12" />,
  zap: <Zap className="w-12 h-12" />,
  award: <Award className="w-12 h-12" />,
};

const leagueColors = {
  open: "border-muted-foreground/30 text-muted-foreground",
  pro: "border-blue-500/50 text-blue-400",
  elite: "border-gold/50 text-gold",
};

const roleLabels = {
  owner: "Owner",
  officer: "Officer",
  member: "Member",
};

const roleBadgeColors = {
  owner: "bg-gold/20 text-gold border-gold/30",
  officer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-muted/50 text-muted-foreground border-border",
};

// Calculate crew level based on XP
function calculateCrewLevel(xp: number): number {
  if (xp >= 70000) return 10;
  if (xp >= 45000) return 9;
  if (xp >= 32000) return 8;
  if (xp >= 22000) return 7;
  if (xp >= 15000) return 6;
  if (xp >= 10000) return 5;
  if (xp >= 6000) return 4;
  if (xp >= 3000) return 3;
  if (xp >= 1000) return 2;
  return 1;
}

function getXPForLevel(level: number): number {
  // Level 1 starts at 0, level 2 at 1000, etc.
  const thresholds = [0, 0, 1000, 3000, 6000, 10000, 15000, 22000, 32000, 45000, 70000];
  return thresholds[level] || 70000;
}

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isDev } = useUserRoles(user?.id);
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [crewStats, setCrewStats] = useState<CrewStats>({ totalXP: 0, totalIndex: 0, crewLevel: 1 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('feed');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [crewSubmissions, setCrewSubmissions] = useState<CrewSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Use custom hooks
  const { rivalries, addRival, removeRival } = useCrewRivalries(crewId);
  const { onlineCount } = useCrewPresence(crewId);

  useEffect(() => {
    if (crewId) {
      fetchCrewData();
    }
  }, [crewId, user?.id]);

  const fetchCrewData = async () => {
    if (!crewId) return;

    setLoading(true);

    // Fetch crew
    const { data: crewData, error: crewError } = await supabase
      .from("crews")
      .select("*")
      .eq("id", crewId)
      .single();

    if (crewError || !crewData) {
      console.error("Error fetching crew:", crewError);
      navigate("/crews");
      return;
    }

    setCrew(crewData);

    // Fetch members with profiles
    const { data: membersData, error: membersError } = await supabase
      .from("crew_members")
      .select("id, user_id, role, extended_role, joined_at")
      .eq("crew_id", crewId)
      .order("role", { ascending: true });

    if (!membersError && membersData) {
      const memberIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, league, xp, level, global_index_score")
        .in("id", memberIds);

      const membersWithProfiles = membersData.map((member) => ({
        ...member,
        extended_role: member.extended_role as Member["extended_role"],
        profile: profiles?.find((p) => p.id === member.user_id) || null,
      })) as Member[];

      // Calculate crew stats
      const totalXP = profiles?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;
      const totalIndex = profiles?.reduce((sum, p) => sum + (p.global_index_score || 0), 0) || 0;
      const crewLevel = calculateCrewLevel(totalXP);
      setCrewStats({ totalXP, totalIndex, crewLevel });

      // Sort by role priority then by XP
      const sortOrder = { owner: 0, officer: 1, member: 2 };
      membersWithProfiles.sort((a, b) => {
        if (sortOrder[a.role] !== sortOrder[b.role]) {
          return sortOrder[a.role] - sortOrder[b.role];
        }
        return (b.profile?.xp || 0) - (a.profile?.xp || 0);
      });

      setMembers(membersWithProfiles);

      // Build activity feed from recent joins
      const recentActivity: ActivityItem[] = membersWithProfiles
        .slice(0, 10)
        .map((m) => ({
          id: m.id,
          type: 'join' as const,
          username: m.profile?.username || 'Unknown',
          avatar_url: m.profile?.avatar_url || null,
          message: `joined the crew`,
          timestamp: m.joined_at,
        }));
      setActivity(recentActivity);

      if (user) {
        const myMembership = membersData.find((m) => m.user_id === user.id);
        setMyRole(myMembership?.role as "owner" | "officer" | "member" | null);
      }
    }

    // Fetch join requests if staff
    if (user && (crewData.owner_id === user.id || myRole === "officer")) {
      const { data: requestsData } = await supabase
        .from("crew_join_requests")
        .select("id, user_id, created_at")
        .eq("crew_id", crewId)
        .eq("status", "pending");

      if (requestsData && requestsData.length > 0) {
        const requestUserIds = requestsData.map((r) => r.user_id);
        const { data: requestProfiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, league")
          .in("id", requestUserIds);

        const requestsWithProfiles = requestsData.map((req) => ({
          ...req,
          profile: requestProfiles?.find((p) => p.id === req.user_id) || null,
        })) as JoinRequest[];

        setJoinRequests(requestsWithProfiles);
      }
    }

    setLoading(false);
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    if (!crewId) return;
    await supabase.from("crew_members").insert({
      crew_id: crewId,
      user_id: request.user_id,
      role: "member",
    });
    await supabase.from("crew_join_requests").delete().eq("id", request.id);
    fetchCrewData();
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.from("crew_join_requests").delete().eq("id", requestId);
    fetchCrewData();
  };

  const handleLeaveCrew = async () => {
    if (!user || !crewId) return;
    await supabase.from("crew_members").delete().eq("crew_id", crewId).eq("user_id", user.id);
    navigate("/crews");
  };

  const handlePromoteMember = async (memberId: string) => {
    await supabase.from("crew_members").update({ role: "officer" }).eq("id", memberId);
    fetchCrewData();
  };

  const handleDemoteMember = async (memberId: string) => {
    await supabase.from("crew_members").update({ role: "member" }).eq("id", memberId);
    fetchCrewData();
  };

  const handleKickMember = async (memberId: string) => {
    await supabase.from("crew_members").delete().eq("id", memberId);
    fetchCrewData();
  };

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    if (!crewId) return;
    
    const { data: announcementsData, error } = await supabase
      .from("crew_announcements")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching announcements:", error);
      return;
    }

    if (announcementsData && announcementsData.length > 0) {
      const authorIds = [...new Set(announcementsData.map((a) => a.author_id))];
      const { data: authorProfiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", authorIds);

      const announcementsWithAuthors = announcementsData.map((a) => ({
        ...a,
        author: authorProfiles?.find((p) => p.id === a.author_id) || undefined,
      }));

      setAnnouncements(announcementsWithAuthors);
    } else {
      setAnnouncements([]);
    }
  }, [crewId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!crewId || !user) return;

    // Get user's last read time
    const { data: readData } = await supabase
      .from("crew_announcement_reads")
      .select("last_read_at")
      .eq("crew_id", crewId)
      .eq("user_id", user.id)
      .maybeSingle();

    const lastReadAt = readData?.last_read_at || new Date(0).toISOString();

    // Count announcements after last read
    const { count } = await supabase
      .from("crew_announcements")
      .select("*", { count: "exact", head: true })
      .eq("crew_id", crewId)
      .gt("created_at", lastReadAt);

    setUnreadAnnouncementCount(count || 0);
  }, [crewId, user]);

  // Mark announcements as read
  const markAnnouncementsAsRead = useCallback(async () => {
    if (!crewId || !user) return;

    await supabase
      .from("crew_announcement_reads")
      .upsert({
        user_id: user.id,
        crew_id: crewId,
        last_read_at: new Date().toISOString(),
      }, { onConflict: "user_id,crew_id" });

    setUnreadAnnouncementCount(0);
  }, [crewId, user]);

  // Post announcement
  const handlePostAnnouncement = async () => {
    if (!crewId || !user || !newAnnouncement.trim()) return;

    setSendingAnnouncement(true);
    const { error } = await supabase.from("crew_announcements").insert({
      crew_id: crewId,
      author_id: user.id,
      message: newAnnouncement.trim(),
    });

    if (error) {
      console.error("Error posting announcement:", error);
      toast.error("Failed to post announcement");
    } else {
      setNewAnnouncement("");
      toast.success("Announcement posted!");
      fetchAnnouncements();
    }
    setSendingAnnouncement(false);
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    const { error } = await supabase
      .from("crew_announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      toast.error("Failed to delete announcement");
    } else {
      fetchAnnouncements();
    }
  };

  // Fetch crew submissions
  const fetchCrewSubmissions = useCallback(async () => {
    if (!crewId || members.length === 0) return;

    setLoadingSubmissions(true);
    const memberIds = members.map((m) => m.user_id);

    // Get both round participations and event participations
    const [{ data: roundData }, { data: eventData }] = await Promise.all([
      supabase
        .from("round_participations")
        .select("id, user_id, event_id, submission_url, platform, qoi_score, submitted_at")
        .in("user_id", memberIds)
        .not("submission_url", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(30),
      supabase
        .from("event_participations")
        .select("id, user_id, event_id, submission_url, platform, qoi_score, submitted_at")
        .in("user_id", memberIds)
        .order("submitted_at", { ascending: false })
        .limit(30),
    ]);

    const allSubmissions = [
      ...(roundData || []).map((s) => ({ ...s, platform: s.platform || "tiktok" })),
      ...(eventData || []),
    ];

    // Sort by submitted_at descending
    allSubmissions.sort((a, b) => {
      const dateA = new Date(a.submitted_at || "").getTime();
      const dateB = new Date(b.submitted_at || "").getTime();
      return dateB - dateA;
    });

    // Get unique event IDs
    const eventIds = [...new Set(allSubmissions.map((s) => s.event_id))];
    
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title")
      .in("id", eventIds);

    const eventsMap = new Map((eventsData || []).map((e) => [e.id, e]));
    const membersMap = new Map(members.map((m) => [m.user_id, m.profile]));

    const submissionsWithDetails: CrewSubmission[] = allSubmissions.slice(0, 30).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      event_id: s.event_id,
      submission_url: s.submission_url!,
      platform: s.platform,
      qoi_score: s.qoi_score,
      submitted_at: s.submitted_at || "",
      user: membersMap.get(s.user_id) ? {
        username: membersMap.get(s.user_id)!.username,
        avatar_url: membersMap.get(s.user_id)!.avatar_url,
      } : undefined,
      event: eventsMap.get(s.event_id) ? { title: eventsMap.get(s.event_id)!.title } : undefined,
    }));

    setCrewSubmissions(submissionsWithDetails);
    setLoadingSubmissions(false);
  }, [crewId, members]);

  // Load announcements and unread count when crew loads
  useEffect(() => {
    if (crewId && myRole) {
      fetchAnnouncements();
      fetchUnreadCount();
    }
  }, [crewId, myRole, fetchAnnouncements, fetchUnreadCount]);

  // Load submissions when switching to submissions channel
  useEffect(() => {
    if (activeChannel === "submissions" && crewSubmissions.length === 0 && members.length > 0) {
      fetchCrewSubmissions();
    }
  }, [activeChannel, crewSubmissions.length, members.length, fetchCrewSubmissions]);

  // Mark as read when viewing announcements channel
  useEffect(() => {
    if (activeChannel === "announcements" && unreadAnnouncementCount > 0) {
      markAnnouncementsAsRead();
    }
  }, [activeChannel, unreadAnnouncementCount, markAnnouncementsAsRead]);

  // Subscribe to realtime announcements
  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-announcements-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crew_announcements",
          filter: `crew_id=eq.${crewId}`,
        },
        () => {
          fetchAnnouncements();
          if (activeChannel !== "announcements") {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, activeChannel, fetchAnnouncements, fetchUnreadCount]);

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  // Use crew.owner_id as source of truth for ownership
  // Admin/dev can also access settings
  const isOwner = crew.owner_id === user?.id;
  const canAccessSettings = isOwner || isAdmin || isDev;
  const isStaff = isOwner || myRole === "officer";
  const owner = members.find(m => m.role === 'owner');
  const crewSlug = crew?.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const publicLink = `loopgate.io/join/${crewSlug}`;

  const copyLink = async () => {
    const fullLink = `${window.location.origin}/join/${crewSlug}?crew=${crewId}`;
    await navigator.clipboard.writeText(fullLink);
    toast.success("Link copied!");
  };

  const membersByXP = [...members].sort((a, b) => (b.profile?.xp || 0) - (a.profile?.xp || 0));

  // XP progress calculation - ensure minimum visible progress when XP > 0
  const currentLevelXP = getXPForLevel(crewStats.crewLevel);
  const nextLevelXP = getXPForLevel(crewStats.crewLevel + 1);
  const rawProgress = ((crewStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  // Show at least 3% progress if there's any XP, so the bar is visible
  const progressToNext = crewStats.totalXP > 0 ? Math.max(3, rawProgress) : 0;

  const channels: { id: ChannelType; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'feed', icon: <Zap className="w-4 h-4" />, label: 'Live Feed' },
    { id: 'announcements', icon: <Bell className="w-4 h-4" />, label: 'Announcements', badge: unreadAnnouncementCount },
    { id: 'rivals', icon: <Swords className="w-4 h-4" />, label: 'Rivals', badge: rivalries.length },
    { id: 'leaderboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Leaderboard' },
    { id: 'members', icon: <Users className="w-4 h-4" />, label: 'Members' },
    { id: 'submissions', icon: <FileVideo className="w-4 h-4" />, label: 'Submissions' },
    { id: 'events', icon: <Calendar className="w-4 h-4" />, label: 'Challenges' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-surface-1/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button onClick={() => navigate("/crews")} className="text-muted-foreground hover:text-foreground shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  {crew.avatar_url ? (
                    <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <h1 className="font-bold truncate max-w-[200px]">{crew.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <Button variant="ghost" size="icon" onClick={() => navigate(`/crews/${crewId}/settings`)}>
                  <Settings className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Discord-style Layout */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Sidebar - Channels */}
          <div className="w-full md:w-56 bg-surface-1 border-b md:border-b-0 md:border-r border-border shrink-0">
            {/* Crew Header in Sidebar */}
            <div className="p-4 border-b border-border">
            <div className="relative mb-4">
                {/* Banner */}
                <div 
                  className="h-16 rounded-lg overflow-hidden"
                  style={{
                    background: crew.banner_url 
                      ? `url(${crew.banner_url}) center/cover` 
                      : crew.banner_color 
                        ? `linear-gradient(135deg, ${crew.banner_color}40, ${crew.banner_color}20)` 
                        : 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))'
                  }}
                >
                  {!crew.banner_url && (
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)]" />
                  )}
                </div>
                {/* Avatar overlay */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <div className="w-14 h-14 rounded-full border-4 border-surface-1 overflow-hidden bg-gold/10 flex items-center justify-center text-gold shadow-lg">
                    {crew.avatar_url ? (
                      <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                    ) : (
                      emblemIcons[crew.emblem] || <Shield className="w-7 h-7" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-6">
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="font-display text-lg">{crew.name}</h2>
                  {crew.is_featured && (
                    <Star className="w-4 h-4 text-gold fill-gold" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{crew.member_count} members</p>
                
                {/* XP Bar with Level Badge */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <CrewLevelBadge level={crewStats.crewLevel} size="sm" showLabel />
                    <span className="text-[10px] text-muted-foreground">{crewStats.totalXP.toLocaleString()} XP</span>
                  </div>
                  <Progress value={progressToNext} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                Channels
              </p>
              <div className="space-y-0.5">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      activeChannel === channel.id
                        ? 'bg-gold/10 text-gold'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Hash className="w-4 h-4 opacity-60" />
                    <span className="flex-1 text-left">{channel.label}</span>
                    {channel.badge && channel.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {channel.badge > 9 ? '9+' : channel.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* External Links */}
              {crew.discord_url && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                    Links
                  </p>
                  <a
                    href={crew.discord_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
                  >
                    <SiDiscord className="w-4 h-4" />
                    <span>Discord Server</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Channel Header */}
            <div className="h-12 px-4 flex items-center gap-2 border-b border-border bg-background">
              <Hash className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">{channels.find(c => c.id === activeChannel)?.label}</span>
            </div>

            {/* Channel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeChannel === 'feed' && crewId && (
                <div className="space-y-4">
                  {/* Online Indicator */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-xs font-medium">{onlineCount} Online Now</span>
                    </div>
                    <CrewOnlineIndicator crewId={crewId} />
                  </div>
                  
                  {/* Live Feed */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      Live Activity
                    </h3>
                    <CrewLiveFeed crewId={crewId} members={members} />
                  </div>
                </div>
              )}

              {activeChannel === 'rivals' && (
                <div className="space-y-4">
                  <div className="bg-surface-1 border border-red-500/20 rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-2">
                      <Swords className="w-4 h-4" />
                      Crew Rivalries
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Mark rival crews to track your competition and fuel the beef.
                    </p>
                    
                    {rivalries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No rivals yet. Visit other crews to mark them!</p>
                    ) : (
                      <div className="space-y-3">
                        {rivalries.map((rivalry) => (
                          <CrewRivalCard
                            key={rivalry.id}
                            rivalry={rivalry}
                            ownCrewXP={crewStats.totalXP}
                            isStaff={isStaff}
                            onRemove={removeRival}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeChannel === 'announcements' && (
                <div className="space-y-4">
                  {/* Crew Info Card */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">{crew.description || "No description set"}</p>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="flex flex-col items-center justify-center p-2 bg-background rounded-lg">
                        <CrewLevelBadge level={crewStats.crewLevel} size="md" animate />
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">Level</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="font-display text-lg">{crewStats.totalXP.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total XP</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="font-display text-lg">{Math.floor(crewStats.totalIndex).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Index</p>
                      </div>
                    </div>

                    {/* Public Link */}
                    <button 
                      onClick={copyLink}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-gold/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-gold shrink-0" />
                        <span className="text-xs font-mono text-muted-foreground truncate">{publicLink}</span>
                      </div>
                      <Copy className="w-4 h-4 text-muted-foreground group-hover:text-gold shrink-0" />
                    </button>
                  </div>

                  {/* Actions */}
                  {myRole && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/crews/${crewId}/chat`)}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowInviteModal(true)}
                        className="border-gold/30 text-gold hover:bg-gold/10"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      {myRole !== "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <LogOut className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave Crew?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to leave {crew.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleLeaveCrew}>Leave</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}

                  {/* Join Requests */}
                  {isStaff && joinRequests.length > 0 && (
                    <div className="bg-surface-1 border border-border rounded-lg p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Join Requests ({joinRequests.length})
                      </h3>
                      <div className="space-y-2">
                        {joinRequests.map((request) => (
                          <div key={request.id} className="p-2 bg-background rounded-lg flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={request.profile?.avatar_url || undefined} />
                              <AvatarFallback>{(request.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{request.profile?.display_name || request.profile?.username}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500" onClick={() => handleAcceptRequest(request)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleRejectRequest(request.id)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post Announcement - Staff Only */}
                  {isStaff && (
                    <div className="bg-surface-1 border border-border rounded-lg p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Post Announcement
                      </h3>
                      <div className="space-y-2">
                        <Textarea
                          value={newAnnouncement}
                          onChange={(e) => setNewAnnouncement(e.target.value)}
                          placeholder="Write an announcement for crew members..."
                          className="min-h-[80px] resize-none"
                        />
                        <Button
                          onClick={handlePostAnnouncement}
                          disabled={sendingAnnouncement || !newAnnouncement.trim()}
                          className="w-full bg-gold text-black hover:bg-gold/90"
                        >
                          {sendingAnnouncement ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Post
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Announcements List */}
                  {announcements.length > 0 && (
                    <div className="space-y-3">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="bg-surface-1 border border-border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={announcement.author?.avatar_url || undefined} />
                              <AvatarFallback>{(announcement.author?.username || "?")[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{announcement.author?.display_name || announcement.author?.username || "Staff"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(announcement.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.message}</p>
                            </div>
                            {(isOwner || announcement.author_id === user?.id) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 shrink-0"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Activity Feed */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {activity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                      ) : (
                        activity.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={item.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">{item.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-foreground font-medium">{item.username}</span>
                            <span className="text-muted-foreground">{item.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeChannel === 'events' && crewId && (
                <CrewChallengesPanel crewId={crewId} />
              )}

              {activeChannel === 'leaderboard' && (
                <div className="space-y-2">
                  {membersByXP.map((member, index) => (
                    <div
                      key={member.id}
                      onClick={() => navigate(`/editor/${member.user_id}`)}
                      className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3 hover:border-gold/30 transition-colors cursor-pointer"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-gold text-background' : 
                        index === 1 ? 'bg-gray-400 text-background' : 
                        index === 2 ? 'bg-amber-600 text-background' : 
                        'bg-surface-2 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{member.profile?.display_name || member.profile?.username}</p>
                        <p className="text-xs text-muted-foreground">@{member.profile?.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gold">{(member.profile?.xp || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">XP</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {activeChannel === 'members' && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{member.profile?.display_name || member.profile?.username}</p>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${roleBadgeColors[member.role]}`}>
                            {roleLabels[member.role]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">@{member.profile?.username} • {(member.profile?.xp || 0).toLocaleString()} XP</p>
                      </div>
                      {isOwner && member.role !== "owner" && (
                        <div className="flex gap-1">
                          {member.role === "member" ? (
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => handlePromoteMember(member.id)}>
                              Promote
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleDemoteMember(member.id)}>
                              Demote
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs text-red-500" onClick={() => handleKickMember(member.id)}>
                            Kick
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeChannel === 'submissions' && (
                <div className="space-y-3">
                  {loadingSubmissions ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : crewSubmissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <FileVideo className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-display text-lg text-muted-foreground mb-2">No Submissions Yet</h3>
                      <p className="text-xs text-muted-foreground/60 max-w-xs">
                        When crew members submit to arenas, their submissions will appear here.
                      </p>
                    </div>
                  ) : (
                    crewSubmissions.map((submission) => (
                      <a
                        key={submission.id}
                        href={submission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-surface-1 border border-border rounded-lg p-4 hover:border-gold/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={submission.user?.avatar_url || undefined} />
                            <AvatarFallback>{(submission.user?.username || "?")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{submission.user?.username || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {submission.event?.title || "Arena Submission"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {submission.qoi_score ? (
                              <p className="text-sm font-bold text-gold">{Math.round(submission.qoi_score)} QOI</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Pending</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Online Members (Desktop only) */}
          <div className="hidden lg:block w-56 bg-surface-1 border-l border-border p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Members — {members.length}
            </p>
            <div className="space-y-1">
              {members.slice(0, 12).map((member) => (
                <button
                  key={member.id}
                  onClick={() => navigate(`/editor/${member.user_id}`)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {member.role === 'owner' && (
                      <Crown className="w-3 h-3 text-gold absolute -top-1 -right-1" />
                    )}
                  </div>
                  <span className={`text-xs truncate ${member.role === 'owner' ? 'text-gold' : member.role === 'officer' ? 'text-blue-400' : ''}`}>
                    {member.profile?.username}
                  </span>
                </button>
              ))}
              {members.length > 12 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{members.length - 12} more
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Invite Modal */}
      {crew && (
        <CrewInviteModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          crewName={crew.name}
          crewId={crew.id}
        />
      )}
    </PageTransition>
  );
}