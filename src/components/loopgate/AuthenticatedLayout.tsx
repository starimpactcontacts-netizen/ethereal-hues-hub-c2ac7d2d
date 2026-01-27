import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import BeginnerGuideModal from './BeginnerGuideModal';
import { useCrewChatNotifications } from '@/hooks/useCrewChatNotifications';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding'];
  const hideHeaderPaths = ['/messages'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const hideHeader = hideHeaderPaths.some(path => location.pathname.startsWith(path));
  const showNav = !hideNav;

  // Enable global crew chat notifications with sound
  useCrewChatNotifications();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {!hideNav && !hideHeader && <AppHeader />}
      <main className={`flex-1 overflow-y-auto ${!hideNav && !hideHeader ? 'pb-14' : ''}`}>
        <Suspense fallback={<LoadingScreen minimal />}>
          <Outlet />
        </Suspense>
      </main>
      {showNav && <BottomNav />}
      
      {/* Auto-show beginner guide for new users / official opening */}
      <BeginnerGuideModal autoShow />
    </div>
  );
}