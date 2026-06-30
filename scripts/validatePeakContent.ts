import peaksData from '../src/data/peaks/peaks.json';
import contentData from '../src/data/peaks/content.json';

type PeakRecord = {
  slug?: unknown;
  name?: unknown;
};

type ContentRecord = {
  slug?: unknown;
  overview?: unknown;
  routeDescription?: unknown;
  routeLandmarks?: unknown;
  permitsClimbing?: unknown;
  permitsCamping?: unknown;
  wildlife?: unknown;
  footnote?: unknown;
};

const peaks = peaksData as PeakRecord[];
const contentEntries = contentData as ContentRecord[];
const errors: string[] = [];

function labelForSlug(slug: string): string {
  const peak = peaks.find((entry) => entry.slug === slug);
  return typeof peak?.name === 'string' ? `${peak.name} (${slug})` : slug;
}

function validateOptionalString(value: unknown, path: string): void {
  if (value !== undefined && typeof value !== 'string') {
    errors.push(`[${path}] must be a string when present`);
  }
}

function validateOptionalStringArray(value: unknown, path: string): void {
  if (value === undefined) return;

  if (!Array.isArray(value)) {
    errors.push(`[${path}] must be an array when present`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      errors.push(`[${path}.${index}] must be a non-empty string`);
    }
  });
}

function validatePermitsCamping(value: unknown, path: string): void {
  if (value === undefined) return;

  if (typeof value === 'string') return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item !== 'string' || item.trim().length === 0) {
        errors.push(`[${path}.${index}] must be a non-empty string`);
      }
    });
    return;
  }

  errors.push(`[${path}] must be a string or an array of strings when present`);
}

const peakSlugs = new Set<string>();
for (const peak of peaks) {
  if (typeof peak.slug !== 'string' || peak.slug.trim().length === 0) {
    errors.push('[peaks] every peak must have a non-empty slug');
    continue;
  }

  if (peakSlugs.has(peak.slug)) {
    errors.push(`[peaks.${peak.slug}] duplicate peak slug`);
  }

  peakSlugs.add(peak.slug);
}

const contentSlugs = new Set<string>();
for (const entry of contentEntries) {
  if (typeof entry.slug !== 'string' || entry.slug.trim().length === 0) {
    errors.push('[content] every content entry must have a non-empty slug');
    continue;
  }

  const slug = entry.slug;

  if (contentSlugs.has(slug)) {
    errors.push(`[content.${slug}] duplicate content slug`);
  }

  contentSlugs.add(slug);

  if (!peakSlugs.has(slug)) {
    errors.push(`[content.${slug}] does not match any peak slug`);
  }

  validateOptionalStringArray(entry.overview, `content.${slug}.overview`);
  validateOptionalStringArray(entry.routeDescription, `content.${slug}.routeDescription`);
  validateOptionalStringArray(entry.routeLandmarks, `content.${slug}.routeLandmarks`);
  validateOptionalString(entry.permitsClimbing, `content.${slug}.permitsClimbing`);
  validatePermitsCamping(entry.permitsCamping, `content.${slug}.permitsCamping`);
  validateOptionalString(entry.wildlife, `content.${slug}.wildlife`);
  validateOptionalString(entry.footnote, `content.${slug}.footnote`);

  if (!Array.isArray(entry.overview) || entry.overview.length === 0) {
    errors.push(`[content.${slug}.overview] must contain at least one paragraph`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ peak content validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ peak content valid — ${contentEntries.length} optional content entries matched ${peaks.length} peaks`,
);
