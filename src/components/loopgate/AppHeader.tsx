import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, HelpCircle, FileText, Home, Trophy, Shield, Search, Calendar, Building2, ShoppingBag, BookOpen, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useRealRankings } from '@/hooks/useRealData';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import NotificationCenter from './NotificationCenter';
import BeginnerGuideModal from './BeginnerGuideModal';
import InviteModal from './InviteModal';

const menuItems = [
  { to: '/hub', icon: Home, label: 'Hub' },
  { to: '/hub', icon: Calendar, label: 'Events', primary: true },
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
  const { user, profile, signOut, hasOpsAccess } = useAuth();
  const { roles } = useUserRoles(user?.id);
  const { rankings } = useRealRankings();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const isEnterprise = roles.includes('enterprise');

  // Get user's real rank from rankings
  const userRanking = profile ? rankings.find(r => r.id === profile.id) : null;
  const userRank = userRanking?.rank || (rankings.length > 0 ? rankings.length + 1 : '—');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link to="/hub" className="font-display text-xl text-gold">
          LOOPGATE
        </Link>

        {/* Right side: Invite + Notifications + Menu */}
        <div className="flex items-center gap-1">
          {/* Invite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gold hover:bg-gold/10"
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
                  <span className="font-display text-xl text-gold">MENU</span>
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

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4">
                {menuItems.map((item, index) => {
                  if ('divider' in item && item.divider) {
                    return <div key={index} className="my-2 border-t border-border" />;
                  }
                  const Icon = item.icon!;
                  const isActive = location.pathname === item.to;
                  const isHighlight = 'highlight' in item && item.highlight;
                  const isPrimary = 'primary' in item && item.primary;
                  
                  // Primary action button (Events)
                  if (isPrimary) {
                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to!}
                          className="mx-4 my-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gold via-amber-400 to-gold text-black font-bold rounded-sm transition-all hover:shadow-lg hover:shadow-gold/30 animate-pulse-slow"
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

                {hasOpsAccess && (
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
