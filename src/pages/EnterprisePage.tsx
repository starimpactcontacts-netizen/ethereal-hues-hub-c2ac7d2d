import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, User, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function EnterprisePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

        {/* Right: Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-surface-1 border border-border rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Get in Touch
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill out the form and we'll schedule a call to discuss your needs.
            </p>

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
                  'Submitting...'
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
