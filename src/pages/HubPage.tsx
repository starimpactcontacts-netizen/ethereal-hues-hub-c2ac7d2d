import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Trophy, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import CountdownTimer from '@/components/loopgate/CountdownTimer';

const upcomingActivations = [
  { id: 'velocity-cut', name: 'Velocity Cut', league: 'Pro League', startsIn: '3d 12h' },
  { id: 'sync-masters', name: 'Sync Masters', league: 'Open League', startsIn: '5d 8h' },
];

const recentActivity = [
  { type: 'submission', text: '847 edits submitted in the last 24h', time: 'Live' },
  { type: 'judging', text: 'Judging in progress for #LOOPGATE', time: 'Active' },
  { type: 'update', text: 'Rankings updated', time: '2m ago' },
];

export default function HubPage() {
  const { profile } = useAuth();
  const eventEndDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-background pb-24">
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

      {/* Live Event Card */}
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
                  Open League · Film
                </span>
                <h2 className="font-display text-4xl text-gold">#LOOPGATE</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Prize Pool</p>
                <p className="font-display text-2xl">$10,000</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-surface-0 border border-border p-4 mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 text-center">Ends In</p>
              <CountdownTimer endDate={eventEndDate.toISOString()} large />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="font-display text-2xl">847</p>
                <p className="text-xs text-muted-foreground uppercase">Entries</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl">12</p>
                <p className="text-xs text-muted-foreground uppercase">Judges</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl">94</p>
                <p className="text-xs text-muted-foreground uppercase">Countries</p>
              </div>
            </div>

            <Link to="/event/loopgate">
              <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg h-12">
                <Play className="mr-2 w-5 h-5" />
                View Event
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Live Activity */}
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

      {/* Upcoming Activations */}
      <div className="px-4 mb-8">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Upcoming Activations
        </h3>
        <div className="space-y-2">
          {upcomingActivations.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-surface-1 border border-border p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="font-display text-lg">{event.name}</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{event.league}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-widest">
                  {event.startsIn}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4">
        <h3 className="font-display text-xl mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/rankings">
            <div className="bg-surface-1 border border-border p-4 flex flex-col items-center text-center hover:border-gold/50 transition-colors">
              <Trophy className="w-6 h-6 text-gold mb-2" />
              <span className="font-display text-sm">Rankings</span>
            </div>
          </Link>
          <Link to="/leagues">
            <div className="bg-surface-1 border border-border p-4 flex flex-col items-center text-center hover:border-gold/50 transition-colors">
              <Users className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="font-display text-sm">Leagues</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
