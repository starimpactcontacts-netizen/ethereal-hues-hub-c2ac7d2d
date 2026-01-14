import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ExternalLink, Calendar, Camera, ShieldCheck, Pencil, Plus, Save, Clock, Check, X, Users, Zap, Trash2, AlertTriangle, ShoppingBag, Coins, ArrowRight, Send, Palette, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useXP } from "@/hooks/useXP";
import { useGuestMode } from "@/hooks/useGuestMode";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import VerificationModal from "@/components/loopgate/VerificationModal";
import EditPlatformModal from "@/components/loopgate/EditPlatformModal";
import AddPlatformModal from "@/components/loopgate/AddPlatformModal";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import CrewBadge from "@/components/loopgate/CrewBadge";
import HouseIdentityStrip from "@/components/loopgate/houses/HouseIdentityStrip";
import HouseBadge from "@/components/loopgate/houses/HouseBadge";
import LevelBadge from "@/components/loopgate/LevelBadge";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
import XPHistory from "@/components/loopgate/XPHistory";
import PasswordSetupBanner from "@/components/loopgate/PasswordSetupBanner";
import MySubmissions from "@/components/loopgate/MySubmissions";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import ArchetypeSelector from "@/components/loopgate/ArchetypeSelector";
import SoftwareSelector from "@/components/loopgate/SoftwareSelector";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, platforms, refreshProfile, signOut } = useAuth();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { xp, level, streak } = useXP();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EditingPlatform | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);
  const [showSoftwareSelector, setShowSoftwareSelector] = useState(false);
  
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
    elite: "text-gold border-gold",
    pro: "text-blue-400 border-blue-400",
    open: "text-muted-foreground border-muted-foreground",
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
              navigate("/auth");
            }}
            className="bg-gold text-black hover:bg-gold/90 font-semibold"
          >
            Sign In
          </Button>
        </div>
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
    } catch (error) {
      console.error("Failed to save contact:", error);
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

      {/* Profile Hero */}
      <div className="p-4">
        <div className="bg-surface-1 border border-border p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold group"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="font-display text-2xl text-muted-foreground">
                      {profile.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>
          </div>

          {/* Display Name + Username + League + Verified */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex flex-col">
              {(profile as any).display_name && (
                <h1 className="font-display text-4xl flex items-center gap-2">
                  {(profile as any).display_name}
                  {level > 1 && <LevelBadge level={level} size="md" />}
                  {profile.verification_status && <VerifiedBadge size="lg" />}
                </h1>
              )}
              <div className="flex items-center gap-2">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="bg-background border border-gold px-2 py-1 text-sm font-medium outline-none w-32"
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSavingUsername}
                      className="p-1 text-gold hover:bg-gold/10"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setUsername(profile.username || '');
                        setIsEditingUsername(false);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {!(profile as any).display_name ? (
                      <h1 className="font-display text-4xl flex items-center gap-2">
                        {profile.username}
                        {level > 1 && <LevelBadge level={level} size="md" />}
                        {profile.verification_status && <VerifiedBadge size="lg" />}
                      </h1>
                    ) : (
                      <span className="text-sm text-muted-foreground">@{profile.username}</span>
                    )}
                    {daysUntilUsernameChange === 0 ? (
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="p-1 text-muted-foreground hover:text-gold transition-colors"
                        title="Edit username"
                      >
                        <Pencil size={12} />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground" title={`Can change in ${daysUntilUsernameChange} days`}>
                        <Clock size={10} />
                        {daysUntilUsernameChange}d
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 ${leagueColors[league]}`}>
              {league}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">
            Global Editor{profile.created_at && ` since ${formatJoinDate(profile.created_at)}`}
          </p>

          {/* Archetype Badge */}
          {(profile as any).archetype && (
            <div className="mt-4">
              <ArchetypeBadge archetype={(profile as any).archetype} size="lg" />
            </div>
          )}

          {/* Software Badges */}
          {(profile as any).software && (profile as any).software.length > 0 && (
            <div className="mt-3">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Software</p>
              <SoftwareBadges software={(profile as any).software} size="sm" />
            </div>
          )}

          {/* Global Rank */}
          <div className="my-6 py-6 border-y border-border text-center">
            <p className="font-display text-7xl text-gold">#{userRank}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Global Rank</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.global_index_score || 0).toFixed(1)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Index</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{Number(profile.win_rate || 0).toFixed(0)}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-background">
              <p className="font-display text-2xl">{profile.total_events || 0}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Events</p>
            </div>
          </div>

          {/* Spendable Index / Shop CTA */}
          <Link to="/shop" className="block mt-4">
            <div className="bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/40 p-4 flex items-center justify-between hover:border-gold transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/20 border border-gold/50 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-display text-2xl text-gold">{(profile as any)?.spendable_index || 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Spendable Index</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gold">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-display text-sm">Shop</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Activity Status */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
            <ActivityStatusSelector
              userId={profile.id}
              currentStatus={(profile as any).activity_status || "online"}
              onStatusChange={refreshProfile}
            />
          </div>

          {/* House */}
          <div className="pt-5 mt-5 border-t border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
              House
            </span>
            {userHouse ? (
              <HouseIdentityStrip house={userHouse} size="md" />
            ) : (
              <button
                onClick={() => navigate("/houses")}
                className="text-[10px] text-gold uppercase tracking-wider hover:underline"
              >
                Join a house
              </button>
            )}
          </div>

          {/* Crew */}
          <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users size={12} />
              Crew
            </span>
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
      </div>

      {/* Editor Identity Section */}
      <section className="px-4 py-4">
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

      {/* Verification Status Card */}
      <section className="px-4 py-2">
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

      {/* XP & Level Section */}
      <section className="px-4 py-4">
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

      {/* XP Activity */}
      <section className="px-4 py-4">
        <h3 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
          <Zap size={14} />
          XP Activity
        </h3>
        <XPHistory limit={10} />
      </section>

      {/* Contact & Bio */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
            <Pencil size={14} />
            Contact & Bio
          </h3>
        </div>
        <div className="bg-surface-1 border border-border p-4 space-y-4">
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
            <p className="text-[9px] text-muted-foreground mt-1">This is your public display name (can be changed anytime)</p>
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
              placeholder="username#1234"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-black text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                <Save size={12} />
                {isSavingContact ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Platforms */}
      <section className="px-4 py-4">
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

      {/* My Submissions */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
            <Send size={14} />
            My Submissions
          </h3>
          <Link to="/events" className="text-[10px] text-gold uppercase tracking-wider hover:underline">
            Browse Events →
          </Link>
        </div>
        <MySubmissions />
      </section>

      {/* Account Deletion Section */}
      <section className="px-4 py-4 mt-8 mb-8">
        <div className="bg-destructive/5 border border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display text-lg text-destructive mb-1">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-surface-0 border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>This will permanently delete:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                        <li>Your profile and all personal data</li>
                        <li>Your connected platforms</li>
                        <li>Your event participations and rankings</li>
                        <li>Your XP history and achievements</li>
                        <li>Your crew membership</li>
                      </ul>
                      <p className="font-semibold text-foreground">This action cannot be undone.</p>
                      <div className="pt-2">
                        <label className="text-sm text-muted-foreground">
                          Type <span className="font-mono text-destructive">DELETE</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="w-full mt-2 px-3 py-2 bg-background border border-border text-sm outline-none focus:border-destructive"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      onClick={() => setDeleteConfirmText("")}
                      className="border-border"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
                      onClick={async (e) => {
                        e.preventDefault();
                        if (deleteConfirmText !== "DELETE") return;
                        
                        setIsDeletingAccount(true);
                        try {
                          // Delete user data from all tables
                          const userId = profile.id;
                          
                          // Delete in order to respect foreign key constraints
                          await supabase.from("xp_history").delete().eq("user_id", userId);
                          await supabase.from("daily_xp_tracking").delete().eq("user_id", userId);
                          await supabase.from("login_streaks").delete().eq("user_id", userId);
                          await supabase.from("event_participations").delete().eq("user_id", userId);
                          await supabase.from("connected_platforms").delete().eq("user_id", userId);
                          await supabase.from("crew_messages").delete().eq("user_id", userId);
                          await supabase.from("crew_join_requests").delete().eq("user_id", userId);
                          await supabase.from("crew_members").delete().eq("user_id", userId);
                          await supabase.from("arena_messages").delete().eq("user_id", userId);
                          await supabase.from("active_sessions").delete().eq("user_id", userId);
                          await supabase.from("user_roles").delete().eq("user_id", userId);
                          await supabase.from("profiles").delete().eq("id", userId);
                          
                          // Sign out and redirect
                          await signOut();
                          toast.success("Account deleted successfully");
                          navigate("/");
                        } catch (error) {
                          console.error("Failed to delete account:", error);
                          toast.error("Failed to delete account. Please contact support.");
                        } finally {
                          setIsDeletingAccount(false);
                          setDeleteConfirmText("");
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete My Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
}
