import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Camera, Zap, Lock, ArrowRight, Share2, Settings, BarChart3, Grid3X3, ChevronRight, Crown, Shield, Gavel, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTempProfile } from "@/hooks/useTempProfile";
import { useRealRankings, useActiveSession } from "@/hooks/useRealData";
import { useXP } from "@/hooks/useXP";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useCrewMembership } from "@/hooks/useCrewMembership";
import { useUserRoles } from "@/hooks/useUserRoles";
import { motion } from "framer-motion";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import AvatarUploadModal from "@/components/loopgate/AvatarUploadModal";
import ActivityStatusSelector from "@/components/loopgate/ActivityStatusSelector";
import XPProgressBar from "@/components/loopgate/XPProgressBar";
import PasswordSetupBanner from "@/components/loopgate/PasswordSetupBanner";
import EmailSecurityBanner from "@/components/loopgate/EmailSecurityBanner";
import SubmissionGrid from "@/components/loopgate/SubmissionGrid";
import ArchetypeBadge from "@/components/loopgate/ArchetypeBadge";
import { SoftwareBadges } from "@/components/loopgate/SoftwareBadge";
import ReviewResultCard from "@/components/loopgate/ReviewResultCard";
import MyJudgeReviews from "@/components/loopgate/MyJudgeReviews";
import MyRatingVideos from "@/components/loopgate/MyRatingVideos";
import { getRankFromScore } from "@/data/gqtConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, loading: authLoading } = useAuth();
  const { profile: tempProfile, isTemp, clearProfile: clearTempProfile } = useTempProfile();
  const { isGuest, clearGuest } = useGuestMode();
  const { rankings } = useRealRankings();
  const { xp, level } = useXP();
  const { submissions } = useUserSubmissions();
  const { completedReviews } = useReviewRequests();
  const { primaryCrew } = useCrewMembership(profile?.id);
  const { isAnyJudge } = useUserRoles(profile?.id);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'edits' | 'reviews' | 'videos'>('edits');
  
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
    <div className="bg-background">
      <PasswordSetupBanner />
      <EmailSecurityBanner />

      {/* ═══ HERO SECTION ═══ */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-transparent to-transparent" />
        
        <div className="relative px-4 pt-2 pb-2">
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const profileUrl = `${window.location.origin}/editor/${profile.id}`;
                navigator.clipboard.writeText(profileUrl);
                toast.success("Profile link copied!");
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface-1 border border-border text-[11px] font-medium hover:border-foreground/30 transition-colors rounded-md"
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
          
          {/* Avatar + Identity */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border group mb-1.5"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-1 flex items-center justify-center">
                  <span className="font-display text-xl text-muted-foreground">
                    {profile.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            
            <div className="text-center mb-1.5">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="font-display text-lg">
                  {(profile as any).display_name || profile.username}
                </h1>
                {profile.verification_status && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[11px] text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Identity Badges */}
            {((profile as any).archetype || ((profile as any).software && (profile as any).software.length > 0)) && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {(profile as any).archetype && (
                  <ArchetypeBadge archetype={(profile as any).archetype} size="sm" animate={false} />
                )}
                {(profile as any).software && (profile as any).software.length > 0 && (
                  <SoftwareBadges software={(profile as any).software} size="sm" animate={false} />
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Link to="/gqt" className={`flex flex-col items-center justify-center w-10 h-10 rounded-md border ${classColors[classLetter]}`}>
                <span className="font-display text-base">{classLetter}</span>
                <span className="text-[6px] uppercase tracking-wider opacity-60">Class</span>
              </Link>
              <div className="text-center px-1.5">
                <p className="font-display text-base">{submissions.length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Edits</p>
              </div>
              <div className="text-center px-1.5">
                <p className="font-display text-base">#{userRank}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Rank</p>
              </div>
              <div className="text-center px-1.5">
                <p className="font-display text-base">{Number(profile.global_index_score || 0).toFixed(1)}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Index</p>
              </div>
            </div>

            {/* Primary Crew */}
            {primaryCrew?.crew && (
              <Link to={`/crews/${primaryCrew.crew_id}`} className="w-full max-w-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-1 border border-border hover:border-foreground/30 transition-colors">
                  <div className="w-6 h-6 rounded overflow-hidden bg-muted/30 flex items-center justify-center">
                    {primaryCrew.crew.avatar_url ? (
                      <img src={primaryCrew.crew.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium truncate">{primaryCrew.crew.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* ═══ XP BAR ═══ */}
      <div className="px-4 mb-1.5">
        <div className="flex items-center justify-between text-[8px] text-muted-foreground mb-0.5">
          <span className="flex items-center gap-0.5">
            <Zap className="w-2 h-2 text-purple-400" />
            LV {level}
          </span>
          <span>{xp} XP</span>
        </div>
        <XPProgressBar xp={xp} level={level} size="sm" />
      </div>

      {/* ═══ QUICK NAV BUTTONS ═══ */}
      <div className="px-4 mb-2">
        <div className="grid grid-cols-2 gap-1.5">
          <Link to="/profile/stats">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="bg-surface-1 border border-border rounded-md p-2 flex items-center gap-1.5 hover:border-foreground/30 transition-colors"
            >
              <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-3 h-3 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium">Stats</p>
                <p className="text-[8px] text-muted-foreground">XP & rankings</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </motion.div>
          </Link>
          
          <Link to="/profile/settings">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="bg-surface-1 border border-border rounded-md p-2 flex items-center gap-1.5 hover:border-foreground/30 transition-colors"
            >
              <div className="w-6 h-6 rounded bg-muted/30 flex items-center justify-center">
                <Settings className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium">Settings</p>
                <p className="text-[8px] text-muted-foreground">Account</p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </motion.div>
          </Link>
        </div>
      </div>

      {/* ═══ CONTENT TABS ═══ */}
      <div className="px-4 mb-2">
        {isAnyJudge ? (
          <div className="flex gap-0.5 p-0.5 bg-surface-1 border border-border rounded-md">
            <button
              onClick={() => setActiveTab('edits')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'edits' 
                  ? 'bg-background text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-3 h-3" />
              Edits
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'reviews' 
                  ? 'bg-gold/20 text-gold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gavel className="w-3 h-3" />
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'videos' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="w-3 h-3" />
              Videos
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Grid3X3 className="w-3 h-3 text-muted-foreground" />
            <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">My Edits</h2>
          </div>
        )}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === 'edits' && (
        <>
          {/* Completed Reviews (reviews I received) */}
          {completedReviews.length > 0 && (
            <div className="px-4 mb-4">
              <div className="space-y-2">
                {completedReviews.slice(0, 3).map((review) => (
                  <ReviewResultCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          )}
          
          {/* Submission Grid */}
          <SubmissionGrid />
        </>
      )}
      
      {activeTab === 'reviews' && (
        <div className="px-4">
          <MyJudgeReviews />
        </div>
      )}
      
      {activeTab === 'videos' && (
        <div className="px-4">
          <MyRatingVideos />
        </div>
      )}

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
