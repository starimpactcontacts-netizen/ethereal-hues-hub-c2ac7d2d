/* App Router */
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserRoles } from "./hooks/useUserRoles";
import { lazy, Suspense } from "react";

// Eagerly loaded (critical path)
import LandingPage from "./pages/LandingPage";
import AuthenticatedLayout from "./components/loopgate/AuthenticatedLayout";
import ProtectedRoute from "./components/loopgate/ProtectedRoute";
import DevModeBadge from "./components/loopgate/DevModeBadge";
import LoadingScreen from "./components/loopgate/LoadingScreen";
import GlobalAccountPrompt from "./components/loopgate/GlobalAccountPrompt";
import { isNativeApp } from "./lib/native";

// Lazy-loaded pages — code-split per route
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const EnterpriseOnboardingPage = lazy(() => import("./pages/EnterpriseOnboardingPage"));
const HubPage = lazy(() => import("./pages/HubPage"));
const HomePage = lazy(() => import("./pages/loopgate/HomePage"));
const EventDetailPage = lazy(() => import("./pages/loopgate/EventDetailPage"));
const RankingsPage = lazy(() => import("./pages/loopgate/RankingsPage"));
const ProfilePage = lazy(() => import("./pages/loopgate/ProfilePage"));
const ProfileSettingsPage = lazy(() => import("./pages/loopgate/ProfileSettingsPage"));
const ProfileStatsPage = lazy(() => import("./pages/loopgate/ProfileStatsPage"));
const PublicProfilePage = lazy(() => import("./pages/loopgate/PublicProfilePage"));
const UsernameLookupPage = lazy(() => import("./pages/loopgate/UsernameLookupPage"));
const ClassPage = lazy(() => import("./pages/loopgate/ClassPage"));
const LeaguePage = lazy(() => import("./pages/loopgate/LeaguePage"));
const IndexPage = lazy(() => import("./pages/loopgate/IndexPage"));
const ArenasPage = lazy(() => import("./pages/loopgate/ArenasPage"));
const ArenaPage = lazy(() => import("./pages/loopgate/ArenaPage"));
const ArenaChatPage = lazy(() => import("./pages/loopgate/ArenaChatPage"));
const CrewsPage = lazy(() => import("./pages/loopgate/CrewsPage"));
const CreateCrewPage = lazy(() => import("./pages/loopgate/CreateCrewPage"));
const CrewDetailPage = lazy(() => import("./pages/loopgate/CrewDetailPage"));
const CrewChatPage = lazy(() => import("./pages/loopgate/CrewChatPage"));
const UnitChatPage = lazy(() => import("./pages/loopgate/UnitChatPage"));
const CrewSettingsPage = lazy(() => import("./pages/loopgate/CrewSettingsPage"));
const ShopPage = lazy(() => import("./pages/loopgate/ShopPage"));
const InventoryPage = lazy(() => import("./pages/loopgate/InventoryPage"));
const FeedPage = lazy(() => import("./pages/loopgate/FeedPage"));
const GQTPage = lazy(() => import("./pages/loopgate/GQTPage"));
const JoinCrewPage = lazy(() => import("./pages/loopgate/JoinCrewPage"));
const JudgeProfilePage = lazy(() => import("./pages/loopgate/JudgeProfilePage"));
const JudgeLeaderboardPage = lazy(() => import("./pages/loopgate/JudgeLeaderboardPage"));
const JudgeHubPage = lazy(() => import("./pages/loopgate/JudgeHubPage"));
const JudgePanelPage = lazy(() => import("./pages/loopgate/JudgePanelPage"));
const JudgeApplicationPage = lazy(() => import("./pages/loopgate/JudgeApplicationPage"));
const CreateJudgeDivisionPage = lazy(() => import("./pages/loopgate/CreateJudgeDivisionPage"));
const OpsPanel = lazy(() => import("./pages/loopgate/OpsPanel"));
const SanctionedTournamentPage = lazy(() => import("./pages/loopgate/SanctionedTournamentPage"));
const BattleDetailPage = lazy(() => import("./pages/loopgate/BattleDetailPage"));
const QuickFightPage = lazy(() => import("./pages/loopgate/QuickFightPage"));
const JudgeQueuePage = lazy(() => import("./pages/loopgate/JudgeQueuePage"));
const EnterpriseDashboard = lazy(() => import("./pages/loopgate/EnterpriseDashboard"));
const ArtistDashboardPage = lazy(() => import("./pages/loopgate/ArtistDashboardPage"));
const CampaignAdminPage = lazy(() => import("./pages/loopgate/CampaignAdminPage"));
const CampaignPortalPage = lazy(() => import("./pages/loopgate/CampaignPortalPage"));
const EnterpriseClientDashboard = lazy(() => import("./pages/loopgate/EnterpriseClientDashboard"));
const EnterpriseAccountPage = lazy(() => import("./pages/loopgate/EnterpriseAccountPage"));
const EnterprisePage = lazy(() => import("./pages/EnterprisePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const RulesPage = lazy(() => import("./pages/RulesPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));
const InstallPage = lazy(() => import("./pages/loopgate/InstallPage"));
const AppPage = lazy(() => import("./pages/AppPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const StartPage = lazy(() => import("./pages/StartPage"));
const MessagesPage = lazy(() => import("./pages/loopgate/MessagesPage"));
const DirectMessagePage = lazy(() => import("./pages/loopgate/DirectMessagePage"));
const HostedCompsPage = lazy(() => import("./pages/loopgate/HostedCompsPage"));
const HostedCompDetailPage = lazy(() => import("./pages/loopgate/HostedCompDetailPage"));
const ConnectionsPage = lazy(() => import("./pages/loopgate/ConnectionsPage"));
const ArtistProfilePage = lazy(() => import("./pages/loopgate/ArtistProfilePage"));
const FeaturedDropDetailPage = lazy(() => import("./pages/loopgate/FeaturedDropDetailPage"));
const EditoriumPage = lazy(() => import("./pages/loopgate/EditoriumPage"));
const EditoriumArticlePage = lazy(() => import("./pages/loopgate/EditoriumArticlePage"));

const StudioPage = lazy(() => import("./pages/loopgate/StudioPage"));
const SoloDetailPage = lazy(() => import("./pages/loopgate/SoloDetailPage"));
const PlaylistsPage = lazy(() => import("./pages/loopgate/PlaylistsPage"));
const CommissionsPage = lazy(() => import("./pages/loopgate/CommissionsPage"));
const CommissionDetailPage = lazy(() => import("./pages/loopgate/CommissionDetailPage"));
const PayoutsPage = lazy(() => import("./pages/loopgate/PayoutsPage"));
const SoloArenaPage = lazy(() => import("./pages/loopgate/SoloArenaPage"));
const MissionLobbyPage = lazy(() => import("./pages/loopgate/MissionLobbyPage"));
const LoopyPage = lazy(() => import("./pages/loopgate/LoopyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min stale time — prevents refetching on every mount
      gcTime: 1000 * 60 * 5, // 5 min garbage collection
      refetchOnWindowFocus: false, // Don't refetch when tab re-focuses
      retry: 1,
    },
  },
});

// Lazy fallback — shows nothing (HTML splash or AuthenticatedLayout's Suspense handles it)
function LazyFallback() {
  return <LoadingScreen minimal />;
}

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
          <Suspense fallback={<LazyFallback />}>
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
            <Route path="/install" element={<InstallPage />} />
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
              <Route path="/events" element={<Navigate to="/arena" replace />} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/gqt" element={<GQTPage />} />
              <Route path="/index" element={<IndexPage />} />
              <Route path="/arenas" element={<ArenasPage />} />
              <Route path="/arena" element={<ArenaPage />} />
              <Route path="/sanctioned/:id" element={<SanctionedTournamentPage />} />
              <Route path="/battle/:battleId" element={<BattleDetailPage />} />
              <Route path="/fight/:fightId" element={<QuickFightPage />} />
              <Route path="/quick-fight" element={<QuickFightPage />} />
              <Route path="/judge-queue" element={<JudgeQueuePage />} />
              <Route path="/hosted-comps" element={<HostedCompsPage />} />
              <Route path="/hosted-comp/:id" element={<HostedCompDetailPage />} />
              <Route path="/judges" element={<JudgeHubPage />} />
              <Route path="/judges/leaderboard" element={<JudgeLeaderboardPage />} />
              <Route path="/judges/apply" element={<JudgeApplicationPage />} />
              <Route path="/judge/:username" element={<JudgeProfilePage />} />
              <Route path="/judges/divisions/create" element={<CreateJudgeDivisionPage />} />
              <Route path="/artist/:slug" element={<ArtistProfilePage />} />
              <Route path="/drop/:dropId" element={<FeaturedDropDetailPage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/editorium" element={<EditoriumPage />} />
              <Route path="/editorium/:slug" element={<EditoriumArticlePage />} />
              <Route path="/solo/:id" element={<SoloDetailPage />} />
              <Route path="/commissions" element={<CommissionsPage />} />
              <Route path="/commissions/:id" element={<CommissionDetailPage />} />
              <Route path="/payouts" element={<PayoutsPage />} />
              <Route path="/solo-arena" element={<SoloArenaPage />} />
              <Route path="/mission/:id" element={<MissionLobbyPage />} />
              <Route path="/loopy" element={<LoopyPage />} />
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
              <Route path="/inventory" element={<InventoryPage />} />
              
              <Route path="/studio" element={<StudioPage />} />
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
            <Route path="/enterprise/dashboard" element={<ArtistDashboardPage />} />
            <Route path="/enterprise/account" element={<EnterpriseAccountPage />} />
            
            {/* Campaign Admin - requires ops access */}
            <Route path="/ops-panel/a7c92ff31b/campaigns" element={
              <ProtectedRoute requireOpsAccess={true}>
                <CampaignAdminPage />
              </ProtectedRoute>
            } />
            
            {/* Public campaign portal - password protected */}
            <Route path="/campaign/:slug" element={<CampaignPortalPage />} />
            
            {/* Legacy /crews redirects → /units */}
            <Route path="/crews" element={<Navigate to="/units" replace />} />
            <Route path="/crews/*" element={<CrewsRedirect />} />

            {/* 404 - public */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
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
