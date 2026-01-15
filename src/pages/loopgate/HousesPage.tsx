import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Shield, Crown, Trophy, Users, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import HouseCard from "@/components/loopgate/houses/HouseCard";
import HouseLeaderboard from "@/components/loopgate/houses/HouseLeaderboard";
import PrestigeGate from "@/components/loopgate/houses/PrestigeGate";
import HouseIcon from "@/components/loopgate/houses/HouseIcon";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
  prestige_level: number;
  requires_approval: boolean;
  house_index: number;
  avg_qoi: number;
}

type TabType = "all" | "rankings" | "public" | "prestige";

export default function HousesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TabType>("all");
  const [pendingApplicationHouseId, setPendingApplicationHouseId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [myHouse, setMyHouse] = useState<House | null>(null);
  const [showPrestigeGate, setShowPrestigeGate] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "ALL", icon: Users },
    { id: "rankings", label: "RANKINGS", icon: Trophy },
    { id: "public", label: "PUBLIC", icon: Shield },
    { id: "prestige", label: "PRESTIGE", icon: Crown },
  ];

  useEffect(() => {
    fetchHouses();
    if (user) {
      fetchUserHouseData();
    }
  }, [user]);

  async function fetchHouses() {
    const { data: housesData, error } = await supabase
      .from("houses")
      .select("*")
      .order("type", { ascending: true })
      .order("member_count", { ascending: false });

    if (error) {
      console.error("Error fetching houses:", error);
      toast.error("Failed to load houses");
      setLoading(false);
      return;
    }

    const houseIds = (housesData || []).map(h => h.id);
    const { data: allMembers } = await supabase
      .from("house_members")
      .select("house_id, user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
      .in("house_id", houseIds.length > 0 ? houseIds : ['']);

    const membersByHouse = new Map<string, number[]>();
    (allMembers || []).forEach((m: any) => {
      const scores = membersByHouse.get(m.house_id) || [];
      scores.push(m.profile?.global_index_score || 0);
      membersByHouse.set(m.house_id, scores);
    });

    const housesWithIndex = (housesData || []).map(house => {
      const scores = membersByHouse.get(house.id) || [];
      const totalIndex = scores.reduce((sum, score) => sum + score, 0);
      const avgQoi = scores.length > 0 ? totalIndex / scores.length : 0;
      return { 
        ...house, 
        house_index: Math.floor(totalIndex),
        avg_qoi: avgQoi,
      };
    });

    setHouses(housesWithIndex);
    setLoading(false);
  }

  async function fetchUserHouseData() {
    if (!user) return;

    const { data: applications } = await supabase
      .from("house_applications")
      .select("house_id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (applications) {
      setPendingApplicationHouseId(applications.house_id);
    }

    if (profile?.house_id) {
      const { data: houseData } = await supabase
        .from("houses")
        .select("*")
        .eq("id", profile.house_id)
        .single();
      
      if (houseData) {
        const { data: members } = await supabase
          .from("house_members")
          .select("user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
          .eq("house_id", houseData.id);

        const scores = members?.map((m: any) => m.profile?.global_index_score || 0) || [];
        const totalIndex = scores.reduce((sum, score) => sum + score, 0);
        const avgQoi = scores.length > 0 ? totalIndex / scores.length : 0;

        setMyHouse({ 
          ...houseData, 
          house_index: Math.floor(totalIndex),
          avg_qoi: avgQoi,
        });
      }
    }
  }

  async function handleApply(houseId: string) {
    if (!user) {
      toast.error("Sign in to apply");
      navigate("/auth");
      return;
    }

    if (profile?.house_id) {
      toast.error("You're already in a house");
      return;
    }

    setIsApplying(true);

    const house = houses.find(h => h.id === houseId);
    if (!house) return;

    if (house.type === "prestige") {
      setShowPrestigeGate(true);
      setIsApplying(false);
      return;
    }

    if (house.requires_approval) {
      const { error } = await supabase
        .from("house_applications")
        .insert({ house_id: houseId, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending application");
        } else {
          toast.error("Failed to apply");
        }
      } else {
        setPendingApplicationHouseId(houseId);
        toast.success("Application submitted");
      }
    } else {
      const { error } = await supabase
        .from("house_members")
        .insert({ house_id: houseId, user_id: user.id });

      if (error) {
        toast.error("Failed to join house");
      } else {
        toast.success(`Welcome to ${house.name}`);
        await supabase
          .from("profiles")
          .update({ house_id: houseId, house_changed_at: new Date().toISOString() })
          .eq("id", user.id);
        fetchHouses();
        fetchUserHouseData();
      }
    }

    setIsApplying(false);
  }

  const filteredHouses = houses.filter(house => {
    const matchesSearch = house.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      house.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || filter === "rankings" || house.type === filter;
    return matchesSearch && matchesFilter;
  });

  const publicHouses = filteredHouses.filter(h => h.type === "public");
  const prestigeHouses = filteredHouses.filter(h => h.type === "prestige");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading houses...</div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showPrestigeGate && (
          <PrestigeGate onComplete={() => setShowPrestigeGate(false)} />
        )}
      </AnimatePresence>
    
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
              {myHouse && (
                <div className="flex items-center gap-2 text-gold">
                  <HouseIcon symbol={myHouse.symbol} size={16} className="text-gold" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{myHouse.name}</span>
                </div>
              )}
            </div>
            
            {/* Hero Title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-[10px] text-gold uppercase tracking-[0.4em] font-medium">Legacy</span>
              </div>
              <h1 className="font-display text-4xl tracking-wider text-white mb-1">HOUSES</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Choose your allegiance
              </p>
            </div>
          </header>

          {/* Search */}
          <div className="relative z-10 px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search houses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-0/50 backdrop-blur-sm border border-border/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="relative z-10 px-4 pb-4">
            <div className="flex gap-1 bg-surface-0/50 backdrop-blur-sm p-1 border border-border/50">
              {tabs.map((tab) => {
                const isActive = filter === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wider transition-all ${
                      isActive
                        ? "bg-gold text-background"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-4 space-y-6"
          >
            {/* House Leaderboard */}
            {filter === "rankings" && (
              <HouseLeaderboard houses={filteredHouses} />
            )}

            {/* User's House Section */}
            {myHouse && filter !== "rankings" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/houses/${myHouse.id}`)}
                className="relative overflow-hidden p-4 border border-gold/30 cursor-pointer hover:border-gold/50 transition-colors"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--gold) / 0.15), hsl(var(--gold) / 0.05))`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at top right, hsl(var(--gold) / 0.4), transparent 60%)`,
                  }}
                />
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 border border-gold/30">
                    <HouseIcon symbol={myHouse.symbol} size={24} className="text-gold" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-gold uppercase tracking-widest font-bold">Your House</div>
                    <div className="font-display font-semibold tracking-wide">{myHouse.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Index</div>
                    <div className="text-gold font-mono font-bold">{myHouse.house_index.toLocaleString()}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.div>
            )}

            {/* Houses List */}
            {filter !== "rankings" && (
              <>
                {/* Public Houses */}
                {publicHouses.length > 0 && (filter === "all" || filter === "public") && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-gold" />
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Public Houses
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {publicHouses.map((house, index) => (
                        <motion.div
                          key={house.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <HouseCard
                            house={house}
                            userHouseId={profile?.house_id}
                            pendingApplicationId={pendingApplicationHouseId}
                            onApply={handleApply}
                            onViewDetails={(id) => navigate(`/houses/${id}`)}
                            isApplying={isApplying}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prestige Houses */}
                {prestigeHouses.length > 0 && (filter === "all" || filter === "prestige") && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Crown size={14} className="text-gold" />
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Prestige Houses
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {prestigeHouses.map((house, index) => (
                        <motion.div
                          key={house.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <HouseCard
                            house={house}
                            userHouseId={profile?.house_id}
                            pendingApplicationId={pendingApplicationHouseId}
                            onApply={handleApply}
                            onViewDetails={(id) => navigate(`/houses/${id}`)}
                            isApplying={isApplying}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredHouses.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-1 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No houses found</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
