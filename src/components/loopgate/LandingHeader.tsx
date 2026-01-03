import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import loopgateLogo from '@/assets/loopgate-logo-white.png';

const navLinks = [
  { to: '/auth', label: 'Login' },
  { to: '/rules', label: 'Rules' },
  { to: '/support', label: 'Support' },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-6 sm:px-8 h-[72px]">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={loopgateLogo} alt="LOOPGATE" className="h-7 sm:h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
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
        <div className="md:hidden">
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
