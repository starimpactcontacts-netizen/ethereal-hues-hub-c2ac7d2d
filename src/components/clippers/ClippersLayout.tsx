import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Film, Link2, Wallet } from 'lucide-react';

interface Props {
  children: ReactNode;
  title?: string;
}

const tabs = [
  { to: '/missions/portal', icon: LayoutGrid, label: 'Missions', n: '01' },
  { to: '/missions/submissions', icon: Film, label: 'Clips', n: '02' },
  { to: '/missions/accounts', icon: Link2, label: 'Linked', n: '03' },
  { to: '/missions/withdrawals', icon: Wallet, label: 'Cashout', n: '04' },
];

export default function ClippersLayout({ children, title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-foreground pb-[96px]" style={{ background: 'hsl(var(--surface-0))' }}>
      {/* Editorial top bar — hairline + wordmark */}
      <header
        className="sticky top-0 z-30 backdrop-blur-2xl"
        style={{
          background: 'hsl(var(--surface-0) / 0.78)',
          borderBottom: '1px solid hsl(0 0% 100% / 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-colors active:opacity-60"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
            <span className="text-[11px] tracking-[0.2em] uppercase font-semibold">Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-display tracking-[0.32em] text-[11px] text-foreground/90">LOOPGATE</span>
            <span className="w-px h-3 bg-white/15" />
            <span className="font-display tracking-[0.32em] text-[11px] text-gold">{title || 'MISSIONS'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-muted-foreground">Live</span>
          </div>
        </div>
        {/* Hairline accent line under header */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </header>

      <main className="relative z-10">{children}</main>

      {/* Editorial bottom nav — numbered, hairline, monospace serials */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl"
        style={{
          background: 'hsl(0 0% 2% / 0.92)',
          borderTop: '1px solid hsl(0 0% 100% / 0.06)',
        }}
      >
        {/* Top hairline accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
        <div className="max-w-6xl mx-auto grid grid-cols-4">
          {tabs.map((t, i) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `group relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all duration-200 active:opacity-70 ${
                  isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                } ${i > 0 ? 'border-l border-white/[0.04]' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-[10px] tracking-widest ${isActive ? 'text-gold/70' : 'text-muted-foreground/60'}`}>
                      {t.n}
                    </span>
                    <t.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span className={`text-[10px] tracking-[0.18em] uppercase font-bold ${isActive ? 'text-gold' : ''}`}>
                    {t.label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-gold"
                      style={{ boxShadow: '0 0 8px hsl(var(--gold) / 0.7)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}