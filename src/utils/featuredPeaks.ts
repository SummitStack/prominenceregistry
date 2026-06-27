const FEATURED_ANCHOR_SLUGS = [
  'mount-rainier',
  'mount-whitney',
  'mount-shasta',
  'mount-elbert',
] as const;

const FEATURED_CURATED_POOL_SLUGS = [
  'grand-teton',
  'mount-hood',
  'pikes-peak',
  'mount-washington',
  'san-gorgonio-mountain',
  'san-jacinto-peak',
  'telescope-peak',
  'wheeler-peak',
  'kings-peak',
  'south-sister',
  'mount-baker',
  'glacier-peak',
] as const;

const FEATURED_ROTATION_EPOCH_UTC = Date.UTC(2026, 0, 5);
const FEATURED_ROTATION_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type FeaturedPeakSource = {
  slug: string;
};

function getRotationIndex(now: Date): number {
  const daysSinceEpoch = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - FEATURED_ROTATION_EPOCH_UTC) /
      MS_PER_DAY,
  );

  return Math.max(0, Math.floor(daysSinceEpoch / FEATURED_ROTATION_DAYS));
}

function takeRotatingItems<T>(items: T[], count: number, rotationIndex: number): T[] {
  if (items.length <= count) return items;

  const start = (rotationIndex * count) % items.length;

  return Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length]);
}

export function selectFeaturedPeaks<T extends FeaturedPeakSource>(eligiblePeaks: T[], now = new Date()): T[] {
  const peaksBySlug = new Map(eligiblePeaks.map((peak) => [peak.slug, peak]));
  const selectedSlugs = new Set<string>();
  const rotationIndex = getRotationIndex(now);

  const anchors = FEATURED_ANCHOR_SLUGS
    .map((slug) => peaksBySlug.get(slug))
    .filter((peak): peak is T => Boolean(peak));

  anchors.forEach((peak) => selectedSlugs.add(peak.slug));

  const curatedPool = FEATURED_CURATED_POOL_SLUGS
    .filter((slug) => !selectedSlugs.has(slug))
    .map((slug) => peaksBySlug.get(slug))
    .filter((peak): peak is T => Boolean(peak));

  const curated = takeRotatingItems(curatedPool, 2, rotationIndex);
  curated.forEach((peak) => selectedSlugs.add(peak.slug));

  const remainderPool = eligiblePeaks.filter((peak) => !selectedSlugs.has(peak.slug));
  const remainder = takeRotatingItems(remainderPool, 2, rotationIndex);

  return [...anchors, ...curated, ...remainder].slice(0, 8);
}
