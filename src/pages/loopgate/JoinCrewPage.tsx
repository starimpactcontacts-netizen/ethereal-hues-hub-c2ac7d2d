import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageTransition from "@/components/loopgate/PageTransition";
import { Button } from "@/components/ui/button";
import { Users, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import loopgateLogo from "@/assets/loopgate-wordmark.png";

export default function JoinCrewPage() {
  const { crewSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
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
      const { data } = await supabase
        .from("crews")
        .select("*")
        .ilike("name", crewSlug?.replace(/-/g, ' ') || '')
        .maybeSingle();
      
      if (data) setCrew(data);
    } else {
      const { data } = await supabase
        .from("crews")
        .select("*")
        .eq("id", crewId)
        .single();
      
      if (data) setCrew(data);
    }
    setLoading(false);
  };

  const awardXPAndPostFeed = async (userId: string, crewName: string, crewIdToUse: string, referrerUsername?: string) => {
    await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_amount: 15,
      p_action: 'join_crew',
      p_description: `Joined ${crewName}`,
    });

    if (referrerUsername) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .eq("username", referrerUsername)
        .single();

      if (referrer) {
        await supabase.rpc('award_xp', {
          p_user_id: referrer.id,
          p_amount: 50,
          p_action: 'crew_recruit',
          p_description: `Recruited member to ${crewName}`,
        });
      }
    }

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
        description: referrerUsername ? `via @${referrerUsername}'s invite link` : "Joined the unit",
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
      const { data: existingMember } = await supabase
        .from("crew_members")
        .select("id")
        .eq("crew_id", crew.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error("You're already in this unit");
        navigate(`/crews/${crew.id}`);
        setJoining(false);
        return;
      }

      if (crew.join_type === "invite_only") {
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

        const { error } = await supabase.from("crew_join_requests").insert({
          crew_id: crew.id,
          user_id: user.id,
        });

        if (error) {
          toast.error("Failed to send request");
        } else {
          toast.success("Request sent! Unit owner will review it.");
          setJoined(true);
        }
      } else {
        const { error } = await supabase.from("crew_members").insert({
          crew_id: crew.id,
          user_id: user.id,
          role: "member",
        });

        if (error) {
          toast.error("Failed to join unit");
        } else {
          await awardXPAndPostFeed(user.id, crew.name, crew.id, via || undefined);
          toast.success(`Welcome to ${crew.name}!`);
          setJoined(true);
          setTimeout(() => navigate(`/crews/${crew.id}`), 1500);
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
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!crew) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
          <p className="text-muted-foreground">Unit not found</p>
          <Button variant="outline" onClick={() => navigate("/crews")}>Browse Units</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Loopgate wordmark with glow - positioned at top */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2">
          <div className="relative flex items-center justify-center">
            {/* Glow effect - behind logo */}
            <div className="absolute w-48 h-20 blur-[40px] bg-white/50 rounded-full" />
            <img 
              src={loopgateLogo} 
              alt="LOOPGATE" 
              className="h-16 relative z-10"
            />
          </div>
        </div>

        {/* Discord-style invite card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-muted/30 rounded-lg p-6 text-center"
        >

          {/* Unit Avatar */}
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-muted flex items-center justify-center mb-4">
            {crew.avatar_url ? (
              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10 text-muted-foreground" />
            )}
          </div>

          {/* Invite text */}
          <p className="text-sm text-muted-foreground mb-1">
            You've been invited to join
          </p>

          {/* Unit name */}
          <h1 className="text-xl font-bold text-foreground mb-3">{crew.name}</h1>

          {/* Online / Members count */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {Math.floor(crew.member_count * 0.3) || 1} Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              {crew.member_count} Editors
            </span>
          </div>

          {/* XP Reward - subtle indicator */}
          {!joined && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-gold mb-5">
              <Sparkles className="w-3 h-3" />
              <span>+15 XP for joining</span>
            </div>
          )}

          {/* Join Button */}
          {joined ? (
            <div className="py-3 px-4 bg-gold/10 rounded-md flex items-center justify-center gap-2 text-gold">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">
                {crew.join_type === "invite_only" ? "Request Sent" : "Joined!"}
              </span>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-md"
            >
              {joining ? "Joining..." : user ? "Accept Invite" : "Sign Up to Join"}
            </Button>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
