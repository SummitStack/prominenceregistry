import peaksData from '../src/data/peaks';
import {
  ABOUT_META_DESCRIPTION,
  ABOUT_META_TITLE,
  buildPeakSeoDescription,
  buildPeakSeoTitle,
  GLOSSARY_META_DESCRIPTION,
  GLOSSARY_META_TITLE,
  HOMEPAGE_META_DESCRIPTION,
  HOMEPAGE_META_TITLE,
  MAX_META_DESCRIPTION_LENGTH,
  MAX_META_TITLE_LENGTH,
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

function checkTitle(label: string, title: string): void {
  if (!title || title.trim().length === 0) {
    errors.push(`[${label}] title is required`);
    return;
  }

  if (title.length > MAX_META_TITLE_LENGTH) {
    errors.push(
      `[${label}] title is ${title.length} characters (max ${MAX_META_TITLE_LENGTH})`,
    );
  }
}

checkDescription('homepage', HOMEPAGE_META_DESCRIPTION);
checkDescription('glossary', GLOSSARY_META_DESCRIPTION);
checkDescription('about', ABOUT_META_DESCRIPTION);

checkTitle('homepage', HOMEPAGE_META_TITLE);
checkTitle('glossary', GLOSSARY_META_TITLE);
checkTitle('about', ABOUT_META_TITLE);

const publishedPeaks = peaksData.filter((peak) => peak.published === true);

for (const peak of publishedPeaks) {
  checkDescription(peak.slug, buildPeakSeoDescription(peak));
  checkTitle(peak.slug, buildPeakSeoTitle(peak));
}

if (errors.length > 0) {
  console.error('\n❌ SEO meta validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ SEO meta valid — ${publishedPeaks.length + 3} indexable pages: titles ≤ ${MAX_META_TITLE_LENGTH} chars, descriptions ≤ ${MAX_META_DESCRIPTION_LENGTH} chars`,
);
