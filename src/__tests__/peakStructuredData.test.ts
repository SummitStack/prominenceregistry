import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { SITE_URL } from '../lib/constants.ts';
import { buildPeakPageStructuredData } from '../lib/peakStructuredData.ts';
import { getPeakHeroImageUrl } from '../lib/schema-generator.ts';
import { buildPeakImageAlt } from '../utils/imageHelpers.ts';
import type { Peak } from '../types/peak.ts';

const publishedPeakWithImage: Peak = {
  slug: 'mount-rainier',
  name: 'Mount Rainier',
  state: 'WA',
  elevation: 14411,
  prominence: 13210,
  difficulty: 5,
  days: 2,
  distance: 18,
  gain: 9000,
  latitude: 46.8523,
  longitude: -121.7603,
  published: true,
  content: {
    overview: ['Mount Rainier is an iconic stratovolcano in Washington.'],
  },
};

const publishedPeakWithoutImage: Peak = {
  ...publishedPeakWithImage,
  slug: 'no-image-peak',
  name: 'No Image Peak',
};

describe('buildPeakPageStructuredData', () => {
  it('adds ImageObject and primaryImageOfPage when a hero image URL is available', () => {
    const peakPageUrl = `${SITE_URL}/${publishedPeakWithImage.slug}/`;
    const imageUrl = getPeakHeroImageUrl(publishedPeakWithImage, SITE_URL);
    assert.ok(imageUrl);

    const schema = buildPeakPageStructuredData({
      peak: publishedPeakWithImage,
      peakPageUrl,
      seoTitle: 'Mount Rainier Guide',
      seoDescription: 'Field guide to Mount Rainier.',
      imageUrl,
    });

    const graph = schema['@graph'] as Record<string, unknown>[];
    const article = graph.find((item) => item['@type'] === 'Article');
    const imageObject = graph.find((item) => item['@type'] === 'ImageObject');

    assert.ok(article);
    assert.ok(imageObject);
    assert.equal(imageObject?.url, imageUrl);
    assert.equal(imageObject?.contentUrl, imageUrl);
    assert.equal(imageObject?.caption, buildPeakImageAlt(publishedPeakWithImage.slug));
    assert.equal(imageObject?.representativeOfPage, true);
    assert.deepEqual(article?.primaryImageOfPage, { '@id': `${peakPageUrl}#primary-image` });
    assert.deepEqual(article?.image, { '@id': `${peakPageUrl}#primary-image` });
  });

  it('omits ImageObject when no hero image URL is provided', () => {
    const peakPageUrl = `${SITE_URL}/${publishedPeakWithoutImage.slug}/`;

    const schema = buildPeakPageStructuredData({
      peak: publishedPeakWithoutImage,
      peakPageUrl,
      seoTitle: 'No Image Peak Guide',
      seoDescription: 'Field guide without a hero image.',
    });

    const graph = schema['@graph'] as Record<string, unknown>[];
    const article = graph.find((item) => item['@type'] === 'Article');
    const imageObject = graph.find((item) => item['@type'] === 'ImageObject');

    assert.ok(article);
    assert.equal(imageObject, undefined);
    assert.equal('primaryImageOfPage' in (article ?? {}), false);
    assert.equal('image' in (article ?? {}), false);
  });

  it('keeps Mountain, Article, and BreadcrumbList in the graph', () => {
    const peakPageUrl = `${SITE_URL}/${publishedPeakWithImage.slug}/`;
    const imageUrl = getPeakHeroImageUrl(publishedPeakWithImage, SITE_URL);

    const schema = buildPeakPageStructuredData({
      peak: publishedPeakWithImage,
      peakPageUrl,
      seoTitle: 'Mount Rainier Guide',
      seoDescription: 'Field guide to Mount Rainier.',
      imageUrl,
    });

    const graph = schema['@graph'] as Record<string, unknown>[];
    const types = graph.map((item) => item['@type']);

    assert.deepEqual(types, ['Mountain', 'Article', 'ImageObject', 'BreadcrumbList']);
  });
});
