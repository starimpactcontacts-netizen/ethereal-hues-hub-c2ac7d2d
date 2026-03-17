import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Swords, Gavel, Smartphone, Shield, Eye, Award, Play, ChevronDown, Brain, Heart, Lightbulb, Music, Fingerprint, Zap, BarChart3 } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import GatePattern from '@/components/loopgate/GatePattern';
import GlitchEdge from '@/components/loopgate/GlitchEdge';
import { useGlobalStats } from '@/hooks/useRealData';
import whereEditorsCompete from '@/assets/where-editors-compete-2.png';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import loopgateBrand from '@/assets/loopgate-brand.png';
import loopgateLogo from '@/assets/loopgate-logo.png';
import atlasStatue from '@/assets/atlas-statue.png';
import loopgateHeroCinematic from '@/assets/loopgate-hero-cinematic.jpeg';
import editoriumLogo from '@/assets/editorium-logo.png';
import loopyAvatar from '@/assets/loopy-avatar.png';


import clioShortlistBadge from '@/assets/clio-shortlist-badge.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (d: number) => ({
    opacity: 1, y: 0,
    transition: { delay: d * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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

        {/* ═══════════════ HERO — CINEMATIC FULL-BLEED ═══════════════ */}
        <section className="relative min-h-[100vh] flex flex-col overflow-hidden">
          {/* ── Cinematic hero image — TOP, full bleed ── */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ animation: 'heroPan 25s ease-in-out infinite alternate' }}
            >
              <img
                src={loopgateHeroCinematic}
                alt="Cinematic video editing — movies, artists, sports, cars"
                className="w-[350%] sm:w-[200%] h-full object-cover object-center"
                style={{ minHeight: '100%' }}
              />
            </div>
            <style>{`
              @keyframes heroPan {
                0%   { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              @media (min-width: 640px) {
                @keyframes heroPan {
                  0%   { transform: translateX(0%); }
                  100% { transform: translateX(-33%); }
                }
              }
            `}</style>
            {/* Heavy bottom fade to black for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
            {/* Side vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,transparent_30%,hsl(var(--background))_100%)]" />
            {/* Top edge fade */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
            {/* Film grain overlay */}
            <div
              className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none z-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '128px 128px',
              }}
            />
          </div>

          {/* Atmospheric underlays */}
          <GatePattern className="z-[1]" opacity={4} tileSize={56} />
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px] z-[1]" />
          <div className="absolute bottom-1/3 left-[10%] w-[400px] h-[400px] bg-red-500/[0.04] rounded-full blur-[100px] z-[1]" />

          {/* Hero content — centered over image */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-20 sm:pt-28 pb-16 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5"
            >
              <img src={whereEditorsCompete} alt="WHERE EDITORS COMPETE" className="w-full max-w-[600px] sm:max-w-[700px] md:max-w-[800px] mx-auto drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]" />
            </motion.div>
            <motion.p
              className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-7 leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              Submit edits. Get judged. Climb the global rankings.
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
                      Compete Now
                    </span>
                  </div>
                </motion.div>
              </Link>
              <button
                onClick={handleGuestExplore}
                className="font-display text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors font-bold tracking-[0.12em] px-4 py-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                Explore as Guest →
              </button>
            </motion.div>
            <motion.div
              className="flex items-center gap-5 mt-6 text-xs sm:text-sm text-muted-foreground justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              <span className="flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span><span className="text-foreground font-bold">{stats.activeUsers || 0}</span> online</span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5"><Swords className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-foreground font-bold">{stats.totalCompeting || 0}</span> competing</span>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
          </motion.div>
        </section>

        {/* ═══════════════ STATUE — EVERY LEGEND STARTED AT F ═══════════════ */}
        <section className="relative border-y border-border bg-background overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_50%_60%,rgba(212,175,55,0.04),transparent)]" />
          <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            <motion.img
              src={atlasStatue}
              alt="Atlas statue"
              className="w-40 sm:w-52 md:w-60 h-auto mb-10 invert drop-shadow-[0_0_40px_rgba(212,175,55,0.15)]"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.p
              className="font-display text-2xl sm:text-4xl md:text-5xl leading-[0.9]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              &ldquo;EVERY LEGEND STARTED AT <span className="text-gold">F CLASS</span>.&rdquo;
            </motion.p>
          </div>

          {/* Clio Award badge — bottom right corner */}
          <motion.div
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <img
              src={clioShortlistBadge}
              alt="Clio Awards 2025 Shortlist"
              className="h-12 sm:h-16 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Scroll</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
          </motion.div>
        </section>

        {/* ═══════════════ QUICK LINKS — Editorium + Browse ═══════════════ */}
        <section className="relative py-8 border-b border-border/30 bg-surface-0">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/index" className="group flex flex-col items-center justify-center gap-2 py-5 sm:py-6 bg-surface-1/50 border border-border/40 hover:border-foreground/20 transition-all">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">Discover</span>
              </Link>
              <Link to="/editorium" className="group flex flex-col items-center justify-center gap-2 py-5 sm:py-6 bg-surface-1/50 border border-border/40 hover:border-foreground/20 transition-all">
                <img src={editoriumLogo} alt="Editorium" className="h-5 sm:h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">Read Now</span>
              </Link>
              <Link to="/rankings" className="group flex flex-col items-center justify-center gap-2 py-5 sm:py-6 bg-surface-1/50 border border-border/40 hover:border-foreground/20 transition-all">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">Rankings</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 1: 1v1 — FULL WIDTH CINEMATIC ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-red-950/[0.04] to-background" />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <motion.div
              className="text-center mb-16"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <motion.span variants={fadeUp} custom={0} className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-red-400 mb-4">
                ⚔️ 1v1 Battles
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.85] mb-5">
                FIGHT FOR<br />YOUR RANK
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                Challenge any editor to a head to head battle. Submit your best work, get judged by certified judges, and watch your rank move.
              </motion.p>
            </motion.div>

            {/* Visual — wide battle mockup */}
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border border-red-500/15 bg-surface-0 overflow-hidden relative">
                {/* Top accent line */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Swords className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Live Battle</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-red-500/15 text-red-400 px-2.5 py-1 font-bold tracking-wider uppercase">Rapid</span>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">142</span>
                    </div>
                  </div>
                </div>
                {/* VS Layout — Wide */}
                <div className="p-8 sm:p-10">
                  <div className="flex items-center justify-between gap-4 sm:gap-8">
                    {/* Challenger */}
                    <div className="text-center flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 flex items-center justify-center mb-3">
                        <span className="font-display text-xl sm:text-2xl text-red-400">K</span>
                      </div>
                      <p className="font-display text-base sm:text-lg text-foreground">KXZEN</p>
                      <span className="text-[10px] text-gold uppercase tracking-wider font-bold">A Class</span>
                    </div>
                    {/* VS Divider */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-px h-8 bg-gradient-to-b from-transparent via-border to-transparent" />
                      <span className="font-display text-3xl sm:text-4xl text-red-400/80">VS</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">24H Left</span>
                      <div className="w-px h-8 bg-gradient-to-b from-transparent via-border to-transparent" />
                    </div>
                    {/* Opponent */}
                    <div className="text-center flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-900/20 border border-cyan-500/30 flex items-center justify-center mb-3">
                        <span className="font-display text-xl sm:text-2xl text-cyan-400">R</span>
                      </div>
                      <p className="font-display text-base sm:text-lg text-foreground">RXSE</p>
                      <span className="text-[10px] text-gold uppercase tracking-wider font-bold">S Class</span>
                    </div>
                  </div>
                  {/* Judge bar */}
                  <div className="mt-8 flex items-center justify-center gap-3 bg-surface-1 border border-border/50 px-4 py-2.5">
                    <Gavel className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] text-muted-foreground">Judge: <span className="text-gold font-semibold">MVRKO</span></span>
                    <span className="w-px h-3 bg-border mx-1" />
                    <span className="text-[10px] text-muted-foreground">Judging in progress</span>
                  </div>
                </div>
                {/* Bottom accent */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              </div>
            </motion.div>

            {/* Feature bullets — below, horizontal */}
            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              {['Judge decided outcomes', 'Rapid and standard modes', 'XP and index on the line'].map((f, i) => (
                <motion.span key={f} variants={fadeUp} custom={i + 3} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-red-400" /> {f}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>


        {/* ═══════════════ FEATURE 2: JUDGE SYSTEM — ASYMMETRIC GRID ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-950/[0.02] to-background" />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-center">
              {/* Text — takes 2 cols */}
              <motion.div
                className="md:col-span-2 text-center md:text-left"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
              >
                <motion.span variants={fadeUp} custom={0} className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-4">
                  🏛 The Bureau
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.85] mb-5">
                  RATED BY<br />REAL JUDGES
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base leading-relaxed mb-6">
                  Submit any edit and receive a detailed QOI score across five pillars. Know exactly where you stand. S++ to F.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {['Five pillar QOI scoring', 'Certified judge panel', 'S++ to F class system'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/70 md:justify-start justify-center">
                      <div className="w-1 h-1 rounded-full bg-gold" /> {f}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>

              {/* QOI Card — takes 3 cols */}
              <motion.div
                className="md:col-span-3"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border border-gold/15 bg-surface-0 overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="px-5 py-3.5 flex items-center justify-between border-b border-border/50">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">QOI Score Result</span>
                    <span className="text-[10px] text-muted-foreground">48h ago</span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-8">
                      {/* Big score */}
                      <div className="text-center flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gold/40 bg-gold/5 flex items-center justify-center mb-2">
                          <span className="font-display text-4xl sm:text-5xl text-gold">84</span>
                        </div>
                        <p className="font-display text-lg text-gold">A CLASS</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Top 15%</p>
                      </div>
                      {/* Pillars */}
                      <div className="flex-1 space-y-3 pt-2">
                        {[
                          { label: 'Emotion', score: 88, color: 'bg-emerald-500' },
                          { label: 'Creativity', score: 82, color: 'bg-cyan-500' },
                          { label: 'Sync', score: 90, color: 'bg-red-500' },
                          { label: 'Identity', score: 79, color: 'bg-purple-500' },
                          { label: 'Execution', score: 81, color: 'bg-gold' },
                        ].map(p => (
                          <div key={p.label} className="flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground w-20 text-right">{p.label}</span>
                            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${p.color} rounded-full`}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${p.score}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-foreground w-6 text-right">{p.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 bg-surface-1 border border-border/50 px-3 py-2">
                      <Award className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[11px] text-muted-foreground">Reviewed by <span className="text-foreground font-semibold">Judge VALERIA</span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* ═══════════════ FEATURE 3: UNITS & CREWS — CARD STRIP ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-y border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/[0.02] to-background" />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <motion.div
              className="text-center mb-16"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <motion.span variants={fadeUp} custom={0} className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400 mb-4">
                🛡 Units
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.85] mb-5">
                BUILD YOUR<br />EMPIRE
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                Form a unit. Recruit editors. Compete as one. Manage tiers, channels, and a full editor roster.
              </motion.p>
            </motion.div>

            {/* Unit cards strip */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {[
                { name: 'PHANTOM CUTS', members: 34, tag: 'Elite', color: 'border-cyan-500/20' },
                { name: 'VIRAL CARTEL', members: 128, tag: 'Legendary', color: 'border-gold/20' },
                { name: 'NOVA EDITS', members: 21, tag: 'Rising', color: 'border-red-500/20' },
              ].map(unit => (
                <div key={unit.name} className={`bg-surface-0 border ${unit.color} p-5 sm:p-6`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-base text-foreground">{unit.name}</p>
                      <p className="text-[10px] text-muted-foreground">{unit.members} members</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-surface-1 border border-border px-2 py-0.5 text-muted-foreground uppercase tracking-wider font-bold">{unit.tag}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10"
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              {['Full channel system', 'Editor tier management', 'Unit vs unit rivalries'].map((f, i) => (
                <motion.span key={f} variants={fadeUp} custom={i + 3} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-cyan-400" /> {f}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>


        {/* ═══════════════ FEATURE 4: RANKINGS — LEADERBOARD PREVIEW ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-center">
              {/* Leaderboard mockup — 3 cols */}
              <motion.div
                className="md:col-span-3 order-2 md:order-1"
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border border-border bg-surface-0 overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
                  <div className="px-5 py-3.5 flex items-center justify-between border-b border-border/50">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Global Rankings</span>
                    <span className="text-[10px] text-muted-foreground">Live</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {[
                      { rank: 1, name: 'PRXSTIGE', cls: 'S++', index: 2847, change: '+12' },
                      { rank: 2, name: 'KXZEN', cls: 'S+', index: 2691, change: '+8' },
                      { rank: 3, name: 'AETHRVL', cls: 'S', index: 2534, change: '-3' },
                      { rank: 4, name: 'RXSE', cls: 'S', index: 2488, change: '+15' },
                      { rank: 5, name: 'DVRK', cls: 'A', index: 2301, change: '+4' },
                    ].map(r => (
                      <div key={r.rank} className="px-5 py-3 flex items-center gap-4">
                        <span className={`font-display text-lg w-8 ${r.rank <= 3 ? 'text-gold' : 'text-muted-foreground'}`}>#{r.rank}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                          <span className="text-xs font-bold text-foreground">{r.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.cls} Class</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{r.index.toLocaleString()}</p>
                          <p className={`text-[10px] ${r.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{r.change}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Text — 2 cols */}
              <motion.div
                className="md:col-span-2 text-center md:text-left order-1 md:order-2"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
              >
                <motion.span variants={fadeUp} custom={0} className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/60 mb-4">
                  📊 Global Index
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.85] mb-5">
                  CLIMB THE<br />GLOBAL INDEX
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base leading-relaxed mb-6">
                  Every battle, every review, every win moves you up. A living ranking system that rewards consistency.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {['Elo-based global index', 'Class tiers from F to S++', 'Weekly and all-time boards'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/70 md:justify-start justify-center">
                      <div className="w-1 h-1 rounded-full bg-foreground/40" /> {f}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </div>
        </section>



        {/* ═══════════════ FEATURE 5: LOOPY RATING ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden border-t border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/[0.03] to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--gold)/0.03),transparent)]" />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-center">
              {/* Rating Card Mockup — 3 cols */}
              <motion.div
                className="md:col-span-3"
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border border-purple-500/15 bg-surface-0 overflow-hidden relative">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                  <div className="px-5 py-3.5 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <img src={loopyAvatar} alt="Loopy" className="w-6 h-6 rounded-full border border-purple-500/30" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Loopy Diagnostic</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-bold">Live</span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-6 sm:gap-8">
                      {/* Grade */}
                      <div className="text-center flex-shrink-0">
                        <motion.div
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/20"
                          whileInView={{ scale: [0.8, 1.05, 1] }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          <span className="font-display text-4xl sm:text-5xl text-white font-black">A</span>
                        </motion.div>
                        <p className="font-display text-lg text-foreground">78/100</p>
                        <p className="text-[9px] text-purple-400 uppercase tracking-wider font-bold italic">"clean work ngl"</p>
                      </div>
                      {/* 5 Pillar Bars */}
                      <div className="flex-1 space-y-3 pt-1">
                        {[
                          { label: 'Emotion', score: 12, max: 15, color: 'bg-pink-500', icon: Heart },
                          { label: 'Creativity', score: 19, max: 25, color: 'bg-amber-500', icon: Lightbulb },
                          { label: 'Sync', score: 21, max: 25, color: 'bg-purple-500', icon: Music },
                          { label: 'Identity', score: 7, max: 10, color: 'bg-cyan-500', icon: Fingerprint },
                          { label: 'Execution', score: 19, max: 25, color: 'bg-green-500', icon: Zap },
                        ].map((p, i) => (
                          <div key={p.label} className="flex items-center gap-2.5">
                            <p.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground w-16 text-right">{p.label}</span>
                            <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${p.color} rounded-full`}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(p.score / p.max) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-foreground w-10 text-right">{p.score}/{p.max}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Loopy feedback */}
                    <div className="mt-5 flex items-start gap-2.5 bg-surface-1 border border-border/50 px-4 py-3">
                      <GateIcon className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        "the color grading goes crazy tbh, sync is hitting on beat drops. identity could use more signature moves tho — u got potential fr"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Text — 2 cols */}
              <motion.div
                className="md:col-span-2 text-center md:text-left"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
              >
                <motion.span variants={fadeUp} custom={0} className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.3em] uppercase text-purple-400 mb-4">
                  <Brain className="w-3.5 h-3.5" /> Smart Rating
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.85] mb-5">
                  LOOPY<br />RATES YOUR<br /><span className="text-purple-400">EDITS</span>
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base leading-relaxed mb-6">
                  Drop any TikTok, YouTube, or Instagram edit link. Loopy fetches the thumbnail, scrapes metadata, and runs a full multimodal diagnostic across 5 QOI pillars — instantly. Free.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2 mb-8">
                  {['Multimodal visual analysis', 'Real metadata extraction', '5-pillar QOI diagnostic', 'Personalized improvement tips', 'Full rating history'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/70 md:justify-start justify-center">
                      <div className="w-1 h-1 rounded-full bg-purple-400" /> {f}
                    </li>
                  ))}
                </motion.ul>
                <motion.div variants={fadeUp} custom={4}>
                  <Link to="/loopy">
                    <motion.div
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-display text-sm uppercase tracking-[0.15em] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow"
                    >
                      <GateIcon className="w-4 h-4" />
                      Rate My Edit — Free
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════ DOWNLOAD STRIP ═══════════════ */}
        <section className="border-y border-border bg-surface-0 py-16 sm:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Available Everywhere</span>
              <h2 className="font-display text-4xl sm:text-5xl mb-4">YOUR RANK FOLLOWS YOU</h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-8">
                Not available in your region? Use the web version for the full experience. No download needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <Link to="/start">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-display text-base px-10 py-4 h-auto gap-2.5">
                    <Play className="w-5 h-5" /> Open in Browser
                  </Button>
                </Link>
                <Link to="/download">
                  <Button size="lg" variant="outline" className="border-border/60 bg-transparent hover:bg-surface-1 text-muted-foreground font-display text-sm px-6 py-3 h-auto gap-2">
                    <Smartphone className="w-4 h-4" /> iOS App
                  </Button>
                </Link>
              </div>
              <div className="flex justify-center gap-3">
                {['iOS', 'Web', 'Android (Soon)'].map(p => (
                  <span key={p} className="px-4 py-1.5 bg-surface-1 border border-border text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">{p}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA — DRAMATIC ═══════════════ */}
        <section className="relative py-32 sm:py-40 overflow-hidden">
          <GatePattern className="z-[1]" opacity={4} tileSize={140} />
          <GlitchEdge side="left" className="absolute left-0 top-0 bottom-0 w-[2px] z-[2]" />
          <GlitchEdge side="right" className="absolute right-0 top-0 bottom-0 w-[2px] z-[2]" />
          <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_40%_60%_at_50%_50%,rgba(212,175,55,0.04),transparent)]" />
          
          <div className="max-w-3xl mx-auto text-center relative z-10 px-6">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold mb-6 block">Join the Movement</span>
              <h2 className="font-display text-5xl sm:text-6xl md:text-8xl leading-[0.85] mb-6">
                READY TO<br /><span className="text-gold">COMPETE?</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-sm mx-auto">
                Create your profile. Start climbing the global index.
              </p>
              <Link to="/start">
                <Button size="lg" className="group bg-gold hover:bg-gold/90 text-background font-display text-lg sm:text-xl px-12 py-7 h-auto tracking-wider">
                  Get Started <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FOOTER — EDITORIAL ═══════════════ */}
        <footer className="border-t border-border bg-surface-0">
          <div className="max-w-6xl mx-auto px-6">
            {/* Main footer grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-14">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-5">Product</h4>
                <div className="space-y-3">
                  <Link to="/download" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Download</Link>
                  <Link to="/start" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</Link>
                  <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                  <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                </div>
              </div>
              <div>
              <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-5">Company</h4>
                <div className="space-y-3">
                  <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                  <Link to="/enterprise" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
                  <Link to="/enterprise/account" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Artist Login</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-5">Legal</h4>
                <div className="space-y-3">
                  <Link to="/rules" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.25em] uppercase text-foreground mb-5">Community</h4>
                <div className="space-y-3">
                  <button onClick={handleGuestExplore} className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Explore as Guest</button>
                  <Link to="/loopy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Loopy Rating</Link>
                  <Link to="/gqt" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Take QOI Test</Link>
                </div>
              </div>
            </div>
            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border">
              <img src={loopgateLogo} alt="Loopgate" className="h-5 opacity-60" />
              <span className="text-[10px] text-muted-foreground tracking-wider">© {new Date().getFullYear()} Loopgate. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
