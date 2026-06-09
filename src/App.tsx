/* App Router */
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserRoles } from "./hooks/useUserRoles";
import { lazy, Suspense, useEffect } from "react";

// Eagerly loaded (critical path)
import LandingPage from "./pages/LandingPage";
import AuthenticatedLayout from "./components/loopgate/AuthenticatedLayout";
import ProtectedRoute from "./components/loopgate/ProtectedRoute";
import DevModeBadge from "./components/loopgate/DevModeBadge";
import LoadingScreen from "./components/loopgate/LoadingScreen";
import GlobalAccountPrompt from "./components/loopgate/GlobalAccountPrompt";
import GlobalGuestConversionModal from "./components/loopgate/GlobalGuestConversionModal";
import GuestNicknameModal from "./components/loopgate/GuestNicknameModal";
import PendingGiftModal from "./components/loopgate/PendingGiftModal";
import { isNativeApp } from "./lib/native";
import { motion } from "framer-motion";

// Lazy-loaded pages — code-split per route
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
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
const SoloSharePage = lazy(() => import("./pages/loopgate/SoloSharePage"));
const CreateSoloSharePage = lazy(() => import("./pages/loopgate/CreateSoloSharePage"));
const SoloHubPage = lazy(() => import("./pages/loopgate/SoloHubPage"));
const SoloFindPage = lazy(() => import("./pages/loopgate/SoloFindPage"));
const VersusInspoListPage = lazy(() => import("./pages/loopgate/VersusInspoListPage"));
const VersusInspoCreatePage = lazy(() => import("./pages/loopgate/VersusInspoCreatePage"));
const VersusInspoBattlePage = lazy(() => import("./pages/loopgate/VersusInspoBattlePage"));
const CollabsPage = lazy(() => import("./pages/loopgate/CollabsPage"));
const CreateCollabPage = lazy(() => import("./pages/loopgate/CreateCollabPage"));
const CollabDetailPage = lazy(() => import("./pages/loopgate/CollabDetailPage"));
const CollabBattlePage = lazy(() => import("./pages/loopgate/CollabBattlePage"));
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
const CashBattleReadyPage = lazy(() => import("./pages/loopgate/CashBattleReadyPage"));
const CashBattlePage = lazy(() => import("./pages/loopgate/CashBattlePage"));
const EditBattlesHubPage = lazy(() => import("./pages/loopgate/EditBattlesHubPage"));
const QuickFightPage = lazy(() => import("./pages/loopgate/QuickFightPage"));
const JudgeQueuePage = lazy(() => import("./pages/loopgate/JudgeQueuePage"));
const GatekeeperRankPage = lazy(() => import("./pages/loopgate/GatekeeperRankPage"));
const EnterpriseDashboard = lazy(() => import("./pages/loopgate/EnterpriseDashboard"));
const ArtistDashboardPage = lazy(() => import("./pages/loopgate/ArtistDashboardPage"));
const CampaignAdminPage = lazy(() => import("./pages/loopgate/CampaignAdminPage"));
const BattleSimPage = lazy(() => import("./pages/loopgate/BattleSimPage"));
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
const DiscordCallbackPage = lazy(() => import("./pages/loopgate/DiscordCallbackPage"));
const MessagesPage = lazy(() => import("./pages/loopgate/MessagesPage"));
const DirectMessagePage = lazy(() => import("./pages/loopgate/DirectMessagePage"));
const CompetitionLobbyPage = lazy(() => import("./pages/loopgate/CompetitionLobbyPage"));
const HostTournamentPage = lazy(() => import("./pages/loopgate/HostTournamentPage"));
const ConnectionsPage = lazy(() => import("./pages/loopgate/ConnectionsPage"));
const ArtistProfilePage = lazy(() => import("./pages/loopgate/ArtistProfilePage"));
const FeaturedDropDetailPage = lazy(() => import("./pages/loopgate/FeaturedDropDetailPage"));
const EditoriumPage = lazy(() => import("./pages/loopgate/EditoriumPage"));
const EditoriumArticlePage = lazy(() => import("./pages/loopgate/EditoriumArticlePage"));

const SoloDetailPage = lazy(() => import("./pages/loopgate/SoloDetailPage"));
const PlaylistsPage = lazy(() => import("./pages/loopgate/PlaylistsPage"));
const CommissionsPage = lazy(() => import("./pages/loopgate/CommissionsPage"));
const CommissionDetailPage = lazy(() => import("./pages/loopgate/CommissionDetailPage"));
const PayoutsPage = lazy(() => import("./pages/loopgate/PayoutsPage"));
const SoloArenaPage = lazy(() => import("./pages/loopgate/SoloArenaPage"));
const MissionLobbyPage = lazy(() => import("./pages/loopgate/MissionLobbyPage"));
const CreateCompetitionPage = lazy(() => import("./pages/loopgate/CreateCompetitionPage"));
const CompetitionsListPage = lazy(() => import("./pages/loopgate/CompetitionsListPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// GLOBAL DEV MODE DETECTION - runs BEFORE React
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isDevPreview = hostname.endsWith('.lovable.dev') || hostname === 'localhost' || hostname === '127.0.0.1';

// Block production bypass - ONLY *.lovable.app is production
const isProduction = hostname.endsWith('.lovable.app');

// GLOBAL OVERRIDE - inject mock auth for dev preview ONLY (not production)
if (isDevPreview && !isProduction && typeof window !== 'undefined') {
  (window as any).__LOOPGATE_DEV_AUTH__ = {
    user: { id: 'dev', email: 'dev@loopgate.gg', role: 'admin' },
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

// Full-screen branded fallback shown during lazy route loads — no black flash
function LazyFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}
    >
      <motion.img
        src="/loopgate-logo.png"
        alt="Loopgate"
        style={{ width: 64, height: 64, objectFit: 'contain' }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
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
  if (user.email === 'dev@loopgate.gg') {
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
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    const id = window.setTimeout(() => {
      splash.style.display = 'none';
    }, 250);
    return () => window.clearTimeout(id);
  }, []);

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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            <Route path="/auth/discord/callback" element={<DiscordCallbackPage />} />
            {/* Public Solo Share page — no auth required, optimized for viral sharing */}
            <Route path="/s/:slug" element={<SoloSharePage />} />
            
            {/* Guest-accessible routes (can browse, need login to participate) */}
            <Route element={
              <ProtectedRoute allowGuest={true}>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }>
              <Route path="/hub" element={<HubPage />} />
              <Route path="/editor/:userId" element={<PublicProfilePage />} />
              <Route path="/editors/:userId" element={<PublicProfilePage />} />
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
              <Route path="/solo" element={<SoloHubPage />} />
              <Route path="/solo/create" element={<CreateSoloSharePage />} />
              <Route path="/solo/find" element={<SoloFindPage />} />
              <Route path="/collabs" element={<CollabsPage />} />
              <Route path="/collabs/create" element={<CreateCollabPage />} />
              <Route path="/collab/:id" element={<CollabDetailPage />} />
              <Route path="/duo-battle/:id" element={<CollabBattlePage />} />
              <Route path="/competitions" element={<CompetitionsListPage />} />
              <Route path="/competition/create" element={<CreateCompetitionPage />} />
              <Route path="/sanctioned/:id" element={<SanctionedTournamentPage />} />
              <Route path="/battle/:battleId" element={<BattleDetailPage />} />
              <Route path="/battles/:battleId" element={<BattleDetailPage />} />
              <Route path="/cash-battle" element={<CashBattleReadyPage />} />
              <Route path="/cash-battle/:battleId" element={<CashBattlePage />} />
              <Route path="/edit-battles" element={<EditBattlesHubPage />} />
              <Route path="/fight/:fightId" element={<QuickFightPage />} />
              <Route path="/quick-fight" element={<QuickFightPage />} />
              <Route path="/judge-queue" element={<JudgeQueuePage />} />
              <Route path="/competition/:id" element={<CompetitionLobbyPage />} />
              <Route path="/competitions/:id" element={<CompetitionLobbyPage />} />
              <Route path="/judge/gatekeeper/:id" element={<GatekeeperRankPage />} />
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
              <Route path="/units/:crewId/host-tournament" element={<HostTournamentPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              
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

            {/* Battle Simulator Sandbox - access controlled inside the page */}
            <Route path="/ops-panel/a7c92ff31b/sim" element={
              <ProtectedRoute>
                <BattleSimPage />
              </ProtectedRoute>
            } />
            
            {/* Public campaign portal - password protected */}
            <Route path="/campaign/:slug" element={<CampaignPortalPage />} />

            {/* /missions purged — all routes redirect to /hub */}
            <Route path="/missions" element={<Navigate to="/hub" replace />} />
            <Route path="/missions/*" element={<Navigate to="/hub" replace />} />
            <Route path="/clippers" element={<Navigate to="/hub" replace />} />
            <Route path="/clippers/*" element={<Navigate to="/hub" replace />} />
            
            {/* Legacy /crews redirects → /units */}
            <Route path="/crews" element={<Navigate to="/units" replace />} />
            <Route path="/crews/*" element={<CrewsRedirect />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <GlobalAccountPrompt />
          <GlobalGuestConversionModal />
          <GuestNicknameModal />
          <PendingGiftModal />
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
