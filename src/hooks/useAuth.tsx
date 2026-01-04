import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  league: 'open',
  global_index_score: 999,
  win_rate: 100,
  total_events: 0,
  total_wins: 0,
  onboarding_completed: true,
  rules_accepted: true,
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPlatforms([]);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [devMode]);

  const signInWithGoogle = async () => {
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
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
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

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
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
  };

  const isAdmin = roles.includes('admin');
  const isJudge = roles.includes('judge');
  const isDev = roles.includes('dev');
  const hasOpsAccess = isAdmin || isJudge || isDev;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        platforms,
        loading,
        signInWithGoogle,
        signInWithMagicLink,
        signInWithPassword,
        signUpWithPassword,
        resetPassword,
        signOut,
        refreshProfile,
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
      signInWithGoogle: async () => ({ error: null }),
      signInWithMagicLink: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      signUpWithPassword: async () => ({ error: null }),
      resetPassword: async () => ({ error: null }),
      signOut: async () => {},
      refreshProfile: async () => {},
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
