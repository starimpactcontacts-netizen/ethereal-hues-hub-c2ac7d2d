import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Star, Zap, Award, ChevronRight, Trophy, Target, Flag, Layers, Flame, Sparkles, ArrowRight, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/loopgate/PageTransition";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { toast } from "sonner";

interface Crew {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  min_league: "open" | "pro" | "elite";
  join_type: string;
  member_count: number;
  avatar_url: string | null;
  banner_url?: string | null;
  banner_color?: string | null;
  owner_id: string;
  total_xp?: number;
  discord_url?: string | null;
  is_featured?: boolean;
}

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
};

// Discord-style banner gradients for crews without banners
const bannerGradients = [
  "from-purple-600 via-purple-800 to-indigo-900",
  "from-blue-600 via-blue-800 to-cyan-900",
  "from-pink-600 via-rose-800 to-red-900",
  "from-emerald-600 via-teal-800 to-cyan-900",
  "from-amber-600 via-orange-800 to-red-900",
  "from-violet-600 via-purple-800 to-pink-900",
];

// Large Discord-style crew card
const CrewCard = ({ 
  crew, 
  index, 
  onClick,
  showJoinButtons = false,
  onJoinPrimary,
  onJoinSecondary,
  canJoinPrimary = false,
  canJoinSecondary = false,
}: { 
  crew: Crew; 
  index: number; 
  onClick: () => void;
  showJoinButtons?: boolean;
  onJoinPrimary?: () => void;
  onJoinSecondary?: () => void;
  canJoinPrimary?: boolean;
  canJoinSecondary?: boolean;
}) => {
  const gradient = bannerGradients[index % bannerGradients.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Banner */}
      <div className={`relative h-32 sm:h-36 rounded-t-2xl overflow-hidden bg-gradient-to-br ${gradient}`}>
        {crew.banner_url ? (
          <img 
            src={crew.banner_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          // Decorative pattern for crews without banners
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)`
            }} />
          </div>
        )}
        
        {/* Avatar - overlapping banner */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-1 border-4 border-surface-1 overflow-hidden flex items-center justify-center shadow-xl">
            {crew.avatar_url ? (
              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-white/80 scale-90">
                {emblemIcons[crew.emblem] || <Shield className="w-7 h-7" />}
              </div>
            )}
          </div>
        </div>
        
        {/* Featured badge */}
        {crew.is_featured && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/30">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="bg-surface-1 rounded-b-2xl p-4 pt-8 border-x border-b border-border/50 group-hover:border-purple-500/30 transition-colors">
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          {crew.is_featured && (
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <h3 className="font-semibold text-base truncate group-hover:text-white transition-colors">{crew.name}</h3>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
          {crew.description || "A crew for competitive editors."}
        </p>
        
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-foreground font-medium">{Math.floor(crew.member_count * 0.3).toLocaleString()}</span> Online
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-muted-foreground text-muted-foreground" />
            <span className="text-foreground font-medium">{crew.member_count.toLocaleString()}</span> Members
          </span>
        </div>
        
        {/* Join buttons */}
        {showJoinButtons && (canJoinPrimary || canJoinSecondary) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
            {canJoinPrimary && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinPrimary?.();
                }}
                className="flex-1 bg-gold text-background hover:bg-gold/90 font-semibold"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                Join as Primary
              </Button>
            )}
            {canJoinSecondary && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinSecondary?.();
                }}
                className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Join
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function CrewsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { primaryCrew, secondaryCrews, canJoinSecondary, refresh: refreshMemberships } = useCrewMembership(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "my-crews">("discover");
  const [activeCategory, setActiveCategory] = useState<"all" | "featured" | "top" | "new">("all");

  useEffect(() => {
    if (primaryCrew || secondaryCrews.length > 0) {
      setActiveTab("my-crews");
    }
  }, [primaryCrew, secondaryCrews]);

  useEffect(() => {
    fetchCrews();
  }, [profile?.crew_id]);

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

    const crewsWithXP = await Promise.all((allCrews || []).map(async (crew) => {
      const { data: members } = await supabase
        .from("crew_members")
        .select("user_id")
        .eq("crew_id", crew.id);
      
      if (members && members.length > 0) {
        const memberIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("xp")
          .in("id", memberIds);
        
        const totalXP = (profiles || []).reduce((sum, p) => sum + (p.xp || 0), 0);
        return { ...crew, total_xp: totalXP };
      }
      return { ...crew, total_xp: 0 };
    }));

    setCrews(crewsWithXP);
    setLoading(false);
  };

  const myCrewIds = [primaryCrew?.crew_id, ...secondaryCrews.map(s => s.crew_id)].filter(Boolean);
  
  const filteredCrews = crews.filter((crew) => {
    if (myCrewIds.includes(crew.id)) return false;
    if (!searchQuery) return true;
    return crew.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Category filtering
  const getCategoryCrews = () => {
    switch (activeCategory) {
      case "featured":
        return filteredCrews.filter(c => c.is_featured);
      case "top":
        return [...filteredCrews].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 12);
      case "new":
        return [...filteredCrews].slice(-8).reverse();
      default:
        return filteredCrews;
    }
  };

  const handleJoinCrew = async (crew: Crew, asPrimary: boolean) => {
    if (!user) return;

    if (!asPrimary && !canJoinSecondary) {
      toast.error("You can only have 3 secondary crews. Leave one first.");
      return;
    }

    if (asPrimary && primaryCrew) {
      toast.error("You already have a primary crew.");
      return;
    }

    if (crew.join_type === "invite_only") {
      const { error } = await supabase.from("crew_join_requests").insert({
        crew_id: crew.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending request.");
        }
      } else {
        toast.success("Join request sent!");
      }
    } else {
      const { error } = await supabase.from("crew_members").insert({
        crew_id: crew.id,
        user_id: user.id,
        role: "member",
        is_primary: asPrimary,
      });

      if (error) {
        toast.error("Failed to join crew");
      } else {
        if (asPrimary) {
          await supabase.from("profiles").update({ crew_id: crew.id }).eq("id", user.id);
        }
        
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_amount: asPrimary ? 25 : 10,
          p_action: asPrimary ? 'primary_crew_join' : 'secondary_crew_join',
          p_description: `Joined ${crew.name}`,
        });
        toast.success(asPrimary ? `🏴 ${crew.name} is now your primary crew!` : `Joined ${crew.name}!`);
        fetchCrews();
        refreshMemberships();
      }
    }
  };

  const featuredCrews = crews.filter(c => c.is_featured);
  const getPrimaryCrewDetails = () => crews.find(c => c.id === primaryCrew?.crew_id);
  const getSecondaryCrewDetails = () => secondaryCrews.map(s => crews.find(c => c.id === s.crew_id)).filter(Boolean) as Crew[];

  const totalMembers = crews.reduce((sum, c) => sum + c.member_count, 0);

  const categories = [
    { id: "all" as const, label: "All" },
    { id: "featured" as const, label: "Featured" },
    { id: "top" as const, label: "Top Crews" },
    { id: "new" as const, label: "New" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Minimal Header Bar */}
        <div className="sticky top-0 z-50 bg-surface-0/95 backdrop-blur-md border-b border-border/50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-4 opacity-70" />
              <span className="text-sm font-medium text-muted-foreground">Crews</span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/crews/create")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create
            </Button>
          </div>
          
          {/* Category Tabs */}
          <div className="px-4 pb-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                  activeCategory === cat.id
                    ? "text-white border-white"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
            
            {/* Search on right */}
            <div className="flex-1" />
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-1 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </div>

        {/* Big Hero Section */}
        <div className="px-4 sm:px-8 pt-8 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-wide text-white leading-none mb-4">
              FIND YOUR<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">COMMUNITY</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              From casual to competitive, there's a crew for every editor.
            </p>
          </motion.div>
        </div>

        {/* Tab Switch: Discover / My Crews */}
        <div className="px-4 sm:px-8 mb-6">
          <div className="inline-flex gap-1 p-1 bg-surface-1 rounded-xl">
            {[
              { id: "discover" as const, label: "Discover", icon: Target },
              { id: "my-crews" as const, label: "My Crews", icon: Layers, count: (primaryCrew ? 1 : 0) + secondaryCrews.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-8">
          {/* My Crews Tab */}
          {activeTab === "my-crews" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="my-crews"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Primary Crew */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-gold" />
                    Primary Crew
                  </h2>
                  
                  {primaryCrew && getPrimaryCrewDetails() ? (
                    <div className="max-w-md">
                      <CrewCard
                        crew={getPrimaryCrewDetails()!}
                        index={0}
                        onClick={() => navigate(`/crews/${primaryCrew.crew_id}`)}
                      />
                    </div>
                  ) : (
                    <motion.div 
                      className="p-8 rounded-2xl bg-surface-1 border border-dashed border-border text-center max-w-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <Flag className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-base font-semibold mb-2">No Primary Crew Yet</p>
                      <p className="text-sm text-muted-foreground mb-5">
                        Join a crew as your primary to represent them in tournaments
                      </p>
                      <Button
                        onClick={() => setActiveTab("discover")}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Browse Crews
                      </Button>
                    </motion.div>
                  )}
                </section>

                {/* Secondary Crews */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Secondary Crews
                    <span className="text-sm text-muted-foreground font-normal">({secondaryCrews.length}/3)</span>
                  </h2>
                  
                  {getSecondaryCrewDetails().length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getSecondaryCrewDetails().map((crew, i) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          index={i}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-surface-1/50 border border-dashed border-border text-center">
                      <p className="text-sm text-muted-foreground">
                        Join more crews for practice and social connections.
                      </p>
                    </div>
                  )}
                </section>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="discover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                {/* Featured Section - Only show on "all" or "featured" */}
                {(activeCategory === "all" || activeCategory === "featured") && featuredCrews.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold" />
                      Featured Crews
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {featuredCrews.slice(0, 4).map((crew, i) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          index={i}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          showJoinButtons={!!user && !myCrewIds.includes(crew.id)}
                          onJoinPrimary={() => handleJoinCrew(crew, true)}
                          onJoinSecondary={() => handleJoinCrew(crew, false)}
                          canJoinPrimary={!primaryCrew}
                          canJoinSecondary={canJoinSecondary}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Crews Grid */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      {activeCategory === "all" ? "All Crews" : 
                       activeCategory === "top" ? "Top Crews" :
                       activeCategory === "new" ? "New Crews" : "Featured Crews"}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {getCategoryCrews().length} crews
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <motion.div 
                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : getCategoryCrews().length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 rounded-2xl bg-surface-1 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No crews found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {getCategoryCrews().map((crew, index) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          index={index}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          showJoinButtons={!!user && !myCrewIds.includes(crew.id)}
                          onJoinPrimary={() => handleJoinCrew(crew, true)}
                          onJoinSecondary={() => handleJoinCrew(crew, false)}
                          canJoinPrimary={!primaryCrew}
                          canJoinSecondary={canJoinSecondary}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
