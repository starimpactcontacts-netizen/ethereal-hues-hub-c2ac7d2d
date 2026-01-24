import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Star, Zap, Award, ChevronRight, Trophy, Hash, MessageCircle, Target, Flag, Layers, Flame, TrendingUp, Sparkles, ArrowRight, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import PageTransition from "@/components/loopgate/PageTransition";
import StudiosTeaser from "@/components/loopgate/StudiosTeaser";
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
  owner_id: string;
  total_xp?: number;
  discord_url?: string | null;
  is_featured?: boolean;
}

const leagueColors = {
  open: "border-muted-foreground/30 text-muted-foreground",
  pro: "border-blue-500/50 text-blue-400",
  elite: "border-gold/50 text-gold",
};

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
};

// Animated stat counter
const StatCounter = ({ value, label, icon: Icon, color = "text-foreground" }: { value: number; label: string; icon: any; color?: string }) => (
  <div className="text-center">
    <div className={`text-2xl font-display font-bold ${color}`}>{value.toLocaleString()}</div>
    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
      <Icon className="w-3 h-3" />
      {label}
    </div>
  </div>
);

export default function CrewsPage() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { primaryCrew, secondaryCrews, canJoinSecondary, loading: membershipLoading, refresh: refreshMemberships } = useCrewMembership(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [ownedCrewsCount, setOwnedCrewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "my-crews">("discover");

  // Switch to My Crews tab if user has a crew
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

    // Calculate total XP for each crew
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

    if (user) {
      const ownedCount = allCrews?.filter((c) => c.owner_id === user.id).length || 0;
      setOwnedCrewsCount(ownedCount);
    }

    setLoading(false);
  };

  // Filter out crews user is already in
  const myCrewIds = [primaryCrew?.crew_id, ...secondaryCrews.map(s => s.crew_id)].filter(Boolean);
  
  const filteredCrews = crews.filter((crew) => {
    if (myCrewIds.includes(crew.id)) return false;
    if (!searchQuery) return true;
    return crew.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleJoinCrew = async (crew: Crew, asPrimary: boolean) => {
    if (!user) return;

    // Check if user can join secondary
    if (!asPrimary && !canJoinSecondary) {
      toast.error("You can only have 3 secondary crews. Leave one first.");
      return;
    }

    // Check if user already has primary and trying to join as primary
    if (asPrimary && primaryCrew) {
      toast.error("You already have a primary crew. Change it from your crew settings.");
      return;
    }

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
        is_primary: asPrimary,
      });

      if (error) {
        console.error("Error joining crew:", error);
        toast.error("Failed to join crew");
      } else {
        // If joining as primary, update profile.crew_id
        if (asPrimary) {
          await supabase.from("profiles").update({ crew_id: crew.id }).eq("id", user.id);
        }
        
        // Award XP for joining
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_amount: asPrimary ? 25 : 10,
          p_action: asPrimary ? 'primary_crew_join' : 'secondary_crew_join',
          p_description: `Joined ${crew.name} as ${asPrimary ? 'primary' : 'secondary'}`,
        });
        toast.success(asPrimary ? `🏴 ${crew.name} is now your primary crew!` : `Joined ${crew.name} as secondary!`);
        fetchCrews();
        refreshMemberships();
      }
    }
  };

  // Sort crews by total XP for rankings
  const rankedCrews = [...crews].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
  const featuredCrews = crews.filter(c => c.is_featured);
  const topThreeCrews = rankedCrews.slice(0, 3);

  // Get crew details for memberships
  const getPrimaryCrewDetails = () => crews.find(c => c.id === primaryCrew?.crew_id);
  const getSecondaryCrewDetails = () => secondaryCrews.map(s => crews.find(c => c.id === s.crew_id)).filter(Boolean) as Crew[];

  // Stats for hero
  const totalCrews = crews.length;
  const totalMembers = crews.reduce((sum, c) => sum + c.member_count, 0);
  const totalXP = crews.reduce((sum, c) => sum + (c.total_xp || 0), 0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* EPIC Hero Section */}
        <div className="relative overflow-hidden">
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-purple-900/20 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.15),transparent_40%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 blur-[150px] rounded-full" />
          
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
          
          {/* Floating orbs */}
          <motion.div 
            className="absolute top-20 left-8 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl"
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-4 w-32 h-32 rounded-full bg-pink-500/15 blur-3xl"
            animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          {/* Top bar accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          <header className="relative z-10 px-4 pt-5 pb-6">
            <div className="flex items-center justify-between mb-6">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-5 opacity-80" />
              <Button
                size="sm"
                onClick={() => navigate("/crews/create")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg shadow-purple-900/30"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Crew
              </Button>
            </div>
            
            {/* Epic Hero Title */}
            <motion.div 
              className="text-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-medium">Squad Up. Dominate. Rise.</span>
              </motion.div>
              
              <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-purple-300 mb-3 leading-tight">
                CREWS
              </h1>
              
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your crew is your identity. Compete in tournaments, climb the leaderboard, and build your legacy together.
              </p>
            </motion.div>

            {/* Live Stats Row */}
            <motion.div 
              className="mt-6 p-4 rounded-2xl bg-surface-1/60 backdrop-blur-sm border border-purple-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <StatCounter value={totalCrews} label="Crews" icon={Shield} color="text-purple-400" />
                <div className="w-px h-8 bg-border" />
                <StatCounter value={totalMembers} label="Members" icon={Users} color="text-pink-400" />
                <div className="w-px h-8 bg-border" />
                <StatCounter value={totalXP} label="Total XP" icon={Zap} color="text-gold" />
              </div>
            </motion.div>
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
                className="w-full bg-surface-1/80 backdrop-blur-sm border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="relative z-10 px-4 pb-6">
            <div className="flex gap-1 p-1.5 bg-surface-1/60 backdrop-blur-sm rounded-xl border border-border/50">
              {[
                { id: "discover" as const, label: "Discover", icon: Target },
                { id: "my-crews" as const, label: "My Crews", icon: Layers },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">
          {/* My Crews Tab */}
          {activeTab === "my-crews" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="my-crews"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Primary Crew Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-gold" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Primary Crew</h2>
                    <span className="text-[10px] text-muted-foreground ml-auto">Your identity</span>
                  </div>
                  
                  {primaryCrew && getPrimaryCrewDetails() ? (
                    <motion.div
                      onClick={() => navigate(`/crews/${primaryCrew.crew_id}`)}
                      className="relative overflow-hidden rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/15 via-surface-1 to-surface-1 cursor-pointer group"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {/* Animated glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Crown indicator */}
                      <div className="absolute top-3 right-3 z-10">
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center"
                          animate={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="w-5 h-5 text-gold" />
                        </motion.div>
                      </div>
                      
                      {/* Banner */}
                      <div className="h-20 bg-gradient-to-r from-gold/25 via-amber-500/15 to-gold/25" />
                      
                      {/* Avatar overlapping */}
                      <div className="absolute top-10 left-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-background bg-gold/10 flex items-center justify-center text-gold shadow-xl shadow-gold/20">
                          {getPrimaryCrewDetails()?.avatar_url ? (
                            <img src={getPrimaryCrewDetails()?.avatar_url!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            emblemIcons[getPrimaryCrewDetails()?.emblem || "shield"] || <Shield className="w-10 h-10" />
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-8 pb-5 px-4 pl-28">
                        <h3 className="font-display text-xl font-bold text-gold">{getPrimaryCrewDetails()?.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                          {getPrimaryCrewDetails()?.description || "Your primary crew"}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {getPrimaryCrewDetails()?.member_count} members
                          </span>
                          <span className="flex items-center gap-1 text-gold font-semibold">
                            <Zap className="w-3 h-3" />
                            {(getPrimaryCrewDetails()?.total_xp || 0).toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                      
                      {/* CTA Arrow */}
                      <div className="absolute right-4 bottom-5">
                        <ArrowRight className="w-5 h-5 text-gold/50 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="p-8 rounded-2xl border-2 border-dashed border-purple-500/30 bg-purple-500/5 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <Flag className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-base font-semibold text-foreground mb-1">No Primary Crew</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Join a crew as your primary to represent them in tournaments
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("discover")}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Find a Crew
                      </Button>
                    </motion.div>
                  )}
                </section>

                {/* Secondary Crews Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Secondary Crews</h2>
                    <span className="text-[10px] text-purple-400 ml-auto">{secondaryCrews.length}/3</span>
                  </div>
                  
                  {getSecondaryCrewDetails().length > 0 ? (
                    <div className="space-y-2">
                      {getSecondaryCrewDetails().map((crew, i) => (
                        <motion.div
                          key={crew.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          className="p-4 rounded-xl border border-border/50 bg-surface-1/40 flex items-center gap-4 cursor-pointer hover:bg-surface-1 hover:border-purple-500/30 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-0 border border-border flex items-center justify-center shrink-0">
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-muted-foreground scale-90">
                                {emblemIcons[crew.emblem] || <Shield className="w-5 h-5" />}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate">{crew.name}</h3>
                            <p className="text-[10px] text-muted-foreground">
                              {crew.member_count} members • {(crew.total_xp || 0).toLocaleString()} XP
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-dashed border-border bg-surface-1/20 text-center">
                      <p className="text-xs text-muted-foreground">
                        No secondary crews yet. Join more crews for practice and social connections.
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
                className="space-y-8"
              >
                {/* Featured Crews - Horizontal Scroll */}
                {featuredCrews.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-gold" />
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Featured Crews</h2>
                    </div>
                    <div className="-mx-4 px-4">
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {featuredCrews.map((crew, i) => (
                          <motion.div
                            key={crew.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => navigate(`/crews/${crew.id}`)}
                            className="relative overflow-hidden min-w-[280px] p-5 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 via-surface-1 to-surface-1 cursor-pointer hover:border-gold/50 transition-all group"
                          >
                            {/* Star badge */}
                            <div className="absolute top-3 right-3">
                              <Star className="w-5 h-5 text-gold fill-gold" />
                            </div>
                            
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                                {crew.avatar_url ? (
                                  <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-gold">{emblemIcons[crew.emblem]}</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <h3 className="font-semibold text-base truncate mb-1">{crew.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{crew.description || "Featured crew"}</p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-gold font-medium">{crew.member_count} members</span>
                                  <span className="text-purple-400">{(crew.total_xp || 0).toLocaleString()} XP</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Top 3 Crews - Podium Style */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-gold" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Top Crews
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {topThreeCrews.map((crew, index) => (
                      <motion.div
                        key={crew.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(`/crews/${crew.id}`)}
                        className={`relative overflow-hidden p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] group ${
                          index === 0
                            ? "bg-gradient-to-r from-gold/20 via-amber-500/10 to-transparent border-gold/40 shadow-lg shadow-gold/10"
                            : index === 1
                            ? "bg-gradient-to-r from-slate-400/15 via-slate-400/5 to-transparent border-slate-400/30"
                            : "bg-gradient-to-r from-amber-600/15 via-amber-600/5 to-transparent border-amber-600/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl font-bold shadow-lg ${
                            index === 0 ? "bg-gradient-to-br from-gold to-amber-600 text-background shadow-gold/30" :
                            index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-background shadow-slate-400/20" :
                            "bg-gradient-to-br from-amber-500 to-amber-700 text-background shadow-amber-600/20"
                          }`}>
                            {index + 1}
                          </div>
                          
                          {/* Avatar */}
                          <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${
                            index === 0 ? "border-gold/30 bg-gold/10" :
                            index === 1 ? "border-slate-400/30 bg-slate-400/10" :
                            "border-amber-600/30 bg-amber-600/10"
                          }`}>
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={index === 0 ? "text-gold" : index === 1 ? "text-slate-400" : "text-amber-600"}>
                                {emblemIcons[crew.emblem]}
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold truncate ${index === 0 ? "text-gold" : ""}`}>{crew.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {crew.member_count} members
                            </p>
                          </div>
                          
                          {/* XP */}
                          <div className="text-right">
                            <p className={`font-display text-2xl font-bold ${
                              index === 0 ? "text-gold" :
                              index === 1 ? "text-slate-300" :
                              "text-amber-500"
                            }`}>
                              {(crew.total_xp || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</p>
                          </div>
                        </div>
                        
                        {/* Shimmer effect for #1 */}
                        {index === 0 && (
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Studios Coming Soon */}
                <StudiosTeaser variant="compact" />

                {/* All Crews */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      All Crews
                    </h2>
                    <span className="text-[10px] text-muted-foreground ml-auto">{filteredCrews.length} available</span>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <motion.div 
                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="text-sm text-muted-foreground mt-3">Loading crews...</p>
                    </div>
                  ) : filteredCrews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-surface-1 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No crews found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCrews.map((crew, index) => (
                        <motion.div
                          key={crew.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-4 bg-surface-1/60 border border-border/50 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface-1 hover:border-purple-500/30 transition-all group"
                          onClick={() => navigate(`/crews/${crew.id}`)}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-0 border border-border flex items-center justify-center shrink-0 group-hover:border-purple-500/30 transition-colors">
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-muted-foreground group-hover:text-purple-400 transition-colors">
                                {emblemIcons[crew.emblem] || <Shield className="w-6 h-6" />}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate mb-0.5 group-hover:text-purple-300 transition-colors">{crew.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                              {crew.description || "No description"}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {crew.member_count}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${
                                leagueColors[crew.min_league]
                              }`}>
                                {crew.min_league}+
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-purple-400">{(crew.total_xp || 0).toLocaleString()}</p>
                              <p className="text-[9px] text-muted-foreground">XP</p>
                            </div>
                            {user && !myCrewIds.includes(crew.id) && (
                              <div className="flex gap-1.5">
                                {!primaryCrew && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJoinCrew(crew, true);
                                    }}
                                    className="text-[10px] h-7 px-2.5 bg-gradient-to-r from-gold to-amber-600 text-background hover:from-gold/90 hover:to-amber-600/90 shadow-sm"
                                  >
                                    <Crown className="w-3 h-3 mr-1" />
                                    Primary
                                  </Button>
                                )}
                                {canJoinSecondary && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleJoinCrew(crew, false);
                                    }}
                                    className="text-[10px] h-7 px-2.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Join
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
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
