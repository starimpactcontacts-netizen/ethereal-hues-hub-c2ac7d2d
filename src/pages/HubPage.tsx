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
          COMPACT PROFILE CARD
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative px-4 pt-6 pb-2">
        <div className="absolute inset-0 h-32 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-surface-1/80 backdrop-blur-xl border border-border/50"
        >
          {/* Identity Row */}
          <div className="p-3 flex items-center justify-between gap-3">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2.5 group text-left min-w-0">
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${league.gradient} p-[2px] shadow-lg ${league.glow}`}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-lg text-foreground">{displayUsername?.charAt(0).toUpperCase() || 'E'}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-display text-foreground">
                  {profile?.level || 1}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display text-lg text-foreground leading-none truncate">{displayUsername}</h1>
                  {isJudge && <JudgeClassBadge reviewCount={judgeReviewCount} size="sm" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`inline-flex items-center gap-0.5 px-1 py-0.5 bg-gradient-to-r ${league.gradient} rounded-sm`}>
                    <LeagueIcon className="w-2.5 h-2.5 text-background" />
                    <span className="text-[8px] font-bold text-background uppercase">{league.label}</span>
                  </div>
                  {globalRank && globalRank <= 500 && (
                    <span className="text-[9px] text-gold font-bold">#{globalRank}</span>
                  )}
                </div>
              </div>
            </button>

            <Link to="/shop" className="shrink-0 flex items-center gap-1.5 bg-surface-1 border border-border hover:border-gold/50 px-2 py-1.5 transition-colors">
              <Coins className="w-3 h-3 text-gold" />
              <span className="font-display text-sm text-foreground">{(profile as any)?.spendable_index || 0}</span>
            </Link>
          </div>

          {/* Stats + XP in single row */}
          <div className="border-t border-border/30 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className="font-display text-sm text-foreground">{profile?.total_events || 0}</p>
                <p className="text-[7px] text-muted-foreground uppercase">Events</p>
              </div>
              <div>
                <p className="font-display text-sm text-foreground">{profile?.total_wins || 0}</p>
                <p className="text-[7px] text-muted-foreground uppercase">Wins</p>
              </div>
              <div>
                <p className="font-display text-sm text-foreground">{bestScore?.toFixed(0) || '—'}</p>
                <p className="text-[7px] text-muted-foreground uppercase">Best QOI</p>
              </div>
            </div>
            <div className="w-24">
              <XPProgressBar xp={profile?.xp || 0} level={profile?.level || 1} size="sm" />
            </div>
          </div>
        </motion.div>
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
          QUICK ACCESS - Single row grid
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-3 grid grid-cols-4 gap-2">
        {[
          { to: '/rankings', icon: Trophy, label: 'Rankings', color: 'gold' },
          { to: '/judges', icon: Gavel, label: 'Judges', color: 'purple-400' },
          { to: '/crews', icon: Users2, label: 'Crews', color: 'foreground' },
          { to: '/gqt', icon: Target, label: 'GQT', color: 'foreground' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className="bg-surface-1/50 border border-border/40 hover:border-gold/30 p-2.5 text-center transition-colors group">
            <Icon className={`w-4 h-4 mx-auto mb-1 text-${color} group-hover:text-gold transition-colors`} />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ACTIVITY - Compact feed preview
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Activity</span>
          <Link to="/feed" className="text-[9px] text-gold flex items-center gap-0.5">
            View all <ArrowRight size={10} />
          </Link>
        </div>
        <div className="bg-surface-1/40 border border-border/30 p-3">
          <ActivityFeed limit={4} compact />
        </div>
      </div>

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
