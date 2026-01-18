import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, LogOut, UserPlus, Check, X, Share2, TrendingUp, Coins, Copy, Link2, Calendar, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// Calculate crew level based on XP (same thresholds as user levels)
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

    // Fetch members with profiles INCLUDING XP and Index
    const { data: membersData, error: membersError } = await supabase
      .from("crew_members")
      .select("id, user_id, role, joined_at")
      .eq("crew_id", crewId)
      .order("role", { ascending: true });

    if (!membersError && membersData) {
      // Fetch profiles for each member with XP and Index
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

      // Sort: owners first, then officers, then members
      const sortOrder = { owner: 0, officer: 1, member: 2 };
      membersWithProfiles.sort((a, b) => sortOrder[a.role] - sortOrder[b.role]);

      setMembers(membersWithProfiles);

      // Check if current user is a member
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

    // Add as member
    await supabase.from("crew_members").insert({
      crew_id: crewId,
      user_id: request.user_id,
      role: "member",
    });

    // Delete request
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

  const handlePromoteMember = async (memberId: string, userId: string) => {
    await supabase.from("crew_members").update({ role: "officer" }).eq("id", memberId);
    fetchCrewData();
  };

  const handleDemoteMember = async (memberId: string) => {
    await supabase.from("crew_members").update({ role: "member" }).eq("id", memberId);
    fetchCrewData();
  };

  const handleKickMember = async (memberId: string, userId: string) => {
    await supabase.from("crew_members").delete().eq("id", memberId);
    fetchCrewData();
  };

  if (loading || !crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  const isStaff = myRole === "owner" || myRole === "officer";
  const isOwner = myRole === "owner";

  // Get owner profile
  const owner = members.find(m => m.role === 'owner');
  const crewSlug = crew?.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const publicLink = `loopgate.io/join/${crewSlug}`;

  const copyLink = async () => {
    const fullLink = `${window.location.origin}/join/${crewSlug}?crew=${crewId}`;
    await navigator.clipboard.writeText(fullLink);
    toast.success("Link copied!");
  };

  // Sort members by XP for leaderboard
  const membersByXP = [...members].sort((a, b) => (b.profile?.xp || 0) - (a.profile?.xp || 0));

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/crews")} className="text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold truncate">{crew.name}</h1>
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={() => navigate(`/crews/${crewId}/settings`)}>
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Crew Header with Banner */}
          <div className="relative">
            {/* Banner placeholder */}
            <div className="h-24 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-border rounded-lg" />
            
            {/* Avatar overlapping banner */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background bg-gold/10 flex items-center justify-center text-gold shadow-lg">
                {crew.avatar_url ? (
                  <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                ) : (
                  emblemIcons[crew.emblem] || <Shield className="w-10 h-10" />
                )}
              </div>
            </div>
          </div>
          
          {/* Crew Info - below avatar */}
          <div className="text-center pt-8">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-display text-2xl">{crew.name}</h2>
              <CrewBadge crew={{ id: crew.id, name: crew.name, emblem: crew.emblem, avatar_url: crew.avatar_url }} size="sm" clickable={false} />
            </div>
            
            {/* Owner */}
            {owner?.profile && (
              <p className="text-xs text-muted-foreground mb-2">
                Owner: <span className="text-foreground">@{owner.profile.username}</span>
              </p>
            )}
            
            <p className="text-sm text-muted-foreground">
              {crew.description || "No description"}
            </p>
            
            {/* Public Link */}
            <button 
              onClick={copyLink}
              className="flex items-center gap-2 mx-auto mt-3 px-3 py-1.5 bg-surface-1 border border-border rounded-lg hover:border-gold/50 transition-colors group"
            >
              <Link2 className="w-3 h-3 text-muted-foreground group-hover:text-gold" />
              <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">{publicLink}</span>
              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-gold" />
            </button>
            
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">
                {crew.member_count} members
              </span>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider border px-2 py-0.5 rounded ${
                  leagueColors[crew.min_league]
                }`}
              >
                {crew.min_league}+ Required
              </span>
            </div>
          </div>

          {/* Crew Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-1 border border-border p-3 text-center rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-gold" />
              </div>
              <p className="font-display text-xl text-gold">{crewStats.crewLevel}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Crew Level</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-gold" />
              </div>
              <p className="font-display text-xl">{crewStats.totalXP.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Total XP</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-4 h-4 text-gold" />
              </div>
              <p className="font-display text-xl">{Math.floor(crewStats.totalIndex).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Index Pool</p>
            </div>
          </div>

          {/* Actions */}
          {myRole && (
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/crews/${crewId}/chat`)}
                className="flex-1 bg-gold text-black hover:bg-gold/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Crew Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(true)}
                className="shrink-0 border-gold/30 text-gold hover:bg-gold/10"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {myRole !== "owner" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="shrink-0">
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

          {/* Join Requests (for staff) */}
          {isStaff && joinRequests.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Join Requests ({joinRequests.length})
              </h3>
              <div className="space-y-2">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 bg-muted/30 border border-border rounded-lg flex items-center gap-3"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(request.profile?.display_name || request.profile?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {request.profile?.display_name || request.profile?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{request.profile?.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500"
                        onClick={() => handleAcceptRequest(request)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* XP Leaderboard */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              Top Members (XP)
            </h3>
            <div className="space-y-2">
              {membersByXP.slice(0, 5).map((member, index) => (
                <div
                  key={member.id}
                  className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-gold text-background' : 
                    index === 1 ? 'bg-gray-400 text-background' : 
                    index === 2 ? 'bg-amber-600 text-background' : 
                    'bg-surface-2 text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(member.profile?.username || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {member.profile?.display_name || member.profile?.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold">{(member.profile?.xp || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Crew Events Placeholder */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Crew Challenges
            </h3>
            <div className="p-6 bg-surface-1 border border-dashed border-border rounded-lg text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-gold/50" />
              </div>
              <h4 className="font-display text-lg text-muted-foreground mb-1">CREW-ONLY CHALLENGES</h4>
              <p className="text-xs text-muted-foreground mb-3">Coming Soon</p>
              <p className="text-[10px] text-muted-foreground/60 max-w-xs mx-auto">
                Exclusive challenges for {crew.name} members. Compete together, earn crew XP, and climb the leaderboard.
              </p>
            </div>
          </section>

          {/* All Members */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              All Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-surface-1 border border-border rounded-lg flex items-center gap-3"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(member.profile?.display_name || member.profile?.username || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {member.profile?.display_name || member.profile?.username}
                      </p>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-gold">
                        {roleLabels[member.role]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>@{member.profile?.username}</span>
                      <span>•</span>
                      <span className="text-gold">{(member.profile?.xp || 0).toLocaleString()} XP</span>
                    </div>
                  </div>
                  {/* Owner controls */}
                  {isOwner && member.role !== "owner" && (
                    <div className="flex gap-1">
                      {member.role === "member" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handlePromoteMember(member.id, member.user_id)}
                        >
                          Promote
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleDemoteMember(member.id)}
                        >
                          Demote
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-500"
                        onClick={() => handleKickMember(member.id, member.user_id)}
                      >
                        Kick
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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
