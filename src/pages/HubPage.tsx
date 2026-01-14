import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Trophy, MessageCircle, Zap, ArrowRight, Shield, Crown, Users, ShoppingBag, Coins, Activity, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import CountdownTimer from '@/components/loopgate/CountdownTimer';
import { useRealEvents, useGlobalStats, useActiveSession } from '@/hooks/useRealData';
import LoopMonster from '@/components/loopgate/LoopMonster';
import ActivityFeed from '@/components/loopgate/ActivityFeed';
import InviteModal from '@/components/loopgate/InviteModal';
import GQTCard from '@/components/loopgate/GQTCard';
const leagueConfig = {
  elite: {
    label: 'Elite League',
    icon: Crown,
    color: 'text-gold',
    bg: 'bg-gold/10',
    border: 'border-gold',
    description: 'Top 1% of global rankings',
  },
  pro: {
    label: 'Pro League',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400',
    description: 'Top 15% with event wins',
  },
  open: {
    label: 'Open League',
    icon: Users,
    color: 'text-muted-foreground',
    bg: 'bg-muted/20',
    border: 'border-border',
    description: 'All competitors welcome',
  },
};

export default function HubPage() {
  const { profile } = useAuth();
  const { events, loading: eventsLoading } = useRealEvents();
  const { stats, loading: statsLoading } = useGlobalStats();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Keep session active
  useActiveSession();

  // Get user's league
  const userLeague = (profile?.league?.toLowerCase() || 'open') as keyof typeof leagueConfig;
  const league = leagueConfig[userLeague] || leagueConfig.open;
  const LeagueIcon = league.icon;

  // Find the primary live event
  const liveEvent = events.find(e => e.status === 'live');
  const upcomingEvents = events.filter(e => e.status === 'pending').slice(0, 2);

  // Build real activity based on actual data
  const recentActivity = stats.entries24h > 0 ? [
    { type: 'submission', text: `${stats.entries24h} edits submitted in the last 24h`, time: 'Live' },
    { type: 'judging', text: liveEvent ? `Judging in progress for ${liveEvent.title}` : 'No active judging', time: liveEvent ? 'Active' : 'Inactive' },
    { type: 'update', text: 'Rankings updated', time: 'Live' },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Loop Monster - appears when pulling down from top (Snapchat-style) */}
      <LoopMonster />
      {/* Welcome Header */}
      <div className="px-4 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
            Welcome back
          </p>
          <h1 className="font-display text-3xl text-gold">{profile?.username || 'EDITOR'}</h1>
        </motion.div>
      </div>

      {/* Global QOI Test Card - THE GENERATIONAL TOOL */}
      <div className="px-4 mb-6">
        <GQTCard />
      </div>

      {/* League Status Card */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${league.bg} border ${league.border} p-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${league.bg} border ${league.border} flex items-center justify-center`}>
                <LeagueIcon className={`w-5 h-5 ${league.color}`} />
              </div>
              <div>
                <p className={`font-display text-lg ${league.color}`}>{league.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{league.description}</p>
              </div>
            </div>
            <Link to="/rankings" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View Ranks <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Live Event Card */}
      {liveEvent ? (
        <div className="px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-1 border border-border overflow-hidden"
          >
            {/* Live Badge */}
            <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-green-500 uppercase">Live Competition</span>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase block mb-2">
                    {liveEvent.league} League{liveEvent.category ? ` · ${liveEvent.category}` : ''}
                  </span>
                  <h2 className="font-display text-4xl text-gold">{liveEvent.title}</h2>
                </div>
                {liveEvent.prize_pool && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Prize Pool</p>
                    <p className="font-display text-2xl">{liveEvent.prize_pool}</p>
                  </div>
                )}
              </div>

              {/* Countdown */}
              <div className="bg-surface-0 border border-border p-4 mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 text-center">Ends In</p>
                <CountdownTimer endDate={liveEvent.end_date} large />
              </div>

              {/* Stats Row - Real Data */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="font-display text-2xl">{stats.entries24h}</p>
                  <p className="text-xs text-muted-foreground uppercase">Entries 24h</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl">{stats.activeUsers}</p>
                  <p className="text-xs text-muted-foreground uppercase">Active Now</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl">{stats.totalCompeting || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase">Competing</p>
                </div>
              </div>

              <Link to={`/event/${liveEvent.id}`}>
                <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-12">
                  <Play className="mr-2 w-5 h-5" />
                  View Event
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="px-4 mb-8">
          <div className="bg-surface-1 border border-border p-8 text-center">
            <p className="text-muted-foreground">No live events at the moment</p>
            <p className="text-xs text-muted-foreground mt-2">Check back soon for upcoming competitions</p>
          </div>
        </div>
      )}

      {/* Live Activity */}
      {recentActivity.length > 0 && (
        <div className="px-4 mb-8">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            Live Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-surface-1 border border-border p-4 flex items-center justify-between"
              >
                <p className="text-sm">{activity.text}</p>
                <span className={`text-xs font-semibold uppercase tracking-widest ${
                  activity.time === 'Live' ? 'text-green-500' : 
                  activity.time === 'Active' ? 'text-gold' : 'text-muted-foreground'
                }`}>
                  {activity.time}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Activations */}
      {upcomingEvents.length > 0 && (
        <div className="px-4 mb-8">
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Upcoming Activations
          </h3>
          <div className="space-y-2">
            {upcomingEvents.map((event, index) => {
              const startsIn = new Date(event.start_date).getTime() - Date.now();
              const days = Math.floor(startsIn / (1000 * 60 * 60 * 24));
              const hours = Math.floor((startsIn % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-surface-1 border border-border p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-display text-lg">{event.title}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{event.league} League</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-widest">
                      {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Events State */}
      {!eventsLoading && events.length === 0 && (
        <div className="px-4 mb-8">
          <div className="bg-surface-1 border border-border p-8 text-center">
            <p className="text-muted-foreground">No events scheduled yet</p>
          </div>
        </div>
      )}

      {/* Shop Banner */}
      <div className="px-4 mb-6">
        <Link to="/shop">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/50 p-4 flex items-center justify-between hover:border-gold transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/20 border border-gold/50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-lg text-gold">Shop</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Spend your INDEX on rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background/50 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-gold" />
                <span className="font-display text-gold">{(profile as any)?.spendable_index || 0}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gold" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Feed */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            Feed
          </h3>
          <Link to="/feed" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        <ActivityFeed limit={5} compact />
      </div>

      {/* Invite Friends CTA - Opens Full Modal */}
      <div className="px-4 mb-6">
        <motion.button
          onClick={() => setInviteModalOpen(true)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full bg-gradient-to-r from-gold via-gold/90 to-gold border-2 border-gold p-5 flex items-center justify-between hover:shadow-lg hover:shadow-gold/20 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-background/20 border border-background/30 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-background" />
            </div>
            <div className="text-left">
              <p className="font-display text-xl text-background">Invite Friends</p>
              <p className="text-xs text-background/80 uppercase tracking-widest">Earn XP for every friend who joins</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-background/20 px-3 py-1.5 text-xs font-bold text-background uppercase tracking-wider">
              +170 XP
            </span>
            <ArrowRight className="w-6 h-6 text-background group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </div>

      {/* Quick Links */}
      <div className="px-4">
        <h3 className="font-display text-xl mb-4">Quick Links</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/rankings">
            <div className="bg-surface-1 border border-border p-4 flex flex-col items-center text-center hover:border-gold/50 transition-colors">
              <Trophy className="w-6 h-6 text-gold mb-2" />
              <span className="font-display text-sm">Rankings</span>
            </div>
          </Link>
          <Link to="/arenas">
            <div className="bg-surface-1 border border-border p-4 flex flex-col items-center text-center hover:border-gold/50 transition-colors">
              <MessageCircle className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="font-display text-sm">Arenas</span>
            </div>
          </Link>
          <Link to="/shop">
            <div className="bg-surface-1 border border-gold/30 p-4 flex flex-col items-center text-center hover:border-gold/50 transition-colors">
              <ShoppingBag className="w-6 h-6 text-gold mb-2" />
              <span className="font-display text-sm">Shop</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Invite Modal - Same as header */}
      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
    </div>
  );
}
