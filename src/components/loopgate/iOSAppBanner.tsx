import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { isNativeApp } from '@/lib/native';

const IOS_APP_URL = 'https://apps.apple.com/app/loopgate/id6757446330';
const BANNER_DISMISSED_KEY = 'loopgate_ios_banner_dismissed';

// Hook to check if banner should be visible (for layout adjustments)
export function useIOSBannerVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isNarrow = window.innerWidth < 640;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const isNative = isNativeApp();

    setIsVisible(isNarrow && isTouchDevice && !dismissed && !isNative);

    const handleResize = () => {
      const narrow = window.innerWidth < 640;
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const wasDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      setIsVisible(narrow && touch && !wasDismissed && !isNative);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isVisible;
}

interface IOSAppBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function IOSAppBanner({ onVisibilityChange }: IOSAppBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if phone (not tablet/laptop) - use narrow width + touch device
    const checkPhone = () => {
      const isNarrow = window.innerWidth < 640; // Phone-sized screens only
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isNarrow && isTouchDevice);
    };

    checkPhone();
    window.addEventListener('resize', checkPhone);

    // Check if banner was dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const isNative = isNativeApp();

    // Show banner only on mobile phones (not native app) and not dismissed
    if (!dismissed && !isNative) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('resize', checkPhone);
  }, []);

  const shouldShow = isVisible && isMobile;

  useEffect(() => {
    onVisibilityChange?.(shouldShow);
  }, [shouldShow, onVisibilityChange]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  const handleOpen = () => {
    window.open(IOS_APP_URL, '_blank');
  };

  // Only show on mobile web
  if (!shouldShow) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-[60] bg-surface-1 border-b border-border px-3 py-2 flex items-center gap-3 h-14">
      {/* Dismiss button */}
      <button 
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      {/* App icon */}
      <div className="w-10 h-10 rounded-lg bg-black border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
        <span className="font-display text-gold text-xs">LG</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm text-foreground leading-tight">Loopgate</p>
        <p className="text-xs text-muted-foreground leading-tight">Open in the Loopgate app</p>
      </div>

      {/* Open button */}
      <button
        onClick={handleOpen}
        className="bg-gold text-black font-display text-sm px-4 py-1.5 rounded-full hover:bg-gold/90 transition-colors flex-shrink-0"
      >
        OPEN
      </button>
    </div>
  );
}
