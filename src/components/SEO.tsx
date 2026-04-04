import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
  keywords?: string;
}

const defaultMeta = {
  title: 'Loopgate — #1 Edit Competition & Video Editing Tournament Platform',
  description: 'Loopgate is the world\'s #1 edit competition platform. Enter video editing competitions, 1v1 edit battles, editing tournaments, and contests. Get rated by certified judges and climb the global editor rankings. Free to join.',
  image: 'https://tmfnqnmyxxydrxwjkaiq.supabase.co/storage/v1/object/public/loop-media/branding/loopgate-og.png',
  url: 'https://loopgate.io',
  keywords: 'edit competition, editing competition, video editing competition, editing tournament, editing contest, edit battle, 1v1 editing battle, video editing contest, editing challenge, competitive editing, editor vs editor, editing leaderboard, editor rankings, video editing tournament, film editing competition, editing contest 2025 2026, best editing competition, online editing competition, free editing competition, video editing battle, edit fest, editing championship, content creator competition, video editing rankings, competitive video editing platform',
};

export default function SEO({ 
  title, 
  description, 
  canonical,
  type = 'website',
  image,
  noindex = false,
  keywords,
}: SEOProps) {
  const pageTitle = title ? `${title} | Loopgate` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageImage = image || defaultMeta.image;
  const pageUrl = canonical || defaultMeta.url;
  const pageKeywords = keywords || defaultMeta.keywords;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://loopgate.io/#organization',
        name: 'Loopgate',
        alternateName: ['LOOPGATE', 'Loopgate.io', 'Loop Gate'],
        url: 'https://loopgate.io',
        logo: {
          '@type': 'ImageObject',
          url: 'https://storage.googleapis.com/gpt-engineer-file-uploads/mff08AeRisdvHL1tgv4VUuuN8iR2/uploads/1767502308450-Untitled design-42.png',
          width: 512,
          height: 512,
        },
        sameAs: [
          'https://instagram.com/loopgate',
          'https://tiktok.com/@loopgate',
          'https://x.com/loopgate',
          'https://youtube.com/@loopgate',
        ],
        description: 'The world\'s #1 edit competition platform. Video editing competitions, 1v1 edit battles, editing tournaments, certified judge ratings, and global editor rankings.',
        foundingDate: '2025',
        knowsAbout: [
          'Video Editing Competitions',
          'Edit Competitions',
          'Editing Tournaments',
          'Film Editing Contests',
          'Competitive Video Editing',
          'Editor Rankings',
          '1v1 Edit Battles',
          'Video Editing Challenges',
          'Content Creation Competitions',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://loopgate.io/#website',
        url: 'https://loopgate.io',
        name: 'Loopgate',
        alternateName: 'Loopgate — #1 Edit Competition Platform',
        description: defaultMeta.description,
        publisher: { '@id': 'https://loopgate.io/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://loopgate.io/index?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        isPartOf: { '@id': 'https://loopgate.io/#website' },
        about: { '@id': 'https://loopgate.io/#organization' },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebApplication',
        '@id': 'https://loopgate.io/#app',
        name: 'Loopgate',
        url: 'https://loopgate.io',
        description: 'The #1 edit competition platform for video editors. Enter editing tournaments, 1v1 battles, and contests. Free to join.',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, iOS',
        browserRequirements: 'Requires a modern web browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'SiteNavigationElement',
        name: ['Arena', 'Rankings', 'Judges', 'About', 'Download', 'Enterprise', 'FAQ', 'Rules'],
        url: [
          'https://loopgate.io/arena',
          'https://loopgate.io/rankings',
          'https://loopgate.io/judges',
          'https://loopgate.io/about',
          'https://loopgate.io/download',
          'https://loopgate.io/enterprise',
          'https://loopgate.io/faq',
          'https://loopgate.io/rules',
        ],
      },
      // FAQPage schema for rich results
      {
        '@type': 'FAQPage',
        '@id': 'https://loopgate.io/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is an edit competition?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'An edit competition is a contest where video editors compete by creating the best edit from provided footage or a specific theme. Loopgate is the world\'s #1 platform for edit competitions, offering 1v1 battles, tournaments, and open arena events with certified judges and global rankings.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I enter a video editing competition on Loopgate?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Create a free account on Loopgate, navigate to the Arena, and choose your competition format: Solo Edits, 1v1 Battles, or Official Tournaments. Submit your edit link from TikTok, Instagram, or YouTube. Certified judges will rate your work on Quality, Originality, and Impact.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Loopgate free to join?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Loopgate is completely free to join. Creating a profile, entering edit competitions, competing in tournaments, and climbing the global rankings costs nothing. Some premium features may be introduced later, but core competition access will always be free.',
            },
          },
          {
            '@type': 'Question',
            name: 'What makes Loopgate different from other editing competitions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Loopgate is the only platform purpose-built for competitive video editing. Unlike one-off contests, Loopgate provides persistent rankings, certified judges, real-time leaderboards, 1v1 battles, team-based crew competitions, and a global Index Score that tracks your editing career progression.',
            },
          },
          {
            '@type': 'Question',
            name: 'How are edits scored in Loopgate competitions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Professional certified judges score every submission using the QOI system: Quality (technical execution, 1-10), Originality (creative vision, 1-10), and Impact (emotional resonance, 1-10). Combined, these form your QOI Score which determines your ranking and league placement from F to S++ class.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I compete on mobile?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Absolutely. Loopgate is fully optimized for mobile and available as an iOS app. You can enter edit competitions, track rankings, chat with your crew, and receive real-time notifications — all from your phone.',
            },
          },
        ],
      },
    ],
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Loopgate" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:site" content="@loopgate" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Pre-configured SEO for common pages — keyword-dense for Google domination
export const pageSEO = {
  home: {
    title: undefined, // Uses default
    description: 'Loopgate is the world\'s #1 edit competition platform. Enter video editing competitions, 1v1 edit battles, and editing tournaments. Get rated by certified judges and climb the global editor rankings. Free to join.',
    canonical: 'https://loopgate.io',
    keywords: 'edit competition, editing competition, video editing competition, editing tournament, editing contest, edit battle, 1v1 editing, video editing contest, editing challenge, competitive editing, editor vs editor, editing leaderboard, editor rankings, best editing competition, free editing competition, online editing competition, video editing battle, editing championship',
  },
  rankings: {
    title: 'Global Editor Rankings — Live Editing Leaderboard',
    description: 'Live global rankings for competitive video editors. See who\'s the #1 ranked editor in the world. Real-time editing competition leaderboards updated after every battle and tournament on Loopgate.',
    canonical: 'https://loopgate.io/rankings',
    keywords: 'editor rankings, video editing leaderboard, top editors, best video editors ranked, editing competition rankings, competitive editor leaderboard, global editing rankings, editor ranking system',
  },
  index: {
    title: 'Editor Index — Browse All Ranked Competitive Editors',
    description: 'Browse the global index of ranked video editors competing on Loopgate. Discover rising editing talent, view competition stats, win/loss records, and competitive profiles.',
    canonical: 'https://loopgate.io/index',
    keywords: 'ranked video editors, editing competition participants, competitive editors directory, editor profiles, editing competition stats',
  },
  events: {
    title: 'Editing Tournaments & Video Editing Competitions',
    description: 'Join live video editing tournaments and competitions on Loopgate. Open qualifiers, elimination rounds, championship brackets, and prize pools. The biggest editing contests online.',
    canonical: 'https://loopgate.io/events',
    keywords: 'editing tournament, video editing competition, editing contest, editing championship, video editing challenge, editing tournament 2026, online editing contest, edit competition event',
  },
  leagues: {
    title: 'Editing Leagues — F to S Class Competition Tiers',
    description: 'Progress through Loopgate\'s competitive editing leagues from F Class to S Class. Earn your rank through edit competitions, battles, and judge evaluations.',
    canonical: 'https://loopgate.io/leagues',
    keywords: 'editing leagues, competitive editing tiers, editor ranking system, editing class system, editing skill levels, editing competition ranks',
  },
  enterprise: {
    title: 'Enterprise — Hire Top Ranked Video Editors',
    description: 'Access the world\'s top-ranked video editors through Loopgate. Film studios, brands, and agencies connect with verified editing competition winners and certified talent.',
    canonical: 'https://loopgate.io/enterprise',
    keywords: 'hire video editor, professional editor marketplace, editing talent, film editor recruitment, brand video editing, competition winner editors',
  },
  login: {
    title: 'Sign In — Enter the Edit Competition',
    description: 'Sign in to Loopgate to enter edit competitions, track your rankings, and compete in video editing tournaments.',
    canonical: 'https://loopgate.io/start',
    keywords: 'loopgate login, loopgate sign in, editing competition login, enter edit competition',
  },
  rules: {
    title: 'Edit Competition Rules & Fair Play Guidelines',
    description: 'Official competition rules for Loopgate edit battles and editing tournaments. Fair play standards, submission guidelines, and code of conduct for all editing competitions.',
    canonical: 'https://loopgate.io/rules',
    keywords: 'editing competition rules, edit battle rules, video editing contest guidelines, fair play editing, competition rules',
  },
  support: {
    title: 'Support — Get Help',
    description: 'Get help with your Loopgate account, edit competitions, tournaments, or technical issues.',
    canonical: 'https://loopgate.io/support',
    keywords: 'loopgate support, editing competition help',
  },
  hub: {
    title: 'Hub — Your Competition Command Center',
    description: 'Your Loopgate command center. View upcoming editing tournaments, active edit battles, competition stats, and your competitive standing.',
    canonical: 'https://loopgate.io/hub',
    noindex: true,
  },
  arena: {
    title: 'Arena — 1v1 Edit Battles & Solo Editing Competitions',
    description: 'Enter the Loopgate Arena. Challenge editors to 1v1 edit battles, compete in solo editing competitions, and get rated by certified judges. The ultimate edit competition experience.',
    canonical: 'https://loopgate.io/arena',
    keywords: '1v1 edit battle, editor vs editor, editing competition arena, editing challenge, competitive editing, edit competition, solo editing contest, head to head editing battle',
  },
  download: {
    title: 'Download Loopgate — Edit Competition App for iOS',
    description: 'Download the Loopgate app for iOS. Enter edit competitions, compete in editing tournaments, track your rankings, and battle other editors from your phone.',
    canonical: 'https://loopgate.io/download',
    keywords: 'loopgate app, editing competition app, video editing competition app, edit battle app, loopgate ios, editing contest app',
  },
  about: {
    title: 'About Loopgate — The #1 Edit Competition Platform',
    description: 'Loopgate is the world\'s first and largest competitive infrastructure for video editors. Learn about our mission to make editing competitions a recognized global discipline.',
    canonical: 'https://loopgate.io/about',
    keywords: 'about loopgate, edit competition platform, competitive editing, video editing competition community, editing tournament platform',
  },
  howItWorks: {
    title: 'How It Works — Enter Your First Edit Competition',
    description: 'Learn how Loopgate works. Sign up free, enter edit competitions, get rated by certified judges, climb the global rankings. The complete guide to competitive video editing.',
    canonical: 'https://loopgate.io/how-it-works',
    keywords: 'how edit competitions work, how to enter editing competition, video editing battle guide, how loopgate works, editing competition explained',
  },
  faq: {
    title: 'FAQ — Edit Competition Questions Answered',
    description: 'Answers to common questions about edit competitions on Loopgate. How editing battles work, the ranking system, tournaments, judging, and how to get started competing.',
    canonical: 'https://loopgate.io/faq',
    keywords: 'edit competition faq, editing competition questions, editing battle faq, video editing tournament faq, how do editing competitions work',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Loopgate privacy policy. How we handle your data, editing competition submissions, and account information.',
    canonical: 'https://loopgate.io/privacy',
  },
  editorium: {
    title: 'Editorium — Editing Competition News & Editorial',
    description: 'The Editorium — news, analysis, and deep dives from the competitive video editing world. Edit competition coverage, editor profiles, and community stories.',
    canonical: 'https://loopgate.io/editorium',
    keywords: 'editing competition news, video editing articles, competitive editing editorial, edit competition coverage, editing community news',
  },
  gqt: {
    title: 'QOI Score Test — Rate Your Editing Skill Free',
    description: 'Take the free Loopgate QOI Score Test. Get your Quality, Originality, and Impact score rated by AI. Discover your editing rank from F to S++ and see how you compare to competitors.',
    canonical: 'https://loopgate.io/gqt',
    keywords: 'editing skill test, video editing rating, editing score, QOI test, rate my editing, editing rank test, free editing evaluation, how good am I at editing',
  },
  crews: {
    title: 'Units — Editing Teams & Competition Crews',
    description: 'Join or create an editing Unit on Loopgate. Team up with other editors, compete in crew-vs-crew edit competitions, and build your collective ranking.',
    canonical: 'https://loopgate.io/crews',
    keywords: 'editing team, video editing crew, editing competition team, collaborative editing, editing squad, crew competition',
  },
  judges: {
    title: 'Judges — Certified Edit Competition Judges',
    description: 'Meet the certified judges who rate edit competitions on Loopgate. Professional evaluators scoring Quality, Originality, and Impact across all editing tournaments.',
    canonical: 'https://loopgate.io/judges',
    keywords: 'editing competition judges, certified edit judges, video editing evaluators, competition judges, editing tournament judges',
  },
};