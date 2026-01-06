import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Settings, Shield, Crown, Users, Star, Zap, Award, LogOut, UserPlus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
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

export default function CrewDetailPage() {
  const { crewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "officer" | "member" | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Fetch profiles for each member
      const memberIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, league")
        .in("id", memberIds);

      const membersWithProfiles = membersData.map((member) => ({
        ...member,
        profile: profiles?.find((p) => p.id === member.user_id) || null,
      })) as Member[];

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
          {/* Crew Header */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-xl bg-gold/10 flex items-center justify-center text-gold mb-4">
              {emblemIcons[crew.emblem] || <Shield className="w-12 h-12" />}
            </div>
            <h2 className="text-xl font-bold">{crew.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {crew.description || "No description"}
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">
                {crew.member_count} members
              </span>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider border px-2 py-0.5 ${
                  leagueColors[crew.min_league]
                }`}
              >
                {crew.min_league}+ Required
              </span>
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

          {/* Members */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-muted/30 border border-border rounded-lg flex items-center gap-3"
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
                    <p className="text-xs text-muted-foreground">@{member.profile?.username}</p>
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
    </PageTransition>
  );
}
