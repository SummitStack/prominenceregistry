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

export function getProminenceRankBySlug(): Map<string, number> {
  return new Map(
    getPeaksByProminence().map((peak, index) => [peak.slug, index + 1])
  );
}

export function getPeaksByProminence(): Peak[] {
  return [...getPublishedPeaks()].sort((a, b) => b.prominence - a.prominence);
}

export function getPeaksByElevation(): Peak[] {
  return [...getPublishedPeaks()].sort((a, b) => b.elevation - a.elevation);
}

export function getPeaksByIsolation(): Peak[] {
  return [...getPublishedPeaks()].sort((a, b) => (b.isolation ?? 0) - (a.isolation ?? 0));
}

export function getPeaksByState(state: string): Peak[] {
  return getPeaksByProminence().filter((peak) => peak.state === state);
}

export function getPeaksOverElevation(elevation: number): Peak[] {
  return getPeaksByElevation().filter((peak) => peak.elevation >= elevation);
}

export function getPeaksOverProminence(prominence: number): Peak[] {
  return getPeaksByProminence().filter((peak) => peak.prominence >= prominence);
}

export function getClassOnePeaks(): Peak[] {
  return getPeaksByProminence().filter((peak) => peak.ydsClass === '1');
}

export function getClassTwoPeaks(): Peak[] {
  return getPeaksByProminence().filter((peak) => peak.ydsClass === '2' || peak.ydsClass === '2+');
}

export function getTechnicalPeaks(): Peak[] {
  return getPeaksByProminence().filter((peak) =>
    ['3', '3+', '4', '4+', '5'].includes(peak.ydsClass)
  );
}

export const peakListDefinitions: PeakListDefinition[] = [
  {
    slug: 'most-prominent',
    title: 'Most Prominent Peaks in the Lower 48',
    description: 'All 57 ultra-prominent peaks in the contiguous United States, ranked by topographic prominence.',
    getPeaks: getPeaksByProminence,
  },
  {
    slug: 'highest',
    title: 'Highest Ultra-Prominent Peaks in the Lower 48',
    description: 'Ultra-prominent peaks ranked by summit elevation.',
    getPeaks: getPeaksByElevation,
  },
  {
    slug: 'most-isolated',
    title: 'Most Isolated Ultra-Prominent Peaks',
    description: 'Ultra-prominent peaks ranked by topographic isolation.',
    getPeaks: getPeaksByIsolation,
  },
  {
    slug: 'over-10000-feet',
    title: 'Ultra-Prominent Peaks Over 10,000 Feet',
    description: 'Lower 48 ultra-prominent peaks with summit elevations of at least 10,000 feet.',
    getPeaks: () => getPeaksOverElevation(10000),
  },
  {
    slug: 'over-5000-prominence',
    title: 'Peaks With Over 5,000 Feet of Prominence',
    description: 'Ultra-prominent peaks in the Lower 48 with at least 5,000 feet of clean topographic prominence.',
    getPeaks: () => getPeaksOverProminence(5000),
  },
  {
    slug: 'class-1',
    title: 'Class 1 Ultra-Prominent Peaks',
    description: 'The least technical ultra-prominent peaks in the Lower 48, filtered by YDS Class 1 route ratings.',
    getPeaks: getClassOnePeaks,
  },
  {
    slug: 'class-2',
    title: 'Class 2 Ultra-Prominent Peaks',
    description: 'Ultra-prominent peaks with Class 2 or Class 2+ standard routes.',
    getPeaks: getClassTwoPeaks,
  },
  {
    slug: 'technical',
    title: 'Technical Ultra-Prominent Peaks',
    description: 'Ultra-prominent peaks with Class 3, Class 4, or Class 5 standard route ratings.',
    getPeaks: getTechnicalPeaks,
  },
];

export function getPeakListDefinition(slug: string): PeakListDefinition | undefined {
  return peakListDefinitions.find((definition) => definition.slug === slug);
}
