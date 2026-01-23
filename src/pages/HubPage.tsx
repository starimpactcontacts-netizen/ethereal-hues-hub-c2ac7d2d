import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, Zap, TrendingUp, Star, Coins, ShoppingBag, Gavel,
  ChevronRight, Plus, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import CrewBadge from '@/components/loopgate/CrewBadge';
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
  const isTemporaryUser = !user && (tempProfile || isGuest);

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

  const liveEvents = events.filter(e => e.status === 'live').slice(0, 3);
  const upcomingEvents = events.filter(e => e.status === 'pending').slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <LoopMonster />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - Immersive gradient + user identity + QOI spotlight
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Immersive background with radial gradient and subtle noise */}
        <div className="absolute inset-0 h-[420px] overflow-hidden">
          {/* Deep radial gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
          {/* Gold accent glow from top */}
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold/5 to-transparent" />
          {/* Subtle radial spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_hsl(43_74%_49%_/_0.08)_0%,_transparent_60%)]" />
          {/* Animated pulse overlay */}
          <motion.div 
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_hsl(43_74%_49%_/_0.05)_0%,_transparent_50%)]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Grid overlay for depth */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative px-4 pt-10 pb-6">
          {/* EXPANDED USER PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Main profile card */}
            <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 overflow-hidden">
              {/* Top Row: Avatar + Identity + Shop Balance */}
              <div className="p-4 flex items-start justify-between gap-4">
                {/* Left: Avatar + Identity */}
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 group text-left"
                >
                  {/* Avatar with league ring + level badge */}
                  <div className="relative shrink-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${league.gradient} p-[2px] shadow-lg ${league.glow} group-hover:scale-105 transition-transform`}>
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-2xl text-foreground">
                            {displayUsername?.charAt(0).toUpperCase() || 'E'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Level badge */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-gold flex items-center justify-center shadow-lg">
                      <span className="font-display text-xs text-gold">{profile?.level || 1}</span>
                    </div>
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl text-foreground leading-none truncate max-w-[140px]">
                        {displayUsername}
                      </h1>
                      {isJudge && (
                        <JudgeClassBadge reviewCount={judgeReviewCount} size="sm" />
                      )}
                    </div>
                    {/* League + Rank Row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r ${league.gradient} rounded-sm`}>
                        <LeagueIcon className="w-3 h-3 text-background" />
                        <span className="text-[9px] font-bold tracking-wider text-background uppercase">
                          {league.label}
                        </span>
                      </div>
                      {globalRank && globalRank <= 500 && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gold/10 border border-gold/30">
                          <Trophy className="w-3 h-3 text-gold" />
                          <span className="text-[9px] font-bold text-gold">#{globalRank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Right: Shop Balance */}
                <Link to="/shop" className="group shrink-0">
                  <div className="flex items-center gap-2 bg-gold/5 border border-gold/30 hover:bg-gold/10 hover:border-gold/50 px-3 py-2 transition-colors">
                    <div className="w-9 h-9 bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <ShoppingBag className="w-4 h-4 text-gold" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-gold" />
                        <span className="font-display text-xl text-gold leading-none">
                          {(profile as any)?.spendable_index || 0}
                        </span>
                      </div>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest">INDEX</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* XP Progress Bar */}
              <div className="px-4 pb-3">
                <XPProgressBar 
                  xp={profile?.xp || 0} 
                  level={profile?.level || 1} 
                  size="sm"
                  showNumbers={true}
                />
              </div>

              {/* Stats Row */}
              <div className="border-t border-border/30 px-4 py-3">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="font-display text-lg text-foreground">{profile?.total_events || 0}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Events</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-foreground">{profile?.total_wins || 0}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Wins</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-gold">{bestScore?.toFixed(0) || '—'}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Best QOI</p>
                  </div>
                  <div>
                    <p className="font-display text-lg text-foreground">{profile?.win_rate ? `${(profile.win_rate * 100).toFixed(0)}%` : '—'}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Win Rate</p>
                  </div>
                </div>
              </div>

              {/* Quick Access Rows - Crew & GQT */}
              <div className="border-t border-border/30 divide-y divide-border/20">
                {/* Crew Row */}
                <div className="px-4 py-3">
                  {userCrew ? (
                    <Link to={`/crews/${userCrew.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center overflow-hidden">
                          {userCrew.avatar_url ? (
                            <img src={userCrew.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users2 className="w-5 h-5 text-gold" />
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Your Crew</p>
                          <p className="font-display text-sm text-gold">{userCrew.name}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ) : (
                    <Link to="/crews" className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Join a Crew</p>
                          <p className="text-sm text-foreground group-hover:text-gold transition-colors">Find your squad</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  )}
                </div>

                {/* GQT Row */}
                <div className="px-4 py-3">
                  <Link to="/gqt" className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <Target className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Global QOI Test</p>
                        <p className="font-display text-sm text-foreground group-hover:text-gold transition-colors">
                          {bestScore ? `Best: ${bestScore.toFixed(0)}` : 'Get your score'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECONDARY LAYER - Horizontal scroll modules
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-8 space-y-6">
        
        {/* Live Events Scroll */}
        {liveEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2.5 py-2">
                {/* Pulsing ring container */}
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                  <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-pulse" />
                </div>
                <h3 className="font-display text-xl text-foreground" style={{ lineHeight: 1.3 }}>LIVE NOW</h3>
              </div>
              <Link to="/events" className="text-[10px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                VIEW ALL <ArrowRight size={10} />
              </Link>
            </div>
            
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
              {liveEvents.map((event, i) => (
                <Link key={event.id} to={`/event/${event.id}`} className="shrink-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="w-[200px] bg-surface-1/80 backdrop-blur border border-border hover:border-gold/50 transition-colors overflow-hidden group"
                  >
                    {/* Mini poster */}
                    {event.poster_url && (
                      <div className="h-24 overflow-hidden">
                        <img 
                          src={event.poster_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[8px] text-green-500 uppercase tracking-widest font-bold">Live</span>
                      </div>
                      <p className="font-display text-sm text-foreground truncate">{event.title}</p>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        <CountdownTimer endDate={event.end_date} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between px-4 mb-3">
              <h3 className="font-display text-lg text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold" />
                UPCOMING
              </h3>
            </div>
            
            <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
              {upcomingEvents.map((event, i) => {
                const startsIn = new Date(event.start_date).getTime() - Date.now();
                const days = Math.floor(startsIn / (1000 * 60 * 60 * 24));
                const hours = Math.floor((startsIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                return (
                  <Link key={event.id} to={`/event/${event.id}`} className="shrink-0">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="w-[180px] bg-surface-1/60 backdrop-blur border border-border/50 hover:border-gold/30 transition-colors p-4"
                    >
                      <p className="font-display text-sm text-foreground truncate mb-1">{event.title}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-3">{event.league} League</p>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/30">
                        <span className="text-[10px] text-gold font-bold">
                          {days > 0 ? `${days}D ${hours}H` : `${hours}H`}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Access Row - Rankings, Judges - 2 col now since Crews is in profile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Link to="/rankings">
              <div className="bg-surface-1/60 backdrop-blur border border-border/50 hover:border-gold/30 transition-colors p-4 group h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-display text-sm">RANKINGS</p>
                    <p className="text-[9px] text-muted-foreground">Global Index</p>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to="/judges">
              <div className="bg-gradient-to-br from-purple-500/10 to-surface-1/60 backdrop-blur border border-purple-500/30 hover:border-purple-400/50 transition-colors p-4 group h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-display text-sm text-purple-300">QOI JUDGES</p>
                    <p className="text-[9px] text-muted-foreground">Get rated</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-4"
        >
          <div className="bg-gradient-to-r from-surface-1/40 via-surface-1/60 to-surface-1/40 border border-border/30 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-xl text-gold">{stats.entries24h}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Entries 24h</p>
              </div>
              <div>
                <p className="font-display text-xl text-foreground">{stats.activeUsers}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Active Now</p>
              </div>
              <div>
                <p className="font-display text-xl text-foreground">{stats.totalCompeting || 0}</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Competing</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          WORLD LAYER - Dynamic Activity Feed
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 px-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <TrendingUp className="w-5 h-5 text-gold" />
              <motion.div 
                className="absolute inset-0"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-5 h-5 text-gold blur-sm" />
              </motion.div>
            </div>
            <h3 className="font-display text-lg">LIVE FEED</h3>
          </div>
          <Link to="/feed" className="text-[10px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
            FULL FEED <ArrowRight size={10} />
          </Link>
        </div>
        
        {/* Elegant feed container with subtle glass effect */}
        <div className="relative">
          {/* Subtle glow behind */}
          <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.02] to-transparent rounded-sm" />
          
          <ActivityFeed limit={6} compact />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          JUDGE ECONOMY - Live Reviews Feed
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-6"
      >
        <JudgeReviewsFeed />
      </motion.div>

      {/* Invite CTA - Subtle but present */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-8 px-4"
      >
        <button
          onClick={() => setInviteModalOpen(true)}
          className="w-full bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 border border-gold/30 hover:border-gold/60 transition-colors p-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-gold" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm text-gold">INVITE FRIENDS</p>
              <p className="text-[9px] text-muted-foreground">Earn +170 XP per invite</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}
