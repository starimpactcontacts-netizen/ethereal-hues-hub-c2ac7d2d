import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Lock, Star, Zap, Award, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/loopgate/PageTransition";
import HouseCard from "@/components/loopgate/houses/HouseCard";
import HouseIcon from "@/components/loopgate/houses/HouseIcon";
import { toast } from "sonner";

interface House {
  id: string;
  name: string;
  type: string;
  symbol: string;
  primary_color: string;
  secondary_color: string;
  description: string;
  lore?: string;
  member_count: number;
  prestige_level: number;
  requires_approval: boolean;
  house_index?: number;
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  min_league: "open" | "pro" | "elite";
  join_type: string;
  member_count: number;
  avatar_url: string | null;
}

const leagueColors = {
  open: "border-muted-foreground/30 text-muted-foreground",
  pro: "border-blue-500/50 text-blue-400",
  elite: "border-gold/50 text-gold",
};

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-8 h-8" />,
  crown: <Crown className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  star: <Star className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
  award: <Award className="w-8 h-8" />,
};

export default function CrewsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [ownedCrewsCount, setOwnedCrewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Houses state
  const [houses, setHouses] = useState<House[]>([]);
  const [userHouseId, setUserHouseId] = useState<string | null>(null);
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);
  const [applyingHouseId, setApplyingHouseId] = useState<string | null>(null);
  const [housesLoading, setHousesLoading] = useState(true);

  useEffect(() => {
    fetchCrews();
    fetchHouses();
  }, [profile?.crew_id, profile?.house_id]);

  const fetchCrews = async () => {
    setLoading(true);

    // Fetch all crews
    const { data: allCrews, error } = await supabase
      .from("crews")
      .select("*")
      .order("member_count", { ascending: false });

    if (error) {
      console.error("Error fetching crews:", error);
      setLoading(false);
      return;
    }

    setCrews(allCrews || []);

    // If user has a crew, find it
    if (profile?.crew_id) {
      const userCrew = allCrews?.find((c) => c.id === profile.crew_id);
      setMyCrew(userCrew || null);
    } else {
      setMyCrew(null);
    }

    // Count crews owned by user (max 2 allowed)
    if (user) {
      const ownedCount = allCrews?.filter((c) => c.owner_id === user.id).length || 0;
      setOwnedCrewsCount(ownedCount);
    }

    setLoading(false);
  };

  const fetchHouses = async () => {
    setHousesLoading(true);
    
    // Fetch all houses
    const { data: housesData, error } = await supabase
      .from("houses")
      .select("*")
      .order("type", { ascending: true })
      .order("member_count", { ascending: false });

    if (error) {
      console.error("Error fetching houses:", error);
      setHousesLoading(false);
      return;
    }

    // Fetch all house members with their index scores in a single query
    const houseIds = (housesData || []).map(h => h.id);
    const { data: allMembers } = await supabase
      .from("house_members")
      .select("house_id, user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
      .in("house_id", houseIds.length > 0 ? houseIds : ['']);

    // Group members by house and calculate stats
    const membersByHouse = new Map<string, number>();
    (allMembers || []).forEach((m: any) => {
      const current = membersByHouse.get(m.house_id) || 0;
      membersByHouse.set(m.house_id, current + (m.profile?.global_index_score || 0));
    });

    const housesWithIndex = (housesData || []).map(house => ({
      ...house, 
      house_index: Math.floor(membersByHouse.get(house.id) || 0),
    }));

    setHouses(housesWithIndex);
    
    // Set user's current house
    if (profile?.house_id) {
      setUserHouseId(profile.house_id);
    }
    
    // Check for pending applications
    if (user) {
      const { data: pendingApp } = await supabase
        .from("house_applications")
        .select("house_id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
      
      if (pendingApp) {
        setPendingApplicationId(pendingApp.house_id);
      }
    }
    
    setHousesLoading(false);
  };

  const handleApplyToHouse = async (houseId: string) => {
    if (!user) {
      toast.error("Please log in to apply");
      return;
    }
    
    if (userHouseId) {
      toast.error("You're already in a house");
      return;
    }
    
    setApplyingHouseId(houseId);
    
    const house = houses.find(h => h.id === houseId);
    
    if (house?.requires_approval) {
      // Create application
      const { error } = await supabase
        .from("house_applications")
        .insert({
          house_id: houseId,
          user_id: user.id,
        });
      
      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending application");
        } else {
          toast.error("Failed to apply");
        }
      } else {
        setPendingApplicationId(houseId);
        toast.success("Application submitted!");
      }
    } else {
      // Direct join
      const { error } = await supabase
        .from("house_members")
        .insert({
          house_id: houseId,
          user_id: user.id,
          role: "member",
        });
      
      if (error) {
        toast.error("Failed to join house");
      } else {
        // Update profile
        await supabase
          .from("profiles")
          .update({ house_id: houseId, house_changed_at: new Date().toISOString() })
          .eq("id", user.id);
        
        setUserHouseId(houseId);
        toast.success("Welcome to the house!");
        fetchHouses();
      }
    }
    
    setApplyingHouseId(null);
  };

  const filteredCrews = crews.filter((crew) => {
    if (myCrew && crew.id === myCrew.id) return false;
    if (!searchQuery) return true;
    return crew.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleJoinCrew = async (crew: Crew) => {
    if (!user) return;

    if (crew.join_type === "invite_only") {
      // Create join request
      const { error } = await supabase.from("crew_join_requests").insert({
        crew_id: crew.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          alert("You already have a pending request for this crew.");
        } else {
          console.error("Error requesting to join:", error);
        }
      } else {
        alert("Join request sent!");
      }
    } else {
      // Direct join for open crews
      const { error } = await supabase.from("crew_members").insert({
        crew_id: crew.id,
        user_id: user.id,
        role: "member",
      });

      if (error) {
        console.error("Error joining crew:", error);
      } else {
        fetchCrews();
      }
    }
  };

  // Get user's house for display
  const userHouse = houses.find(h => h.id === userHouseId);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold tracking-tight">Crews & Houses</h1>
              <div className="flex items-center gap-2">
                {ownedCrewsCount < 2 && (
                  <Button
                    size="sm"
                    onClick={() => navigate("/crews/create")}
                    className="bg-gold text-black hover:bg-gold/90"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create Crew
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search crews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">
          {/* HOUSES SECTION - DOMINANT */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold tracking-tight">Houses</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/houses")}
                className="text-muted-foreground hover:text-foreground"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* User's House Banner */}
            {userHouse && (
              <div
                onClick={() => navigate(`/houses/${userHouse.id}`)}
                className="relative overflow-hidden rounded-xl p-5 mb-4 cursor-pointer transition-transform hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${userHouse.primary_color}20, ${userHouse.secondary_color}40)`,
                  border: `1px solid ${userHouse.primary_color}50`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at top right, ${userHouse.primary_color}60, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${userHouse.primary_color}30, ${userHouse.secondary_color}30)`,
                      border: `2px solid ${userHouse.primary_color}`,
                    }}
                  >
                    <HouseIcon symbol={userHouse.symbol} size={32} style={{ color: userHouse.primary_color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${userHouse.primary_color}30`,
                          color: userHouse.primary_color,
                        }}
                      >
                        Your House
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg mt-1">{userHouse.name}</h3>
                    <p className="text-xs text-muted-foreground">{userHouse.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Houses Grid */}
            {housesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading houses...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {houses
                  .filter(h => h.id !== userHouseId)
                  .slice(0, 4)
                  .map((house) => (
                    <HouseCard
                      key={house.id}
                      house={house}
                      userHouseId={userHouseId}
                      pendingApplicationId={pendingApplicationId}
                      onApply={handleApplyToHouse}
                      onViewDetails={(id) => navigate(`/houses/${id}`)}
                      isApplying={applyingHouseId === house.id}
                    />
                  ))}
              </div>
            )}

            {houses.length > 4 && (
              <Button
                variant="outline"
                className="w-full mt-3 border-gold/30 text-gold hover:bg-gold/10"
                onClick={() => navigate("/houses")}
              >
                <Crown className="w-4 h-4 mr-2" />
                View All {houses.length} Houses
              </Button>
            )}
          </section>

          {/* CREWS SECTION */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading crews...
            </div>
          ) : (
            <>
              {/* My Crew */}
              {myCrew && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    My Crew
                  </h2>
                  <div
                    onClick={() => navigate(`/crews/${myCrew.id}`)}
                    className="p-4 bg-muted/30 border border-gold/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gold/10 flex items-center justify-center text-gold">
                        {myCrew.avatar_url ? (
                          <img src={myCrew.avatar_url} alt={myCrew.name} className="w-full h-full object-cover" />
                        ) : (
                          emblemIcons[myCrew.emblem] || <Shield className="w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{myCrew.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {myCrew.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {myCrew.member_count} members
                          </span>
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 ${
                              leagueColors[myCrew.min_league]
                            }`}
                          >
                            {myCrew.min_league}+
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Recommended / All Crews */}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {myCrew ? "Other Crews" : "Recommended Crews"}
                </h2>

                {filteredCrews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No crews found" : "No crews yet. Create the first one!"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCrews.map((crew) => (
                      <div
                        key={crew.id}
                        className="p-4 bg-muted/30 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            onClick={() => navigate(`/crews/${crew.id}`)}
                            className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center text-muted-foreground cursor-pointer hover:opacity-80"
                          >
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                            ) : (
                              emblemIcons[crew.emblem] || <Shield className="w-6 h-6" />
                            )}
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/crews/${crew.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{crew.name}</h3>
                              {crew.join_type === "invite_only" && (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {crew.member_count} members
                              </span>
                              <span
                                className={`text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 ${
                                  leagueColors[crew.min_league]
                                }`}
                              >
                                {crew.min_league}+
                              </span>
                            </div>
                          </div>
                          {!myCrew && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinCrew(crew)}
                              className="shrink-0"
                            >
                              {crew.join_type === "invite_only" ? "Request" : "Join"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
