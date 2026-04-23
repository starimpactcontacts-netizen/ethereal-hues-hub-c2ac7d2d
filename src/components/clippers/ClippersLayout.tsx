import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, LayoutGrid, Film, Link2, Wallet } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
}

const tabs = [
  { to: '/clippers/portal', icon: LayoutGrid, label: 'Campaigns' },
  { to: '/clippers/submissions', icon: Film, label: 'Clips' },
  { to: '/clippers/accounts', icon: Link2, label: 'Linked' },
  { to: '/clippers/withdrawals', icon: Wallet, label: 'Cashout' },
];

export default function ClippersLayout({ children, title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-foreground pb-28 overflow-hidden" style={{ background: 'hsl(var(--surface-0))' }}>
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(60% 40% at 50% -10%, hsl(var(--gold) / 0.10), transparent 70%), radial-gradient(40% 30% at 100% 100%, hsl(var(--gold) / 0.05), transparent 70%)',
        }}
      />

      {/* Top bar — glassy iPhone 17 style */}
      <div className="sticky top-0 z-30 backdrop-blur-2xl border-b border-white/5" style={{ background: 'hsl(var(--surface-0) / 0.72)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">Hub</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/20 bg-gold/5">
            <Scissors className="w-3.5 h-3.5 text-gold" />
            <span className="font-display tracking-[0.2em] text-[11px] text-gold">
              {title || 'CLIPPERS'}
            </span>
          </div>
          <div className="w-[68px]" />
        </div>
      </div>

      <div className="relative z-10">{children}</div>

      {/* Floating glass bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl border-t border-white/5"
        style={{ background: 'hsl(var(--surface-0) / 0.85)' }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-4 px-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-300 active:scale-95 ${
                  isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-gold"
                      style={{ boxShadow: '0 0 12px hsl(var(--gold) / 0.6)' }}
                    />
                  )}
                  <t.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-semibold tracking-wider uppercase">{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}