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
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Hub</span>
          </button>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold" />
            <span className="font-display tracking-widest text-xs text-gold">
              {title || 'CLIPPERS'}
            </span>
          </div>
          <div className="w-12" />
        </div>
      </div>

      {children}

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto grid grid-cols-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-display tracking-wider uppercase">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}