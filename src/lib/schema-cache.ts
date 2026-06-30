/**
 * In-memory schema cache keyed by peak slug.
 *
 * Avoids regenerating identical JSON-LD during a single build/dev session.
 * Pair with peak-loader hash checks so edits to split peak data invalidate entries.
 * Call invalidateSchema() or invalidateAllSchemas() after bulk data updates.
 */

import type { MountainSchema } from './schema-generator';

export type SchemaCacheEntry = {
  schema: MountainSchema;
  hash: string;
  updatedAt: string;
  peakName: string;
};

const memoryCache = new Map<string, SchemaCacheEntry>();

export function cacheSchema(peakId: string, entry: SchemaCacheEntry): void {
  memoryCache.set(peakId, entry);
}

export function getSchema(peakId: string): SchemaCacheEntry | null {
  return memoryCache.get(peakId) ?? null;
}

export function invalidateSchema(peakId: string): void {
  memoryCache.delete(peakId);
}

export function invalidateAllSchemas(): void {
  memoryCache.clear();
}

export function isSchemaCached(peakId: string): boolean {
  return memoryCache.has(peakId);
}

export function getCachedPeakIds(): string[] {
  return [...memoryCache.keys()];
}

export function getCacheSize(): number {
  return memoryCache.size;
}

/** Export entire in-memory cache (e.g. prebuild → disk persistence). */
export function exportCacheSnapshot(): Record<string, SchemaCacheEntry> {
  return Object.fromEntries(memoryCache.entries());
}

/** Hydrate in-memory cache from a persisted snapshot (e.g. disk file from prebuild). */
export function importCacheSnapshot(snapshot: Record<string, SchemaCacheEntry>): void {
  invalidateAllSchemas();
  for (const [peakId, entry] of Object.entries(snapshot)) {
    memoryCache.set(peakId, entry);
  }
}
