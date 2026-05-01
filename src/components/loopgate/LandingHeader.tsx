import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import loopgateBrand from '@/assets/loopgate-brand.png';

const navLinks = [
  { to: '/rules', label: 'Rules' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/support', label: 'Support' },
];

interface LandingHeaderProps {
  bannerVisible?: boolean;
}

export default function LandingHeader({ bannerVisible = false }: LandingHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-6 sm:px-8 h-[72px]">
        {/* Logo - Official Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={loopgateBrand} 
            alt="LOOPGATE" 
            className="h-8 sm:h-10 w-auto"
          />
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase border border-border/40 rounded px-1.5 py-0.5 leading-none">Beta</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white text-sm font-medium hover:underline hover:decoration-gold hover:decoration-2 hover:underline-offset-4 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
          {/* Login / Sign In — primary CTA */}
          <Link to="/start">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2 bg-white text-black font-bold text-sm tracking-[0.12em] uppercase rounded-full"
              style={{ fontFamily: 'Teko, Inter, sans-serif' }}
            >
              <LogIn className="w-4 h-4" />
              Login
            </motion.div>
          </Link>
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Login Button */}
          <Link to="/start">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-black font-bold text-xs tracking-[0.12em] uppercase rounded-full"
              style={{ fontFamily: 'Teko, Inter, sans-serif' }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </motion.div>
          </Link>

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
                  {/* Login link at top of mobile menu */}
                  <SheetClose asChild>
                    <Link
                      to="/start"
                      className="flex items-center gap-3 px-6 py-4 text-lg font-bold text-foreground bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="tracking-wider uppercase">Login / Sign Up</span>
                    </Link>
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
