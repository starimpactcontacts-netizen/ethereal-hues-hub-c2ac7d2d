import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, HelpCircle, FileText, Home, Trophy, Shield, Search, Calendar, Building2, ShoppingBag, BookOpen, Gavel, Crown, Clapperboard, ChevronRight, Swords } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import NotificationCenter from './NotificationCenter';
import HeaderMusicPlayer from './HeaderMusicPlayer';
import MessagesHeaderIcon from './MessagesHeaderIcon';
import loopgateBrand from '@/assets/loopgate-brand.png';

type NavItem = { to: string; icon: typeof Home; label: string; highlight?: boolean; red?: boolean };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: 'Play',
    items: [
      { to: '/hub', icon: Home, label: 'Hub' },
      { to: '/arena?tab=my', icon: Swords, label: 'My Arena', red: true },
      { to: '/league', icon: Crown, label: 'League' },
    ],
  },
  {
    title: 'Discover',
    items: [
      { to: '/rankings', icon: Trophy, label: 'Rankings' },
      { to: '/class', icon: Shield, label: 'Class' },
      { to: '/index', icon: Search, label: 'Index' },
      { to: '/editorium', icon: BookOpen, label: 'Editorium' },
    ],
  },
  {
    title: 'You',
    items: [
      { to: '/shop', icon: ShoppingBag, label: 'Shop', highlight: true },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
  },
  {
    title: 'Help',
    items: [
      { to: '/support', icon: HelpCircle, label: 'Support' },
      { to: '/rules', icon: FileText, label: 'Rules' },
    ],
  },
];

const SIM_WHITELIST = ['guestvipe'];

export default function AppHeader() {
  const { user, profile, signOut, isAdmin, hasOpsAccess } = useAuth();
  const { roles, isJudge, isDev } = useUserRoles(user?.id);
  const showSimLink = hasOpsAccess || SIM_WHITELIST.includes(profile?.username ?? '');
  const [userRank, setUserRank] = useState<number | string>('—');
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    supabase
      .rpc('get_user_global_rank', { p_user_id: profile.id })
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const r = (data as { rank: number | null }).rank;
        if (typeof r === 'number') setUserRank(r);
      });
    return () => { cancelled = true; };
  }, [profile?.id]);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const isEnterprise = roles.includes('enterprise');

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    navigate('/login');
  };

  return (
    <header
      data-mobile-topbar
      className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/30"
      style={{
        minHeight: 'var(--app-header-height, calc(env(safe-area-inset-top, 0px) + 44px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: 'hsl(var(--app-safe-fill, var(--background)))',
      }}
    >
      {/* Subtle bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
      
      <div className="flex items-center justify-between px-4" style={{ height: 'var(--app-header-bar-height, 44px)' }}>
        {/* Left side: Logo + Music Player */}
        <div className="flex items-center gap-3">
          <Link to="/hub" className="flex items-center gap-1.5 group">
            <img src={loopgateBrand} alt="LOOPGATE" className="h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="text-[8px] font-bold tracking-widest text-muted-foreground/50 uppercase border border-border/30 rounded px-1 py-0.5 leading-none">Beta</span>
          </Link>
          <div className="w-[1px] h-5 bg-border/40" />
          <HeaderMusicPlayer />
        </div>

        {/* Right side: Messages + Notifications + Menu */}
        <div className="flex items-center gap-0.5">
          <MessagesHeaderIcon />
          <NotificationCenter />
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] max-w-[360px] p-0 border-l border-border/30 bg-[#0a0a0a]/95 backdrop-blur-2xl"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {/* Ambient gradient wash */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-24 w-72 h-72 rounded-full bg-gold/[0.06] blur-3xl" />
                <div className="absolute bottom-0 -left-24 w-64 h-64 rounded-full bg-blue-500/[0.04] blur-3xl" />
              </div>

              <div className="relative flex flex-col h-full">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <span className="font-display text-[22px] tracking-[0.02em] text-foreground">Menu</span>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06]">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Profile card */}
                {profile && (
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="group mx-4 mb-3 flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
                    >
                      <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-zinc-700 to-zinc-900 text-white font-display text-base">
                          {profile.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg leading-tight text-foreground truncate">{profile.username}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/20">
                            {profile.league}
                          </span>
                          <span className="text-[10px] text-muted-foreground tracking-wide">Rank #{userRank}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                    </Link>
                  </SheetClose>
                )}

                {/* Enter Arena hero CTA */}
                <SheetClose asChild>
                  <Link
                    to="/arena"
                    className="relative mx-4 mb-3 flex items-center justify-center gap-2 h-12 rounded-2xl overflow-hidden group"
                    style={{ background: 'linear-gradient(180deg, #E8C84A 0%, #D4A843 50%, #C49A2C 100%)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25), 0 6px 20px rgba(212,168,67,0.25)' }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                    <Calendar className="relative w-4 h-4 text-black" />
                    <span className="relative font-display text-sm uppercase tracking-[0.18em] text-black font-bold">Enter Arena</span>
                  </Link>
                </SheetClose>

                {/* Search */}
                <div className="px-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Search"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="pl-10 h-10 text-sm rounded-xl bg-white/[0.04] border-white/[0.06] focus-visible:ring-1 focus-visible:ring-foreground/20 placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                {/* Navigation — sectioned */}
                <nav className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-hide">
                  {showSimLink && (!menuSearch.trim() || 'battle sim'.includes(menuSearch.toLowerCase())) && (
                    <div className="mt-3 first:mt-1">
                      <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/50">Sandbox</p>
                      <div className="space-y-0.5">
                        <SheetClose asChild>
                          <Link
                            to="/ops-panel/a7c92ff31b/sim"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              location.pathname === '/ops-panel/a7c92ff31b/sim'
                                ? 'bg-white/[0.06] text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                            }`}
                          >
                            <Swords className="w-[18px] h-[18px] text-yellow-400" />
                            <span className="font-display text-[15px] tracking-tight text-yellow-400">Battle Sim</span>
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                  {navSections.map((section) => {
                    const filtered = section.items.filter(it =>
                      !menuSearch.trim() || it.label.toLowerCase().includes(menuSearch.toLowerCase())
                    );
                    if (!filtered.length) return null;
                    return (
                      <div key={section.title} className="mt-3 first:mt-1">
                        <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/50">
                          {section.title}
                        </p>
                        <div className="space-y-0.5">
                          {filtered.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to;
                            return (
                              <SheetClose asChild key={item.to}>
                                <Link
                                  to={item.to}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    isActive
                                      ? 'bg-white/[0.06] text-foreground'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                                  }`}
                                >
                                  <Icon className={`w-[18px] h-[18px] ${item.highlight ? 'text-gold' : item.red ? 'text-red-500' : ''}`} />
                                  <span className={`font-display text-[15px] tracking-tight ${item.highlight ? 'text-gold' : item.red ? 'text-red-500' : ''}`}>{item.label}</span>
                                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Judges Place */}
                  <div className="mt-4 mx-2">
                    <SheetClose asChild>
                      <Link
                        to="/judges"
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          <Gavel className="w-[18px] h-[18px] text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-foreground">Judges Place</p>
                          <p className="text-[10px] text-muted-foreground truncate">Elite feedback on your edits</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                      </Link>
                    </SheetClose>
                  </div>

                  {/* Privileged sections */}
                  {(isJudge || isDev || isAdmin || isEnterprise || isAdmin) && (
                    <div className="mt-4">
                      <p className="px-3 mb-1 text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground/50">Access</p>
                      <div className="space-y-0.5">
                        {(isJudge || isDev || isAdmin) && (
                          <SheetClose asChild>
                            <Link to="/judge-panel" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/10 transition-colors">
                              <Shield className="w-[18px] h-[18px]" />
                              <span className="font-display text-[15px] tracking-tight">Judge Panel</span>
                            </Link>
                          </SheetClose>
                        )}
                        {isEnterprise && (
                          <SheetClose asChild>
                            <Link to="/enterprise-dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/10 transition-colors">
                              <Building2 className="w-[18px] h-[18px]" />
                              <span className="font-display text-[15px] tracking-tight">Enterprise Portal</span>
                            </Link>
                          </SheetClose>
                        )}
                        {isAdmin && (
                          <SheetClose asChild>
                            <Link to="/ops-panel/a7c92ff31b" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <Shield className="w-[18px] h-[18px]" />
                              <span className="font-display text-[15px] tracking-tight">Admin Panel</span>
                            </Link>
                          </SheetClose>
                        )}
                      </div>
                    </div>
                  )}
                </nav>

                {/* Sign Out */}
                <div className="px-4 pt-3 pb-4 border-t border-white/[0.06]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/30 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">Sign Out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
