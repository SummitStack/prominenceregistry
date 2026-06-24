#!/usr/bin/env node
/**
 * Fetch specific Wikimedia Commons files into public/images/peaks/raw/{slug}.jpg
 *
 * Usage: node scripts/fetch-specific-hero-images.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'public/images/peaks/raw');
const LEGACY_DIR = path.join(ROOT, 'public/images/peaks');
const API_BASE = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  'ProminenceRegistry/1.0 (https://github.com/prominenceregistry/minor-mars; hero-image-fetcher)';

/** @type {Array<{ slug: string; file: string; commonsUrl: string }>} */
const TARGETS = [
  {
    slug: 'diamond-peak',
    file: 'Diamond-peak-from-birch-cr-campground-6-_26-2010-roger-peterson.jpg',
    commonsUrl:
      'https://commons.wikimedia.org/wiki/File:Diamond-peak-from-birch-cr-campground-6-_26-2010-roger-peterson.jpg',
  },
  {
    slug: 'flat-top-mountain',
    file: 'N_end_of_the_Oquirrh_Mountains_UT.jpg',
    commonsUrl:
      'https://commons.wikimedia.org/wiki/File:N_end_of_the_Oquirrh_Mountains_UT.jpg',
  },
  {
    slug: 'mount-stuart',
    file: 'Mount_Stuart_7814p.JPG',
    commonsUrl: 'https://commons.wikimedia.org/wiki/File:Mount_Stuart_7814p.JPG',
  },
  {
    slug: 'blanca-peak',
    file: 'Blanca_Peak_and_Ellingwood_Point.jpg',
    commonsUrl:
      'https://commons.wikimedia.org/wiki/File:Blanca_Peak_and_Ellingwood_Point.jpg',
  },
];

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

async function resolveImageUrl(fileTitle) {
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    titles: `File:${fileTitle}`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
  });

  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) {
    throw new Error(`No image URL for File:${fileTitle}`);
  }

  return {
    url: info.url,
    width: info.width,
    height: info.height,
    mime: info.mime,
    title: page.title,
  };
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

  for (const target of TARGETS) {
    process.stdout.write(`${target.slug}... `);

    const image = await resolveImageUrl(target.file);
    const rawPath = path.join(RAW_DIR, `${target.slug}.jpg`);
    await downloadImage(image.url, rawPath);

    const legacyPath = path.join(LEGACY_DIR, `${target.slug}.jpg`);
    await fs.copyFile(rawPath, legacyPath);

    console.log(`OK ${image.width}x${image.height} (${image.mime})`);
    console.log(`    ${image.title}`);
    console.log(`    ${target.commonsUrl}`);
  }

  console.log('\nNext: node scripts/optimize-images.js\n');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
