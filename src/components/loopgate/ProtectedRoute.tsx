import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isDevMode } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

// Re-export isDevMode for components that need it
export { isDevMode };

// Mock user for dev preview (used by components that need user data)
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

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = true,
  requireAdmin = false 
}: ProtectedRouteProps) {
  // DEV MODE: ALWAYS ALLOW - check global flag FIRST before any hooks
  if (typeof window !== 'undefined' && (window as any).__LOOPGATE_DEV_AUTH__) {
    return <>{children}</>;
  }

  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Loading is handled by global LoadingScreen in App.tsx
  if (loading) {
    return null;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but no profile (needs onboarding)
  if (requireOnboarding && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Requires admin role but user is not admin - redirect to 404 (not hub)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}
