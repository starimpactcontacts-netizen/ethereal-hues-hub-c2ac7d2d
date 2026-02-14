import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Swords, Users, Gavel, Trophy, Flame, IterationCcw, Download, Globe, Smartphone, ChevronRight, Star, Zap, Target, Shield } from 'lucide-react';
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
          {/* Background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(212,175,55,0.06),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Sparkle dots */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-foreground/10 animate-pulse"
              style={{
                top: `${15 + Math.random() * 70}%`,
                left: `${5 + Math.random() * 90}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}

          <motion.div
            className="relative z-10 text-center max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Brand wordmark */}
            <motion.img
              src={loopgateBrand}
              alt="LOOPGATE"
              className="h-28 sm:h-40 md:h-56 lg:h-64 w-auto mx-auto mb-2 drop-shadow-[0_0_80px_rgba(255,255,255,0.25)]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
            />

            <motion.h1
              className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.06em] leading-[0.9] mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="text-foreground">WHERE EDITORS </span>
              <span className="text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">COMPETE</span>
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              1v1 battles, judge-scored ratings, global rankings, units — 
              the competitive infrastructure for video editors.
            </motion.p>

            {/* CTA row */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link to="/download" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-8 py-4 h-auto w-full sm:w-auto gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download for iOS
                </Button>
              </Link>
              <Link to="/start" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-surface-1 hover:bg-surface-2 text-foreground font-display text-base px-8 py-4 h-auto w-full sm:w-auto gap-2"
                >
                  <Globe className="w-5 h-5" />
                  Open in Browser
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Live stats bar at bottom */}
          <motion.div
            className="absolute bottom-6 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground font-medium">{stats.activeUsers || 0}</span> online now
              </span>
              <span className="w-px h-3 bg-border" />
              <span>
                <span className="text-foreground font-medium">{stats.totalCompeting || 0}</span> editors competing
              </span>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════ FEATURE 1: BATTLES ═══════════════ */}
        <FeatureSection
          align="left"
          accentFrom="from-red-500/10"
          accentTo="to-transparent"
          badge={{ icon: Swords, label: '1v1 BATTLES', color: 'text-red-400 bg-red-500/10 border-red-500/30' }}
          title="FIGHT FOR YOUR RANK"
          description="Challenge any editor to a 1v1 battle. Submit your best edit, get judged by certified judges, and climb the global rankings. Rapid or standard — you choose the stakes."
          features={['Judge-decided outcomes', 'Rapid & standard modes', 'XP & index points on the line']}
        />

        {/* ═══════════════ FEATURE 2: JUDGE SYSTEM ═══════════════ */}
        <FeatureSection
          align="right"
          accentFrom="from-gold/10"
          accentTo="to-transparent"
          badge={{ icon: Gavel, label: 'JUDGE ECOSYSTEM', color: 'text-gold bg-gold/10 border-gold/30' }}
          title="GET RATED BY REAL JUDGES"
          description="Submit any edit and receive a detailed QOI score across 5 pillars — Quality, Originality, Impact, Technique, and Presentation. Know exactly where you stand with your official Class ranking."
          features={['5-pillar scoring system', 'Certified judge panel', 'S++ to F class tiers']}
        />

        {/* ═══════════════ FEATURE 3: UNITS ═══════════════ */}
        <FeatureSection
          align="left"
          accentFrom="from-cyan-500/10"
          accentTo="to-transparent"
          badge={{ icon: Users, label: 'UNITS', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }}
          title="BUILD YOUR CREW"
          description="Create or join a Unit — your editing team. Private channels, role hierarchies, shared assets, announcements, and crew challenges. Represent your squad in tournaments and climb the unit leaderboard."
          features={['Channel-based comms', 'Editor tiers & roles', 'Unit challenges & XP']}
        />

        {/* ═══════════════ FEATURE 4: ARENA & EVENTS ═══════════════ */}
        <FeatureSection
          align="right"
          accentFrom="from-emerald-500/10"
          accentTo="to-transparent"
          badge={{ icon: Trophy, label: 'ARENA', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }}
          title="COMPETE IN LIVE EVENTS"
          description="Official arena events, open arenas with multiple rounds, hosted competitions from external communities — all running through the Loopgate infrastructure. Real stakes, real prizes, real clout."
          features={['Multi-round open arenas', 'Hosted external comps', 'Live leaderboards & chat']}
        />

        {/* ═══════════════ FEATURE 5: FEED & RANKINGS ═══════════════ */}
        <FeatureSection
          align="left"
          accentFrom="from-purple-500/10"
          accentTo="to-transparent"
          badge={{ icon: Flame, label: 'LOOP FEED', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' }}
          title="WATCH. LEARN. RISE."
          description="The Loop Feed surfaces the highest-rated edits from across the platform. See what S++ looks like. Track the global index. Discover rising talent before anyone else."
          features={['Top-rated edit discovery', 'Global index rankings', 'Editor profiles & stats']}
        />

        {/* ═══════════════ DOWNLOAD SECTION ═══════════════ */}
        <section className="py-24 px-4 relative overflow-hidden bg-surface-0 border-t border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(212,175,55,0.04),transparent)]" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mb-4">
                AVAILABLE <span className="text-gold">EVERYWHERE</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto mb-10">
                On your phone or your browser — your rank follows you. Download the iOS app or jump straight in from the web.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link to="/download">
                  <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-display text-base px-8 py-4 h-auto gap-2">
                    <Smartphone className="w-5 h-5" />
                    Download for iOS
                  </Button>
                </Link>
                <Link to="/start">
                  <Button size="lg" variant="outline" className="border-border bg-surface-1 hover:bg-surface-2 text-foreground font-display text-base px-8 py-4 h-auto gap-2">
                    <Globe className="w-5 h-5" />
                    Continue in Browser
                  </Button>
                </Link>
              </div>

              {/* Platform pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {['iOS', 'Web', 'Android (Soon)'].map(platform => (
                  <span
                    key={platform}
                    className="px-4 py-2 bg-surface-1 border border-border text-xs text-muted-foreground font-medium uppercase tracking-wider"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,rgba(212,175,55,0.05),transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-gold/5 rounded-full" />

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
                Create your profile and start climbing the global index.
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

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="py-16 px-4 border-t border-border bg-surface-0">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
              {/* Product */}
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Product</h4>
                <div className="space-y-3">
                  <Link to="/download" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Download</Link>
                  <Link to="/start" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</Link>
                  <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
                  <Link to="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                </div>
              </div>
              {/* Company */}
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Company</h4>
                <div className="space-y-3">
                  <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                  <Link to="/enterprise" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
                  <Link to="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
                </div>
              </div>
              {/* Legal */}
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-4">Legal</h4>
                <div className="space-y-3">
                  <Link to="/rules" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Rules</Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
                </div>
              </div>
              {/* Community */}
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
                <span className="font-display text-lg tracking-tight">LOOPGATE</span>
              </div>
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Loopgate. All rights reserved.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ═══════════════ REUSABLE FEATURE SECTION ═══════════════ */
interface FeatureSectionProps {
  align: 'left' | 'right';
  accentFrom: string;
  accentTo: string;
  badge: { icon: React.ElementType; label: string; color: string };
  title: string;
  description: string;
  features: string[];
}

function FeatureSection({ align, accentFrom, accentTo, badge, title, description, features }: FeatureSectionProps) {
  const Icon = badge.icon;
  return (
    <section className="py-20 sm:py-28 px-4 relative overflow-hidden border-t border-border">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentFrom} ${accentTo}`} />

      <div className={`max-w-5xl mx-auto relative z-10 flex flex-col ${align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-16`}>
        {/* Text side */}
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, x: align === 'left' ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest mb-6 ${badge.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {badge.label}
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.9] mb-5">
            {title}
          </h2>

          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
            {description}
          </p>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {features.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Visual side — abstract card mockup */}
        <motion.div
          className="flex-1 w-full max-w-md"
          initial={{ opacity: 0, x: align === 'left' ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-surface-1 to-surface-2 border border-border p-6 sm:p-8 flex flex-col justify-center">
            <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-5">
              <Icon className="w-7 h-7 text-gold" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-3/4 rounded bg-foreground/10" />
              <div className="h-3 w-1/2 rounded bg-foreground/6" />
              <div className="h-3 w-2/3 rounded bg-foreground/4" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded bg-surface-0 border border-border" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
