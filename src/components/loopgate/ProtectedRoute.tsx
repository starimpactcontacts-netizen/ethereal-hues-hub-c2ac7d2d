import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useGuestMode } from '@/hooks/useGuestMode';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOpsAccess?: boolean; // admin OR dev ONLY (NOT judges)
  requireJudge?: boolean; // judge OR admin OR dev
  allowGuest?: boolean; // Allow unauthenticated users to view (read-only)
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireOpsAccess = false,
  requireJudge = false,
  allowGuest = false 
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  const { isGuest } = useGuestMode();
  
  const isEnterprise = roles.includes('enterprise');
  const isDev = roles.includes('dev');
  const isJudge = roles.includes('judge');
  
  // Ops access = admin OR dev ONLY (not judges)
  const hasOpsAccess = isAdmin || isDev;
  // Judge access = judge OR admin OR dev
  const hasJudgeAccess = isJudge || isAdmin || isDev;
  
  // Dev mode bypass
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <>{children}</>;
  }
  
  // CRITICAL: Show loading screen while auth state is being determined
  if (loading || (user && rolesLoading)) {
    return <LoadingScreen />;
  }
  
  // AUTHENTICATED USERS: Let them through! They have real accounts.
  if (user) {
    // Dev account bypasses ALL checks
    const isDevAccount = user?.email === 'dev@loopgate.io';
    if (isDevAccount) {
      if (requireAdmin && !isAdmin) return <Navigate to="/hub" replace />;
      if (requireOpsAccess && !hasOpsAccess) return <Navigate to="/404" replace />;
      if (requireJudge && !hasJudgeAccess) return <Navigate to="/404" replace />;
      return <>{children}</>;
    }
    
    // Enterprise users: redirect to enterprise onboarding if not completed
    if (isEnterprise && !profile?.onboarding_completed) {
      return <Navigate to="/enterprise-onboarding" replace />;
    }
    
    // Role-based checks for special pages
    if (requireAdmin && !isAdmin) {
      return <Navigate to="/hub" replace />;
    }
    
    if (requireOpsAccess && !hasOpsAccess) {
      return <Navigate to="/404" replace />;
    }
    
    if (requireJudge && !hasJudgeAccess) {
      return <Navigate to="/404" replace />;
    }
    
    // Authenticated user passes all checks - let them through!
    return <>{children}</>;
  }
  
  // NOT AUTHENTICATED
  // If guest access is allowed, let them view
  if (allowGuest || isGuest) {
    return <>{children}</>;
  }
  
  // Otherwise redirect to start
  return <Navigate to="/start" replace />;
}
