import { getStateName } from '../utils/stateNames';
import { hasPeakImages, getPeakImages } from '../utils/imageHelpers';
import {
  SCHEMA_VALIDATION,
  VALID_STATE_CODES,
  type Peak,
} from '../types/peak';
import { SITE_URL } from './constants';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type MountainSchema = {
  '@context': 'https://schema.org';
  '@type': 'Mountain';
  name: string;
  elevation: {
    '@type': 'QuantitativeValue';
    value: string;
    unitCode: 'ft';
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  url: string;
  address: {
    '@type': 'PostalAddress';
    addressRegion: string;
    addressCountry: 'US';
  };
  alternateName?: string;
  description?: string;
  image?: string;
  location?: {
    '@type': 'Place';
    name: string;
  };
};

export type OrganizationSchema = {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  description: string;
};

/** First N words of guide intro prose for schema `description`. */
export function extractIntroWords(peak: Peak, wordLimit = SCHEMA_VALIDATION.introWordLimit): string {
  const source = getIntroSource(peak);
  const words = source.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, wordLimit).join(' ');
}

function getIntroSource(peak: Peak): string {
  const overview = peak.content?.overview?.[0];
  if (typeof overview === 'string' && overview.trim().length > 0) {
    return overview;
  }
  const range = peak.mountainRange ? ` in the ${peak.mountainRange}` : '';
  return `${peak.name} is a ${peak.elevation.toLocaleString()}-foot peak${range}, ${getStateName(peak.state)}, with ${peak.prominence.toLocaleString()} feet of clean prominence.`;
}

export function getPeakPageUrl(peak: Peak, siteUrl = SITE_URL): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/${peak.slug}`;
}

export function getPeakHeroImageUrl(peak: Peak, siteUrl = SITE_URL): string | undefined {
  const base = siteUrl.replace(/\/$/, '');
  const manifestImages = hasPeakImages(peak.slug) ? getPeakImages(peak.slug) : null;
  if (manifestImages?.heroDesktop.jpg) {
    return `${base}${manifestImages.heroDesktop.jpg}`;
  }
  if (typeof peak.heroImage === 'string' && peak.heroImage.length > 0) {
    return `${base}${peak.heroImage.startsWith('/') ? peak.heroImage : `/${peak.heroImage}`}`;
  }
  return undefined;
}

/**
 * Validates peak data required for Mountain + GeoCoordinates JSON-LD.
 * Deterministic: same input always produces the same error list.
 */
export function validatePeakData(peak: Peak, siteUrl = SITE_URL): ValidationResult {
  const errors: string[] = [];

  if (!peak.name || peak.name.trim().length === 0) {
    errors.push('name must be a non-empty string');
  }

  if (!peak.slug || peak.slug.trim().length === 0) {
    errors.push('slug must be a non-empty string');
  }

  if (typeof peak.elevation !== 'number' || Number.isNaN(peak.elevation)) {
    errors.push('elevation must be a number');
  } else if (
    peak.elevation <= SCHEMA_VALIDATION.elevationMin ||
    peak.elevation >= SCHEMA_VALIDATION.elevationMax
  ) {
    errors.push(
      `elevation must be > ${SCHEMA_VALIDATION.elevationMin} and < ${SCHEMA_VALIDATION.elevationMax} (got ${peak.elevation})`,
    );
  }

  if (typeof peak.latitude !== 'number' || Number.isNaN(peak.latitude)) {
    errors.push('latitude is required and must be a number');
  } else if (
    peak.latitude < SCHEMA_VALIDATION.latitudeMin ||
    peak.latitude > SCHEMA_VALIDATION.latitudeMax
  ) {
    errors.push(
      `latitude must be between ${SCHEMA_VALIDATION.latitudeMin} and ${SCHEMA_VALIDATION.latitudeMax} (got ${peak.latitude})`,
    );
  }

  if (typeof peak.longitude !== 'number' || Number.isNaN(peak.longitude)) {
    errors.push('longitude is required and must be a number');
  } else if (
    peak.longitude < SCHEMA_VALIDATION.longitudeMin ||
    peak.longitude > SCHEMA_VALIDATION.longitudeMax
  ) {
    errors.push(
      `longitude must be between ${SCHEMA_VALIDATION.longitudeMin} and ${SCHEMA_VALIDATION.longitudeMax} (got ${peak.longitude})`,
    );
  }

  if (!peak.state || !VALID_STATE_CODES.includes(peak.state as (typeof VALID_STATE_CODES)[number])) {
    errors.push(`state must be a valid US state code (got "${peak.state ?? ''}")`);
  }

  const expectedUrl = getPeakPageUrl(peak, siteUrl);
  if (peak.slug && !expectedUrl.endsWith(`/${peak.slug}`)) {
    errors.push(`url must match peak slug (expected path /${peak.slug})`);
  }

  if (typeof peak.prominence !== 'number' || peak.prominence <= 0) {
    errors.push('prominence must be > 0');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Builds schema.org Mountain JSON-LD for a validated peak.
 * Throws if validation fails — call validatePeakData first for graceful handling.
 */
export function generateMountainSchema(peak: Peak, siteUrl = SITE_URL): MountainSchema {
  const validation = validatePeakData(peak, siteUrl);
  if (!validation.valid) {
    throw new Error(
      `Cannot generate schema for ${peak.slug ?? 'unknown'}: ${validation.errors.join('; ')}`,
    );
  }

  const schema: MountainSchema = {
    '@context': 'https://schema.org',
    '@type': 'Mountain',
    name: peak.name,
    elevation: {
      '@type': 'QuantitativeValue',
      value: String(peak.elevation),
      unitCode: 'ft',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: peak.latitude as number,
      longitude: peak.longitude as number,
    },
    url: getPeakPageUrl(peak, siteUrl),
    address: {
      '@type': 'PostalAddress',
      addressRegion: getStateName(peak.state),
      addressCountry: 'US',
    },
  };

  if (typeof peak.alternateName === 'string' && peak.alternateName.trim().length > 0) {
    schema.alternateName = peak.alternateName.trim();
  }

  const description = extractIntroWords(peak);
  if (description.length > 0) {
    schema.description = description;
  }

  const image = getPeakHeroImageUrl(peak, siteUrl);
  if (image) {
    schema.image = image;
  }

  if (typeof peak.mountainRange === 'string' && peak.mountainRange.trim().length > 0) {
    schema.location = {
      '@type': 'Place',
      name: peak.mountainRange.trim(),
    };
  }

  return schema;
}

/** Homepage Organization schema — reusable across static builds. */
export function generateOrganizationSchema(siteUrl = SITE_URL): OrganizationSchema {
  const base = siteUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Prominence Registry',
    url: base,
    description:
      'Field guides and climbing information for the most topographically prominent peaks in the contiguous United States.',
  };
}

/** Stable hash input for cache invalidation when schema-relevant fields change. */
export function getSchemaHashInput(peak: Peak, siteUrl = SITE_URL): Record<string, unknown> {
  return {
    slug: peak.slug,
    name: peak.name,
    state: peak.state,
    elevation: peak.elevation,
    prominence: peak.prominence,
    latitude: peak.latitude,
    longitude: peak.longitude,
    mountainRange: peak.mountainRange ?? null,
    alternateName: peak.alternateName ?? null,
    intro: extractIntroWords(peak),
    image: getPeakHeroImageUrl(peak, siteUrl) ?? null,
    url: getPeakPageUrl(peak, siteUrl),
  };
}
