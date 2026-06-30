import peaksData from '../src/data/peaks/peaks.json';
import routesData from '../src/data/peaks/routes.json';
import { PeaksArraySchema, PeakRoutesArraySchema } from '../src/data/peakSchema';

const peakResult = PeaksArraySchema.safeParse(peaksData);
const routeResult = PeakRoutesArraySchema.safeParse(routesData);
let failed = false;

if (!peakResult.success) {
  failed = true;
  console.error('\n❌ peak registry data validation failed:\n');
  peakResult.error.issues.forEach((issue) => {
    const path = issue.path.join(' → ');
    console.error(`  [${path}] ${issue.message}`);
  });
}

if (!routeResult.success) {
  failed = true;
  console.error('\n❌ peak route data validation failed:\n');
  routeResult.error.issues.forEach((issue) => {
    const path = issue.path.join(' → ');
    console.error(`  [${path}] ${issue.message}`);
  });
}

if (!failed) {
  const peakSlugs = new Set<string>();
  const routeSlugs = new Set<string>();

  for (const peak of peakResult.data) {
    if (peakSlugs.has(peak.slug)) {
      failed = true;
      console.error(`\n❌ duplicate peak slug "${peak.slug}"`);
    }

    peakSlugs.add(peak.slug);
  }

  for (const route of routeResult.data) {
    if (routeSlugs.has(route.slug)) {
      failed = true;
      console.error(`\n❌ duplicate route slug "${route.slug}"`);
    }

    routeSlugs.add(route.slug);

    if (!peakSlugs.has(route.slug)) {
      failed = true;
      console.error(`\n❌ route record "${route.slug}" does not match any peak slug`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `✅ peak data valid — ${peakResult.data.length} registry peaks and ${routeResult.data.length} optional route records passed validation`
);
