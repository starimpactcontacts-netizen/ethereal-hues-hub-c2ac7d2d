import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Shield, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import HouseCard from "@/components/loopgate/houses/HouseCard";
import HouseBadge from "@/components/loopgate/houses/HouseBadge";
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
  member_count: number;
  prestige_level: number;
  requires_approval: boolean;
  house_index?: number;
}

export default function HousesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "prestige">("all");
  const [pendingApplicationHouseId, setPendingApplicationHouseId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [myHouse, setMyHouse] = useState<House | null>(null);

  useEffect(() => {
    fetchHouses();
    if (user) {
      fetchUserHouseData();
    }
  }, [user]);

  async function fetchHouses() {
    // Fetch houses
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

    // For each house, calculate total index from members
    const housesWithIndex = await Promise.all(
      (housesData || []).map(async (house) => {
        const { data: members } = await supabase
          .from("house_members")
          .select("user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
          .eq("house_id", house.id);

        const totalIndex = members?.reduce((sum, m: any) => 
          sum + (m.profile?.global_index_score || 0), 0
        ) || 0;

        return { ...house, house_index: Math.floor(totalIndex) };
      })
    );

    setHouses(housesWithIndex);
    setLoading(false);
  }

  async function fetchUserHouseData() {
    if (!user) return;

    // Check for pending application
    const { data: applications } = await supabase
      .from("house_applications")
      .select("house_id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (applications) {
      setPendingApplicationHouseId(applications.house_id);
    }

    // Get user's current house
    if (profile?.house_id) {
      const { data: houseData } = await supabase
        .from("houses")
        .select("*")
        .eq("id", profile.house_id)
        .single();
      
      if (houseData) {
        // Calculate house index
        const { data: members } = await supabase
          .from("house_members")
          .select("user_id, profile:profiles!house_members_user_id_fkey(global_index_score)")
          .eq("house_id", houseData.id);

        const totalIndex = members?.reduce((sum, m: any) => 
          sum + (m.profile?.global_index_score || 0), 0
        ) || 0;

        setMyHouse({ ...houseData, house_index: Math.floor(totalIndex) });
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

    if (house.requires_approval) {
      // Create application
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
      // Direct join (no approval needed)
      const { error } = await supabase
        .from("house_members")
        .insert({ house_id: houseId, user_id: user.id });

      if (error) {
        toast.error("Failed to join house");
      } else {
        toast.success(`Welcome to ${house.name}`);
        // Update profile
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
    const matchesFilter = filter === "all" || house.type === filter;
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-display font-bold uppercase tracking-wider">Houses</h1>
            {myHouse && (
              <HouseBadge house={myHouse} size="md" />
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search houses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="all" className="text-xs uppercase">All</TabsTrigger>
              <TabsTrigger value="public" className="text-xs uppercase flex items-center gap-1">
                <Shield size={12} />
                Public
              </TabsTrigger>
              <TabsTrigger value="prestige" className="text-xs uppercase flex items-center gap-1">
                <Crown size={12} />
                Prestige
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-6">
        {/* User's House Section */}
        {myHouse && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-gold/30 bg-muted/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 border border-gold/20">
                <HouseIcon symbol={myHouse.symbol} size={24} className="text-gold" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Your House</div>
                <div className="font-display font-semibold">{myHouse.name}</div>
              </div>
              {myHouse.house_index !== undefined && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">House Index</div>
                  <div className="text-gold font-mono">{myHouse.house_index.toLocaleString()}</div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/houses/${myHouse.id}`)}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              View Details →
            </button>
          </motion.div>
        )}

        {/* Public Houses */}
        {publicHouses.length > 0 && (filter === "all" || filter === "public") && (
          <div>
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Shield size={14} />
              Public Houses
            </h2>
            <div className="space-y-3">
              {publicHouses.map((house) => (
                <HouseCard
                  key={house.id}
                  house={house}
                  userHouseId={profile?.house_id}
                  pendingApplicationId={pendingApplicationHouseId}
                  onApply={handleApply}
                  onViewDetails={(id) => navigate(`/houses/${id}`)}
                  isApplying={isApplying}
                />
              ))}
            </div>
          </div>
        )}

        {/* Prestige Houses */}
        {prestigeHouses.length > 0 && (filter === "all" || filter === "prestige") && (
          <div>
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Crown size={14} />
              Prestige Houses
            </h2>
            <div className="space-y-3">
              {prestigeHouses.map((house) => (
                <HouseCard
                  key={house.id}
                  house={house}
                  userHouseId={profile?.house_id}
                  pendingApplicationId={pendingApplicationHouseId}
                  onApply={handleApply}
                  onViewDetails={(id) => navigate(`/houses/${id}`)}
                  isApplying={isApplying}
                />
              ))}
            </div>
          </div>
        )}

        {filteredHouses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No houses found
          </div>
        )}
      </div>
    </div>
  );
}
