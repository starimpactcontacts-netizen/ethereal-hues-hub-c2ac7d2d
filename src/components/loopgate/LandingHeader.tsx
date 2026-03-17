import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import loopgateBrand from '@/assets/loopgate-brand.png';

const navLinks = [
  { to: '/start', label: 'Login' },
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
          {/* QOI Score Button - Gold themed */}
          <motion.button
            onClick={scrollToQOI}
            className="group relative px-5 py-2 overflow-hidden rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b, #06b6d4, #a855f7, #ef4444)' , backgroundSize: '300% 300%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner bg */}
            <div className="absolute inset-[1.5px] rounded-full bg-background" />
            <span className="relative text-sm font-bold tracking-[0.2em] text-foreground">
              QOI TEST
            </span>
          </motion.button>
          
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
          {/* Mobile QOI Button - Gold */}
          <motion.button
            onClick={scrollToQOI}
            className="relative px-4 py-1.5 overflow-hidden rounded-full"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b, #06b6d4, #a855f7, #ef4444)', backgroundSize: '300% 300%' }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-[1.5px] rounded-full bg-background" />
            <span className="relative text-xs font-bold tracking-[0.2em] text-foreground">
              QOI TEST
            </span>
          </motion.button>
          
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
                  {/* QOI Link in Mobile Menu - Gold */}
                  <SheetClose asChild>
                    <button
                      onClick={scrollToQOI}
                      className="w-full flex items-center gap-3 px-6 py-4 text-lg font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <span className="font-bold tracking-wider">QOI Score Test</span>
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
