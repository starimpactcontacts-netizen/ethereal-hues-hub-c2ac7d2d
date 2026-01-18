import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Target, ArrowRight, Crown, Shield, Users, Trophy, 
  Users2, Zap, TrendingUp, Star, Coins, ShoppingBag, Gavel
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRealEvents, useGlobalStats, useActiveSession } from '@/hooks/useRealData';
import LoopMonster from '@/components/loopgate/LoopMonster';
import ActivityFeed from '@/components/loopgate/ActivityFeed';
import InviteModal from '@/components/loopgate/InviteModal';
import CountdownTimer from '@/components/loopgate/CountdownTimer';

const leagueConfig = {
  cartel: { label: 'CARTEL', icon: Crown, gradient: 'from-gold via-amber-400 to-gold', glow: 'shadow-gold/30' },
  elite: { label: 'ELITE', icon: Crown, gradient: 'from-gold to-amber-500', glow: 'shadow-gold/20' },
  pro: { label: 'PRO', icon: Shield, gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/20' },
  open: { label: 'OPEN', icon: Users, gradient: 'from-zinc-500 to-zinc-600', glow: 'shadow-zinc-500/10' },
};

export default function HubPage() {
  const { profile } = useAuth();
  const { events } = useRealEvents();
  const { stats } = useGlobalStats();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  useActiveSession();

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
          {/* User Identity + Shop Balance Row */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            {/* Left: User Identity Badge */}
            <div className="flex items-center gap-3">
              {/* Avatar with league ring */}
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${league.gradient} p-[2px] shadow-lg ${league.glow}`}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-xl text-foreground">
                        {profile?.username?.charAt(0).toUpperCase() || 'E'}
                      </span>
                    )}
                  </div>
                </div>
                {/* League indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${league.gradient} flex items-center justify-center shadow-lg`}>
                  <LeagueIcon className="w-3 h-3 text-background" />
                </div>
              </div>
              
              <div>
                <h1 className="font-display text-2xl text-foreground leading-none">
                  {profile?.username || 'EDITOR'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r ${league.gradient} bg-clip-text text-transparent`}>
                    {league.label} LEAGUE
                  </span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">LVL {profile?.level || 1}</span>
                </div>
              </div>
            </div>

            {/* Right: Shop Balance */}
            <Link to="/shop" className="group">
              <div className="flex items-center gap-2 bg-surface-1/80 backdrop-blur border border-border hover:border-gold/50 px-3 py-2 transition-colors">
                <div className="w-8 h-8 bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-gold" />
                    <span className="font-display text-lg text-gold leading-none">
                      {(profile as any)?.spendable_index || 0}
                    </span>
                  </div>
                  <p className="text-[8px] text-muted-foreground uppercase tracking-widest">INDEX</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════════
              PRIMARY ACTION - Global QOI Test Spotlight
          ═══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/gqt" className="block">
              <div className="relative group">
                {/* Outer glow container */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-gold/50 via-gold to-gold/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
                
                {/* Main card with glass effect */}
                <div className="relative bg-gradient-to-br from-surface-1/95 via-surface-0/95 to-background/95 backdrop-blur-xl border border-gold/30 overflow-hidden">
                  {/* Inner gold accent line */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  
                  {/* Hazard pattern subtle overlay */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(43 74% 49%) 20px, hsl(43 74% 49%) 40px)',
                      }}
                    />
                  </div>
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gold/10 border border-gold/30 mb-3">
                          <Zap className="w-3 h-3 text-gold" />
                          <span className="text-[9px] font-bold tracking-widest text-gold uppercase">Featured</span>
                        </div>
                        
                        <h2 className="font-display text-3xl text-gold mb-1">GLOBAL QOI TEST</h2>
                        <p className="text-sm text-muted-foreground italic">"Submit an edit. Get your score."</p>
                      </div>
                      
                      {/* Target icon with animation */}
                      <div className="relative">
                        <motion.div 
                          className="w-16 h-16 border-2 border-gold/50 flex items-center justify-center"
                          animate={{ rotate: [0, 5, 0, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <Target className="w-8 h-8 text-gold" />
                        </motion.div>
                        {/* Ping effect */}
                        <div className="absolute inset-0 border-2 border-gold/30 animate-ping opacity-20" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-border/50">
                      {bestScore ? (
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Your Best</p>
                            <p className="font-display text-2xl text-gold">{bestScore.toFixed(1)}</p>
                          </div>
                          <div className="w-px h-8 bg-border" />
                          <span className="text-[10px] text-muted-foreground">Beat your score →</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">
                          Get real feedback on your edits
                        </span>
                      )}
                      
                      <Button className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-background font-display h-10 px-6 group-hover:shadow-lg group-hover:shadow-gold/30 transition-shadow">
                        START TEST
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
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

        {/* Quick Access Row - Rankings, Crews */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-4"
        >
          <div className="grid grid-cols-3 gap-2">
            <Link to="/rankings">
              <div className="bg-surface-1/60 backdrop-blur border border-border/50 hover:border-gold/30 transition-colors p-3 group h-full">
                <Trophy className="w-5 h-5 text-gold mb-2" />
                <p className="font-display text-xs">RANKINGS</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">Global Index</p>
              </div>
            </Link>
            
            <Link to="/judges">
              <div className="bg-gradient-to-br from-purple-500/10 to-surface-1/60 backdrop-blur border border-purple-500/30 hover:border-purple-400/50 transition-colors p-3 group h-full">
                <Gavel className="w-5 h-5 text-purple-400 mb-2" />
                <p className="font-display text-xs text-purple-300">QOI JUDGES</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">Get rated</p>
              </div>
            </Link>
            
            <Link to="/crews">
              <div className="bg-surface-1/60 backdrop-blur border border-border/50 hover:border-gold/30 transition-colors p-3 group h-full">
                <Users2 className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="font-display text-xs">CREWS</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">Join a team</p>
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
