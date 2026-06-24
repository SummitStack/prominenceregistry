import fs from 'node:fs';
import path from 'node:path';
import peaksData from '../src/data/peaks.json';
import { SITE_URL } from '../src/lib/constants';
import { getPeakHeroImageUrl } from '../src/lib/schema-generator';

const publishedPeaks = peaksData.filter((peak) => peak.published === true);
const errors: string[] = [];

for (const peak of publishedPeaks) {
  const { slug, heroImage } = peak;

  if (typeof heroImage !== 'string' || heroImage.length === 0) {
    errors.push(`[${slug}] heroImage is required for published peaks`);
    continue;
  }

  if (!heroImage.startsWith('/')) {
    errors.push(`[${slug}] heroImage must start with / (got "${heroImage}")`);
    continue;
  }

  if (heroImage.includes('/raw/')) {
    errors.push(`[${slug}] heroImage must not reference /raw/`);
    continue;
  }

  const heroPublicPath = path.join('public', heroImage);
  if (!fs.existsSync(heroPublicPath)) {
    errors.push(`[${slug}] heroImage file missing: public${heroImage}`);
  }

  const seoImageUrl = getPeakHeroImageUrl(peak, SITE_URL);
  if (!seoImageUrl) {
    errors.push(`[${slug}] could not resolve SEO image URL`);
    continue;
  }

  if (!seoImageUrl.startsWith(`${SITE_URL}/`)) {
    errors.push(
      `[${slug}] SEO image URL must be absolute under ${SITE_URL}/ (got "${seoImageUrl}")`,
    );
  }

  if (seoImageUrl.includes('/raw/')) {
    errors.push(`[${slug}] SEO image URL must not reference /raw/`);
  }

  if (seoImageUrl.includes(`${SITE_URL}//`)) {
    errors.push(`[${slug}] SEO image URL contains double slash after origin`);
  }

  const seoPublicPath = path.join(
    'public',
    seoImageUrl.replace(SITE_URL, ''),
  );
  if (!fs.existsSync(seoPublicPath)) {
    errors.push(
      `[${slug}] SEO image file missing: ${seoPublicPath} (from "${seoImageUrl}")`,
    );
  }
}

if (errors.length > 0) {
  console.error('\n❌ SEO image validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ SEO images valid — ${publishedPeaks.length} published peaks passed hero image checks`,
);
