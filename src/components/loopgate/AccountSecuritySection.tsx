import { useState } from 'react';
import { Mail, KeyRound, Eye, EyeOff, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';

const passwordSchema = z.string().min(8, 'Min 8 characters');

interface Props {
  user: User | null;
  needsPasswordSetup: boolean;
  updatePassword: (pw: string) => Promise<{ error: Error | null }>;
}

export default function AccountSecuritySection({ user, needsPasswordSetup, updatePassword }: Props) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const userEmail = user?.email || '';
  const hasPlaceholderEmail = userEmail.endsWith('@loopgate.local');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    const { error } = await updatePassword(password);
    setPasswordLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(needsPasswordSetup ? 'Password set!' : 'Password updated!');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error('Enter a valid email');
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
      if (error) {
        toast.error(error.message.includes('already registered') ? 'Email already in use' : error.message);
        return;
      }
      if (user?.id) {
        await supabase.from('profiles').update({ email: newEmail.trim().toLowerCase() }).eq('id', user.id);
      }
      toast.success('Check your inbox to confirm the new email');
      setNewEmail('');
      setShowEmailForm(false);
    } catch {
      toast.error('Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Email & Password</h3>
      <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">

        {/* Email row */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium">
                  {hasPlaceholderEmail ? (
                    <span className="text-gold">No email linked</span>
                  ) : (
                    userEmail
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="text-xs text-gold font-medium"
            >
              {hasPlaceholderEmail ? 'Add' : 'Change'}
            </button>
          </div>

          {showEmailForm && (
            <form onSubmit={handleEmailSubmit} className="mt-3 flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={emailLoading || !newEmail.trim()}
                className="px-3 py-2 bg-gold text-black text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {emailLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
            </form>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Password row */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Password</p>
                <p className="text-sm font-medium">
                  {needsPasswordSetup ? (
                    <span className="text-gold">Not set</span>
                  ) : (
                    '••••••••'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-xs text-gold font-medium"
            >
              {needsPasswordSetup ? 'Set Up' : 'Change'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={needsPasswordSetup ? 'New password (8+ chars)' : 'New password'}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold transition-colors pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={passwordLoading || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gold text-black text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check size={14} />
                    {needsPasswordSetup ? 'Set Password' : 'Update Password'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
