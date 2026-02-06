import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, 
  LogOut, UserPlus, Check, X, Share2, TrendingUp, Coins, Copy, Link2, Calendar, 
  Trophy, Bell, BarChart3, FileVideo, ExternalLink, ChevronRight, Send, Trash2,
  Swords, Circle, ClipboardList, UserCheck, FolderOpen
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
import CrewRivalCard from "@/components/loopgate/CrewRivalCard";
import CrewLevelBadge from "@/components/loopgate/CrewLevelBadge";
import CrewChallengesPanel from "@/components/loopgate/CrewChallengesPanel";
import ProposeSanctionedTournament from "@/components/loopgate/ProposeSanctionedTournament";
import { useCrewRivalries } from "@/hooks/useCrewRivalries";
import { useCrewPresence } from "@/hooks/useCrewPresence";
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

type TabType = 'feed' | 'announcements' | 'rivals' | 'leaderboard' | 'members' | 'submissions' | 'challenges' | 'applications' | 'editors' | 'assets';

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
    { id: 'feed', icon: <Zap className="w-4 h-4" />, label: 'Live' },
    { id: 'applications', icon: <ClipboardList className="w-4 h-4" />, label: 'Apply' },
    { id: 'editors', icon: <UserCheck className="w-4 h-4" />, label: 'Editors' },
    { id: 'assets', icon: <FolderOpen className="w-4 h-4" />, label: 'Assets' },
    { id: 'announcements', icon: <Bell className="w-4 h-4" />, label: 'News', badge: unreadAnnouncementCount },
    { id: 'rivals', icon: <Swords className="w-4 h-4" />, label: 'Rivals', badge: rivalries.length },
    { id: 'leaderboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Board' },
    { id: 'members', icon: <Users className="w-4 h-4" />, label: 'Members' },
    { id: 'submissions', icon: <FileVideo className="w-4 h-4" />, label: 'Work' },
    { id: 'challenges', icon: <Calendar className="w-4 h-4" />, label: 'Quests' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col pb-20">
        {/* Cinematic Hero Header */}
        <div className="relative">
          {/* Banner Background */}
          <div 
            className="h-40 w-full relative overflow-hidden"
            style={{
              background: crew.banner_url 
                ? `url(${crew.banner_url}) center/cover` 
                : crew.banner_color 
                  ? `linear-gradient(135deg, ${crew.banner_color}60, ${crew.banner_color}20, rgba(0,0,0,0.9))` 
                  : 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.1), rgba(0,0,0,0.9))'
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            
            {/* Decorative Lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
              <div className="absolute bottom-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            </div>
          </div>

          {/* Back Button */}
          <button 
            onClick={() => navigate("/crews")} 
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-md bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          {canAccessSettings && (
            <button 
              onClick={() => navigate(`/crews/${crewId}/settings`)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-md bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Crew Identity Card - Overlapping the banner */}
          <div className="relative z-10 -mt-16 px-4">
            <div className="bg-surface-1 border border-border rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-md bg-surface-2 border-2 border-gold/30 overflow-hidden flex items-center justify-center text-gold shrink-0 -mt-10 shadow-lg">
                  {crew.avatar_url ? (
                    <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                  ) : (
                    emblemIcons[crew.emblem] || <Shield className="w-10 h-10" />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display text-xl tracking-wide truncate">{crew.name}</h1>
                    {crew.is_featured && (
                      <Star className="w-4 h-4 text-gold fill-gold shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{crew.description || "No description"}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <CrewLevelBadge level={crewStats.crewLevel} size="sm" />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-lg">
                    {members.length}
                    {crew.max_members && <span className="text-muted-foreground text-sm">/{crew.max_members}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Members</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-lg text-gold">{crewStats.totalXP.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    <p className="font-display text-lg">{onlineCount}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Online</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3">
                <Progress value={progressToNext} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground text-right mt-1">
                  {Math.round(progressToNext)}% to Level {crewStats.crewLevel + 1}
                </p>
              </div>

              {/* Action Buttons */}
              {myRole && (
                <div className="flex flex-col gap-2 mt-4">
                  {/* Primary Row: Chat + Icons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/crews/${crewId}/chat`)}
                      className="flex-1 bg-gold text-black hover:bg-gold/90 font-semibold"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowInviteModal(true)}
                      className="border-border hover:border-gold/50 hover:bg-gold/5"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    {crew.discord_url && (
                      <a href={crew.discord_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/10">
                          <SiDiscord className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {myRole !== "owner" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
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
                  
                  {/* Propose Tournament Button - Owner Only */}
                  {isOwner && (
                    <Button
                      onClick={() => setShowProposalForm(true)}
                      variant="outline"
                      className="w-full border-gold/30 text-gold hover:bg-gold/10 font-semibold gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Propose Sanctioned Tournament
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="sticky top-0 z-30 bg-background border-b border-border mt-4">
          <div className="flex overflow-x-auto scrollbar-hide px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
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
              {/* Live Feed Tab */}
              {activeTab === 'feed' && crewId && (
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

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <div className="space-y-4">
                  {/* Join Requests (Staff Only) */}
                  {isStaff && joinRequests.length > 0 && (
                    <div className="bg-surface-1 border border-gold/30 rounded-lg p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Join Requests ({joinRequests.length})
                      </h3>
                      <div className="space-y-2">
                        {joinRequests.map((request) => (
                          <div key={request.id} className="p-2 bg-background rounded-md flex items-center gap-3">
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

                  {/* Post Announcement (Staff Only) */}
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
                          placeholder="Write an announcement for unit members..."
                          className="min-h-[80px] resize-none bg-background"
                        />
                        <Button
                          onClick={handlePostAnnouncement}
                          disabled={sendingAnnouncement || !newAnnouncement.trim()}
                          className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
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
                  {announcements.length > 0 ? (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-display text-lg text-muted-foreground mb-2">No Announcements</h3>
                      <p className="text-xs text-muted-foreground/60 max-w-xs">
                        Staff can post announcements to keep the crew updated.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rivals Tab - Coming Soon */}
              {activeTab === 'rivals' && (
                <div className="bg-surface-1 border border-red-500/20 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                      <Swords className="w-10 h-10 text-red-500/40" />
                    </div>
                    <h3 className="text-lg font-display uppercase tracking-wider text-red-400 mb-2">
                      Crew Rivalries
                    </h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold">Coming Soon</span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Mark rival crews to track your competition and challenge them to sanctioned tournaments.
                    </p>
                  </div>
                </div>
              )}

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

              {/* Submissions Tab */}
              {activeTab === 'submissions' && (
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
                        When crew members submit to arenas, their work appears here.
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

              {/* Challenges Tab */}
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
