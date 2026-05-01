import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Swords, Users, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import GatePattern from '@/components/loopgate/GatePattern';
import { useGlobalStats } from '@/hooks/useRealData';
import whereEditorsCompete from '@/assets/where-editors-compete-2.png';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useAuth } from '@/hooks/useAuth';
import loopgateLogo from '@/assets/loopgate-logo.png';
import loopgateHeroCinematic from '@/assets/hero-collage.jpeg';
import { useState, useEffect } from 'react';
import { useGuestNicknamePrompt } from '@/hooks/useGuestNicknamePrompt';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setGuest } = useGuestMode();
  const { stats } = useGlobalStats();
  const { user, loading } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(false);

  // Auto-nudge: 10s after a guest lands, pop the nickname modal so they
  // can enter with zero friction. Skips entirely for logged-in users.
  useEffect(() => {
    if (loading || user) return;
    const t = setTimeout(() => {
      useGuestNicknamePrompt.getState().prompt({
        reason: 'Pick a nickname',
        returnTo: '/arena',
      });
    }, 10000);
    return () => clearTimeout(t);
  }, [loading, user]);

  const handleGuestExplore = () => {
    setGuest(true);
    navigate('/hub');
  };

  // Logged-in users skip the marketing landing entirely.
  if (!loading && user) {
    return <Navigate to="/arena" replace />;
  }

  return (
    <>
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div
        className="h-full overflow-y-auto overflow-x-hidden bg-background text-foreground"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <SEO {...pageSEO.home} />
        <LandingHeader bannerVisible={bannerVisible} />

        {/* ═══════════════ HERO — CINEMATIC, DIRECT ENTRY ═══════════════ */}
        <section className="relative min-h-[70vh] sm:min-h-[75vh] flex flex-col overflow-hidden">
          {/* Cinematic background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 w-[220%] sm:w-[160%]"
              animate={{ x: ['0%', '-55%', '0%'] }}
              transition={{ duration: 40, ease: 'linear', repeat: Infinity, times: [0, 0.5, 1] }}
            >
              <img
                src={loopgateHeroCinematic}
                alt="Cinematic video editing — movies, artists, sports, cars"
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_35%,transparent_20%,hsl(var(--background))_100%)]" />
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent" />
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px 40px hsl(var(--background))' }} />
            {/* Film grain */}
            <div
              className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '128px 128px',
              }}
            />
          </div>

          <GatePattern className="z-[1]" opacity={4} tileSize={56} />

          {/* Hero content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 sm:pt-24 pb-12 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <img src={whereEditorsCompete} alt="WHERE EDITORS COMPETE" className="w-full max-w-[500px] sm:max-w-[600px] mx-auto drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]" />
            </motion.div>
            <motion.p
              className="text-[17px] sm:text-3xl max-w-[320px] sm:max-w-sm mx-auto mb-6 leading-[1.15] tracking-[0.14em] sm:tracking-[0.18em] uppercase font-black text-center"
              style={{ fontFamily: 'Teko, Bebas Neue, sans-serif', color: '#ffffff', textShadow: '0 0 40px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              Enter. Compete. Win.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 items-center justify-center"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              <Link to="/start">
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative overflow-hidden px-14 sm:px-20 py-4 sm:py-5 cursor-pointer select-none touch-manipulation"
                  style={{ background: 'linear-gradient(180deg, #E8C84A 0%, #D4A843 40%, #C49A2C 100%)', boxShadow: 'inset 0 0 0 2px rgba(30,30,30,0.45), 0 8px 32px rgba(0,0,0,0.5)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                    <span className="text-black font-black text-2xl sm:text-3xl tracking-[0.06em] uppercase" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                      Enter
                    </span>
                  </div>
                </motion.div>
              </Link>
              <button
                onClick={handleGuestExplore}
                className="font-display text-sm text-muted-foreground hover:text-foreground transition-colors font-bold tracking-[0.12em] px-4 py-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                Explore as Guest →
              </button>
            </motion.div>
            {/* Mode chips — inline, minimal, no boxy stack */}
            <motion.div
              className="flex items-center justify-center gap-3 mt-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <Link
                to="/start"
                className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                  Edit Battle
                </span>
              </Link>
              <span className="w-px h-3 bg-border" />
              <Link
                to="/start"
                className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase">
                  Multiplayer
                </span>
              </Link>
            </motion.div>
            <motion.div
              className="flex items-center gap-5 mt-5 text-xs text-muted-foreground justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span><span className="text-foreground font-bold">{stats.activeUsers || 0}</span> online</span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5"><Swords className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-foreground font-bold">{stats.totalCompeting || 0}</span> competing</span>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FOOTER — SLIM ═══════════════ */}
        <footer className="border-t border-border bg-surface-0">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-4">Product</h4>
                <div className="space-y-2.5">
                  <Link to="/start" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</Link>
                  <Link to="/download" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Download</Link>
                  <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-4">Company</h4>
                <div className="space-y-2.5">
                  <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                  <Link to="/enterprise" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-4">Legal</h4>
                <div className="space-y-2.5">
                  <Link to="/rules" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-4">Community</h4>
                <div className="space-y-2.5">
                  <button onClick={handleGuestExplore} className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Explore</button>
                  <Link to="/loopy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Rate My Edit</Link>
                  <Link to="/gqt" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">QOI Test</Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 border-t border-border">
              <img src={loopgateLogo} alt="Loopgate" className="h-5 opacity-60" />
              <span className="text-[10px] text-muted-foreground tracking-wider">© {new Date().getFullYear()} Loopgate. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
