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
];

export function getPeakListDefinition(slug: string): PeakListDefinition | undefined {
  return peakListDefinitions.find((definition) => definition.slug === slug);
}
