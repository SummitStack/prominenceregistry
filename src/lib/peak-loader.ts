import { createHash } from 'node:crypto';
import { watch as fsWatch, type FSWatcher } from 'node:fs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import peaksData from '../data/peaks';
import { SITE_URL } from './constants';
import {
  generateMountainSchema,
  getSchemaHashInput,
  validatePeakData,
  type MountainSchema,
} from './schema-generator';
import {
  cacheSchema,
  getSchema,
  importCacheSnapshot,
  invalidateSchema,
  type SchemaCacheEntry,
} from './schema-cache';
import { isPeak, type Peak } from '../types/peak';

const peaks = peaksData as Peak[];

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PEAKS_JSON_PATH = join(__dirname, '../data/peaks/peaks.json');
export const PEAKS_CONTENT_PATH = join(__dirname, '../data/peaks/content.json');
export const PEAKS_VERIFICATION_PATH = join(__dirname, '../data/peaks/verification.json');
const PEAK_DATA_WATCH_PATHS = [PEAKS_JSON_PATH, PEAKS_CONTENT_PATH, PEAKS_VERIFICATION_PATH];
export const DISK_CACHE_PATH = join(__dirname, '../data/generated/schema-cache.json');

let diskCacheLoaded = false;
let peakDataWatchers: FSWatcher[] | null = null;

function computePeakHash(peak: Peak, siteUrl = SITE_URL): string {
  return createHash('sha256')
    .update(JSON.stringify(getSchemaHashInput(peak, siteUrl)))
    .digest('hex');
}

function ensureDiskCacheLoaded(): void {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;

  if (!existsSync(DISK_CACHE_PATH)) return;

  try {
    const raw = readFileSync(DISK_CACHE_PATH, 'utf8');
    const snapshot = JSON.parse(raw) as Record<string, SchemaCacheEntry>;
    importCacheSnapshot(snapshot);
  } catch (error) {
    console.warn('[schema] Failed to load disk cache:', error);
  }
}

/** Load a single peak by slug from peaks.json. */
export function getPeakData(slug: string): Peak | null {
  ensureDiskCacheLoaded();
  const peak = peaks.find((entry) => entry.slug === slug);
  return peak ?? null;
}

export function getAllPeaks(): Peak[] {
  return peaks;
}

export type PeakSchemaResult = {
  schema: MountainSchema;
  hash: string;
  updatedAt: string;
  fromCache: boolean;
};

/**
 * Returns Mountain JSON-LD for a peak, using in-memory cache when the data hash matches.
 * Regenerates automatically when elevation, coordinates, intro, or related fields change.
 */
export function getPeakSchema(peak: Peak, siteUrl = SITE_URL): PeakSchemaResult | null {
  ensureDiskCacheLoaded();

  const validation = validatePeakData(peak, siteUrl);
  if (!validation.valid) {
    const isDev =
      (typeof import.meta !== 'undefined' &&
        'env' in import.meta &&
        (import.meta as ImportMeta).env?.DEV) ||
      process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.warn(
        `[schema] Skipping JSON-LD for ${peak.slug}: ${validation.errors.join('; ')}`,
      );
    }
    return null;
  }

  const hash = computePeakHash(peak, siteUrl);
  const cached = getSchema(peak.slug);

  if (cached && cached.hash === hash) {
    return {
      schema: cached.schema,
      hash: cached.hash,
      updatedAt: cached.updatedAt,
      fromCache: true,
    };
  }

  if (cached && cached.hash !== hash) {
    invalidateSchema(peak.slug);
  }

  const schema = generateMountainSchema(peak, siteUrl);
  const updatedAt = new Date().toISOString();
  const entry: SchemaCacheEntry = {
    schema,
    hash,
    updatedAt,
    peakName: peak.name,
  };

  cacheSchema(peak.slug, entry);

  return {
    schema,
    hash,
    updatedAt,
    fromCache: false,
  };
}

/**
 * Development helper: watch split peak data and invalidate cache when either file changes.
 * Astro dev server will regenerate schema on the next page request.
 */
export function watchPeakChanges(callback: (peakId: string) => void): FSWatcher | null {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') {
    return null;
  }

  if (peakDataWatchers) {
    return peakDataWatchers[0] ?? null;
  }

  const watchers: FSWatcher[] = [];

  try {
    for (const watchPath of PEAK_DATA_WATCH_PATHS) {
      watchers.push(
        fsWatch(watchPath, () => {
          for (const peak of peaks) {
            invalidateSchema(peak.slug);
            callback(peak.slug);
          }
          diskCacheLoaded = false;
          console.info(`[schema] peak data changed (${watchPath}) — schema cache invalidated`);
        }),
      );
    }

    peakDataWatchers = watchers;
    return watchers[0] ?? null;
  } catch (error) {
    for (const watcher of watchers) {
      watcher.close();
    }
    peakDataWatchers = null;
    console.warn('[schema] Could not watch peak data:', error);
    return null;
  }
}

/** Parse unknown JSON peak entries defensively. */
export function normalizePeak(value: unknown): Peak | null {
  return isPeak(value) ? value : null;
}
