import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Zap, Trophy, Users, Flame, IterationCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import { useRealRankings, useRealEvents, useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setGuest } = useGuestMode();
  const { rankings, loading: rankingsLoading } = useRealRankings();
  const { events } = useRealEvents();
  const { stats } = useGlobalStats();
  const [bannerVisible, setBannerVisible] = useState(false);
  
  const handleGuestExplore = () => {
    setGuest(true);
    navigate('/hub');
  };
  
  // Get top 3 editors from real data
  const topEditors = rankings.slice(0, 3);
  
  // Find the primary live event
  const liveEvent = events.find(e => e.status === 'live');

  return (
    <>
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div className="min-h-screen bg-background text-foreground">
        <SEO {...pageSEO.home} />
        <LandingHeader bannerVisible={bannerVisible} />

        {/* Hero Section - Cinematic & Minimal */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/3 rounded-full blur-[150px]" />
          
          <motion.div 
            className="relative z-10 text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-7xl md:text-[5.5rem] leading-[0.95] tracking-tight mb-4">
              The Editor Index.
            </h1>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-tight text-gold mb-8">
              Prove Your Rank.
            </h2>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Compete in events. Get rated by judges. Climb the global rankings.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link to="/start">
                <Button 
                  size="lg" 
                  className="bg-gold hover:bg-gold/90 text-background font-display text-lg sm:text-xl px-8 py-6 h-auto min-w-[200px]"
                >
                  <Target className="mr-2 h-5 w-5" />
                  Rate My Edit
                </Button>
              </Link>
              <Link to="/gqt">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-border bg-surface-0 hover:bg-surface-1 font-display text-lg sm:text-xl px-8 py-6 h-auto min-w-[200px]"
                >
                  Take QOI Test
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Guest explore link */}
            <button 
              onClick={handleGuestExplore}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Explore as Guest
            </button>
          </motion.div>

          {/* Live stats pill */}
          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-5 py-2.5 bg-surface-0/80 backdrop-blur-sm border border-border rounded-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats.activeUsers.toLocaleString()} Active</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">{stats.entries24h} edits today</span>
            </div>
            {liveEvent && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-status-live rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-status-live">Live Event</span>
                </div>
              </>
            )}
          </motion.div>
        </section>

        {/* Features Grid - Clean and Bold */}
        <section className="py-20 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Trophy, 
                  title: 'Arena', 
                  desc: 'Official events, open arenas, and crew tournaments. Real competition.' 
                },
                { 
                  icon: Target, 
                  title: 'QOI Score', 
                  desc: 'Get rated by certified judges on a 100-point scale. Know your Class.' 
                },
                { 
                  icon: IterationCcw, 
                  title: 'Loop Feed', 
                  desc: 'Watch top edits. See what S++ looks like. Get inspired.' 
                },
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  className="group bg-surface-0 border border-border p-6 hover:border-gold/30 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <item.icon className="w-8 h-8 text-gold mb-4" />
                  <h3 className="font-display text-2xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Editors - Compact */}
        <section className="py-20 px-4 bg-surface-0 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl sm:text-4xl">Top Editors</h2>
              <Link to="/start" className="text-gold hover:text-gold/80 text-sm font-semibold uppercase tracking-widest">
                View All →
              </Link>
            </div>
            
            <div className="space-y-3">
              {rankingsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : topEditors.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="mb-4">No editors ranked yet. Be the first.</p>
                  <Link to="/start">
                    <Button className="bg-gold hover:bg-gold/90 text-background font-display">
                      Claim #1
                    </Button>
                  </Link>
                </div>
              ) : (
                topEditors.map((editor, index) => (
                  <motion.div
                    key={editor.id}
                    className={`flex items-center justify-between p-4 bg-background border border-border ${
                      index === 0 ? 'border-gold/30' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-display text-2xl w-8 ${
                        index === 0 ? 'text-gold' : 'text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-sm font-display">
                          {editor.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={`font-display text-lg ${index === 0 ? 'text-gold' : ''}`}>
                          {editor.username}
                        </p>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {editor.league} League
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-xl ${index === 0 ? 'text-gold' : ''}`}>
                        {editor.global_index_score.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Index</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* QOI Test CTA */}
        <section id="qoi-section" className="py-24 px-4 border-t border-border relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
          
          <div className="max-w-3xl mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 mb-6">
                <Zap className="w-4 h-4 text-gold" />
                <span className="text-xs font-semibold tracking-widest uppercase text-gold">Free Test</span>
              </div>
              
              <h2 className="font-display text-4xl sm:text-5xl mb-4">
                What's Your <span className="text-gold">Class</span>?
              </h2>
              
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Submit any edit. Get judged on 5 pillars. Find out if you're F-tier or S++ in under 48 hours.
              </p>
              
              {/* Class badges preview */}
              <div className="flex justify-center gap-2 mb-8 flex-wrap">
                {['S++', 'S+', 'S', 'A', 'B', 'C', 'D', 'F'].map((tier, i) => (
                  <span 
                    key={tier}
                    className={`px-3 py-1 text-sm font-display border ${
                      i === 0 ? 'border-gold text-gold bg-gold/10' :
                      i < 3 ? 'border-gold/50 text-gold/70' :
                      'border-border text-muted-foreground'
                    }`}
                  >
                    {tier}
                  </span>
                ))}
              </div>
              
              <Link to="/gqt">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-display text-lg px-8 py-6 h-auto">
                  <Target className="mr-2 h-5 w-5" />
                  Take the QOI Test
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-surface-0 border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl mb-4">
              Ready to Compete?
            </h2>
            <p className="text-muted-foreground mb-8">
              Create your profile and join the global editor index.
            </p>
            <Link to="/start">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-display text-lg px-8 py-6 h-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer - Minimal */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground">About</Link>
                <Link to="/how-it-works" className="text-xs text-muted-foreground hover:text-foreground">How It Works</Link>
                <Link to="/rules" className="text-xs text-muted-foreground hover:text-foreground">Rules</Link>
                <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
                <Link to="/support" className="text-xs text-muted-foreground hover:text-foreground">Support</Link>
              </div>
              <div className="text-xs text-muted-foreground">
                LOOPGATE © {new Date().getFullYear()}
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link 
                to="/enterprise" 
                className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors"
              >
                Enterprise
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
