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
import LeaguesPage from "./pages/loopgate/LeaguesPage";
import IndexPage from "./pages/loopgate/IndexPage";
import AdminPage from "./pages/loopgate/AdminPage";
import OpsPanel from "./pages/loopgate/OpsPanel";
import SupportPage from "./pages/SupportPage";
import RulesPage from "./pages/RulesPage";
import NotFound from "./pages/NotFound";

// Components
import AuthenticatedLayout from "./components/loopgate/AuthenticatedLayout";
import ProtectedRoute, { isDevMode } from "./components/loopgate/ProtectedRoute";
import DevModeBadge from "./components/loopgate/DevModeBadge";

const queryClient = new QueryClient();

// Root redirect component
function RootRedirect() {
  const { user, profile, loading } = useAuth();
  
  // In dev mode, always go to hub
  if (isDevMode()) {
    return <Navigate to="/hub" replace />;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/leagues" element={<LeaguesPage />} />
              <Route path="/events" element={<HomePage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/index" element={<IndexPage />} />
            </Route>
            
            {/* Admin routes - requires admin role */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Hidden secure ops panel - requires admin role */}
            <Route path="/ops-panel/a7c92ff31b" element={
              <ProtectedRoute requireAdmin={true}>
                <OpsPanel />
              </ProtectedRoute>
            } />
            
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
