import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Film, Link2, Wallet, ScrollText, MoreHorizontal, LogIn, UserPlus, LogOut, Settings, Trophy } from 'lucide-react';
import loopgateLogo from '@/assets/loopgate-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useTempProfile } from '@/hooks/useTempProfile';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  title?: string;
  hideBottomNav?: boolean;
}

const tabs = [
  { to: '/missions/portal', icon: LayoutGrid, label: 'Missions' },
  { to: '/missions/submissions', icon: Film, label: 'Posts' },
  { to: '/missions/accounts', icon: Link2, label: 'Linked' },
  { to: '/missions/withdrawals', icon: Wallet, label: 'Cashout' },
  { to: '/missions/community', icon: Trophy, label: 'Community' },
];

export default function ClippersLayout({ children, title, hideBottomNav = false }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { profile: tempProfile } = useTempProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [dbProfile, setDbProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) { setDbProfile(null); return; }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setDbProfile(data as any); });
    return () => { cancelled = true; };
  }, [user, pathname]);

  const isGuest = !user;
  const displayName =
    dbProfile?.username ||
    (user?.user_metadata?.username as string | undefined) ||
    user?.email?.split('@')[0] ||
    tempProfile?.username ||
    'Guest';
  const avatarUrl = dbProfile?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined) || tempProfile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  // Subroutes go back to /missions, /missions itself goes to /hub
  const isMissionsRoot = pathname === '/missions';
  const backLabel = isMissionsRoot ? 'Hub' : 'Missions';
  const backTo = isMissionsRoot ? '/hub' : '/missions';

  const openAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode);
    setMenuOpen(false);
    setAuthOpen(true);
  };

  return (
    <div
      className="relative h-full min-h-full text-white font-apple flex flex-col overflow-hidden"
      style={{ background: 'hsl(var(--surface-0))' }}
    >
      {/* Top bar — solid translucent (NO backdrop-blur, kills scroll perf) */}
      <header
        data-clippers-header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(0, 0, 0, 0.94)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-0.5 -ml-1.5 text-[#D4A857] active:opacity-50 transition-opacity shrink-0"
          >
            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.5} />
            <span className="text-[15px] font-normal">{backLabel}</span>
          </button>

          <h1 className="font-teko text-[20px] font-bold tracking-[0.08em] uppercase text-white truncate flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
            ) : !isGuest ? (
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold bg-[#D4A857] text-black ring-1 ring-white/20">{initial}</span>
            ) : null}
            <span>{title || 'Missions'}</span>
          </h1>

          {/* Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-50 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="Menu"
            >
              <MoreHorizontal className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-[38px] z-50 w-52 rounded-[14px] overflow-hidden py-1"
                  style={{
                    background: 'rgba(28,28,30,0.98)',
                    border: '0.5px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {isGuest ? (
                    <>
                      <MenuItem icon={UserPlus} label="Create account" onClick={() => openAuth('signup')} />
                      <MenuItem icon={LogIn} label="Sign in" onClick={() => openAuth('login')} />
                    </>
                  ) : (
                    <>
                      <MenuItem
                        icon={Settings}
                        label="Settings"
                        onClick={() => { setMenuOpen(false); navigate('/missions/settings'); }}
                      />
                      <MenuItem
                        icon={LogOut}
                        label="Sign out"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          setMenuOpen(false);
                        }}
                      />
                    </>
                  )}
                  <div className="h-px bg-white/[0.08] my-1" />
                  <MenuItem
                    icon={ScrollText}
                    label="Mission Policy"
                    onClick={() => { setMenuOpen(false); navigate('/missions/policy'); }}
                  />
                  <div className="h-px bg-white/[0.08] my-1" />
                  <div className="px-3 py-2 flex items-center gap-2 opacity-60">
                    <img src={loopgateLogo} alt="" className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#8E8E93]">{title || 'Missions'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: hideBottomNav ? 'env(safe-area-inset-bottom)' : 'calc(88px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      <AccountPromptModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        reason={authMode === 'signup' ? 'Create your account to start earning from missions.' : 'Sign in to continue.'}
      />

      {/* Bottom tab bar — solid (NO backdrop-blur over scrolling content) */}
      {!hideBottomNav && (
      <nav
        data-clippers-bottom-nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: 'rgba(22, 22, 24, 0.98)',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-5 px-1 pt-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-[3px] py-1.5 active:opacity-50 transition-opacity ${
                  isActive ? 'text-[#D4A857]' : 'text-[#8E8E93]'
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
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof LogIn;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-white/[0.06] transition-colors"
    >
      <Icon className="w-[16px] h-[16px] text-white/80" strokeWidth={2.2} />
      <span className="text-[14px] text-white">{label}</span>
    </button>
  );
}
