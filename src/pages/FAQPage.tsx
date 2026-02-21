import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO, { pageSEO } from '@/components/SEO';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'What is Loopgate?',
        a: 'Loopgate is the global competitive infrastructure for video editors. We run live editing competitions with real-time rankings, professional judging, and prize pools. Think of it as esports for video editing.',
      },
      {
        q: 'How do I sign up?',
        a: 'Click "Create Your Profile" on the homepage. You can sign up with your email or Google account. After signing up, connect at least one social platform (TikTok, Instagram, or YouTube) to verify your identity.',
      },
      {
        q: 'Is Loopgate free to use?',
        a: 'Yes! Creating a profile, entering events, and competing is completely free. Some premium features may be introduced in the future, but core competition access will always be free.',
      },
      {
        q: 'What platforms can I connect?',
        a: 'Currently we support TikTok, Instagram, and YouTube. You need to connect at least one platform to compete, and we verify that you own the account.',
      },
    ],
  },
  {
    category: 'Competitions',
    questions: [
      {
        q: 'How do I enter a competition?',
        a: 'Navigate to Events, find an active competition, and click "Submit Edit." You\'ll need to provide a link to your edit on a supported platform (TikTok, Instagram, or YouTube).',
      },
      {
        q: 'How are edits scored?',
        a: 'Professional judges score your work using the QOI system: Quality (technical execution), Originality (creative vision), and Impact (emotional resonance). Each category is scored 1-10, combined into your final QOI score.',
      },
      {
        q: 'When are results announced?',
        a: 'Rankings update in real-time during live events as judges complete their evaluations. Final rankings are locked when events close, and winners are notified via email.',
      },
      {
        q: 'Can I edit my submission?',
        a: 'Once submitted, you cannot change your entry. Make sure your edit is final before submitting. You can withdraw and resubmit before the deadline if needed.',
      },
    ],
  },
  {
    category: 'Rankings & Leagues',
    questions: [
      {
        q: 'How does the Global Index Score work?',
        a: 'Your Index Score is calculated based on your performance across competitions. Higher placements, consistent performance, and competing in higher-tier events all contribute to your score.',
      },
      {
        q: 'What are the different leagues?',
        a: 'There are three leagues: Open (entry level), Pro (competitive tier), and Elite (top performers). You advance through leagues based on your Index Score and competition performance.',
      },
      {
        q: 'Can my rank go down?',
        a: 'Yes. Your rank is relative to other editors. If others perform well and you don\'t compete, your rank may drop. Stay active to maintain your position.',
      },
    ],
  },
  {
    category: 'Prizes & Payments',
    questions: [
      {
        q: 'How do prize payouts work?',
        a: 'Prize pools are distributed to top performers based on final rankings. Payouts are processed within 30 days of event closure. Winners are contacted via their registered email address.',
      },
      {
        q: 'Do I need to pay taxes on prizes?',
        a: 'Tax obligations vary by country. For US residents, prizes over $600 may require tax documentation (1099). Consult a tax professional for your specific situation.',
      },
      {
        q: 'What payment methods are supported?',
        a: 'We currently support PayPal and bank transfers for prize payouts. You\'ll provide payment details when claiming your prize.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Is there a mobile app?',
        a: 'Yes! The Loopgate app is available on iOS. Download it from the App Store. Android support is coming soon.',
      },
      {
        q: 'Why can\'t I submit my edit?',
        a: 'Make sure your submission link is from a supported platform (TikTok, Instagram, or YouTube) and the content is publicly accessible. Private or deleted posts cannot be judged.',
      },
      {
        q: 'How do I contact support?',
        a: 'Visit our Support page or email team@loopgate.io. You can also join our Discord community for faster help from other editors.',
      },
    ],
  },
];

export default function FAQPage() {
  // Generate FAQ structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(category => 
      category.questions.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO {...pageSEO.faq} />
      
      {/* FAQ Schema */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      
      <div className="px-4 pt-6 pb-8 max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </Link>

        <h1 className="font-display text-5xl sm:text-6xl mb-4">FAQ</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Frequently asked questions about Loopgate.
        </p>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqs.map((category) => (
            <section key={category.category}>
              <h2 className="font-display text-2xl text-gold mb-4">{category.category}</h2>
              <div className="bg-surface-1 border border-border">
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${category.category}-${index}`} className="border-border">
                      <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-surface-0/50">
                        <span className="font-medium">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          ))}
        </div>

        {/* Still Have Questions */}
        <section className="mt-16 text-center py-12 bg-surface-1 border border-border">
          <h2 className="font-display text-2xl mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/support" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gold hover:bg-gold/90 text-gold-foreground font-display"
            >
              Contact Support
            </Link>
            <a 
              href="https://discord.gg/loopgate" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-border hover:bg-surface-0 font-display"
            >
              Join Discord
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
