import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Shield, Crown, Star, Zap, Award, ChevronRight, Trophy, Hash, MessageCircle, Calendar, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

export default function CrewsPage() {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [crews, setCrews] = useState<Crew[]>([]);
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [ownedCrewsCount, setOwnedCrewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "my-crew">("discover");

  // Switch to My Crew tab if user has a crew
  useEffect(() => {
    if (profile?.crew_id) {
      setActiveTab("my-crew");
    }
  }, [profile?.crew_id]);

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

    if (profile?.crew_id) {
      const userCrew = crewsWithXP.find((c) => c.id === profile.crew_id);
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
        // Award XP for joining
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_amount: 15,
          p_action: 'crew_join',
          p_description: `Joined ${crew.name}`,
        });
        toast.success("Welcome to the crew!");
        fetchCrews();
      }
    }
  };

  // Sort crews by total XP for rankings
  const rankedCrews = [...crews].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Discord-inspired Header */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_60%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full" />
          
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          
          <header className="relative z-10 px-4 pt-5 pb-6">
            <div className="flex items-center justify-between mb-5">
              <img src={loopgateLogo} alt="LOOPGATE" className="h-5 opacity-80" />
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => navigate("/crews/create")}
                  className="bg-purple-600 text-white hover:bg-purple-700 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              )}
            </div>
            
            {/* Hero Title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] text-purple-400 uppercase tracking-[0.4em] font-medium">Community</span>
              </div>
              <h1 className="font-display text-4xl tracking-wider text-white mb-1">CREWS</h1>
              <p className="text-xs text-muted-foreground">
                Join a crew, compete together, climb the ranks
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
                className="w-full bg-surface-1/60 backdrop-blur-sm border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="relative z-10 px-4 pb-4">
            <div className="flex gap-1 p-1 bg-surface-1/50 rounded-lg">
              {[
                { id: "discover" as const, label: "Discover", icon: Target },
                { id: "my-crew" as const, label: "My Crew", icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
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
          {/* My Crew Tab */}
          {activeTab === "my-crew" && (
            <AnimatePresence mode="wait">
              {myCrew ? (
                <motion.div
                  key="my-crew"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Discord-style server card */}
                  <div
                    onClick={() => navigate(`/crews/${myCrew.id}`)}
                    className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-surface-1 to-surface-1 cursor-pointer group"
                  >
                    {/* Banner */}
                    <div className="h-20 bg-gradient-to-r from-purple-600/30 via-purple-500/20 to-purple-600/30" />
                    
                    {/* Avatar overlapping */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-background bg-purple-600/20 flex items-center justify-center text-purple-400 shadow-xl">
                        {myCrew.avatar_url ? (
                          <img src={myCrew.avatar_url} alt={myCrew.name} className="w-full h-full object-cover" />
                        ) : (
                          emblemIcons[myCrew.emblem] || <Shield className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-10 pb-5 px-5 text-center">
                      <h3 className="font-display text-xl font-bold mb-1">{myCrew.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {myCrew.description || "Your crew"}
                      </p>
                      
                      {/* Discord-style channel previews */}
                      <div className="flex flex-col gap-1 mb-4">
                        {[
                          { icon: Hash, label: "announcements" },
                          { icon: MessageCircle, label: "general" },
                          { icon: Trophy, label: "leaderboard" },
                        ].map((channel) => (
                          <div key={channel.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-0/50 text-left">
                            <channel.icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{channel.label}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {myCrew.member_count} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-400" />
                          {(myCrew.total_xp || 0).toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-crew"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg mb-2">No Crew Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join a crew to compete together
                  </p>
                  <Button
                    onClick={() => setActiveTab("discover")}
                    variant="outline"
                    className="border-purple-500/30 text-purple-400"
                  >
                    Browse Crews
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Discover Tab */}
          {activeTab === "discover" && (
            <AnimatePresence mode="wait">
              <motion.div
                key="discover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Featured Crews */}
                {crews.filter(c => c.is_featured).length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Featured</h2>
                    </div>
                    <div className="grid gap-3">
                      {crews.filter(c => c.is_featured).map((crew) => (
                        <div
                          key={crew.id}
                          onClick={() => navigate(`/crews/${crew.id}`)}
                          className="relative overflow-hidden p-4 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-surface-1 to-surface-1 cursor-pointer hover:border-gold/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center">
                              {crew.avatar_url ? (
                                <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-gold">{emblemIcons[crew.emblem]}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{crew.name}</h3>
                                <Star className="w-3 h-3 text-gold fill-gold" />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{crew.description || "Featured crew"}</p>
                              <p className="text-xs text-gold mt-1">{crew.member_count} members • {(crew.total_xp || 0).toLocaleString()} XP</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gold/50" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Studios Coming Soon */}
                <StudiosTeaser variant="compact" />

                {/* Top Crews */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-gold" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Top Crews
                    </h2>
                  </div>
                  
                  <div className="space-y-2">
                    {rankedCrews.slice(0, 3).map((crew, index) => (
                      <motion.div
                        key={crew.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/crews/${crew.id}`)}
                        className={`relative overflow-hidden p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                          index === 0
                            ? "bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border-gold/30"
                            : index === 1
                            ? "bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent border-slate-400/20"
                            : "bg-gradient-to-r from-amber-600/10 via-amber-600/5 to-transparent border-amber-600/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            index === 0 ? "bg-gold text-background" :
                            index === 1 ? "bg-slate-400 text-background" :
                            "bg-amber-600 text-background"
                          }`}>
                            {index + 1}
                          </div>
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-1 border border-border flex items-center justify-center">
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-muted-foreground">
                                {emblemIcons[crew.emblem]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{crew.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {crew.member_count} members
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-purple-400">
                              {(crew.total_xp || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">XP</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* All Crews */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      All Crews
                    </h2>
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredCrews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No crews found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCrews.map((crew, index) => (
                        <motion.div
                          key={crew.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-4 bg-surface-1/60 border border-border/50 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-surface-1 hover:border-purple-500/30 transition-all group"
                          onClick={() => navigate(`/crews/${crew.id}`)}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-0 border border-border flex items-center justify-center shrink-0">
                            {crew.avatar_url ? (
                              <img src={crew.avatar_url} alt={crew.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-muted-foreground">
                                {emblemIcons[crew.emblem] || <Shield className="w-6 h-6" />}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate mb-0.5">{crew.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {crew.description || "No description"}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {crew.member_count} members
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
                            {!myCrew && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinCrew(crew);
                                }}
                                className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
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
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
