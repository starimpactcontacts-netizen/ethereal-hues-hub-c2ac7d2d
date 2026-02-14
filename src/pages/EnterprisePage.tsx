import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Zap, Trophy, Users, Calendar, Mail, KeyRound, Loader2, Check, Clock, BarChart3, Eye, Play, Flame, Upload, X, ChevronRight, Shield, Sparkles, TrendingUp, Star, User, Crown, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import SEO, { pageSEO } from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import GatePattern from '@/components/loopgate/GatePattern';
import loopgateBrand from '@/assets/loopgate-brand.png';
import viralCartelLogo from '@/assets/viral-cartel-logo.png';

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
  color: string;
}

const SLOT_TIERS: SlotTier[] = [
  { id: 'trial', name: 'Trial Slot', price: 150, priceLabel: '$150', desc: '20–30 edits in 48 hours. Arena + 1v1 distribution.', color: '#C8A96E' },
  { id: 'standard', name: 'Standard Slot', price: 400, priceLabel: '$400', desc: 'Full arena cycle. Judges + Loop Feed exposure.', tag: 'Most Chosen', color: '#E00000' },
  { id: 'takeover', name: 'Takeover Slot', price: 1200, priceLabel: '$1,200', desc: 'Pinned event. Guaranteed multi-format distribution.', tag: 'Max Impact', color: '#1B4332' },
];

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Summer Vibes Drop', tier: 'Standard Slot', status: 'Live', edits: 47, battles: 12, feedHits: 2340, judges: 3, thumb: '🎵' },
  { id: '2', name: 'Brand X Takeover', tier: 'Takeover Slot', status: 'Completed', edits: 128, battles: 34, feedHits: 12800, judges: 8, thumb: '🔥' },
];

// Fake online clients for social proof
const ONLINE_CLIENTS = [
  { initials: 'RG', color: '#1B4332' },
  { initials: 'MK', color: '#C8A96E' },
  { initials: 'DP', color: '#8B0000' },
  { initials: 'LV', color: '#2D2D2D' },
  { initials: 'AJ', color: '#1B4332' },
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
  const [launchOpen, setLaunchOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');
  const [selectedTier, setSelectedTier] = useState<SlotTier | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ name: string; tier: string; price: string } | null>(null);
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

  // ─── Luxury Grain Overlay ───
  const GrainOverlay = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
  );

  // ─── Gold Corner Accents ───
  const GoldCorners = ({ size = 20 }: { size?: number }) => (
    <>
      <span className="absolute top-0 left-0 border-t-2 border-l-2 border-[#C8A96E]/40" style={{ width: size, height: size }} />
      <span className="absolute top-0 right-0 border-t-2 border-r-2 border-[#C8A96E]/40" style={{ width: size, height: size }} />
      <span className="absolute bottom-0 left-0 border-b-2 border-l-2 border-[#C8A96E]/40" style={{ width: size, height: size }} />
      <span className="absolute bottom-0 right-0 border-b-2 border-r-2 border-[#C8A96E]/40" style={{ width: size, height: size }} />
    </>
  );

  // ─── GATE ───
  const renderGate = () => (
    <motion.div
      key="gate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #080808 100%)' }}
    >
      <GrainOverlay />
      
      {/* GatePattern background */}
      <GatePattern opacity={3} color="#C8A96E" tileSize={140} />
      
      {/* Radial vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)] z-[2]" />
      
      {/* Ambient luxury glow */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C8A96E]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#1B4332]/[0.04] rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10 max-w-sm w-full text-center">
        {/* Viral Cartel Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8"
        >
          <img src={viralCartelLogo} alt="Viral Cartel" className="w-20 h-20 mx-auto opacity-60" />
        </motion.div>

        {/* Decorative line */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C8A96E]/30" />
          <Diamond className="w-3 h-3 text-[#C8A96E]/30" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C8A96E]/30" />
        </div>

        <h1 className="text-5xl tracking-[0.2em] mb-2 text-white/90" style={bebas}>THE GATE</h1>
        <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em] mb-1">Loopgate Client Portal</p>

        {/* Decorative line */}
        <div className="flex items-center gap-3 justify-center mt-4 mb-10">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8A96E]/20" />
          <div className="w-1.5 h-1.5 rotate-45 border border-[#C8A96E]/20" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8A96E]/20" />
        </div>

        <AnimatePresence mode="wait">
          {gateMode === 'code' && (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-8">Enter Access Code</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div animate={shaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.4 }}>
                  <div className="relative">
                    <GoldCorners size={12} />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••"
                      className="bg-black/40 border-[#C8A96E]/15 text-center text-lg tracking-[0.5em] placeholder:text-white/10 focus:border-[#C8A96E]/40 h-14 rounded-none"
                      autoFocus
                    />
                  </div>
                </motion.div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[#E00000]/70 text-[10px] uppercase tracking-[0.2em]">
                    {error}
                  </motion.p>
                )}

                <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50 font-medium shadow-[0_0_30px_rgba(139,0,0,0.15)]">
                  Enter
                </Button>
              </form>

              <button onClick={() => setGateMode('login')} className="mt-10 text-[9px] text-[#C8A96E]/30 hover:text-[#C8A96E]/60 uppercase tracking-[0.3em] transition-colors flex items-center gap-2 mx-auto">
                <User className="w-3 h-3" />
                Client Login
              </button>
            </motion.div>
          )}

          {gateMode === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-8">Enterprise Sign In</p>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="relative">
                  <GoldCorners size={12} />
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@company.com" className="bg-black/40 border-[#C8A96E]/15 text-center text-sm placeholder:text-white/15 focus:border-[#C8A96E]/40 h-14 rounded-none" autoFocus required />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <KeyRound className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
              <button onClick={() => setGateMode('code')} className="mt-10 text-[9px] text-[#C8A96E]/30 hover:text-[#C8A96E]/60 uppercase tracking-[0.3em] transition-colors">← Access Code</button>
            </motion.div>
          )}

          {gateMode === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-8">Code sent to {loginEmail}</p>
              <div className="space-y-5">
                <div className="flex justify-center [&_input]:!bg-black/40 [&_input]:!border-[#C8A96E]/15 [&_input]:!text-white [&_input]:!rounded-none">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifyOTP} disabled={isSubmitting || otpCode.length !== 6} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify <ArrowRight className="w-3 h-3 ml-2" /></>}
                </Button>
                <div className="flex justify-between mt-4">
                  <button onClick={() => { setGateMode('login'); setOtpCode(''); }} className="text-[9px] text-[#C8A96E]/30 hover:text-[#C8A96E]/60 transition-colors">← Change email</button>
                  <button onClick={(e) => handleSendOTP(e as any)} disabled={isSubmitting} className="text-[9px] text-[#C8A96E]/30 hover:text-[#C8A96E]/60 transition-colors">Resend</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom branding */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-white/5" />
          <p className="text-[8px] text-white/10 uppercase tracking-[0.4em]">By Invitation Only</p>
          <div className="h-px w-8 bg-white/5" />
        </div>
      </motion.div>
    </motion.div>
  );

  // ─── PORTAL (DASHBOARD + LAUNCHER) ───
  const renderPortal = () => (
    <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 40%, #080808 100%)' }}>
      <GrainOverlay />
      <GatePattern opacity={2} color="#C8A96E" tileSize={160} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,transparent_30%,rgba(0,0,0,0.7)_100%)] z-[2]" />

      {/* ─── Luxury Header ─── */}
      <header className="border-b border-[#C8A96E]/10 sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,10,0.9)' }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={loopgateBrand} alt="LOOPGATE" className="h-5 w-auto opacity-80" />
            <div className="h-4 w-px bg-[#C8A96E]/15" />
            <span className="text-[8px] text-[#C8A96E]/50 uppercase tracking-[0.4em]">Client Portal</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Online clients indicator */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {ONLINE_CLIENTS.slice(0, 4).map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-black/60 flex items-center justify-center text-[7px] font-bold text-white/70" style={{ background: c.color, zIndex: 5 - i }}>
                    {c.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1B4332] animate-pulse" />
                <span className="text-[8px] text-white/25">{ONLINE_CLIENTS.length} online</span>
              </div>
            </div>

            <div className="h-4 w-px bg-white/5" />
            
            {/* Client login button */}
            <button onClick={() => setGateMode('login')} className="flex items-center gap-1.5 text-[9px] text-[#C8A96E]/40 hover:text-[#C8A96E]/70 uppercase tracking-[0.2em] transition-colors">
              <User className="w-3 h-3" />
              Account
            </button>

            <button onClick={() => { setView('gate'); setPassword(''); }} className="text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors">Exit</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* ─── Hero / Welcome ─── */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-14 pb-16 relative">
          {/* Luxury animated emblem behind hero */}
          <div className="absolute right-0 md:right-12 top-0 w-[280px] h-[280px] md:w-[400px] md:h-[400px] pointer-events-none select-none z-0 opacity-[0.12]">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="190" fill="none" stroke="#C8A96E" strokeWidth="0.5" strokeDasharray="8 12" />
                <circle cx="200" cy="200" r="170" fill="none" stroke="#C8A96E" strokeWidth="0.3" />
                {/* 8-point star markers */}
                {[0,45,90,135,180,225,270,315].map(deg => (
                  <line key={deg} x1="200" y1="10" x2="200" y2="30" stroke="#C8A96E" strokeWidth="1" transform={`rotate(${deg} 200 200)`} />
                ))}
              </svg>
            </motion.div>
            {/* Inner counter-rotating ring */}
            <motion.div
              className="absolute inset-[15%]"
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <polygon points="200,40 230,170 360,170 250,250 290,380 200,290 110,380 150,250 40,170 170,170" fill="none" stroke="#C8A96E" strokeWidth="0.6" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#C8A96E" strokeWidth="0.3" strokeDasharray="4 8" />
              </svg>
            </motion.div>
            {/* Center diamond pulse */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-8 h-8 text-[#C8A96E]" />
            </motion.div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-[#C8A96E]/40" />
              <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em]">Private Access</p>
            </div>
            <h1 className="text-4xl md:text-6xl text-white leading-[0.95] mb-5" style={bebas}>
              Control the<br />
              <motion.span
                className="text-[#C8A96E] inline-block"
                animate={{ textShadow: ['0 0 20px rgba(200,169,110,0)', '0 0 40px rgba(200,169,110,0.3)', '0 0 20px rgba(200,169,110,0)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Culture.
              </motion.span>
            </h1>
            <p className="text-white/30 text-sm max-w-lg leading-relaxed">
              Launch campaigns into the Loopgate arena. Our editors compete, judges rate, and your content spreads — all within minutes of purchase.
            </p>
            
            {/* Decorative divider */}
            <div className="flex items-center gap-3 mt-8">
              <div className="h-px w-20 bg-gradient-to-r from-[#C8A96E]/30 to-transparent" />
              <Diamond className="w-2.5 h-2.5 text-[#C8A96E]/20" />
            </div>
          </div>
        </motion.section>

        {/* ─── Availability Banner ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10 relative">
          <div className="border border-[#1B4332]/30 bg-[#1B4332]/[0.06] p-4 flex items-center justify-between">
            <GoldCorners size={10} />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#1B4332] animate-pulse shadow-[0_0_8px_rgba(27,67,50,0.5)]" />
              <span className="text-[10px] text-white/50 uppercase tracking-[0.2em]">3 / 3 Arena Slots Available Today</span>
            </div>
            <span className="text-[9px] text-[#1B4332] uppercase tracking-wider font-medium">Open</span>
          </div>
        </motion.div>

        {/* ─── Campaign Launcher Card ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
          <div className="border border-[#C8A96E]/10 bg-gradient-to-br from-[#C8A96E]/[0.03] via-transparent to-[#1B4332]/[0.03] p-8 md:p-12 relative overflow-hidden group hover:border-[#C8A96E]/20 transition-all duration-500">
            <GoldCorners size={24} />
            
            {/* Top gold line */}
            <div className="absolute top-0 left-[24px] right-[24px] h-[1px] bg-gradient-to-r from-transparent via-[#C8A96E]/20 to-transparent" />
            
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em] mb-3">Featured</p>
                <h2 className="text-3xl text-white mb-2" style={bebas}>Start a Slot</h2>
                <p className="text-xs text-white/25 max-w-md">Inject your track or asset into the Loopgate arena. Editors compete, content flows, culture moves.</p>
              </div>
              <div className="p-4 border border-[#C8A96E]/15 bg-[#C8A96E]/[0.05]">
                <Flame className="w-6 h-6 text-[#C8A96E]/50" />
              </div>
            </div>

            {/* Expected Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Edits Generated', value: '20–130+', icon: Play, accent: '#C8A96E' },
                { label: 'Time to Start', value: '<2 Hours', icon: Clock, accent: '#E00000' },
                { label: 'Feed Impressions', value: '5K–50K+', icon: Eye, accent: '#1B4332' },
              ].map(m => (
                <div key={m.label} className="bg-black/30 border border-white/5 p-4 text-center relative group/metric hover:border-white/10 transition-colors">
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${m.accent}30, transparent)` }} />
                  <m.icon className="w-4 h-4 mx-auto mb-2" style={{ color: `${m.accent}60` }} />
                  <p className="text-lg text-white/80 font-medium" style={bebas}>{m.value}</p>
                  <p className="text-[8px] text-white/25 uppercase tracking-wider mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <Button onClick={() => setLaunchOpen(true)} className="bg-[#8B0000] hover:bg-[#A00000] text-white h-14 px-10 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/40 w-full md:w-auto shadow-[0_0_40px_rgba(139,0,0,0.15)] transition-all hover:shadow-[0_0_60px_rgba(139,0,0,0.25)]">
              Launch Campaign <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
          </div>
        </motion.div>

        {/* ─── Slot Tiers Showcase ─── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Diamond className="w-3 h-3 text-[#C8A96E]/30" />
            <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em]">Available Tiers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SLOT_TIERS.map(tier => (
              <motion.div
                key={tier.id}
                whileHover={{ y: -4 }}
                className="border border-white/6 bg-black/30 p-6 relative group cursor-pointer hover:border-[#C8A96E]/20 transition-all duration-300"
                onClick={() => { setSelectedTier(tier); setLaunchOpen(true); }}
              >
                <GoldCorners size={12} />
                {/* Top accent */}
                <div className="absolute top-0 left-3 right-3 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tier.color}40, transparent)` }} />
                
                {tier.tag && (
                  <span className="absolute top-4 right-4 text-[7px] uppercase tracking-wider px-2 py-0.5 border" style={{ color: `${tier.color}90`, borderColor: `${tier.color}30`, background: `${tier.color}08` }}>{tier.tag}</span>
                )}
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={bebas}>{tier.name}</p>
                <p className="text-3xl text-white mb-3" style={bebas}>{tier.priceLabel}</p>
                <div className="h-px bg-white/5 mb-3" />
                <p className="text-[10px] text-white/25 leading-relaxed">{tier.desc}</p>
                
                <div className="mt-5 flex items-center gap-1.5 text-[9px] text-[#C8A96E]/30 group-hover:text-[#C8A96E]/60 transition-colors uppercase tracking-wider">
                  Select <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── How It Works ─── */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-14">
          <div className="border-t border-[#C8A96E]/10 pt-12">
            <div className="flex items-center gap-3 mb-8">
              <Diamond className="w-3 h-3 text-[#C8A96E]/30" />
              <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em]">The Process</p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Select Your Slot', desc: 'Choose your campaign tier and upload your asset — song, link, or brief.', color: '#C8A96E' },
                { step: '02', title: 'We Ignite', desc: 'Your campaign enters the arena within minutes to hours. Editors start competing immediately.', color: '#E00000' },
                { step: '03', title: 'Content Flows', desc: 'Watch real-time edits, 1v1 battles, and judge reviews on your personal dashboard.', color: '#1B4332' },
                { step: '04', title: 'Own Everything', desc: 'All generated content is yours. We handle distribution, seeding, and amplification.', color: '#C8A96E' },
              ].map(item => (
                <div key={item.step} className="relative">
                  <span className="text-[10px] font-mono" style={{ color: `${item.color}50` }}>{item.step}</span>
                  <h3 className="text-lg text-white/80 mt-1 mb-2" style={bebas}>{item.title}</h3>
                  <p className="text-[10px] text-white/20 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── Dashboard ─── */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-14">
          <div className="border-t border-[#C8A96E]/10 pt-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Diamond className="w-3 h-3 text-[#C8A96E]/30" />
                <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em]">Your Campaigns</p>
              </div>
              <div className="flex gap-1 ml-auto">
                <button onClick={() => setDashTab('active')} className={`text-[9px] uppercase tracking-wider px-3 py-1.5 transition-colors rounded-none ${dashTab === 'active' ? 'text-[#C8A96E] bg-[#C8A96E]/5 border border-[#C8A96E]/15' : 'text-white/20 hover:text-white/40'}`}>Active</button>
                <button onClick={() => setDashTab('completed')} className={`text-[9px] uppercase tracking-wider px-3 py-1.5 transition-colors rounded-none ${dashTab === 'completed' ? 'text-[#C8A96E] bg-[#C8A96E]/5 border border-[#C8A96E]/15' : 'text-white/20 hover:text-white/40'}`}>Archived</button>
              </div>
            </div>

            {campaigns.filter(c => dashTab === 'active' ? c.status === 'Live' : c.status === 'Completed').length > 0 ? (
              <div className="space-y-3">
                {campaigns.filter(c => dashTab === 'active' ? c.status === 'Live' : c.status === 'Completed').map(campaign => (
                  <div key={campaign.id} className="border border-white/6 bg-black/30 p-6 hover:border-[#C8A96E]/15 transition-colors relative">
                    <GoldCorners size={10} />
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{campaign.thumb}</span>
                        <div>
                          <h3 className="text-lg text-white/90" style={bebas}>{campaign.name}</h3>
                          <p className="text-[9px] text-white/20 uppercase tracking-wider">{campaign.tier}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider px-2.5 py-1 border ${campaign.status === 'Live' ? 'text-[#1B4332] border-[#1B4332]/30 bg-[#1B4332]/10' : 'text-white/25 border-white/8 bg-white/[0.02]'}`}>
                        {campaign.status === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1B4332] mr-1.5 animate-pulse" />}
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Edits', value: campaign.edits, icon: Play, color: '#C8A96E' },
                        { label: '1v1 Battles', value: campaign.battles, icon: Zap, color: '#E00000' },
                        { label: 'Feed Hits', value: campaign.feedHits.toLocaleString(), icon: TrendingUp, color: '#1B4332' },
                        { label: 'Judges', value: campaign.judges, icon: Star, color: '#C8A96E' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-black/40 border border-white/5 p-3 text-center">
                          <stat.icon className="w-3 h-3 mx-auto mb-1.5" style={{ color: `${stat.color}50` }} />
                          <p className="text-base text-white/70 tabular-nums" style={bebas}>{stat.value}</p>
                          <p className="text-[7px] text-white/15 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-white/5 bg-black/20 p-12 text-center relative">
                <GoldCorners size={12} />
                <BarChart3 className="w-6 h-6 text-[#C8A96E]/15 mx-auto mb-3" />
                <p className="text-[10px] text-white/15 uppercase tracking-wider">No {dashTab} campaigns</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ─── Anonymous Mode + Social Proof ─── */}
        <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mb-14 grid md:grid-cols-2 gap-4">
          <div className="border border-[#C8A96E]/10 bg-[#C8A96E]/[0.02] p-6 relative">
            <GoldCorners size={12} />
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-[#C8A96E]/30 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm text-white/70 mb-1" style={bebas}>Anonymous Mode</h3>
                <p className="text-[10px] text-white/20 leading-relaxed">
                  Purchase without an account. Receive a secure dashboard link via email. Full privacy, full control.
                </p>
              </div>
            </div>
          </div>
          <div className="border border-[#1B4332]/20 bg-[#1B4332]/[0.03] p-6 relative">
            <GoldCorners size={12} />
            <div className="flex items-start gap-4">
              <Users className="w-5 h-5 text-[#1B4332]/50 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm text-white/70 mb-1" style={bebas}>Join the Circle</h3>
                <p className="text-[10px] text-white/20 leading-relaxed">
                  {ONLINE_CLIENTS.length} clients currently active. Labels, studios, and independents trust this system.
                </p>
                <div className="flex -space-x-1.5 mt-3">
                  {ONLINE_CLIENTS.map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[6px] font-bold text-white/60" style={{ background: c.color }}>{c.initials}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── Contact ─── */}
        <section className="border-t border-[#C8A96E]/10 py-14 text-center">
          <Diamond className="w-3 h-3 text-[#C8A96E]/20 mx-auto mb-4" />
          <h2 className="text-2xl mb-2 text-white/60" style={bebas}>Custom Packages</h2>
          <p className="text-[10px] text-white/15 mb-6">We build bespoke campaigns for labels, studios, and agencies.</p>
          <Button onClick={() => window.location.href = 'mailto:team@loopgate.io'} className="bg-transparent hover:bg-[#C8A96E]/5 border border-[#C8A96E]/15 text-[#C8A96E]/50 hover:text-[#C8A96E]/80 h-11 px-8 text-[10px] uppercase tracking-[0.3em] rounded-none transition-all">
            <Mail className="w-3.5 h-3.5 mr-2" /> Contact Team
          </Button>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-[#C8A96E]/10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={viralCartelLogo} alt="VC" className="w-5 h-5 opacity-30" />
            <span className="text-[8px] text-white/10 uppercase tracking-wider">Viral Cartel × Loopgate</span>
          </div>
          <Link to="/" className="text-[9px] text-white/10 hover:text-white/25 transition-colors">Back to Loopgate</Link>
        </footer>
      </div>

      {/* ─── Launch Campaign Modal ─── */}
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="border-[#C8A96E]/10 text-white max-w-lg rounded-none p-0 [&>button]:text-white/40" style={{ background: '#0A0A0A' }}>
          <div className="p-6 pb-0 border-b border-[#C8A96E]/10">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-[0.1em]" style={bebas}>Launch Campaign</DialogTitle>
            </DialogHeader>
            <p className="text-[9px] text-[#C8A96E]/30 uppercase tracking-[0.3em] mt-1 mb-4">Configure your slot details</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-[9px] text-[#C8A96E]/30 uppercase tracking-wider block mb-2">Song File or TikTok Link</label>
              <Input value={campaignLink} onChange={(e) => setCampaignLink(e.target.value)} placeholder="https://tiktok.com/... or upload a file" className="bg-black/40 border-[#C8A96E]/10 text-sm placeholder:text-white/10 focus:border-[#C8A96E]/30 h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[9px] text-[#C8A96E]/30 uppercase tracking-wider block mb-2">Campaign Name</label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Summer Drop 2026" className="bg-black/40 border-[#C8A96E]/10 text-sm placeholder:text-white/10 focus:border-[#C8A96E]/30 h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[9px] text-[#C8A96E]/30 uppercase tracking-wider block mb-2">Notes for Founder (Optional)</label>
              <Textarea value={campaignNotes} onChange={(e) => setCampaignNotes(e.target.value)} placeholder="Any special instructions..." className="bg-black/40 border-[#C8A96E]/10 text-sm placeholder:text-white/10 focus:border-[#C8A96E]/30 rounded-none min-h-[70px] resize-none" />
            </div>
            <div>
              <label className="text-[9px] text-[#C8A96E]/30 uppercase tracking-wider block mb-3">Select Tier</label>
              <div className="space-y-2">
                {SLOT_TIERS.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left border p-4 transition-all relative ${selectedTier?.id === tier.id ? 'border-[#C8A96E]/30 bg-[#C8A96E]/[0.04]' : 'border-white/5 bg-black/20 hover:border-white/10'}`}
                  >
                    {selectedTier?.id === tier.id && <GoldCorners size={8} />}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80" style={bebas}>{tier.name}</span>
                      <span className="text-sm" style={{ ...bebas, color: tier.color }}>{tier.priceLabel}</span>
                    </div>
                    <p className="text-[10px] text-white/20">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleProceedToPayment} disabled={!campaignName.trim() || !selectedTier} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/40 shadow-[0_0_30px_rgba(139,0,0,0.15)]">
              Proceed to Payment <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ─── PAYMENT ───
  const renderPayment = () => (
    <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #080808 100%)' }}>
      <GrainOverlay />
      <GatePattern opacity={2} color="#C8A96E" tileSize={140} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] z-[2]" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-sm w-full relative z-10">
        <Diamond className="w-3 h-3 text-[#C8A96E]/30 mx-auto mb-4" />
        <p className="text-[9px] text-[#C8A96E]/40 uppercase tracking-[0.5em] mb-6 text-center">Order Summary</p>

        <div className="border border-[#C8A96E]/10 bg-black/40 p-6 space-y-4 mb-6 relative">
          <GoldCorners size={14} />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Campaign</span>
            <span className="text-sm text-white/70">{campaignName}</span>
          </div>
          <div className="h-px bg-[#C8A96E]/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Slot Tier</span>
            <span className="text-sm text-white/70">{selectedTier?.name}</span>
          </div>
          <div className="h-px bg-[#C8A96E]/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Price</span>
            <span className="text-2xl text-[#C8A96E]" style={bebas}>{selectedTier?.priceLabel}</span>
          </div>
        </div>

        <p className="text-[9px] text-white/10 text-center mb-4 uppercase tracking-wider">Payment is handled securely</p>

        <Button onClick={handlePay} disabled={paymentProcessing} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-14 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/40 shadow-[0_0_40px_rgba(139,0,0,0.2)]">
          {paymentProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
          ) : (
            <>Pay Now <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
          )}
        </Button>

        <button onClick={() => setView('portal')} className="mt-6 w-full text-[9px] text-[#C8A96E]/25 hover:text-[#C8A96E]/50 uppercase tracking-[0.2em] transition-colors text-center block">← Back to Portal</button>
      </motion.div>
    </motion.div>
  );

  // ─── RECEIPT ───
  const renderReceipt = () => (
    <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #080808 100%)' }}>
      <GrainOverlay />
      <GatePattern opacity={2} color="#C8A96E" tileSize={140} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] z-[2]" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} className="max-w-sm w-full text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="w-16 h-16 border border-[#1B4332]/40 bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-7 h-7 text-[#1B4332]" />
        </motion.div>

        <h1 className="text-4xl text-white mb-2" style={bebas}>Campaign Activated.</h1>
        <p className="text-xs text-white/25 leading-relaxed mb-8">
          Your slot has entered the Loopgate system.<br />
          You will receive updates as distribution begins.
        </p>

        <div className="border border-[#C8A96E]/10 bg-black/40 p-5 text-left space-y-3 mb-8 relative">
          <GoldCorners size={12} />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Campaign</span>
            <span className="text-xs text-white/60">{receiptData?.name}</span>
          </div>
          <div className="h-px bg-[#C8A96E]/5" />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Slot Type</span>
            <span className="text-xs text-white/60">{receiptData?.tier}</span>
          </div>
          <div className="h-px bg-[#C8A96E]/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Status</span>
            <span className="text-[10px] text-[#C8A96E]/70 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#C8A96E] rounded-full animate-pulse" />
              Queued for Ignition
            </span>
          </div>
        </div>

        <p className="text-[9px] text-white/10 mb-8 leading-relaxed">
          Founder manually primes all campaigns for maximum reach.
        </p>

        <Button onClick={handleGoToDashboard} className="w-full bg-transparent hover:bg-[#C8A96E]/5 border border-[#C8A96E]/15 text-[#C8A96E]/50 hover:text-[#C8A96E]/80 h-12 text-[10px] uppercase tracking-[0.3em] rounded-none transition-all">
          Go to Dashboard <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: '#0A0A0A' }}>
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
