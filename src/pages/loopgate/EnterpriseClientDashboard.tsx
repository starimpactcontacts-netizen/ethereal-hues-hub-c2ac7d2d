import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Flame, User, ArrowLeft, TrendingUp, Eye, Zap, Trophy, ChevronRight, Lock, LayoutDashboard, Target, Activity, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import loopgateBrand from '@/assets/loopgate-brand.png';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

export default function EnterpriseClientDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: '#060606' }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.04]" style={{ background: 'rgba(6,6,6,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/enterprise')} className="text-white/20 hover:text-white/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
          </div>
          <span className="text-[8px] text-white/15 uppercase tracking-[0.3em]" style={headerFont}>Command Center</span>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, action: () => {}, active: true },
            { id: 'account', label: 'Account', icon: User, action: () => navigate('/enterprise/account') },
          ].map(tab => (
            <button key={tab.id} onClick={tab.action} className={`flex flex-col items-center gap-0.5 transition-colors px-4 py-1 ${tab.active ? 'text-white/80' : 'text-white/30 hover:text-white/70'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[8px] uppercase tracking-[0.15em]" style={headerFont}>{tab.label}</span>
            </button>
          ))}
          {/* Striking center shop button */}
          <button
            onClick={() => navigate('/enterprise')}
            className="relative flex items-center justify-center -mt-5"
          >
            <span className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-[#E00000]/20 blur-xl animate-pulse" />
            <span className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#E00000] to-[#8B0000] flex items-center justify-center shadow-[0_0_20px_rgba(224,0,0,0.4)] hover:shadow-[0_0_30px_rgba(224,0,0,0.6)] hover:scale-110 active:scale-95 transition-all duration-200">
              <ShoppingBag className="w-5 h-5 text-white" />
            </span>
          </button>
        </div>
      </nav>

      <div className="pt-16 px-5 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pt-2">
          <p className="text-[8px] text-white/15 uppercase tracking-[0.5em] mb-2" style={headerFont}>Client Portal</p>
          <h1 className="text-4xl text-white/90 tracking-[-0.01em]" style={luxuryFont}>Your Command Center</h1>
          <p className="text-[11px] text-white/20 mt-2">Track every campaign. Own every result.</p>
        </motion.div>

        {/* Crest */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.08, scale: 1 }} transition={{ delay: 0.1 }} className="flex justify-center mb-8">
          <img src={viralCartelCrest} alt="" className="w-14 h-auto" />
        </motion.div>

        {/* What You Get - Feature Grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-[9px] text-white/15 uppercase tracking-[0.5em] mb-5" style={headerFont}>What You Get</p>
          <div className="space-y-3">
            {[
              { icon: BarChart3, title: 'Live Campaign Metrics', desc: 'Real-time edits, 1v1 battles, feed impressions, and judge activity — all tied to your campaigns.' },
              { icon: TrendingUp, title: 'Compare Past Results', desc: 'Side-by-side performance breakdowns across every campaign you\'ve ever run on the platform.' },
              { icon: Eye, title: 'Feed Impression Tracking', desc: 'See exactly how many eyes hit your sponsored content across the entire Loopgate ecosystem.' },
              { icon: Trophy, title: 'Winner & Judge Reports', desc: 'Full transparency on who judged, who won, and how your brand was represented in every battle.' },
              { icon: Target, title: 'ROI Snapshots', desc: 'Cost-per-engagement breakdowns so you can screenshot and send to stakeholders instantly.' },
              { icon: Activity, title: 'Campaign Timeline', desc: 'A clean archive of every active and completed campaign with dates, tiers, and results.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="border border-white/[0.06] p-4 flex items-start gap-4"
                style={{ background: 'rgba(255,255,255,0.01)' }}
              >
                <div className="w-9 h-9 border border-white/[0.08] flex items-center justify-center flex-shrink-0 bg-white/[0.02]">
                  <feature.icon className="w-4 h-4 text-white/25" />
                </div>
                <div>
                  <p className="text-sm text-white/70" style={luxuryFont}>{feature.title}</p>
                  <p className="text-[9px] text-white/15 leading-relaxed mt-0.5">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate('/enterprise/account')}
              className="w-full border border-white/[0.08] p-6 text-left hover:border-white/[0.15] transition-all group"
              style={{ background: 'linear-gradient(135deg, rgba(224,0,0,0.04) 0%, rgba(10,10,10,1) 100%)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-[#E00000]/40 uppercase tracking-[0.4em] mb-1">Get Started</p>
                  <h3 className="text-xl text-white/70" style={luxuryFont}>Create Your Account</h3>
                  <p className="text-[10px] text-white/15 mt-1">Unlock your personal command center after your first campaign.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[#E00000]/40 transition-colors" />
              </div>
            </button>
          ) : (
            <div className="border border-white/[0.06] p-6 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <Lock className="w-5 h-5 text-white/10 mx-auto mb-3" />
              <p className="text-lg text-white/50 mb-1" style={luxuryFont}>No Active Campaigns</p>
              <p className="text-[9px] text-white/15 mb-4">Purchase a slot to see your live metrics here.</p>
              <button
                onClick={() => navigate('/enterprise')}
                className="text-[9px] text-[#E00000]/40 hover:text-[#E00000]/70 uppercase tracking-[0.3em] transition-colors flex items-center gap-1.5 mx-auto"
              >
                <Flame className="w-3 h-3" /> Browse Slots
              </button>
            </div>
          )}
        </motion.div>

        {/* Confidence Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10 grid grid-cols-2 gap-[1px] bg-white/[0.04] mb-10">
          {[
            { value: '48h', label: 'Average Turnaround' },
            { value: '92%', label: 'Client Return Rate' },
            { value: '24/7', label: 'Dedicated Support' },
            { value: '100%', label: 'Transparent Metrics' },
          ].map(stat => (
            <div key={stat.label} className="p-5 text-center" style={{ background: '#0A0A0A' }}>
              <p className="text-2xl text-white/50 tabular-nums" style={luxuryFont}>{stat.value}</p>
              <p className="text-[7px] text-white/12 uppercase tracking-[0.15em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
