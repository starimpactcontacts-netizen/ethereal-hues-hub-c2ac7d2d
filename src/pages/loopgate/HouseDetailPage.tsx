import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Clock, LogOut, BookOpen, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import HouseIcon from "@/components/loopgate/houses/HouseIcon";
import HouseFeed from "@/components/loopgate/houses/HouseFeed";
import PrestigeGate from "@/components/loopgate/houses/PrestigeGate";

interface House {
  id: string;
  name: string;
  type: string;
  symbol: string;
  primary_color: string;
  secondary_color: string;
  description: string;
  lore: string | null;
  member_count: number;
  requires_approval: boolean;
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

export default function HouseDetailPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [house, setHouse] = useState<House | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [houseIndex, setHouseIndex] = useState(0);
  const [avgQoi, setAvgQoi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showPrestigeGate, setShowPrestigeGate] = useState(false);

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
      .select("id, name, type, symbol, primary_color, secondary_color, description, lore, member_count, requires_approval")
      .eq("id", houseId)
      .single();

    if (houseError || !houseData) {
      toast.error("House not found");
      navigate("/houses");
      return;
    }

    setHouse(houseData);

    // Fetch members with profiles and calculate house index
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
      .limit(50);

    if (membersData) {
      const typedMembers = membersData as unknown as Member[];
      setMembers(typedMembers);
      setMemberIds(typedMembers.map(m => m.user_id));
      
      // Calculate total house index and average
      const scores = typedMembers.map(m => m.profile?.global_index_score || 0);
      const totalIndex = scores.reduce((sum, s) => sum + s, 0);
      setHouseIndex(Math.floor(totalIndex));
      setAvgQoi(scores.length > 0 ? totalIndex / scores.length : 0);
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

    // Show prestige gate for invite-only houses
    if (house.type === "prestige") {
      setShowPrestigeGate(true);
      setIsApplying(false);
      return;
    }

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
        toast.success(`Welcome to ${house.name}`);
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
    <>
    {/* Prestige Gate Animation */}
    <AnimatePresence>
      {showPrestigeGate && (
        <PrestigeGate onComplete={() => setShowPrestigeGate(false)} />
      )}
    </AnimatePresence>
    
    <div className="min-h-screen bg-background pb-24">
      {/* Minimal Hero */}
      <div className="relative h-40 bg-muted/30">
        {/* Subtle glow */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 0%, hsl(var(--gold)), transparent 70%)`,
          }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate("/houses")}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur border border-border"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 rounded-xl bg-muted/50 border border-gold/20"
          >
            <HouseIcon 
              symbol={house.symbol} 
              size={56} 
              className="text-gold"
            />
          </motion.div>
        </div>

        {isPrestige && (
          <div className="absolute top-4 right-4 px-2 py-1 rounded border border-gold/50 bg-background/80 backdrop-blur text-gold text-xs font-semibold uppercase tracking-wider">
            Prestige
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-10 space-y-4">
        {/* Name & Description */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h1 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
            {house.name}
          </h1>
          <p className="text-sm text-muted-foreground italic">
            "{house.description}"
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users size={14} />
              <span>{house.member_count} members</span>
            </div>
            <div className="flex items-center gap-1.5 text-gold">
              <span>◆</span>
              <span className="font-mono">{houseIndex.toLocaleString()} Index</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp size={14} />
              <span className="font-mono">{avgQoi.toFixed(1)} avg</span>
            </div>
          </div>
        </div>

        {/* Lore Section */}
        {house.lore && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider mb-3 text-muted-foreground flex items-center gap-2">
              <BookOpen size={14} />
              Lore
            </h2>
            <p className="text-sm text-foreground/90 leading-relaxed italic">
              "{house.lore}"
            </p>
          </div>
        )}

        {/* Action Button */}
        <div>
          {isMember ? (
            <Button
              variant="outline"
              className="w-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              <LogOut size={16} className="mr-2" />
              Leave House
            </Button>
          ) : isPrestige ? (
            <Button 
              variant="outline"
              className="w-full font-semibold uppercase border-gold/50 text-gold bg-background hover:bg-gold/10"
              onClick={() => setShowPrestigeGate(true)}
            >
              Invite Only
            </Button>
          ) : hasPendingApplication ? (
            <Button 
              disabled 
              variant="outline"
              className="w-full bg-muted text-muted-foreground border-muted"
            >
              <Clock size={16} className="mr-2" />
              Application Pending
            </Button>
          ) : profile?.house_id ? (
            <Button disabled variant="outline" className="w-full">
              Already in a House
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full font-semibold border-gold/30 hover:bg-gold/10 hover:border-gold/50"
              onClick={handleApply}
              disabled={isApplying}
            >
              Apply
            </Button>
          )}
        </div>

        {/* House Activity Feed */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider mb-3 text-muted-foreground flex items-center gap-2">
            <Activity size={14} />
            House Activity
          </h2>
          <HouseFeed houseId={house.id} memberIds={memberIds} />
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-display font-semibold uppercase tracking-wider mb-3 text-muted-foreground">
            Members
          </h2>
          <div className="space-y-2">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate(`/u/${member.profile.username}`)}
                className="w-full flex items-center gap-3 p-2 -mx-2 rounded hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={member.profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-xs">
                    {(member.profile.display_name || member.profile.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-sm truncate">
                    {member.profile.display_name || member.profile.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{member.profile.username}
                  </div>
                </div>
                {member.role !== "member" && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-gold/30 text-gold">
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
    </>
  );
}
