import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Trophy, Star, Lock, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import HouseIcon from "@/components/loopgate/houses/HouseIcon";

interface House {
  id: string;
  name: string;
  type: string;
  symbol: string;
  primary_color: string;
  secondary_color: string;
  description: string;
  lore: string | null;
  bonuses: Record<string, number>;
  member_count: number;
  avg_qoi: number | null;
  prestige_level: number;
  requires_approval: boolean;
}

// Helper to safely cast bonuses from JSON
function parseBonuses(bonuses: unknown): Record<string, number> {
  if (typeof bonuses === 'object' && bonuses !== null && !Array.isArray(bonuses)) {
    return bonuses as Record<string, number>;
  }
  return {};
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    global_index_score: number | null;
  };
}

const bonusLabels: Record<string, string> = {
  lateSubmissionBoost: "Late Submission Boost",
  chaosStyleBoost: "Chaos Style Boost",
  moraleBoostBehind: "Morale Boost When Behind",
  darkGradeScoring: "Dark Grade Scoring",
  ambientMoodScore: "Ambient Mood Score",
  pacingScore: "Pacing Score",
  aestheticScoring: "Aesthetic Scoring",
  storyCohesion: "Story Cohesion",
  emotionalResonance: "Emotional Resonance",
  experimentalScore: "Experimental Score",
  innovationRating: "Innovation Rating",
  colorGradingScore: "Color Grading Score",
  aestheticAccuracy: "Aesthetic Accuracy",
  penaltyResistance: "Penalty Resistance",
  consistencySupport: "Consistency Support",
  audioSyncScore: "Audio Sync Score",
  motionTimingScore: "Motion Timing Score",
  qoiStability: "QOI Stability",
  rankProtection: "Rank Protection",
  qoiBoost: "QOI Boost",
  housePrestigeMultiplier: "House Prestige Multiplier",
};

export default function HouseDetailPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [house, setHouse] = useState<House | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isMember = profile?.house_id === houseId;
  const isPrestige = house?.type === "prestige";

  useEffect(() => {
    if (houseId) {
      fetchHouseData();
    }
  }, [houseId, user]);

  async function fetchHouseData() {
    setLoading(true);

    // Fetch house
    const { data: houseData, error: houseError } = await supabase
      .from("houses")
      .select("*")
      .eq("id", houseId)
      .single();

    if (houseError || !houseData) {
      toast.error("House not found");
      navigate("/houses");
      return;
    }

    setHouse({
      ...houseData,
      bonuses: parseBonuses(houseData.bonuses),
    });

    // Fetch members with profiles
    const { data: membersData } = await supabase
      .from("house_members")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profile:profiles!house_members_user_id_fkey (
          username,
          display_name,
          avatar_url,
          global_index_score
        )
      `)
      .eq("house_id", houseId)
      .order("role", { ascending: true })
      .limit(20);

    if (membersData) {
      setMembers(membersData as unknown as Member[]);
    }

    // Check pending application
    if (user) {
      const { data: appData } = await supabase
        .from("house_applications")
        .select("id")
        .eq("house_id", houseId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      setHasPendingApplication(!!appData);
    }

    setLoading(false);
  }

  async function handleApply() {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!house) return;
    setIsApplying(true);

    if (house.requires_approval) {
      const { error } = await supabase
        .from("house_applications")
        .insert({ house_id: house.id, user_id: user.id });

      if (error) {
        toast.error("Failed to apply");
      } else {
        setHasPendingApplication(true);
        toast.success("Application submitted");
      }
    } else {
      const { error } = await supabase
        .from("house_members")
        .insert({ house_id: house.id, user_id: user.id });

      if (error) {
        toast.error("Failed to join");
      } else {
        toast.success(`Welcome to ${house.name}!`);
        await supabase
          .from("profiles")
          .update({ house_id: house.id, house_changed_at: new Date().toISOString() })
          .eq("id", user.id);
        fetchHouseData();
      }
    }

    setIsApplying(false);
  }

  async function handleLeave() {
    if (!user || !house) return;
    setIsLeaving(true);

    const { error } = await supabase
      .from("house_members")
      .delete()
      .eq("house_id", house.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to leave house");
    } else {
      toast.success("You have left the house");
      await supabase
        .from("profiles")
        .update({ house_id: null })
        .eq("id", user.id);
      navigate("/houses");
    }

    setIsLeaving(false);
  }

  if (loading || !house) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Banner */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${house.primary_color}40, ${house.secondary_color}40)`,
        }}
      >
        {/* Animated glow */}
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${house.primary_color}60, transparent 70%)`,
          }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate("/houses")}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: `${house.secondary_color}80`,
              border: `2px solid ${house.primary_color}50`,
            }}
          >
            <HouseIcon 
              symbol={house.symbol} 
              size={64} 
              style={{ color: house.primary_color }}
            />
          </motion.div>
        </div>

        {isPrestige && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded bg-gold/20 text-gold text-xs font-semibold uppercase">
            <Lock size={12} />
            Prestige
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-10">
        {/* Name & Description */}
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <h1 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
            {house.name}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            "{house.lore || house.description}"
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users size={14} />
              <span>{house.member_count} members</span>
            </div>
            {house.avg_qoi && house.avg_qoi > 0 && (
              <div className="flex items-center gap-1 text-gold">
                <Trophy size={14} />
                <span>{house.avg_qoi.toFixed(1)} avg QOI</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star size={14} />
              <span>Level {house.prestige_level}</span>
            </div>
          </div>
        </div>

        {/* Buffs */}
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider mb-3">
            House Buffs
          </h2>
          <div className="space-y-2">
            {Object.entries(house.bonuses).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {bonusLabels[key] || key}
                </span>
                <span className="font-mono" style={{ color: house.primary_color }}>
                  +{(value * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-4">
          {isMember ? (
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              <LogOut size={16} className="mr-2" />
              Leave House
            </Button>
          ) : isPrestige ? (
            <Button disabled className="w-full">
              Invite Only
            </Button>
          ) : hasPendingApplication ? (
            <Button disabled className="w-full bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
              <Clock size={16} className="mr-2" />
              Application Pending
            </Button>
          ) : profile?.house_id ? (
            <Button disabled className="w-full">
              Already in a House
            </Button>
          ) : (
            <Button
              className="w-full font-semibold"
              style={{
                backgroundColor: house.primary_color,
                color: house.secondary_color === "#0A0A0A" || house.secondary_color === "#1A1A1A" ? "#000" : "#fff",
              }}
              onClick={handleApply}
              disabled={isApplying}
            >
              {house.requires_approval ? "Apply to Join" : "Join House"}
            </Button>
          )}
        </div>

        {/* Members */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider mb-3">
            Members ({house.member_count})
          </h2>
          <div className="space-y-3">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate(`/u/${member.profile.username}`)}
                className="w-full flex items-center gap-3 p-2 -mx-2 rounded hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted">
                    {(member.profile.display_name || member.profile.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">
                    {member.profile.display_name || member.profile.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{member.profile.username}
                  </div>
                </div>
                {member.role !== "member" && (
                  <span
                    className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${house.primary_color}20`,
                      color: house.primary_color,
                    }}
                  >
                    {member.role}
                  </span>
                )}
                {member.profile.global_index_score && member.profile.global_index_score > 0 && (
                  <span className="text-xs text-gold font-mono">
                    {member.profile.global_index_score.toFixed(1)}
                  </span>
                )}
              </button>
            ))}

            {members.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No members yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
