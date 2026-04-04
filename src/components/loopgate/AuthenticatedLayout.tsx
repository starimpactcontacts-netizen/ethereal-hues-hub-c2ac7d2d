import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import BeginnerGuideModal from './BeginnerGuideModal';
import LoopyChat from './LoopyChat';
import TicketFAB from './TicketFAB';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { useGlobalTapSound } from '@/hooks/useGlobalTapSound';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding', '/studio', '/editorium'];
  const hideHeaderPaths = ['/messages', '/studio', '/editorium'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const hideHeader = hideHeaderPaths.some(path => location.pathname.startsWith(path));
  const showNav = !hideNav;

  // Enable global notifications with sounds (unit chat, DMs, tournaments, system alerts)
  useGlobalNotifications();
  useGlobalTapSound();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {!hideNav && !hideHeader && <AppHeader />}
      <main
        className={`flex-1 overflow-y-auto bg-background ${!hideNav && !hideHeader ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}`}
      >
        <Suspense fallback={<LoadingScreen minimal />}>
          <Outlet />
        </Suspense>
      </main>
      {showNav && <BottomNav />}
      
      {/* Loopy AI chatbot */}
      <LoopyChat />
      
      {/* Auto-show beginner guide for new users / official opening */}
      <BeginnerGuideModal autoShow />
    </div>
  );
}