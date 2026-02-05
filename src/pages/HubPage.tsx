import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel, Gift,
  ChevronRight, Plus, Infinity as InfinityIcon, Star, Swords
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealEvents, useGlobalStats, useActiveSession, useRealRankings } from '@/hooks/useRealData';
import { useUserActivityStats } from '@/hooks/useUserActivityStats';
import { useTempProfile } from '@/hooks/useTempProfile';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useSanctionedTournaments } from '@/hooks/useSanctionedTournaments';
import { useBattles } from '@/hooks/useBattles';
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
  const { tournaments: sanctionedTournaments } = useSanctionedTournaments();
  const activityStats = useUserActivityStats(user?.id);
  const navigate = useNavigate();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [judgeReviewCount, setJudgeReviewCount] = useState(0);
  const [userCrew, setUserCrew] = useState<UserCrew | null>(null);
  
  useActiveSession();
  
  const displayUsername = profile?.username || tempProfile?.username || (isGuest ? 'Guest' : 'EDITOR');
  const displayAvatar = profile?.avatar_url || tempProfile?.avatarUrl;

  const globalRank = rankings.findIndex(r => r.id === user?.id) + 1 || null;

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
  
  // Sanctioned tournaments that are active (approved, ready_up, live, bracket)
  const activeSanctioned = sanctionedTournaments.filter(t => 
    ['approved', 'ready_up', 'live', 'bracket'].includes(t.status)
  );
  
  // 1v1 Battles that are featured (pending open, active, or judging)
  const { battles } = useBattles(['pending', 'active', 'judging']);
  const featuredBattles = battles.filter(b => 
    b.status === 'pending' || b.status === 'active' || b.status === 'judging'
  ).slice(0, 5); // Limit to 5 most recent
  
  // Total featured count for header
  const totalFeatured = liveEvents.length + activeSanctioned.length + featuredBattles.length;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <LoopMonster />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - Profile Card (Original expanded version)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <div className="absolute inset-0 h-[420px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
          
          {/* Arena-inspired animated color layers */}
          <motion.div 
            className="absolute -left-20 top-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 30, 0],
              y: [0, 20, 0],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -right-20 top-10 w-64 h-64 bg-gradient-to-bl from-cyan-500/15 via-blue-500/12 to-purple-500/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -25, 0],
              y: [0, 15, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          {/* Subtle center blend */}
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_center_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)]" />
          
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="relative px-4 pt-8 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-surface-1/80 backdrop-blur-xl border border-border/50 overflow-hidden">
              {/* Top Row: Avatar + Identity + Shop Balance */}
              <div className="p-4 flex items-start justify-between gap-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 group text-left"
                >
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
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-lg">
                      <span className="font-display text-xs text-foreground">{profile?.level || 1}</span>
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

                <Link to="/shop" className="group shrink-0">
                  <div className="flex items-center gap-2 bg-surface-1 border border-border hover:border-gold/50 px-3 py-2 transition-colors">
                    <div className="w-9 h-9 bg-muted/50 border border-border flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                      <ShoppingBag className="w-4 h-4 text-foreground group-hover:text-gold transition-colors" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-gold" />
                        <span className="font-display text-xl text-foreground leading-none">
                          {(profile as any)?.spendable_index || 0}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">INDEX</p>
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
                    <p className="font-display text-xl text-foreground">{activityStats.totalEvents}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Events</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{activityStats.totalWins}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Wins</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{bestScore?.toFixed(0) || '—'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Best QOI</p>
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground">{activityStats.totalEvents > 0 ? `${activityStats.winRate.toFixed(0)}%` : '—'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Win Rate</p>
                  </div>
                </div>
              </div>

              {/* Quick Access Rows - Unit & GQT */}
              <div className="border-t border-border/30 divide-y divide-border/20">
                <div className="px-4 py-3">
                  {userCrew ? (
                    <Link to={`/crews/${userCrew.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                          {userCrew.avatar_url ? (
                            <img src={userCrew.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users2 className="w-5 h-5 text-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Your Unit</p>
                          <p className="font-display text-base text-foreground group-hover:text-gold transition-colors">{userCrew.name}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ) : (
                    <Link to="/crews" className="flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Join a Unit</p>
                          <p className="text-base text-foreground group-hover:text-gold transition-colors font-medium">Find your group</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  )}
                </div>

                <div className="px-4 py-3">
                  <Link to="/gqt" className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border flex items-center justify-center group-hover:border-gold/50 transition-colors">
                        <Target className="w-5 h-5 text-foreground group-hover:text-gold transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-semibold">Global QOI Test</p>
                        <p className="font-display text-base text-foreground group-hover:text-gold transition-colors">
                          {bestScore ? `Best: ${bestScore.toFixed(0)}` : 'Get your score'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          🔥 ARENA CTA - Premium gateway
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="px-4 mt-1"
      >
        <Link to="/arena" className="block group">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-surface-1 via-background to-transparent group-hover:border-white/20 transition-colors">
            {/* One-sided shiny glow effect */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold/15 via-purple-500/10 to-transparent" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 bg-gold/20 rounded-full blur-2xl group-hover:bg-gold/30 transition-colors" />
            
            {/* Content */}
            <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Arena Icon - Vibrant offset layers */}
                  <div className="relative flex items-center justify-center">
                    {/* Left offset layer - vibrant gold/orange */}
                    <div className="absolute w-12 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-[6px] -translate-x-[4px] shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                    {/* Right offset layer - vibrant blue/purple */}
                    <div className="absolute w-12 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-[6px] translate-x-[4px] shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                    {/* Main icon container - white bg, black icon */}
                    <div className="relative w-12 h-10 bg-white rounded-[6px] flex items-center justify-center group-active:scale-95 transition-transform">
                      <InfinityIcon className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="font-display text-2xl tracking-wide text-foreground group-hover:text-gold transition-colors duration-300">ARENA</h2>
                    <p className="text-xs text-muted-foreground font-medium">Enter the competition</p>
                  </div>
                </div>
                
                {/* Enter Button - Subtle Gold Glitch Style */}
                <div className="shrink-0 relative">
                  {/* Left offset layer - vibrant gold/orange */}
                  <div className="absolute h-full w-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-[6px] -translate-x-[3px] shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                  {/* Right offset layer - vibrant blue/purple */}
                  <div className="absolute h-full w-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-[6px] translate-x-[3px] shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  {/* Main button - white bg, black text */}
                  <div className="relative bg-white text-black font-display text-xs px-5 py-2.5 rounded-[6px] group-hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2">
                      <span>ENTER NOW</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          📺 FEATURED SECTION - Official events + Sanctioned tournaments
      ═══════════════════════════════════════════════════════════════════ */}
      {totalFeatured > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 relative"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 10px,
                  hsl(var(--foreground)) 10px,
                  hsl(var(--foreground)) 11px
                )`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Section Header */}
          <div className="relative flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h3 className="font-display text-sm text-foreground">FEATURED</h3>
              <span className="text-[9px] text-muted-foreground">({totalFeatured} active)</span>
            </div>
            <Link to="/arena" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
              VIEW ALL <ArrowRight size={10} />
            </Link>
          </div>
          
          {/* Horizontal Carousel - Official events FIRST, then Sanctioned */}
          <div className="relative flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-2">
            {/* Official Live Events - Priority */}
            {liveEvents.map((event, i) => (
              <Link key={event.id} to={`/event/${event.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="w-[220px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-emerald-500/50 transition-colors overflow-hidden group"
                >
                  {/* Event Poster */}
                  {event.poster_url && (
                    <div className="h-24 overflow-hidden relative">
                      <img 
                        src={event.poster_url} 
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
                      
                      {/* Live badge */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-emerald-500/90 px-1.5 py-0.5 rounded-sm">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        <span className="text-[7px] font-bold text-white uppercase tracking-wider">Live</span>
                      </div>
                      
                      {/* Official badge */}
                      <div className="absolute bottom-1.5 left-1.5 bg-gold/90 px-1.5 py-0.5 rounded-sm">
                        <span className="text-[7px] font-bold text-background uppercase tracking-wider">Official</span>
                      </div>
                      
                      {/* Prize pool */}
                      {event.prize_pool && (
                        <div className="absolute top-1.5 right-1.5 bg-background/80 border border-gold/50 px-1.5 py-0.5 rounded-sm">
                          <span className="text-[8px] font-bold text-gold">{event.prize_pool}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Event Info */}
                  <div className="p-2.5">
                    <p className="font-display text-xs text-foreground truncate">{event.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-gold uppercase tracking-wider">{event.league} League</span>
                      <div className="text-[9px] text-muted-foreground">
                        <CountdownTimer endDate={event.end_date} expiredLabel="Awaiting..." />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            
            {/* Sanctioned Tournaments - After official events */}
            {activeSanctioned.map((tournament, i) => (
              <Link key={tournament.id} to={`/sanctioned/${tournament.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + (liveEvents.length + i) * 0.05 }}
                  className="w-[220px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-purple-500/50 transition-colors overflow-hidden group"
                >
                  {/* Tournament Poster or Gradient */}
                  <div className="h-24 overflow-hidden relative bg-gradient-to-br from-purple-900/50 to-surface-1">
                    {tournament.poster_url ? (
                      <img 
                        src={tournament.poster_url} 
                        alt={tournament.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Swords className="w-8 h-8 text-purple-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
                    
                    {/* Status badge */}
                    <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${
                      tournament.status === 'live' || tournament.status === 'bracket' 
                        ? 'bg-purple-500/90' 
                        : 'bg-amber-500/90'
                    }`}>
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                        {tournament.status === 'approved' ? 'Lobby' : 
                         tournament.status === 'ready_up' ? 'Ready Up' :
                         tournament.status === 'bracket' ? 'Bracket' : 'Live'}
                      </span>
                    </div>
                    
                    {/* Sanctioned label */}
                    <div className="absolute bottom-1.5 left-1.5 bg-purple-500/90 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">Sanctioned</span>
                    </div>
                    
                    {/* Player count */}
                    <div className="absolute top-1.5 right-1.5 bg-background/80 border border-border/50 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[8px] font-medium text-foreground">{tournament.player_count}/{tournament.max_players}</span>
                    </div>
                  </div>
                  
                  {/* Tournament Info */}
                  <div className="p-2.5">
                    <p className="font-display text-xs text-foreground truncate">{tournament.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-purple-400 uppercase tracking-wider">{tournament.crew_name}</span>
                      <span className="text-[9px] text-muted-foreground">{tournament.format_type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            
            {/* 1v1 Battles - After sanctioned tournaments */}
            {featuredBattles.map((battle, i) => (
              <Link key={battle.id} to={`/battle/${battle.id}`} className="shrink-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + (liveEvents.length + activeSanctioned.length + i) * 0.05 }}
                  className="w-[220px] bg-surface-1/80 backdrop-blur border border-border/50 hover:border-red-500/50 transition-colors overflow-hidden group"
                >
                  {/* VS Display Header */}
                  <div className="h-24 overflow-hidden relative bg-gradient-to-br from-red-900/50 via-surface-2 to-surface-1">
                    <div className="absolute inset-0 flex items-center justify-center px-4">
                      {/* Challenger */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-2 border-red-500/50 bg-red-500/20 flex items-center justify-center overflow-hidden">
                          {battle.challenger_avatar_url ? (
                            <img src={battle.challenger_avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display text-sm text-red-400">
                              {battle.challenger_username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-foreground mt-1 truncate max-w-[70px]">
                          {battle.challenger_username}
                        </span>
                      </div>
                      
                      {/* VS Badge */}
                      <div className="relative mx-2">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                          <Swords className="w-4 h-4 text-white" />
                        </div>
                        {battle.status === 'active' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>
                      
                      {/* Opponent */}
                      <div className="flex-1 flex flex-col items-center">
                        {battle.opponent_id ? (
                          <>
                            <div className="w-12 h-12 rounded-full border-2 border-red-500/50 bg-red-500/20 flex items-center justify-center overflow-hidden">
                              {battle.opponent_avatar_url ? (
                                <img src={battle.opponent_avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display text-sm text-red-400">
                                  {battle.opponent_username?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-foreground mt-1 truncate max-w-[70px]">
                              {battle.opponent_username}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-red-500/30 flex items-center justify-center bg-surface-2">
                              <span className="text-lg text-red-400/50">?</span>
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-1">Open</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-sm ${
                      battle.status === 'active' ? 'bg-red-500/90' :
                      battle.status === 'judging' ? 'bg-purple-500/90' : 'bg-amber-500/90'
                    }`}>
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">
                        {battle.status === 'pending' ? 'Open' : 
                         battle.status === 'active' ? 'Live' : 'Judging'}
                      </span>
                    </div>
                    
                    {/* 1v1 label */}
                    <div className="absolute bottom-1.5 left-1.5 bg-red-500/90 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[7px] font-bold text-white uppercase tracking-wider">1v1 Battle</span>
                    </div>
                    
                    {/* Prize */}
                    <div className="absolute top-1.5 right-1.5 bg-background/80 border border-gold/50 px-1.5 py-0.5 rounded-sm">
                      <span className="text-[8px] font-bold text-gold">+{battle.winner_index_awarded} IDX</span>
                    </div>
                  </div>
                  
                  {/* Battle Info */}
                  <div className="p-2.5">
                    <p className="font-display text-xs text-foreground truncate">
                      {battle.challenger_username} vs {battle.opponent_username || '???'}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[8px] text-red-400 uppercase tracking-wider">{battle.duration_hours}h Battle</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{battle.league_tier}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK MENU - Soft rounded white pills
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-4"
      >
        <div className="bg-surface-1/40 backdrop-blur-sm rounded-2xl p-2 border border-white/5">
          <div className="grid grid-cols-4 gap-1.5">
            <Link to="/rankings" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Trophy className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Rankings</span>
              </div>
            </Link>
            
            <Link to="/judges" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Gavel className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Judges</span>
              </div>
            </Link>
            
            <Link to="/crews" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Users2 className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Crews</span>
              </div>
            </Link>
            
            <Link to="/shop" className="group">
              <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  <Gift className="w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">Shop</span>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          GLOBAL PULSE - Stats Strip (minimal)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
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
          ACTIVITY SECTION - Unified container for Feed + Reviews
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6"
      >
        {/* Section Header */}
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gold rounded-full" />
            <h2 className="font-display text-lg text-foreground">ACTIVITY</h2>
          </div>
        </div>

        {/* Unified container with shared border */}
        <div className="mx-4 bg-surface-1/40 border border-border/30 overflow-hidden">
          {/* Live Feed Section */}
          <div className="p-4 border-b border-border/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                <span className="text-xs text-foreground font-medium uppercase tracking-wide">Live Feed</span>
              </div>
              <Link to="/feed" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                VIEW ALL <ArrowRight size={10} />
              </Link>
            </div>
            <ActivityFeed limit={5} compact />
          </div>

          {/* Reviews Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-foreground font-medium uppercase tracking-wide">Reviews</span>
              </div>
              <Link to="/judges" className="text-[9px] text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                ALL JUDGES <ArrowRight size={10} />
              </Link>
            </div>
            {/* Inline reviews carousel without external container styling */}
            <JudgeReviewsFeed embedded />
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          INVITE FRIENDS - Subtle inline CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
