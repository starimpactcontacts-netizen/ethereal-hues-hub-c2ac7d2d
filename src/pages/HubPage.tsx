import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel,
  ChevronRight, Plus, Infinity as InfinityIcon, Swords, Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealEvents, useGlobalStats, useActiveSession, useRealRankings } from '@/hooks/useRealData';
import { useTempProfile } from '@/hooks/useTempProfile';
import { useGuestMode } from '@/hooks/useGuestMode';
import LoopMonster from '@/components/loopgate/LoopMonster';
import ActivityFeed from '@/components/loopgate/ActivityFeed';
import InviteModal from '@/components/loopgate/InviteModal';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import JudgeReviewsFeed from '@/components/loopgate/JudgeReviewsFeed';
import JudgeClassBadge from '@/components/loopgate/JudgeClassBadge';
import XPProgressBar from '@/components/loopgate/XPProgressBar';
import { supabase } from '@/integrations/supabase/client';

const leagueConfig = {
  cartel: { label: 'CARTEL', icon: Crown, gradient: 'from-gold via-amber-400 to-gold', glow: 'shadow-gold/30' },
  elite: { label: 'ELITE', icon: Crown, gradient: 'from-gold to-amber-500', glow: 'shadow-gold/20' },
  pro: { label: 'PRO', icon: Shield, gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/20' },
  open: { label: 'OPEN', icon: Users, gradient: 'from-zinc-500 to-zinc-600', glow: 'shadow-zinc-500/10' },
};

interface UserCrew {
  id: string;
  name: string;
  emblem: string;
  avatar_url: string | null;
}

export default function HubPage() {
  const { profile, user } = useAuth();
  const { isJudge } = useUserRoles(user?.id);
  const { profile: tempProfile } = useTempProfile();
  const { isGuest } = useGuestMode();
  const { events } = useRealEvents();
  const { stats } = useGlobalStats();
  const { rankings } = useRealRankings();
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [judgeReviewCount, setJudgeReviewCount] = useState(0);
  const [userCrew, setUserCrew] = useState<UserCrew | null>(null);
  
  useActiveSession();
  
  // Determine display identity (real profile OR temp profile OR guest)
  const displayUsername = profile?.username || tempProfile?.username || (isGuest ? 'Guest' : 'EDITOR');
  const displayAvatar = profile?.avatar_url || tempProfile?.avatarUrl;

  // Calculate global rank
  const globalRank = rankings.findIndex(r => r.id === user?.id) + 1 || null;

  // Fetch user's crew
  useEffect(() => {
    if (profile?.crew_id) {
      supabase
        .from('crews')
        .select('id, name, emblem, avatar_url')
        .eq('id', profile.crew_id)
        .single()
        .then(({ data }) => {
          if (data) setUserCrew(data);
        });
    } else {
      setUserCrew(null);
    }
  }, [profile?.crew_id]);

  // Fetch judge review count if user is a judge
  useEffect(() => {
    if (isJudge && user?.id) {
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', user.id)
        .eq('status', 'reviewed')
        .then(({ count }) => {
          setJudgeReviewCount(count || 0);
        });
    }
  }, [isJudge, user?.id]);

  const userLeague = (profile?.league?.toLowerCase() || 'open') as keyof typeof leagueConfig;
  const league = leagueConfig[userLeague] || leagueConfig.open;
  const LeagueIcon = league.icon;
  const bestScore = profile?.best_gatekeeper_qoi;

  const liveEvents = events.filter(e => e.status === 'live');
  const primaryLiveEvent = liveEvents[0];
  const hasLiveEvent = liveEvents.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <LoopMonster />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - User Identity (Compact)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Immersive background */}
        <div className="absolute inset-0 h-[320px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-gold/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_hsl(43_74%_49%_/_0.06)_0%,_transparent_50%)]" />
        </div>

        {/* Compact Profile Card */}
        <div className="relative px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-1/80 backdrop-blur-xl border border-border/50 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left: Avatar + Identity */}
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 group text-left"
              >
                {/* Avatar with league ring */}
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${league.gradient} p-[2px] shadow-lg ${league.glow}`}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl text-foreground">
                          {displayUsername?.charAt(0).toUpperCase() || 'E'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Level badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <span className="font-display text-[10px] text-foreground">{profile?.level || 1}</span>
                  </div>
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl text-foreground leading-none truncate max-w-[120px]">
                      {displayUsername}
                    </h1>
                    {isJudge && <JudgeClassBadge reviewCount={judgeReviewCount} size="sm" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r ${league.gradient} rounded-sm`}>
                      <LeagueIcon className="w-2.5 h-2.5 text-background" />
                      <span className="text-[8px] font-bold tracking-wider text-background uppercase">
                        {league.label}
                      </span>
                    </div>
                    {globalRank && globalRank <= 500 && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold/10 border border-gold/30">
                        <Trophy className="w-2.5 h-2.5 text-gold" />
                        <span className="text-[8px] font-bold text-gold">#{globalRank}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Right: Shop Balance */}
              <Link to="/shop" className="group shrink-0">
                <div className="flex items-center gap-2 bg-surface-1 border border-border hover:border-gold/50 px-3 py-2 transition-colors">
                  <ShoppingBag className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-gold" />
                      <span className="font-display text-lg text-foreground leading-none">
                        {(profile as any)?.spendable_index || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-3">
              <XPProgressBar 
                xp={profile?.xp || 0} 
                level={profile?.level || 1} 
                size="sm"
                showNumbers={true}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          🔥 ARENA - THE MAIN CTA - FORTNITE PLAY BUTTON
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="px-4 mt-2"
      >
        <Link to="/arena" className="block group">
          <div className="relative overflow-hidden border-2 border-gold/50 hover:border-gold transition-all duration-300">
            {/* Dynamic Background based on live status */}
            <div className="absolute inset-0">
              {primaryLiveEvent?.poster_url ? (
                <>
                  <img 
                    src={primaryLiveEvent.poster_url} 
                    alt="" 
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/60" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-background to-gold/5" />
              )}
              {/* Animated pulse overlay when live */}
              {hasLiveEvent && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
            
            {/* Content */}
            <div className="relative p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Arena Icon - Large */}
                <div className="w-16 h-16 bg-gradient-to-br from-gold via-amber-400 to-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/40 group-hover:shadow-gold/60 transition-shadow">
                  <InfinityIcon className="w-8 h-8 text-background" strokeWidth={2.5} />
                </div>
                
                <div>
                  {hasLiveEvent ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="relative flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Now</span>
                        </div>
                      </div>
                      <h2 className="font-display text-2xl text-foreground leading-tight">
                        {primaryLiveEvent.title}
                      </h2>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        <CountdownTimer endDate={primaryLiveEvent.end_date} />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="font-display text-2xl text-foreground">ARENA</h2>
                      <p className="text-sm text-muted-foreground">Enter the competition</p>
                    </>
                  )}
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="shrink-0">
                <div className="bg-gradient-to-r from-gold to-amber-400 text-background font-display text-sm px-6 py-3 flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-gold/30 transition-all">
                  <span>{hasLiveEvent ? 'ENTER NOW' : 'VIEW ARENAS'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK ACCESS GRID - Compact 4-item grid
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-4"
      >
        <div className="grid grid-cols-4 gap-2">
          {/* Rankings */}
          <Link to="/rankings" className="group">
            <div className="bg-surface-1/60 border border-border/50 hover:border-gold/30 transition-colors p-3 text-center">
              <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="text-[9px] text-foreground font-medium uppercase tracking-wide">Rankings</p>
            </div>
          </Link>
          
          {/* Judges */}
          <Link to="/judges" className="group">
            <div className="bg-surface-1/60 border border-border/50 hover:border-purple-500/30 transition-colors p-3 text-center">
              <Gavel className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-[9px] text-foreground font-medium uppercase tracking-wide">Judges</p>
            </div>
          </Link>
          
          {/* Crews */}
          <Link to="/crews" className="group">
            <div className="bg-surface-1/60 border border-border/50 hover:border-foreground/30 transition-colors p-3 text-center">
              <Users2 className="w-5 h-5 text-foreground mx-auto mb-1" />
              <p className="text-[9px] text-foreground font-medium uppercase tracking-wide">Crews</p>
            </div>
          </Link>
          
          {/* GQT */}
          <Link to="/gqt" className="group">
            <div className="bg-surface-1/60 border border-border/50 hover:border-foreground/30 transition-colors p-3 text-center">
              <Target className="w-5 h-5 text-foreground mx-auto mb-1" />
              <p className="text-[9px] text-foreground font-medium uppercase tracking-wide">GQT</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          YOUR CREW / GQT Status (if applicable)
      ═══════════════════════════════════════════════════════════════════ */}
      {(userCrew || bestScore) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="px-4 mt-4"
        >
          <div className="bg-surface-1/40 border border-border/30 divide-y divide-border/20">
            {userCrew && (
              <Link to={`/crews/${userCrew.id}`} className="flex items-center justify-between p-3 hover:bg-surface-1/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                    {userCrew.avatar_url ? (
                      <img src={userCrew.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users2 className="w-4 h-4 text-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Your Crew</p>
                    <p className="font-display text-sm text-foreground">{userCrew.name}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}
            {bestScore && (
              <Link to="/gqt" className="flex items-center justify-between p-3 hover:bg-surface-1/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                    <Target className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Best GQT Score</p>
                    <p className="font-display text-sm text-gold">{bestScore.toFixed(0)}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STATS STRIP - Global pulse
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="px-4 mt-4"
      >
        <div className="bg-surface-1/30 border border-border/20 p-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-lg text-foreground">{stats.entries24h}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-widest">Entries 24h</p>
            </div>
            <div>
              <p className="font-display text-lg text-foreground">{stats.activeUsers}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-widest">Active Now</p>
            </div>
            <div>
              <p className="font-display text-lg text-foreground">{stats.totalCompeting || 0}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-widest">Competing</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          LIVE FEED - Compact activity log
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h3 className="font-display text-sm text-foreground">LIVE FEED</h3>
          </div>
          <Link to="/feed" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
            FULL FEED <ArrowRight size={10} />
          </Link>
        </div>
        <ActivityFeed limit={5} compact />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          REVIEWS CAROUSEL
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6"
      >
        <JudgeReviewsFeed />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          INVITE FRIENDS - Subtle inline CTA (not a blockade)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 px-4"
      >
        <button
          onClick={() => setInviteModalOpen(true)}
          className="w-full bg-surface-1/40 border border-border/30 hover:border-gold/40 transition-colors p-3 flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-sm text-foreground">Invite Friends</span>
            <span className="text-[9px] text-muted-foreground">+170 XP</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
        </button>
      </motion.div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}
