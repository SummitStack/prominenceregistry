import peaksData from '../src/data/peaks.json';
import {
  ABOUT_META_DESCRIPTION,
  buildPeakSeoDescription,
  GLOSSARY_META_DESCRIPTION,
  HOMEPAGE_META_DESCRIPTION,
  MAX_META_DESCRIPTION_LENGTH,
} from '../src/lib/seoMeta.ts';

const errors: string[] = [];

function checkDescription(label: string, description: string): void {
  if (!description || description.trim().length === 0) {
    errors.push(`[${label}] meta description is required`);
    return;
  }

  if (description.length > MAX_META_DESCRIPTION_LENGTH) {
    errors.push(
      `[${label}] meta description is ${description.length} characters (max ${MAX_META_DESCRIPTION_LENGTH})`,
    );
  }
}

checkDescription('homepage', HOMEPAGE_META_DESCRIPTION);
checkDescription('glossary', GLOSSARY_META_DESCRIPTION);
checkDescription('about', ABOUT_META_DESCRIPTION);

const publishedPeaks = peaksData.filter((peak) => peak.published === true);

for (const peak of publishedPeaks) {
  checkDescription(peak.slug, buildPeakSeoDescription(peak));
}

if (errors.length > 0) {
  console.error('\n❌ SEO meta validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ SEO meta valid — ${publishedPeaks.length + 3} indexable pages under ${MAX_META_DESCRIPTION_LENGTH} characters`,
);
