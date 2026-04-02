import { ArrowLeft, Trophy, Users, Zap, Globe, Swords, Star, Shield, Target, Flame, Eye, Music, Film, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO, { pageSEO } from '@/components/SEO';
import GatePattern from '@/components/loopgate/GatePattern';

const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

const FEATURES = [
  { icon: Swords, title: '1v1 Edit Battles', desc: 'Challenge any editor head-to-head. Both sides get the same footage, same deadline. A certified judge scores on Quality, Originality, and Impact. Your rank moves based on the result.', color: 'text-red-400' },
  { icon: Trophy, title: 'Live Arena Events', desc: 'Official competitions hosted by artists, brands, and film studios. Open Arena mode lets unlimited editors compete simultaneously. Featured Events carry larger prize pools and Index Score multipliers.', color: 'text-gold' },
  { icon: Shield, title: 'Judge Division', desc: 'Certified judges review every submission on the 0–100 QOI scale. Judges earn XP, climb their own leaderboard, and unlock authority badges. Biased or inactive judges get flagged and removed.', color: 'text-purple-400' },
  { icon: Eye, title: 'Rate My Edit (Loopy)', desc: 'Get a free instant AI rating on any edit you upload. Loopy analyzes pacing, transitions, color grading, and overall impact — then gives you a brutally honest score with actionable feedback.', color: 'text-cyan-400' },
  { icon: Users, title: 'Units (Crews)', desc: 'Form or join a crew. Units compete together in crew-vs-crew challenges, share assets, run internal channels, and climb the crew leaderboard. Think of it as your editing guild.', color: 'text-emerald-400' },
  { icon: Target, title: 'Missions & Bounties', desc: 'Paid editing commissions from artists and brands posted directly on the platform. Complete missions, get paid, and earn XP. Higher-ranked editors unlock higher-paying opportunities.', color: 'text-amber-400' },
  { icon: Star, title: 'Global Index Rankings', desc: 'Every competition affects your Index Score. Rise through Open, Pro, and Elite leagues. The Index is the definitive measure of competitive editing ability — verified, transparent, and global.', color: 'text-gold' },
  { icon: Film, title: 'Studio (NLE)', desc: 'A built-in non-linear editor for quick edits, practice sessions, and battle submissions. Multi-track timeline, 24+ real-time FX, keyframe animation, and 4K export — all from your phone.', color: 'text-blue-400' },
];

const QOI_BREAKDOWN = [
  { label: 'Quality', value: '0–100', desc: 'Technical execution, transitions, color grading, pacing, and polish.' },
  { label: 'Originality', value: '0–100', desc: 'Creative vision, unique concepts, and how the editor makes the footage their own.' },
  { label: 'Impact', value: '0–100', desc: 'Emotional resonance, storytelling, and the "wow factor" that makes an edit unforgettable.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <SEO {...pageSEO.about} />

      {/* Hero */}
      <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
        <GatePattern className="z-0" opacity={3} tileSize={56} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background z-[1]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground mb-8 text-xs uppercase tracking-[0.2em] transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
          <motion.h1 {...fadeIn} className="font-display text-5xl sm:text-7xl mb-4 tracking-tight">
            What is <span className="text-gold">Loopgate</span>?
          </motion.h1>
          <motion.p {...fadeIn} transition={{ delay: 0.1, duration: 0.5 }} className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            The global competitive infrastructure for video editors. Think esports — but for editing.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <motion.div {...fadeIn} className="rounded-2xl p-6 sm:p-10" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-display text-2xl sm:text-3xl mb-4 text-gold">The Vision</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Loopgate exists to transform video editing from a solitary craft into a competitive league.
            We believe the world's best editors deserve recognition, rankings, and the opportunity to
            prove themselves on a global stage.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Just as esports created a competitive framework for gaming, Loopgate creates the
            infrastructure for competitive editing — complete with live events, real-time rankings,
            and qualification pathways to professional opportunities.
          </p>
        </motion.div>
      </section>

      {/* QOI Score */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <motion.div {...fadeIn}>
          <h2 className="font-display text-2xl sm:text-3xl mb-6 text-center">The QOI Score</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto text-sm">
            Every edit is judged on three dimensions. Combined, they form your QOI — the universal measure of editing quality.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {QOI_BREAKDOWN.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="rounded-xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="font-display text-3xl text-gold">{item.label[0]}</span>
                <h3 className="font-display text-lg mt-1">{item.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <motion.h2 {...fadeIn} className="font-display text-2xl sm:text-3xl mb-8 text-center">
          Everything Inside
        </motion.h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 2) * 0.08, duration: 0.4 }}
                className="rounded-xl p-5 transition-all"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${feat.color} shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-display text-base mb-1">{feat.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Who It's For */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <motion.div {...fadeIn}>
          <h2 className="font-display text-2xl sm:text-3xl mb-6 text-center">Who It's For</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Music, label: 'Artists & Labels', desc: 'Source top editing talent for music videos & promos' },
              { icon: Film, label: 'Film & Studios', desc: 'Discover editors through verified competitive results' },
              { icon: Briefcase, label: 'Brands', desc: 'Commission edits at scale with quality guarantees' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <Icon className="w-5 h-5 text-gold mx-auto mb-2" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wide mb-1">{item.label}</h3>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-4">
        <motion.div {...fadeIn}>
          <h2 className="font-display text-3xl mb-3">Ready to Compete?</h2>
          <p className="text-muted-foreground text-sm mb-8">Join the global competition and prove you're the best.</p>
          <Link
            to="/start"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl text-background font-black text-xl uppercase tracking-wider"
            style={{ fontFamily: 'Teko, sans-serif', background: 'linear-gradient(180deg, #E8C84A, #C49A2C)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
          >
            <Swords className="w-5 h-5" /> Enter Loopgate
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
