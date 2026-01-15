import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Target } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navLinks = [
  { to: '/auth', label: 'Login' },
  { to: '/rules', label: 'Rules' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/support', label: 'Support' },
];

interface LandingHeaderProps {
  bannerVisible?: boolean;
}

export default function LandingHeader({ bannerVisible = false }: LandingHeaderProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  const scrollToQOI = () => {
    // If on landing page, scroll to section
    if (location.pathname === '/') {
      const element = document.getElementById('qoi-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    // Otherwise navigate to /gqt
    window.location.href = '/gqt';
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-6 sm:px-8 h-[72px]">
        {/* Logo - Text-based, tall condensed bold */}
        <Link to="/" className="flex items-center">
          <span 
            className="text-white text-3xl sm:text-4xl font-display font-bold tracking-[-0.03em] leading-none"
            style={{ fontStretch: 'condensed' }}
          >
            LOOPGATE
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {/* QOI Score Button - Eye-catching */}
          <button
            onClick={scrollToQOI}
            className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 border border-emerald-500/50 hover:border-emerald-400 transition-all duration-300"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/20 to-emerald-500/10 blur-sm group-hover:blur-md transition-all opacity-60" />
            
            {/* Animated pulse ring */}
            <div className="absolute inset-0 border border-emerald-400/50 animate-ping opacity-20" />
            
            <Target className="relative w-4 h-4 text-emerald-400" />
            <span className="relative text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400">
              QOI
            </span>
          </button>
          
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white text-sm font-medium hover:underline hover:decoration-gold hover:decoration-2 hover:underline-offset-4 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile QOI Button */}
          <button
            onClick={scrollToQOI}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 border border-emerald-500/50"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400">
              QOI
            </span>
          </button>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-border p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <span className="font-display text-2xl text-white tracking-[-0.03em]">MENU</span>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-6">
                  {/* QOI Link in Mobile Menu */}
                  <SheetClose asChild>
                    <button
                      onClick={scrollToQOI}
                      className="w-full flex items-center gap-3 px-6 py-4 text-lg font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Target className="w-5 h-5" />
                      <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent font-bold">
                        QOI Score Test
                      </span>
                    </button>
                  </SheetClose>
                  
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center px-6 py-4 text-white text-lg font-medium hover:bg-gold/10 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
