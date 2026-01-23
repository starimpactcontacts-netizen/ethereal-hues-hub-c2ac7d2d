import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, TrendingUp, Coins, ShoppingBag, Gavel,
  ChevronRight, Plus, Infinity as InfinityIcon, Star
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

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <LoopMonster />
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO LAYER - Profile Card (Original expanded version)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <div className="absolute inset-0 h-[420px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-1 via-background to-background" />
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_hsl(43_74%_49%_/_0.08)_0%,_transparent_60%)]" />
          <motion.div 
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_hsl(43_74%_49%_/_0.05)_0%,_transparent_50%)]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="relative px-4 pt-10 pb-6">
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
                    <p className="font-display text-lg text-foreground">{bestScore?.toFixed(0) || '—'}</p>
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
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Your Crew</p>
                          <p className="font-display text-sm text-foreground group-hover:text-gold transition-colors">{userCrew.name}</p>
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
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Join a Crew</p>
                          <p className="text-sm text-foreground group-hover:text-gold transition-colors">Find your squad</p>
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
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Global QOI Test</p>
                        <p className="font-display text-sm text-foreground group-hover:text-gold transition-colors">
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
          🔥 ARENA CTA - CLEAN GATEWAY (No event mixed in)
      ═══════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════
          🔥 COMPACT ARENA CTA + FEATURED (Impact Density)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 mt-2"
      >
        {/* Main Arena Button - Slimmer */}
        <Link to="/arena" className="block group">
          <div className="relative overflow-hidden border-2 border-gold/50 hover:border-gold bg-gradient-to-r from-gold/5 via-background to-gold/5 transition-all">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-gold via-amber-400 to-gold rounded-lg flex items-center justify-center shadow-lg shadow-gold/40">
                  <InfinityIcon className="w-5 h-5 text-background" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground leading-none">ARENA</h2>
                  <p className="text-xs text-muted-foreground">Compete now</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gold to-amber-400 text-background font-display text-xs px-4 py-2 flex items-center gap-1.5">
                <span>ENTER</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        {/* Featured Events - Compact inline row */}
        {liveEvents.length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
            {liveEvents.slice(0, 4).map((event) => (
              <Link key={event.id} to={`/event/${event.id}`} className="shrink-0 group/card">
                <div className="flex items-center gap-2 bg-surface-1/60 border border-border/50 hover:border-gold/40 px-2.5 py-1.5 transition-colors">
                  {event.poster_url && (
                    <img src={event.poster_url} alt="" className="w-8 h-10 object-cover rounded-sm" />
                  )}
                  <div className="max-w-[100px]">
                    <p className="font-display text-xs text-foreground truncate group-hover/card:text-gold transition-colors">
                      {event.title}
                    </p>
                    {event.prize_pool && (
                      <p className="text-[9px] text-gold">{event.prize_pool}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {liveEvents.length > 4 && (
              <Link to="/arena" className="text-[10px] text-muted-foreground hover:text-foreground shrink-0">
                +{liveEvents.length - 4} more
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK ACCESS ROW
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-4"
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
