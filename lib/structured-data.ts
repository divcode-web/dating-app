export function getOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loventodate.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lovento',
    alternateName: 'Lovento Dating App',
    url: baseUrl,
    logo: `${baseUrl}/lovento-logo.png`,
    description: 'AI-powered dating platform connecting singles worldwide with smart matching and verified profiles.',
    foundingDate: '2024',
    sameAs: [
      'https://facebook.com/lovento',
      'https://twitter.com/lovento',
      'https://instagram.com/lovento',
      'https://linkedin.com/company/lovento',
      'https://t.me/lovento',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@loventodate.com',
      availableLanguage: ['English'],
    },
  }
}

export function getWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loventodate.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lovento',
    url: baseUrl,
    description: 'Premium dating app with AI-powered matching, verified profiles, and advanced features for meaningful relationships.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function getWebApplicationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loventodate.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Lovento',
    url: baseUrl,
    description: 'Find your perfect match with Lovento. AI-powered dating app with smart matching, verified profiles, and premium features.',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to join with premium features available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '15000',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'Lovento Team',
    },
  }
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loventodate.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  }
}
