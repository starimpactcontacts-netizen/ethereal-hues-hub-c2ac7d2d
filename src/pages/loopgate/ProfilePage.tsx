import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ExternalLink, Camera, ShieldCheck, Pencil, Plus, Save, Clock, Check, X, Users, Zap, Trash2, AlertTriangle, Coins, ArrowRight, Send, Grid3X3, Settings, ChevronRight, Share2, Star, Award, Lock, Crown, Layers, Shield, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useXP } from "@/hooks/useXP";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { motion, AnimatePresence } from "framer-motion";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import LevelBadge from "@/components/loopgate/LevelBadge";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
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

type ProfileTab = "edits" | "settings";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, platforms, refreshProfile, signOut, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { xp, level, streak } = useXP();
  const { submissions } = useUserSubmissions();
  const { completedReviews, pendingReviews } = useReviewRequests();
  const { primaryCrew, secondaryCrews } = useCrewMembership(profile?.id);
  const [activeTab, setActiveTab] = useState<ProfileTab>("edits");
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [deleteCooldown, setDeleteCooldown] = useState(0);
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);
  const [showSoftwareSelector, setShowSoftwareSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  useActiveSession();

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

  useEffect(() => {
    if (profile?.id) {
      supabase.rpc('days_until_username_change', { user_uuid: profile.id })
        .then(({ data }) => {
          setDaysUntilUsernameChange(data || 0);
        });
    }
  }, [profile?.id]);

  const verifiablePlatform = platforms.find(p => p.platform === 'tiktok') 
    || platforms.find(p => p.platform === 'instagram')
    || platforms.find(p => p.platform === 'youtube');
  const canVerify = verifiablePlatform && !profile?.verification_status;

  // Guest mode
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

  // Temp profile mode
  if (isTemp && tempProfile && !profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-background to-background pointer-events-none" />
        <div className="relative pt-6 pb-4 px-4">
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
          
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
              {tempProfile.avatarUrl ? (
                <img src={tempProfile.avatarUrl} alt={tempProfile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="font-display text-2xl text-muted-foreground">
                    {tempProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl mb-1">{tempProfile.username}</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/30 rounded-xl p-5 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base text-gold mb-1">Secure Your Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an email to save your progress and unlock all features.
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
        </div>
      </div>
    );
  }

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

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_user_account' as any);
      if (error) throw error;
      
      await signOut();
      navigate('/start');
      toast.success('Account deleted');
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Get class info
  const bestGQT = (profile as any).best_gatekeeper_qoi;
  const hasTakenGQT = bestGQT && bestGQT > 0;
  const rankConfig = hasTakenGQT ? getRankFromScore(bestGQT) : null;
  const classLetter = rankConfig?.rank || (level >= 2 ? 'D' : 'F');
  
  const classColors: Record<string, string> = {
    'S++': 'text-gold bg-gold/15 border-gold',
    'S+': 'text-gold bg-gold/10 border-gold/60',
    'S': 'text-amber-400 bg-amber-400/10 border-amber-400/60',
    'A': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/60',
    'B': 'text-blue-400 bg-blue-400/10 border-blue-400/60',
    'C': 'text-slate-300 bg-slate-400/10 border-slate-400/40',
    'D': 'text-orange-400 bg-orange-500/10 border-orange-500/40',
    'F': 'text-muted-foreground bg-muted/10 border-border',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PasswordSetupBanner />
      <EmailSecurityBanner />

      {/* ═══ HERO SECTION ═══ */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        
        <div className="relative px-4 pt-4 pb-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => {
                const profileUrl = `${window.location.origin}/editor/${profile.id}`;
                navigator.clipboard.writeText(profileUrl);
                toast.success("Profile link copied!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 border border-border text-xs font-medium hover:border-gold/50 transition-colors rounded-lg"
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
          
          {/* Avatar + Identity */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold/60 group mb-4"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-1 flex items-center justify-center">
                  <span className="font-display text-3xl text-muted-foreground">
                    {profile.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-display text-2xl">
                  {(profile as any).display_name || profile.username}
                </h1>
                {profile.verification_status && <VerifiedBadge size="md" />}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-5 mb-4">
              <Link to="/gqt" className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${classColors[classLetter]}`}>
                <span className="font-display text-xl">{classLetter}</span>
                <span className="text-[8px] uppercase tracking-wider opacity-60">Class</span>
              </Link>
              <div className="text-center">
                <p className="font-display text-xl">{submissions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Edits</p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl text-gold">#{userRank}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Rank</p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl">{Number(profile.global_index_score || 0).toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Index</p>
              </div>
            </div>

            {/* Primary Crew */}
            {primaryCrew?.crew && (
              <Link to={`/crews/${primaryCrew.crew_id}`} className="w-full max-w-xs">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gold/5 border border-gold/20 hover:border-gold/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gold/10 flex items-center justify-center">
                    {primaryCrew.crew.avatar_url ? (
                      <img src={primaryCrew.crew.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-4 h-4 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3 h-3 text-gold" />
                      <span className="text-sm text-gold font-medium truncate">{primaryCrew.crew.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold/40" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ═══ XP BAR ═══ */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-gold" />
            LV {level}
          </span>
          <span>{xp} XP</span>
        </div>
        <XPProgressBar xp={xp} level={level} size="sm" />
      </div>

      {/* ═══ TAB NAV ═══ */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("edits")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === "edits" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Edits
            {activeTab === "edits" && (
              <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === "settings" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
            {activeTab === "settings" && (
              <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeTab === "edits" ? (
          <motion.div
            key="edits"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Completed Reviews */}
            {completedReviews.length > 0 && (
              <div className="px-4 pt-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star size={12} className="text-purple-400" />
                  Reviews ({completedReviews.length})
                </h3>
                <div className="space-y-2">
                  {completedReviews.map((review) => (
                    <ReviewResultCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div className="px-4">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={12} className="text-orange-400" />
                  Pending ({pendingReviews.length})
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
            className="p-4 space-y-5"
          >
            {/* ─── Identity ─── */}
            <section className="space-y-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Identity</h3>
              
              {/* Archetype */}
              <button
                onClick={() => setShowArchetypeSelector(true)}
                className="w-full bg-surface-1 border border-border rounded-xl p-3 flex items-center justify-between hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {(profile as any).archetype ? (
                    <ArchetypeBadge archetype={(profile as any).archetype} size="sm" animate={false} />
                  ) : (
                    <span className="text-sm text-muted-foreground">+ Set Archetype</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Software */}
              <button
                onClick={() => setShowSoftwareSelector(true)}
                className="w-full bg-surface-1 border border-border rounded-xl p-3 flex items-center justify-between hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {(profile as any).software && (profile as any).software.length > 0 ? (
                    <SoftwareBadges software={(profile as any).software} size="sm" animate={false} />
                  ) : (
                    <span className="text-sm text-muted-foreground">+ Add Software</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </section>

            {/* ─── Verification ─── */}
            <section className="space-y-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Verification</h3>
              <div className={`rounded-xl p-3 flex items-center justify-between ${
                profile.verification_status 
                  ? 'bg-gold/10 border border-gold/30' 
                  : 'bg-surface-1 border border-border'
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${profile.verification_status ? 'text-gold' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{profile.verification_status ? 'Verified' : 'Unverified'}</span>
                </div>
                {canVerify && (
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="px-3 py-1.5 bg-gold text-black text-xs font-semibold rounded-lg"
                  >
                    Verify
                  </button>
                )}
              </div>
            </section>

            {/* ─── Account ─── */}
            <section className="space-y-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Account</h3>
              <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-4">
                {/* Username */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Username</label>
                  <div className="flex items-center gap-2">
                    {isEditingUsername ? (
                      <>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="flex-1 bg-background border border-gold rounded-lg px-3 py-2 text-sm outline-none"
                          maxLength={20}
                          autoFocus
                        />
                        <button onClick={handleSaveUsername} disabled={isSavingUsername} className="p-2 text-gold hover:bg-gold/10 rounded-lg">
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setUsername(profile.username || '');
                            setIsEditingUsername(false);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">@{profile.username}</span>
                        {daysUntilUsernameChange === 0 ? (
                          <button onClick={() => setIsEditingUsername(true)} className="p-1.5 text-muted-foreground hover:text-gold transition-colors">
                            <Pencil size={14} />
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
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Display Name</label>
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Bio */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
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
                    placeholder="Short bio..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-gold transition-colors"
                    rows={2}
                  />
                </div>

                {contactEdited && (
                  <button
                    onClick={handleSaveContact}
                    disabled={isSavingContact}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gold text-black text-sm font-semibold rounded-lg disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSavingContact ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            </section>

            {/* ─── Platforms ─── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Platforms</h3>
                {platforms.length < 3 && (
                  <button onClick={() => setShowAddPlatform(true)} className="text-xs text-gold flex items-center gap-1">
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
                      className="w-full bg-surface-1 border border-border rounded-xl p-3 flex items-center justify-between hover:border-gold/30 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{platformLabels[platform.platform]}</p>
                        <p className="text-xs text-muted-foreground">@{platform.platform_username}</p>
                      </div>
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddPlatform(true)}
                  className="w-full border border-dashed border-border rounded-xl p-4 text-center text-sm text-muted-foreground hover:border-gold/30 transition-colors"
                >
                  + Add your first platform
                </button>
              )}
            </section>

            {/* ─── Quick Actions ─── */}
            <section className="space-y-2">
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full bg-gold/10 border border-gold/30 rounded-xl p-3 flex items-center justify-between hover:border-gold/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gold font-medium">Invite Friends</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gold/50" />
              </button>
              
              <Link to="/shop" className="block">
                <div className="bg-surface-1 border border-border rounded-xl p-3 flex items-center justify-between hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-gold" />
                    <div>
                      <span className="text-sm font-medium">{(profile as any)?.spendable_index || 0} Index Points</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            </section>

            {/* ─── Danger Zone ─── */}
            <section className="pt-4">
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-destructive mb-1">Delete Account</h3>
                    <p className="text-xs text-muted-foreground mb-3">This action cannot be undone.</p>
                    <AlertDialog onOpenChange={(open) => {
                      if (!open) {
                        setDeleteStep(1);
                        setDeleteConfirmText("");
                        setDeleteCooldown(0);
                      }
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-surface-0 border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            {deleteStep === 1 && "Are you sure?"}
                            {deleteStep === 2 && "This is permanent"}
                            {deleteStep === 3 && "Final confirmation"}
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-4">
                              {deleteStep === 1 && (
                                <p className="text-muted-foreground">
                                  All your data will be permanently deleted. This cannot be undone.
                                </p>
                              )}
                              {deleteStep === 2 && (
                                <div>
                                  <p className="text-foreground font-medium mb-2">Type DELETE to confirm:</p>
                                  <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                    placeholder="DELETE"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none"
                                  />
                                </div>
                              )}
                              {deleteStep === 3 && (
                                <p className="text-destructive font-medium">
                                  This is your last chance. Click confirm to permanently delete your account.
                                </p>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          {deleteStep === 1 && (
                            <Button variant="destructive" onClick={() => setDeleteStep(2)}>
                              Continue
                            </Button>
                          )}
                          {deleteStep === 2 && (
                            <Button 
                              variant="destructive" 
                              onClick={() => setDeleteStep(3)}
                              disabled={deleteConfirmText !== 'DELETE'}
                            >
                              Continue
                            </Button>
                          )}
                          {deleteStep === 3 && (
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteAccount}
                              disabled={isDeletingAccount}
                            >
                              {isDeletingAccount ? "Deleting..." : "Delete Forever"}
                            </Button>
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

      {/* ═══ MODALS ═══ */}
      {showVerificationModal && verifiablePlatform && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userId={profile.id}
          platform={verifiablePlatform.platform as "tiktok" | "instagram" | "youtube"}
          platformUsername={verifiablePlatform.platform_username}
          existingCode={(profile as any).verification_code}
          onVerified={() => {
            setShowVerificationModal(false);
            refreshProfile();
          }}
        />
      )}

      {editingPlatform && (
        <EditPlatformModal
          isOpen={!!editingPlatform}
          onClose={() => setEditingPlatform(null)}
          platform={editingPlatform}
          onUpdated={() => {
            setEditingPlatform(null);
            refreshProfile();
          }}
        />
      )}

      {showAddPlatform && (
        <AddPlatformModal
          isOpen={showAddPlatform}
          onClose={() => setShowAddPlatform(false)}
          userId={profile.id}
          existingPlatforms={platforms.map(p => p.platform)}
          onAdded={() => {
            setShowAddPlatform(false);
            refreshProfile();
          }}
        />
      )}

      {showAvatarModal && (
        <AvatarUploadModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          userId={profile.id}
          currentAvatarUrl={profile.avatar_url}
          onUpdated={() => {
            setShowAvatarModal(false);
            refreshProfile();
          }}
        />
      )}

      {showArchetypeSelector && (
        <ArchetypeSelector
          isOpen={showArchetypeSelector}
          onClose={() => setShowArchetypeSelector(false)}
          value={(profile as any).archetype}
          onChange={async (archetype) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ archetype }).eq("id", profile.id);
            setShowArchetypeSelector(false);
            refreshProfile();
            toast.success("Archetype updated");
          }}
        />
      )}

      {showSoftwareSelector && (
        <SoftwareSelector
          isOpen={showSoftwareSelector}
          onClose={() => setShowSoftwareSelector(false)}
          value={(profile as any).software || []}
          onChange={async (software) => {
            if (!profile?.id) return;
            await supabase.from("profiles").update({ software }).eq("id", profile.id);
            setShowSoftwareSelector(false);
            refreshProfile();
            toast.success("Software updated");
          }}
        />
      )}

      <InviteFriendsModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      {showReviewModal && (
        <RequestReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}
