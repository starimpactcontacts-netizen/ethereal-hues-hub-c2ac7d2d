import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Zap, Trophy, Users, Flame, IterationCcw, Play, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import { useRealRankings, useRealEvents, useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import loopgateBrand from '@/assets/loopgate-brand.png';
import clioShortlist from '@/assets/clio-shortlist-2025.png';

// Class tier colors
const tierColors: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  'S++': { bg: 'bg-gold/20', text: 'text-gold', border: 'border-gold', glow: 'shadow-[0_0_20px_rgba(212,175,55,0.4)]' },
  'S+': { bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/70' },
  'S': { bg: 'bg-gold/10', text: 'text-gold/80', border: 'border-gold/50' },
  'A': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  'B': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  'C': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/50' },
  'D': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/50' },
  'F': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/50' },
};

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
  
  // Get top 5 editors from real data
  const topEditors = rankings.slice(0, 5);
  
  // Find the primary live event
  const liveEvent = events.find(e => e.status === 'live');

  return (
    <>
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <SEO {...pageSEO.home} />
        <LandingHeader bannerVisible={bannerVisible} />

        {/* Hero Section - AAA Cinematic */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden">
          {/* Layered background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.08),transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
          
          <motion.div 
            className="relative z-10 text-center max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Main headline - Official Brand Wordmark */}
            <motion.div 
              className="mb-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <img 
                src={loopgateBrand} 
                alt="LOOPGATE" 
                className="h-32 sm:h-44 md:h-60 lg:h-72 w-auto mx-auto drop-shadow-[0_0_100px_rgba(255,255,255,0.35)]"
              />
            </motion.div>
            
            {/* Dramatic headline with stacked typography */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[0.85] tracking-[0.08em]">
                <span className="text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">THE COMPETITIVE</span>
                <br />
                <span className="text-foreground">EDITING INDEX</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-[10px] sm:text-[11px] text-muted-foreground/50 max-w-md mx-auto mb-10 tracking-[0.2em] uppercase font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Evaluating editors · Hosting events · Global rankings
            </motion.p>
            
            {/* CTA Buttons - Clean, minimal styling */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link to="/arena" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="bg-foreground hover:bg-foreground/90 text-background font-display text-sm sm:text-base px-6 py-3 h-auto w-full sm:w-auto sm:min-w-[180px]"
                >
                  Enter Arena
                </Button>
              </Link>
              <Link to="/gqt" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-zinc-500/50 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-400/50 text-zinc-200 font-display text-sm sm:text-base px-6 py-3 h-auto w-full sm:w-auto sm:min-w-[180px]"
                >
                  Take QOI Test
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={handleGuestExplore}
                className="text-muted-foreground hover:text-foreground font-display text-sm sm:text-base px-6 py-3 h-auto w-full sm:w-auto sm:min-w-[180px]"
              >
                Explore as Guest
              </Button>
            </motion.div>
          </motion.div>

          {/* Clio Entertainment Shortlist 2025 */}
          <motion.div 
            className="absolute bottom-8 sm:bottom-10 right-4 sm:right-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <img 
              src={clioShortlist} 
              alt="Clio Entertainment 2025 Shortlist" 
              className="h-10 sm:h-14 w-auto opacity-60 hover:opacity-90 transition-opacity duration-300"
            />
          </motion.div>
        </section>

        {/* Features Grid - Bold cards */}
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(212,175,55,0.02),transparent)]" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl sm:text-5xl mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                A complete competitive ecosystem for video editors
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  icon: Trophy, 
                  title: 'Arena', 
                  desc: 'Official events, open arenas, and crew tournaments. Real stakes, real competition.',
                  accent: 'from-gold/20 to-transparent'
                },
                { 
                  icon: Target, 
                  title: 'QOI Score', 
                  desc: 'Get rated by certified judges on a 100-point scale. Discover your true Class.',
                  accent: 'from-zinc-400/20 to-transparent'
                },
                { 
                  icon: IterationCcw, 
                  title: 'Loop Feed', 
                  desc: 'Watch top-rated edits. See what S++ looks like. Learn from the best.',
                  accent: 'from-cyan-500/20 to-transparent'
                },
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  className="group relative bg-surface-0 border border-border p-8 hover:border-gold/40 transition-all duration-300 overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 flex items-center justify-center bg-gold/10 border border-gold/30 mb-6 group-hover:bg-gold/20 transition-colors">
                      <item.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard Section */}
        <section className="py-24 px-4 bg-surface-0 border-y border-border relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/[0.02] rounded-full blur-[100px]" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div>
                <h2 className="font-display text-4xl sm:text-5xl mb-2">Top Editors</h2>
                <p className="text-muted-foreground">The highest-ranked editors on the index</p>
              </div>
              <Link 
                to="/start" 
                className="group flex items-center gap-2 text-gold hover:text-gold/80 font-semibold text-sm uppercase tracking-widest transition-colors"
              >
                View All 
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            
            <div className="space-y-3">
              {rankingsLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                  Loading rankings...
                </div>
              ) : topEditors.length === 0 ? (
                <motion.div 
                  className="py-16 text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gold/10 border border-gold/30 rounded-full">
                    <Trophy className="w-10 h-10 text-gold" />
                  </div>
                  <p className="text-muted-foreground text-lg mb-6">No editors ranked yet. Be the first.</p>
                  <Link to="/start">
                    <Button className="bg-gold hover:bg-gold/90 text-background font-display text-lg px-8 py-6 h-auto">
                      Claim #1
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                topEditors.map((editor, index) => (
                  <motion.div
                    key={editor.id}
                    className={`group flex items-center justify-between p-5 bg-background border transition-all duration-300 hover:border-gold/30 ${
                      index === 0 ? 'border-gold/50 shadow-[0_0_30px_-10px_rgba(212,175,55,0.3)]' : 'border-border'
                    }`}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-5">
                      {/* Rank number */}
                      <div className={`w-10 text-center font-display text-2xl ${
                        index === 0 ? 'text-gold' : index < 3 ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Avatar with rank indicator */}
                      <div className="relative">
                        <Avatar className={`w-12 h-12 border-2 ${index === 0 ? 'border-gold' : 'border-border'}`}>
                          <AvatarImage src={editor.avatar_url || undefined} />
                          <AvatarFallback className="bg-surface-1 font-display text-lg">
                            {editor.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-background fill-background" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <p className={`font-display text-xl ${index === 0 ? 'text-gold' : ''}`}>
                          {editor.username}
                        </p>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {editor.league} League
                        </span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <p className={`font-display text-2xl ${index === 0 ? 'text-gold' : ''}`}>
                        {editor.global_index_score.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Index</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* QOI Class Showcase */}
        <section id="qoi-section" className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(212,175,55,0.06),transparent)]" />
          
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 mb-6">
                <Zap className="w-4 h-4 text-gold" />
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-gold">Free Test Available</span>
              </div>
              
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl mb-4">
                What's Your <span className="text-gold">Class</span>?
              </h2>
              
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Submit any edit. Get scored on 5 pillars by certified judges. 
                Discover your true ranking.
              </p>
            </motion.div>
            
            {/* Class tiers grid */}
            <motion.div 
              className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {Object.entries(tierColors).map(([tier, colors], i) => (
                <motion.div
                  key={tier}
                  className={`aspect-square flex items-center justify-center border ${colors.border} ${colors.bg} ${colors.glow || ''} transition-all duration-300 hover:scale-105`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <span className={`font-display text-2xl sm:text-3xl ${colors.text}`}>
                    {tier}
                  </span>
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
                  size="lg" 
                  className="group relative bg-gold hover:bg-gold/90 text-background font-display text-xl px-12 py-8 h-auto overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Target className="h-6 w-6" />
                    Take the QOI Test
                  </span>
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-4">Results in under 48 hours</p>
            </motion.div>
          </div>
        </section>

        {/* Final CTA - Epic */}
        <section className="py-32 px-4 bg-surface-0 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,rgba(212,175,55,0.05),transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-gold/10 rounded-full" />
          
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl mb-6">
                Ready to Compete?
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
                Create your profile and join thousands of editors on the global index.
              </p>
              <Link to="/start">
                <Button 
                  size="lg" 
                  className="group bg-gold hover:bg-gold/90 text-background font-display text-xl px-12 py-8 h-auto"
                >
                  Get Started
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer - Refined */}
        <footer className="py-10 px-4 border-t border-border bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <span className="font-display text-xl tracking-tight">LOOPGATE</span>
                <div className="hidden sm:flex items-center gap-6">
                  <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                  <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                  <Link to="/rules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                  <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Loopgate. All rights reserved.
              </div>
            </div>
            
            {/* Mobile footer links */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 sm:hidden">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
              <Link to="/rules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                to="/enterprise" 
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
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
