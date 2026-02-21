import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Swords, Users, Gavel, Trophy, Flame, Download, Globe, Smartphone, Target, Crown, Shield, Eye, MessageSquare, TrendingUp, Award, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import GatePattern from '@/components/loopgate/GatePattern';
import GlitchEdge from '@/components/loopgate/GlitchEdge';
import { useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import loopgateBrand from '@/assets/loopgate-brand.png';
import loopgateLogo from '@/assets/loopgate-logo.png';
import atlasStatue from '@/assets/atlas-statue.png';

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
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

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

        {/* ═══════════════ HERO — CINEMATIC FULL BLEED ═══════════════ */}
        <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden">
          {/* Layered background */}
          <div className="absolute inset-0 bg-background" />
          <GatePattern className="z-[1]" opacity={3} tileSize={100} />
          <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(255,255,255,0.03),transparent)]" />
          
          {/* Glitch accent edges */}
          <GlitchEdge side="left" className="absolute left-0 top-0 bottom-0 w-[3px] z-[3]" />
          <GlitchEdge side="right" className="absolute right-0 top-0 bottom-0 w-[3px] z-[3]" />

          <motion.div
            className="relative z-10 text-center px-4 max-w-6xl mx-auto"
            style={{ y: heroParallax }}
          >
            {/* Overline */}
            <motion.div
              className="mb-8"
              variants={fadeUp} custom={0} initial="hidden" animate="visible"
            >
              <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase text-muted-foreground border-b border-border pb-2">
                The Competitive Platform for Video Editors
              </span>
            </motion.div>

            {/* Logo — massive, dominant */}
            <motion.img
              src={loopgateBrand}
              alt="LOOPGATE"
              className="h-28 sm:h-44 md:h-60 lg:h-72 w-auto mx-auto mb-8"
              variants={fadeUp} custom={1} initial="hidden" animate="visible"
            />

            {/* Tagline — clearly secondary */}
            <motion.div
              className="mb-6"
              variants={fadeUp} custom={2} initial="hidden" animate="visible"
            >
              <h1 className="font-display text-xl sm:text-3xl md:text-4xl tracking-[0.06em] leading-[0.85]">
                WHERE EDITORS
              </h1>
              <h1 className="font-display text-xl sm:text-3xl md:text-4xl tracking-[0.06em] leading-[0.85] text-gold">
                COMPETE
              </h1>
            </motion.div>

            {/* Sub — restrained, confident */}
            <motion.p
              className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-12 leading-relaxed"
              variants={fadeUp} custom={3} initial="hidden" animate="visible"
            >
              Battle head to head. Get rated by real judges.<br className="hidden sm:block" /> Climb the global rankings.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16"
              variants={fadeUp} custom={4} initial="hidden" animate="visible"
            >
              <Link to="/download">
                <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-10 py-5 h-auto gap-2.5 tracking-wider">
                  <Download className="w-5 h-5" />
                  Download for iOS
                </Button>
              </Link>
              <Link to="/start">
                <Button size="lg" variant="outline" className="border-border/60 bg-transparent hover:bg-surface-1 text-foreground font-display text-base px-10 py-5 h-auto gap-2.5 tracking-wider">
                  <Globe className="w-5 h-5" />
                  Open in Browser
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Bottom live ticker */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/50 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-foreground font-semibold">{stats.activeUsers || 0}</span> online
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <Swords className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground font-semibold">{stats.totalCompeting || 0}</span> competing
                </span>
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hidden sm:block">
                Scroll to explore
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce sm:hidden" />
            </div>
          </motion.div>
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

        {/* ═══════════════ FEATURE 3+4: SIDE BY SIDE GRID ═══════════════ */}
        <section className="border-t border-border bg-surface-0 py-24 sm:py-32 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* UNITS */}
              <motion.div
                className="border border-border bg-background p-8 sm:p-10 relative overflow-hidden group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400 mb-4">
                  👥 Units
                </span>
                <h3 className="font-display text-3xl sm:text-4xl leading-[0.9] mb-4">BUILD YOUR CREW</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  Create or join a Unit. Private channels, role hierarchies, shared assets, announcements. Represent your squad in the rankings.
                </p>
                {/* Mini channel mockup */}
                <div className="border border-border/50 bg-surface-0">
                  <div className="px-4 py-2.5 flex items-center gap-2.5 border-b border-border/50">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-[9px] font-bold text-background">VC</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Viral Cartel</p>
                      <p className="text-[9px] text-cyan-400">128 members</p>
                    </div>
                  </div>
                  <div className="p-3 space-y-0.5">
                    {['# general', '# showcase', '# battle-talk'].map((ch, i) => (
                      <div key={ch} className={`flex items-center justify-between px-3 py-1.5 text-xs ${i === 0 ? 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/10' : 'text-muted-foreground'}`}>
                        <span>{ch}</span>
                        {i === 2 && <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] text-background font-bold flex items-center justify-center">7</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="mt-6 space-y-1.5">
                  {['Channel based communication', 'Editor tiers and roles', 'Unit challenges and XP'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* ARENA */}
              <motion.div
                className="border border-border bg-background p-8 sm:p-10 relative overflow-hidden group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
                <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-400 mb-4">
                  🏟 Arena
                </span>
                <h3 className="font-display text-3xl sm:text-4xl leading-[0.9] mb-4">COMPETE IN LIVE EVENTS</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  Official arena events with multiple rounds. Hosted competitions from external communities. Real stakes, real prizes.
                </p>
                {/* Mini event mockup */}
                <div className="border border-border/50 bg-surface-0 overflow-hidden">
                  <div className="relative h-24 bg-gradient-to-br from-emerald-900/30 via-surface-1 to-gold/5 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-gold/20" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-background">Live</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-background/80 border border-gold/40 px-2 py-0.5">
                      <span className="font-display text-sm text-gold">$500</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-display text-sm text-foreground mb-0.5">EDIT WAR: SEASON 3</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Open Arena • Gold League</p>
                    <div className="flex gap-1">
                      {['R1', 'R2', 'R3'].map((r, i) => (
                        <div key={r} className={`flex-1 text-center py-1 text-[8px] uppercase tracking-wider border ${
                          i === 1 ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-surface-1 border-border text-muted-foreground/50'
                        }`}>
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <ul className="mt-6 space-y-1.5">
                  {['Multi round open arenas', 'Hosted external competitions', 'Live leaderboards and chat'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 5: GLOBAL INDEX — FULL WIDTH ═══════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/[0.03] to-background" />
          <GatePattern className="z-[1]" opacity={2} tileSize={80} />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-center">
              {/* Rankings — takes 3 cols */}
              <motion.div
                className="md:col-span-3 md:order-2"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border border-border bg-surface-0 overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
                  <div className="px-5 py-3.5 flex items-center justify-between border-b border-border/50">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">🔥 Global Index</span>
                    <span className="text-[10px] text-muted-foreground">Updated live</span>
                  </div>
                  <div className="p-4">
                    {[
                      { rank: 1, name: 'xMontage', score: 2847, cls: 'S++', clsColor: 'text-gold' },
                      { rank: 2, name: 'KXZEN', score: 2691, cls: 'S+', clsColor: 'text-gold' },
                      { rank: 3, name: 'novacut', score: 2534, cls: 'S', clsColor: 'text-gold/80' },
                      { rank: 4, name: 'FLUX', score: 2410, cls: 'A', clsColor: 'text-emerald-400' },
                      { rank: 5, name: 'RXSE', score: 2388, cls: 'A', clsColor: 'text-emerald-400' },
                    ].map((e, i) => (
                      <div key={e.rank} className={`flex items-center gap-3 px-4 py-3 mb-1 ${i === 0 ? 'bg-gold/5 border border-gold/15' : 'border border-transparent'}`}>
                        <span className={`font-display text-lg w-6 text-center ${i === 0 ? 'text-gold' : 'text-muted-foreground'}`}>{e.rank}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                          <span className="text-[10px] font-bold text-muted-foreground">{e.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${i === 0 ? 'text-gold' : 'text-foreground'}`}>{e.name}</p>
                        </div>
                        <span className={`text-[10px] font-bold ${e.clsColor}`}>{e.cls}</span>
                        <span className="font-display text-sm text-foreground w-12 text-right">{e.score}</span>
                      </div>
                    ))}
                    <div className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-surface-1 border border-border/50">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-muted-foreground"><span className="text-emerald-400 font-semibold">+23</span> new editors this week</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Text — takes 2 cols */}
              <motion.div
                className="md:col-span-2 md:order-1 text-center md:text-left"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
              >
                <motion.span variants={fadeUp} custom={0} className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-purple-400 mb-4">
                  🔥 Loop Feed & Index
                </motion.span>
                <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.85] mb-5">
                  WATCH.<br />LEARN.<br />RISE.
                </motion.h2>
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base leading-relaxed mb-6">
                  The Loop Feed surfaces the highest rated edits. Track the global index, discover rising talent, and see what S++ really looks like.
                </motion.p>
                <motion.ul variants={fadeUp} custom={3} className="space-y-2">
                  {['Top rated edit discovery', 'Global index rankings', 'Editor profiles and stats'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/70 md:justify-start justify-center">
                      <div className="w-1 h-1 rounded-full bg-purple-400" /> {f}
                    </li>
                  ))}
                </motion.ul>
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
                <Link to="/download">
                  <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-8 py-4 h-auto gap-2">
                    <Smartphone className="w-5 h-5" /> Download for iOS
                  </Button>
                </Link>
                <Link to="/start">
                  <Button size="lg" variant="outline" className="border-border/60 bg-transparent hover:bg-surface-1 text-foreground font-display text-base px-8 py-4 h-auto gap-2">
                    <Globe className="w-5 h-5" /> Continue in Browser
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
              className="font-display text-3xl sm:text-5xl md:text-6xl leading-[0.85]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              &ldquo;EVERY LEGEND STARTED AT <span className="text-gold">F CLASS</span>.&rdquo;
            </motion.p>
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
