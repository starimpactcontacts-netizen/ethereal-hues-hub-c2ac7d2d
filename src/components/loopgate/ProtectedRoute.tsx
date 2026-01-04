import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
  requireOpsAccess?: boolean; // admin OR judge OR dev
}

export default function ProtectedRoute({ children, requireAdmin = false, requireOpsAccess = false }: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin, hasOpsAccess } = useAuth();
  
  // Dev mode bypass
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <>{children}</>;
  }
  
  // CRITICAL: Show loading screen while auth state is being determined
  // This prevents the flash of login page
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Needs onboarding
  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Admin check
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/hub" replace />;
  }
  
  // Ops access check (admin OR judge OR dev)
  if (requireOpsAccess && !hasOpsAccess) {
    return <Navigate to="/404" replace />;
  }
  
  return <>{children}</>;
}
