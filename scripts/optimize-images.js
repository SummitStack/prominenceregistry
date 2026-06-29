#!/usr/bin/env node
/**
 * STEP 2: Optimize raw peak images into responsive WebP + JPEG variants.
 *
 * Input:  public/images/peaks/raw/{slug}.jpg
 * Output: public/images/peaks/optimized/{slug}-hero-*.{webp,jpg}
 *         public/images/peaks/optimized/{slug}-card-*.{webp,jpg}
 * Manifest: src/data/imageManifest.json
 *
 * Usage: node scripts/optimize-images.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PEAKS_PATH = path.join(ROOT, 'src/data/peaks.ts');
const RAW_DIR = path.join(ROOT, 'public/images/peaks/raw');
const LEGACY_DIR = path.join(ROOT, 'public/images/peaks');
const OPTIMIZED_DIR = path.join(ROOT, 'public/images/peaks/optimized');
const MANIFEST_PATH = path.join(ROOT, 'src/data/imageManifest.json');

const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

const VARIANTS = [
  { key: 'heroDesktop', suffix: 'hero-1440', width: 1440, height: 810 },
  { key: 'heroMobile', suffix: 'hero-768', width: 768, height: 432 },
  { key: 'cardDesktop', suffix: 'card-400', width: 400, height: 250 },
  { key: 'cardMobile', suffix: 'card-300', width: 300, height: 200 },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function resolveRawPath(slug) {
  const rawPath = path.join(RAW_DIR, `${slug}.jpg`);
  try {
    const stat = await fs.stat(rawPath);
    if (stat.isFile()) return { path: rawPath, source: 'raw' };
  } catch {
    // fall through
  }

  const legacyPath = path.join(LEGACY_DIR, `${slug}.jpg`);
  try {
    const stat = await fs.stat(legacyPath);
    if (stat.isFile()) return { path: legacyPath, source: 'legacy' };
  } catch {
    // fall through
  }

  return null;
}

async function generateVariant(inputPath, slug, variant) {
  const webpFilename = `${slug}-${variant.suffix}.webp`;
  const jpgFilename = `${slug}-${variant.suffix}.jpg`;
  const webpPath = path.join(OPTIMIZED_DIR, webpFilename);
  const jpgPath = path.join(OPTIMIZED_DIR, jpgFilename);

  const pipeline = sharp(inputPath).resize(variant.width, variant.height, {
    fit: 'cover',
    position: 'centre',
  });

  await pipeline.clone().webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpPath);
  await pipeline
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(jpgPath);

  const [webpStat, jpgStat] = await Promise.all([fs.stat(webpPath), fs.stat(jpgPath)]);

  return {
    key: variant.key,
    webp: `/images/peaks/optimized/${webpFilename}`,
    jpg: `/images/peaks/optimized/${jpgFilename}`,
    bytes: webpStat.size + jpgStat.size,
  };
}

async function optimizePeak(slug, inputPath) {
  const rawStat = await fs.stat(inputPath);
  const rawBytes = rawStat.size;
  let optimizedBytes = 0;
  const entry = {};

  for (const variant of VARIANTS) {
    const result = await generateVariant(inputPath, slug, variant);
    optimizedBytes += result.bytes;
    entry[variant.key] = { webp: result.webp, jpg: result.jpg };
  }

  return { entry, rawBytes, optimizedBytes };
}

async function main() {
  await fs.mkdir(OPTIMIZED_DIR, { recursive: true });
  await fs.mkdir(RAW_DIR, { recursive: true });

  const peaks = JSON.parse(await fs.readFile(PEAKS_PATH, 'utf8'));
  const manifest = {};
  const optimized = [];
  const missing = [];

  let totalRawBytes = 0;
  let totalOptimizedBytes = 0;

  console.log(`\nOptimizing images for ${peaks.length} peaks`);
  console.log(`Input:  ${RAW_DIR} (falls back to ${LEGACY_DIR})`);
  console.log(`Output: ${OPTIMIZED_DIR}\n`);

  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    process.stdout.write(`[${i + 1}/${peaks.length}] ${peak.slug}... `);

    try {
      const source = await resolveRawPath(peak.slug);

      if (!source) {
        console.log('SKIPPED — no raw image');
        missing.push(peak);
        continue;
      }

      const { entry, rawBytes, optimizedBytes } = await optimizePeak(peak.slug, source.path);
      manifest[peak.slug] = entry;

      totalRawBytes += rawBytes;
      totalOptimizedBytes += optimizedBytes;

      const savings = ((1 - optimizedBytes / rawBytes) * 100).toFixed(1);
      console.log(
        `OK (${source.source}) ${formatBytes(rawBytes)} → ${formatBytes(optimizedBytes)} (${savings}% smaller per source file, 8 variants)`
      );
      optimized.push(peak);
    } catch (error) {
      console.log(`ERROR — ${error.message}`);
      missing.push(peak);
    }
  }

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('\n═══════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Optimized:   ${optimized.length} peaks (${optimized.length * 8} files)`);
  console.log(`Missing raw: ${missing.length}`);
  console.log(`Raw total:   ${formatBytes(totalRawBytes)} (source files only)`);
  console.log(`Output total: ${formatBytes(totalOptimizedBytes)} (all WebP + JPEG variants)`);
  if (totalRawBytes > 0) {
    const savingsPct = ((1 - totalOptimizedBytes / totalRawBytes) * 100).toFixed(1);
    console.log(`Total savings: ${savingsPct}% vs raw source files (${formatBytes(totalRawBytes)} → ${formatBytes(totalOptimizedBytes)})`);
  }
  console.log(
    `Avg per peak: ${optimized.length ? formatBytes(totalOptimizedBytes / optimized.length) : '0 B'} optimized vs ${optimized.length ? formatBytes(totalRawBytes / optimized.length) : '0 B'} raw`
  );

  if (missing.length > 0) {
    console.log('\n✗ Still need raw images:');
    missing.forEach((peak) => {
      console.log(`  public/images/peaks/raw/${peak.slug}.jpg`);
    });
  }

  console.log(`\nManifest written: ${MANIFEST_PATH}\n`);
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
