import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Zap, Trophy, Users, Calendar, Mail, KeyRound, Loader2, Check, Clock, BarChart3, Eye, Play, Flame, Upload, X, ChevronRight, Shield, Sparkles, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import SEO, { pageSEO } from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const GATE_PASSWORD = 'cartel';

const bebas = { fontFamily: "var(--font-display)" };

type PortalView = 'gate' | 'portal' | 'payment' | 'receipt';
type GateMode = 'code' | 'login' | 'otp';

interface SlotTier {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  desc: string;
  tag?: string;
}

const SLOT_TIERS: SlotTier[] = [
  { id: 'trial', name: 'Trial Slot', price: 150, priceLabel: '$150', desc: '20–30 edits in 48 hours. Arena + 1v1 distribution.' },
  { id: 'standard', name: 'Standard Slot', price: 400, priceLabel: '$400', desc: 'Full arena cycle. Judges + Loop Feed exposure.', tag: 'Popular' },
  { id: 'takeover', name: 'Takeover Slot', price: 1200, priceLabel: '$1,200', desc: 'Pinned event. Guaranteed multi-format distribution.', tag: 'Max Impact' },
];

// Mock campaigns for dashboard
const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Summer Vibes Drop', tier: 'Standard Slot', status: 'Live', edits: 47, battles: 12, feedHits: 2340, judges: 3, thumb: '🎵' },
  { id: '2', name: 'Brand X Takeover', tier: 'Takeover Slot', status: 'Completed', edits: 128, battles: 34, feedHits: 12800, judges: 8, thumb: '🔥' },
];

export default function EnterprisePage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<PortalView>('gate');
  const [gateMode, setGateMode] = useState<GateMode>('code');
  const [shaking, setShaking] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campaign launcher state
  const [launchOpen, setLaunchOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');
  const [selectedTier, setSelectedTier] = useState<SlotTier | null>(null);

  // Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ name: string; tier: string; price: string } | null>(null);

  // Dashboard state
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [dashTab, setDashTab] = useState<'active' | 'completed'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase().trim() === GATE_PASSWORD) {
      setError('');
      setView('portal');
    } else {
      setError('Invalid code. Access denied.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) { toast.error('Enter your email'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: loginEmail, options: { shouldCreateUser: false } });
      if (error) {
        if (error.message.includes('Signups not allowed')) { toast.error('No enterprise account found'); }
        else { throw error; }
        return;
      }
      toast.success('Code sent to your email');
      setGateMode('otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: loginEmail, token: otpCode, type: 'email' });
      if (error) throw error;
      toast.success('Welcome back');
      navigate('/enterprise-dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!campaignName.trim()) { toast.error('Enter a campaign name'); return; }
    if (!selectedTier) { toast.error('Select a slot tier'); return; }
    setLaunchOpen(false);
    setView('payment');
  };

  const handlePay = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setReceiptData({ name: campaignName, tier: selectedTier!.name, price: selectedTier!.priceLabel });
      setView('receipt');
    }, 2000);
  };

  const handleGoToDashboard = () => {
    setView('portal');
    setCampaignName('');
    setCampaignLink('');
    setCampaignNotes('');
    setSelectedTier(null);
    setReceiptData(null);
  };

  // ─── GATE ───
  const renderGate = () => (
    <motion.div
      key="gate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: '#0D0D0D' }}
    >
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
      
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E00000]/[0.02] rounded-full blur-[150px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10 max-w-sm w-full text-center">
        <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity }} className="mb-10">
          <Lock className="w-6 h-6 text-white/30 mx-auto" />
        </motion.div>

        <h1 className="text-4xl tracking-[0.15em] mb-3 text-white/90" style={bebas}>THE GATE</h1>

        <AnimatePresence mode="wait">
          {gateMode === 'code' && (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/25 uppercase tracking-[0.4em] mb-12">Access Code Required</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div animate={shaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.4 }}>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••"
                    className="bg-transparent border-white/8 text-center text-lg tracking-[0.5em] placeholder:text-white/10 focus:border-[#E00000]/30 h-14 rounded-none"
                    autoFocus
                  />
                </motion.div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[#E00000]/70 text-[10px] uppercase tracking-[0.2em]">
                    {error}
                  </motion.p>
                )}

                <Button type="submit" className="w-full bg-[#E00000] hover:bg-[#E00000]/90 text-white h-12 text-[11px] uppercase tracking-[0.3em] rounded-none border-0 font-medium">
                  Enter
                </Button>
              </form>

              <button onClick={() => setGateMode('login')} className="mt-10 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors">
                Enterprise client? Sign in →
              </button>
            </motion.div>
          )}

          {gateMode === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/25 uppercase tracking-[0.4em] mb-12">Enterprise Sign In</p>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@company.com" className="bg-transparent border-white/8 text-center text-sm placeholder:text-white/15 focus:border-[#E00000]/30 h-14 rounded-none" autoFocus required />
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#E00000] hover:bg-[#E00000]/90 text-white h-12 text-[11px] uppercase tracking-[0.3em] rounded-none border-0">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <KeyRound className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
              <button onClick={() => setGateMode('code')} className="mt-10 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors">← Back to access code</button>
            </motion.div>
          )}

          {gateMode === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/25 uppercase tracking-[0.4em] mb-12">Code sent to {loginEmail}</p>
              <div className="space-y-5">
                <div className="flex justify-center [&_input]:!bg-transparent [&_input]:!border-white/10 [&_input]:!text-white [&_input]:!rounded-none">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifyOTP} disabled={isSubmitting || otpCode.length !== 6} className="w-full bg-[#E00000] hover:bg-[#E00000]/90 text-white h-12 text-[11px] uppercase tracking-[0.3em] rounded-none border-0">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify <ArrowRight className="w-3 h-3 ml-2" /></>}
                </Button>
                <div className="flex justify-between mt-4">
                  <button onClick={() => { setGateMode('login'); setOtpCode(''); }} className="text-[9px] text-white/20 hover:text-white/40 transition-colors">← Change email</button>
                  <button onClick={(e) => handleSendOTP(e as any)} disabled={isSubmitting} className="text-[9px] text-white/20 hover:text-white/40 transition-colors">Resend</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[9px] text-white/8 mt-16 uppercase tracking-[0.3em]">Loopgate Client Portal</p>
      </motion.div>
    </motion.div>
  );

  // ─── PORTAL (DASHBOARD + LAUNCHER) ───
  const renderPortal = () => (
    <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="min-h-screen" style={{ background: '#0D0D0D' }}>
      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-50" style={{ background: '#0D0D0D' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg tracking-[0.1em] text-white/90" style={bebas}>LOOPGATE</span>
            <span className="text-[8px] text-[#E00000]/60 uppercase tracking-[0.3em] border border-[#E00000]/20 px-2.5 py-1">Command</span>
          </div>
          <button onClick={() => { setView('gate'); setPassword(''); }} className="text-[9px] text-white/25 hover:text-white/50 uppercase tracking-[0.2em] transition-colors">Exit</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Welcome */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-12 pb-10">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.5em] mb-3">Client Command Portal</p>
          <h1 className="text-3xl md:text-5xl text-white leading-tight mb-4" style={bebas}>
            Control the Culture.
          </h1>
          <p className="text-white/35 text-sm max-w-md leading-relaxed">
            Launch campaigns into the Loopgate arena. Our editors compete, judges rate, and your content spreads — all within minutes.
          </p>
        </motion.section>

        {/* Availability Banner */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10 border border-[#E00000]/15 bg-[#E00000]/[0.03] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#E00000] animate-pulse" />
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">3 / 3 Arena Slots Available Today</span>
          </div>
          <span className="text-[9px] text-white/20 uppercase tracking-wider">Live</span>
        </motion.div>

        {/* Campaign Launcher Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <div className="border border-white/8 bg-white/[0.02] p-8 md:p-10 relative overflow-hidden group hover:border-white/12 transition-colors">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E00000]/30 to-transparent" />
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl text-white mb-2" style={bebas}>Start a Slot</h2>
                <p className="text-xs text-white/30 max-w-sm">Inject your track or asset into the Loopgate arena. Editors compete, content flows, culture moves.</p>
              </div>
              <div className="p-3 border border-[#E00000]/20 bg-[#E00000]/5">
                <Flame className="w-5 h-5 text-[#E00000]/60" />
              </div>
            </div>

            {/* Expected Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Edits Generated', value: '20–130+', icon: Play },
                { label: 'Time to Start', value: '<2 Hours', icon: Clock },
                { label: 'Feed Impressions', value: '5K–50K+', icon: Eye },
              ].map(m => (
                <div key={m.label} className="bg-white/[0.02] border border-white/5 p-3 text-center">
                  <m.icon className="w-3.5 h-3.5 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/80 font-medium" style={bebas}>{m.value}</p>
                  <p className="text-[8px] text-white/25 uppercase tracking-wider mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => setLaunchOpen(true)} className="bg-[#E00000] hover:bg-[#E00000]/90 text-white h-12 px-8 text-[11px] uppercase tracking-[0.3em] rounded-none border-0 w-full md:w-auto">
              Launch Campaign <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Slot Carousel Preview */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-12">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] mb-4">Available Tiers</p>
          <div className="grid md:grid-cols-3 gap-3">
            {SLOT_TIERS.map(tier => (
              <div key={tier.id} className="border border-white/6 bg-white/[0.015] p-5 hover:border-white/12 transition-colors relative">
                {tier.tag && (
                  <span className="absolute top-3 right-3 text-[8px] text-[#E00000]/70 uppercase tracking-wider border border-[#E00000]/20 px-1.5 py-0.5 bg-[#E00000]/5">{tier.tag}</span>
                )}
                <p className="text-lg text-white/80 mb-1" style={bebas}>{tier.name}</p>
                <p className="text-xl text-white mb-2" style={bebas}>{tier.priceLabel}</p>
                <p className="text-[10px] text-white/30 leading-relaxed">{tier.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-12 border-t border-white/5 pt-10">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] mb-6">How It Works</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Pick a Slot', desc: 'Choose your campaign size and upload your asset — song, link, or brief.' },
              { step: '02', title: 'We Ignite', desc: 'Your campaign enters the arena within hours. Editors start competing immediately.' },
              { step: '03', title: 'Content Flows', desc: 'Watch real-time edits, 1v1 battles, and judge reviews on your dashboard.' },
              { step: '04', title: 'Own It All', desc: 'All content is yours. We handle seeding, distribution, and amplification.' },
            ].map(item => (
              <div key={item.step}>
                <span className="text-[10px] text-[#E00000]/40 font-mono">{item.step}</span>
                <h3 className="text-base text-white/80 mt-1 mb-2" style={bebas}>{item.title}</h3>
                <p className="text-[10px] text-white/25 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Dashboard Section */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-12 border-t border-white/5 pt-10">
          <div className="flex items-center gap-4 mb-6">
            <p className="text-[9px] text-white/20 uppercase tracking-[0.4em]">Your Campaigns</p>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setDashTab('active')} className={`text-[9px] uppercase tracking-wider px-3 py-1.5 transition-colors ${dashTab === 'active' ? 'text-white bg-white/5 border border-white/10' : 'text-white/25 hover:text-white/40'}`}>Active</button>
              <button onClick={() => setDashTab('completed')} className={`text-[9px] uppercase tracking-wider px-3 py-1.5 transition-colors ${dashTab === 'completed' ? 'text-white bg-white/5 border border-white/10' : 'text-white/25 hover:text-white/40'}`}>Completed</button>
            </div>
          </div>

          {campaigns.filter(c => dashTab === 'active' ? c.status === 'Live' : c.status === 'Completed').length > 0 ? (
            <div className="space-y-3">
              {campaigns.filter(c => dashTab === 'active' ? c.status === 'Live' : c.status === 'Completed').map(campaign => (
                <div key={campaign.id} className="border border-white/6 bg-white/[0.015] p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{campaign.thumb}</span>
                      <div>
                        <h3 className="text-base text-white/90" style={bebas}>{campaign.name}</h3>
                        <p className="text-[9px] text-white/25 uppercase tracking-wider">{campaign.tier}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-1 border ${campaign.status === 'Live' ? 'text-green-400/70 border-green-400/20 bg-green-400/5' : 'text-white/30 border-white/8 bg-white/[0.02]'}`}>
                      {campaign.status}
                    </span>
                  </div>
                  {/* Progress Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Edits', value: campaign.edits, icon: Play },
                      { label: '1v1 Battles', value: campaign.battles, icon: Zap },
                      { label: 'Feed Hits', value: campaign.feedHits.toLocaleString(), icon: TrendingUp },
                      { label: 'Judges', value: campaign.judges, icon: Star },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/[0.02] border border-white/5 p-2.5 text-center">
                        <stat.icon className="w-3 h-3 text-white/15 mx-auto mb-1" />
                        <p className="text-sm text-white/70" style={bebas}>{stat.value}</p>
                        <p className="text-[7px] text-white/20 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-white/5 bg-white/[0.01] p-10 text-center">
              <BarChart3 className="w-6 h-6 text-white/10 mx-auto mb-3" />
              <p className="text-[10px] text-white/20 uppercase tracking-wider">No {dashTab} campaigns</p>
            </div>
          )}
        </motion.section>

        {/* Anonymous Purchase Note */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mb-12 border border-white/5 bg-white/[0.01] p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm text-white/70 mb-1" style={bebas}>Anonymous Mode Available</h3>
              <p className="text-[10px] text-white/25 leading-relaxed">
                Purchase without creating an account. After payment, you'll receive a secure link via email to track your campaign's progress dashboard. Full privacy, full control.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Contact */}
        <section className="border-t border-white/5 py-12 text-center">
          <h2 className="text-xl mb-2 text-white/60" style={bebas}>Need a Custom Package?</h2>
          <p className="text-[10px] text-white/20 mb-6">We build bespoke campaigns for labels, studios, and agencies.</p>
          <Button onClick={() => window.location.href = 'mailto:team@loopgate.io'} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white h-10 px-6 text-[10px] uppercase tracking-[0.2em] rounded-none">
            <Mail className="w-3.5 h-3.5 mr-2" /> Contact Team
          </Button>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 flex items-center justify-between">
          <span className="text-[9px] text-white/10 uppercase tracking-wider">Viral Cartel × Loopgate</span>
          <Link to="/" className="text-[9px] text-white/15 hover:text-white/30 transition-colors">Back to Loopgate</Link>
        </footer>
      </div>

      {/* Launch Campaign Modal */}
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="bg-[#0D0D0D] border-white/8 text-white max-w-lg rounded-none p-0 [&>button]:text-white/40">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-wider" style={bebas}>Launch Campaign</DialogTitle>
            </DialogHeader>
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] mt-1">Fill in your details below</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Upload / Link */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-wider block mb-2">Song File or TikTok Link</label>
              <Input value={campaignLink} onChange={(e) => setCampaignLink(e.target.value)} placeholder="https://tiktok.com/... or upload a file" className="bg-transparent border-white/8 text-sm placeholder:text-white/15 focus:border-[#E00000]/30 h-11 rounded-none" />
            </div>

            {/* Campaign Name */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-wider block mb-2">Campaign Name</label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Summer Drop 2026" className="bg-transparent border-white/8 text-sm placeholder:text-white/15 focus:border-[#E00000]/30 h-11 rounded-none" />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-wider block mb-2">Notes for Founder (Optional)</label>
              <Textarea value={campaignNotes} onChange={(e) => setCampaignNotes(e.target.value)} placeholder="Any special instructions..." className="bg-transparent border-white/8 text-sm placeholder:text-white/15 focus:border-[#E00000]/30 rounded-none min-h-[70px] resize-none" />
            </div>

            {/* Tier Selection */}
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-wider block mb-3">Select Tier</label>
              <div className="space-y-2">
                {SLOT_TIERS.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left border p-4 transition-all ${selectedTier?.id === tier.id ? 'border-[#E00000]/40 bg-[#E00000]/5' : 'border-white/6 bg-white/[0.01] hover:border-white/12'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80" style={bebas}>{tier.name}</span>
                      <span className="text-sm text-white/60" style={bebas}>{tier.priceLabel}</span>
                    </div>
                    <p className="text-[10px] text-white/25">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleProceedToPayment} disabled={!campaignName.trim() || !selectedTier} className="w-full bg-[#E00000] hover:bg-[#E00000]/90 text-white h-12 text-[11px] uppercase tracking-[0.3em] rounded-none border-0">
              Proceed to Payment <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ─── PAYMENT ───
  const renderPayment = () => (
    <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0D0D0D' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-sm w-full">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.5em] mb-6 text-center">Order Summary</p>

        <div className="border border-white/8 bg-white/[0.02] p-6 space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Campaign</span>
            <span className="text-sm text-white/70">{campaignName}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Slot Tier</span>
            <span className="text-sm text-white/70">{selectedTier?.name}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Price</span>
            <span className="text-xl text-white" style={bebas}>{selectedTier?.priceLabel}</span>
          </div>
        </div>

        <p className="text-[9px] text-white/15 text-center mb-4 uppercase tracking-wider">Payment is handled securely</p>

        <Button onClick={handlePay} disabled={paymentProcessing} className="w-full bg-[#E00000] hover:bg-[#E00000]/90 text-white h-13 text-[11px] uppercase tracking-[0.3em] rounded-none border-0">
          {paymentProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
          ) : (
            <>Pay Now <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
          )}
        </Button>

        <button onClick={() => setView('portal')} className="mt-6 w-full text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors text-center block">← Back to Portal</button>
      </motion.div>
    </motion.div>
  );

  // ─── RECEIPT ───
  const renderReceipt = () => (
    <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0D0D0D' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} className="max-w-sm w-full text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="w-14 h-14 border border-green-400/30 bg-green-400/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-6 h-6 text-green-400" />
        </motion.div>

        <h1 className="text-3xl text-white mb-2" style={bebas}>Campaign Activated.</h1>
        <p className="text-xs text-white/30 leading-relaxed mb-8">
          Your slot has entered the Loopgate system.<br />
          You will receive updates as distribution begins.
        </p>

        <div className="border border-white/8 bg-white/[0.02] p-5 text-left space-y-3 mb-8">
          <div className="flex justify-between">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Campaign</span>
            <span className="text-xs text-white/60">{receiptData?.name}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Slot Type</span>
            <span className="text-xs text-white/60">{receiptData?.tier}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Status</span>
            <span className="text-[10px] text-[#E00000]/70 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#E00000] rounded-full animate-pulse" />
              Queued for Ignition
            </span>
          </div>
        </div>

        <p className="text-[9px] text-white/15 mb-8 leading-relaxed">
          Founder manually primes all campaigns for maximum reach.
        </p>

        <Button onClick={handleGoToDashboard} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white h-11 text-[10px] uppercase tracking-[0.2em] rounded-none">
          Go to Dashboard <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: '#0D0D0D' }}>
      <SEO {...pageSEO.enterprise} />
      <AnimatePresence mode="wait">
        {view === 'gate' && renderGate()}
        {view === 'portal' && renderPortal()}
        {view === 'payment' && renderPayment()}
        {view === 'receipt' && renderReceipt()}
      </AnimatePresence>
    </div>
  );
}
