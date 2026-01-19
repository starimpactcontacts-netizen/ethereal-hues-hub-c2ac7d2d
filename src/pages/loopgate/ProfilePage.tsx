import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ExternalLink, Calendar, Camera, ShieldCheck, Pencil, Plus, Save, Clock, Check, X, Users, Zap, Trash2, AlertTriangle, ShoppingBag, Coins, ArrowRight, Send, Palette, Wrench, Grid3X3, Settings, ChevronRight, Share2, Star, Award, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useXP } from "@/hooks/useXP";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { motion, AnimatePresence } from "framer-motion";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import CrewBadge from "@/components/loopgate/CrewBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
import XPHistory from "@/components/loopgate/XPHistory";
import PasswordSetupBanner from "@/components/loopgate/PasswordSetupBanner";
import EmailSecurityBanner from "@/components/loopgate/EmailSecurityBanner";
import SubmissionGrid from "@/components/loopgate/SubmissionGrid";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import ArchetypeSelector from "@/components/loopgate/ArchetypeSelector";
import SoftwareSelector from "@/components/loopgate/SoftwareSelector";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
import InviteFriendsModal from "@/components/loopgate/InviteFriendsModal";
import RequestReviewModal from "@/components/loopgate/RequestReviewModal";
import ReviewResultCard from "@/components/loopgate/ReviewResultCard";
import { getRankFromScore } from "@/data/gqtConfig";
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
import { Button } from "@/components/ui/button";

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

interface EditingPlatform {
  id: string;
  platform: string;
  platform_username: string;
  platform_url: string;
  follower_count: number;
}

type ProfileTab = "submissions" | "settings";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, platforms, refreshProfile, signOut, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { xp, level, streak } = useXP();
  const { submissions } = useUserSubmissions();
  const { completedReviews, pendingReviews } = useReviewRequests();
  const [activeTab, setActiveTab] = useState<ProfileTab>("submissions");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState<number>(0);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [contactEdited, setContactEdited] = useState(false);
  const [userCrew, setUserCrew] = useState<{ id: string; name: string; emblem: string; avatar_url: string | null } | null>(null);
  const [userHouse, setUserHouse] = useState<{ id: string; name: string; symbol: string; primary_color: string; secondary_color: string } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteCooldown, setDeleteCooldown] = useState(0);
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);
  const [showSoftwareSelector, setShowSoftwareSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Keep session active
  useActiveSession();

  // Initialize contact fields from profile
  useEffect(() => {
    if (profile) {
      setBio((profile as any).bio || "");
      setEmail((profile as any).email || "");
      setDiscord((profile as any).discord || "");
      setPortfolioUrl((profile as any).portfolio_url || "");
      setDisplayName((profile as any).display_name || "");
      setUsername(profile.username || "");
      setContactEdited(false);
    }
  }, [profile]);

  // Fetch user's crew if they have one
  useEffect(() => {
    const fetchCrew = async () => {
      if (profile?.crew_id) {
        const { data } = await supabase
          .from("crews")
          .select("id, name, emblem, avatar_url")
          .eq("id", profile.crew_id)
          .single();
        setUserCrew(data);
      } else {
        setUserCrew(null);
      }
    };
    fetchCrew();
  }, [profile?.crew_id]);

  // Fetch user's house if they have one
  useEffect(() => {
    const fetchHouse = async () => {
      if ((profile as any)?.house_id) {
        const { data } = await supabase
          .from("houses")
          .select("id, name, symbol, primary_color, secondary_color")
          .eq("id", (profile as any).house_id)
          .single();
        setUserHouse(data);
      } else {
        setUserHouse(null);
      }
    };
    fetchHouse();
  }, [(profile as any)?.house_id]);

  // Check username change cooldown
  useEffect(() => {
    if (profile?.id) {
      supabase.rpc('days_until_username_change', { user_uuid: profile.id })
        .then(({ data }) => {
          setDaysUntilUsernameChange(data || 0);
        });
    }
  }, [profile?.id]);

  const leagueColors: Record<string, string> = {
    elite: "text-gold border-gold bg-gold/10",
    pro: "text-blue-400 border-blue-400 bg-blue-400/10",
    open: "text-muted-foreground border-muted-foreground bg-muted/10",
  };

  // Get platform for verification (prioritize TikTok, then others)
  const verifiablePlatform = platforms.find(p => p.platform === 'tiktok') 
    || platforms.find(p => p.platform === 'instagram')
    || platforms.find(p => p.platform === 'youtube');
  const canVerify = verifiablePlatform && !profile?.verification_status;

  // Guest mode - show sign in prompt
  if (isGuest) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Sign In Required</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You're browsing as a guest. Sign in to view and edit your profile.
          </p>
          <Button
            onClick={() => {
              clearGuest();
              navigate("/start");
            }}
            className="bg-gold text-black hover:bg-gold/90 font-semibold"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // TEMP PROFILE MODE - Show limited profile for username-only users
  if (isTemp && tempProfile && !profile) {
    const joinDate = new Date(tempProfile.createdAt);
    const formattedDate = `${String(joinDate.getMonth() + 1).padStart(2, '0')}/${String(joinDate.getDate()).padStart(2, '0')}/${joinDate.getFullYear()}`;
    
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.08),transparent_60%)] pointer-events-none" />
        
        <div className="relative pt-6 pb-4 px-4">
          {/* League badge */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 text-muted-foreground border-muted-foreground bg-muted/10">
              OPEN
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearTempProfile();
                navigate('/start');
              }}
              className="text-muted-foreground text-xs"
            >
              Sign Out
            </Button>
          </div>
          
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-border">
              {tempProfile.avatarUrl ? (
                <img
                  src={tempProfile.avatarUrl}
                  alt={tempProfile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="font-display text-3xl text-muted-foreground">
                    {tempProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Name */}
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl mb-1">{tempProfile.username}</h1>
            {tempProfile.region && (
              <p className="text-sm text-muted-foreground capitalize">{tempProfile.region}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {formattedDate}
            </p>
          </div>

          {/* Secure Account CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/30 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg text-gold mb-1">Secure Your Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an email to save your progress, compete in arenas, and unlock all features.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-gold text-black hover:bg-gold/90 font-semibold"
                >
                  Create Full Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-display text-muted-foreground">—</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rank</p>
            </div>
            <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-display text-muted-foreground">0</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</p>
            </div>
            <div className="bg-surface-1 border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-display text-muted-foreground">F</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Class</p>
            </div>
          </div>

          {/* Locked Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Unlock with Account</h3>
            {[
              { icon: "🏆", label: "Compete in Arenas", desc: "Enter ranked competitions" },
              { icon: "👥", label: "Join Crews", desc: "Team up with other editors" },
              { icon: "⚖️", label: "Get Judged", desc: "Request professional reviews" },
              { icon: "🛒", label: "Shop Access", desc: "Spend your earned index" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 p-3 bg-surface-1/50 border border-border/50 rounded-lg opacity-60"
              >
                <span className="text-xl">{feature.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const league = profile.league || 'open';
  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  const handleSaveContact = async () => {
    if (!profile?.id) return;
    setIsSavingContact(true);
    try {
      await supabase
        .from("profiles")
        .update({ 
          bio: bio.trim() || null,
          email: email.trim() || null,
          discord: discord.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          display_name: displayName.trim() || null,
        })
        .eq("id", profile.id);
      setContactEdited(false);
      refreshProfile();
      toast.success("Profile saved");
    } catch (error) {
      console.error("Failed to save contact:", error);
      toast.error("Failed to save");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!profile?.id || !username.trim()) return;
    
    const newUsername = username.trim().toLowerCase();
    if (newUsername === profile.username) {
      setIsEditingUsername(false);
      return;
    }

    // Check if username is available
    const { data: isAvailable } = await supabase.rpc('is_username_available', { 
      check_username: newUsername 
    });

    if (!isAvailable) {
      toast.error('Username is already taken');
      return;
    }

    setIsSavingUsername(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: newUsername,
          username_changed_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      toast.success('Username updated');
      setIsEditingUsername(false);
      setDaysUntilUsernameChange(14);
      refreshProfile();
    } catch (error) {
      console.error("Failed to save username:", error);
      toast.error('Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const formatJoinDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Password Setup Banner for magic-link users */}
      <PasswordSetupBanner />
      
      {/* Email Security Banner for username-only accounts */}
      <EmailSecurityBanner />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CINEMATIC HERO HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.08),transparent_60%)]" />
        
        {/* Content */}
        <div className="relative pt-6 pb-4 px-4">
          {/* Top row: League + Share + Settings */}
          <div className="flex items-center justify-between mb-6">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}>
              {league}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const profileUrl = `${window.location.origin}/editor/${profile.id}`;
                  navigator.clipboard.writeText(profileUrl);
                  toast.success("Profile link copied!");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 text-gold text-xs font-medium hover:bg-gold/20 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <ActivityStatusSelector
                userId={profile.id}
                currentStatus={(profile as any).activity_status || "online"}
                onStatusChange={refreshProfile}
              />
            </div>
          </div>
          
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gold group shadow-[0_0_20px_rgba(250,204,21,0.2)]"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="font-display text-3xl text-muted-foreground">
                    {profile.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
          
          {/* Name + Badges */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="font-display text-3xl">
                {(profile as any).display_name || profile.username}
              </h1>
              {level > 1 && <LevelBadge level={level} size="md" />}
              {profile.verification_status && <VerifiedBadge size="lg" />}
            </div>
            
            {(profile as any).display_name && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            
            {/* Bio */}
            {(profile as any).bio && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                {(profile as any).bio}
              </p>
            )}
          </div>
          
          {/* Stats Row with Class Badge */}
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Class Badge - Prominent with Tooltip */}
            {(() => {
              const bestGQT = (profile as any).best_gatekeeper_qoi;
              const hasTakenGQT = bestGQT && bestGQT > 0;
              const rankConfig = hasTakenGQT ? getRankFromScore(bestGQT) : null;
              const classLetter = rankConfig?.rank || (level >= 2 ? 'D' : 'F');
              
              const classColors: Record<string, { text: string; border: string; bg: string; glow?: string }> = {
                'S++': { text: 'text-gold', border: 'border-gold', bg: 'bg-gold/15', glow: 'shadow-[0_0_20px_rgba(212,175,55,0.4)]' },
                'S+': { text: 'text-gold', border: 'border-gold/80', bg: 'bg-gold/10', glow: 'shadow-[0_0_15px_rgba(212,175,55,0.3)]' },
                'S': { text: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400/10' },
                'A': { text: 'text-emerald-400', border: 'border-emerald-400', bg: 'bg-emerald-400/10' },
                'B': { text: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/10' },
                'C': { text: 'text-slate-300', border: 'border-slate-400/50', bg: 'bg-slate-400/10' },
                'D': { text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10' },
                'F': { text: hasTakenGQT ? 'text-red-500' : 'text-muted-foreground', border: hasTakenGQT ? 'border-red-500/50' : 'border-border', bg: hasTakenGQT ? 'bg-red-500/10' : 'bg-muted/10' },
              };
              
              const colors = classColors[classLetter] || classColors['F'];
              
              return (
                <div className="relative group">
                  <Link to="/arena" className="block">
                    <div className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.glow || ''} transition-all group-hover:scale-105`}>
                      <Award className={`w-3 h-3 ${colors.text} absolute top-1 right-1 opacity-50`} />
                      <p className={`font-display text-2xl ${colors.text}`}>{classLetter}</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Class</p>
                    </div>
                  </Link>
                  
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                    <div className="bg-surface-1 border border-border rounded-lg p-3 shadow-xl min-w-[180px]">
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-1 border-l border-t border-border rotate-45" />
                      
                      {hasTakenGQT ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">GQT Score</span>
                            <span className={`font-display text-lg ${colors.text}`}>{bestGQT}/100</span>
                          </div>
                          <div className="border-t border-border pt-2 mt-2">
                            <Link to="/arena" className="flex items-center justify-between text-xs text-gold hover:text-gold/80 transition-colors">
                              <span>Enter Arena</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            {level >= 2 ? 'Default D Class' : 'Unranked'}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mb-3">
                            Take the GQT to get your official Class rank
                          </p>
                          <div className="flex gap-2">
                            <Link to="/gqt" className="flex-1 text-center text-[10px] py-1.5 bg-gold/10 border border-gold/30 text-gold rounded hover:bg-gold/20 transition-colors">
                              Take GQT
                            </Link>
                            <Link to="/arena" className="flex-1 text-center text-[10px] py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/20 transition-colors">
                              Arena
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Stats */}
            <div className="text-center">
              <p className="font-display text-2xl">{submissions.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Edits</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-gold">#{userRank}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rank</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl">{Number(profile.global_index_score || 0).toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Index</p>
            </div>
          </div>
          
          {/* Archetype + Crew */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {(profile as any).archetype && (
              <ArchetypeBadge archetype={(profile as any).archetype} size="sm" />
            )}
            {userCrew && (
              <CrewBadge crew={userCrew} size="sm" />
            )}
          </div>
          
          {/* Premium Action Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Spendable Index Card */}
            <Link to="/shop" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-gold/5 to-transparent border border-gold/20 rounded-xl p-4 h-full hover:border-gold/40 transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-gold" />
                    </div>
                  </div>
                  <p className="font-display text-3xl text-gold leading-none">{(profile as any)?.spendable_index || 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Index Points</p>
                  <div className="flex items-center gap-1 text-gold/70 text-[10px] mt-3 group-hover:text-gold transition-colors">
                    <span>Shop</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* QOI Judges Card */}
            <Link to="/judges" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20 rounded-xl p-4 h-full hover:border-purple-500/40 transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <p className="font-display text-sm leading-tight">Get Rated</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">By QOI Judges</p>
                  <div className="flex items-center gap-1 text-purple-400/70 text-[10px] mt-3 group-hover:text-purple-400 transition-colors">
                    <span>View Judges</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === "submissions" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Edits</span>
            {activeTab === "submissions" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === "settings" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
            {activeTab === "settings" && (
              <motion.div
                layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
              />
            )}
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === "submissions" ? (
          <motion.div
            key="submissions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Completed Reviews Section */}
            {completedReviews.length > 0 && (
              <div className="px-4 pt-4">
                <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Star size={14} className="text-purple-400" />
                  Judge Reviews ({completedReviews.length})
                </h3>
                <div className="space-y-3">
                  {completedReviews.map((review) => (
                    <ReviewResultCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div className="px-4">
                <h3 className="font-display text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-orange-400" />
                  Pending Reviews ({pendingReviews.length})
                </h3>
                <div className="space-y-2">
                  {pendingReviews.map((review) => (
                    <div 
                      key={review.id}
                      className="bg-surface-1 border border-border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center">
                          <Clock size={14} className="text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Awaiting Review</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{review.platform}</p>
                        </div>
                      </div>
                      <a
                        href={review.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gold hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Submission Grid */}
            <SubmissionGrid />
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-6"
          >
            {/* ─── Editor Identity ─── */}
            <section>
              <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
                <Palette size={14} />
                Editor Identity
              </h3>
              <div className="bg-surface-1 border border-border p-4 space-y-4">
                {/* Archetype */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Archetype</label>
                    <button
                      onClick={() => setShowArchetypeSelector(true)}
                      className="text-[10px] text-gold uppercase tracking-wider hover:underline flex items-center gap-1"
                    >
                      <Pencil size={10} />
                      {(profile as any).archetype ? 'Change' : 'Set'}
                    </button>
                  </div>
                  {(profile as any).archetype ? (
                    <ArchetypeBadge archetype={(profile as any).archetype} size="md" animate={false} />
                  ) : (
                    <button
                      onClick={() => setShowArchetypeSelector(true)}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors"
                    >
                      + Select your archetype
                    </button>
                  )}
                </div>

                {/* Software */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench size={10} />
                      Software
                    </label>
                    <button
                      onClick={() => setShowSoftwareSelector(true)}
                      className="text-[10px] text-gold uppercase tracking-wider hover:underline flex items-center gap-1"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>
                  {(profile as any).software && (profile as any).software.length > 0 ? (
                    <SoftwareBadges software={(profile as any).software} size="md" animate={false} />
                  ) : (
                    <button
                      onClick={() => setShowSoftwareSelector(true)}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors"
                    >
                      + Add your software
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ─── Verification ─── */}
            <section>
              <div className={`border p-4 ${profile.verification_status ? 'bg-gold/10 border-gold' : 'bg-surface-1 border-border'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className={profile.verification_status ? 'text-gold' : 'text-muted-foreground'} />
                    <div>
                      <p className="text-sm font-medium">
                        {profile.verification_status ? 'VERIFIED' : 'UNVERIFIED'}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {profile.verification_status ? 'Account verified' : 'Verify to unlock features'}
                      </p>
                    </div>
                  </div>
                  {canVerify && (
                    <button
                      onClick={() => setShowVerificationModal(true)}
                      className="px-4 py-2 bg-gold text-black text-xs font-semibold uppercase tracking-wider"
                    >
                      Verify
                    </button>
                  )}
                  {!verifiablePlatform && !profile.verification_status && (
                    <span className="text-[10px] text-muted-foreground">Connect a platform first</span>
                  )}
                </div>
              </div>
            </section>

            {/* ─── Level & XP ─── */}
            <section>
              <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
                <Zap size={14} />
                Level & XP
              </h3>
              <div className="bg-surface-1 border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={level} size="lg" />
                    <div>
                      <p className="text-sm font-semibold">Level {level}</p>
                      <p className="text-[10px] text-muted-foreground">{xp.toLocaleString()} Total XP</p>
                    </div>
                  </div>
                  {streak && streak.current_streak > 0 && (
                    <div className="text-right">
                      <p className="text-gold font-semibold">🔥 {streak.current_streak} Day{streak.current_streak !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Login Streak</p>
                    </div>
                  )}
                </div>
                <XPProgressBar xp={xp} level={level} size="md" />
              </div>
            </section>

            {/* ─── XP Activity ─── */}
            <section>
              <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
                <Zap size={14} />
                XP Activity
              </h3>
              <XPHistory limit={5} />
            </section>

            {/* ─── Crew ─── */}
            <section>
              <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
                <Users size={14} />
                Crew
              </h3>
              <div className="bg-surface-1 border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Crew</span>
                  {userCrew ? (
                    <CrewBadge crew={userCrew} size="md" />
                  ) : (
                    <button
                      onClick={() => navigate("/crews")}
                      className="text-[10px] text-gold uppercase tracking-wider hover:underline"
                    >
                      Join a crew
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ─── Invite Friends ─── */}
            <section>
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/40 p-4 flex items-center justify-between hover:border-gold transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/20 border border-gold/50 flex items-center justify-center">
                    <Send className="w-5 h-5 text-gold" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gold">Invite Friends</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Earn XP for referrals</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gold" />
              </button>
            </section>

            {/* ─── Contact & Bio ─── */}
            <section>
              <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
                <Pencil size={14} />
                Profile Details
              </h3>
              <div className="bg-surface-1 border border-border p-4 space-y-4">
                {/* Username */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Username</label>
                  <div className="flex items-center gap-2">
                    {isEditingUsername ? (
                      <>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="flex-1 bg-background border border-gold px-2 py-1.5 text-sm outline-none"
                          maxLength={20}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveUsername}
                          disabled={isSavingUsername}
                          className="p-1.5 text-gold hover:bg-gold/10"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setUsername(profile.username || '');
                            setIsEditingUsername(false);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">@{profile.username}</span>
                        {daysUntilUsernameChange === 0 ? (
                          <button
                            onClick={() => setIsEditingUsername(true)}
                            className="p-1 text-muted-foreground hover:text-gold transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock size={10} />
                            {daysUntilUsernameChange}d
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setDisplayName(e.target.value);
                        setContactEdited(true);
                      }
                    }}
                    placeholder="Your public name"
                    className="w-full bg-background border border-border p-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-gold transition-colors"
                  />
                </div>

                {/* Bio */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Bio</label>
                    <span className="text-[10px] text-muted-foreground">{bio.length}/200</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setBio(e.target.value);
                        setContactEdited(true);
                      }
                    }}
                    placeholder="Video Editor | Open to commissions"
                    className="w-full bg-background border border-border p-2 text-sm resize-none outline-none placeholder:text-muted-foreground/50 focus:border-gold transition-colors"
                    rows={2}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setContactEdited(true);
                    }}
                    placeholder="work@example.com"
                    className="w-full bg-background border border-border p-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-gold transition-colors"
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Discord</label>
                  <input
                    type="text"
                    value={discord}
                    onChange={(e) => {
                      setDiscord(e.target.value);
                      setContactEdited(true);
                    }}
                    placeholder="username"
                    className="w-full bg-background border border-border p-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-gold transition-colors"
                  />
                </div>

                {/* Portfolio */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Portfolio (optional)</label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => {
                      setPortfolioUrl(e.target.value);
                      setContactEdited(true);
                    }}
                    placeholder="https://yourportfolio.com"
                    className="w-full bg-background border border-border p-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-gold transition-colors"
                  />
                </div>

                {contactEdited && (
                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      onClick={handleSaveContact}
                      disabled={isSavingContact}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gold text-black text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
                    >
                      <Save size={12} />
                      {isSavingContact ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Platforms ─── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
                  <ExternalLink size={14} />
                  Platforms
                </h3>
                {platforms.length < 3 && (
                  <button
                    onClick={() => setShowAddPlatform(true)}
                    className="flex items-center gap-1 text-[10px] text-gold uppercase tracking-wider hover:underline"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                )}
              </div>
              {platforms.length > 0 ? (
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setEditingPlatform({
                        id: platform.id,
                        platform: platform.platform,
                        platform_username: platform.platform_username,
                        platform_url: platform.platform_url,
                        follower_count: platform.follower_count,
                      })}
                      className="w-full bg-surface-1 border border-border p-3 flex items-center justify-between hover:border-gold transition-colors text-left group"
                    >
                      <div>
                        <p className="font-semibold text-sm">{platformLabels[platform.platform]}</p>
                        <p className="text-xs text-muted-foreground">@{platform.platform_username}</p>
                      </div>
                      <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPlatform(true)}
                  className="w-full border border-dashed border-border p-4 text-center text-sm text-muted-foreground hover:border-gold hover:text-gold transition-colors"
                >
                  + Add your first platform
                </button>
              )}
            </section>

            {/* ─── Danger Zone ─── */}
            <section className="mt-8">
              <div className="bg-destructive/5 border border-destructive/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-destructive mb-1">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <AlertDialog onOpenChange={(open) => {
                      if (!open) {
                        setDeleteStep(1);
                        setDeleteConfirmText("");
                        setDeleteCooldown(0);
                      }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-surface-0 border-border max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {deleteStep === 1 && "Are you sure?"}
                            {deleteStep === 2 && "This is permanent"}
                            {deleteStep === 3 && "Final confirmation"}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4" asChild>
                            <div>
                              {deleteStep === 1 && (
                                <>
                                  <p className="text-foreground font-medium">
                                    You're about to erase everything you've built.
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    Every edit you've submitted, every rank you've earned, every connection you've made - gone forever. 
                                    Your journey on LOOPGATE ends here.
                                  </p>
                                  <div className="bg-gold/10 border border-gold/30 p-3 mt-4">
                                    <p className="text-gold text-sm font-medium">
                                      💡 Feeling frustrated? Take a break instead.
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                      Your progress will be here when you come back.
                                    </p>
                                  </div>
                                </>
                              )}
                              {deleteStep === 2 && (
                                <>
                                  <p className="text-foreground font-medium">
                                    Your legacy will be completely erased:
                                  </p>
                                  <ul className="space-y-2 text-sm mt-3">
                                    <li className="flex items-start gap-2 text-muted-foreground">
                                      <span className="text-destructive">✕</span>
                                      <span><strong className="text-foreground">{submissions.length} submissions</strong> - Every edit you've poured hours into</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-muted-foreground">
                                      <span className="text-destructive">✕</span>
                                      <span><strong className="text-foreground">Level {level}</strong> - {xp.toLocaleString()} XP earned over time</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-muted-foreground">
                                      <span className="text-destructive">✕</span>
                                      <span><strong className="text-foreground">Global ranking</strong> - Your spot on the leaderboard</span>
                                    </li>
                                    {userCrew && (
                                      <li className="flex items-start gap-2 text-muted-foreground">
                                        <span className="text-destructive">✕</span>
                                        <span><strong className="text-foreground">{userCrew.name}</strong> - Your crew will lose a member</span>
                                      </li>
                                    )}
                                    {streak.current_streak > 0 && (
                                      <li className="flex items-start gap-2 text-muted-foreground">
                                        <span className="text-destructive">✕</span>
                                        <span><strong className="text-foreground">{streak.current_streak}-day streak</strong> - Dedication gone</span>
                                      </li>
                                    )}
                                  </ul>
                                  <p className="text-destructive text-sm font-semibold mt-4 pt-3 border-t border-border">
                                    This cannot be undone. Ever.
                                  </p>
                                </>
                              )}
                              {deleteStep === 3 && (
                                <>
                                  <p className="text-foreground font-medium">
                                    Type your username to confirm deletion:
                                  </p>
                                  <p className="text-muted-foreground text-sm mb-3">
                                    Type <span className="font-mono text-destructive font-bold">{profile?.username}</span> exactly to proceed.
                                  </p>
                                  <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => {
                                      setDeleteConfirmText(e.target.value);
                                      if (e.target.value === profile?.username && deleteCooldown === 0) {
                                        setDeleteCooldown(5);
                                        const interval = setInterval(() => {
                                          setDeleteCooldown(prev => {
                                            if (prev <= 1) {
                                              clearInterval(interval);
                                              return 0;
                                            }
                                            return prev - 1;
                                          });
                                        }, 1000);
                                      }
                                    }}
                                    placeholder={profile?.username}
                                    className="w-full px-3 py-2 bg-background border border-border text-sm outline-none focus:border-destructive font-mono"
                                  />
                                  {deleteConfirmText === profile?.username && deleteCooldown > 0 && (
                                    <p className="text-gold text-sm mt-2 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      Please wait {deleteCooldown}s before confirming...
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel 
                            onClick={() => {
                              setDeleteStep(1);
                              setDeleteConfirmText("");
                              setDeleteCooldown(0);
                            }}
                            className="border-border"
                          >
                            {deleteStep === 1 ? "Keep My Account" : "Go Back"}
                          </AlertDialogCancel>
                          {deleteStep < 3 ? (
                            <Button
                              variant="destructive"
                              onClick={() => setDeleteStep(prev => (prev + 1) as 1 | 2 | 3)}
                            >
                              {deleteStep === 1 ? "Yes, I want to delete" : "I understand, continue"}
                            </Button>
                          ) : (
                            <AlertDialogAction
                              disabled={deleteConfirmText !== profile?.username || isDeletingAccount || deleteCooldown > 0}
                              onClick={async (e) => {
                                e.preventDefault();
                                if (deleteConfirmText !== profile?.username || deleteCooldown > 0) return;
                                
                                setIsDeletingAccount(true);
                                try {
                                  const userId = profile.id;
                                  
                                  // Delete in order to respect foreign key constraints
                                  await supabase.from("xp_history").delete().eq("user_id", userId);
                                  await supabase.from("daily_xp_tracking").delete().eq("user_id", userId);
                                  await supabase.from("login_streaks").delete().eq("user_id", userId);
                                  await supabase.from("event_participations").delete().eq("user_id", userId);
                                  await supabase.from("round_participations").delete().eq("user_id", userId);
                                  await supabase.from("connected_platforms").delete().eq("user_id", userId);
                                  await supabase.from("crew_messages").delete().eq("user_id", userId);
                                  await supabase.from("crew_join_requests").delete().eq("user_id", userId);
                                  await supabase.from("crew_members").delete().eq("user_id", userId);
                                  await supabase.from("arena_messages").delete().eq("user_id", userId);
                                  await supabase.from("active_sessions").delete().eq("user_id", userId);
                                  await supabase.from("user_roles").delete().eq("user_id", userId);
                                  await supabase.from("profiles").delete().eq("id", userId);
                                  
                                  await signOut();
                                  toast.success("Account deleted");
                                  navigate("/");
                                } catch (error) {
                                  console.error("Failed to delete account:", error);
                                  toast.error("Failed to delete account. Please contact support.");
                                } finally {
                                  setIsDeletingAccount(false);
                                  setDeleteConfirmText("");
                                  setDeleteStep(1);
                                  setDeleteCooldown(0);
                                }
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeletingAccount ? "Deleting..." : deleteCooldown > 0 ? `Wait ${deleteCooldown}s` : "Delete Forever"}
                            </AlertDialogAction>
                          )}
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Verification Modal */}
      {verifiablePlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          platform={verifiablePlatform.platform as "tiktok" | "instagram" | "youtube"}
          platformUsername={verifiablePlatform.platform_username}
          existingCode={profile.verification_code}
          onVerified={refreshProfile}
        />
      )}

      {/* Edit Platform Modal */}
      {editingPlatform && (
        <EditPlatformModal
          isOpen={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
          onUpdated={refreshProfile}
        />
      )}

      {/* Add Platform Modal */}
      <AddPlatformModal
        isOpen={showAddPlatform}
        onClose={() => setShowAddPlatform(false)}
        userId={profile.id}
        existingPlatforms={platforms.map(p => p.platform)}
        onAdded={refreshProfile}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        userId={profile.id}
        currentAvatarUrl={profile.avatar_url}
        onUpdated={refreshProfile}
      />

      {/* Archetype Selector */}
      {showArchetypeSelector && (
        <ArchetypeSelector
          value={(profile as any).archetype || null}
          onChange={async (archetype) => {
            try {
              await supabase
                .from('profiles')
                .update({ archetype })
                .eq('id', profile.id);
              refreshProfile();
              toast.success('Archetype updated');
            } catch (error) {
              toast.error('Failed to update archetype');
            }
          }}
          onClose={() => setShowArchetypeSelector(false)}
          isOpen={showArchetypeSelector}
        />
      )}

      {/* Software Selector */}
      {showSoftwareSelector && (
        <SoftwareSelector
          value={(profile as any).software || []}
          onChange={async (software) => {
            try {
              await supabase
                .from('profiles')
                .update({ software })
                .eq('id', profile.id);
              refreshProfile();
              toast.success('Software updated');
            } catch (error) {
              toast.error('Failed to update software');
            }
          }}
          onClose={() => setShowSoftwareSelector(false)}
          isOpen={showSoftwareSelector}
        />
      )}

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      {/* Request Review Modal */}
      <RequestReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </div>
  );
}
