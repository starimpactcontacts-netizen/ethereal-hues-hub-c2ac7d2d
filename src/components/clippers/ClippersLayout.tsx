import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Film, Link2, Wallet } from 'lucide-react';
import loopgateLogo from '@/assets/loopgate-logo.png';

interface Props {
  children: ReactNode;
  title?: string;
}

const tabs = [
  { to: '/missions/portal', icon: LayoutGrid, label: 'Missions' },
  { to: '/missions/submissions', icon: Film, label: 'Clips' },
  { to: '/missions/accounts', icon: Link2, label: 'Linked' },
  { to: '/missions/withdrawals', icon: Wallet, label: 'Cashout' },
];

export default function ClippersLayout({ children, title }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="relative h-full min-h-full text-white font-apple flex flex-col overflow-hidden"
      style={{ background: 'hsl(var(--surface-0))' }}
    >
      {/* Top bar — solid translucent (NO backdrop-blur, kills scroll perf) */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(0, 0, 0, 0.94)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-11 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-0.5 -ml-1.5 text-[#0A84FF] active:opacity-50 transition-opacity"
          >
            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.5} />
            <span className="text-[17px] font-normal">Hub</span>
          </button>
          <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-white">
            {title || 'Missions'}
          </h1>
          <div className="w-[60px] flex items-center justify-end">
            <img
              src={loopgateLogo}
              alt="Loopgate"
              className="h-5 w-5 object-contain opacity-90"
              draggable={false}
            />
          </div>
        </div>
      </header>

      <main
        className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      {/* Bottom tab bar — solid (NO backdrop-blur over scrolling content) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: 'rgba(22, 22, 24, 0.98)',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-4 px-1 pt-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-[3px] py-1.5 active:opacity-50 transition-opacity ${
                  isActive ? 'text-[#0A84FF]' : 'text-[#8E8E93]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon
                    className="w-[26px] h-[26px]"
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className="text-[10px] font-medium tracking-[-0.01em] leading-none">
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
