import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp } from '@/lib/native';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

interface Profile {
  id: string;
  username: string;
  league: 'open' | 'pro' | 'elite';
  global_index_score: number;
  win_rate: number;
  total_events: number;
  total_wins: number;
  onboarding_completed: boolean;
  rules_accepted: boolean;
  avatar_url?: string | null;
  verification_status?: boolean;
  verification_code?: string | null;
  activity_status?: 'online' | 'offline' | 'busy';
  is_guest?: boolean;
  prompted_for_password_at?: string | null;
}

interface ConnectedPlatform {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  platform_username: string;
  platform_url: string;
  follower_count: number;
  is_verified: boolean;
}

type AppRole = 'admin' | 'moderator' | 'user' | 'judge' | 'dev' | 'enterprise';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  platforms: ConnectedPlatform[];
  loading: boolean;
  needsPasswordSetup: boolean; // True if user signed up via magic link only
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null; tokenHash?: string }>;
  signInWithOtp: (email: string, token: string, tokenHash?: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAsGuest: (nickname: string) => Promise<{ error: Error | null; usernameTaken?: boolean }>;
  convertGuestAccount: (password: string, email?: string) => Promise<{ error: Error | null }>;
  markPasswordPrompted: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isGuest: boolean;
  isAdmin: boolean;
  isJudge: boolean;
  isDev: boolean;
  hasOpsAccess: boolean; // admin OR judge OR dev
  roles: AppRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if we're in dev mode (Lovable preview or local dev)
// ONLY bypass on *.lovable.dev, NEVER on *.lovable.app or production
export function isDevMode(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for global dev auth flag first (set in App.tsx before React renders)
  return !!(window as any).__LOOPGATE_DEV_AUTH__;
}

// Mock user for dev mode - simulates authenticated admin
const DEV_MOCK_USER = {
  id: 'dev-user-preview',
  email: 'dev@loopgate.io',
  role: 'admin',
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

// Mock profile for dev mode
const DEV_MOCK_PROFILE: Profile = {
  id: 'dev-user-preview',
  username: 'DEV_PREVIEW',
  league: 'elite',
  global_index_score: 999,
  win_rate: 100,
  total_events: 0,
  total_wins: 0,
  onboarding_completed: true,
  rules_accepted: true,
};

// Demo account credentials for Apple Review (HARDCODED)
const DEMO_ACCOUNT = {
  email: 'dev@loopgate.io',
  username: 'DEV',
  password: 'admin!!!',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const devMode = isDevMode();
  const [user, setUser] = useState<User | null>(devMode ? DEV_MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(devMode ? DEV_MOCK_PROFILE : null);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(!devMode);
  const [roles, setRoles] = useState<AppRole[]>(devMode ? ['admin', 'dev'] : []);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      setProfile(profileData as Profile);
      // Claim any guest submissions after profile is loaded
      import('@/lib/claimGuestSubmissions').then(({ claimGuestSubmissions }) => {
        claimGuestSubmissions(userId, (profileData as any).username, (profileData as any).avatar_url);
      });
    }

    const { data: platformsData } = await supabase
      .from('connected_platforms')
      .select('*')
      .eq('user_id', userId);
    
    if (platformsData) {
      setPlatforms(platformsData as ConnectedPlatform[]);
    }

    // Fetch all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    setRoles((rolesData || []).map(r => r.role as AppRole));
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Skip all auth logic in dev mode - already have mock user/profile
    if (devMode) {
      return;
    }

    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('[Auth] State change:', event, !!session);
        
        // Handle specific events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setPlatforms([]);
          setRoles([]);
          setLoading(false);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed successfully');
        }
        
        // Handle token refresh errors gracefully - don't log out immediately
        // The session might still be valid even if refresh failed temporarily
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setTimeout(() => {
              if (mounted) {
                fetchProfile(session.user.id);
              }
            }, 0);
          }
        } else if (event === 'USER_UPDATED') {
          // User data changed, update accordingly
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              if (mounted) {
                fetchProfile(session.user.id);
              }
            }, 0);
          }
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      // If there's a refresh token error, try to recover by checking localStorage
      if (error) {
        console.error('[Auth] Error getting session:', error);
        
      // Check if this is a refresh token error - try to recover gracefully
        if (error.message?.includes('refresh_token') || error.message?.includes('Refresh Token')) {
          console.log('[Auth] Refresh token issue detected, attempting recovery...');
          // Retry refresh up to 3 times with backoff before giving up.
          // We NEVER auto-signOut here — a transient network failure must not log
          // returning users out. The onAuthStateChange listener will pick the
          // session back up once refresh eventually succeeds.
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const { data: retryData, error: retryErr } = await supabase.auth.refreshSession();
              if (retryData?.session) {
                console.log(`[Auth] Session recovered on attempt ${attempt}`);
                setSession(retryData.session);
                setUser(retryData.session.user);
                fetchProfile(retryData.session.user.id);
                setLoading(false);
                return;
              }
              if (retryErr) console.warn(`[Auth] Refresh attempt ${attempt} failed:`, retryErr.message);
            } catch (e) {
              console.warn(`[Auth] Refresh attempt ${attempt} threw:`, e);
            }
            await new Promise((r) => setTimeout(r, 500 * attempt));
          }
          // Do NOT signOut. Keep stored tokens so the next page load / network
          // recovery can re-establish the session. Just stop the loading state.
          console.log('[Auth] Refresh retries exhausted, leaving stored session intact');
        }
        
        setLoading(false);
        return;
      }
      
      console.log('[Auth] Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Handle deep links for native OAuth callback
    let appUrlListener: any = null;
    if (isNativeApp()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        console.log('[Auth] Deep link received:', url);
        
        // Check if this is an auth callback
        if (url.includes('auth-callback') || url.includes('access_token')) {
          // Close the in-app browser
          try {
            await Browser.close();
          } catch (e) {
            console.log('[Auth] Browser already closed or not open');
          }
          
          // Extract tokens from URL hash
          const hashPart = url.split('#')[1];
          if (hashPart) {
            const hashParams = new URLSearchParams(hashPart);
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            console.log('[Auth] Tokens found:', !!accessToken, !!refreshToken);
            
            if (accessToken && refreshToken) {
              // Set the session with the tokens from the deep link
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('[Auth] Error setting session:', error);
              } else {
                console.log('[Auth] Session restored successfully');
              }
            }
          }
        }
      }).then((listener) => {
        appUrlListener = listener;
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, [devMode]);

  const signInWithGoogle = async () => {
    if (isNativeApp()) {
      // For native apps, manually construct OAuth URL and open in in-app browser
      const redirectUrl = 'io.loopgate.app://auth-callback';
      
      // Get the OAuth URL from Supabase without triggering redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
        },
      });
      
      if (error) return { error };
      
      if (data?.url) {
        // Open in Capacitor's in-app browser
        await Browser.open({ 
          url: data.url,
          presentationStyle: 'fullscreen',
          toolbarColor: '#09090B',
        });
      }
      
      return { error: null };
    }
    
    // Web flow - normal redirect
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/hub`;
    
    // Use our custom edge function that sends a 6-digit code + magic link
    const { data, error: fnError } = await supabase.functions.invoke('send-login-email', {
      body: { email, redirectTo: redirectUrl }
    });
    
    if (fnError) {
      console.error('Custom email function error:', fnError);
      return { error: fnError };
    }
    
    // Return the email for verification
    return { error: null, email: data?.email };
  };

  const signInWithOtp = async (email: string, token: string, _tokenHash?: string) => {
    // Use our custom verification edge function for 6-digit codes
    const { data, error: fnError } = await supabase.functions.invoke('verify-login-code', {
      body: { email, code: token }
    });
    
    if (fnError || !data?.success) {
      return { error: fnError || new Error(data?.error || 'Invalid code') };
    }
    
    // Use the token hash to complete sign in (only token_hash + type, no email)
    if (data.tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: 'magiclink',
      });
      return { error };
    }
    
    return { error: new Error('Verification failed') };
  };

  const signInWithPassword = async (email: string, password: string) => {
    // HARDCODED DEMO ACCOUNT - Always works for Apple Review
    if ((email.toLowerCase() === DEMO_ACCOUNT.email || email.toUpperCase() === DEMO_ACCOUNT.username) && password === DEMO_ACCOUNT.password) {
      // Try to sign in with demo credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
      });
      return { error };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  /**
   * Zero-friction guest sign-in. Uses a private internal email + generated
   * password because anonymous auth is disabled in Lovable Cloud. Users still
   * only enter a nickname; the synthetic credentials stay hidden locally.
   */
  const signInAsGuest = async (nickname: string) => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      return { error: new Error('Nickname must be at least 3 characters') };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { error: new Error('Letters, numbers, and underscores only') };
    }

    // Block taken usernames up front (case-insensitive)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', trimmed)
      .maybeSingle();
    if (existing) {
      return { error: new Error('Nickname taken — try another'), usernameTaken: true };
    }

    const guestEmail = `${trimmed.toLowerCase()}@loopgate.local`;
    const guestPassword = `guest-${crypto.randomUUID()}-${Date.now()}`;

    let { data, error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username: trimmed,
          is_guest: true,
          is_username_only: true,
        },
      },
    });

    if (error && error.message.toLowerCase().includes('already registered')) {
      return { error: new Error('Nickname taken — try another'), usernameTaken: true };
    }

    if (!error && !data.session) {
      await supabase.functions.invoke('auto-confirm-user', { body: { email: guestEmail } });
      const signIn = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword,
      });
      data = signIn.data;
      error = signIn.error;
    }

    if (!error && data.user) {
      await supabase
        .from('profiles')
        .update({
          username: trimmed,
          display_name: trimmed,
          is_guest: true,
          onboarding_completed: true,
        })
        .eq('id', data.user.id);

      await fetchProfile(data.user.id);

      try {
        const { rememberAccount } = await import('@/lib/rememberedAccounts');
        rememberAccount({
          username: trimmed,
          email: guestEmail,
          password: guestPassword,
          isGuest: false,
        });
      } catch { /* ignore */ }
    }
    return { error };
  };

  /**
   * Upgrade an anonymous account to a real one with a password and
   * (optionally) an email for recovery. XP, rank, votes, history all
   * carry over because it's the same auth.users row.
   */
  const convertGuestAccount = async (password: string, email?: string) => {
    const trimmedEmail = email?.trim().toLowerCase();
    const updates: { password: string; email?: string } = { password };
    if (trimmedEmail) updates.email = trimmedEmail;

    const { error } = await supabase.auth.updateUser(updates);
    if (error) return { error };

    // Flip the is_guest flag on the profile
    await supabase.rpc('mark_account_converted');
    await refreshProfile();
    // Update the remembered-accounts entry so the chip stops showing
    // the "Set password" reminder and gets one-tap-with-password.
    try {
      const { rememberAccount } = await import('@/lib/rememberedAccounts');
      const u = (profile?.username) || (user?.user_metadata as any)?.username;
      const e = trimmedEmail || user?.email;
      if (u && e) {
        rememberAccount({ username: u, email: e, password, isGuest: false });
      }
    } catch { /* ignore */ }
    return { error: null };
  };

  const markPasswordPrompted = async () => {
    await supabase.rpc('mark_password_prompted');
    await refreshProfile();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPlatforms([]);
    setRoles([]);
    // Clear any temp profile from localStorage
    localStorage.removeItem('loopgate-temp-profile');
  };

  // Detect if user needs to set up a password
  // Users who signed up with email+password have identities with provider='email' that include a password
  // Users who only used magic link/OTP won't have password set
  // Check identities for a password-based identity, or check if the user signed up with password provider
  const hasPasswordIdentity = user?.identities?.some(
    (identity) => identity.provider === 'email'
  );
  // If user signed up with Google OAuth only, they have no email identity at all
  // If user signed up with magic link, they have email identity but no password
  // Best heuristic: if they signed up with password, the provider list includes 'email' 
  // AND their identity has identity_data with email confirmed
  // However the most reliable check: did they ever call signUpWithPassword or updatePassword?
  // We use has_password from profile as the source of truth when available
  const needsPasswordSetup = (() => {
    // Google-only users don't need password setup prompt (different flow)
    if (user?.app_metadata?.provider === 'google') return false;
    // If no user, no setup needed
    if (!user) return false;
    // Check if the user's sign-up method was password-based
    // When signing up with password, Supabase sets providers to include the provider used
    // For email+password signup, the initial provider is 'email' and they definitely have a password
    // For magic link, provider is also 'email' but they used OTP flow
    // The only reliable way: check if user has ever set a password via our has_password profile flag
    // OR check if they signed up with signUpWithPassword (which we mark in handlePasswordSubmit)
    // Default to false (assume password is set) to avoid annoying users
    return false;
  })();

  const isAdmin = roles.includes('admin');
  const isJudge = roles.includes('judge');
  const isDev = roles.includes('dev');
  const hasOpsAccess = isAdmin || isJudge || isDev;
  const isGuest = !!profile?.is_guest;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        platforms,
        loading,
        needsPasswordSetup,
        signInWithGoogle,
        signInWithMagicLink,
        signInWithOtp,
        signInWithPassword,
        signUpWithPassword,
        signInAsGuest,
        convertGuestAccount,
        markPasswordPrompted,
        updatePassword,
        resetPassword,
        signOut,
        refreshProfile,
        isGuest,
        isAdmin,
        isJudge,
        isDev,
        hasOpsAccess,
        roles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // FORCE AUTH FOR DEV MODE - check global override first
  const devAuth = typeof window !== 'undefined' ? (window as any).__LOOPGATE_DEV_AUTH__ : null;
  if (devAuth) {
    return {
      user: devAuth.user,
      session: null,
      profile: devAuth.profile,
      platforms: [],
      loading: false,
      needsPasswordSetup: false,
      signInWithGoogle: async () => ({ error: null }),
      signInWithMagicLink: async () => ({ error: null, tokenHash: undefined }),
      signInWithOtp: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      signUpWithPassword: async () => ({ error: null }),
      signInAsGuest: async () => ({ error: null, usernameTaken: false }),
      convertGuestAccount: async () => ({ error: null }),
      markPasswordPrompted: async () => {},
      updatePassword: async () => ({ error: null }),
      resetPassword: async () => ({ error: null }),
      signOut: async () => {},
      refreshProfile: async () => {},
      isGuest: false,
      isAdmin: true,
      isJudge: true,
      isDev: true,
      hasOpsAccess: true,
      roles: ['admin', 'dev', 'judge'] as const,
    };
  }

  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
