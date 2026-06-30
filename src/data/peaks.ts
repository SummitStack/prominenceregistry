import peaksData from './peaks/peaks.json';
import routesData from './peaks/routes.json';
import contentData from './peaks/content.json';
import verificationData from './peaks/verification.json';

type PeakBase = (typeof peaksData)[number];
type PeakRoute = (typeof routesData)[number];
type PeakContent = (typeof contentData)[number];
type PeakVerification = (typeof verificationData)[number];

const routeBySlug = new Map<string, PeakRoute>(
  routesData.map((route) => [route.slug, route])
);

const contentBySlug = new Map<string, PeakContent>(
  contentData.map((content) => [content.slug, content])
);

const verificationBySlug = new Map<string, PeakVerification>(
  verificationData.map((entry) => [entry.slug, entry])
);

export type Peak = PeakBase & Omit<PeakRoute, 'slug'> & {
  route: PeakRoute;
  content: PeakContent | null;
  dataSource: PeakVerification['dataSource'] | null;
  verification: PeakVerification['verification'] | null;
};

export const peaks: Peak[] = peaksData.map((peak) => {
  const route = routeBySlug.get(peak.slug);
  const verificationEntry = verificationBySlug.get(peak.slug);

  if (!route) {
    throw new Error(`Missing route data for peak "${peak.slug}"`);
  }

  return {
    ...peak,
    ...route,
    route,
    content: contentBySlug.get(peak.slug) ?? null,
    dataSource: verificationEntry?.dataSource ?? null,
    verification: verificationEntry?.verification ?? null,
  };
});

export default peaks;
