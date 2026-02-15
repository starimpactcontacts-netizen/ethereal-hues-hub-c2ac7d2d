import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Flame, User, ArrowLeft, Mail, Shield, Crown, Diamond, ChevronRight, Bell, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import loopgateBrand from '@/assets/loopgate-brand.png';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

export default function EnterpriseAccountPage() {
  const navigate = useNavigate();
  const [email] = useState('client@example.com');
  const [notificationsOn, setNotificationsOn] = useState(true);

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
          <span className="text-[8px] text-white/15 uppercase tracking-[0.3em]" style={headerFont}>Account</span>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, action: () => navigate('/enterprise/dashboard') },
            { id: 'slots', label: 'Slots', icon: Flame, action: () => navigate('/enterprise') },
            { id: 'account', label: 'Account', icon: User, action: () => {}, active: true },
          ].map(tab => (
            <button key={tab.id} onClick={tab.action} className={`flex flex-col items-center gap-0.5 transition-colors px-4 py-1 ${tab.active ? 'text-white/80' : 'text-white/30 hover:text-white/70'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[8px] uppercase tracking-[0.15em]" style={headerFont}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="pt-16 px-5 max-w-2xl mx-auto">
        {/* Luxury Header with Crest */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 pt-4">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.12, scale: 1 }} transition={{ delay: 0.2 }} className="mb-4">
            <img src={viralCartelCrest} alt="" className="w-16 h-auto mx-auto" />
          </motion.div>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Diamond className="w-3 h-3 text-white/10" />
            <p className="text-[8px] text-white/15 uppercase tracking-[0.5em]" style={headerFont}>Private Client</p>
            <Diamond className="w-3 h-3 text-white/10" />
          </div>
          <h1 className="text-4xl text-white/90" style={luxuryFont}>Your Account</h1>
        </motion.div>

        {/* Client Status Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-white/[0.08] p-6 mb-6 relative" style={{ background: 'linear-gradient(135deg, rgba(27,67,50,0.05) 0%, rgba(10,10,10,1) 100%)' }}>
          {/* Corner accents */}
          <span className="absolute top-0 left-0 border-t border-l border-white/10 w-4 h-4" />
          <span className="absolute top-0 right-0 border-t border-r border-white/10 w-4 h-4" />
          <span className="absolute bottom-0 left-0 border-b border-l border-white/10 w-4 h-4" />
          <span className="absolute bottom-0 right-0 border-b border-r border-white/10 w-4 h-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#1B4332]/20 border border-[#1B4332]/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-lg text-white/80" style={luxuryFont}>Active Client</p>
              <p className="text-[8px] text-[#1B4332]/60 uppercase tracking-wider">Verified · Full Access</p>
            </div>
          </div>
          <div className="h-px bg-white/[0.04] mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>2</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Campaigns</p>
            </div>
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>$550</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Total Spent</p>
            </div>
            <div>
              <p className="text-lg text-white/60 tabular-nums" style={luxuryFont}>9.3M</p>
              <p className="text-[7px] text-white/12 uppercase tracking-wider">Total Reach</p>
            </div>
          </div>
        </motion.div>

        {/* Email Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="border border-white/[0.06] p-5 mb-4" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-white/15" />
            <p className="text-[9px] text-white/20 uppercase tracking-[0.3em]" style={headerFont}>Email</p>
          </div>
          <div className="flex items-center gap-3">
            <Input value={email} readOnly className="bg-white/[0.02] border-white/[0.04] text-sm text-white/50 rounded-none flex-1 cursor-default" />
            <Button size="sm" variant="outline" className="border-white/[0.08] text-white/30 hover:text-white/60 rounded-none text-[8px] uppercase tracking-wider h-9 px-4"
              onClick={() => toast.info('Contact team@loopgate.io to change email')}>
              Change
            </Button>
          </div>
        </motion.div>

        {/* Settings List */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-white/[0.06] divide-y divide-white/[0.04] mb-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
          {/* Notifications */}
          <button onClick={() => { setNotificationsOn(!notificationsOn); toast.success(notificationsOn ? 'Notifications off' : 'Notifications on'); }}
            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Drop Notifications</p>
                <p className="text-[8px] text-white/15">Get pinged on new slot drops & campaign updates</p>
              </div>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${notificationsOn ? 'bg-[#1B4332]' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${notificationsOn ? 'left-4' : 'left-0.5'}`} />
            </div>
          </button>

          {/* Security */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors" onClick={() => toast.info('Secured via email OTP')}>
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Security</p>
                <p className="text-[8px] text-white/15">Email-based OTP authentication</p>
              </div>
            </div>
            <Shield className="w-4 h-4 text-[#1B4332]/40" />
          </button>

          {/* Invoices */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors" onClick={() => toast.info('Invoice history coming soon')}>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-white/15" />
              <div className="text-left">
                <p className="text-[11px] text-white/60">Invoices & Receipts</p>
                <p className="text-[8px] text-white/15">View past transaction records</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/10" />
          </button>
        </motion.div>

        {/* Exclusive Perks / Discounts Teaser */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border border-white/[0.08] p-6 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(224,0,0,0.03) 0%, rgba(10,10,10,1) 100%)' }}>
          <span className="absolute top-0 left-0 border-t border-l border-[#E00000]/15 w-5 h-5" />
          <span className="absolute top-0 right-0 border-t border-r border-[#E00000]/15 w-5 h-5" />
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-[#E00000]/30" />
            <p className="text-[8px] text-[#E00000]/40 uppercase tracking-[0.4em]">Loyalty Rewards</p>
          </div>
          <h3 className="text-xl text-white/70 mb-2" style={luxuryFont}>Unlock Exclusive Discounts</h3>
          <p className="text-[10px] text-white/15 leading-relaxed mb-4">
            Returning clients unlock priority access to new drops and reduced rates on future campaigns. Your loyalty doesn't go unnoticed.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#E00000]/30" />
            <span className="text-[8px] text-white/20 uppercase tracking-wider">Next discount unlocks at 3 campaigns</span>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="border border-white/[0.06] p-5 mb-8 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <p className="text-[10px] text-white/15 mb-3">Need dedicated support?</p>
          <Button
            onClick={() => window.location.href = 'mailto:team@loopgate.io'}
            className="bg-white/[0.04] hover:bg-white/[0.08] text-white/40 h-10 px-8 text-[9px] uppercase tracking-[0.3em] rounded-none border border-white/[0.06]"
          >
            <Mail className="w-3 h-3 mr-2" /> Contact Team
          </Button>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center pb-10">
          <button onClick={() => { navigate('/enterprise'); toast.success('Signed out'); }} className="text-[9px] text-white/10 hover:text-white/30 uppercase tracking-[0.3em] transition-colors flex items-center gap-2 mx-auto">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
