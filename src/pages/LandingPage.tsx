import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Swords, Users, Film, Trophy, Clock, Zap } from 'lucide-react';
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
import lightYagamiPoster from '@/assets/light_yagami_poster.jpg';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setGuest } = useGuestMode();
  const { stats } = useGlobalStats();
  const { user, loading } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(false);

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

        {/* ═══════════════ FEATURED COMP BANNER — SLIM, TAPPABLE ═══════════════ */}
        <section className="relative px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="max-w-5xl mx-auto">
            <Link
              to="/event/light-yagami-edit-competition"
              className="group relative flex items-center gap-3 h-16 sm:h-20 rounded-xl overflow-hidden ring-1 ring-white/10 bg-black active:scale-[0.99] transition-transform"
              style={{ boxShadow: '0 8px 30px -10px rgba(232,72,72,0.35)' }}
            >
              <img
                src={lightYagamiPoster}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: '60% 25%' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.65)_55%,rgba(0,0,0,0.35)_100%)]" />
              <div className="relative z-10 flex items-center gap-2.5 pl-3 sm:pl-4 flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-white shrink-0">
                  <span className="h-1 w-1 rounded-full bg-white animate-pulse" /> Live
                </span>
                <div className="min-w-0">
                  <p className="text-white font-black uppercase leading-none text-[15px] sm:text-[18px] tracking-[0.02em] truncate" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                    Light Yagami <span className="text-amber-400">Edit Comp</span>
                  </p>
                  <p className="text-white/60 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] mt-0.5 truncate">
                    Fix My Soul · TikTok Only
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2 pr-3 sm:pr-4 shrink-0">
                <span className="hidden sm:inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black"
                      style={{ background: 'linear-gradient(180deg,#E8C84A,#C49A2C)', fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                  $150 USD
                </span>
                <span className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-[12px] sm:text-[13px] font-black uppercase tracking-[0.16em] text-black"
                      style={{ background: 'linear-gradient(180deg,#E8C84A,#C49A2C)', fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                  Enter →
                </span>
              </div>
            </Link>
          </div>
        </section>

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

        {/* ═══════════════ FEATURED COMP — LIGHT YAGAMI ═══════════════ */}
        <section className="relative px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-black tracking-[0.28em] uppercase text-red-400" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                Featured Competition · Live Now
              </span>
            </div>

            <Link to="/event/light-yagami-edit-competition" className="block group">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black aspect-[16/10] sm:aspect-[21/9]"
                style={{ boxShadow: '0 30px 80px -20px rgba(232,72,72,0.35), 0 10px 40px rgba(0,0,0,0.6)' }}
              >
                <img
                  src={lightYagamiPoster}
                  alt="Light Yagami Edit Competition — $150 USD prize pool"
                  className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-[1.14] transition-transform duration-700"
                  style={{ objectPosition: '50% 22%' }}
                />
                {/* cinematic vignette */}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.1)_30%,rgba(0,0,0,0.55)_65%,rgba(0,0,0,0.95)_100%)]" />
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,rgba(0,0,0,0.75),transparent)]" />
                {/* amber rim flare */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-red-500/20 blur-3xl" />

                {/* Top-left meta */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_0_18px_rgba(232,72,72,0.6)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md ring-1 ring-white/10 px-2 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/85">
                    <Clock className="w-3 h-3" /> Season Open
                  </span>
                </div>

                {/* Top-right prize chip */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className="relative px-3 py-2 rounded-lg" style={{ background: 'linear-gradient(180deg,#E8C84A 0%,#C49A2C 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(30,30,30,0.5), 0 6px 24px rgba(0,0,0,0.5)' }}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-black font-black text-[20px] sm:text-[26px] leading-none" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>$150</span>
                      <span className="text-black/70 font-black text-[9px] sm:text-[10px] tracking-[0.2em]" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>USD</span>
                    </div>
                    <div className="text-black/70 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.22em] leading-none mt-0.5">Cash Prize</div>
                  </div>
                </div>

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
                  <p className="text-[10px] sm:text-[11px] font-black tracking-[0.32em] uppercase text-amber-300/90 mb-1.5" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                    Death Note · Official Song Promo
                  </p>
                  <h2
                    className="text-white font-black uppercase leading-[0.92] tracking-[-0.01em] text-[36px] sm:text-[64px] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
                    style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}
                  >
                    Light Yagami<br />
                    <span className="text-amber-400">Edit Competition</span>
                  </h2>
                  <p className="mt-2 sm:mt-3 max-w-xl text-[12px] sm:text-[14px] text-white/75 font-medium leading-snug">
                    Edit to Light Yagami for the official <span className="text-white font-bold">Fix My Soul</span> song promo. Top 5 split <span className="text-amber-300 font-black">$150 cash</span> · Top 50 split <span className="text-amber-300 font-black">1,000,000 index</span>.
                  </p>

                  <div className="mt-3 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
                    <motion.div
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="relative overflow-hidden px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg cursor-pointer select-none touch-manipulation"
                      style={{ background: 'linear-gradient(180deg, #E8C84A 0%, #D4A843 40%, #C49A2C 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(30,30,30,0.45), 0 8px 28px rgba(0,0,0,0.6)' }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex items-center gap-2">
                        <Swords className="w-4 h-4 text-black" />
                        <span className="text-black font-black text-[18px] sm:text-[22px] leading-none tracking-[0.08em] uppercase" style={{ fontFamily: 'Teko, Bebas Neue, sans-serif' }}>
                          Enter Event
                        </span>
                      </div>
                    </motion.div>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-md ring-1 ring-white/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                      <Trophy className="w-3 h-3 text-amber-400" /> Top 5 Cash
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-md ring-1 ring-white/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                      <Zap className="w-3 h-3 text-amber-400" /> TikTok Only
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
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
                  <a
                    href="https://discord.gg/loopgate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0932 18.0748a.0804.0804 0 00.0311.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 11-.0085-.1277c.1258-.0853.2517-.1705.3712-.2604a.0743.0743 0 01.078-.0099c3.9288 1.7933 8.18 1.7933 12.0624 0a.0738.0738 0 01.0792.0097c.1195.0899.2454.1751.3712.2604a.077.077 0 01-.0065.1278 12.1646 12.1646 0 01-1.8729.8914.0766.0766 0 00-.0407.1067c.3603.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0841.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.1773-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                    Discord
                  </a>
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
