import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/useAuth";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import HubPage from "./pages/HubPage";
import HomePage from "./pages/loopgate/HomePage";
import EventDetailPage from "./pages/loopgate/EventDetailPage";
import RankingsPage from "./pages/loopgate/RankingsPage";
import ProfilePage from "./pages/loopgate/ProfilePage";
import PublicProfilePage from "./pages/loopgate/PublicProfilePage";
import LeaguesPage from "./pages/loopgate/LeaguesPage";
import IndexPage from "./pages/loopgate/IndexPage";

import OpsPanel from "./pages/loopgate/OpsPanel";
import EnterprisePage from "./pages/EnterprisePage";
import SupportPage from "./pages/SupportPage";
import RulesPage from "./pages/RulesPage";
import NotFound from "./pages/NotFound";

// Components
import AuthenticatedLayout from "./components/loopgate/AuthenticatedLayout";
import ProtectedRoute from "./components/loopgate/ProtectedRoute";
import DevModeBadge from "./components/loopgate/DevModeBadge";
import LoadingScreen from "./components/loopgate/LoadingScreen";

// GLOBAL DEV MODE DETECTION - runs BEFORE React
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isDevPreview = hostname.endsWith('.lovable.dev') || hostname === 'localhost' || hostname === '127.0.0.1';

// Block production bypass - ONLY *.lovable.app is production
const isProduction = hostname.endsWith('.lovable.app');

// GLOBAL OVERRIDE - inject mock auth for dev preview ONLY (not production)
if (isDevPreview && !isProduction && typeof window !== 'undefined') {
  (window as any).__LOOPGATE_DEV_AUTH__ = {
    user: { id: 'dev', email: 'dev@loopgate.io', role: 'admin' },
    profile: {
      id: 'dev',
      username: 'DEV_PREVIEW',
      league: 'open',
      global_index_score: 999,
      win_rate: 100,
      total_events: 0,
      total_wins: 0,
      onboarding_completed: true,
      rules_accepted: true,
    },
    session: null,
    platforms: [],
    isAdmin: true,
    loading: false,
  };
  console.log('[LOOPGATE] Dev mode active - all routes unlocked');
}

const queryClient = new QueryClient();

// Root redirect component
function RootRedirect() {
  const { user, profile, loading } = useAuth();
  
  // In dev mode, always go to hub immediately
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <Navigate to="/hub" replace />;
  }
  
  // Show loading screen during auth check - prevents flash
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Not logged in - show landing page
  if (!user) {
    return <LandingPage />;
  }
  
  // Logged in but no profile - needs onboarding
  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Logged in with profile - go to hub
  return <Navigate to="/hub" replace />;
}

// Auth page wrapper - redirect if already logged in
function AuthPageWrapper() {
  const { user, profile, loading } = useAuth();
  
  // Dev mode: immediate redirect, no render
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <Navigate to="/hub" replace />;
  }
  
  // Show loading screen during auth check - prevents flash
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    if (!profile?.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/hub" replace />;
  }
  
  return <AuthPage />;
}

// Onboarding wrapper
function OnboardingWrapper() {
  const { user, profile, loading } = useAuth();
  
  // Show loading screen during auth check - prevents flash
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (profile?.onboarding_completed) {
    return <Navigate to="/hub" replace />;
  }
  
  return <OnboardingPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes - no auth required */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthPageWrapper />} />
            <Route path="/login" element={<AuthPageWrapper />} />
            <Route path="/onboarding" element={<OnboardingWrapper />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/support" element={<SupportPage />} />
            
            {/* Protected routes with layout - auth required */}
            <Route element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }>
              <Route path="/hub" element={<HubPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/editor/:userId" element={<PublicProfilePage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/events" element={<HomePage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/index" element={<IndexPage />} />
            </Route>
            
            {/* Hidden secure ops panel - requires judge/dev/admin role */}
            <Route path="/ops-panel/a7c92ff31b" element={
              <ProtectedRoute requireOpsAccess={true}>
                <OpsPanel />
              </ProtectedRoute>
            } />
            
            {/* Enterprise Portal - NO DEV MODE BYPASS - requires enterprise role only */}
            <Route path="/enterprise" element={<EnterprisePage />} />
            
            {/* 404 - public */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DevModeBadge />
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: 'hsl(var(--surface-1))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
