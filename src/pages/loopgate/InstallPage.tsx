import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Share, MoreVertical, Plus, Check, Smartphone, Zap, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingHeader from '@/components/loopgate/LandingHeader';
import loopgateBrand from '@/assets/loopgate-brand.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Detect if already installed
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: 'Instant Launch', desc: 'Open Loopgate straight from your home screen' },
    { icon: Smartphone, title: 'Full-Screen', desc: 'No browser bars — immersive app experience' },
    { icon: WifiOff, title: 'Works Offline', desc: 'Browse cached content even without signal' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-foreground/[0.04] border border-border/30 flex items-center justify-center">
            <img src={loopgateBrand} alt="Loopgate" className="h-6 w-auto" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
            Get the App
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Install Loopgate on your phone for the best experience. No app store needed.
          </p>
        </motion.div>

        {/* Already installed */}
        {(installed || isStandalone) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-sm p-6 text-center mb-8"
          >
            <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="font-display text-lg text-foreground">Already Installed</p>
            <p className="text-sm text-muted-foreground mt-1">Loopgate is on your home screen. You're all set.</p>
          </motion.div>
        )}

        {/* Android / Desktop — native install prompt */}
        {!installed && !isStandalone && !isIOS && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              onClick={handleInstall}
              className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 font-display text-lg tracking-wider"
            >
              <Download className="w-5 h-5 mr-3" />
              Install Loopgate
            </Button>
          </motion.div>
        )}

        {/* iOS instructions */}
        {!installed && !isStandalone && isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-foreground/[0.03] border border-border/30 rounded-sm p-6 mb-8"
          >
            <p className="font-display text-base text-foreground mb-5">How to install on iPhone</p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground mt-0.5">In Safari's bottom toolbar</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Add to Home Screen</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Scroll down and tap "Add to Home Screen"</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tap Add</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Loopgate will appear on your home screen</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* No prompt available (desktop without support) */}
        {!installed && !isStandalone && !isIOS && !deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-foreground/[0.03] border border-border/30 rounded-sm p-6 mb-8 text-center"
          >
            <MoreVertical className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Use your browser menu</p>
            <p className="text-xs text-muted-foreground mt-1">
              Look for "Install app" or "Add to Home Screen" in your browser's menu
            </p>
          </motion.div>
        )}

        {/* Features */}
        <div className="space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-4 p-4 bg-foreground/[0.02] border border-border/20 rounded-sm"
            >
              <div className="w-10 h-10 rounded-sm bg-foreground/[0.04] flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
