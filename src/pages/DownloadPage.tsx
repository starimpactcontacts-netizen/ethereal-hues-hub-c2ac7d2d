import { ArrowLeft, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO, { pageSEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO {...pageSEO.download} />
      
      <div className="px-4 pt-6 pb-8 max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </Link>

        <h1 className="font-display text-5xl sm:text-6xl mb-4">Download Loopgate</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Get the app and start competing.
        </p>

        {/* Primary — Web App */}
        <div className="mb-8">
          <div className="bg-surface-1 border-2 border-gold/30 p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold bg-gold/10 px-2.5 py-1">Recommended</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Monitor className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-3xl">Web App</h2>
                <p className="text-sm text-muted-foreground">Full experience, any browser, any device</p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No download required — instant access
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Full feature access, same as the app
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Works on iPhone, Android, PC, and Mac
              </li>
            </ul>

            <Link to="/start">
              <Button className="w-full py-6 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg">
                Open Loopgate
              </Button>
            </Link>
          </div>
        </div>

        {/* Secondary — iOS App */}
        <div className="mb-16">
          <div className="bg-surface-1 border border-border p-6 sm:p-8 opacity-80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-surface-2 border border-border flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl">iOS App</h2>
                <p className="text-xs text-muted-foreground">Early access — limited features</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              The native iOS app is in early stage. For the best experience, we recommend using the web app above.
            </p>

            <a 
              href="https://apps.apple.com/app/loopgate/id6757446330" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-5 py-3 bg-surface-2 text-foreground border border-border hover:bg-surface-1 transition-colors w-full justify-center"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] leading-none text-muted-foreground">Download on the</p>
                <p className="text-sm font-semibold leading-tight">App Store</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Requirements */}
        <section className="mb-16">
          <h2 className="font-display text-2xl mb-6">System Requirements</h2>
          <div className="bg-surface-1 border border-border p-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">iOS App</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• iOS 15.0 or later</li>
                  <li>• iPhone, iPad, or iPod touch</li>
                  <li>• 50 MB storage space</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Web App</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Chrome, Safari, Firefox, or Edge</li>
                  <li>• JavaScript enabled</li>
                  <li>• Internet connection</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Android Coming Soon */}
        <section className="text-center py-8 border border-dashed border-border">
          <p className="text-muted-foreground mb-2">Android app coming soon</p>
          <p className="text-sm text-muted-foreground/60">Use the web app in the meantime</p>
        </section>
      </div>
    </div>
  );
}
