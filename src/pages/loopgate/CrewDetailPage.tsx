import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, 
  LogOut, UserPlus, Check, X, Share2, TrendingUp, Coins, Copy, Link2, Calendar, 
  Trophy, Hash, Bell, BarChart3, FileVideo, ExternalLink, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import PageTransition from "@/components/loopgate/PageTransition";
import CrewInviteModal from "@/components/loopgate/CrewInviteModal";
import CrewBadge from "@/components/loopgate/CrewBadge";
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
}

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "officer" | "member";
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

type ChannelType = 'announcements' | 'events' | 'leaderboard' | 'members' | 'submissions';

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
  const thresholds = [0, 100, 1000, 3000, 6000, 10000, 15000, 22000, 32000, 45000, 70000];
  return thresholds[level] || 70000;
}

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);
  const [crewStats, setCrewStats] = useState<CrewStats>({ totalXP: 0, totalIndex: 0, crewLevel: 1 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('announcements');
  const [activity, setActivity] = useState<ActivityItem[]>([]);

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
      .select("id, user_id, role, joined_at")
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

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const isStaff = myRole === "owner" || myRole === "officer";
  const isOwner = myRole === "owner";
  const owner = members.find(m => m.role === 'owner');
  const crewSlug = crew?.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const publicLink = `loopgate.io/join/${crewSlug}`;

  const copyLink = async () => {
    const fullLink = `${window.location.origin}/join/${crewSlug}?crew=${crewId}`;
    await navigator.clipboard.writeText(fullLink);
    toast.success("Link copied!");
  };

  const membersByXP = [...members].sort((a, b) => (b.profile?.xp || 0) - (a.profile?.xp || 0));

  // XP progress calculation
  const currentLevelXP = getXPForLevel(crewStats.crewLevel);
  const nextLevelXP = getXPForLevel(crewStats.crewLevel + 1);
  const progressToNext = ((crewStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const channels: { id: ChannelType; icon: React.ReactNode; label: string }[] = [
    { id: 'announcements', icon: <Bell className="w-4 h-4" />, label: 'Announcements' },
    { id: 'events', icon: <Calendar className="w-4 h-4" />, label: 'Events' },
    { id: 'leaderboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Leaderboard' },
    { id: 'members', icon: <Users className="w-4 h-4" />, label: 'Members' },
    { id: 'submissions', icon: <FileVideo className="w-4 h-4" />, label: 'Submissions' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-surface-1/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/crews")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 flex items-center justify-center text-gold">
                  {crew.avatar_url ? (
                    <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <h1 className="font-bold truncate">{crew.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <div className="h-16 rounded-lg bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 overflow-hidden">
                  <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.2),transparent)]" />
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
                
                {/* XP Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Level {crewStats.crewLevel}</span>
                    <span>{crewStats.totalXP.toLocaleString()} XP</span>
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
                    {channel.label}
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
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
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
              {activeChannel === 'announcements' && (
                <div className="space-y-4">
                  {/* Crew Info Card */}
                  <div className="bg-surface-1 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">{crew.description || "No description set"}</p>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="font-display text-lg text-gold">{crewStats.crewLevel}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Level</p>
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

              {activeChannel === 'events' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-gold/50" />
                  </div>
                  <h3 className="font-display text-xl text-muted-foreground mb-2">CREW-ONLY CHALLENGES</h3>
                  <p className="text-sm text-muted-foreground mb-4">Coming Soon</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    Exclusive challenges for {crew.name} members. Compete together, earn crew XP, and climb the leaderboard.
                  </p>
                </div>
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <FileVideo className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-display text-lg text-muted-foreground mb-2">Crew Submissions</h3>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    See all submissions from crew members in one place. Coming soon.
                  </p>
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