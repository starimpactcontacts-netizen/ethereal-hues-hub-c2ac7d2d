import { ArrowLeft, ArrowRight, UserPlus, Video, Award, TrendingUp, Star, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Sign up with email or Google. Connect your TikTok, Instagram, or YouTube to verify your identity as a creator.',
    details: [
      'Choose your username (represents you in rankings)',
      'Connect at least one social platform',
      'Accept competition rules',
    ],
  },
  {
    number: '02',
    icon: Video,
    title: 'Enter Live Events',
    description: 'Browse active competitions and submit your edits. Each event has specific themes, rules, and prize pools.',
    details: [
      'Find events matching your skill level',
      'Submit your edit via platform link',
      'Track your submission status in real-time',
    ],
  },
  {
    number: '03',
    icon: Award,
    title: 'Get Scored by Judges',
    description: 'Professional judges evaluate your work using the QOI scoring system: Quality, Originality, and Impact.',
    details: [
      'Quality — Technical execution and polish',
      'Originality — Creative vision and uniqueness',
      'Impact — Emotional resonance and storytelling',
    ],
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Climb the Index',
    description: 'Your scores contribute to your Global Index Score. Rise through leagues and prove yourself against the best.',
    details: [
      'Open League — Entry level, build your record',
      'Pro League — Competitive tier, serious competition',
      'Elite League — Top performers, highest stakes',
    ],
  },
];

const features = [
  {
    icon: Star,
    title: 'Live Rankings',
    description: 'Real-time leaderboards update as events progress. See where you stand globally.',
  },
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'Platform verification ensures all competitors are legitimate creators.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO 
        title="How It Works"
        description="Learn how Loopgate works. Create your profile, enter live editing competitions, get scored by judges, and climb the global rankings."
        canonical="https://loopgate.io/how-it-works"
      />
      
      <div className="px-4 pt-6 pb-8 max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </Link>

        <h1 className="font-display text-5xl sm:text-6xl mb-4">How It Works</h1>
        <p className="text-xl text-muted-foreground mb-16">
          From signup to global rankings in 4 steps.
        </p>

        {/* Steps */}
        <div className="space-y-8 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-20 w-0.5 h-16 bg-gradient-to-b from-gold/50 to-transparent hidden sm:block" />
                )}
                
                <div className="bg-surface-1 border border-border p-6 sm:p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-display text-gold text-sm">{step.number}</span>
                        <h2 className="font-display text-2xl">{step.title}</h2>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Features */}
        <section className="mb-16">
          <h2 className="font-display text-3xl mb-8 text-center">Platform Features</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-surface-1 border border-border p-6 text-center">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t border-border">
          <h2 className="font-display text-3xl mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">Create your profile and enter your first competition.</p>
          <Link to="/auth">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-display text-xl px-8 py-6 h-auto">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
