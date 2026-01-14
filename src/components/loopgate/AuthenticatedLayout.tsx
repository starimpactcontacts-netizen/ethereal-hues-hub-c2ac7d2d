import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import BeginnerGuideModal from './BeginnerGuideModal';
import IOSAppBanner from './iOSAppBanner';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding'];
  const showNav = !hideNavPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <IOSAppBanner />
      <AppHeader />
      <main className="flex-1 pb-14">
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