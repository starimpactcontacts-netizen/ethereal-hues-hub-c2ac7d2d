import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Trophy, Users, Flame, ChevronRight, Star, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import { useRealRankings, useRealEvents, useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import loopgateBrand from '@/assets/loopgate-brand.png';

// Class tier configuration
const tiers = [
  { tier: 'S++', color: '#D4AF37' },
  { tier: 'S+', color: '#D4AF37' },
  { tier: 'S', color: '#C4A030' },
  { tier: 'A', color: '#10B981' },
  { tier: 'B', color: '#06B6D4' },
  { tier: 'C', color: '#3B82F6' },
  { tier: 'D', color: '#F97316' },
  { tier: 'F', color: '#EF4444' },
];

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
  
  const topEditors = rankings.slice(0, 5);
  const liveEvent = events.find(e => e.status === 'live');

  return (
    <>
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <SEO {...pageSEO.home} />
        <LandingHeader bannerVisible={bannerVisible} />

        {/* Hero - Minimal, brand-focused */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
          {/* Subtle radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_45%,rgba(212,175,55,0.04),transparent)]" />
          
          <motion.div 
            className="relative z-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Brand wordmark - using actual image */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8 }}
            >
              <img 
                src={loopgateBrand} 
                alt="LOOPGATE" 
                className="h-20 sm:h-28 md:h-36 lg:h-44 mx-auto object-contain"
              />
            </motion.div>
            
            {/* Tagline */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              The Competitive Editing Index
            </motion.p>
            
            {/* Primary CTA */}
            <motion.div 
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link to="/start">
                <Button 
                  size="lg" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-base sm:text-lg px-10 py-6 h-auto tracking-wide"
                >
                  Enter
                </Button>
              </Link>
              
              <button 
                onClick={handleGuestExplore}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                or explore as guest
              </button>
            </motion.div>
          </motion.div>

          {/* Live stats - bottom */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{stats.activeUsers.toLocaleString()} active</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>{stats.entries24h} edits today</span>
            </div>
            {liveEvent && (
              <>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-status-live rounded-full animate-pulse" />
                  <span className="text-status-live">Live</span>
                </div>
              </>
            )}
          </motion.div>
        </section>

        {/* Divider line */}
        <div className="w-full h-px bg-border" />

        {/* What is Loopgate - Editorial style */}
        <section className="py-24 md:py-32 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-2xl sm:text-3xl md:text-4xl leading-relaxed text-foreground/90">
                A global ranking system for video editors. 
                <span className="text-muted-foreground"> Submit your work. Get scored by certified judges. See where you stand.</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Divider line */}
        <div className="w-full h-px bg-border" />

        {/* The Index - Leaderboard */}
        <section className="py-24 md:py-32 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="flex items-end justify-between mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div>
                <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-2">Global Rankings</p>
                <h2 className="text-3xl sm:text-4xl font-semibold">The Index</h2>
              </div>
              <Link 
                to="/start" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
            
            {rankingsLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto" />
              </div>
            ) : topEditors.length === 0 ? (
              <motion.div 
                className="py-20 text-center border border-border"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">No rankings yet</p>
                <Link to="/start">
                  <Button variant="outline">Be the first</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {topEditors.map((editor, index) => (
                  <motion.div
                    key={editor.id}
                    className={`group flex items-center justify-between p-5 border border-border hover:border-muted-foreground/30 transition-colors ${
                      index === 0 ? 'bg-foreground/[0.02]' : ''
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-5">
                      <span className={`w-8 text-center tabular-nums text-lg ${
                        index === 0 ? 'text-gold font-semibold' : 'text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      
                      <Avatar className={`w-10 h-10 ${index === 0 ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : ''}`}>
                        <AvatarImage src={editor.avatar_url || undefined} />
                        <AvatarFallback className="bg-surface-1 text-sm">
                          {editor.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className={`font-medium ${index === 0 ? 'text-gold' : ''}`}>
                          {editor.username}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{editor.league}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg tabular-nums ${index === 0 ? 'text-gold font-semibold' : ''}`}>
                        {editor.global_index_score.toFixed(0)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Divider line */}
        <div className="w-full h-px bg-border" />

        {/* QOI Classes */}
        <section className="py-24 md:py-32 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-2">Rating System</p>
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Your Class</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Every edit is scored on a 100-point scale. Your QOI score determines your class.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex justify-center gap-2 sm:gap-3 mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {tiers.map((t, i) => (
                <motion.div
                  key={t.tier}
                  className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border border-current/30 text-lg sm:text-xl font-semibold"
                  style={{ color: t.color, borderColor: `${t.color}40` }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  whileHover={{ scale: 1.05, borderColor: t.color }}
                >
                  {t.tier}
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/gqt">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-muted-foreground/30 hover:border-foreground hover:bg-foreground hover:text-background px-8 py-6 h-auto text-base transition-all"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Take the QOI Test
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-4">Free • Results in 48 hours</p>
            </motion.div>
          </div>
        </section>

        {/* Divider line */}
        <div className="w-full h-px bg-border" />

        {/* Final CTA */}
        <section className="py-32 md:py-40 px-4">
          <motion.div 
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <img 
              src={loopgateBrand} 
              alt="LOOPGATE" 
              className="h-14 sm:h-16 mx-auto mb-8 object-contain opacity-80"
            />
            <p className="text-lg text-muted-foreground mb-10">
              Join the index. Prove your rank.
            </p>
            <Link to="/start">
              <Button 
                size="lg" 
                className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-12 py-6 h-auto text-lg"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Footer - Minimal */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} Loopgate</span>
              <div className="flex items-center gap-6">
                <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
                <Link to="/rules" className="hover:text-foreground transition-colors">Rules</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
