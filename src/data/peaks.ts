import peaksData from './peaks/peaks.json';
import contentData from './peaks/content.json';
import verificationData from './peaks/verification.json';

type PeakBase = (typeof peaksData)[number];
type PeakContent = (typeof contentData)[number];
type PeakVerification = (typeof verificationData)[number];

const contentBySlug = new Map<string, PeakContent>(
  contentData.map((content) => [content.slug, content])
);

const verificationBySlug = new Map<string, PeakVerification>(
  verificationData.map((entry) => [entry.slug, entry])
);

export const peaks = peaksData.map((peak) => {
  const verificationEntry = verificationBySlug.get(peak.slug);

  return {
    ...peak,
    content: contentBySlug.get(peak.slug) ?? null,
    dataSource: verificationEntry?.dataSource ?? null,
    verification: verificationEntry?.verification ?? null,
  };
});

export type Peak = PeakBase & {
  content: PeakContent | null;
  dataSource: PeakVerification['dataSource'] | null;
  verification: PeakVerification['verification'] | null;
};

export default peaks;
