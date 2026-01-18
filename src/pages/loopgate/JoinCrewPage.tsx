import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageTransition from "@/components/loopgate/PageTransition";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Check, Zap, UserPlus } from "lucide-react";

export default function JoinCrewPage() {
  const { crewSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const via = searchParams.get("via");
  const crewId = searchParams.get("crew");
  
  const [crew, setCrew] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetchCrew();
  }, [crewId, crewSlug]);

  const fetchCrew = async () => {
    if (!crewId) {
      // Try to find crew by slug (name)
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .ilike("name", crewSlug?.replace(/-/g, ' ') || '')
        .maybeSingle();
      
      if (data) {
        setCrew(data);
      }
    } else {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("id", crewId)
        .single();
      
      if (data) {
        setCrew(data);
      }
    }
    setLoading(false);
  };

  const awardXPAndPostFeed = async (userId: string, crewName: string, crewIdToUse: string, referrerUsername?: string) => {
    // Award XP to the joiner (15 XP for joining crew)
    await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_amount: 15,
      p_action: 'join_crew',
      p_description: `Joined ${crewName}`,
    });

    // If there's a referrer (via), find them and award XP
    if (referrerUsername) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .eq("username", referrerUsername)
        .single();

      if (referrer) {
        // Award 50 XP to the referrer for successful recruit
        await supabase.rpc('award_xp', {
          p_user_id: referrer.id,
          p_amount: 50,
          p_action: 'crew_recruit',
          p_description: `Recruited member to ${crewName}`,
        });
      }
    }

    // Post to activity feed
    const { data: joinerProfile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", userId)
      .single();

    if (joinerProfile) {
      await supabase.from("activity_feed").insert({
        activity_type: "crew_join",
        user_id: userId,
        username: joinerProfile.username,
        avatar_url: joinerProfile.avatar_url,
        title: `Joined ${crewName}`,
        description: referrerUsername ? `via @${referrerUsername}'s invite link` : "Joined the crew",
        data: {
          crew_id: crewIdToUse,
          crew_name: crewName,
          referrer: referrerUsername || null,
        },
      });
    }
  };

  const handleJoin = async () => {
    if (!user) {
      // Store invite info and redirect to start
      localStorage.setItem("pending_crew_invite", JSON.stringify({
        crewId: crew?.id,
        crewName: crew?.name,
        via,
      }));
      navigate(`/start?redirect=/join/${crewSlug}?via=${via}&crew=${crew?.id}`);
      return;
    }

    if (!crew) return;

    setJoining(true);

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("crew_members")
        .select("id")
        .eq("crew_id", crew.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error("You're already in this crew");
        navigate(`/crews/${crew.id}`);
        setJoining(false);
        return;
      }

      if (crew.join_type === "invite_only") {
        // Check for existing pending request
        const { data: existingRequest } = await supabase
          .from("crew_join_requests")
          .select("id")
          .eq("crew_id", crew.id)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (existingRequest) {
          toast.error("You already have a pending request");
          setJoining(false);
          return;
        }

        // Create join request
        const { error } = await supabase.from("crew_join_requests").insert({
          crew_id: crew.id,
          user_id: user.id,
        });

        if (error) {
          toast.error("Failed to send request");
        } else {
          toast.success("Request sent! Crew owner will review it.");
          setJoined(true);
        }
      } else {
        // Direct join for open crews
        const { error } = await supabase.from("crew_members").insert({
          crew_id: crew.id,
          user_id: user.id,
          role: "member",
        });

        if (error) {
          toast.error("Failed to join crew");
        } else {
          // Award XP and post to feed
          await awardXPAndPostFeed(user.id, crew.name, crew.id, via || undefined);
          
          toast.success(`Welcome to ${crew.name}!`, {
            description: "+15 XP for joining",
          });
          setJoined(true);
          
          // Navigate to crew page after delay
          setTimeout(() => {
            navigate(`/crews/${crew.id}`);
          }, 1500);
        }
      }
    } catch {
      toast.error("Something went wrong");
    }

    setJoining(false);
  };

  if (loading || authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  if (!crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <p className="text-muted-foreground mb-4">Crew not found</p>
          <Button onClick={() => navigate("/crews")}>Browse Crews</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Crew Avatar */}
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-gold bg-gold/10 flex items-center justify-center">
            {crew.avatar_url ? (
              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-12 h-12 text-gold" />
            )}
          </div>

          {/* Invite Text */}
          {via && (
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">@{via}</span> invited you to join
            </p>
          )}

          {/* Crew Name */}
          <div>
            <h1 className="font-display text-3xl text-gold">{crew.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">{crew.description || "No description"}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center">
              <p className="font-display text-2xl">{crew.member_count}</p>
              <p className="text-xs text-muted-foreground uppercase">Members</p>
            </div>
          </div>

          {/* XP Rewards info */}
          {!joined && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="flex items-center gap-2 p-3 bg-surface-1 border border-border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">You Get</p>
                  <p className="text-xs text-gold">+15 XP</p>
                </div>
              </div>
              {via && (
                <div className="flex items-center gap-2 p-3 bg-surface-1 border border-border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-gold" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">@{via} Gets</p>
                    <p className="text-xs text-gold">+50 XP</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Join Button */}
          {joined ? (
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-500">
                <Check className="w-5 h-5" />
                <span className="font-semibold">
                  {crew.join_type === "invite_only" ? "Request Sent!" : "Welcome!"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your XP journey begins now.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-gold text-background hover:bg-gold/90 font-display text-lg h-12"
            >
              {joining ? (
                "Joining..."
              ) : user ? (
                <>
                  {crew.join_type === "invite_only" ? "Request to Join" : "Join Crew"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  Sign Up to Join
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}