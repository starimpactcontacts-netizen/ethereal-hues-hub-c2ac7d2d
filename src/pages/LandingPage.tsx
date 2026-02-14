import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Swords, Users, Gavel, Trophy, Flame, Download, Globe, Smartphone, ChevronRight, Star, Zap, Target, Crown, Shield, Eye, MessageSquare, TrendingUp, Award, BarChart3, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import LandingHeader from '@/components/loopgate/LandingHeader';
import IOSAppBanner from '@/components/loopgate/iOSAppBanner';
import { useGlobalStats } from '@/hooks/useRealData';
import SEO, { pageSEO } from '@/components/SEO';
import { useGuestMode } from '@/hooks/useGuestMode';
import loopgateBrand from '@/assets/loopgate-brand.png';
import loopgateLogo from '@/assets/loopgate-logo.png';

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

        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,175,55,0.06),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {[...Array(12)].map((_, i) =>
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-foreground/10 animate-pulse"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${5 + Math.random() * 90}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }} />

          )}

          <motion.div
            className="relative z-10 text-center max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}>

            <motion.img
              src={loopgateBrand}
              alt="LOOPGATE"
              className="h-28 sm:h-40 md:h-56 lg:h-64 w-auto mx-auto mb-2 drop-shadow-[0_0_80px_rgba(255,255,255,0.25)]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }} />


            <motion.h1
              className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.06em] leading-[0.9] mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}>

              <span className="text-foreground">WHERE EDITORS </span>
              <span className="text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">COMPETE</span>
            </motion.h1>

             <motion.p
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}>

              The competitive platform for video editors. Battle head to head, get rated by real judges, and climb the global rankings.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}>

              <Link to="/download" className="w-full sm:w-auto">
                <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-8 py-4 h-auto w-full sm:w-auto gap-2">
                  <Download className="w-5 h-5" />
                  Download for iOS
                </Button>
              </Link>
              <Link to="/start" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-border bg-surface-1 hover:bg-surface-2 text-foreground font-display text-base px-8 py-4 h-auto w-full sm:w-auto gap-2">
                  <Globe className="w-5 h-5" />
                  Open in Browser
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-6 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground font-medium">{stats.activeUsers || 0}</span> online now
              </span>
              <span className="w-px h-3 bg-border" />
              <span><span className="text-foreground font-medium">{stats.totalCompeting || 0}</span> editors competing</span>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════ FEATURE 1: 1v1 BATTLES ═══════════════ */}
        <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* Text */}
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 text-red-400 bg-red-500/10 border-red-500/30">
                <Swords className="w-3.5 h-3.5" /> 1v1 BATTLES
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">FIGHT FOR YOUR RANK</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-6">
                Challenge any editor to a head to head battle. Submit your best work, get judged by certified judges, and watch your rank move. Rapid or standard. You choose the stakes.
              </p>
              <ul className="space-y-2.5">
                {['Judge decided outcomes', 'Rapid and standard modes', 'XP and index points on the line'].map((f) =>
                <li key={f} className="flex items-center gap-3 text-sm text-foreground/80 md:justify-start justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" /> {f}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Visual: Battle Card Mockup */}
            <motion.div className="flex-1 w-full max-w-md" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-surface-1 to-surface-0 overflow-hidden shadow-[0_0_60px_-20px_rgba(239,68,68,0.15)]">
                {/* Battle header */}
                <div className="bg-gradient-to-r from-red-500/20 via-surface-1 to-red-500/20 px-4 py-3 flex items-center justify-between border-b border-red-500/10">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">⚔️ LIVE BATTLE</span>
                  </div>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">⚡ RAPID</span>
                </div>
                {/* VS layout */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    {/* Challenger */}
                    <div className="text-center flex-1">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-red-500/30 to-red-900/30 border-2 border-red-500/40 flex items-center justify-center mb-2">
                        <span className="font-display text-lg text-red-400">K</span>
                      </div>
                      <p className="font-display text-sm text-foreground">KXZEN</p>
                      <span className="text-[10px] text-gold uppercase">A Class</span>
                    </div>
                    {/* VS */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-display text-2xl text-red-400">VS</span>
                      <span className="text-[9px] text-muted-foreground">24H LEFT</span>
                    </div>
                    {/* Opponent */}
                    <div className="text-center flex-1">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-500/30 to-cyan-900/30 border-2 border-cyan-500/40 flex items-center justify-center mb-2">
                        <span className="font-display text-lg text-cyan-400">R</span>
                      </div>
                      <p className="font-display text-sm text-foreground">RXSE</p>
                      <span className="text-[10px] text-gold uppercase">S Class</span>
                    </div>
                  </div>
                  {/* Status bar */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-to-r from-red-500 to-red-400 rounded-full" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Judging</span>
                  </div>
                  {/* Judge */}
                  <div className="mt-3 flex items-center gap-2 bg-surface-2/50 border border-border rounded-lg px-3 py-2">
                    <Gavel className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] text-muted-foreground">Judge: <span className="text-gold font-semibold">MVRKO</span></span>
                    <div className="ml-auto flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">142</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 2: JUDGE SYSTEM ═══════════════ */}
        <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-bl from-gold/[0.03] to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 text-gold bg-gold/10 border-gold/30">
                <Gavel className="w-3.5 h-3.5" /> THE BUREAU
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">GET RATED BY REAL JUDGES</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-6">
                Submit any edit and receive a detailed QOI score across five pillars. Know exactly where you stand with your official class ranking, from S++ all the way down to F.
              </p>
              <ul className="space-y-2.5">
                {['Five pillar QOI scoring', 'Certified judge panel', 'S++ to F class tiers'].map((f) =>
                <li key={f} className="flex items-center gap-3 text-sm text-foreground/80 md:justify-start justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" /> {f}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Visual: QOI Score Card */}
            <motion.div className="flex-1 w-full max-w-md" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-surface-1 to-surface-0 overflow-hidden shadow-[0_0_60px_-20px_rgba(212,175,55,0.15)]">
                <div className="bg-gradient-to-r from-gold/15 via-surface-1 to-gold/15 px-4 py-3 flex items-center justify-between border-b border-gold/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold">QOI SCORE RESULT</span>
                  <span className="text-[10px] text-muted-foreground">48h ago</span>
                </div>
                <div className="p-5">
                  {/* Big Score */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-gold bg-gold/10 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                      <span className="font-display text-4xl text-gold">84</span>
                    </div>
                    <p className="font-display text-xl text-gold mt-2">A CLASS</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top 15% globally</p>
                  </div>
                  {/* 5 Pillars */}
                  <div className="space-y-2.5">
                    {[
                    { label: 'Quality', score: 88, color: 'bg-emerald-500' },
                    { label: 'Originality', score: 82, color: 'bg-cyan-500' },
                    { label: 'Impact', score: 90, color: 'bg-red-500' },
                    { label: 'Technique', score: 79, color: 'bg-purple-500' },
                    { label: 'Presentation', score: 81, color: 'bg-gold' }].
                    map((p) =>
                    <div key={p.label} className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground w-24 text-right">{p.label}</span>
                        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                          <motion.div
                          className={`h-full ${p.color} rounded-full`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.3 }} />

                        </div>
                        <span className="text-xs font-semibold text-foreground w-8">{p.score}</span>
                      </div>
                    )}
                  </div>
                  {/* Judge attribution */}
                  <div className="mt-4 flex items-center gap-2 bg-surface-2/50 border border-border rounded-lg px-3 py-2">
                    <Award className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] text-muted-foreground">Reviewed by <span className="text-foreground font-semibold">Judge VALERIA</span></span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 3: UNITS ═══════════════ */}
        <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                <Users className="w-3.5 h-3.5" /> UNITS
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">BUILD YOUR CREW</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-6">
                Create or join a Unit. Your editing team with private channels, role hierarchies, shared assets, announcements, and crew challenges. Represent your squad.
              </p>
              <ul className="space-y-2.5">
                {['Channel based communication', 'Editor tiers and roles', 'Unit challenges and XP'].map((f) =>
                <li key={f} className="flex items-center gap-3 text-sm text-foreground/80 md:justify-start justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" /> {f}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Visual: Unit/Server Mockup */}
            <motion.div className="flex-1 w-full max-w-md" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-surface-1 to-surface-0 overflow-hidden shadow-[0_0_60px_-20px_rgba(34,211,238,0.12)]">
                {/* Unit header */}
                <div className="bg-gradient-to-r from-cyan-500/15 via-surface-1 to-cyan-500/15 px-4 py-3 flex items-center gap-3 border-b border-cyan-500/10">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-xs font-bold text-background">VC</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Viral Cartel</p>
                    <p className="text-[10px] text-cyan-400">128 members • 24 online</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400">LIVE</span>
                  </div>
                </div>
                {/* Channels */}
                <div className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-2">Channels</p>
                  {[
                  { name: '# general', unread: 3, active: true },
                  { name: '# showcase', unread: 0, active: false },
                  { name: '# announcements', unread: 1, active: false },
                  { name: '# battle-talk', unread: 7, active: false }].
                  map((ch) =>
                  <div key={ch.name} className={`flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 ${ch.active ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-surface-2/50'}`}>
                      <span className={`text-sm ${ch.active ? 'text-cyan-400 font-semibold' : 'text-muted-foreground'}`}>{ch.name}</span>
                      {ch.unread > 0 &&
                    <span className="w-5 h-5 rounded-full bg-red-500 text-[10px] text-background font-bold flex items-center justify-center">{ch.unread}</span>
                    }
                    </div>
                  )}
                  {/* Members preview */}
                  <div className="mt-3 px-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Online — 24</p>
                    <div className="space-y-1.5">
                      {[
                      { name: 'xMontage', role: 'Leader', color: 'text-gold' },
                      { name: 'FLUX', role: 'Editor', color: 'text-cyan-400' },
                      { name: 'novacut', role: 'Editor', color: 'text-cyan-400' }].
                      map((m) =>
                      <div key={m.name} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-muted-foreground">{m.name[0]}</span>
                          </div>
                          <span className="text-xs text-foreground">{m.name}</span>
                          <span className={`text-[9px] ${m.color} font-semibold`}>{m.role}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 4: ARENA & EVENTS ═══════════════ */}
        <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/[0.03] to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                <Trophy className="w-3.5 h-3.5" /> ARENA
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">COMPETE IN LIVE EVENTS</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-6">
                Official arena events with multiple rounds. Hosted competitions from external communities. Everything runs through Loopgate. Real stakes, real prizes.
              </p>
              <ul className="space-y-2.5">
                {['Multi round open arenas', 'Hosted external competitions', 'Live leaderboards and chat'].map((f) =>
                <li key={f} className="flex items-center gap-3 text-sm text-foreground/80 md:justify-start justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> {f}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Visual: Arena Event Card */}
            <motion.div className="flex-1 w-full max-w-md" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-surface-1 to-surface-0 overflow-hidden shadow-[0_0_60px_-20px_rgba(16,185,129,0.12)]">
                {/* Event poster area */}
                <div className="relative h-36 bg-gradient-to-br from-emerald-900/40 via-surface-1 to-gold/10 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-gold/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-background">Live</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/90 border border-gold/50 px-3 py-1.5">
                    <span className="font-display text-lg text-gold">$500</span>
                  </div>
                </div>
                {/* Event info */}
                <div className="p-4">
                  <h3 className="font-display text-xl text-foreground mb-1">EDIT WAR: SEASON 3</h3>
                  <p className="text-xs text-muted-foreground mb-3">Open Arena • Gold League</p>
                  {/* Round indicators */}
                  <div className="flex gap-1.5 mb-3">
                    {['R1', 'R2', 'R3'].map((r, i) =>
                    <div key={r} className={`flex-1 text-center py-1.5 text-[9px] uppercase tracking-wider border ${
                    i === 0 ? 'bg-muted/50 border-border text-muted-foreground' :
                    i === 1 ? 'bg-gold/20 border-gold/50 text-gold' :
                    'bg-surface-2 border-border text-muted-foreground/60'}`
                    }>
                        {r}{i === 1 && <span className="ml-1 inline-block w-1 h-1 rounded-full bg-gold animate-pulse" />}
                      </div>
                    )}
                  </div>
                  {/* Countdown placeholder */}
                  <div className="bg-background border border-border p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Round 2 Ends</p>
                    <div className="flex justify-center gap-3 font-display text-2xl text-foreground">
                      <span>02</span><span className="text-muted-foreground">:</span>
                      <span>14</span><span className="text-muted-foreground">:</span>
                      <span>37</span>
                    </div>
                  </div>
                  {/* Participants */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground"><span className="text-foreground font-semibold">47</span> contenders</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Live chat</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FEATURE 5: RANKINGS & FEED ═══════════════ */}
        <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] to-transparent" />
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 text-purple-400 bg-purple-500/10 border-purple-500/30">
                <Flame className="w-3.5 h-3.5" /> LOOP FEED & INDEX
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">WATCH. LEARN. RISE.</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-6">
                The Loop Feed surfaces the highest rated edits from across the platform. Track the global index, discover rising talent, and see what S++ really looks like.
              </p>
              <ul className="space-y-2.5">
                {['Top rated edit discovery', 'Global index rankings', 'Editor profiles and stats'].map((f) =>
                <li key={f} className="flex items-center gap-3 text-sm text-foreground/80 md:justify-start justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" /> {f}
                  </li>
                )}
              </ul>
            </motion.div>

            {/* Visual: Rankings + Feed */}
            <motion.div className="flex-1 w-full max-w-md" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-surface-1 to-surface-0 overflow-hidden shadow-[0_0_60px_-20px_rgba(168,85,247,0.12)]">
                <div className="bg-gradient-to-r from-purple-500/15 via-surface-1 to-purple-500/15 px-4 py-3 flex items-center justify-between border-b border-purple-500/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">🔥 GLOBAL INDEX</span>
                  <span className="text-[10px] text-muted-foreground">Updated live</span>
                </div>
                <div className="p-3">
                  {/* Top 5 rankings */}
                  {[
                  { rank: 1, name: 'xMontage', score: 2847, cls: 'S++', clsColor: 'text-gold' },
                  { rank: 2, name: 'KXZEN', score: 2691, cls: 'S+', clsColor: 'text-gold' },
                  { rank: 3, name: 'novacut', score: 2534, cls: 'S', clsColor: 'text-gold/80' },
                  { rank: 4, name: 'FLUX', score: 2410, cls: 'A', clsColor: 'text-emerald-400' },
                  { rank: 5, name: 'RXSE', score: 2388, cls: 'A', clsColor: 'text-emerald-400' }].
                  map((e, i) =>
                  <div key={e.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 ${i === 0 ? 'bg-gold/5 border border-gold/20' : ''}`}>
                      <span className={`font-display text-lg w-6 text-center ${i === 0 ? 'text-gold' : 'text-muted-foreground'}`}>{e.rank}</span>
                      <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-muted-foreground">{e.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${i === 0 ? 'text-gold' : 'text-foreground'}`}>{e.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold ${e.clsColor}`}>{e.cls}</span>
                      <span className="font-display text-sm text-foreground w-12 text-right">{e.score}</span>
                    </div>
                  )}
                  {/* Trending indicator */}
                  <div className="mt-2 flex items-center justify-center gap-2 py-2 bg-surface-2/50 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-muted-foreground"><span className="text-emerald-400 font-semibold">+23</span> new editors this week</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ DOWNLOAD SECTION ═══════════════ */}
        <section className="py-24 px-4 relative overflow-hidden bg-surface-0 border-t border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(212,175,55,0.04),transparent)]" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mb-4">
                AVAILABLE <span className="text-gold">EVERYWHERE</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-10">
                On your phone or in your browser. Your rank follows you everywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link to="/download">
                  <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-8 py-4 h-auto gap-2">
                    <Smartphone className="w-5 h-5" /> Download for iOS
                  </Button>
                </Link>
                <Link to="/start">
                  <Button size="lg" variant="outline" className="border-border bg-surface-1 hover:bg-surface-2 text-foreground font-display text-base px-8 py-4 h-auto gap-2">
                    <Globe className="w-5 h-5" /> Continue in Browser
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto">
                Not available in your region? Use the web version for the full experience. No download needed. Works on any device.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['iOS', 'Web', 'Android (Soon)'].map((p) =>
                <span key={p} className="px-4 py-2 bg-surface-1 border border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">{p}</span>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,rgba(212,175,55,0.05),transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-gold/5 rounded-full" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl mb-6">Ready to Compete?</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">Create your profile. Start climbing the global index.</p>
              <Link to="/start">
                <Button size="lg" className="group bg-gold hover:bg-gold/90 text-background font-display text-xl px-12 py-8 h-auto">
                  Get Started <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="py-16 px-4 border-t border-border bg-surface-0">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Product</h4>
                <div className="space-y-3">
                  <Link to="/download" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Download</Link>
                  <Link to="/start" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</Link>
                  <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                  <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                </div>
              </div>
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Company</h4>
                <div className="space-y-3">
                  <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                  <Link to="/enterprise" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                </div>
              </div>
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Legal</h4>
                <div className="space-y-3">
                  <Link to="/rules" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                </div>
              </div>
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Community</h4>
                <div className="space-y-3">
                  <button onClick={handleGuestExplore} className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left">Explore as Guest</button>
                  <Link to="/gqt" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Take QOI Test</Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
              <div className="flex items-center gap-3">
                <img src={loopgateLogo} alt="Loopgate" className="h-5" />
                <span className="font-display text-lg tracking-tight">
                </span>
              </div>
              <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Loopgate. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </>);
}