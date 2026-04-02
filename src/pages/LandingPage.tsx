import { Link, useNavigate } from 'react-router-dom';
import { Swords, Play, Smartphone, ChevronRight } from 'lucide-react';
import { HubIcon, ArenaIcon, RankingsIcon, RateIcon, UnitsIcon, MissionsIcon } from '@/components/loopgate/LandingIcons';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import GatePattern from '@/components/loopgate/GatePattern';
import { useGlobalStats } from '@/hooks/useRealData';
import whereEditorsCompete from '@/assets/where-editors-compete-2.png';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import loopgateLogo from '@/assets/loopgate-logo.png';
import loopgateHeroCinematic from '@/assets/hero-collage.jpeg';
import editoriumLogo from '@/assets/editorium-logo.png';
import loopyAvatar from '@/assets/loopy-avatar.png';
import { useState } from 'react';

const quickLinks = [
  { to: '/hub', label: 'Hub', Icon: HubIcon, desc: 'Browse edits & editors', accent: 'from-white/5 to-transparent', border: 'border-foreground/8 hover:border-foreground/25', glow: '' },
  { to: '/arena', label: 'Arena', Icon: ArenaIcon, desc: 'Compete now', accent: 'from-red-500/8 to-transparent', border: 'border-red-500/15 hover:border-red-500/40', glow: 'hover:shadow-[0_0_30px_-8px_rgba(239,68,68,0.15)]' },
  { to: '/rankings', label: 'Rankings', Icon: RankingsIcon, desc: 'Global leaderboard', accent: 'from-gold/8 to-transparent', border: 'border-gold/15 hover:border-gold/40', glow: 'hover:shadow-[0_0_30px_-8px_rgba(232,200,74,0.15)]' },
  { to: '/loopy', label: 'Rate My Edit', Icon: RateIcon, desc: 'Free instant rating', accent: 'from-purple-500/8 to-transparent', border: 'border-purple-500/15 hover:border-purple-500/40', glow: 'hover:shadow-[0_0_30px_-8px_rgba(168,85,247,0.15)]' },
  { to: '/units', label: 'Units', Icon: UnitsIcon, desc: 'Join a crew', accent: 'from-cyan-500/8 to-transparent', border: 'border-cyan-500/15 hover:border-cyan-500/40', glow: 'hover:shadow-[0_0_30px_-8px_rgba(6,182,212,0.15)]' },
  { to: '/missions', label: 'Missions', Icon: MissionsIcon, desc: 'Earn cash', accent: 'from-emerald-500/8 to-transparent', border: 'border-emerald-500/15 hover:border-emerald-500/40', glow: 'hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.15)]' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { setGuest } = useGuestMode();
  const { stats } = useGlobalStats();
  const [bannerVisible, setBannerVisible] = useState(false);

  const handleGuestExplore = () => {
    setGuest(true);
    navigate('/hub');
  };

  return (
    <>
      <IOSAppBanner onVisibilityChange={setBannerVisible} />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
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
              className="text-xl sm:text-2xl max-w-md mx-auto mb-6 leading-[1.15] tracking-[0.12em] uppercase font-bold"
              style={{ fontFamily: 'Teko, Bebas Neue, sans-serif', color: 'rgba(255,255,255,0.75)', textShadow: '0 0 30px rgba(0,0,0,0.9), 0 3px 16px rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              Submit Edits. Get Judged. Climb The Global Rankings.
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

        {/* ═══════════════ DIRECT ACCESS — Portal Grid ═══════════════ */}
        <section className="relative py-4 sm:py-8 px-4 sm:px-6">
          <div className="max-w-md mx-auto space-y-1.5">
            <motion.div
              className="grid grid-cols-3 gap-1.5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              {quickLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link
                    to={link.to}
                    className="group relative flex flex-col items-center justify-center gap-1 py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06), transparent 70%)` }} />
                    <link.Icon size={18} className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 relative z-10" />
                    <span className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground tracking-wide uppercase relative z-10" style={{ fontFamily: 'Teko, sans-serif' }}>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Secondary row */}
            <motion.div
              className="flex gap-1.5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              <Link
                to="/editorium"
                className="group flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <img src={editoriumLogo} alt="Editorium" className="h-3 opacity-40 group-hover:opacity-70 transition-opacity" />
              </Link>
              <Link
                to="/gqt"
                className="group flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>QOI TEST</span>
              </Link>
              <Link
                to="/about"
                className="group flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" style={{ fontFamily: 'Teko, sans-serif' }}>ABOUT</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ DOWNLOAD STRIP — COMPACT ═══════════════ */}
        <section className="border-y border-border/30 bg-surface-0 py-10 sm:py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-2xl sm:text-3xl mb-3">GET THE APP</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Available on iOS and Web. Your rank follows you everywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/start">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-display text-sm px-8 py-3 h-auto gap-2">
                    <Play className="w-4 h-4" /> Open Web App
                  </Button>
                </Link>
                <Link to="/download">
                  <Button size="lg" variant="outline" className="border-border/60 bg-transparent hover:bg-surface-1 text-muted-foreground font-display text-sm px-6 py-3 h-auto gap-2">
                    <Smartphone className="w-4 h-4" /> iOS App
                  </Button>
                </Link>
              </div>
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
