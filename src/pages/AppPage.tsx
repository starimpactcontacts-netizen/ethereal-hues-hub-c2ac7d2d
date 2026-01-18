import { ArrowRight, Smartphone, Trophy, Users, Zap, Star, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function AppPage() {
  const features = [
    {
      icon: Trophy,
      title: "Competitive Events",
      description: "Join weekly editing competitions against top creators worldwide"
    },
    {
      icon: Users,
      title: "Global Rankings",
      description: "Climb the leaderboard and prove you're among the best editors"
    },
    {
      icon: Zap,
      title: "Real-Time Tracking",
      description: "Track your progress, XP, and league status in real-time"
    },
    {
      icon: Star,
      title: "Earn Recognition",
      description: "Build your reputation and get discovered by brands and creators"
    },
    {
      icon: Shield,
      title: "Fair Competition",
      description: "Professional judging system ensures every submission is evaluated fairly"
    },
    {
      icon: Globe,
      title: "Cross-Platform",
      description: "Submit edits from TikTok, Instagram, or YouTube"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Loopgate App - Compete in Video Editing Events"
        description="Download the Loopgate app to compete in video editing events, track your global ranking, and connect with editors worldwide. Available on iOS and web."
        canonical="https://loopgate.io/app"
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="relative px-4 pt-12 pb-16 max-w-6xl mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm">
            ← Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl sm:text-7xl mb-6 leading-tight">
              The Loopgate<br />
              <span className="text-gold">App</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your gateway to competitive video editing. Track rankings, join events, and prove you're the best.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://apps.apple.com/app/loopgate/id6757446330" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-xs leading-none opacity-80">Download on the</p>
                  <p className="text-lg font-semibold leading-tight">App Store</p>
                </div>
              </a>
              
              <Link to="/start">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg">
                  Open Web App
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl text-center mb-12">
          Everything You Need to <span className="text-gold">Compete</span>
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-surface-1 border border-border p-6 hover:border-gold/30 transition-colors"
            >
              <feature.icon className="w-10 h-10 text-gold mb-4" />
              <h3 className="font-display text-xl mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section className="px-4 py-16 bg-surface-1 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl mb-6">
            Available Everywhere
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access Loopgate on your iPhone, iPad, or any web browser. Your progress syncs across all devices.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-background border border-border p-8 text-center">
              <Smartphone className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2">iOS App</h3>
              <p className="text-sm text-muted-foreground mb-4">Native experience with push notifications</p>
              <a 
                href="https://apps.apple.com/app/loopgate/id6757446330" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gold hover:underline text-sm"
              >
                Download Now →
              </a>
            </div>
            
            <div className="bg-background border border-border p-8 text-center">
              <Globe className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2">Web App</h3>
              <p className="text-sm text-muted-foreground mb-4">Works on any browser, no download needed</p>
              <Link to="/auth" className="text-gold hover:underline text-sm">
                Open Web App →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl mb-4">
          Ready to Compete?
        </h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of editors already competing on Loopgate.
        </p>
        <Link to="/auth">
          <Button size="lg" className="h-14 px-10 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-lg">
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/support" className="hover:text-foreground">Support</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
