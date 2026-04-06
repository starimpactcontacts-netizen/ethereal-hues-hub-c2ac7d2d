import { Outlet, useLocation } from 'react-router-dom';
import { Suspense, type CSSProperties } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import BeginnerGuideModal from './BeginnerGuideModal';
import LoopyChat from './LoopyChat';
import TicketFAB from './TicketFAB';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { useGlobalTapSound } from '@/hooks/useGlobalTapSound';
import { getPageSafeFill } from '@/lib/pageSafeFill';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding', '/studio', '/editorium'];
  const hideHeaderPaths = ['/messages', '/studio', '/editorium'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const hideHeader = hideHeaderPaths.some(path => location.pathname.startsWith(path));
  const showNav = !hideNav;
  const safeFill = getPageSafeFill(location.pathname);
  const shellStyle = {
    '--app-safe-fill': safeFill,
    backgroundColor: 'hsl(var(--app-safe-fill))',
  } as CSSProperties;

  // Enable global notifications with sounds (unit chat, DMs, tournaments, system alerts)
  useGlobalNotifications();
  useGlobalTapSound();

  return (
    <div className="fixed inset-0 text-foreground flex flex-col overflow-hidden" style={shellStyle}>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40" style={{ height: 'env(safe-area-inset-top, 0px)', backgroundColor: 'hsl(var(--app-safe-fill))' }} />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-40" style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 320px)', backgroundColor: 'hsl(var(--app-safe-fill))' }} />
      {!hideNav && !hideHeader && <AppHeader />}
      <main
        className="flex-1 min-h-0 overflow-y-auto overscroll-none"
        style={{
          backgroundColor: 'hsl(var(--app-safe-fill))',
          paddingBottom: !hideNav && !hideHeader ? 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' : undefined,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={<LoadingScreen minimal />}>
          <Outlet />
        </Suspense>
      </main>
      {showNav && <BottomNav />}

      <LoopyChat />
      <TicketFAB />
      <BeginnerGuideModal autoShow />
    </div>
  );
}
