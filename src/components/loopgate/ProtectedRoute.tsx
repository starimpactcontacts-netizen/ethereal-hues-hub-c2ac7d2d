import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
  requireOpsAccess?: boolean; // admin OR judge OR dev
  allowGuest?: boolean; // Allow unauthenticated users to view (read-only)
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireOpsAccess = false,
  allowGuest = false 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin, hasOpsAccess } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  
  const isEnterprise = roles.includes('enterprise');
  
  // Dev mode bypass
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <>{children}</>;
  }
  
  // CRITICAL: Show loading screen while auth state is being determined
  // This prevents the flash of login page
  if (loading || (user && rolesLoading)) {
    return <LoadingScreen />;
  }
  
  // Not authenticated
  if (!user) {
    // If guest access allowed, let them through
    if (allowGuest) {
      return <>{children}</>;
    }
    // Otherwise redirect to auth
    return <Navigate to="/auth" replace />;
  }
  
  // Enterprise users skip standard onboarding - go to enterprise onboarding if no profile
  if (isEnterprise) {
    if (!profile?.onboarding_completed) {
      return <Navigate to="/enterprise-onboarding" replace />;
    }
    // Enterprise with completed onboarding can access everything
    return <>{children}</>;
  }
  
  // Needs standard onboarding (non-enterprise users)
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
