type PeakLike = {
  slug: string;
  published?: boolean;
  latitude?: number;
  longitude?: number;
  state: string;
  elevation: number;
  mountainRange?: string;
};

export type NearbyPeak<T extends PeakLike> = T & { distanceMiles?: number };

function hasValidCoordinates(entry: PeakLike): boolean {
  return (
    typeof entry.latitude === 'number' &&
    !Number.isNaN(entry.latitude) &&
    typeof entry.longitude === 'number' &&
    !Number.isNaN(entry.longitude)
  );
}

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function compareFallbackPeaks<T extends PeakLike>(current: T, a: T, b: T): number {
  const mountainRange = current.mountainRange;
  const aSameRange = mountainRange && a.mountainRange === mountainRange ? 0 : 1;
  const bSameRange = mountainRange && b.mountainRange === mountainRange ? 0 : 1;
  if (aSameRange !== bSameRange) return aSameRange - bSameRange;
  const aSameState = a.state === current.state ? 0 : 1;
  const bSameState = b.state === current.state ? 0 : 1;
  if (aSameState !== bSameState) return aSameState - bSameState;
  return Math.abs(a.elevation - current.elevation) - Math.abs(b.elevation - current.elevation);
}

function getFallbackNearbyPeaks<T extends PeakLike>(
  peak: T,
  peaksData: T[],
  excludeSlugs: Set<string>,
  limit: number,
): NearbyPeak<T>[] {
  return peaksData
    .filter(
      (candidate) =>
        candidate.slug !== peak.slug &&
        candidate.published === true &&
        !excludeSlugs.has(candidate.slug),
    )
    .sort((a, b) => compareFallbackPeaks(peak, a, b))
    .slice(0, limit);
}

export function getNearbyPeaksForPeak<T extends PeakLike>(
  peak: T,
  peaksData: T[],
  limit = 5,
): NearbyPeak<T>[] {
  const publishedCandidates = peaksData.filter(
    (candidate) => candidate.slug !== peak.slug && candidate.published === true,
  );

  if (!hasValidCoordinates(peak)) {
    return getFallbackNearbyPeaks(peak, peaksData, new Set(), limit);
  }

  const distanceBased: NearbyPeak<T>[] = publishedCandidates
    .filter(hasValidCoordinates)
    .map((candidate) => ({
      ...candidate,
      distanceMiles: getDistanceMiles(
        peak.latitude as number,
        peak.longitude as number,
        candidate.latitude as number,
        candidate.longitude as number,
      ),
    }))
    .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
    .slice(0, limit);

  if (distanceBased.length >= limit) {
    return distanceBased;
  }

  const usedSlugs = new Set(distanceBased.map((candidate) => candidate.slug));
  const fallback = getFallbackNearbyPeaks(
    peak,
    peaksData,
    usedSlugs,
    limit - distanceBased.length,
  );

  return [...distanceBased, ...fallback];
}
