#!/usr/bin/env node
/**
 * STEP 1: Fetch raw hero images from Wikimedia Commons.
 *
 * Downloads to public/images/peaks/raw/{slug}.jpg
 * (Astro serves public/ at the site root — /images/peaks/raw/...)
 *
 * Usage: node scripts/fetch-hero-images.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PEAKS_PATH = path.join(ROOT, 'src/data/peaks.ts');
const RAW_DIR = path.join(ROOT, 'public/images/peaks/raw');
const API_BASE = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  'ProminenceRegistry/1.0 (https://github.com/prominenceregistry/minor-mars; hero-image-fetcher)';

const MIN_WIDTH = 2000;
const MIN_HEIGHT = 800;
const SEARCH_LIMIT = 25;
const REQUEST_DELAY_MS = 400;

const EXCLUDE_TITLE =
  /\b(map|diagram|chart|logo|icon|emblem|stamp|coin|sketch|drawing|illustration|trail map|topographic|locator|squirrel|wildlife|flower|mushroom|sign|badge|patch|qr code|satellite|infrared|thermal)\b/i;

const PHOTO_BOOST =
  /\b(flickr|photo|photograph|panorama|aerial|view|summit|from|landscape|dslr|canon|nikon|sony)\b/i;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function commonsApi(params) {
  const url = new URL(API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Commons API HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.info ?? JSON.stringify(data.error));
  }

  return data;
}

function isLandscapePhoto(info) {
  if (info.mime !== 'image/jpeg') return false;
  if (info.width < MIN_WIDTH || info.height < MIN_HEIGHT) return false;
  return info.width > info.height;
}

function scoreCandidate(title, info, peakName) {
  const normalizedTitle = title.toLowerCase();
  const normalizedPeak = peakName.toLowerCase();
  let score = info.width * info.height;

  if (normalizedTitle.includes(normalizedPeak)) score *= 2.5;
  if (PHOTO_BOOST.test(title)) score *= 1.35;
  if (/\b(mountain|peak|mount)\b/i.test(title)) score *= 1.15;
  if (EXCLUDE_TITLE.test(title)) score = 0;

  return score;
}

function pickBestImage(pages, peakName) {
  let best = null;

  for (const page of Object.values(pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info || !isLandscapePhoto(info)) continue;

    const score = scoreCandidate(page.title, info, peakName);
    if (score <= 0) continue;

    if (!best || score > best.score) {
      best = {
        title: page.title,
        url: info.url,
        width: info.width,
        height: info.height,
        score,
      };
    }
  }

  return best;
}

async function searchImages(query, peakName) {
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: 6,
    gsrlimit: SEARCH_LIMIT,
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
  });

  return pickBestImage(data.query?.pages, peakName);
}

async function searchPeakImages(peakName) {
  const primary = await searchImages(`${peakName} mountain landscape`, peakName);
  if (primary) return primary;

  const fallbacks = [
    `${peakName} mountain`,
    `"${peakName}"`,
    `${peakName} peak landscape`,
  ];

  for (const query of fallbacks) {
    await sleep(REQUEST_DELAY_MS);
    const result = await searchImages(query, peakName);
    if (result) return result;
  }

  return null;
}

async function downloadImage(url, destPath) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Download failed HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });

  const peaks = JSON.parse(await fs.readFile(PEAKS_PATH, 'utf8'));
  const found = [];
  const missing = [];
  const skipped = [];

  console.log(`\nFetching raw hero images for ${peaks.length} peaks`);
  console.log(`Output: ${RAW_DIR}`);
  console.log(`Requirements: JPEG, landscape, >= ${MIN_WIDTH}px wide\n`);

  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    const destPath = path.join(RAW_DIR, `${peak.slug}.jpg`);

    process.stdout.write(`[${i + 1}/${peaks.length}] ${peak.name}... `);

    try {
      const existing = await fs.stat(destPath).catch(() => null);
      if (existing?.isFile()) {
        console.log('skipped (already exists)');
        skipped.push(peak);
        continue;
      }

      const image = await searchPeakImages(peak.name);

      if (!image) {
        console.log('FAILED — no suitable image');
        missing.push(peak);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      await downloadImage(image.url, destPath);
      console.log(`OK ${image.width}x${image.height}`);
      console.log(`    ${image.title}`);
      found.push({ peak, image });
    } catch (error) {
      console.log(`ERROR — ${error.message}`);
      missing.push(peak);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Downloaded:  ${found.length}`);
  console.log(`Skipped:     ${skipped.length} (raw file already present)`);
  console.log(`Need manual: ${missing.length}`);

  if (found.length > 0) {
    console.log('\n✓ Downloaded:');
    found.forEach(({ peak, image }) => {
      console.log(`  ${peak.slug} — ${image.width}x${image.height}`);
    });
  }

  if (missing.length > 0) {
    console.log('\n✗ Manual upload needed (save as public/images/peaks/raw/{slug}.jpg):');
    missing.forEach((peak) => {
      console.log(`  ${peak.slug} — ${peak.name}`);
    });
  }

  console.log('\nNext step: node scripts/optimize-images.js\n');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
