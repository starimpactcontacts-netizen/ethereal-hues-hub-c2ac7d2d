import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Star, Zap, Award, ChevronRight, Trophy, Target, Flag, Layers, Sparkles, Circle, LogOut, ArrowRight, Clock, AlertCircle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/loopgate/PageTransition";
import loopgateLogo from "@/assets/loopgate-logo.png";
import { toast } from "sonner";
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

// Loopgate-style banner gradients
const bannerGradients = [
  "from-purple-900 via-purple-800 to-indigo-900",
  "from-blue-900 via-blue-800 to-cyan-900",
  "from-rose-900 via-rose-800 to-pink-900",
  "from-emerald-900 via-teal-800 to-cyan-900",
  "from-amber-900 via-orange-800 to-red-900",
  "from-violet-900 via-purple-800 to-fuchsia-900",
];

// Crew Card Component
const CrewCard = ({ 
  crew, 
  index, 
  onClick,
  showActions = false,
  onJoinPrimary,
  onJoinSecondary,
  canJoinPrimary = false,
  canJoinSecondary = false,
}: { 
  crew: Crew; 
  index: number; 
  onClick: () => void;
  showActions?: boolean;
  onJoinPrimary?: () => void;
  onJoinSecondary?: () => void;
  canJoinPrimary?: boolean;
  canJoinSecondary?: boolean;
}) => {
  const gradient = bannerGradients[index % bannerGradients.length];
  const onlineCount = Math.max(1, Math.floor(crew.member_count * 0.25));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Banner */}
      <div className={`relative h-28 sm:h-32 rounded-t-xl overflow-hidden bg-gradient-to-br ${gradient}`}>
        {crew.banner_url ? (
          <img src={crew.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }} />
          </div>
        )}
        
        {crew.is_featured && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gold/20 backdrop-blur-sm">
            <Star className="w-3 h-3 text-gold fill-gold" />
          </div>
        )}
      </div>
      
      {/* Content with Avatar overlapping */}
      <div className="bg-surface-1 rounded-b-xl p-3 border-x border-b border-border/40 group-hover:border-purple-500/30 transition-colors">
        {/* Avatar - positioned to overlap banner */}
        <div className="relative z-10 -mt-8 mb-2">
          <div className="w-12 h-12 rounded-xl bg-surface-1 border-[3px] border-surface-1 overflow-hidden flex items-center justify-center shadow-lg">
            {crew.avatar_url ? (
              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-muted-foreground scale-75">
                {emblemIcons[crew.emblem] || <Shield className="w-6 h-6" />}
              </div>
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-white transition-colors">
          {crew.name}
        </h3>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[32px]">
          {crew.description || "A crew for competitive editors."}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
            <span className="text-foreground">{onlineCount}</span> Online
          </span>
          <span className="flex items-center gap-1">
            <Circle className="w-1.5 h-1.5 fill-muted-foreground" />
            <span className="text-foreground">{crew.member_count}</span> Members
          </span>
        </div>
        
        {/* Actions */}
        {showActions && (canJoinPrimary || canJoinSecondary) && (
          <div className="flex gap-2">
            {canJoinPrimary && !canJoinSecondary && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onJoinPrimary?.(); }}
                className="w-full h-8 text-xs bg-gold text-background hover:bg-gold/90"
              >
                <Crown className="w-3 h-3 mr-1" />
                Join as Primary
              </Button>
            )}
            {canJoinSecondary && !canJoinPrimary && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onJoinSecondary?.(); }}
                className="w-full h-8 text-xs border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              >
                <Plus className="w-3 h-3 mr-1" />
                Join
              </Button>
            )}
            {canJoinPrimary && canJoinSecondary && (
              <>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onJoinPrimary?.(); }}
                  className="flex-1 h-8 text-xs bg-gold text-background hover:bg-gold/90"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Primary
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onJoinSecondary?.(); }}
                  className="flex-1 h-8 text-xs border-border text-muted-foreground hover:bg-surface-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Join
                </Button>
              </>
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
  const { 
    primaryCrew, 
    secondaryCrews, 
    canJoinSecondary, 
    canChangePrimary,
    cooldownDaysRemaining,
    leavePrimary,
    leaveSecondary,
    promoteTorimary,
    refresh: refreshMemberships 
  } = useCrewMembership(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "my-crews">("discover");
  const [activeCategory, setActiveCategory] = useState<"all" | "featured" | "top">("all");

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
  
  // Don't filter out user's crews - they should still appear in discovery/featured/top
  const filteredCrews = crews.filter((crew) => {
    if (!searchQuery) return true;
    return crew.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCategoryCrews = () => {
    switch (activeCategory) {
      case "featured":
        return filteredCrews.filter(c => c.is_featured);
      case "top":
        return [...filteredCrews].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 12);
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
        if (error.code === "23505") toast.error("Request already pending.");
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

  const categories = [
    { id: "all" as const, label: "All" },
    { id: "featured" as const, label: "Featured" },
    { id: "top" as const, label: "Top" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-surface-0/95 backdrop-blur-md border-b border-border/50">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-4 opacity-70" />
              <span className="text-sm font-medium text-muted-foreground">/crews</span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/crews/create")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create
            </Button>
          </div>
          
          {/* Category Tabs + Search */}
          <div className="px-4 pb-3 flex items-center gap-4">
            <div className="flex items-center gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                    activeCategory === cat.id
                      ? "text-white border-gold"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1" />
            
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-1 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="px-4 pt-6 pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-white leading-none mb-2">
              FIND YOUR CREW
            </h1>
            <p className="text-sm text-muted-foreground">
              Compete together. Climb together.
            </p>
          </motion.div>
        </div>

        {/* Tab Switch */}
        <div className="px-4 mb-5">
          <div className="inline-flex gap-1 p-1 bg-surface-1 rounded-lg">
            {[
              { id: "discover" as const, label: "Discover", icon: Target },
              { id: "my-crews" as const, label: "My Crews", icon: Layers, count: (primaryCrew ? 1 : 0) + secondaryCrews.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4">
          {/* My Crews Tab */}
          {activeTab === "my-crews" && (
            <AnimatePresence mode="wait">
              <motion.div key="my-crews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Primary Crew */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Crown className="w-4 h-4 text-gold" />
                      Primary Crew
                    </h2>
                    {!canChangePrimary && cooldownDaysRemaining > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cooldownDaysRemaining}d until change
                      </span>
                    )}
                  </div>
                  
                  {primaryCrew && getPrimaryCrewDetails() ? (
                    <div className="relative">
                      <div
                        onClick={() => navigate(`/crews/${primaryCrew.crew_id}`)}
                        className="relative overflow-hidden rounded-lg border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-surface-1 to-surface-1 cursor-pointer group p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                            {getPrimaryCrewDetails()?.avatar_url ? (
                              <img src={getPrimaryCrewDetails()?.avatar_url!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-gold">
                                {emblemIcons[getPrimaryCrewDetails()?.emblem || "shield"]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gold truncate">{getPrimaryCrewDetails()?.name}</h3>
                              <Crown className="w-4 h-4 text-gold shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                              {getPrimaryCrewDetails()?.description || "Your primary crew"}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span>{getPrimaryCrewDetails()?.member_count} members</span>
                              <span className="text-gold">{(getPrimaryCrewDetails()?.total_xp || 0).toLocaleString()} XP</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gold/50 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/crews/${primaryCrew.crew_id}/settings`)}
                          className="text-xs h-8 border-border"
                        >
                          <Settings className="w-3 h-3 mr-1.5" />
                          Settings
                        </Button>
                        
                        {primaryCrew.role !== "owner" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/10">
                                <LogOut className="w-3 h-3 mr-1.5" />
                                Leave
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-surface-1 border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Leave Primary Crew?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You'll no longer represent {getPrimaryCrewDetails()?.name} in tournaments. You can join another crew as primary.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-surface-2 border-border">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => leavePrimary()}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Leave Crew
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      className="p-6 rounded-xl bg-surface-1/50 border border-dashed border-gold/30 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-3">
                        <Flag className="w-6 h-6 text-gold/60" />
                      </div>
                      <p className="text-sm font-medium mb-1">No Primary Crew</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Your primary crew represents you in tournaments
                      </p>
                      <Button size="sm" onClick={() => setActiveTab("discover")} className="bg-gold text-background hover:bg-gold/90">
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        Find a Crew
                      </Button>
                    </motion.div>
                  )}
                </section>

                {/* Secondary Crews */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Secondary Crews
                    </h2>
                    <span className="text-[10px] text-muted-foreground">{secondaryCrews.length}/3</span>
                  </div>
                  
                  {getSecondaryCrewDetails().length > 0 ? (
                    <div className="space-y-2">
                      {getSecondaryCrewDetails().map((crew, i) => (
                        <motion.div
                          key={crew.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 rounded-xl border border-border/50 bg-surface-1/40 flex items-center gap-3"
                        >
                          <div
                            onClick={() => navigate(`/crews/${crew.id}`)}
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-0 border border-border flex items-center justify-center shrink-0">
                              {crew.avatar_url ? (
                                <img src={crew.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-muted-foreground scale-75">
                                  {emblemIcons[crew.emblem] || <Shield className="w-5 h-5" />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium truncate">{crew.name}</h3>
                              <p className="text-[10px] text-muted-foreground">
                                {crew.member_count} members
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Promote to Primary */}
                            {canChangePrimary && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => promoteTorimary(crew.id)}
                                className="h-7 px-2 text-[10px] text-gold hover:text-gold hover:bg-gold/10"
                                title="Make Primary"
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {/* Leave */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <LogOut className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-surface-1 border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Leave {crew.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    You'll no longer be affiliated with this crew.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-surface-2 border-border">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => leaveSecondary(crew.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Leave
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-surface-1/30 border border-dashed border-border text-center">
                      <p className="text-xs text-muted-foreground">
                        Join crews for practice and social connections
                      </p>
                    </div>
                  )}

                  {/* Cooldown Notice */}
                  {!canChangePrimary && cooldownDaysRemaining > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-200 font-medium">Primary Crew Cooldown</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          You can change your primary crew in {cooldownDaysRemaining} days
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <AnimatePresence mode="wait">
              <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Featured */}
                {(activeCategory === "all" || activeCategory === "featured") && featuredCrews.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Featured
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {featuredCrews.slice(0, 4).map((crew, i) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          index={i}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          showActions={!!user && !myCrewIds.includes(crew.id)}
                          onJoinPrimary={() => handleJoinCrew(crew, true)}
                          onJoinSecondary={() => handleJoinCrew(crew, false)}
                          canJoinPrimary={!primaryCrew}
                          canJoinSecondary={canJoinSecondary}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* All Crews */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      {activeCategory === "all" ? "All Crews" : activeCategory === "top" ? "Top Crews" : "Featured"}
                    </h2>
                    <span className="text-[10px] text-muted-foreground">
                      {getCategoryCrews().length} crews
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <motion.div 
                        className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : getCategoryCrews().length === 0 ? (
                    <div className="text-center py-16">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No crews found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getCategoryCrews().map((crew, index) => (
                        <CrewCard
                          key={crew.id}
                          crew={crew}
                          index={index}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          showActions={!!user && !myCrewIds.includes(crew.id)}
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
