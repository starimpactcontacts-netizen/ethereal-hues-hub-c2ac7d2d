/* App Router */
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserRoles } from "./hooks/useUserRoles";

// Pages
import LandingPage from "./pages/LandingPage";

import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import EnterpriseOnboardingPage from "./pages/EnterpriseOnboardingPage";
import HubPage from "./pages/HubPage";
import HomePage from "./pages/loopgate/HomePage";
import EventDetailPage from "./pages/loopgate/EventDetailPage";
import RankingsPage from "./pages/loopgate/RankingsPage";
import ProfilePage from "./pages/loopgate/ProfilePage";
import ProfileSettingsPage from "./pages/loopgate/ProfileSettingsPage";
import ProfileStatsPage from "./pages/loopgate/ProfileStatsPage";
import PublicProfilePage from "./pages/loopgate/PublicProfilePage";
import UsernameLookupPage from "./pages/loopgate/UsernameLookupPage";
import ClassPage from "./pages/loopgate/ClassPage";
import LeaguePage from "./pages/loopgate/LeaguePage";
import IndexPage from "./pages/loopgate/IndexPage";
import ArenasPage from "./pages/loopgate/ArenasPage";
import ArenaPage from "./pages/loopgate/ArenaPage";
import ArenaChatPage from "./pages/loopgate/ArenaChatPage";
import CrewsPage from "./pages/loopgate/CrewsPage";
import CreateCrewPage from "./pages/loopgate/CreateCrewPage";
import CrewDetailPage from "./pages/loopgate/CrewDetailPage";
import CrewChatPage from "./pages/loopgate/CrewChatPage";
import UnitChatPage from "./pages/loopgate/UnitChatPage";
import CrewSettingsPage from "./pages/loopgate/CrewSettingsPage";
import ShopPage from "./pages/loopgate/ShopPage";
import FeedPage from "./pages/loopgate/FeedPage";
import GQTPage from "./pages/loopgate/GQTPage";
import JoinCrewPage from "./pages/loopgate/JoinCrewPage";
import JudgeProfilePage from "./pages/loopgate/JudgeProfilePage";
import JudgeLeaderboardPage from "./pages/loopgate/JudgeLeaderboardPage";
import JudgeHubPage from "./pages/loopgate/JudgeHubPage";
import JudgePanelPage from "./pages/loopgate/JudgePanelPage";
import JudgeApplicationPage from "./pages/loopgate/JudgeApplicationPage";
import OpsPanel from "./pages/loopgate/OpsPanel";
import SanctionedTournamentPage from "./pages/loopgate/SanctionedTournamentPage";
import BattleDetailPage from "./pages/loopgate/BattleDetailPage";
import EnterpriseDashboard from "./pages/loopgate/EnterpriseDashboard";
import EnterprisePage from "./pages/EnterprisePage";
import SupportPage from "./pages/SupportPage";
import RulesPage from "./pages/RulesPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AboutPage from "./pages/AboutPage";
import DownloadPage from "./pages/DownloadPage";
import AppPage from "./pages/AppPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FAQPage from "./pages/FAQPage";
import StartPage from "./pages/StartPage";
import MessagesPage from "./pages/loopgate/MessagesPage";
import DirectMessagePage from "./pages/loopgate/DirectMessagePage";
import HostedCompsPage from "./pages/loopgate/HostedCompsPage";
import HostedCompDetailPage from "./pages/loopgate/HostedCompDetailPage";
import ConnectionsPage from "./pages/loopgate/ConnectionsPage";
import NotFound from "./pages/NotFound";

// Components
import AuthenticatedLayout from "./components/loopgate/AuthenticatedLayout";
import ProtectedRoute from "./components/loopgate/ProtectedRoute";
import DevModeBadge from "./components/loopgate/DevModeBadge";
import LoadingScreen from "./components/loopgate/LoadingScreen";
import GlobalAccountPrompt from "./components/loopgate/GlobalAccountPrompt";
import { isNativeApp } from "./lib/native";

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
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  
  // Import temp profile check
  const tempProfile = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('loopgate-temp-profile') || '{}')?.state?.profile 
    : null;
  
  const isEnterprise = roles.includes('enterprise');
  
  // In dev mode, always go to hub immediately
  if ((window as any).__LOOPGATE_DEV_AUTH__) {
    return <Navigate to="/hub" replace />;
  }
  
  // HTML splash handles initial load - this is just a fallback
  if (loading || rolesLoading) {
    return null; // HTML splash is already visible
  }
  
  // Not logged in
  if (!user) {
    // If user has a temp profile, go to hub
    if (tempProfile) {
      return <Navigate to="/hub" replace />;
    }
    // Native app: skip landing, go straight to start (username-first)
    if (isNativeApp()) {
      return <Navigate to="/start" replace />;
    }
    // Web: show landing page
    return <LandingPage />;
  }
  
  // Enterprise without profile - enterprise onboarding
  if (isEnterprise && !profile?.onboarding_completed) {
    return <Navigate to="/enterprise-onboarding" replace />;
  }
  
  // ZERO FRICTION: Skip onboarding for regular users - go straight to hub
  // They can complete profile later in Profile tab
  
  // Logged in - go to hub regardless of onboarding status
  return <Navigate to="/hub" replace />;
}

// Legacy /crews/* → /units/* redirect
function CrewsRedirect() {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/crews/, '/units') + location.search + location.hash;
  return <Navigate to={newPath} replace />;
}


// Onboarding wrapper
function OnboardingWrapper() {
  const { user, profile, loading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  
  const isEnterprise = roles.includes('enterprise');
  
  // HTML splash handles initial load
  if (loading || rolesLoading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/start" replace />;
  }
  
  // Dev account bypasses onboarding entirely - straight to hub
  if (user.email === 'dev@loopgate.io') {
    return <Navigate to="/hub" replace />;
  }
  
  // Enterprise users go to enterprise onboarding
  if (isEnterprise) {
    return <Navigate to="/enterprise-onboarding" replace />;
  }
  
  if (profile?.onboarding_completed) {
    return <Navigate to="/hub" replace />;
  }
  
  return <OnboardingPage />;
}

// Enterprise onboarding wrapper
function EnterpriseOnboardingWrapper() {
  const { user, profile, loading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  
  const isEnterprise = roles.includes('enterprise');
  
  // HTML splash handles initial load
  if (loading || rolesLoading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/start" replace />;
  }
  
  // Non-enterprise users go to regular onboarding
  if (!isEnterprise) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (profile?.onboarding_completed) {
    return <Navigate to="/hub" replace />;
  }
  
  return <EnterpriseOnboardingPage />;
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes - no auth required */}
            <Route path="/" element={<RootRedirect />} />
            {/* /auth removed - use /start or /login */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingWrapper />} />
            <Route path="/enterprise-onboarding" element={<EnterpriseOnboardingWrapper />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/join/:crewSlug" element={<JoinCrewPage />} />
            <Route path="/u/:username" element={<UsernameLookupPage />} />
            <Route path="/start" element={<StartPage />} />
            
            {/* Guest-accessible routes (can browse, need login to participate) */}
            <Route element={
              <ProtectedRoute allowGuest={true}>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }>
              <Route path="/hub" element={<HubPage />} />
              <Route path="/editor/:userId" element={<PublicProfilePage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/class" element={<ClassPage />} />
              <Route path="/league" element={<LeaguePage />} />
              <Route path="/events" element={<HomePage />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/gqt" element={<GQTPage />} />
              <Route path="/index" element={<IndexPage />} />
              <Route path="/arenas" element={<ArenasPage />} />
              <Route path="/arena" element={<ArenaPage />} />
              <Route path="/sanctioned/:id" element={<SanctionedTournamentPage />} />
              <Route path="/battle/:battleId" element={<BattleDetailPage />} />
              <Route path="/hosted-comps" element={<HostedCompsPage />} />
              <Route path="/hosted-comp/:id" element={<HostedCompDetailPage />} />
              <Route path="/judges" element={<JudgeHubPage />} />
              <Route path="/judges/leaderboard" element={<JudgeLeaderboardPage />} />
              <Route path="/judges/apply" element={<JudgeApplicationPage />} />
              <Route path="/judge/:username" element={<JudgeProfilePage />} />
            </Route>

            {/* Protected routes - auth required */}
            <Route element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/settings" element={<ProfileSettingsPage />} />
              <Route path="/profile/stats" element={<ProfileStatsPage />} />
              <Route path="/arenas/:arenaId" element={<ArenaChatPage />} />
            <Route path="/units" element={<CrewsPage />} />
              <Route path="/units/create" element={<CreateCrewPage />} />
              <Route path="/units/:crewId" element={<CrewDetailPage />} />
              <Route path="/units/:crewId/chat" element={<CrewChatPage />} />
              <Route path="/units/:crewId/channels" element={<UnitChatPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<DirectMessagePage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/units/:crewId/settings" element={<CrewSettingsPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/enterprise-dashboard" element={<EnterpriseDashboard />} />
            </Route>
            
            {/* Judge Panel - requires judge/dev/admin role */}
            <Route path="/judge-panel" element={
              <ProtectedRoute requireJudge={true}>
                <JudgePanelPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Ops Panel - requires admin/dev role ONLY (NOT judges) */}
            <Route path="/ops-panel/a7c92ff31b" element={
              <ProtectedRoute requireOpsAccess={true}>
                <OpsPanel />
              </ProtectedRoute>
            } />
            
            {/* Enterprise Portal - NO DEV MODE BYPASS - requires enterprise role only */}
            <Route path="/enterprise" element={<EnterprisePage />} />
            
            {/* Legacy /crews redirects → /units */}
            <Route path="/crews" element={<Navigate to="/units" replace />} />
            <Route path="/crews/*" element={<CrewsRedirect />} />

            {/* 404 - public */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalAccountPrompt />
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
    </HelmetProvider>
  );
}
