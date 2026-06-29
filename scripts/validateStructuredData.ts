import fs from 'node:fs';
import path from 'node:path';

import peaksData from '../src/data/peaks';
import { SITE_URL } from '../src/lib/constants.ts';
import { getPeakHeroImageUrl } from '../src/lib/schema-generator.ts';
import { buildPeakImageAlt } from '../src/utils/imageHelpers.ts';

const DIST_DIR = path.join(process.cwd(), 'dist');
const errors: string[] = [];

type JsonObject = Record<string, unknown>;

type PeakRecord = (typeof peaksData)[number];

function parseJsonLdBlocks(html: string): JsonObject[] {
  const blocks: JsonObject[] = [];
  const pattern = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

  for (const match of html.matchAll(pattern)) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      if (parsed && typeof parsed === 'object') {
        blocks.push(parsed as JsonObject);
      }
    } catch {
      errors.push('Failed to parse JSON-LD block');
    }
  }

  return blocks;
}

function graphItems(block: JsonObject): JsonObject[] {
  const graph = block['@graph'];
  if (Array.isArray(graph)) {
    return graph.filter((item): item is JsonObject => !!item && typeof item === 'object');
  }
  return [block];
}

function findByType(blocks: JsonObject[], type: string): JsonObject | undefined {
  for (const block of blocks) {
    const match = graphItems(block).find((item) => item['@type'] === type);
    if (match) return match;
  }
  return undefined;
}

function hasStructuredData(blocks: JsonObject[]): boolean {
  return ['Mountain', 'Article', 'BreadcrumbList', 'ImageObject'].some(
    (type) => !!findByType(blocks, type),
  );
}

function isNonCanonicalPeaksPageUrl(url: string): boolean {
  try {
    const parsed = new URL(url, SITE_URL);
    const pathname = parsed.pathname;
    return pathname === '/peaks' || pathname.startsWith('/peaks/');
  } catch {
    return url === '/peaks' || url.startsWith('/peaks/');
  }
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function collectUrls(value: unknown, urls: string[]): void {
  if (typeof value === 'string') {
    if (value.startsWith('http') || value.startsWith('/')) {
      urls.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectUrls(item, urls);
    }
    return;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as JsonObject)) {
      collectUrls(nested, urls);
    }
  }
}

function validatePrimaryImageSchema(slug: string, blocks: JsonObject[], article: JsonObject): void {
  const peak = peaksData.find((entry) => entry.slug === slug);
  if (!peak) return;

  const expectedHeroUrl = getPeakHeroImageUrl(peak, SITE_URL);
  const imageObject = findByType(blocks, 'ImageObject');

  if (!expectedHeroUrl) {
    if (imageObject) {
      errors.push(`[${slug}] page without hero image must not emit ImageObject JSON-LD`);
    }
    if ('primaryImageOfPage' in article) {
      errors.push(`[${slug}] Article.primaryImageOfPage must not be set without a hero image`);
    }
    return;
  }

  if (!imageObject) {
    errors.push(`[${slug}] published page with hero image is missing ImageObject JSON-LD`);
    return;
  }

  for (const field of ['url', 'contentUrl'] as const) {
    const value = imageObject[field];
    if (typeof value !== 'string' || !isAbsoluteHttpUrl(value)) {
      errors.push(`[${slug}] ImageObject.${field} must be an absolute URL`);
    } else if (value !== expectedHeroUrl) {
      errors.push(`[${slug}] ImageObject.${field} must match the peak hero image URL`);
    }
  }

  const caption = imageObject.caption;
  const expectedCaption = buildPeakImageAlt(slug);
  if (typeof caption !== 'string' || caption.length === 0) {
    errors.push(`[${slug}] ImageObject.caption is missing`);
  } else if (caption !== expectedCaption) {
    errors.push(`[${slug}] ImageObject.caption must match the peak hero image alt text`);
  }

  if (imageObject.representativeOfPage !== true) {
    errors.push(`[${slug}] ImageObject.representativeOfPage must be true`);
  }

  const primaryImage = article.primaryImageOfPage;
  if (!primaryImage || typeof primaryImage !== 'object') {
    errors.push(`[${slug}] Article.primaryImageOfPage is missing`);
    return;
  }

  const primaryImageId = (primaryImage as JsonObject)['@id'];
  const imageObjectId = imageObject['@id'];
  if (typeof primaryImageId !== 'string' || primaryImageId.length === 0) {
    errors.push(`[${slug}] Article.primaryImageOfPage must reference ImageObject @id`);
  } else if (typeof imageObjectId === 'string' && primaryImageId !== imageObjectId) {
    errors.push(`[${slug}] Article.primaryImageOfPage must reference the primary ImageObject`);
  }
}

function validatePublishedPeak(slug: string, html: string): void {
  const blocks = parseJsonLdBlocks(html);
  if (blocks.length === 0) {
    errors.push(`[${slug}] published page is missing JSON-LD`);
    return;
  }

  const mountain = findByType(blocks, 'Mountain');
  const article = findByType(blocks, 'Article');
  const breadcrumb = findByType(blocks, 'BreadcrumbList');

  if (!mountain) {
    errors.push(`[${slug}] published page is missing Mountain JSON-LD`);
  } else {
    if ('elevation' in mountain) {
      errors.push(`[${slug}] Mountain must not have root-level elevation`);
    }

    const geo = mountain.geo;
    if (!geo || typeof geo !== 'object') {
      errors.push(`[${slug}] Mountain.geo is missing`);
    } else {
      const geoObj = geo as JsonObject;
      const elevation = geoObj.elevation;
      if (typeof elevation !== 'string' || !elevation.endsWith(' ft')) {
        errors.push(`[${slug}] Mountain.geo.elevation must be a string ending in " ft"`);
      }
    }
  }

  if (!article) {
    errors.push(`[${slug}] published page is missing Article JSON-LD`);
  } else {
    for (const field of ['headline', 'description', 'url'] as const) {
      if (typeof article[field] !== 'string' || article[field].length === 0) {
        errors.push(`[${slug}] Article.${field} is missing`);
      }
    }

    validatePrimaryImageSchema(slug, blocks, article);
  }

  if (!breadcrumb) {
    errors.push(`[${slug}] published page is missing BreadcrumbList JSON-LD`);
  } else {
    const items = breadcrumb.itemListElement;
    if (!Array.isArray(items) || items.length < 2) {
      errors.push(`[${slug}] BreadcrumbList must have at least two ListItems`);
    } else {
      for (const [index, item] of items.entries()) {
        if (!item || typeof item !== 'object') {
          errors.push(`[${slug}] BreadcrumbList item ${index + 1} is invalid`);
          continue;
        }
        const listItem = item as JsonObject;
        const itemUrl = listItem.item;
        if (typeof itemUrl !== 'string' || itemUrl.length === 0) {
          errors.push(`[${slug}] BreadcrumbList item ${index + 1} is missing item URL`);
        } else if (isNonCanonicalPeaksPageUrl(itemUrl)) {
          errors.push(`[${slug}] BreadcrumbList item ${index + 1} uses non-canonical /peaks/ URL`);
        }
      }
    }
  }

  const urls: string[] = [];
  for (const block of blocks) {
    collectUrls(block, urls);
  }
  for (const url of urls) {
    if (isNonCanonicalPeaksPageUrl(url)) {
      errors.push(`[${slug}] JSON-LD contains non-canonical /peaks/ URL: ${url}`);
    }
  }
}

function validateUnpublishedPeak(slug: string, html: string): void {
  const blocks = parseJsonLdBlocks(html);
  if (hasStructuredData(blocks)) {
    errors.push(
      `[${slug}] unpublished/noindex page must not emit Mountain, Article, BreadcrumbList, or ImageObject JSON-LD`,
    );
  }
}

for (const peak of peaksData) {
  const htmlPath = path.join(DIST_DIR, peak.slug, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    errors.push(`[${peak.slug}] missing built page at dist/${peak.slug}/index.html`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  if (peak.published === true) {
    validatePublishedPeak(peak.slug, html);
  } else {
    validateUnpublishedPeak(peak.slug, html);
  }
}

if (errors.length > 0) {
  console.error('\n❌ Structured data validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

const publishedCount = peaksData.filter((peak) => peak.published === true).length;
const unpublishedCount = peaksData.length - publishedCount;

console.log(
  `✅ Structured data valid — ${publishedCount} published peaks with JSON-LD, ${unpublishedCount} unpublished peaks without peak JSON-LD (${SITE_URL})`,
);
