import { Outlet, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useState, type CSSProperties } from 'react';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import LoadingScreen from './LoadingScreen';
import TicketFAB from './TicketFAB';
import LobbyMusicPlayer from './LobbyMusicPlayer';
import GlobalWinCelebration from './GlobalWinCelebration';
import CompCancelledModal from './CompCancelledModal';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';
import { useGlobalTapSound } from '@/hooks/useGlobalTapSound';
import { useRecoverBodyScroll } from '@/hooks/useRecoverBodyScroll';
import { getPageSafeFill } from '@/lib/pageSafeFill';

export default function AuthenticatedLayout() {
  const location = useLocation();
  const hideNavPaths = ['/admin', '/onboarding', '/editorium', '/missions', '/shop', '/competition/', '/fight/', '/collabs', '/collab/', '/duo-battle/', '/event/', '/units/'];
  const hideHeaderPaths = ['/messages', '/editorium', '/judge-panel', '/judges', '/missions', '/shop', '/competition/', '/fight/', '/collabs', '/collab/', '/duo-battle/', '/event/', '/units/'];
  const hideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  const hideHeader = hideHeaderPaths.some(path => location.pathname.startsWith(path));
  const [composeOpen, setComposeOpen] = useState(false);
  const showNav = !hideNav && !composeOpen;
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

  useEffect(() => {
    const syncComposeState = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : undefined;
      setComposeOpen(detail === true || document.documentElement.dataset.composeOpen === 'true');
    };
    syncComposeState();
    window.addEventListener('loopgate-compose-open', syncComposeState);
    return () => window.removeEventListener('loopgate-compose-open', syncComposeState);
  }, []);

  return (
    <div className="fixed inset-0 text-foreground flex flex-col overflow-hidden" style={shellStyle}>
      {!composeOpen && <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60]" style={{ height: 'env(safe-area-inset-top, 0px)', backgroundColor: 'hsl(var(--app-safe-fill))' }} />}
      {!composeOpen && !hideNav && !hideHeader && <AppHeader />}
      <main
        className="flex-1 min-h-0 overflow-y-auto overscroll-none"
        style={{
          backgroundColor: 'hsl(var(--app-safe-fill))',
          paddingBottom: showNav ? 'var(--app-bottom-nav-height)' : composeOpen ? 0 : 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <Suspense fallback={<LoadingScreen minimal />}>
          <Outlet />
        </Suspense>
      </main>
      {showNav && <BottomNav />}

      {!composeOpen && <TicketFAB />}
      {!composeOpen && <LobbyMusicPlayer />}
      <GlobalWinCelebration />
      <CompCancelledModal />
    </div>
  );
}
