import { Suspense } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';
import ClippersLayout from './ClippersLayout';

// Map routes to titles so the persistent header updates without remount
const TITLE_MAP: Record<string, string> = {
  '/missions': 'Missions',
  '/missions/submissions': 'Clips',
  '/missions/accounts': 'Linked',
  '/missions/withdrawals': 'Cashout',
};

export default function ClippersLayoutRoute() {
  const { pathname } = useLocation();
  const title = TITLE_MAP[pathname] || 'Missions';

  return (
    <ClippersLayout title={title}>
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 pt-6 space-y-3">
            <div className="h-20 rounded-[16px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-28 rounded-[20px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-24 rounded-[16px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="h-24 rounded-[16px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </ClippersLayout>
  );
}