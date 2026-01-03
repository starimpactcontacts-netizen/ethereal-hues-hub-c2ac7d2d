interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
}

// TODO: Re-enable auth protection when app is production-ready
// All routes are currently open for development
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
