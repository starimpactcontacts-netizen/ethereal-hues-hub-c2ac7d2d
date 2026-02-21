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
  title: 'Loopgate — The #1 Competitive Video Editing Platform',
  description: 'Loopgate is the world\'s first competitive platform for video editors. Battle 1v1, get rated by real judges, climb global rankings, and compete in editing tournaments. Join thousands of editors worldwide.',
  image: 'https://storage.googleapis.com/gpt-engineer-file-uploads/mff08AeRisdvHL1tgv4VUuuN8iR2/social-images/social-1767502312938-Untitled design-42.png',
  url: 'https://loopgate.io',
  keywords: 'video editing competition, editing tournament, competitive editing, editor rankings, video editor battles, editing contest, 1v1 editing, editing leaderboard, video editing platform, editing community, film editing competition, content creator competition, editor vs editor, editing challenge, video editing rankings',
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
        alternateName: ['LOOPGATE', 'Loopgate.io'],
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
        ],
        description: 'The world\'s first competitive platform for video editors. 1v1 battles, judge ratings, global rankings, and editing tournaments.',
        foundingDate: '2025',
        knowsAbout: ['Video Editing', 'Film Editing', 'Content Creation', 'Editing Competitions', 'Creative Competitions'],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://loopgate.io/#website',
        url: 'https://loopgate.io',
        name: 'Loopgate',
        alternateName: 'Loopgate — Competitive Video Editing Platform',
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
        '@type': 'SiteNavigationElement',
        name: ['Rankings', 'Arena', 'Download', 'Enterprise', 'Rules', 'Support'],
        url: [
          'https://loopgate.io/rankings',
          'https://loopgate.io/arena',
          'https://loopgate.io/download',
          'https://loopgate.io/enterprise',
          'https://loopgate.io/rules',
          'https://loopgate.io/support',
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

// Pre-configured SEO for common pages — keyword-rich for Google dominance
export const pageSEO = {
  home: {
    title: undefined, // Uses default
    description: 'Loopgate is the world\'s first competitive platform for video editors. Battle 1v1, get rated by real judges, climb global rankings, and compete in editing tournaments.',
    canonical: 'https://loopgate.io',
    keywords: 'video editing competition, editing tournament, competitive editing platform, editor rankings, video editor battles, editing contest, 1v1 editing battles, editing leaderboard, video editing community, film editing competition',
  },
  rankings: {
    title: 'Global Editor Rankings — Live Leaderboard',
    description: 'Live global rankings for competitive video editors. See who\'s #1 in the world. Real-time leaderboards updated after every battle and tournament.',
    canonical: 'https://loopgate.io/rankings',
    keywords: 'editor rankings, video editing leaderboard, top editors, best video editors, editing rankings, competitive editor leaderboard, global editing rankings',
  },
  index: {
    title: 'Editor Index — Browse All Ranked Editors',
    description: 'Browse the global index of ranked video editors. Discover rising talent, view editing stats, win/loss records, and competitive profiles.',
    canonical: 'https://loopgate.io/index',
    keywords: 'video editor directory, ranked editors, editing talent, editor profiles, editing stats, competitive editors list',
  },
  events: {
    title: 'Editing Tournaments & Events',
    description: 'Join competitive video editing tournaments and events. Open qualifiers, elimination rounds, and championship brackets. Compete for prizes and global recognition.',
    canonical: 'https://loopgate.io/events',
    keywords: 'editing tournament, video editing competition, editing event, editing contest, editing championship, video editing challenge',
  },
  leagues: {
    title: 'Editing Leagues — F to S Class',
    description: 'Progress through Loopgate\'s competitive editing leagues from F Class to S Class. Earn your rank through battles, tournaments, and judge evaluations.',
    canonical: 'https://loopgate.io/leagues',
    keywords: 'editing leagues, competitive editing tiers, editor ranking system, editing class system, editing skill levels',
  },
  enterprise: {
    title: 'Enterprise — Hire Ranked Video Editors',
    description: 'Access the world\'s top-ranked video editors for your productions. Film studios, brands, and agencies connect with verified editing talent through Loopgate.',
    canonical: 'https://loopgate.io/enterprise',
    keywords: 'hire video editor, professional editor marketplace, editing talent agency, film editor recruitment, brand video editing',
  },
  login: {
    title: 'Sign In',
    description: 'Sign in to Loopgate. Access your competitive editing profile, rankings, battles, and tournaments.',
    canonical: 'https://loopgate.io/start',
    keywords: 'loopgate login, loopgate sign in, editing competition login',
  },
  rules: {
    title: 'Competition Rules & Fair Play Guidelines',
    description: 'Official competition rules for Loopgate editing battles and tournaments. Fair play standards, submission guidelines, and code of conduct.',
    canonical: 'https://loopgate.io/rules',
    keywords: 'editing competition rules, editing battle rules, video editing contest guidelines, fair play editing',
  },
  support: {
    title: 'Support — Get Help',
    description: 'Get help with your Loopgate account, editing battles, tournaments, or technical issues. Contact our support team.',
    canonical: 'https://loopgate.io/support',
    keywords: 'loopgate support, loopgate help, editing competition support',
  },
  hub: {
    title: 'Hub — Your Command Center',
    description: 'Your Loopgate command center. View upcoming editing tournaments, active battles, stats, and your competitive standing.',
    canonical: 'https://loopgate.io/hub',
    noindex: true,
  },
  arena: {
    title: 'Arena — 1v1 Editing Battles',
    description: 'Enter the Loopgate Arena. Challenge editors to 1v1 battles, submit your best edits, and get rated by real judges. Climb the global rankings.',
    canonical: 'https://loopgate.io/arena',
    keywords: '1v1 editing battle, editor vs editor, editing duel, competitive editing arena, editing challenge, head to head editing',
  },
  download: {
    title: 'Download Loopgate — iOS App',
    description: 'Download the Loopgate app for iOS. Compete in editing battles, track your rankings, and join tournaments from your phone.',
    canonical: 'https://loopgate.io/download',
    keywords: 'loopgate app, editing competition app, video editing app, competitive editing mobile app, loopgate ios',
  },
  about: {
    title: 'About Loopgate — Our Mission',
    description: 'Loopgate is building the world\'s first competitive infrastructure for video editors. Learn about our mission to make editing a recognized competitive discipline.',
    canonical: 'https://loopgate.io/about',
    keywords: 'about loopgate, editing competition platform, competitive editing mission, video editing community',
  },
  howItWorks: {
    title: 'How It Works — Compete in Video Editing',
    description: 'Learn how Loopgate works. Sign up, enter battles, get rated by judges, climb the ranks. The complete guide to competitive video editing.',
    canonical: 'https://loopgate.io/how-it-works',
    keywords: 'how loopgate works, editing competition explained, how to compete in editing, video editing battle guide',
  },
  faq: {
    title: 'FAQ — Frequently Asked Questions',
    description: 'Answers to common questions about Loopgate. How editing battles work, ranking system, tournaments, judging, and more.',
    canonical: 'https://loopgate.io/faq',
    keywords: 'loopgate faq, editing competition questions, editing battle faq, video editing tournament faq',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Loopgate privacy policy. How we handle your data, editing submissions, and account information.',
    canonical: 'https://loopgate.io/privacy',
  },
  editorium: {
    title: 'Editorium — Editorial & News',
    description: 'The Editorium — editorial content, news, and deep dives from the competitive video editing community. Unit-published articles and analysis.',
    canonical: 'https://loopgate.io/editorium',
    keywords: 'editing news, video editing articles, competitive editing editorial, editing community news',
  },
  gqt: {
    title: 'QOI Score Test — Rate Your Editing Skill',
    description: 'Take the Loopgate QOI Score Test. Get your Quality, Originality, and Impact score from real judges. Discover your editing rank from F to S++.',
    canonical: 'https://loopgate.io/gqt',
    keywords: 'editing skill test, video editing rating, editing score, QOI test, editing rank test, rate my editing',
  },
  crews: {
    title: 'Units — Editing Teams & Crews',
    description: 'Join or create an editing Unit on Loopgate. Team up with other editors, compete in crew battles, and build your collective reputation.',
    canonical: 'https://loopgate.io/crews',
    keywords: 'editing team, video editing crew, editing group, collaborative editing, editing squad',
  },
};
