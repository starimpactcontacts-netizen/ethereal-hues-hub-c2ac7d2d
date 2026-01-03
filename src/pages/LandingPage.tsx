import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import loopgateLogo from '@/assets/loopgate-logo-white.png';

const topEditors = [
  { rank: 1, alias: 'KXNE', score: 2847, league: 'elite' },
  { rank: 2, alias: 'VXLT', score: 2691, league: 'elite' },
  { rank: 3, alias: 'RXZE', score: 2534, league: 'pro' },
  { rank: 4, alias: 'NXVA', score: 2412, league: 'pro' },
  { rank: 5, alias: 'ZXRO', score: 2298, league: 'pro' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global Header */}
      <LandingHeader />
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-[72px]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-0 via-background to-background" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
        
        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-widest uppercase bg-gold/10 border border-gold/20 text-gold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Competition
            </span>
          </div>
          
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-none tracking-tight mb-6">
            Turn Editing Into<br />
            <span className="text-gold">A Competitive League</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The global ranking system for video editors. Compete in live events, 
            climb the index, and prove you're the best.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl px-8 py-6 h-auto">
                Enter Loopgate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-surface-1 border border-border p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                <span className="font-display text-2xl text-gold">01</span>
              </div>
              <h3 className="font-display text-2xl mb-3">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your editor profile and connect your TikTok account to verify your identity.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-surface-1 border border-border p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                <span className="font-display text-2xl text-gold">02</span>
              </div>
              <h3 className="font-display text-2xl mb-3">Submit Edits</h3>
              <p className="text-muted-foreground">
                Enter live competitions by submitting your best edits. Judges score on Quality, Originality, and Impact.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-surface-1 border border-border p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                <span className="font-display text-2xl text-gold">03</span>
              </div>
              <h3 className="font-display text-2xl mb-3">Rank Globally</h3>
              <p className="text-muted-foreground">
                Climb the global index, unlock higher leagues, and get discovered by studios worldwide.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Event Preview */}
      <section className="py-24 px-4 bg-surface-0 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl">Live Event</h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-widest uppercase bg-green-500/10 border border-green-500/20 text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Now
            </span>
          </div>
          
          <motion.div 
            className="bg-surface-1 border border-border p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2 block">
                  Open League · Film
                </span>
                <h3 className="font-display text-4xl sm:text-5xl text-gold mb-2">#LOOPGATE</h3>
                <p className="text-muted-foreground">Global Arena · $10,000 Prize Pool</p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Editors Competing</p>
                  <p className="font-display text-3xl">847</p>
                </div>
                <Link to="/auth">
                  <Button className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg">
                    <Play className="mr-2 h-4 w-4" />
                    View Event
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl">Global Rankings</h2>
            <Link to="/auth" className="text-gold hover:text-gold/80 text-sm font-semibold uppercase tracking-widest">
              View All →
            </Link>
          </div>
          
          <div className="bg-surface-1 border border-border divide-y divide-border">
            {topEditors.map((editor, index) => (
              <motion.div
                key={editor.alias}
                className="flex items-center justify-between p-4 sm:p-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-display text-2xl w-8 ${editor.rank === 1 ? 'text-gold' : 'text-muted-foreground'}`}>
                    {editor.rank}
                  </span>
                  <div>
                    <p className="font-display text-xl">{editor.alias}</p>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${
                      editor.league === 'elite' ? 'text-gold' : 'text-muted-foreground'
                    }`}>
                      {editor.league} League
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl">{editor.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Index</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-surface-0 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl mb-6">
            Ready to Compete?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Create your editor profile and join the global competition.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl px-8 py-6 h-auto">
              Create Your Profile
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-5" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/rules" className="hover:text-foreground">Rules</Link>
            <Link to="/support" className="hover:text-foreground">Support</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Loopgate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
