import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

// Check if we should bypass auth (ONLY in Lovable preview, NOT on deployed apps)
function shouldBypassAuth(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // ONLY bypass in Lovable editor preview (*.lovable.dev)
  // DO NOT bypass on deployed apps (*.lovable.app or custom domains)
  const isLovablePreview = hostname.includes('lovable.dev');
  
  // Also bypass in local development
  const isDev = import.meta.env.DEV;
  
  return isDev || isLovablePreview;
}

// Mock user for dev preview
export const DEV_MOCK_USER = {
  id: 'dev-user-preview',
  username: 'DEV_PREVIEW',
  league: 'open' as const,
  global_index_score: 999,
  win_rate: 100,
  total_events: 0,
  total_wins: 0,
  onboarding_completed: true,
  rules_accepted: true,
};

export function isDevMode(): boolean {
  return shouldBypassAuth();
}

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = true,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Bypass auth in dev mode or Lovable preview
  if (shouldBypassAuth()) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but no profile (needs onboarding)
  if (requireOnboarding && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Requires admin role but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
}
