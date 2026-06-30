import peaksData from '../src/data/peaks/peaks.json';
import verificationData from '../src/data/peaks/verification.json';

type PeakRecord = {
  slug?: unknown;
  name?: unknown;
};

type VerificationObject = {
  status?: unknown;
  lastChecked?: unknown;
  checkedAgainst?: unknown;
  notes?: unknown;
};

type VerificationRecord = {
  slug?: unknown;
  dataSource?: unknown;
  verification?: unknown;
};

const peaks = peaksData as PeakRecord[];
const verificationEntries = verificationData as VerificationRecord[];
const errors: string[] = [];

const allowedStatuses = new Set([
  'draft',
  'needs-review',
  'partially-verified',
  'verified',
  'stale',
]);

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

const verificationSlugs = new Set<string>();

for (const entry of verificationEntries) {
  if (typeof entry.slug !== 'string' || entry.slug.trim().length === 0) {
    errors.push('[verification] every verification entry must have a non-empty slug');
    continue;
  }

  const slug = entry.slug;

  if (verificationSlugs.has(slug)) {
    errors.push(`[verification.${slug}] duplicate verification slug`);
  }

  verificationSlugs.add(slug);

  if (!peakSlugs.has(slug)) {
    errors.push(`[verification.${slug}] does not match any peak slug`);
  }

  if (
    entry.dataSource !== null &&
    entry.dataSource !== undefined &&
    typeof entry.dataSource !== 'string'
  ) {
    errors.push(`[verification.${slug}.dataSource] must be a string or null`);
  }

  if (entry.verification === null || entry.verification === undefined) {
    continue;
  }

  if (typeof entry.verification !== 'object' || Array.isArray(entry.verification)) {
    errors.push(`[verification.${slug}.verification] must be an object or null`);
    continue;
  }

  const verification = entry.verification as VerificationObject;

  if (
    typeof verification.status !== 'string' ||
    !allowedStatuses.has(verification.status)
  ) {
    errors.push(`[verification.${slug}.verification.status] must be a valid status`);
  }

  if (
    verification.lastChecked !== null &&
    verification.lastChecked !== undefined &&
    typeof verification.lastChecked !== 'string'
  ) {
    errors.push(`[verification.${slug}.verification.lastChecked] must be a string or null`);
  }

  if (verification.checkedAgainst !== undefined) {
    if (!Array.isArray(verification.checkedAgainst)) {
      errors.push(`[verification.${slug}.verification.checkedAgainst] must be an array`);
    } else {
      verification.checkedAgainst.forEach((source, index) => {
        if (typeof source !== 'string' || source.trim().length === 0) {
          errors.push(
            `[verification.${slug}.verification.checkedAgainst.${index}] must be a non-empty string`,
          );
        }
      });
    }
  }

  if (
    verification.notes !== null &&
    verification.notes !== undefined &&
    typeof verification.notes !== 'string'
  ) {
    errors.push(`[verification.${slug}.verification.notes] must be a string or null`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ peak verification validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ peak verification valid — ${verificationEntries.length} optional verification entries matched ${peaks.length} peaks`,
);
