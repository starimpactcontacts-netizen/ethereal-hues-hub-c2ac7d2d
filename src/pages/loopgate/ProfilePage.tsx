import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, Zap, Lock, ArrowRight, Share2, Settings, BarChart3, Grid3X3, ChevronRight, Crown, Shield, Gavel, Video, Users, Link2 } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useXP } from "@/hooks/useXP";
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
import ProfileInventoryLink from "@/components/loopgate/ProfileInventoryLink";
import { useEquippedBadges } from "@/hooks/useEquippedBadges";
import LinkTreeEditor from "@/components/loopgate/LinkTreeEditor";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { xp, level } = useXP();
  const { submissions } = useUserSubmissions();
  const { videos: judgeVideos } = useJudgeRatingVideos();
  
  const { primaryCrew } = useCrewMembership(profile?.id);
  const { isAnyJudge } = useUserRoles(profile?.id);
  const { hasEquippedOG } = useEquippedBadges(profile?.id);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'edits' | 'reviews' | 'videos' | 'links'>('edits');
  
  // Set default tab to videos for judges once roles load
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
    <div className="bg-background min-h-screen">

      {/* ═══ SEAMLESS HERO ═══ */}
      <div className="relative px-4 pt-3 pb-0">
        {/* Top row — share + status */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              const profileUrl = `${window.location.origin}/editor/${profile.id}`;
              navigator.clipboard.writeText(profileUrl);
              toast.success("Profile link copied!");
            }}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
          <ActivityStatusSelector
            userId={profile.id}
            currentStatus={(profile as any).activity_status || "online"}
            onStatusChange={refreshProfile}
          />
        </div>
        
        {/* Avatar + Name — compact horizontal layout */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setShowAvatarModal(true)}
            className="relative w-14 h-14 rounded-full overflow-hidden border border-border/50 group shrink-0"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-1 flex items-center justify-center">
                <span className="font-display text-lg text-muted-foreground">
                  {profile.username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h1 className="font-display text-base leading-tight truncate">
                {(profile as any).display_name || profile.username}
              </h1>
              {profile.verification_status && <VerifiedBadge size="sm" />}
              {(hasEquippedOG || (profile as any).is_founding_member) && <FoundingBadge size="sm" animate={false} />}
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">@{profile.username}</p>
            
            {/* Identity badges inline */}
            {((profile as any).archetype || ((profile as any).software && (profile as any).software.length > 0)) && (
              <div className="flex items-center gap-1">
                {(profile as any).archetype && (
                  <ArchetypeBadge archetype={(profile as any).archetype} size="sm" animate={false} />
                )}
                {(profile as any).software && (profile as any).software.length > 0 && (
                  <SoftwareBadges software={(profile as any).software} size="sm" animate={false} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats — single fluid row */}
        <div className="flex items-center gap-0 mb-2 -mx-1">
          <Link to="/gqt" className={`flex flex-col items-center justify-center px-2.5 py-1.5 border-r border-border/30 ${classColors[classLetter]?.split(' ')[0] || 'text-muted-foreground'}`}>
            <span className="font-display text-sm leading-none">{classLetter}</span>
            <span className="text-[7px] uppercase tracking-wider text-muted-foreground mt-0.5">Class</span>
          </Link>
          <div className="flex flex-col items-center px-2.5 py-1.5 border-r border-border/30">
            <span className="font-display text-sm leading-none">{isAnyJudge ? judgeVideos.length : submissions.length}</span>
            <span className="text-[7px] uppercase tracking-wider text-muted-foreground mt-0.5">{isAnyJudge ? 'Videos' : 'Edits'}</span>
          </div>
          <div className="flex flex-col items-center px-2.5 py-1.5 border-r border-border/30">
            <span className="font-display text-sm leading-none">#{userRank}</span>
            <span className="text-[7px] uppercase tracking-wider text-muted-foreground mt-0.5">Rank</span>
          </div>
          <div className="flex flex-col items-center px-2.5 py-1.5 border-r border-border/30">
            <span className="font-display text-sm leading-none">{Number(profile.global_index_score || 0).toFixed(1)}</span>
            <span className="text-[7px] uppercase tracking-wider text-muted-foreground mt-0.5">Index</span>
          </div>
          <div className="flex flex-col items-center px-2.5 py-1.5">
            <div className="flex items-center gap-0.5">
              <span className="font-display text-sm leading-none text-emerald-400">${(Math.max(0, ((profile as any)?.earnings_cents || 0) - ((profile as any)?.pending_withdrawal_cents || 0) - ((profile as any)?.withdrawn_cents || 0)) / 100).toFixed(2)}</span>
              <IndexEarnBadge size="sm" hideDollar />
            </div>
            <span className="text-[7px] uppercase tracking-wider text-emerald-400/50 mt-0.5">Earn</span>
          </div>
        </div>

        {/* Unit + XP — combined row */}
        <div className="flex items-center gap-2 mb-2">
          {primaryCrew?.crew && (
            <Link to={`/units/${primaryCrew.crew_id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-surface-1/50 border border-border/30 rounded hover:border-border/60 transition-colors">
                <div className="w-5 h-5 rounded overflow-hidden bg-muted/30 flex items-center justify-center shrink-0">
                  {primaryCrew.crew.avatar_url ? (
                    <img src={primaryCrew.crew.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] font-medium truncate">{primaryCrew.crew.name}</span>
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              </div>
            </Link>
          )}
          <div className={`${primaryCrew?.crew ? 'w-28' : 'flex-1'} shrink-0`}>
            <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-0.5">
              <span className="flex items-center gap-0.5">
                <Zap className="w-2 h-2 text-purple-400" />
                Lv {level}
              </span>
              <span className="tabular-nums">{xp}</span>
            </div>
            <XPProgressBar xp={xp} level={level} size="sm" />
          </div>
        </div>
      </div>

      {/* ═══ QUICK NAV — icon strip ═══ */}
      <div className="px-4 mb-1.5">
        <div className="flex gap-1">
          {[
            { to: "/profile/stats", icon: BarChart3, label: "Stats", color: "text-purple-400" },
            { to: "/connections", icon: Users, label: "Network", color: "text-sky-400" },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className="flex-1">
              <motion.div whileTap={{ scale: 0.97 }} className="flex items-center justify-center gap-1.5 py-1.5 bg-surface-1/40 border border-border/20 rounded hover:border-border/50 transition-colors">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
              </motion.div>
            </Link>
          ))}
          <div className="flex-1"><ProfileInventoryLink /></div>
          <Link to="/profile/settings" className="flex-1">
            <motion.div whileTap={{ scale: 0.97 }} className="flex items-center justify-center gap-1.5 py-1.5 bg-surface-1/40 border border-border/20 rounded hover:border-border/50 transition-colors h-full">
              <Settings className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground">Settings</span>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* ═══ CONTENT TABS — flush edge-to-edge ═══ */}
      <div className="border-b border-border/30 mb-0">
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
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="profileTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" />
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
          onUpdated={() => {
            setShowAvatarModal(false);
            refreshProfile();
          }}
        />
      )}
    </div>
  );
}
