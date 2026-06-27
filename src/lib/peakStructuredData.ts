import { SITE_URL } from './constants';
import type { Peak } from '../types/peak';
import { buildPeakImageAlt } from '../utils/imageHelpers';

export type PeakStructuredDataInput = {
  peak: Peak;
  peakPageUrl: string;
  seoTitle: string;
  seoDescription: string;
  imageUrl?: string;
  siteUrl?: string;
};

type PropertyValue = {
  '@type': 'PropertyValue';
  name: string;
  value: string;
};

type ImageObject = {
  '@type': 'ImageObject';
  '@id': string;
  url: string;
  contentUrl: string;
  caption: string;
  representativeOfPage: true;
};

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildPrimaryHeroImageObject(
  peakPageUrl: string,
  imageUrl: string,
  caption: string,
): ImageObject {
  return {
    '@type': 'ImageObject',
    '@id': `${peakPageUrl}#primary-image`,
    url: imageUrl,
    contentUrl: imageUrl,
    caption,
    representativeOfPage: true,
  };
}

export function buildPeakPageStructuredData({
  peak,
  peakPageUrl,
  seoTitle,
  seoDescription,
  imageUrl,
  siteUrl = SITE_URL,
}: PeakStructuredDataInput): Record<string, unknown> {
  const latitude = peak.latitude as number;
  const longitude = peak.longitude as number;
  const ydsClass = typeof peak.ydsClass === 'string' && peak.ydsClass.length > 0 ? peak.ydsClass : null;
  const bestRoute =
    typeof peak.bestRoute === 'string' && peak.bestRoute.length > 0 ? peak.bestRoute : null;

  const additionalProperty: PropertyValue[] = [
    {
      '@type': 'PropertyValue',
      name: 'Topographic prominence',
      value: `${peak.prominence} ft`,
    },
    ...(ydsClass
      ? [
          {
            '@type': 'PropertyValue' as const,
            name: 'Yosemite Decimal System class',
            value: `Class ${ydsClass}`,
          },
        ]
      : []),
    ...(bestRoute
      ? [
          {
            '@type': 'PropertyValue' as const,
            name: 'Standard route',
            value: bestRoute,
          },
        ]
      : []),
  ];

  const mountain: Record<string, unknown> = {
    '@type': 'Mountain',
    '@id': `${peakPageUrl}#mountain`,
    name: peak.name,
    url: peakPageUrl,
    description: seoDescription,
    geo: {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
      elevation: `${peak.elevation} ft`,
    },
    additionalProperty,
  };

  const article: Record<string, unknown> = {
    '@type': 'Article',
    '@id': `${peakPageUrl}#article`,
    headline: seoTitle,
    description: seoDescription,
    url: peakPageUrl,
    mainEntityOfPage: peakPageUrl,
    about: {
      '@id': `${peakPageUrl}#mountain`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Prominence Registry',
      url: siteUrl,
    },
  };

  const graph: Record<string, unknown>[] = [mountain, article];

  if (imageUrl && isAbsoluteHttpUrl(imageUrl)) {
    const heroImage = buildPrimaryHeroImageObject(
      peakPageUrl,
      imageUrl,
      buildPeakImageAlt(peak.slug),
    );
    const imageRef = { '@id': heroImage['@id'] };

    article.image = imageRef;
    article.primaryImageOfPage = imageRef;
    graph.push(heroImage);
  }

  const breadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'All Peaks',
        item: `${siteUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: peak.name,
        item: peakPageUrl,
      },
    ],
  };

  graph.push(breadcrumbList);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
