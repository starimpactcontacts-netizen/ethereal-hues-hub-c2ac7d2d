import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Zap, Trophy, Users, Calendar, Mail, KeyRound, Loader2, Check, Clock, BarChart3, Eye, EyeOff, Play, Flame, Upload, X, ChevronRight, Shield, TrendingUp, Star, User, Crown, Diamond, CreditCard, Wallet, Bitcoin, Handshake, ShoppingBag } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import SEO, { pageSEO } from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import GatePattern from '@/components/loopgate/GatePattern';
import loopgateBrand from '@/assets/loopgate-brand.png';
import viralCartelLogo from '@/assets/viral-cartel-logo.png';
import viralCartelCrest from '@/assets/viral-cartel-crest.png';
import culturePhonk from '@/assets/culture-phonk-artist.jpg';
import cultureMovie from '@/assets/culture-movie-character.webp';
import cultureArtist from '@/assets/culture-artist.png';
import cultureNFL from '@/assets/culture-nfl.jpg';
import cultureSpiderNoir from '@/assets/culture-spider-noir.webp';
import tierTrial from '@/assets/tier-trial.png';
import tierStandard from '@/assets/tier-standard.png';
import tierTakeover from '@/assets/tier-takeover.png';
import cultureArcImg from '@/assets/culture-text.png';

const GATE_PASSWORD = 'cartel';
const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const bebas = luxuryFont;
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

type PortalView = 'gate' | 'portal' | 'payment' | 'receipt' | 'revshare';
type GateMode = 'code' | 'login' | 'login-password' | 'otp';
type PaymentMethod = 'card' | 'paypal' | 'crypto';

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
  { id: 'trial', name: 'Trial Slot', price: 150, priceLabel: '$150', desc: '20 to 30 edits in 48 hours. Arena + 1v1 distribution.', color: '#E00000' },
  { id: 'standard', name: 'Standard Slot', price: 400, priceLabel: '$400', desc: 'Full arena cycle. Judges + Loop Feed exposure.', tag: 'Most Chosen', color: '#E00000' },
  { id: 'takeover', name: 'Takeover Slot', price: 1200, priceLabel: '$1,200', desc: 'Pinned event. Guaranteed multi-format distribution.', tag: 'Max Impact', color: '#1B4332' },
];

const SLOT_AVAILABILITY: Record<string, { left: number; total: number }> = {
  trial: { left: 3, total: 3 },
  standard: { left: 3, total: 3 },
  takeover: { left: 3, total: 3 },
};

// Culture imagery — phonk, film, artists, sports — shows Loopgate spans everything
const CULTURE_IMAGES: { src: string; label: string; category: string }[] = [
  { src: culturePhonk, label: 'MXZI', category: 'Music' },
  { src: cultureMovie, label: 'Kill Bill', category: 'Film' },
  { src: cultureArtist, label: 'Artist', category: 'Music' },
  { src: cultureNFL, label: 'NFL', category: 'Sports' },
  { src: cultureSpiderNoir, label: 'Spider Noir', category: 'Film' },
  { src: culturePhonk, label: 'Phonk', category: 'Music' },
];

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Summer Vibes Drop', tier: 'Standard Slot', status: 'Live', edits: 47, battles: 12, feedHits: 1240000, judges: 3, thumb: '🎵' },
  { id: '2', name: 'Brand X Takeover', tier: 'Takeover Slot', status: 'Completed', edits: 128, battles: 34, feedHits: 8700000, judges: 8, thumb: '🔥' },
];

// Fake online clients for social proof
const ONLINE_CLIENTS = [
  { initials: 'RG', color: '#1B4332' },
  { initials: 'MK', color: '#E00000' },
  { initials: 'DP', color: '#8B0000' },
  { initials: 'LV', color: '#2D2D2D' },
  { initials: 'AJ', color: '#1B4332' },
];

export default function EnterprisePage() {
  const navigate = useNavigate();
  const enterpriseAuth = useEnterpriseAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<PortalView>(() => {
    if (typeof window === 'undefined') return 'gate';
    // Sync check: if auth token OR guest gate-pass exists, skip gate immediately
    if (localStorage.getItem('enterprise_client_token')) return 'portal';
    if (sessionStorage.getItem('enterprise_gate_passed')) return 'portal';
    return 'gate';
  });
  const [gateMode, setGateMode] = useState<GateMode>('code');
  const [shaking, setShaking] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');
  const [selectedTier, setSelectedTier] = useState<SlotTier | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ name: string; tier: string; price: string } | null>(null);
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [dashTab, setDashTab] = useState<'active' | 'completed'>('active');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentEmail, setPaymentEmail] = useState('');
  // Rev-share state
  const [revShareName, setRevShareName] = useState('');
  const [revShareEmail, setRevShareEmail] = useState('');
  const [revShareProject, setRevShareProject] = useState('');
  const [revSharePitch, setRevSharePitch] = useState('');
  const [revShareUrl, setRevShareUrl] = useState('');
  const [revShareSubmitting, setRevShareSubmitting] = useState(false);
  const [revShareSubmitted, setRevShareSubmitted] = useState(false);

  // Auto-skip gate if enterprise client is already authenticated
  useEffect(() => {
    if (enterpriseAuth.isLoading) return;
    if (enterpriseAuth.isAuthenticated && view === 'gate') {
      setView('portal');
    }
    // Only fall back to gate if BOTH token AND guest pass are gone
    if (!enterpriseAuth.isAuthenticated && view === 'portal' 
        && !localStorage.getItem('enterprise_client_token') 
        && !sessionStorage.getItem('enterprise_gate_passed')) {
      setView('gate');
    }
  }, [enterpriseAuth.isLoading, enterpriseAuth.isAuthenticated]);

  // Check for payment success on URL params (only shows after actual Stripe checkout completion)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && params.get('session_id')) {
      const campaign = params.get('campaign') || '';
      const tierId = params.get('tier') || '';
      const tierMap: Record<string, { name: string; price: string }> = {
        trial: { name: 'Trial Slot', price: '$25' },
        standard: { name: 'Standard Slot', price: '$75' },
        takeover: { name: 'Takeover Slot', price: '$200' },
      };
      const tierInfo = tierMap[tierId] || { name: 'Slot', price: '' };
      setReceiptData({ name: campaign, tier: tierInfo.name, price: tierInfo.price });
      setView('receipt');
      // Clean URL
      window.history.replaceState({}, '', '/enterprise');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase().trim() === GATE_PASSWORD) {
      setError('');
      sessionStorage.setItem('enterprise_gate_passed', 'true');
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
      await enterpriseAuth.sendOTP(loginEmail);
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
      await enterpriseAuth.verifyOTP(loginEmail, otpCode);
      toast.success('Welcome back');
      setView('portal');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) { toast.error('Enter your email'); return; }
    if (!loginPassword) { toast.error('Enter your password'); return; }
    setIsSubmitting(true);
    try {
      await enterpriseAuth.signin(loginEmail, loginPassword);
      toast.success('Welcome back');
      setView('portal');
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
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

  const handlePay = async () => {
    if (paymentMethod === 'card') {
      // Stripe checkout
      setPaymentProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-enterprise-payment', {
          body: {
            tierId: selectedTier?.id,
            campaignName,
            campaignLink,
            campaignNotes,
            email: paymentEmail || undefined,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
      } finally {
        setPaymentProcessing(false);
      }
    } else if (paymentMethod === 'paypal') {
      // PayPal checkout
      setPaymentProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-paypal-payment', {
          body: {
            tierId: selectedTier?.id,
            campaignName,
            campaignLink,
            campaignNotes,
            email: paymentEmail || undefined,
          },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No PayPal checkout URL returned');
        }
      } catch (err: any) {
        toast.error(err.message || 'PayPal payment failed');
      } finally {
        setPaymentProcessing(false);
      }
    } else if (paymentMethod === 'crypto') {
      toast.info('Crypto payments coming soon. Contact team@loopgate.io for Binance Pay.');
    }
  };

  const handleRevShareSubmit = async () => {
    if (!revShareEmail || !revShareProject || !revSharePitch) {
      toast.error('Fill out all required fields');
      return;
    }
    setRevShareSubmitting(true);
    try {
      const { error } = await supabase.from('revenue_share_applications' as any).insert({
        applicant_email: revShareEmail,
        applicant_name: revShareName,
        project_name: revShareProject,
        project_url: revShareUrl,
        pitch: revSharePitch,
      });
      if (error) throw error;
      setRevShareSubmitted(true);
      toast.success('Application submitted. We\'ll review and get back to you.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setRevShareSubmitting(false);
    }
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
      <span className="absolute top-0 left-0 border-t border-l border-white/10" style={{ width: size, height: size }} />
      <span className="absolute top-0 right-0 border-t border-r border-white/10" style={{ width: size, height: size }} />
      <span className="absolute bottom-0 left-0 border-b border-l border-white/10" style={{ width: size, height: size }} />
      <span className="absolute bottom-0 right-0 border-b border-r border-white/10" style={{ width: size, height: size }} />
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
      {/* Back to Loopgate */}
      <button
        onClick={() => navigate('/hub')}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-[9px] text-white/20 hover:text-white/50 uppercase tracking-[0.2em] transition-colors"
        style={headerFont}
      >
        <ArrowRight className="w-3 h-3 rotate-180" />
        Loopgate
      </button>
      <GrainOverlay />
      
      {/* GatePattern background */}
      <GatePattern opacity={2} color="#FFFFFF" tileSize={140} />

      {/* 24K-style vertical stripe — dark marble with depth (hidden on small mobile) */}
      <div className="hidden sm:block fixed top-0 bottom-0 right-[80px] w-[100px] z-[5] overflow-hidden">
        {/* Near-black marble base */}
        <div className="absolute inset-0" style={{ 
          background: `
            radial-gradient(ellipse at 25% 15%, rgba(6,20,10,0.7) 0%, transparent 45%),
            radial-gradient(ellipse at 75% 50%, rgba(5,18,9,0.6) 0%, transparent 45%),
            radial-gradient(ellipse at 40% 80%, rgba(7,22,12,0.5) 0%, transparent 40%),
            linear-gradient(180deg, #020805 0%, #040e08 25%, #06110a 50%, #040e08 75%, #020805 100%)
          `
        }} />
        {/* Dense marble vein network */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" preserveAspectRatio="none" viewBox="0 0 100 800">
          <path d="M30 0 Q45 80 20 160 Q10 240 40 320 Q55 400 25 480 Q15 560 45 640 Q50 720 30 800" stroke="rgba(80,130,95,0.9)" strokeWidth="0.7" fill="none" />
          <path d="M70 0 Q55 100 75 200 Q85 300 60 400 Q50 500 80 600 Q90 700 65 800" stroke="rgba(60,110,80,0.7)" strokeWidth="0.5" fill="none" />
        </svg>
        {/* Surface sheen */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 40%, rgba(255,255,255,0.01) 70%, transparent 100%)' }} />
        {/* Border lines */}
        <div className="absolute top-0 bottom-0 left-0 w-[6px]" style={{ background: 'linear-gradient(180deg, #3a0000 0%, #6a0000 30%, #500000 50%, #6a0000 70%, #3a0000 100%)', boxShadow: 'inset -1px 0 3px rgba(100,0,0,0.5), 2px 0 8px rgba(80,0,0,0.3)' }} />
        <div className="absolute top-0 bottom-0 right-0 w-[6px]" style={{ background: 'linear-gradient(180deg, #3a0000 0%, #6a0000 30%, #500000 50%, #6a0000 70%, #3a0000 100%)', boxShadow: 'inset 1px 0 3px rgba(100,0,0,0.5), -2px 0 8px rgba(80,0,0,0.3)' }} />
        {/* VC Crest */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ top: '15%' }}>
          <img src={viralCartelCrest} alt="" className="w-[72px] h-auto opacity-25" style={{ filter: 'brightness(1.6) contrast(0.7)' }} />
        </div>
      </div>
      
      {/* Radial vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)] z-[2]" />
      
      {/* Ambient luxury glow */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-white/[0.02] rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10 max-w-sm w-full text-center">
        {/* Viral Cartel Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8"
        >
          <img src={viralCartelLogo} alt="Viral Cartel" className="w-20 h-20 mx-auto opacity-60 mix-blend-lighten" />
        </motion.div>

        {/* Decorative line */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
          <Diamond className="w-3 h-3 text-white/15" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        <h1 className="text-5xl tracking-[0.08em] mb-2 text-white/90" style={luxuryFont}>THE GATE</h1>
        <p className="text-[9px] text-white/20 uppercase mb-1" style={headerFont}>Loopgate Client Portal</p>

        {/* Decorative line */}
        <div className="flex items-center gap-3 justify-center mt-4 mb-10">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/8" />
          <div className="w-1.5 h-1.5 rotate-45 border border-white/10" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/8" />
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
                      className="bg-black/40 border-white/10 text-center text-lg tracking-[0.5em] placeholder:text-white/10 focus:border-white/25 h-14 rounded-none"
                      autoFocus
                    />
                  </div>
                </motion.div>

                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[#E00000]/60 text-[10px] uppercase tracking-[0.2em]">
                    {error}
                  </motion.p>
                )}

                <Button type="submit" className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50 font-medium shadow-[0_0_30px_rgba(139,0,0,0.15)]">
                  Enter
                </Button>
              </form>

              <button onClick={() => setGateMode('login')} className="mt-10 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors flex items-center gap-2 mx-auto">
                <User className="w-3 h-3" />
                Client Login
              </button>
            </motion.div>
          )}

          {gateMode === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-6">Enterprise Sign In</p>
              
              {/* Method toggle */}
              <div className="flex border border-white/[0.08] mb-6">
                <button
                  onClick={() => setGateMode('login-password')}
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.15em] text-white/25 hover:text-white/40 transition-colors"
                >
                  <Lock className="w-3 h-3 inline mr-1" />Password
                </button>
                <button
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.15em] bg-white/[0.06] text-white/70"
                >
                  <Mail className="w-3 h-3 inline mr-1" />Email Code
                </button>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="relative">
                  <GoldCorners size={12} />
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@company.com" className="bg-black/40 border-white/10 text-center text-sm placeholder:text-white/15 focus:border-white/25 h-14 rounded-none" autoFocus required />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <KeyRound className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
              <button onClick={() => setGateMode('code')} className="mt-10 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors">← Access Code</button>
            </motion.div>
          )}

          {gateMode === 'login-password' && (
            <motion.div key="login-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-6">Enterprise Sign In</p>
              
              {/* Method toggle */}
              <div className="flex border border-white/[0.08] mb-6">
                <button
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.15em] bg-white/[0.06] text-white/70"
                >
                  <Lock className="w-3 h-3 inline mr-1" />Password
                </button>
                <button
                  onClick={() => setGateMode('login')}
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.15em] text-white/25 hover:text-white/40 transition-colors"
                >
                  <Mail className="w-3 h-3 inline mr-1" />Email Code
                </button>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="relative">
                  <GoldCorners size={12} />
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="your@company.com" className="bg-black/40 border-white/10 text-center text-sm placeholder:text-white/15 focus:border-white/25 h-14 rounded-none" autoFocus required />
                </div>
                <div className="relative">
                  <GoldCorners size={12} />
                  <Input 
                    type={showLoginPassword ? 'text' : 'password'} 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    placeholder="Your password" 
                    className="bg-black/40 border-white/10 text-center text-sm placeholder:text-white/15 focus:border-white/25 h-14 rounded-none pr-12" 
                    required 
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 z-10">
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#8B0000] hover:bg-[#A00000] text-white h-12 text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#8B0000]/50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-3 h-3 ml-2" /></>}
                </Button>
              </form>
              <button onClick={() => setGateMode('code')} className="mt-10 text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.3em] transition-colors">← Access Code</button>
            </motion.div>
          )}

          {gateMode === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mb-8">Code sent to {loginEmail}</p>
              <div className="space-y-5">
                <div className="flex justify-center [&_input]:!bg-black/40 [&_input]:!border-white/10 [&_input]:!text-white [&_input]:!rounded-none">
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
                  <button onClick={() => { setGateMode('login'); setOtpCode(''); }} className="text-[9px] text-white/20 hover:text-white/40 transition-colors">← Change email</button>
                  <button onClick={(e) => handleSendOTP(e as any)} disabled={isSubmitting} className="text-[9px] text-white/20 hover:text-white/40 transition-colors">Resend</button>
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
    <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-screen relative overflow-hidden pb-16" style={{ background: '#060606' }}>
      <GrainOverlay />

      {/* ─── Minimal Top Bar (logo only) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.04]" style={{ background: 'rgba(6,6,6,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
          <button onClick={() => { setView('gate'); setPassword(''); }} className="text-[9px] text-white/12 hover:text-white/30 uppercase px-3 py-1.5 transition-colors" style={headerFont}>Exit</button>
        </div>
      </header>

      {/* ─── Bottom Nav (TikTok-style) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
        <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-14">
          <button onClick={() => navigate('/enterprise/dashboard')} className="flex flex-col items-center gap-0.5 text-white/30 hover:text-white/70 transition-colors py-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Dashboard</span>
          </button>
          <button
            onClick={() => document.getElementById('portal-slots')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex justify-center -mt-4"
          >
            <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#E00000] to-[#8B0000] flex items-center justify-center shadow-[0_0_16px_rgba(224,0,0,0.35)] hover:shadow-[0_0_24px_rgba(224,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-200">
              <span className="absolute inset-0 rounded-full bg-[#E00000]/15 blur-lg animate-pulse" />
              <ShoppingBag className="w-4 h-4 text-white relative z-10" />
            </span>
          </button>
          <button onClick={() => navigate('/enterprise/account')} className="flex flex-col items-center gap-0.5 text-white/30 hover:text-white/70 transition-colors py-1">
            <User className="w-4 h-4" />
            <span className="text-[7px] uppercase tracking-[0.15em]" style={headerFont}>Account</span>
          </button>
        </div>
      </nav>

      {/* ─── Hero: Full-Bleed Cinematic ─── */}
      <section className="relative min-h-[60vh] md:min-h-[75vh] flex items-end overflow-hidden pt-14">
        {/* Culture imagery - full bleed background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex">
            {CULTURE_IMAGES.slice(0, 4).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 1.2 }}
                className="flex-1 relative overflow-hidden"
              >
                <img src={img.src} alt="" className="w-full h-full object-cover grayscale opacity-20" />
              </motion.div>
            ))}
          </div>
          {/* Cinematic gradient overlays — Netflix-style bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-transparent to-[#060606]/50" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060606] to-transparent" />
        </div>

        {/* VC Crest watermark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ delay: 0.8, duration: 2 }}
          className="absolute right-8 md:right-20 top-24 pointer-events-none"
        >
          <img src={viralCartelCrest} alt="" className="w-32 md:w-48 h-auto" />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pb-10 md:pb-20 w-full flex flex-col items-center text-center md:items-start md:text-left">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="flex flex-col items-center md:items-start">
            <p className="text-[10px] text-white/25 uppercase tracking-[0.6em] mb-5">Private Access</p>
            <h1 className="text-6xl md:text-[120px] text-white leading-[0.85] tracking-[-0.02em] mb-6" style={luxuryFont}>
              Control the<br />
              <img src={cultureArcImg} alt="CULTURE." className="block mx-auto md:mx-0" style={{ maxWidth: '360px', marginTop: '-4px', filter: 'drop-shadow(0 0 20px rgba(229, 9, 20, 0.6))' }} />
            </h1>
            <p className="text-white/25 text-sm md:text-base max-w-md leading-relaxed mb-10">
              Launch campaigns into the Loopgate arena. Editors compete, judges rate, content spreads. All within minutes.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={() => setLaunchOpen(true)} className="bg-white text-black hover:bg-white/90 h-12 px-8 text-[11px] uppercase tracking-[0.3em] rounded-none font-medium transition-all">
                Launch Campaign <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1B4332] animate-pulse" />
                <span className="text-[9px] text-white/20 uppercase tracking-wider">Drops Open</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>


      <div className="max-w-7xl mx-auto px-8 relative z-10">

        {/* ─── Slot Tiers ─── */}
        <motion.section id="portal-slots" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="py-20">
          <p className="text-[9px] text-white/15 uppercase tracking-[0.5em] mb-12">Featured Offers</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px]">
            {/* TRIAL — Artist/Music bg */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative group overflow-hidden text-left aspect-[3/4]"
              onClick={() => { setSelectedTier(SLOT_TIERS[0]); setLaunchOpen(true); }}
            >
              <img src={cultureArtist} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.5em]">Trial Slot</p>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl text-white mb-2" style={luxuryFont}>$150</p>
                  <h3 className="text-2xl md:text-3xl text-white/60 leading-[0.9] mb-4" style={luxuryFont}>TEST THE WATERS.</h3>
                  <p className="text-[11px] text-white/20 leading-relaxed mb-1">20 to 30 edits · 500K to 1M impressions</p>
                  <p className="text-[10px] text-white/10 leading-relaxed mb-4">48 hour arena cycle. 1v1 battles included.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />)}
                      </div>
                      <span className="text-[8px] text-white/15 uppercase tracking-wider">3/3 Left</span>
                    </div>
                    <span className="text-[9px] text-white/15 group-hover:text-white/40 uppercase tracking-[0.3em] transition-colors flex items-center gap-1">
                      Select <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* STANDARD — Phonk/Music bg */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative group overflow-hidden text-left aspect-[3/4]"
              onClick={() => { setSelectedTier(SLOT_TIERS[1]); setLaunchOpen(true); }}
            >
              <img src={culturePhonk} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.5em]">Standard Slot</p>
                  <span className="text-[7px] text-white/40 uppercase tracking-wider border border-white/15 px-2 py-0.5">Most Chosen</span>
                </div>
                <div>
                  <p className="text-4xl md:text-5xl text-white mb-2" style={luxuryFont}>$400</p>
                  <h3 className="text-2xl md:text-3xl leading-[0.9] mb-4" style={luxuryFont}>
                    <span className="text-white/80">OWN THE </span>
                    <span className="text-[#E00000]">CYCLE.</span>
                  </h3>
                  <p className="text-[11px] text-white/20 leading-relaxed mb-1">40 to 80 edits · 2M to 5M impressions</p>
                  <p className="text-[10px] text-white/10 leading-relaxed mb-4">Full arena cycle. Judge scoring. Loop Feed exposure.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />)}
                      </div>
                      <span className="text-[8px] text-white/15 uppercase tracking-wider">3/3 Left</span>
                    </div>
                    <span className="text-[9px] text-white/15 group-hover:text-white/40 uppercase tracking-[0.3em] transition-colors flex items-center gap-1">
                      Select <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* TAKEOVER — NFL/Sports bg */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative group overflow-hidden text-left aspect-[3/4]"
              onClick={() => { setSelectedTier(SLOT_TIERS[2]); setLaunchOpen(true); }}
            >
              <img src={cultureNFL} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
              {/* Subtle red ambient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(224,0,0,0.06) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.5em]">Takeover Slot</p>
                  <span className="text-[7px] text-[#E00000]/60 uppercase tracking-wider border border-[#E00000]/20 px-2 py-0.5 bg-[#E00000]/5">Max Impact</span>
                </div>
                <div>
                  <p className="text-4xl md:text-6xl text-white mb-2" style={luxuryFont}>$1,200</p>
                  <h3 className="text-2xl md:text-3xl leading-[0.9] mb-4" style={luxuryFont}>
                    <span className="text-white/80">BECOME </span>
                    <span className="text-[#E00000]">UNDENIABLE.</span>
                  </h3>
                  <p className="text-[11px] text-white/20 leading-relaxed mb-1">100 to 130+ edits · 5M to 10M+ impressions</p>
                  <p className="text-[10px] text-white/10 leading-relaxed mb-4">Pinned event. Full ecosystem takeover. Multi-format distribution.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />)}
                      </div>
                      <span className="text-[8px] text-white/15 uppercase tracking-wider">3/3 Left</span>
                    </div>
                    <span className="text-[9px] text-white/15 group-hover:text-[#E00000]/50 uppercase tracking-[0.3em] transition-colors flex items-center gap-1">
                      Select <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* ─── Metrics Ribbon ─── */}
          <div className="border-y border-white/[0.04] mt-12 relative" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <div className="py-8 grid grid-cols-3 gap-0">
              {[
                { label: 'Edits Generated', value: '20 to 130+' },
                { label: 'Time to Start', value: '<2 Hours' },
                { label: 'Feed Impressions', value: '500K to 10M+' },
              ].map((m, i) => (
                <div key={m.label} className={`text-center py-2 ${i < 2 ? 'border-r border-white/[0.04]' : ''}`}>
                  <p className="text-2xl md:text-3xl text-white/80 mb-1" style={luxuryFont}>{m.value}</p>
                  <p className="text-[8px] text-white/20 uppercase tracking-[0.3em]">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── The Process ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="pb-20">
          <div className="border-t border-white/[0.04] pt-20">
            <p className="text-[9px] text-white/15 uppercase tracking-[0.5em] mb-12">How It Works</p>
            <div className="grid md:grid-cols-4 gap-12 md:gap-8">
              {[
                { step: '01', title: 'Select Your Slot', desc: 'Choose your campaign tier and upload your asset — song, link, or brief.' },
                { step: '02', title: 'We Ignite', desc: 'Your campaign enters the arena within minutes. Editors start competing immediately.' },
                { step: '03', title: 'Content Flows', desc: 'Watch real-time edits, 1v1 battles, and judge reviews on your dashboard.' },
                { step: '04', title: 'Own Everything', desc: 'All generated content is yours. We handle distribution, seeding, and amplification.' },
              ].map(item => (
                <div key={item.step}>
                  <span className="text-[10px] text-white/20 font-mono">{item.step}</span>
                  <h3 className="text-xl text-white/80 mt-2 mb-3" style={luxuryFont}>{item.title}</h3>
                  <p className="text-[11px] text-white/15 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── Campaign Dashboard CTA ─── */}
        <motion.section id="portal-campaigns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="pb-20">
          <div className="border-t border-white/[0.04] pt-16">
            <button
              onClick={() => navigate('/enterprise/dashboard')}
              className="w-full border border-white/[0.06] p-6 text-left hover:border-white/[0.12] transition-all group"
              style={{ background: 'rgba(255,255,255,0.01)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-white/15 uppercase tracking-[0.4em] mb-1" style={headerFont}>Your Campaigns</p>
                  <h3 className="text-xl text-white/60" style={luxuryFont}>Open Command Center</h3>
                  <p className="text-[10px] text-white/15 mt-1">Track metrics, compare results, and manage everything in one place.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
            </button>
          </div>
        </motion.section>

        {/* ─── Revenue Share CTA ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="pb-10">
          <button 
            onClick={() => setView('revshare')}
            className="w-full border border-[#1B4332]/20 p-8 md:p-10 text-left hover:border-[#1B4332]/40 transition-all duration-500 group"
            style={{ background: 'linear-gradient(135deg, rgba(27,67,50,0.05) 0%, rgba(10,10,10,1) 100%)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Handshake className="w-4 h-4 text-[#1B4332]/50" />
                  <span className="text-[8px] text-[#1B4332]/50 uppercase tracking-[0.4em]">No Budget? No Problem.</span>
                </div>
                <h3 className="text-2xl text-white/70 mb-2" style={luxuryFont}>Revenue Share Program</h3>
                <p className="text-[11px] text-white/20 leading-relaxed max-w-md">
                  Got a fire project but no cash? Pitch us. If we believe in it, we run the full Loopgate engine and take a cut of revenue. It ain't free — it's smart.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[#1B4332]/50 transition-colors mt-2 shrink-0" />
            </div>
          </button>
        </motion.section>

        {/* ─── Bottom Grid: Anonymous + Cartel Circle ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="pb-20 grid md:grid-cols-2 gap-[1px] bg-white/[0.04]">
          <div className="p-8 md:p-12" style={{ background: '#0A0A0A' }}>
            <Shield className="w-5 h-5 text-white/10 mb-5" />
            <h3 className="text-lg text-white/70 mb-2" style={luxuryFont}>Anonymous Mode</h3>
            <p className="text-[11px] text-white/15 leading-relaxed max-w-xs">
              Purchase without an account. Receive a secure dashboard link via email. Full privacy, full control.
            </p>
          </div>
          <div className="p-8 md:p-12 flex flex-col items-center text-center" style={{ background: '#0A0A0A' }}>
            <h3 className="text-lg text-white/70 mb-2" style={luxuryFont}>Join the Cartel Circle</h3>
            <p className="text-[11px] text-white/15 leading-relaxed max-w-xs mb-5">
              Get pinged first on new drops, system updates, and exclusive slot releases.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); toast.success("You're in the circle."); }} className="flex gap-2 w-full max-w-xs">
              <Input placeholder="your@email.com" type="email" required className="bg-white/[0.03] border-white/[0.06] text-[11px] placeholder:text-white/10 focus:border-white/20 h-10 rounded-none flex-1" />
              <Button type="submit" className="bg-white/[0.06] hover:bg-white/[0.1] text-white/50 h-10 px-5 text-[9px] uppercase tracking-widest rounded-none border border-white/[0.06] shrink-0">
                Join
              </Button>
            </form>
            <p className="text-[7px] text-white/8 uppercase tracking-wider mt-3">No spam · First access · Drop alerts only</p>
          </div>
        </motion.section>

        {/* ─── Contact ─── */}
        <section className="border-t border-white/[0.04] py-24 text-center">
          <h2 className="text-3xl md:text-4xl mb-3 text-white/50" style={luxuryFont}>Custom Packages</h2>
          <p className="text-[11px] text-white/12 mb-8">We build bespoke campaigns for labels, studios, and agencies.</p>
          <Button onClick={() => window.location.href = 'mailto:team@loopgate.io'} className="bg-transparent hover:bg-white/[0.03] border border-white/[0.08] text-white/30 hover:text-white/60 h-12 px-10 text-[10px] uppercase tracking-[0.3em] rounded-none transition-all duration-300">
            <Mail className="w-3.5 h-3.5 mr-2" /> Contact Team
          </Button>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.04] py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={viralCartelLogo} alt="VC" className="w-4 h-4 opacity-20" />
            <span className="text-[8px] text-white/8 uppercase tracking-wider">Viral Cartel × Loopgate</span>
          </div>
          <Link to="/" className="text-[9px] text-white/8 hover:text-white/20 transition-colors">Back to Loopgate</Link>
        </footer>
      </div>

      {/* ─── Launch Campaign Modal ─── */}
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="border-white/[0.06] text-white max-w-lg rounded-none p-0 [&>button]:text-white/40" style={{ background: '#0A0A0A' }}>
          <div className="p-6 pb-0 border-b border-white/[0.04]">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-[0.05em]" style={luxuryFont}>Launch Campaign</DialogTitle>
            </DialogHeader>
            <p className="text-[9px] text-white/15 uppercase tracking-[0.3em] mt-1 mb-4">Configure your slot details</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-2">Song File or TikTok Link</label>
              <Input value={campaignLink} onChange={(e) => setCampaignLink(e.target.value)} placeholder="https://tiktok.com/... or upload a file" className="bg-white/[0.02] border-white/[0.06] text-sm placeholder:text-white/10 focus:border-white/20 h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-2">Campaign Name</label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Summer Drop 2026" className="bg-white/[0.02] border-white/[0.06] text-sm placeholder:text-white/10 focus:border-white/20 h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-2">Brief / Notes for Founder (Optional)</label>
              <Textarea 
                value={campaignNotes} 
                onChange={(e) => { if (e.target.value.length <= 1500) setCampaignNotes(e.target.value); }} 
                placeholder="Describe the vibe, target audience, references, special instructions... go as deep as you need." 
                className="bg-white/[0.02] border-white/[0.06] text-sm placeholder:text-white/10 focus:border-white/20 rounded-none min-h-[120px] resize-y" 
                maxLength={1500}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[8px] text-white/10 uppercase tracking-wider">Up to 1,500 characters</span>
                <span className={`text-[8px] uppercase tracking-wider ${campaignNotes.length > 1300 ? 'text-[#E00000]/50' : 'text-white/10'}`}>{campaignNotes.length}/1,500</span>
              </div>
            </div>
            
            {/* File Attachments */}
            <div>
              <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-2">Attach Files (Optional)</label>
              <p className="text-[8px] text-white/10 mb-3">Reference images, mood boards, logos, artwork — anything that helps us understand the vision.</p>
              <label className="flex flex-col items-center justify-center border border-dashed border-white/[0.08] hover:border-white/[0.15] p-5 cursor-pointer transition-colors group" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <Upload className="w-4 h-4 text-white/10 group-hover:text-white/25 mb-2 transition-colors" />
                <span className="text-[9px] text-white/15 group-hover:text-white/30 uppercase tracking-wider transition-colors">Drop files or click to upload</span>
                <span className="text-[7px] text-white/8 mt-1">PNG, JPG, PDF, MP3 · Max 10MB each</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*,.pdf,.mp3,.wav,.m4a" 
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
                      setBriefFiles(prev => [...prev, ...newFiles].slice(0, 5));
                    }
                  }} 
                />
              </label>
              {briefFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {briefFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 border border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="" className="w-6 h-6 object-cover rounded-sm opacity-60" />
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center bg-white/[0.04] rounded-sm">
                            <span className="text-[6px] text-white/20 uppercase">{file.name.split('.').pop()}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-white/30 truncate">{file.name}</span>
                        <span className="text-[8px] text-white/10 shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
                      </div>
                      <button onClick={() => setBriefFiles(prev => prev.filter((_, j) => j !== i))} className="text-white/10 hover:text-white/40 transition-colors ml-2 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <p className="text-[7px] text-white/8 uppercase tracking-wider">{briefFiles.length}/5 files attached</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-3">Select Tier</label>
              <div className="space-y-2">
                {SLOT_TIERS.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left border p-4 transition-all ${selectedTier?.id === tier.id ? 'border-white/20 bg-white/[0.03]' : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80" style={luxuryFont}>{tier.name}</span>
                      <span className="text-sm text-white/50" style={luxuryFont}>{tier.priceLabel}</span>
                    </div>
                    <p className="text-[10px] text-white/15">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleProceedToPayment} disabled={!campaignName.trim() || !selectedTier} className="w-full bg-white text-black hover:bg-white/90 h-12 text-[11px] uppercase tracking-[0.3em] rounded-none font-medium">
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
      <GatePattern opacity={2} color="#FFFFFF" tileSize={140} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] z-[2]" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-md w-full relative z-10">
        <Diamond className="w-3 h-3 text-white/15 mx-auto mb-4" />
        <p className="text-[9px] text-white/25 uppercase tracking-[0.5em] mb-6 text-center">Order Summary</p>

        <div className="border border-white/10 bg-black/40 p-6 space-y-4 mb-6 relative">
          <GoldCorners size={14} />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Campaign</span>
            <span className="text-sm text-white/70">{campaignName}</span>
          </div>
           <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Slot Tier</span>
            <span className="text-sm text-white/70">{selectedTier?.name}</span>
          </div>
           <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-wider">Price</span>
            <span className="text-2xl text-white/90" style={luxuryFont}>{selectedTier?.priceLabel}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-5">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] mb-3">Payment Method</p>
          <div className="grid grid-cols-3 gap-[1px] bg-white/[0.04]">
            {([
              { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard, sublabel: 'Visa, MC, Amex', active: true },
              { id: 'paypal' as PaymentMethod, label: 'PayPal', icon: Wallet, sublabel: 'Instant · No Hold', active: true, recommended: true },
              { id: 'crypto' as PaymentMethod, label: 'Crypto', icon: Bitcoin, sublabel: 'Coming Soon', active: false },
            ]).map(method => (
              <button
                key={method.id}
                onClick={() => method.active && setPaymentMethod(method.id)}
                className={`relative p-4 text-center transition-all ${paymentMethod === method.id ? 'bg-white/[0.06] border-t-2 border-t-[#E00000]' : 'bg-[#0A0A0A] hover:bg-white/[0.02]'} ${!method.active ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {method.recommended && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full text-[6px] bg-[#1B4332] text-white/90 px-2 py-0.5 uppercase tracking-[0.2em] font-medium" style={{ fontSize: '6px' }}>
                    ⚡ Fastest
                  </span>
                )}
                <method.icon className={`w-4 h-4 mx-auto mb-1.5 ${paymentMethod === method.id ? 'text-white/60' : 'text-white/20'}`} />
                <p className={`text-[10px] uppercase tracking-wider ${paymentMethod === method.id ? 'text-white/70' : 'text-white/20'}`} style={luxuryFont}>{method.label}</p>
                <p className={`text-[7px] mt-0.5 ${method.recommended && method.id === paymentMethod ? 'text-[#1B4332]' : 'text-white/10'}`}>{method.sublabel}</p>
              </button>
            ))}
          </div>
          {paymentMethod === 'paypal' && (
            <div className="mt-2 p-3 border border-[#1B4332]/20 bg-[#1B4332]/5 flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#1B4332]/60 shrink-0" />
              <p className="text-[9px] text-[#1B4332]/60 leading-relaxed">PayPal payments process instantly with no hold period. Your campaign enters the arena faster.</p>
            </div>
          )}
        </div>

        {/* Email for receipt (anonymous mode) */}
        <div className="mb-5">
          <label className="text-[9px] text-white/20 uppercase tracking-wider block mb-2">Email for Receipt (Optional)</label>
          <Input 
            value={paymentEmail} 
            onChange={(e) => setPaymentEmail(e.target.value)} 
            placeholder="your@email.com" 
            type="email"
            className="bg-white/[0.02] border-white/[0.06] text-sm placeholder:text-white/10 focus:border-white/20 h-11 rounded-none" 
          />
        </div>

        <p className="text-[9px] text-white/10 text-center mb-4 uppercase tracking-wider">
          {paymentMethod === 'card' ? 'Secured by Stripe' : paymentMethod === 'paypal' ? 'Secured by PayPal · Instant Processing' : 'Binance Pay'}
        </p>

        <Button onClick={handlePay} disabled={paymentProcessing || (paymentMethod !== 'card' && paymentMethod !== 'paypal')} className={`w-full text-white h-14 text-[11px] uppercase tracking-[0.4em] rounded-none border ${paymentMethod === 'paypal' ? 'bg-[#003087] hover:bg-[#003087]/90 border-[#003087]/40 shadow-[0_0_40px_rgba(0,48,135,0.2)]' : 'bg-[#8B0000] hover:bg-[#A00000] border-[#8B0000]/40 shadow-[0_0_40px_rgba(139,0,0,0.2)]'}`}>
          {paymentProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening Checkout...</>
          ) : paymentMethod === 'crypto' ? (
            <>Contact for Crypto</>
          ) : (
            <>Pay {selectedTier?.priceLabel} {paymentMethod === 'paypal' ? 'with PayPal' : ''} <ArrowRight className="w-3.5 h-3.5 ml-2" /></>
          )}
        </Button>

        <button onClick={() => setView('portal')} className="mt-6 w-full text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors text-center block">← Back to Portal</button>
      </motion.div>
    </motion.div>
  );

  // ─── RECEIPT ───
  const renderReceipt = () => (
    <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #080808 100%)' }}>
      <GrainOverlay />
      <GatePattern opacity={2} color="#FFFFFF" tileSize={140} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] z-[2]" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} className="max-w-sm w-full text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300 }} className="w-16 h-16 border border-[#1B4332]/40 bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-7 h-7 text-[#1B4332]" />
        </motion.div>

        <h1 className="text-4xl text-white mb-2" style={luxuryFont}>Campaign Activated.</h1>
        <p className="text-xs text-white/25 leading-relaxed mb-8">
          Your slot has entered the Loopgate system.<br />
          You will receive updates as distribution begins.
        </p>

        <div className="border border-white/10 bg-black/40 p-5 text-left space-y-3 mb-8 relative">
          <GoldCorners size={12} />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Campaign</span>
            <span className="text-xs text-white/60">{receiptData?.name}</span>
          </div>
           <div className="h-px bg-white/5" />
          <div className="flex justify-between">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Slot Type</span>
            <span className="text-xs text-white/60">{receiptData?.tier}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Status</span>
             <span className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-[#E00000] rounded-full animate-pulse" />
               Queued for Ignition
            </span>
          </div>
        </div>

        <p className="text-[9px] text-white/10 mb-8 leading-relaxed">
          Founder manually primes all campaigns for maximum reach.
        </p>

        <Button onClick={handleGoToDashboard} className="w-full bg-transparent hover:bg-white/[0.03] border border-white/10 text-white/40 hover:text-white/70 h-12 text-[10px] uppercase tracking-[0.3em] rounded-none transition-all">
          Go to Dashboard <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );

  // ─── REVENUE SHARE APPLICATION ───
  const renderRevShare = () => (
    <motion.div key="revshare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex items-center justify-center px-4 md:px-6 py-12 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #0D0D0D 50%, #080808 100%)' }}>
      <GrainOverlay />
      <GatePattern opacity={2} color="#FFFFFF" tileSize={140} />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] z-[2]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-md w-full relative z-10">
        <Handshake className="w-4 h-4 md:w-5 md:h-5 text-[#1B4332]/60 mx-auto mb-3" />
        <h1 className="text-2xl md:text-3xl text-white text-center mb-1.5" style={luxuryFont}>Revenue Share Program</h1>
        <p className="text-[9px] md:text-[10px] text-white/20 text-center mb-6 md:mb-8 leading-relaxed max-w-xs mx-auto">
          No budget? No problem. If your project is fire, we'll push it through the Loopgate engine and take a percentage of revenue generated. We decide what's worth it.
        </p>

        {revShareSubmitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 border border-[#1B4332]/40 bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Check className="w-5 h-5 md:w-7 md:h-7 text-[#1B4332]" />
            </div>
            <h2 className="text-xl md:text-2xl text-white mb-2" style={luxuryFont}>Application Received.</h2>
            <p className="text-[10px] md:text-xs text-white/25 mb-6 md:mb-8">We review every pitch personally. If it's fire, you'll hear from us within 48 hours.</p>
            <Button onClick={() => { setView('portal'); setRevShareSubmitted(false); }} className="bg-transparent border border-white/10 text-white/40 hover:text-white/70 h-10 md:h-12 px-6 md:px-8 text-[9px] md:text-[10px] uppercase tracking-[0.3em] rounded-none">
              Back to Portal
            </Button>
          </motion.div>
        ) : (
          <div className="border border-white/10 bg-black/40 p-4 md:p-6 space-y-3 md:space-y-4 relative">
            <GoldCorners size={12} />
            <div>
              <label className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-wider block mb-1.5">Your Name</label>
              <Input value={revShareName} onChange={(e) => setRevShareName(e.target.value)} placeholder="Artist / Label name" className="bg-white/[0.02] border-white/[0.06] text-[13px] md:text-sm placeholder:text-white/10 focus:border-white/20 h-9 md:h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-wider block mb-1.5">Email *</label>
              <Input value={revShareEmail} onChange={(e) => setRevShareEmail(e.target.value)} placeholder="your@email.com" type="email" required className="bg-white/[0.02] border-white/[0.06] text-[13px] md:text-sm placeholder:text-white/10 focus:border-white/20 h-9 md:h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-wider block mb-1.5">Project Name *</label>
              <Input value={revShareProject} onChange={(e) => setRevShareProject(e.target.value)} placeholder="Song title, brand, campaign..." required className="bg-white/[0.02] border-white/[0.06] text-[13px] md:text-sm placeholder:text-white/10 focus:border-white/20 h-9 md:h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-wider block mb-1.5">Link to Project</label>
              <Input value={revShareUrl} onChange={(e) => setRevShareUrl(e.target.value)} placeholder="https://..." className="bg-white/[0.02] border-white/[0.06] text-[13px] md:text-sm placeholder:text-white/10 focus:border-white/20 h-9 md:h-11 rounded-none" />
            </div>
            <div>
              <label className="text-[8px] md:text-[9px] text-white/20 uppercase tracking-wider block mb-1.5">Why Should We Invest? *</label>
              <Textarea value={revSharePitch} onChange={(e) => setRevSharePitch(e.target.value)} placeholder="Sell us on it. Why is this going to blow up?" required className="bg-white/[0.02] border-white/[0.06] text-[13px] md:text-sm placeholder:text-white/10 focus:border-white/20 rounded-none min-h-[80px] md:min-h-[100px] resize-none" />
            </div>

            <Button onClick={handleRevShareSubmit} disabled={revShareSubmitting} className="w-full bg-[#1B4332] hover:bg-[#1B4332]/80 text-white h-11 md:h-14 text-[10px] md:text-[11px] uppercase tracking-[0.4em] rounded-none border border-[#1B4332]/40">
              {revShareSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : <>Submit Pitch <ArrowRight className="w-3.5 h-3.5 ml-2" /></>}
            </Button>

            <button onClick={() => setView('portal')} className="w-full text-[8px] md:text-[9px] text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors text-center block pt-1">← Back to Portal</button>
          </div>
        )}
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
        {view === 'revshare' && renderRevShare()}
      </AnimatePresence>
    </div>
  );
}
