import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Swords, Gavel, Smartphone, Shield, Eye, Award, Play, ChevronDown } from 'lucide-react';
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

        {/* ═══════════════ HERO — PREVIEW-DOMINANT (Discord/Twitch style) ═══════════════ */}
        <section className="relative min-h-[100vh] flex flex-col overflow-hidden">
          {/* Full atmospheric bg */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-red-950/10" />
          <GatePattern className="z-[1]" opacity={2} tileSize={120} />
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-[120px] z-[1]" />
          <div className="absolute bottom-1/3 left-[10%] w-[400px] h-[400px] bg-red-500/[0.04] rounded-full blur-[100px] z-[1]" />
          <GlitchEdge side="left" className="absolute left-0 top-0 bottom-0 w-[3px] z-[3]" />
          <GlitchEdge side="right" className="absolute right-0 top-0 bottom-0 w-[3px] z-[3]" />

          {/* Compact text strip at top */}
          <div className="relative z-10 pt-10 sm:pt-14 pb-5 sm:pb-6 text-center px-6">
            <motion.img
              src={loopgateBrand}
              alt="LOOPGATE"
              className="h-10 sm:h-12 w-auto mx-auto mb-3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            />
            <motion.p
              className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              The competitive platform for video editors. Battle 1v1, get rated by certified judges, and climb the global rankings.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 items-center justify-center"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link to="/start">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-display text-lg px-12 py-5 h-auto gap-3 tracking-wider">
                  <Play className="w-5 h-5" />
                  Start Editing
                </Button>
              </Link>
              <button 
                onClick={handleGuestExplore}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display tracking-wider px-4 py-3"
              >
                Explore as Guest →
              </button>
            </motion.div>
            {/* Live stats */}
            <motion.div
              className="flex items-center gap-6 mt-4 text-sm text-muted-foreground justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-foreground font-semibold">{stats.activeUsers || 0}</span> editors online
              </span>
              <span className="flex items-center gap-2">
                <Swords className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground font-semibold">{stats.totalCompeting || 0}</span> competing
              </span>
            </motion.div>
          </div>

          {/* ──── MASSIVE CODE-BUILT APP PREVIEW ──── */}
          <div className="relative z-10 flex-1 flex items-end justify-center px-4 sm:px-8 pb-16">
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-gold/[0.04] via-transparent to-transparent pointer-events-none" />
            
            <motion.div
              className="relative w-full max-w-6xl"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Desktop mockup — sharp corners, AAA fidelity */}
              <div className="relative overflow-hidden border border-border/40 shadow-2xl shadow-black/60">
                {/* Browser chrome */}
                <div className="h-8 sm:h-9 bg-[hsl(var(--surface-1))] border-b border-border/30 flex items-center px-3 sm:px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-6 sm:mx-12">
                    <div className="bg-surface-2/40 border border-border/20 h-4 sm:h-5 flex items-center px-3 gap-1.5 max-w-sm mx-auto">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">loopgate.io</span>
                    </div>
                  </div>
                </div>

                {/* ── App Layout ── */}
                <div className="flex min-h-[400px] sm:min-h-[520px] bg-background">
                  {/* Sidebar — icon-only nav */}
                  <div className="w-12 sm:w-[52px] bg-surface-0 border-r border-border/30 flex flex-col items-center py-3 sm:py-4 gap-1.5 sm:gap-2 flex-shrink-0">
                    <img src={loopgateLogo} alt="" className="w-6 h-6 sm:w-7 sm:h-7 opacity-90 mb-1" />
                    <div className="w-6 sm:w-7 h-px bg-border/20" />
                    {[
                      { icon: '🏠', active: true, label: 'Hub' },
                      { icon: '⚔️', active: false, label: 'Arena' },
                      { icon: '🏆', active: false, label: 'Ranks' },
                      { icon: '🛡', active: false, label: 'Units' },
                      { icon: '📰', active: false, label: 'Feed' },
                      { icon: '⚙️', active: false, label: 'Settings' },
                    ].map((item, i) => (
                      <div key={i} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[10px] sm:text-xs cursor-default transition-colors ${item.active ? 'bg-gold/15 border border-gold/25' : 'opacity-50 hover:opacity-80'}`}>
                        {item.icon}
                      </div>
                    ))}
                    <div className="flex-1" />
                    {/* User avatar */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500/40 to-red-900/40 border border-red-500/30 flex items-center justify-center">
                      <span className="text-[8px] sm:text-[10px] font-bold text-red-400">Y</span>
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="flex-1 overflow-hidden">
                    {/* App header */}
                    <div className="h-10 sm:h-12 border-b border-border/30 bg-surface-0/40 flex items-center justify-between px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-sm font-bold text-foreground uppercase tracking-[0.15em]">Hub</span>
                        <div className="w-px h-4 bg-border/20" />
                        <span className="text-[8px] sm:text-xs text-muted-foreground hidden sm:inline">Welcome back, <span className="text-foreground font-semibold">YXUNG</span></span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 bg-surface-1/80 border border-border/20 px-2 sm:px-2.5 py-0.5 sm:py-1">
                          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                          <span className="text-[7px] sm:text-[10px] text-emerald-400 font-bold tabular-nums">247 online</span>
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-surface-1 border border-border/20 flex items-center justify-center relative">
                          <span className="text-[9px] sm:text-xs">🔔</span>
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-surface-1 border border-border/20 flex items-center justify-center">
                          <span className="text-[9px] sm:text-xs">✉️</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">

                      {/* ── Featured Battle — hero card ── */}
                      <div className="border border-red-500/20 bg-gradient-to-r from-red-500/[0.05] via-transparent to-transparent overflow-hidden">
                        <div className="h-[2px] bg-gradient-to-r from-red-500 via-red-400/60 to-transparent" />
                        <div className="p-3 sm:p-5">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
                              <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">Featured Battle</span>
                              <span className="text-[7px] sm:text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 font-bold hidden sm:inline">RAPID</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[7px] sm:text-[10px] text-muted-foreground tabular-nums">342 watching</span>
                            </div>
                          </div>

                          {/* Competitors */}
                          <div className="flex items-center gap-4 sm:gap-8">
                            {/* Player 1 */}
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1">
                              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500/25 to-red-900/25 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm sm:text-lg font-display text-red-400">K</span>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-sm font-bold text-foreground tracking-wide">KXZEN</p>
                                <p className="text-[7px] sm:text-[10px] text-gold font-bold">S+ Class</p>
                                <p className="text-[6px] sm:text-[9px] text-muted-foreground tabular-nums">Index: 2,691</p>
                              </div>
                            </div>

                            {/* VS */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-display text-lg sm:text-2xl text-red-400/70">VS</span>
                              <div className="bg-surface-1 border border-border/20 px-2 py-0.5">
                                <span className="text-[6px] sm:text-[8px] text-muted-foreground font-bold tabular-nums">18H LEFT</span>
                              </div>
                            </div>

                            {/* Player 2 */}
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 justify-end">
                              <div className="text-right">
                                <p className="text-[10px] sm:text-sm font-bold text-foreground tracking-wide">RXSE</p>
                                <p className="text-[7px] sm:text-[10px] text-gold font-bold">S Class</p>
                                <p className="text-[6px] sm:text-[9px] text-muted-foreground tabular-nums">Index: 2,534</p>
                              </div>
                              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500/25 to-cyan-900/25 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm sm:text-lg font-display text-cyan-400">R</span>
                              </div>
                            </div>
                          </div>

                          {/* Judge bar */}
                          <div className="mt-3 sm:mt-4 flex items-center gap-2 bg-surface-0/80 border border-border/20 px-3 py-1.5 sm:py-2">
                            <Gavel className="w-3 h-3 text-gold" />
                            <span className="text-[7px] sm:text-[10px] text-muted-foreground">Judge: <span className="text-gold font-semibold">MVRKO</span></span>
                            <span className="w-px h-3 bg-border/20 mx-1" />
                            <span className="text-[7px] sm:text-[10px] text-muted-foreground">Awaiting submissions</span>
                            <span className="flex-1" />
                            <span className="text-[6px] sm:text-[9px] text-muted-foreground/50 hidden sm:inline">🎵 Night Lovell — Dark Light</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Two-col: Rankings + Live Activity ── */}
                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                        {/* Global Index — 3 cols */}
                        <div className="col-span-3 border border-border/25 bg-surface-0/40">
                          <div className="px-3 sm:px-4 py-2 border-b border-border/15 flex items-center justify-between">
                            <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Global Index</span>
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" /></span>
                              <span className="text-[7px] sm:text-[9px] text-red-400 font-bold">Live</span>
                            </div>
                          </div>
                          {/* Table header */}
                          <div className="flex items-center gap-1 px-3 sm:px-4 py-1 border-b border-border/10 text-[6px] sm:text-[8px] text-muted-foreground/60 uppercase tracking-wider">
                            <span className="w-5">#</span>
                            <span className="flex-1">Editor</span>
                            <span className="w-8 text-right">Class</span>
                            <span className="w-10 text-right hidden sm:block">Index</span>
                            <span className="w-7 text-right">Δ</span>
                          </div>
                          <div className="divide-y divide-border/10">
                            {[
                              { r: 1, n: 'PRXSTIGE', c: 'S++', idx: '2,847', ch: '+12', software: 'AE' },
                              { r: 2, n: 'KXZEN', c: 'S+', idx: '2,691', ch: '+8', software: 'PR' },
                              { r: 3, n: 'AETHRVL', c: 'S', idx: '2,534', ch: '-3', software: 'AE' },
                              { r: 4, n: 'RXSE', c: 'S', idx: '2,488', ch: '+15', software: 'CP' },
                              { r: 5, n: 'DVRK', c: 'A', idx: '2,301', ch: '+4', software: 'AE' },
                            ].map(row => (
                              <div key={row.r} className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 ${row.r === 1 ? 'bg-gold/[0.03]' : ''}`}>
                                <span className={`text-[8px] sm:text-[10px] font-bold w-5 tabular-nums ${row.r === 1 ? 'text-gold' : row.r <= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>#{row.r}</span>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-surface-2 border border-border/15 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[6px] sm:text-[8px] font-bold text-foreground">{row.n[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                  <p className={`text-[8px] sm:text-[11px] font-bold truncate ${row.r === 1 ? 'text-gold' : 'text-foreground'}`}>{row.n}</p>
                                  <span className="text-[5px] sm:text-[7px] text-muted-foreground/40 hidden sm:inline">{row.software}</span>
                                </div>
                                <span className="text-[7px] sm:text-[9px] text-gold font-bold w-8 text-right">{row.c}</span>
                                <span className="text-[7px] sm:text-[9px] text-muted-foreground w-10 text-right tabular-nums hidden sm:block">{row.idx}</span>
                                <span className={`text-[7px] sm:text-[9px] font-bold w-7 text-right tabular-nums ${row.ch.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{row.ch}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Live Activity — 2 cols */}
                        <div className="col-span-2 border border-border/25 bg-surface-0/40">
                          <div className="px-3 py-2 border-b border-border/15 flex items-center gap-2">
                            <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">Live Activity</span>
                          </div>
                          <div className="p-2 sm:p-3 space-y-2 sm:space-y-2.5">
                            {[
                              { user: 'NVDIA', action: 'won battle vs FLUX', time: '2m', color: 'text-emerald-400', icon: '🏆' },
                              { user: 'ZEPH', action: 'joined Unit NOVA', time: '5m', color: 'text-cyan-400', icon: '🛡' },
                              { user: 'PRXSTIGE', action: 'rated S Class', time: '12m', color: 'text-gold', icon: '⭐' },
                              { user: 'KXZEN', action: 'challenged DVRK', time: '18m', color: 'text-red-400', icon: '⚔️' },
                              { user: 'MVRKO', action: '3 reviews done', time: '24m', color: 'text-purple-400', icon: '📝' },
                            ].map((a, i) => (
                              <div key={i} className="flex items-start gap-1.5 sm:gap-2">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-surface-2 border border-border/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[6px] sm:text-[8px]">{a.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[7px] sm:text-[9px] leading-snug"><span className={`font-bold ${a.color}`}>{a.user}</span> <span className="text-muted-foreground">{a.action}</span></p>
                                </div>
                                <span className="text-[6px] sm:text-[8px] text-muted-foreground/40 flex-shrink-0 tabular-nums">{a.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── QOI Score — inline card ── */}
                      <div className="border border-gold/15 bg-gradient-to-r from-gold/[0.03] via-transparent to-transparent">
                        <div className="h-[2px] bg-gradient-to-r from-gold via-gold/40 to-transparent" />
                        <div className="p-2.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-gold/30 bg-gold/[0.06] flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-base sm:text-xl text-gold">84</span>
                          </div>
                          <div className="flex-1 space-y-0.5 sm:space-y-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[7px] sm:text-[10px] font-bold text-gold uppercase tracking-[0.15em]">Your QOI Score</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[6px] sm:text-[9px] text-gold font-bold">A CLASS</span>
                                <span className="text-[5px] sm:text-[8px] text-muted-foreground/40">Top 15%</span>
                              </div>
                            </div>
                            {[
                              { l: 'Emotion', v: 88, c: 'bg-emerald-500' },
                              { l: 'Creativity', v: 82, c: 'bg-cyan-500' },
                              { l: 'Sync', v: 90, c: 'bg-red-500' },
                              { l: 'Identity', v: 79, c: 'bg-purple-500' },
                              { l: 'Execution', v: 81, c: 'bg-gold' },
                            ].map(p => (
                              <div key={p.l} className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-[6px] sm:text-[8px] text-muted-foreground w-12 sm:w-16 text-right">{p.l}</span>
                                <div className="flex-1 h-[2px] sm:h-[3px] bg-surface-2 overflow-hidden"><div className={`h-full ${p.c}`} style={{ width: `${p.v}%` }} /></div>
                                <span className="text-[6px] sm:text-[8px] font-bold text-foreground w-4 sm:w-5 text-right tabular-nums">{p.v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="h-8 sm:h-10 bg-surface-0 border-t border-border/25 flex items-center justify-around px-6">
                  {['Hub', 'Arena', 'Feed', 'Rankings', 'Profile'].map((t, i) => (
                    <span key={t} className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.12em] ${i === 0 ? 'text-gold' : 'text-muted-foreground/40'}`}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Floating phone mockup */}
              <motion.div
                className="absolute -right-2 sm:right-4 -bottom-6 sm:-bottom-2 w-[100px] sm:w-[160px] md:w-[180px]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="border border-border/50 bg-background shadow-xl shadow-black/40 overflow-hidden" style={{ borderRadius: '14px' }}>
                  <div className="h-4 sm:h-5 bg-surface-0 border-b border-border/20 flex items-center justify-center">
                    <div className="w-10 sm:w-14 h-1.5 sm:h-2 bg-surface-2/60" style={{ borderRadius: '4px' }} />
                  </div>
                  <div className="p-2 sm:p-2.5 space-y-1.5 sm:space-y-2 min-h-[160px] sm:min-h-[220px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] sm:text-[9px] font-bold text-foreground uppercase tracking-widest">Arena</span>
                      <span className="text-[5px] sm:text-[7px] text-red-400 font-bold bg-red-500/10 px-1 py-0.5">3 LIVE</span>
                    </div>
                    {[
                      { p1: 'NVDIA', p2: 'FLUX', status: 'Judging', statusColor: 'text-gold' },
                      { p1: 'ZEPH', p2: 'PRXS', status: 'Live', statusColor: 'text-red-400' },
                    ].map((b, i) => (
                      <div key={i} className="border border-border/30 bg-surface-0 p-1.5 sm:p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500/15 border border-red-500/20 flex items-center justify-center"><span className="text-[5px] sm:text-[6px] font-bold text-red-400">{b.p1[0]}</span></div>
                            <span className="text-[6px] sm:text-[8px] font-bold text-foreground">{b.p1}</span>
                          </div>
                          <span className="text-[6px] sm:text-[7px] text-muted-foreground/60">vs</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[6px] sm:text-[8px] font-bold text-foreground">{b.p2}</span>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center"><span className="text-[5px] sm:text-[6px] font-bold text-cyan-400">{b.p2[0]}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {b.status === 'Live' && <span className="relative flex h-1 w-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-1 w-1 bg-red-500" /></span>}
                          <span className={`text-[5px] sm:text-[7px] font-bold uppercase tracking-wider ${b.statusColor}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border border-gold/15 bg-gold/[0.03] p-1.5 sm:p-2">
                      <span className="text-[6px] sm:text-[8px] text-gold font-bold block mb-0.5">Your Stats</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[{ l: 'W/L', v: '12/3' }, { l: 'Rank', v: '#47' }, { l: 'Class', v: 'A' }].map(s => (
                          <div key={s.l} className="text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-foreground">{s.v}</p>
                            <p className="text-[4px] sm:text-[6px] text-muted-foreground uppercase">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="h-5 sm:h-6 bg-surface-0 border-t border-border/20 flex items-center justify-around px-2 sm:px-3">
                    {['🏠', '⚔️', '📊', '👤'].map((e, i) => (
                      <span key={i} className={`text-[8px] sm:text-[10px] ${i === 1 ? 'opacity-100' : 'opacity-40'}`}>{e}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
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
