import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Lock, Star, Zap, Award, ChevronRight, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/loopgate/PageTransition";
import HouseCard from "@/components/loopgate/houses/HouseCard";
import HouseIcon from "@/components/loopgate/houses/HouseIcon";
import loopgateLogo from "@/assets/loopgate-logo.png";
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

    if (profile?.crew_id) {
      const userCrew = allCrews?.find((c) => c.id === profile.crew_id);
      setMyCrew(userCrew || null);
    } else {
      setMyCrew(null);
    }

    if (user) {
      const ownedCount = allCrews?.filter((c) => c.owner_id === user.id).length || 0;
      setOwnedCrewsCount(ownedCount);
    }

    setLoading(false);
  };

  const fetchHouses = async () => {
    setHousesLoading(true);
    
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

    const houseIds = (housesData || []).map(h => h.id);
    const { data: allMembers } = await supabase
      .from("house_members")
      .select("house_id, user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
      .in("house_id", houseIds.length > 0 ? houseIds : ['']);

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
    
    if (profile?.house_id) {
      setUserHouseId(profile.house_id);
    }
    
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
      const { error } = await supabase.from("crew_join_requests").insert({
        crew_id: crew.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending request for this crew.");
        } else {
          console.error("Error requesting to join:", error);
        }
      } else {
        toast.success("Join request sent!");
      }
    } else {
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

  const userHouse = houses.find(h => h.id === userHouseId);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Cinematic Hero Header */}
        <div className="relative overflow-hidden">
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-gold/3 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(212,175,55,0.15),transparent_60%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gold/8 blur-[80px] rounded-full" />
          
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <header className="relative z-10 px-4 pt-5 pb-6">
            <div className="flex items-center justify-between mb-5">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-5 opacity-80" />
              {ownedCrewsCount < 2 && (
                <Button
                  size="sm"
                  onClick={() => navigate("/crews/create")}
                  className="bg-gold text-background hover:bg-gold/90 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Crew
                </Button>
              )}
            </div>
            
            {/* Hero Title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-medium">Community</span>
              </div>
              <h1 className="font-display text-4xl tracking-wider text-white mb-1">CREWS & HOUSES</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Find your tribe
              </p>
            </div>
          </header>

          {/* Search */}
          <div className="relative z-10 px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search crews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-0/50 backdrop-blur-sm border border-border/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors"
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
                <h2 className="font-display text-lg font-bold tracking-wide uppercase">Houses</h2>
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
            <AnimatePresence>
              {userHouse && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/houses/${userHouse.id}`)}
                  className="relative overflow-hidden p-5 mb-4 cursor-pointer transition-all hover:scale-[1.01] border border-gold/30"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--gold) / 0.15), hsl(var(--gold) / 0.05))`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(ellipse at top right, hsl(var(--gold) / 0.3), transparent 60%)`,
                    }}
                  />
                  <div className="relative flex items-center gap-4">
                    <div
                      className="w-16 h-16 flex items-center justify-center bg-gold/10 border border-gold/30"
                    >
                      <HouseIcon symbol={userHouse.symbol} size={32} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gold/20 text-gold border border-gold/30">
                          Your House
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg mt-1 tracking-wide">{userHouse.name}</h3>
                      <p className="text-xs text-muted-foreground">{userHouse.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Houses Grid */}
            {housesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading houses...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {houses
                  .filter(h => h.id !== userHouseId)
                  .slice(0, 4)
                  .map((house, index) => (
                    <motion.div
                      key={house.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <HouseCard
                        house={house}
                        userHouseId={userHouseId}
                        pendingApplicationId={pendingApplicationId}
                        onApply={handleApplyToHouse}
                        onViewDetails={(id) => navigate(`/houses/${id}`)}
                        isApplying={applyingHouseId === house.id}
                      />
                    </motion.div>
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
              <AnimatePresence>
                {myCrew && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-gold" />
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        My Crew
                      </h2>
                    </div>
                    <div
                      onClick={() => navigate(`/crews/${myCrew.id}`)}
                      className="relative overflow-hidden p-4 border border-gold/30 cursor-pointer hover:border-gold/50 transition-colors"
                      style={{
                        background: `linear-gradient(135deg, hsl(var(--gold) / 0.1), transparent)`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 overflow-hidden bg-gold/10 flex items-center justify-center text-gold border border-gold/30">
                          {myCrew.avatar_url ? (
                            <img src={myCrew.avatar_url} alt={myCrew.name} className="w-full h-full object-cover" />
                          ) : (
                            emblemIcons[myCrew.emblem] || <Shield className="w-8 h-8" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold tracking-wide truncate">{myCrew.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {myCrew.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {myCrew.member_count} members
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 ${
                                leagueColors[myCrew.min_league]
                              }`}
                            >
                              {myCrew.min_league}+
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Recommended / All Crews */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gold" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {myCrew ? "Other Crews" : "Recommended Crews"}
                  </h2>
                </div>

                {filteredCrews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-1 flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? "No crews found" : "No crews yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {!searchQuery && "Create the first one!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCrews.map((crew, index) => (
                      <motion.div
                        key={crew.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative overflow-hidden p-4 bg-surface-0/50 border border-border/50 backdrop-blur-sm hover:border-gold/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            onClick={() => navigate(`/crews/${crew.id}`)}
                            className="w-12 h-12 overflow-hidden bg-muted/50 flex items-center justify-center text-muted-foreground cursor-pointer hover:opacity-80 border border-border"
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
                              <h3 className="font-display font-semibold tracking-wide truncate text-sm">{crew.name}</h3>
                              {crew.join_type === "invite_only" && (
                                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {crew.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {crew.member_count} members
                              </span>
                              <span
                                className={`text-[8px] font-bold uppercase tracking-wider border px-1 py-0.5 ${
                                  leagueColors[crew.min_league]
                                }`}
                              >
                                {crew.min_league}+
                              </span>
                            </div>
                          </div>
                          {!profile?.crew_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinCrew(crew)}
                              className="text-xs font-bold border-gold/30 text-foreground hover:bg-gold/10 hover:border-gold/50"
                            >
                              {crew.join_type === "invite_only" ? "Request" : "Join"}
                            </Button>
                          )}
                        </div>
                      </motion.div>
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
