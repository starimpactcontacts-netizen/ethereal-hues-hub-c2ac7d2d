import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, Lock, ArrowRight, Share2, BarChart3, Grid3X3, Shield, Gavel, Video, Users, Link2, Package, Settings, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useJudgeRatingVideos } from "@/hooks/useJudgeRatingVideos";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { useUserRoles } from "@/hooks/useUserRoles";
import { motion } from "framer-motion";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
import SubmissionGrid from "@/components/loopgate/SubmissionGrid";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
import MyJudgeReviews from "@/components/loopgate/MyJudgeReviews";
import MyRatingVideos from "@/components/loopgate/MyRatingVideos";
import { getRankFromScore } from "@/data/gqtConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import IndexEarnBadge from "@/components/loopgate/IndexEarnBadge";
import { useEquippedBadges } from "@/hooks/useEquippedBadges";
import LinkTreeEditor from "@/components/loopgate/LinkTreeEditor";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { submissions } = useUserSubmissions();
  const { videos: judgeVideos } = useJudgeRatingVideos();
  const { primaryCrew } = useCrewMembership(profile?.id);
  const { isAnyJudge } = useUserRoles(profile?.id);
  const { badges, hasEquippedOG } = useEquippedBadges(profile?.id);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'edits' | 'reviews' | 'videos' | 'links'>('edits');

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

  const userRanking = rankings.find(r => r.id === profile.id);
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');
  const bestGQT = (profile as any).best_gatekeeper_qoi;
  const hasTakenGQT = bestGQT && bestGQT > 0;
  const rankConfig = hasTakenGQT ? getRankFromScore(bestGQT) : null;
  const classLetter = rankConfig?.rank || (level >= 2 ? 'D' : 'F');

  const classColors: Record<string, string> = {
    'S++': 'text-gold', 'S+': 'text-gold', 'S': 'text-amber-400',
    'A': 'text-emerald-400', 'B': 'text-blue-400', 'C': 'text-slate-300',
    'D': 'text-orange-400', 'F': 'text-muted-foreground',
  };

  const quickNav = [
    { to: "/profile/stats", icon: BarChart3, label: "Stats" },
    { to: "/connections", icon: Users, label: "Network" },
    { to: "/inventory", icon: Package, label: "Items" },
    { to: "/profile/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="bg-background min-h-screen">
      
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
          <ActivityStatusSelector
            userId={profile.id}
            currentStatus={(profile as any).activity_status || "online"}
            onStatusChange={refreshProfile}
          />
        </div>

        {/* Centered avatar */}
        <div className="flex flex-col items-center px-4">
          <button
            onClick={() => setShowAvatarModal(true)}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border/40 group mb-2"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-1 flex items-center justify-center">
                <span className="font-display text-2xl text-muted-foreground">{profile.username?.charAt(0).toUpperCase() || '?'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Name + badges */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="font-display text-lg leading-tight">{(profile as any).display_name || profile.username}</h1>
            {profile.verification_status && <VerifiedBadge size="sm" />}
            {(hasEquippedOG || (profile as any).is_founding_member) && <FoundingBadge size="sm" animate={false} />}
          </div>
          <p className="text-[11px] text-muted-foreground mb-1.5">@{profile.username}</p>

          {/* Identity tags */}
          {((profile as any).archetype || ((profile as any).software?.length > 0)) && (
            <div className="flex items-center gap-1 mb-3">
              {(profile as any).archetype && <ArchetypeBadge archetype={(profile as any).archetype} size="sm" animate={false} />}
              {(profile as any).software?.length > 0 && <SoftwareBadges software={(profile as any).software} size="sm" animate={false} />}
            </div>
          )}

          {/* ═══ CUSTOMIZATION SHOWCASE ═══ */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm mb-3"
          >
            {/* Equipped items display */}
            {badges.length > 0 ? (
              <div className="bg-surface-1/60 border border-border/30 rounded-xl p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Equipped</span>
                  <Link to="/inventory" className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">Edit →</Link>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {badges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-1/80 border border-border/40 rounded-full">
                      {badge.image_url ? (
                        <img src={badge.image_url} alt={badge.item_name} className="w-4 h-4 rounded-sm object-cover" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                      )}
                      <span className="text-[10px] font-medium">{badge.item_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Link to="/shop" className="block">
                <div className="bg-surface-1/60 border border-border/30 rounded-xl p-4 text-center hover:border-border/50 transition-colors group">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2 group-hover:text-gold transition-colors" />
                  <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">Customize your profile</p>
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5">Frames, badges, themes & more</p>
                </div>
              </Link>
            )}

            {/* Unit badge */}
            {primaryCrew?.crew && (
              <Link to={`/units/${primaryCrew.crew_id}`} className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-surface-1/50 border border-border/20 rounded-full hover:border-border/40 transition-colors w-fit">
                <div className="w-4 h-4 rounded-full overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                  {primaryCrew.crew.avatar_url ? (
                    <img src={primaryCrew.crew.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-2 h-2 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] font-medium truncate max-w-[80px]">{primaryCrew.crew.name}</span>
              </Link>
            )}
          </motion.div>

          {/* Quick nav — tiny circle icons */}
          <div className="flex items-center gap-3 mb-3">
            {quickNav.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="group flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 rounded-full border border-border/30 bg-surface-1/40 flex items-center justify-center group-hover:border-border/60 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[7px] text-muted-foreground">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT TABS — flush ═══ */}
      <div className="border-b border-border/20">
        <div className="flex">
          {[
            { id: 'edits' as const, icon: Grid3X3, label: 'Edits', show: true },
            { id: 'reviews' as const, icon: Gavel, label: 'Reviews', show: isAnyJudge },
            { id: 'videos' as const, icon: Video, label: 'Videos', show: isAnyJudge },
            { id: 'links' as const, icon: Link2, label: 'Links', show: true },
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
      {activeTab === 'edits' && <SubmissionGrid />}
      {activeTab === 'reviews' && <div className="px-4"><MyJudgeReviews /></div>}
      {activeTab === 'videos' && isAnyJudge && <div className="px-4"><MyRatingVideos /></div>}
      {activeTab === 'links' && <div className="px-4 pt-3"><LinkTreeEditor /></div>}

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
