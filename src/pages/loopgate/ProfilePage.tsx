import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, Lock, ArrowRight, Share2, BarChart3, Grid3X3, Gavel, Video, Users, Package, Settings, ShoppingBag, DollarSign, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useActiveSession } from "@/hooks/useRealData";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useJudgeRatingVideos } from "@/hooks/useJudgeRatingVideos";
import { useUserRoles } from "@/hooks/useUserRoles";
import { motion } from "framer-motion";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";

import BattleEditsGrid from "@/components/loopgate/BattleEditsGrid";
import MyJudgeReviews from "@/components/loopgate/MyJudgeReviews";
import MyRatingVideos from "@/components/loopgate/MyRatingVideos";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";


export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { submissions } = useUserSubmissions();
  const { videos: judgeVideos } = useJudgeRatingVideos();
  const { isAnyJudge } = useUserRoles(profile?.id);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'edits' | 'reviews' | 'videos'>('edits');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (isAnyJudge) setActiveTab('videos');
    else setActiveTab('edits');
  }, [isAnyJudge]);

  useActiveSession();

  // Guest mode
  if (isGuest) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Sign In Required</h1>
          <p className="text-muted-foreground text-sm mb-6">You're browsing as a guest. Sign in to view your profile.</p>
          <Button onClick={() => { clearGuest(); navigate("/start"); }} className="bg-gold text-black hover:bg-gold/90 font-semibold">Sign In</Button>
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
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] border px-2 py-1 text-muted-foreground border-muted-foreground bg-muted/10">OPEN</span>
            <Button variant="ghost" size="sm" onClick={() => { clearTempProfile(); navigate('/start'); }} className="text-muted-foreground text-xs">Sign Out</Button>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border mb-3">
              {tempProfile.avatarUrl ? (
                <img src={tempProfile.avatarUrl} alt={tempProfile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="font-display text-2xl text-muted-foreground">{tempProfile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <h1 className="font-display text-xl mb-1">{tempProfile.username}</h1>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-gold/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base text-gold mb-1">Secure Your Account</h3>
                <p className="text-sm text-muted-foreground mb-4">Add an email to save your progress and unlock all features.</p>
                <Button onClick={() => navigate('/login')} className="bg-gold text-black hover:bg-gold/90 font-semibold">
                  Create Full Account <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }


  const quickNav = [
    { to: "/profile/stats", icon: BarChart3, label: "Stats" },
    { to: "/connections", icon: Users, label: "Network" },
    { to: "/inventory", icon: Package, label: "Items" },
    { to: "/profile/settings", icon: Settings, label: "Settings" },
  ];

  const currentBio = (profile as any).bio as string | null;

  const startEditBio = () => {
    setBioDraft(currentBio || "");
    setEditingBio(true);
  };

  const saveBio = async () => {
    setSavingBio(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: bioDraft.trim() || null })
      .eq("id", profile.id);
    setSavingBio(false);
    if (error) {
      toast.error("Couldn't save bio");
      return;
    }
    toast.success("Bio updated");
    setEditingBio(false);
    refreshProfile();
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      
      {/* ═══ TIKTOK-STYLE CENTERED HERO ═══ */}
      <div className="relative pt-2 pb-0">
        
        {/* Top utility row */}
        <div className="flex items-center justify-between px-4 mb-3">
          <button
            onClick={() => {
              const profileUrl = `${window.location.origin}/editor/${profile.id}`;
              navigator.clipboard.writeText(profileUrl);
              toast.success("Profile link copied!");
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-2">
            <Link to="/shop" className="p-1.5 rounded-full hover:bg-surface-1/60 transition-colors">
              <ShoppingBag className="w-4 h-4 text-muted-foreground hover:text-gold transition-colors" />
            </Link>
            <ActivityStatusSelector
              userId={profile.id}
              currentStatus={(profile as any).activity_status || "online"}
              onStatusChange={refreshProfile}
            />
          </div>
        </div>

        {/* Centered avatar */}
        <div className="flex flex-col items-center px-4">
          <button
            onClick={() => setShowAvatarModal(true)}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group mb-2"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#111114] flex items-center justify-center">
                <span className="font-display text-2xl text-muted-foreground">{profile.username?.charAt(0).toUpperCase() || '?'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Name + verified */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="font-display text-lg leading-tight">{(profile as any).display_name || profile.username}</h1>
            {profile.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">@{profile.username}</p>

          {/* Bio */}
          <div className="w-full max-w-[320px] mb-4">
            {editingBio ? (
              <div className="flex flex-col items-center gap-2">
                <textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
                  placeholder="Write a short bio..."
                  rows={3}
                  className="w-full bg-[#111114] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-white/30 resize-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{bioDraft.length}/160</span>
                  <button
                    onClick={() => setEditingBio(false)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#111114] border border-white/10 text-[11px] text-muted-foreground hover:text-white"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                  <button
                    onClick={saveBio}
                    disabled={savingBio}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-black text-[11px] font-semibold disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> {savingBio ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : currentBio ? (
              <button
                onClick={startEditBio}
                className="group w-full text-center text-[13px] text-foreground/80 leading-snug whitespace-pre-wrap hover:text-foreground transition-colors"
              >
                {currentBio}
                <Pencil className="inline w-3 h-3 ml-1.5 opacity-40 group-hover:opacity-80" />
              </button>
            ) : (
              <button
                onClick={startEditBio}
                className="flex items-center justify-center gap-1.5 mx-auto text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3 h-3" /> Add bio
              </button>
            )}
          </div>

          {/* Quick nav — tiny circle icons */}
          <div className="flex items-center gap-3 mb-3">
            {quickNav.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="group flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-[#111114] flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[7px] text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT TABS — flush ═══ */}
      <div className="border-b border-white/5">
        <div className="flex">
          {[
            { id: 'edits' as const, icon: Grid3X3, label: 'Edits', show: true },
            { id: 'reviews' as const, icon: Gavel, label: 'Reviews', show: isAnyJudge },
            { id: 'videos' as const, icon: Video, label: 'Videos', show: isAnyJudge },
          ].filter(t => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="profileTab" className="absolute bottom-0 left-4 right-4 h-[2px] bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === 'edits' && profile && <BattleEditsGrid userId={profile.id} isOwner />}
      {activeTab === 'reviews' && <div className="px-4"><MyJudgeReviews /></div>}
      {activeTab === 'videos' && isAnyJudge && <div className="px-4"><MyRatingVideos /></div>}
      {/* ═══ AVATAR MODAL ═══ */}
      {showAvatarModal && (
        <AvatarUploadModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          userId={profile.id}
          currentAvatarUrl={profile.avatar_url}
          onUpdated={() => { setShowAvatarModal(false); refreshProfile(); }}
        />
      )}
    </div>
  );
}
