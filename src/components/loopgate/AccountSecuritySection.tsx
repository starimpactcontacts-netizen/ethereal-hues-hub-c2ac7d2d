import { useState, useEffect } from 'react';
import { Mail, KeyRound, Eye, EyeOff, Loader2, Check, Shield, Smartphone, Monitor, Tablet, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

const passwordSchema = z.string().min(8, 'Min 8 characters');

interface Props {
  user: User | null;
  needsPasswordSetup: boolean;
  updatePassword: (pw: string) => Promise<{ error: Error | null }>;
}

interface ActiveSession {
  id: string;
  device_name: string | null;
  user_agent: string | null;
  last_seen: string | null;
  created_at: string | null;
}

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segLen = 4;
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let seg = '';
    for (let j = 0; j < segLen; j++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(seg);
  }
  return parts.join('-');
}

function getDeviceIcon(name: string | null) {
  if (!name) return <Monitor className="w-4 h-4" />;
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('android')) return <Smartphone className="w-4 h-4" />;
  if (n.includes('ipad') || n.includes('tablet')) return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function getBrowserFromUA(ua: string | null): string {
  if (!ua) return 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  return 'Browser';
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

  // Recovery code
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [hasExistingCode, setHasExistingCode] = useState(false);

  // Active sessions
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const userEmail = user?.email || '';
  const hasPlaceholderEmail = userEmail.endsWith('@loopgate.local');

  // Check if user signed up with password (has_password flag or providers include it)
  const hasPassword = !needsPasswordSetup;

  // Fetch recovery code status and sessions on mount
  useEffect(() => {
    if (!user?.id) return;
    
    // Check if recovery code exists
    supabase
      .from('profiles')
      .select('recovery_code')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.recovery_code) setHasExistingCode(true);
      });

    fetchSessions();
  }, [user?.id]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });
    setSessions((data as any[]) || []);
    setSessionsLoading(false);
  };

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
    if (!error && user?.id) {
      // Mark has_password in profile
      await supabase.from('profiles').update({ has_password: true } as any).eq('id', user.id);
    }
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

  const handleGenerateRecoveryCode = async () => {
    if (!user?.id) return;
    setRecoveryLoading(true);
    const code = generateRecoveryCode();
    const { error } = await supabase
      .from('profiles')
      .update({ recovery_code: code } as any)
      .eq('id', user.id);
    setRecoveryLoading(false);
    if (error) {
      toast.error('Failed to generate code');
    } else {
      setRecoveryCode(code);
      setShowRecoveryCode(true);
      setHasExistingCode(true);
      toast.success('Recovery code generated — save it somewhere safe!');
    }
  };

  const handleRemoveSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session removed');
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
                  {hasPassword ? '••••••••' : <span className="text-gold">Not set</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-xs text-gold font-medium"
            >
              {hasPassword ? 'Change' : 'Set Up'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasPassword ? 'New password' : 'New password (8+ chars)'}
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
                    {hasPassword ? 'Update Password' : 'Set Password'}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recovery Code */}
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium pt-2">Recovery Code</h3>
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-0.5">Backup Recovery Code</p>
            <p className="text-xs text-muted-foreground mb-3">
              {hasExistingCode
                ? 'You have a recovery code. Generate a new one if needed (replaces the old one).'
                : 'Generate a code to recover your account if you lose access.'}
            </p>

            {showRecoveryCode && recoveryCode && (
              <div className="mb-3 p-3 bg-background border border-gold/30 rounded-lg">
                <p className="text-[10px] text-gold uppercase tracking-wider mb-1">Save this code somewhere safe</p>
                <div className="flex items-center gap-2">
                  <code className="text-base font-mono font-bold tracking-widest text-foreground">{recoveryCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryCode);
                      toast.success('Copied!');
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-destructive mt-2">This won't be shown again.</p>
              </div>
            )}

            <button
              onClick={handleGenerateRecoveryCode}
              disabled={recoveryLoading}
              className="flex items-center gap-1.5 text-xs text-gold font-medium disabled:opacity-50"
            >
              {recoveryLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {hasExistingCode ? 'Generate New Code' : 'Generate Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium pt-2">Active Sessions</h3>
      <div className="bg-surface-1 border border-border rounded-xl p-4">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const isCurrentDevice = true; // first session is most recent = likely current
              const lastSeen = session.last_seen ? formatDistanceToNow(new Date(session.last_seen), { addSuffix: true }) : 'Unknown';
              const browser = getBrowserFromUA(session.user_agent);

              return (
                <div key={session.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground">
                      {getDeviceIcon(session.device_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {session.device_name || 'Unknown Device'}
                        {' · '}
                        <span className="text-muted-foreground font-normal">{browser}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Active {lastSeen}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSession(session.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
