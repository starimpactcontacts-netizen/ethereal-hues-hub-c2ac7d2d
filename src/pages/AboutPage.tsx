import { ArrowLeft, Trophy, Users, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO 
        title="About"
        description="Loopgate is the global competitive infrastructure for video editors. Learn about our mission to turn editing into a competitive league."
        canonical="https://loopgate.io/about"
      />
      
      <div className="px-4 pt-6 pb-8 max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </Link>

        <h1 className="font-display text-5xl sm:text-6xl mb-4">About Loopgate</h1>
        <p className="text-xl text-muted-foreground mb-12">
          The global competitive infrastructure for video editors.
        </p>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="font-display text-3xl mb-6 text-gold">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Loopgate exists to transform video editing from a solitary craft into a competitive league. 
            We believe the world's best editors deserve recognition, rankings, and the opportunity to 
            prove themselves on a global stage.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Just as esports created a competitive framework for gaming, Loopgate creates the 
            infrastructure for competitive editing — complete with live events, real-time rankings, 
            and qualification pathways to professional opportunities.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="font-display text-3xl mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-surface-1 border border-border p-6">
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl mb-2">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Sign up and connect your social platforms. Your editing work becomes your competitive record.
              </p>
            </div>
            
            <div className="bg-surface-1 border border-border p-6">
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl mb-2">Compete in Events</h3>
              <p className="text-muted-foreground">
                Enter live competitions. Submit your edits and get scored by judges on Quality, Originality, and Impact.
              </p>
            </div>
            
            <div className="bg-surface-1 border border-border p-6">
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl mb-2">Climb the Rankings</h3>
              <p className="text-muted-foreground">
                Every competition affects your Global Index Score. Rise through Open, Pro, and Elite leagues.
              </p>
            </div>
            
            <div className="bg-surface-1 border border-border p-6">
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display text-xl mb-2">Get Discovered</h3>
              <p className="text-muted-foreground">
                Top-ranked editors get noticed by studios, brands, and creators looking for verified talent.
              </p>
            </div>
          </div>
        </section>

        {/* The Index */}
        <section className="mb-16">
          <h2 className="font-display text-3xl mb-6">The Global Index</h2>
          <div className="bg-surface-1 border border-gold/30 p-8">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              The Loopgate Index is the definitive ranking system for competitive editors. Your Index Score 
              is calculated based on your performance across events, factoring in:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gold rounded-full" />
                <span><strong className="text-foreground">Quality</strong> — Technical execution and polish</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gold rounded-full" />
                <span><strong className="text-foreground">Originality</strong> — Creative vision and uniqueness</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-gold rounded-full" />
                <span><strong className="text-foreground">Impact</strong> — Emotional resonance and storytelling</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t border-border">
          <h2 className="font-display text-3xl mb-4">Ready to Compete?</h2>
          <p className="text-muted-foreground mb-8">Join the global competition and prove you're the best.</p>
          <Link 
            to="/start" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl"
          >
            Create Your Profile
          </Link>
        </section>
      </div>
    </div>
  );
}
