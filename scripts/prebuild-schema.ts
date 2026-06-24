/**
 * Prebuild: validate all peaks, generate Mountain JSON-LD, persist schema cache.
 *
 * Run via `npm run prebuild` before `astro build`.
 * Set SCHEMA_STRICT=1 to exit non-zero when any peak fails validation.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL } from '../src/lib/constants.ts';
import { validatePeakData } from '../src/lib/schema-generator.ts';
import { getPeakSchema, getAllPeaks, DISK_CACHE_PATH } from '../src/lib/peak-loader.ts';
import { exportCacheSnapshot } from '../src/lib/schema-cache.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const strictMode = process.env.SCHEMA_STRICT === '1';

function main(): void {
  const peaks = getAllPeaks();
  let validCount = 0;
  const errorLines: string[] = [];

  console.log(`\n[schema] Validating ${peaks.length} peaks…\n`);

  for (const peak of peaks) {
    const validation = validatePeakData(peak, SITE_URL);

    if (!validation.valid) {
      const message = `[VALIDATION ERROR] ${peak.name} (${peak.slug}): ${validation.errors.join('; ')}`;
      errorLines.push(message);
      console.log(`✗ ${peak.name}: ${validation.errors.join('; ')}`);
      continue;
    }

    const result = getPeakSchema(peak, SITE_URL);
    if (result) {
      validCount += 1;
      const cacheLabel = result.fromCache ? 'cached' : 'generated';
      console.log(`✓ ${peak.name}: Schema ${cacheLabel} & cached`);
    }
  }

  const snapshot = exportCacheSnapshot();
  mkdirSync(dirname(DISK_CACHE_PATH), { recursive: true });
  writeFileSync(DISK_CACHE_PATH, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`\n[schema] Wrote ${Object.keys(snapshot).length} entries → ${DISK_CACHE_PATH}`);
  console.log(
    `\nSummary: ${validCount}/${peaks.length} peaks valid. ${errorLines.length} error(s) found.`,
  );

  if (errorLines.length > 0) {
    if (strictMode) {
      console.error('\n[schema] SCHEMA_STRICT=1 — fix validation errors before deploying.\n');
      process.exit(1);
    }
    console.warn('\n[schema] Validation errors logged (build continues). Set SCHEMA_STRICT=1 to fail.\n');
  } else {
    console.log('\n[schema] All peaks valid.\n');
  }
}

main();
