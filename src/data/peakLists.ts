import peaks, { type Peak } from './peaks';

export type PeakListDefinition = {
  slug: string;
  title: string;
  description: string;
  getPeaks: () => Peak[];
};

export function getPublishedPeaks(): Peak[] {
  return peaks.filter((peak) => peak.published === true);
}

export function getAllPeaksByProminence(): Peak[] {
  return [...peaks].sort((a, b) => b.prominence - a.prominence);
}

export function getProminenceRankBySlug(): Map<string, number> {
  return new Map(
    getAllPeaksByProminence().map((peak, index) => [peak.slug, index + 1])
  );
}

export function getLower48Ultras(): Peak[] {
  return getAllPeaksByProminence().filter((peak) => peak.prominence >= 5000);
}

export function getLower48Top100Prominence(): Peak[] {
  return getAllPeaksByProminence().slice(0, 100);
}

export function getCaliforniaPeaksByProminence(): Peak[] {
  return getAllPeaksByProminence().filter((peak) => peak.state === 'CA');
}

export function getCaliforniaTop25Prominence(): Peak[] {
  return getCaliforniaPeaksByProminence().slice(0, 25);
}

export function getCalifornia3000Prominence(): Peak[] {
  return getCaliforniaPeaksByProminence().filter((peak) => peak.prominence >= 3000);
}

export const peakListDefinitions: PeakListDefinition[] = [
  {
    slug: 'lower-48-ultras',
    title: 'Lower 48 Ultra-Prominent Peaks',
    description:
      'The 57 ultra-prominent peaks of the contiguous United States, ranked by topographic prominence.',
    getPeaks: getLower48Ultras,
  },
  {
    slug: 'lower-48-top-100-prominence',
    title: 'Lower 48 Top 100 Prominence Peaks',
    description:
      'The 100 most prominent peaks in the contiguous United States, ranked by clean topographic prominence.',
    getPeaks: getLower48Top100Prominence,
  },
  {
    slug: 'california-top-25-prominence-peaks',
    title: "California's 25 Most Prominent Peaks",
    description:
      'The 25 California peaks with the greatest topographic prominence, ranked by prominence rather than elevation.',
    getPeaks: getCaliforniaTop25Prominence,
  },
  {
    slug: 'california-3000-foot-prominence-peaks',
    title: 'California 3,000-Foot Prominence Peaks',
    description:
      'Every California peak with at least 3,000 feet of topographic prominence, ranked by clean prominence.',
    getPeaks: getCalifornia3000Prominence,
  },
];

export function getPeakListDefinition(slug: string): PeakListDefinition | undefined {
  return peakListDefinitions.find((definition) => definition.slug === slug);
}
