import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import BeginnerGuideModal from './BeginnerGuideModal';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const showNav = !hideNav;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {!hideNav && <AppHeader />}
      <main className={`flex-1 overflow-y-auto ${!hideNav ? 'pb-14' : ''}`}>
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