import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Mail, User, Briefcase, ArrowRight, CheckCircle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import SEO, { pageSEO } from '@/components/SEO';

type ViewMode = 'form' | 'login' | 'otp';

export default function EnterprisePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [loginEmail, setLoginEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create account with random password (they'll reset later)
      const tempPassword = crypto.randomUUID();
      
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            company: formData.company,
            role: formData.role,
            enterprise_inquiry: true,
            message: formData.message
          }
        }
      });

      if (authError) {
        // If user already exists, that's fine - just log the inquiry
        if (!authError.message.includes('already registered')) {
          throw authError;
        }
      }

      // Send email notification to team
      const { error: emailError } = await supabase.functions.invoke('send-enterprise-lead', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          company: formData.company,
          role: formData.role,
          message: formData.message
        }
      });

      if (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't block submission if email fails
      }
      
      toast.success('Request submitted! We\'ll reach out within 24 hours.');
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Enterprise signup error:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: {
          shouldCreateUser: false, // Only allow existing users
        }
      });

      if (error) {
        if (error.message.includes('Signups not allowed')) {
          toast.error('No enterprise account found with this email');
        } else {
          throw error;
        }
        setIsSubmitting(false);
        return;
      }

      toast.success('Verification code sent to your email');
      setViewMode('otp');
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: loginEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      toast.success('Welcome back!');
      navigate('/hub');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      toast.error(error.message || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Request Received</h1>
          <p className="text-muted-foreground mb-6">
            Thanks for your interest in Loopgate Enterprise. Our team will reach out within 24 hours to schedule a call.
          </p>
          <Link to="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageSEO.enterprise} />
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground">
            LOOPGATE
          </Link>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Enterprise
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Value Prop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Launch UGC Campaigns with Top Creators
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Access Loopgate's network of verified video editors and content creators. 
            Run branded competitions, source authentic content, and scale your UGC production.
          </p>
          
          <div className="space-y-4">
            {[
              'Access to ranked, verified creators',
              'Custom branded events & competitions',
              'Real-time performance analytics',
              'Direct content licensing & usage rights'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Form / Login */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-surface-1 border border-border rounded-2xl p-8">
            {/* Toggle between new/existing enterprise */}
            <div className="flex items-center justify-between mb-6">
              <AnimatePresence mode="wait">
                {viewMode === 'form' ? (
                  <motion.div
                    key="form-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-xl font-semibold text-foreground">
                      Get in Touch
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Fill out the form and we'll schedule a call.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-xl font-semibold text-foreground">
                      {viewMode === 'otp' ? 'Enter Code' : 'Enterprise Sign In'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {viewMode === 'otp' 
                        ? `Code sent to ${loginEmail}` 
                        : 'Access your enterprise portal'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {/* New Enterprise Form */}
              {viewMode === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Already Enterprise Link */}
                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="w-full mb-6 py-3 border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors rounded-lg"
                  >
                    Already Enterprise? Sign in here →
                  </button>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Work Email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Your Role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>

                    <Textarea
                      placeholder="Tell us about your campaign goals (optional)"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Request a Call
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our terms and privacy policy.
                    </p>
                  </form>
                </motion.div>
              )}

              {/* Enterprise Login - Email */}
              {viewMode === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enterprise Email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Send Verification Code
                          <KeyRound className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setViewMode('form')}
                    className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to inquiry form
                  </button>
                </motion.div>
              )}

              {/* Enterprise Login - OTP */}
              {viewMode === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={setOtpCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isSubmitting || otpCode.length !== 6}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('login');
                        setOtpCode('');
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={isSubmitting}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
