import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  type?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
}

const defaultMeta = {
  title: 'Loopgate — Competitive Editing Index',
  description: 'The global competitive infrastructure for editors. Live rankings, public leaderboards, and qualification events for film studios and content creators.',
  image: 'https://storage.googleapis.com/gpt-engineer-file-uploads/mff08AeRisdvHL1tgv4VUuuN8iR2/social-images/social-1767502312938-Untitled design-42.png',
  url: 'https://loopgate.io',
};

export default function SEO({ 
  title, 
  description, 
  canonical,
  type = 'website',
  image,
  noindex = false 
}: SEOProps) {
  const pageTitle = title ? `${title} — Loopgate` : defaultMeta.title;
  const pageDescription = description || defaultMeta.description;
  const pageImage = image || defaultMeta.image;
  const pageUrl = canonical || defaultMeta.url;

  // JSON-LD structured data for Organization + WebSite (enables sitelinks)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://loopgate.io/#organization',
        name: 'Loopgate',
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
        ],
        description: 'The global competitive infrastructure for editors. Rankings, events, and qualification for film studios worldwide.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://loopgate.io/#website',
        url: 'https://loopgate.io',
        name: 'Loopgate',
        description: pageDescription,
        publisher: {
          '@id': 'https://loopgate.io/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://loopgate.io/index?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        isPartOf: {
          '@id': 'https://loopgate.io/#website',
        },
        about: {
          '@id': 'https://loopgate.io/#organization',
        },
      },
    ],
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Loopgate" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Pre-configured SEO for common pages
export const pageSEO = {
  home: {
    title: undefined, // Uses default
    description: 'The global competitive infrastructure for editors. Live rankings, public leaderboards, and qualification events.',
    canonical: 'https://loopgate.io',
  },
  rankings: {
    title: 'Rankings',
    description: 'Live global editor rankings. See who leads the competitive editing index in real-time.',
    canonical: 'https://loopgate.io/rankings',
  },
  index: {
    title: 'Editor Index',
    description: 'Browse the global index of ranked editors. Find talent, view stats, and discover rising creators.',
    canonical: 'https://loopgate.io/index',
  },
  events: {
    title: 'Events',
    description: 'Competitive editing events and tournaments. Qualify, compete, and climb the ranks.',
    canonical: 'https://loopgate.io/events',
  },
  leagues: {
    title: 'Leagues',
    description: 'Open, Pro, and Elite leagues. Progress through tiers based on your competitive performance.',
    canonical: 'https://loopgate.io/leagues',
  },
  enterprise: {
    title: 'Enterprise',
    description: 'Access ranked editors for your productions. Film studios and brands connect with verified talent.',
    canonical: 'https://loopgate.io/enterprise',
  },
  login: {
    title: 'Sign In',
    description: 'Sign in to Loopgate. Access your profile, rankings, and competitive events.',
    canonical: 'https://loopgate.io/login',
  },
  rules: {
    title: 'Rules',
    description: 'Competition rules and guidelines. Fair play standards for all Loopgate events.',
    canonical: 'https://loopgate.io/rules',
  },
  support: {
    title: 'Support',
    description: 'Get help with Loopgate. Contact support for account, competition, or technical issues.',
    canonical: 'https://loopgate.io/support',
  },
  hub: {
    title: 'Hub',
    description: 'Your Loopgate command center. View stats, upcoming events, and your competitive standing.',
    canonical: 'https://loopgate.io/hub',
  },
};
