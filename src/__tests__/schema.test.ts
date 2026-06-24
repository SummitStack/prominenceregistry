import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateMountainSchema,
  generateOrganizationSchema,
  validatePeakData,
  extractIntroWords,
} from '../lib/schema-generator.ts';
import {
  cacheSchema,
  getSchema,
  invalidateSchema,
  invalidateAllSchemas,
  isSchemaCached,
} from '../lib/schema-cache.ts';
import {
  getPeakData,
  getPeakSchema,
} from '../lib/peak-loader.ts';
import type { Peak } from '../types/peak.ts';

const validPeak: Peak = {
  slug: 'mount-whitney',
  name: 'Mount Whitney',
  state: 'CA',
  elevation: 14505,
  prominence: 10075,
  difficulty: 5,
  days: 2,
  distance: 22,
  gain: 6100,
  latitude: 36.5758,
  longitude: -118.292,
  mountainRange: 'Sierra Nevada',
  alternateName: 'Lone Pine Peak',
  content: {
    overview: [
      'Mount Whitney is the highest summit in the contiguous United States. It rises above the Owens Valley in the southern Sierra Nevada and is a classic high-altitude hike on a well-maintained trail.',
    ],
  },
};

describe('generateMountainSchema', () => {
  it('returns correct JSON-LD structure for a valid peak', () => {
    const schema = generateMountainSchema(validPeak);

    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], 'Mountain');
    assert.equal(schema.name, 'Mount Whitney');
    assert.equal(schema.alternateName, 'Lone Pine Peak');
    assert.equal(schema.elevation.value, '14505');
    assert.equal(schema.elevation.unitCode, 'ft');
    assert.equal(schema.geo.latitude, 36.5758);
    assert.equal(schema.geo.longitude, -118.292);
    assert.equal(schema.url, 'https://prominenceregistry.com/mount-whitney/');
    assert.equal(schema.address.addressRegion, 'California');
    assert.equal(schema.address.addressCountry, 'US');
    assert.equal(schema.location?.name, 'Sierra Nevada');
    assert.ok(schema.description);
    assert.ok(schema.description!.split(/\s+/).length <= 75);
  });

  it('omits optional location when mountainRange is missing', () => {
    const { mountainRange: _range, ...withoutRange } = validPeak;
    const schema = generateMountainSchema(withoutRange as Peak);
    assert.equal(schema.location, undefined);
  });
});

describe('validatePeakData', () => {
  it('accepts valid peak data', () => {
    const result = validatePeakData(validPeak);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('rejects invalid elevation', () => {
    const result = validatePeakData({ ...validPeak, elevation: 3000 });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('elevation')));
  });

  it('rejects out-of-range coordinates', () => {
    const result = validatePeakData({ ...validPeak, latitude: 95 });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('latitude')));
  });

  it('rejects missing coordinates', () => {
    const { latitude: _lat, longitude: _lng, ...noCoords } = validPeak;
    const result = validatePeakData(noCoords as Peak);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('latitude')));
    assert.ok(result.errors.some((e) => e.includes('longitude')));
  });
});

describe('generateOrganizationSchema', () => {
  it('returns Organization schema', () => {
    const schema = generateOrganizationSchema();
    assert.equal(schema['@type'], 'Organization');
    assert.equal(schema.url, 'https://prominenceregistry.com');
  });
});

describe('schema cache', () => {
  it('stores and retrieves cached schemas', () => {
    invalidateAllSchemas();
    const schema = generateMountainSchema(validPeak);

    cacheSchema(validPeak.slug, {
      schema,
      hash: 'abc123',
      updatedAt: '2026-01-01T00:00:00.000Z',
      peakName: validPeak.name,
    });

    assert.equal(isSchemaCached(validPeak.slug), true);
    assert.equal(getSchema(validPeak.slug)?.hash, 'abc123');

    invalidateSchema(validPeak.slug);
    assert.equal(isSchemaCached(validPeak.slug), false);
  });
});

describe('extractIntroWords', () => {
  it('limits description to 75 words', () => {
    const longOverview = { content: { overview: ['word '.repeat(100).trim()] } };
    const intro = extractIntroWords({ ...validPeak, ...longOverview });
    assert.equal(intro.split(/\s+/).length, 75);
  });
});

describe('peak-loader', () => {
  it('loads peak data by slug', () => {
    const peak = getPeakData('mount-rainier');
    assert.ok(peak);
    assert.equal(peak?.name, 'Mount Rainier');
  });

  it('returns null for unknown slug', () => {
    assert.equal(getPeakData('not-a-real-peak'), null);
  });

  it('generates schema and caches on first load', () => {
    invalidateAllSchemas();
    const peak = getPeakData('mount-rainier');
    assert.ok(peak);

    const first = getPeakSchema(peak!);
    assert.ok(first);
    assert.equal(first!.fromCache, false);

    const second = getPeakSchema(peak!);
    assert.ok(second);
    assert.equal(second!.fromCache, true);
    assert.equal(second!.hash, first!.hash);
  });

  it('regenerates schema when peak data changes', () => {
    invalidateAllSchemas();
    const peak = { ...validPeak };
    const first = getPeakSchema(peak);
    assert.ok(first);

    const updated = { ...peak, elevation: 14504 };
    invalidateSchema(updated.slug);
    const second = getPeakSchema(updated);
    assert.ok(second);
    assert.equal(second!.fromCache, false);
    assert.equal(second!.schema.elevation.value, '14504');
    assert.notEqual(second!.hash, first!.hash);
  });
});
