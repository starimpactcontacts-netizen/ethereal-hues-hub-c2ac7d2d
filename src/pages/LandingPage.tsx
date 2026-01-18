import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Target, Zap, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import { useRealRankings, useRealEvents, useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';

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
      {/* iOS App Banner - absolutely first, at the very top of the page */}
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div className="min-h-screen bg-background text-foreground">
        <SEO {...pageSEO.home} />
        <LandingHeader bannerVisible={bannerVisible} />
      {/* Hero Section - Rating Focused */}
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
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-none tracking-tight mb-6">
            Prove Your Rank.<br />
            <span className="text-gold">S++ or F-Tier?</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Find out where you rank among the world's best editors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link to="/start">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl px-8 py-6 h-auto">
                <Target className="mr-2 h-5 w-5" />
                Rate My Edit
              </Button>
            </Link>
            <Link to="/start">
              <Button size="lg" variant="outline" className="border-border hover:bg-surface-1 font-display text-xl px-8 py-6 h-auto">
                Take the QOI Test
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
              <h3 className="font-display text-2xl mb-3">Submit Your Edit</h3>
              <p className="text-muted-foreground">
                Paste a TikTok, Reels, or YouTube link. No account needed to get rated.
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
              <h3 className="font-display text-2xl mb-3">Get Your Score</h3>
              <p className="text-muted-foreground">
                QOI Judges rate your edit on Sync, Creativity, Flow, and Impact. See your class rank instantly.
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
              <h3 className="font-display text-2xl mb-3">Level Up</h3>
              <p className="text-muted-foreground">
                Save your score, climb the global index, and prove you're S++ tier.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Event Preview */}
      {liveEvent && (
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
                    {liveEvent.league} League · {liveEvent.ip}
                  </span>
                  <h3 className="font-display text-4xl sm:text-5xl text-gold mb-2">{liveEvent.title}</h3>
                  <p className="text-muted-foreground">{liveEvent.location} · {liveEvent.prize_pool || 'No Prize'}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Editors Competing</p>
                    <p className="font-display text-3xl">{stats.totalCompeting}</p>
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
      )}

      {/* Leaderboard Preview */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-4xl">Global Rankings</h2>
            <Link to="/auth" className="text-gold hover:text-gold/80 text-sm font-semibold uppercase tracking-widest">
              View All →
            </Link>
          </div>
          
          <div className="bg-surface-1 border border-border divide-y divide-border overflow-hidden">
            {rankingsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading rankings...</div>
            ) : topEditors.length === 0 ? (
              // Epic placeholder rankings with maximum aura
              <>
                {[
                  { rank: 1, name: '—', league: 'elite', score: '—', isTop: true },
                  { rank: 2, name: '—', league: 'elite', score: '—', isTop: false },
                  { rank: 3, name: '—', league: 'pro', score: '—', isTop: false },
                  { rank: 4, name: '—', league: 'pro', score: '—', isTop: false },
                  { rank: 5, name: '—', league: 'open', score: '—', isTop: false },
                ].map((slot, index) => (
                  <motion.div
                    key={slot.rank}
                    className={`relative flex items-center justify-between p-5 sm:p-6 ${
                      slot.isTop ? 'bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {/* Rank glow for #1 */}
                    {slot.isTop && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-pulse" />
                    )}
                    
                    <div className="relative flex items-center gap-5">
                      {/* Rank number with crown for #1 */}
                      <div className="relative">
                        <span className={`font-display text-3xl sm:text-4xl w-12 text-center block ${
                          slot.isTop ? 'text-gold' : 'text-muted-foreground/50'
                        }`}>
                          {slot.rank}
                        </span>
                        {slot.isTop && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-gold text-xs">👑</span>
                        )}
                      </div>
                      
                      {/* Avatar placeholder */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                        slot.isTop 
                          ? 'border-gold/40 bg-gold/10' 
                          : 'border-border bg-surface-0'
                      } flex items-center justify-center`}>
                        <span className="text-muted-foreground/30 text-lg">?</span>
                      </div>
                      
                      <div>
                        <p className={`font-display text-xl sm:text-2xl ${
                          slot.isTop ? 'text-gold' : 'text-muted-foreground/40'
                        }`}>
                          {slot.name}
                        </p>
                        <span className={`text-xs font-semibold uppercase tracking-widest ${
                          slot.league === 'elite' ? 'text-gold/60' : 
                          slot.league === 'pro' ? 'text-muted-foreground/50' : 
                          'text-muted-foreground/30'
                        }`}>
                          {slot.league} League
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative text-right">
                      <p className={`font-display text-2xl sm:text-3xl ${
                        slot.isTop ? 'text-gold' : 'text-muted-foreground/40'
                      }`}>
                        {slot.score}
                      </p>
                      <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">Index</p>
                    </div>
                  </motion.div>
                ))}
                
                {/* CTA overlay */}
                <motion.div 
                  className="p-6 bg-gradient-to-t from-surface-1 to-transparent flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <Link to="/auth">
                    <Button className="bg-gold hover:bg-gold/90 text-gold-foreground font-display">
                      Claim Your Rank
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </>
            ) : (
              topEditors.map((editor, index) => (
                <motion.div
                  key={editor.id}
                  className={`relative flex items-center justify-between p-5 sm:p-6 ${
                    editor.rank === 1 ? 'bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  {editor.rank === 1 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-pulse" />
                  )}
                  
                  <div className="relative flex items-center gap-5">
                    <div className="relative">
                      <span className={`font-display text-3xl sm:text-4xl w-12 text-center block ${
                        editor.rank === 1 ? 'text-gold' : 
                        editor.rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {editor.rank}
                      </span>
                      {editor.rank === 1 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-gold text-xs">👑</span>
                      )}
                    </div>
                    
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 overflow-hidden ${
                      editor.rank === 1 
                        ? 'border-gold/40' 
                        : 'border-border'
                    }`}>
                      {editor.avatar_url ? (
                        <img src={editor.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-0 flex items-center justify-center">
                          <span className="text-muted-foreground text-sm font-display">
                            {editor.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className={`font-display text-xl sm:text-2xl ${
                        editor.rank === 1 ? 'text-gold' : 'text-foreground'
                      }`}>
                        {editor.username}
                      </p>
                      <span className={`text-xs font-semibold uppercase tracking-widest ${
                        editor.league === 'elite' ? 'text-gold' : 'text-muted-foreground'
                      }`}>
                        {editor.league} League
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative text-right">
                    <p className={`font-display text-2xl sm:text-3xl ${
                      editor.rank === 1 ? 'text-gold' : 'text-foreground'
                    }`}>
                      {editor.global_index_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Index</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* GQT Marketing Section - Trojan Horse */}
      <section id="qoi-section" className="py-24 px-4 bg-gradient-to-b from-background via-surface-0 to-background border-t border-border relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 mb-6">
              <Target className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold tracking-widest uppercase text-gold">Free Test</span>
            </div>
            
            <h2 className="font-display text-4xl sm:text-5xl mb-4">
              What's Your <span className="text-gold">QOI Score</span>?
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Submit any edit. Get brutally judged by real judges. 
              Find out if you're F-tier or S++ in under 48 hours.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
              <div className="bg-surface-1 border border-border p-4">
                <p className="font-display text-3xl text-gold mb-1">100</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Point Scale</p>
              </div>
              <div className="bg-surface-1 border border-border p-4">
                <p className="font-display text-3xl text-gold mb-1">5</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Scoring Pillars</p>
              </div>
              <div className="bg-surface-1 border border-border p-4">
                <p className="font-display text-3xl text-gold mb-1">8</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Class Ranks</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/gqt">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl px-8 py-6 h-auto">
                  <Zap className="mr-2 h-5 w-5" />
                  Take the Test
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gold/30 text-gold hover:bg-gold/10 font-display px-6 py-5 h-auto"
                onClick={() => {
                  const url = `${window.location.origin}/gqt`;
                  navigator.clipboard.writeText(url);
                  // Simple feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) {
                    const original = btn.innerHTML;
                    btn.innerHTML = '<span class="flex items-center gap-2">✓ Link Copied!</span>';
                    setTimeout(() => { btn.innerHTML = original; }, 2000);
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Test
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-6">
              No account needed to start. Sign up only when you're ready to submit.
            </p>
          </motion.div>
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
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link>
              <Link to="/rules" className="text-sm text-muted-foreground hover:text-foreground">Rules</Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground">Support</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              LOOPGATE © {new Date().getFullYear()}
            </div>
          </div>
          {/* Hidden enterprise link for special access */}
          <div className="mt-8 text-center">
            <Link 
              to="/enterprise" 
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              Enterprise Portal
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
