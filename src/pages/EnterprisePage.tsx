import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Zap, Trophy, Users, DollarSign, Calendar, Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SEO, { pageSEO } from '@/components/SEO';
import { Link } from 'react-router-dom';

const GATE_PASSWORD = 'cartel';

type PortalView = 'gate' | 'portal';

export default function EnterprisePage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<PortalView>('gate');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase().trim() === GATE_PASSWORD) {
      setError('');
      setView('portal');
    } else {
      setError('Access denied');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO {...pageSEO.enterprise} />

      <AnimatePresence mode="wait">
        {view === 'gate' ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center px-6"
          >
            {/* Subtle ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 max-w-sm w-full text-center"
            >
              {/* Lock icon */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-8"
              >
                <Lock className="w-8 h-8 text-white/40 mx-auto" />
              </motion.div>

              <h1 className="font-display text-2xl tracking-wider mb-2 text-white/90">
                THE GATE
              </h1>
              <p className="text-[11px] text-white/30 uppercase tracking-[0.3em] mb-10">
                Enter password to proceed
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div
                  animate={shaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    className="bg-transparent border-white/10 text-center text-lg tracking-[0.5em] placeholder:text-white/15 focus:border-white/30 h-14"
                    autoFocus
                  />
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500/80 text-xs uppercase tracking-wider"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white h-12 text-xs uppercase tracking-[0.2em]"
                >
                  Enter
                </Button>
              </form>

              <p className="text-[10px] text-white/15 mt-8">
                LOOPGATE CLIENT PORTAL
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="min-h-screen"
          >
            {/* Portal Header */}
            <header className="border-b border-white/5">
              <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-display tracking-wider text-white/90">LOOPGATE</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-[0.3em] border border-white/10 px-2 py-0.5">
                    Client Portal
                  </span>
                </div>
                <button
                  onClick={() => { setView('gate'); setPassword(''); }}
                  className="text-[10px] text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors"
                >
                  Exit
                </button>
              </div>
            </header>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mb-4">
                  Welcome to the inside
                </p>
                <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6 text-white">
                  Run Campaigns.<br />
                  <span className="text-white/40">Own the Culture.</span>
                </h1>
                <p className="text-white/50 max-w-lg text-sm leading-relaxed">
                  Access Loopgate's network of elite video editors. Launch branded arena events, 
                  commission full interrogation packages, and let our community create content that moves.
                </p>
              </motion.div>
            </section>

            {/* Products Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mb-6">
                  Select a Package
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Arena Event Slot */}
                  <div className="group border border-white/8 hover:border-white/15 bg-white/[0.02] p-8 transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 border border-white/10 bg-white/5">
                        <Trophy className="w-5 h-5 text-white/60" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                    <h3 className="font-display text-xl mb-2 text-white/90">Arena Event Slot</h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-6">
                      Sponsor an official arena event. Your brand gets featured, editors compete using your brief, 
                      and you own the content. Guest mode available — no account needed.
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-white/25 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> 50-500 editors
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> 3-7 day event
                      </span>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <p className="text-white/60 font-display text-lg">From $2,500</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mt-1">Per event slot</p>
                    </div>
                  </div>

                  {/* Full Interrogation Package */}
                  <div className="group border border-gold/20 hover:border-gold/30 bg-gold/[0.02] p-8 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gold/10 border-l border-b border-gold/20 px-3 py-1">
                      <span className="text-[9px] text-gold uppercase tracking-wider font-semibold">Premium</span>
                    </div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 border border-gold/20 bg-gold/5">
                        <Zap className="w-5 h-5 text-gold/70" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold/50 transition-colors" />
                    </div>
                    <h3 className="font-display text-xl mb-2 text-white/90">Loopgate Interrogation</h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-6">
                      Full-service campaign. We plug your brand into the Loopgate ecosystem — editors go crazy on your brief, 
                      our marketing amplifies, seeding across platforms. End-to-end.
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-white/25 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> Full network
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Marketing + Seeding
                      </span>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gold/10">
                      <p className="text-gold/80 font-display text-lg">Custom Pricing</p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mt-1">Tailored to campaign scope</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* How It Works */}
            <section className="border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6 py-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mb-8">
                    How It Works
                  </p>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      { step: '01', title: 'Brief Us', desc: 'Share your campaign goals, brand assets, and target audience. We design the arena format.' },
                      { step: '02', title: 'Editors Compete', desc: 'Our ranked editors create content based on your brief. Real competition, real quality.' },
                      { step: '03', title: 'Own the Content', desc: 'Review submissions, select winners, license content. We handle seeding and amplification.' },
                    ].map((item) => (
                      <div key={item.step} className="space-y-3">
                        <span className="text-[10px] text-white/20 font-mono">{item.step}</span>
                        <h3 className="font-display text-lg text-white/80">{item.title}</h3>
                        <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Contact CTA */}
            <section className="border-t border-white/5">
              <div className="max-w-6xl mx-auto px-6 py-16 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <h2 className="font-display text-2xl mb-3 text-white/80">Ready to Move?</h2>
                  <p className="text-xs text-white/30 mb-8">
                    Reach out and we'll build your campaign within 48 hours.
                  </p>
                  <Button
                    onClick={() => window.location.href = 'mailto:team@loopgate.io'}
                    className="bg-white text-black hover:bg-white/90 h-12 px-8 text-xs uppercase tracking-[0.2em]"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Team
                  </Button>
                </motion.div>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6">
              <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <span className="text-[10px] text-white/15 uppercase tracking-wider">
                  Viral Cartel × Loopgate
                </span>
                <Link to="/" className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
                  Back to Loopgate
                </Link>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
