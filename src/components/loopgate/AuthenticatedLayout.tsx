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
import { useRecoverBodyScroll } from '@/hooks/useRecoverBodyScroll';
import { getPageSafeFill } from '@/lib/pageSafeFill';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding', '/studio', '/editorium', '/clippers', '/missions'];
  const hideHeaderPaths = ['/messages', '/studio', '/editorium', '/judge-panel', '/clippers', '/missions'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const hideHeader = hideHeaderPaths.some(path => location.pathname.startsWith(path));
  const showNav = !hideNav;
  const safeFill = getPageSafeFill(location.pathname);
  const shellStyle = {
    '--app-safe-fill': safeFill,
    '--app-header-bar-height': '44px',
    '--app-header-height': 'calc(env(safe-area-inset-top, 0px) + var(--app-header-bar-height))',
    '--app-bottom-nav-bar-height': '49px',
    '--app-bottom-nav-height': 'calc(env(safe-area-inset-bottom, 0px) + var(--app-bottom-nav-bar-height))',
    backgroundColor: 'hsl(var(--app-safe-fill))',
  } as CSSProperties;

  // Enable global notifications with sounds (unit chat, DMs, tournaments, system alerts)
  useGlobalNotifications();
  useGlobalTapSound();
  useRecoverBodyScroll();

  return (
    <div className="fixed inset-0 text-foreground flex flex-col overflow-hidden" style={shellStyle}>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60]" style={{ height: 'env(safe-area-inset-top, 0px)', backgroundColor: 'hsl(var(--app-safe-fill))' }} />
      {!hideNav && !hideHeader && <AppHeader />}
      <main
        className="flex-1 min-h-0 overflow-y-auto overscroll-none"
        style={{
          backgroundColor: 'hsl(var(--app-safe-fill))',
          paddingBottom: showNav ? 'var(--app-bottom-nav-height)' : 'env(safe-area-inset-bottom, 0px)',
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
