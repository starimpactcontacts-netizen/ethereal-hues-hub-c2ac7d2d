import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, 
  LogOut, UserPlus, Check, X, Share2, TrendingUp, Coins, Copy, Link2, Calendar, 
  Trophy, Bell, BarChart3, FileVideo, ExternalLink, ChevronRight, Send, Trash2,
  Swords, Circle, ClipboardList, UserCheck, FolderOpen, Image, Fingerprint
} from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { Textarea } from "@/components/ui/textarea";
import UnitApplicationsTab from "@/components/loopgate/UnitApplicationsTab";
import UnitEditorsTab from "@/components/loopgate/UnitEditorsTab";
import UnitAssetsTab from "@/components/loopgate/UnitAssetsTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewInviteModal from "@/components/loopgate/CrewInviteModal";
import CrewLiveFeed from "@/components/loopgate/CrewLiveFeed";
import CrewOnlineIndicator from "@/components/loopgate/CrewOnlineIndicator";
import UnitFeedTab from "@/components/loopgate/UnitFeedTab";
import UnitLogoPreviewTab from "@/components/loopgate/UnitLogoPreviewTab";
import UnitIdentityTab from "@/components/loopgate/UnitIdentityTab";
import UnitAnnouncementsTab from "@/components/loopgate/UnitAnnouncementsTab";
import UnitRolesPanel from "@/components/loopgate/UnitRolesPanel";
import CrewRivalCard from "@/components/loopgate/CrewRivalCard";
import CrewLevelBadge from "@/components/loopgate/CrewLevelBadge";
import CrewChallengesPanel from "@/components/loopgate/CrewChallengesPanel";
import ProposeSanctionedTournament from "@/components/loopgate/ProposeSanctionedTournament";
import { useCrewRivalries } from "@/hooks/useCrewRivalries";
import { useCrewPresence } from "@/hooks/useCrewPresence";
import { useChannelUnread } from "@/hooks/useChannelUnread";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  max_members: number | null;
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

type TabType = 'feed' | 'live' | 'announcements' | 'rivals' | 'leaderboard' | 'members' | 'submissions' | 'challenges' | 'applications' | 'editors' | 'assets' | 'logos' | 'identity' | 'roles';

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-10 h-10" />,
  crown: <Crown className="w-10 h-10" />,
  users: <Users className="w-10 h-10" />,
  star: <Star className="w-10 h-10" />,
  zap: <Zap className="w-10 h-10" />,
  award: <Award className="w-10 h-10" />,
};

const roleBadgeColors = {
  owner: "bg-gold/20 text-gold border-gold/30",
  officer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  member: "bg-muted/50 text-muted-foreground border-border",
};

const roleLabels = {
  owner: "Owner",
  officer: "Officer",
  member: "Member",
};

// Calculate unit level based on XP
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
  const thresholds = [0, 0, 1000, 3000, 6000, 10000, 15000, 22000, 32000, 45000, 70000];
  return thresholds[level] || 70000;
}

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isDev, loading: rolesLoading } = useUserRoles(user?.id);
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [crewStats, setCrewStats] = useState<CrewStats>({ totalXP: 0, totalIndex: 0, crewLevel: 1 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [crewSubmissions, setCrewSubmissions] = useState<CrewSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Tournament proposal state
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [preselectedRival, setPreselectedRival] = useState<{ id: string; name: string; avatar_url: string | null; member_count: number } | null>(null);

  // Use custom hooks
  const { rivalries, addRival, removeRival } = useCrewRivalries(crewId);
  const { onlineCount } = useCrewPresence(crewId);
  const { totalUnread: channelUnreadCount } = useChannelUnread(crewId);

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
      navigate("/units");
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
    navigate("/units");
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

    const { data: readData } = await supabase
      .from("crew_announcement_reads")
      .select("last_read_at")
      .eq("crew_id", crewId)
      .eq("user_id", user.id)
      .maybeSingle();

    const lastReadAt = readData?.last_read_at || new Date(0).toISOString();

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

    allSubmissions.sort((a, b) => {
      const dateA = new Date(a.submitted_at || "").getTime();
      const dateB = new Date(b.submitted_at || "").getTime();
      return dateB - dateA;
    });

    const eventIds = [...new Set(allSubmissions.map((s) => s.event_id))];
    
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title")
      .in("id", eventIds);

    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", memberIds);

    const submissionsWithDetails: CrewSubmission[] = allSubmissions.slice(0, 20).map((s) => ({
      ...s,
      platform: s.platform || "tiktok",
      user: userProfiles?.find((p) => p.id === s.user_id),
      event: eventsData?.find((e) => e.id === s.event_id),
    }));

    setCrewSubmissions(submissionsWithDetails);
    setLoadingSubmissions(false);
  }, [crewId, members]);

  // Effects for fetching data based on active tab
  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
      fetchUnreadCount();
    }
  }, [activeTab, fetchAnnouncements, fetchUnreadCount]);

  useEffect(() => {
    if (activeTab === 'announcements' && myRole) {
      markAnnouncementsAsRead();
    }
  }, [activeTab, myRole, markAnnouncementsAsRead]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchCrewSubmissions();
    }
  }, [activeTab, fetchCrewSubmissions]);

  // Realtime subscription for announcements
  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-announcements-${crewId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crew_announcements', filter: `crew_id=eq.${crewId}` },
        () => {
          fetchAnnouncements();
          if (activeTab !== 'announcements') {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, activeTab, fetchAnnouncements, fetchUnreadCount]);

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const isOwnerByCrewTable = crew.owner_id === user?.id;
  const isOwnerByMemberRole = myRole === "owner";
  const isOwner = isOwnerByCrewTable || isOwnerByMemberRole;
  const canAccessSettings = isOwner || isAdmin || isDev;
  const isStaff = isOwner || myRole === "officer";
  const owner = members.find(m => m.role === 'owner');
  const crewSlug = crew?.name?.toLowerCase().replace(/\s+/g, '-') || '';

  const copyLink = async () => {
    const fullLink = `${window.location.origin}/join/${crewSlug}?crew=${crewId}`;
    await navigator.clipboard.writeText(fullLink);
    toast.success("Link copied!");
  };

  const membersByXP = [...members].sort((a, b) => (b.profile?.xp || 0) - (a.profile?.xp || 0));

  const currentLevelXP = getXPForLevel(crewStats.crewLevel);
  const nextLevelXP = getXPForLevel(crewStats.crewLevel + 1);
  const rawProgress = ((crewStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progressToNext = crewStats.totalXP > 0 ? Math.max(3, rawProgress) : 0;

  const tabs: { id: TabType; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'feed', icon: <FileVideo className="w-4 h-4" />, label: 'Feed' },
    { id: 'live', icon: <Zap className="w-4 h-4" />, label: 'Live' },
    { id: 'applications', icon: <ClipboardList className="w-4 h-4" />, label: 'Apply' },
    { id: 'editors', icon: <UserCheck className="w-4 h-4" />, label: 'Editors' },
    { id: 'assets', icon: <FolderOpen className="w-4 h-4" />, label: 'Assets' },
    { id: 'logos', icon: <Image className="w-4 h-4" />, label: 'Logos' },
    { id: 'identity', icon: <Fingerprint className="w-4 h-4" />, label: 'Identity' },
    { id: 'announcements', icon: <Bell className="w-4 h-4" />, label: 'News', badge: unreadAnnouncementCount },
    { id: 'roles', icon: <Shield className="w-4 h-4" />, label: 'Roles' },
    { id: 'leaderboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Board' },
    { id: 'members', icon: <Users className="w-4 h-4" />, label: 'Members' },
    { id: 'challenges', icon: <Calendar className="w-4 h-4" />, label: 'Quests' },
  ];

  const teko = { fontFamily: 'Teko, sans-serif' };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col pb-20">
        {/* ═══ CINEMATIC HERO ═══ */}
        <div className="relative">
          {/* Banner — taller, more immersive */}
          <div 
            className="h-52 sm:h-64 w-full relative overflow-hidden"
            style={{
              background: crew.banner_url 
                ? `url(${crew.banner_url}) center/cover` 
                : crew.banner_color 
                  ? `linear-gradient(160deg, ${crew.banner_color}50, ${crew.banner_color}15, rgba(0,0,0,0.95))` 
                  : 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.95))'
            }}
          >
            {/* Cinematic gradient fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            
            {/* Subtle scan lines */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
            }} />
          </div>

          {/* Nav overlay */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
            <button 
              onClick={() => navigate("/units")} 
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {myRole && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              {canAccessSettings && (
                <button 
                  onClick={() => navigate(`/units/${crewId}/settings`)}
                  className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ═══ IDENTITY BLOCK — overlaps banner ═══ */}
          <div className="relative z-10 -mt-20 px-4 sm:px-6">
            <div className="flex items-end gap-4 mb-4">
              {/* Avatar — large, bold */}
              <div className="w-[88px] h-[88px] rounded-xl bg-background border-[3px] border-background overflow-hidden flex items-center justify-center shrink-0 shadow-2xl shadow-black/60">
                {crew.avatar_url ? (
                  <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                    {emblemIcons[crew.emblem] || <Shield className="w-10 h-10" />}
                  </div>
                )}
              </div>
              
              {/* Name & description */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-foreground leading-none truncate" style={teko}>
                    {crew.name}
                  </h1>
                  {crew.is_featured && (
                    <Star className="w-4 h-4 text-gold fill-gold shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed max-w-lg">
                  {crew.description || "No description set."}
                </p>
              </div>
            </div>

            {/* ═══ STATS BAR — sleek horizontal strip ═══ */}
            <div className="flex items-center gap-0 border-y border-border/30 py-3 mb-1">
              {/* Level */}
              <div className="flex-1 flex items-center justify-center gap-2">
                <CrewLevelBadge level={crewStats.crewLevel} size="sm" />
                <div>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-semibold">Level</p>
                </div>
              </div>
              
              <div className="w-px h-8 bg-border/20" />
              
              {/* Members */}
              <div className="flex-1 text-center">
                <p className="text-lg font-black text-foreground leading-none" style={teko}>
                  {members.length}
                </p>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-semibold">Members</p>
              </div>
              
              <div className="w-px h-8 bg-border/20" />
              
              {/* XP */}
              <div className="flex-1 text-center">
                <p className="text-lg font-black text-gold leading-none" style={teko}>
                  {crewStats.totalXP.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-semibold">XP</p>
              </div>
              
              <div className="w-px h-8 bg-border/20" />
              
              {/* Online */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-lg font-black text-green-400 leading-none" style={teko}>
                    {onlineCount}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.15em] font-semibold">Online</p>
              </div>
            </div>

            {/* XP Progress — minimal */}
            <div className="mb-4">
              <Progress value={progressToNext} className="h-1 bg-muted/20" />
              <p className="text-[9px] text-muted-foreground/40 text-right mt-1 font-medium">
                {Math.round(progressToNext)}% to Level {crewStats.crewLevel + 1}
              </p>
            </div>

            {/* ═══ ACTION BAR ═══ */}
            {myRole && (
              <div className="flex gap-2 mb-4">
                <motion.div className="flex-1 relative" whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={() => navigate(`/units/${crewId}/channels`)}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold text-sm h-11 relative"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Channels
                    {channelUnreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center animate-pulse">
                        {channelUnreadCount > 99 ? "99+" : channelUnreadCount}
                      </span>
                    )}
                  </Button>
                </motion.div>
                
                {crew.discord_url && (
                  <a href={crew.discord_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="h-11 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10">
                      <SiDiscord className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                
                {myRole !== "owner" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="h-11 border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave Unit?</AlertDialogTitle>
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

            {/* Propose Tournament — subtle */}
            {isOwner && (
              <Button
                onClick={() => setShowProposalForm(true)}
                variant="ghost"
                className="w-full h-9 text-xs text-gold/60 hover:text-gold hover:bg-gold/5 font-semibold gap-2 mb-2"
              >
                <Trophy className="w-3.5 h-3.5" />
                Propose Sanctioned Tournament
              </Button>
            )}
          </div>
        </div>

        {/* ═══ TABS — refined, edge-to-edge ═══ */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/20">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Unit Feed Tab */}
              {activeTab === 'feed' && crewId && (
                <UnitFeedTab crewId={crewId} isStaff={isStaff} />
              )}

              {/* Live Activity Tab */}
              {activeTab === 'live' && crewId && (
                <div className="space-y-4">
                  {/* Online Members */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{onlineCount} Online Now</span>
                    </div>
                    <CrewOnlineIndicator crewId={crewId} />
                  </div>
                  
                  {/* Activity Feed */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      Live Activity
                    </h3>
                    <CrewLiveFeed crewId={crewId} members={members} />
                  </div>
                </div>
              )}

              {/* Applications Tab */}
              {activeTab === 'applications' && crewId && (
                <UnitApplicationsTab crewId={crewId} isOfficer={isStaff} />
              )}

              {/* Editors Tab */}
              {activeTab === 'editors' && crewId && (
                <UnitEditorsTab crewId={crewId} isOfficer={isStaff} />
              )}

              {/* Assets Tab */}
              {activeTab === 'assets' && crewId && (
                <UnitAssetsTab crewId={crewId} isOfficer={isStaff} />
              )}

              {/* Logo Previews Tab */}
              {activeTab === 'logos' && crewId && (
                <UnitLogoPreviewTab crewId={crewId} isStaff={isStaff} />
              )}

              {/* Unit Identity Tab */}
              {activeTab === 'identity' && crewId && (
                <UnitIdentityTab crewId={crewId} isStaff={isStaff} rivalries={rivalries} />
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && crewId && (
                <UnitAnnouncementsTab crewId={crewId} isStaff={isStaff} />
              )}

              {/* Roles Tab */}
              {activeTab === 'roles' && crewId && (
                <UnitRolesPanel crewId={crewId} members={members} isOwner={isOwner} onRefresh={fetchCrewData} />
              )}

              {/* Rivals tab removed - now in Identity tab */}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-2">
                  {membersByXP.map((member, index) => (
                    <div
                      key={member.id}
                      onClick={() => navigate(`/editor/${member.user_id}`)}
                      className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3 hover:border-gold/30 transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-gold text-background' : 
                        index === 1 ? 'bg-gray-400 text-background' : 
                        index === 2 ? 'bg-amber-600 text-background' : 
                        'bg-surface-2 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
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

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => navigate(`/editor/${member.user_id}`)}
                      className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3 cursor-pointer hover:border-gold/30 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>{(member.profile?.username || "?")[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {member.role === 'owner' && (
                          <Crown className="w-3.5 h-3.5 text-gold absolute -top-1 -right-1" />
                        )}
                      </div>
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
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {member.role === "member" ? (
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handlePromoteMember(member.id)}>
                              Promote
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleDemoteMember(member.id)}>
                              Demote
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500" onClick={() => handleKickMember(member.id)}>
                            Kick
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quests Tab */}
              {activeTab === 'challenges' && crewId && (
                <CrewChallengesPanel crewId={crewId} />
              )}
            </motion.div>
          </AnimatePresence>
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
      
      {/* Propose Tournament Modal */}
      {showProposalForm && crew && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <ProposeSanctionedTournament
            crewId={crew.id}
            crewName={crew.name}
            crewAvatarUrl={crew.avatar_url}
            onBack={() => {
              setShowProposalForm(false);
              setPreselectedRival(null);
            }}
            onSubmitted={() => {
              setShowProposalForm(false);
              setPreselectedRival(null);
              toast.success("Tournament proposal submitted!");
            }}
            rivals={rivalries
              .filter((r) => r.rival_crew)
              .map((r) => ({
                id: r.rival_crew!.id,
                name: r.rival_crew!.name,
                avatar_url: r.rival_crew!.avatar_url,
                member_count: r.rival_crew!.member_count,
              }))}
            preselectedRival={preselectedRival || undefined}
          />
        </div>
      )}
    </PageTransition>
  );
}
