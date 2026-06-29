import peaksData from './peaks/peaks.json';
import contentData from './peaks/content.json';

type PeakBase = (typeof peaksData)[number];
type PeakContent = (typeof contentData)[number];

const contentBySlug = new Map<string, PeakContent>(
  contentData.map((content) => [content.slug, content])
);

export const peaks = peaksData.map((peak) => ({
  ...peak,
  content: contentBySlug.get(peak.slug) ?? null,
}));

export type Peak = PeakBase & {
  content: PeakContent | null;
};

export default peaks;
