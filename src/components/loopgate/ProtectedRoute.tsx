import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTempProfile } from '@/hooks/useTempProfile';
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
  const { profile: tempProfile } = useTempProfile();
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
  // This prevents the flash of login page
  if (loading || (user && rolesLoading)) {
    return <LoadingScreen />;
  }
  
  // Not authenticated
  if (!user) {
    // If guest access allowed OR has temp profile OR is guest mode, let them through
    if (allowGuest || tempProfile || isGuest) {
      return <>{children}</>;
    }
    // Otherwise redirect to start
    return <Navigate to="/start" replace />;
  }
  
  // Dev account (dev@loopgate.io) bypasses ALL onboarding - App Store review account
  const isDevAccount = user?.email === 'dev@loopgate.io';
  if (isDevAccount) {
    // Skip all onboarding checks for dev account
    if (requireAdmin && !isAdmin) {
      return <Navigate to="/hub" replace />;
    }
    if (requireOpsAccess && !hasOpsAccess) {
      return <Navigate to="/404" replace />;
    }
    if (requireJudge && !hasJudgeAccess) {
      return <Navigate to="/404" replace />;
    }
    return <>{children}</>;
  }
  
  // Enterprise users skip standard onboarding - go to enterprise onboarding if no profile
  if (isEnterprise && !profile?.onboarding_completed) {
    return <Navigate to="/enterprise-onboarding" replace />;
  }
  
  // ZERO FRICTION: No onboarding redirect for regular users
  // They go straight to Hub and can complete profile later in Profile tab
  
  // Admin check
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/hub" replace />;
  }
  
  // Ops access check (admin OR dev ONLY - NOT judges)
  if (requireOpsAccess && !hasOpsAccess) {
    return <Navigate to="/404" replace />;
  }
  
  // Judge panel access check (judge OR admin OR dev)
  if (requireJudge && !hasJudgeAccess) {
    return <Navigate to="/404" replace />;
  }
  
  return <>{children}</>;
}
