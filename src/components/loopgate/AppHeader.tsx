import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, HelpCircle, FileText, Home, Trophy, Shield, Search, Calendar, Building2, ShoppingBag, BookOpen, Send, Gavel, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealRankings } from '@/hooks/useRealData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import NotificationCenter from './NotificationCenter';
import BeginnerGuideModal from './BeginnerGuideModal';
import InviteModal from './InviteModal';
import MessagesHeaderIcon from './MessagesHeaderIcon';
import loopgateBrand from '@/assets/loopgate-brand.png';

const menuItems = [
  { to: '/hub', icon: Home, label: 'Hub' },
  { to: '/arena', icon: Calendar, label: 'Arena', primary: true },
  { to: '/league', icon: Crown, label: 'League' },
  { to: '/rankings', icon: Trophy, label: 'Rankings' },
  { to: '/class', icon: Shield, label: 'Class' },
  { to: '/index', icon: Search, label: 'Index' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop', highlight: true },
  { to: '/profile', icon: User, label: 'Profile' },
  { divider: true },
  { to: '/support', icon: HelpCircle, label: 'Support' },
  { to: '/rules', icon: FileText, label: 'Rules' },
];

export default function AppHeader() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { roles, isJudge, isDev } = useUserRoles(user?.id);
  const { rankings } = useRealRankings();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  const isEnterprise = roles.includes('enterprise');

  // Get user's real rank from rankings
  const userRanking = profile ? rankings.find(r => r.id === profile.id) : null;
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo - Official brand wordmark */}
        <Link to="/hub">
          <img src={loopgateBrand} alt="LOOPGATE" className="h-6 w-auto" />
        </Link>

        {/* Right side: Messages + Invite + Notifications + Menu */}
        <div className="flex items-center gap-1">
          {/* Messages */}
          <MessagesHeaderIcon />
          
          {/* Invite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground hover:text-gold hover:bg-gold/10"
            onClick={() => setInviteModalOpen(true)}
          >
            <Send className="h-5 w-5" />
          </Button>
          
          <NotificationCenter />
          
          <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
          
          {/* Menu Button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-surface-0 border-border p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl text-foreground">MENU</span>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                {profile && (
                  <div className="mt-4 p-3 bg-surface-1 border border-border">
                    <p className="font-display text-lg">{profile.username}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {profile.league} League · Rank #{userRank}
                    </p>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pages..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-surface-0 border-border"
                  />
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-2">
                {menuItems.filter(item => {
                  if (!menuSearch.trim()) return true;
                  if ('divider' in item && item.divider) return false;
                  return item.label?.toLowerCase().includes(menuSearch.toLowerCase());
                }).map((item, index) => {
                  if ('divider' in item && item.divider) {
                    return <div key={index} className="my-2 border-t border-border" />;
                  }
                  const Icon = item.icon!;
                  const isActive = location.pathname === item.to;
                  const isHighlight = 'highlight' in item && item.highlight;
                  const isPrimary = 'primary' in item && item.primary;
                  
                  // Primary action button (Events/Arena)
                  if (isPrimary) {
                    return (
                      <SheetClose asChild key={`primary-${item.label}`}>
                        <Link
                          to={item.to!}
                          className="mx-4 my-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gold via-amber-400 to-gold text-black font-bold rounded-sm transition-all hover:shadow-lg hover:shadow-gold/30"
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-display text-sm uppercase tracking-wider">Enter Arena</span>
                        </Link>
                      </SheetClose>
                    );
                  }
                  
                  return (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to!}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          isActive 
                            ? 'bg-gold/10 text-gold border-l-2 border-gold' 
                            : isHighlight
                              ? 'text-gold hover:bg-gold/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-display text-sm">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}

                {/* How It Works Guide */}
                <div className="px-4 py-3">
                  <BeginnerGuideModal
                    trigger={
                      <button className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors w-full">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-display text-sm">How It Works</span>
                      </button>
                    }
                  />
                </div>

                {/* QOI Judges - Premium Feature Link */}
                <div className="my-3 mx-4">
                  <SheetClose asChild>
                    <Link
                      to="/judges"
                      className="group relative flex items-center gap-3 p-3 rounded-lg bg-red-950/20 border border-red-800/30 hover:border-red-700/50 transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-700/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-sm bg-red-950/50 border border-red-800/40">
                        <Gavel className="w-5 h-5 text-red-400" />
                      </div>
                      
                      <div className="relative flex-1">
                        <p className="font-display text-sm text-white">The Bureau</p>
                        <p className="text-[10px] text-muted-foreground">Get elite feedback on your edits</p>
                      </div>
                      
                      <div className="relative text-zinc-500 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  </SheetClose>
                </div>

                {/* Judge Panel - judges, devs, and admins */}
                {(isJudge || isDev || isAdmin) && (
                  <SheetClose asChild>
                    <Link
                      to="/judge-panel"
                      className="flex items-center gap-3 px-4 py-3 text-gold hover:bg-gold/10 transition-colors"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-display text-sm">Judge Panel</span>
                    </Link>
                  </SheetClose>
                )}

                {isEnterprise && (
                  <>
                    <div className="my-2 border-t border-border" />
                    <SheetClose asChild>
                      <Link
                        to="/enterprise-dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-gold hover:bg-gold/10 transition-colors"
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="font-display text-sm">Enterprise Portal</span>
                      </Link>
                    </SheetClose>
                  </>
                )}

                {/* Admin Panel - admins ONLY (not judges) */}
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-border" />
                    <SheetClose asChild>
                      <Link
                        to="/ops-panel/a7c92ff31b"
                        className="flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="font-display text-sm">Admin Panel</span>
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>

              {/* Sign Out */}
              <div className="border-t border-border p-4">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
