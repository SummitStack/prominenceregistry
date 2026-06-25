#!/usr/bin/env node
/**
 * Download hero images for selected peaks and create optimized variants.
 * Usage: node scripts/fetch-and-optimize-selected-peaks.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'public/images/peaks/raw');
const OPTIMIZED_DIR = path.join(ROOT, 'public/images/peaks/optimized');
const MANIFEST_PATH = path.join(ROOT, 'src/data/imageManifest.json');
const LOG_PATH = path.join(ROOT, 'public/images/peaks/optimization-log.json');

const USER_AGENT =
  'ProminenceRegistry/1.0 (https://github.com/prominenceregistry/minor-mars; image-fetcher)';

const WEBP_QUALITY = 90;
const JPEG_QUALITY = 85;

const PEAKS = [
  {
    slug: 'deseret-peak',
    source: {
      type: 'local',
      path: path.join(ROOT, 'public/images/peaks/raw-sources/deseret-peak-hero.png'),
      requestedUrl: 'user-provided hero image',
    },
  },
];

const VARIANTS = [
  { manifestKey: 'heroDesktop', variantKey: 'hero-1440', suffix: 'hero-1440', width: 1440, height: 810 },
  { manifestKey: 'heroMobile', variantKey: 'hero-768', suffix: 'hero-768', width: 768, height: 432 },
  { manifestKey: 'cardDesktop', variantKey: 'card-400', suffix: 'card-400', width: 400, height: 250 },
  { manifestKey: 'cardMobile', variantKey: 'card-300', suffix: 'card-300', width: 300, height: 200 },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ratio(original, compressed) {
  if (original === 0) return '0%';
  return `${((1 - compressed / original) * 100).toFixed(1)}%`;
}

async function getWikimediaUrl(filename) {
  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php');
  apiUrl.searchParams.set('action', 'query');
  apiUrl.searchParams.set('titles', `File:${filename}`);
  apiUrl.searchParams.set('prop', 'imageinfo');
  apiUrl.searchParams.set('iiprop', 'url');
  apiUrl.searchParams.set('format', 'json');

  const response = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Commons API HTTP ${response.status}`);

  const data = await response.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) throw new Error(`No image URL for File:${filename}`);
  return info.url;
}

async function downloadToFile(url, destPath) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Download failed HTTP ${response.status} for ${url}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destPath, buffer);
  return buffer.length;
}

async function getFlickrUrl(pageUrl) {
  const sizesUrl = pageUrl.replace(/\/?$/, '/sizes/o/');
  const sizesResponse = await fetch(sizesUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (sizesResponse.ok) {
    const sizesHtml = await sizesResponse.text();
    const originalMatch = sizesHtml.match(
      /https:\/\/live\.staticflickr\.com\/\d+\/\d+_[a-f0-9]+_o\.jpg/
    );
    if (originalMatch?.[0]) return originalMatch[0];
  }

  const response = await fetch(pageUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Flickr page HTTP ${response.status}`);

  const html = await response.text();
  const ogMatch = html.match(/property="og:image" content="([^"]+)"/);
  if (ogMatch?.[1]) return ogMatch[1];

  const staticMatches = [
    ...html.matchAll(/https:\/\/live\.staticflickr\.com\/\d+\/\d+_[a-f0-9]+_[a-z]\.jpg/g),
  ].map((match) => match[0]);
  const unique = [...new Set(staticMatches)];
  const preferred =
    unique.find((url) => /_k\.jpg$/.test(url)) ??
    unique.find((url) => /_[bc]\.jpg$/.test(url)) ??
    unique.sort((a, b) => b.length - a.length)[0];
  if (preferred) return preferred;

  throw new Error(`No image URL found on Flickr page ${pageUrl}`);
}

async function resolveSourceUrl(source) {
  if (source.type === 'wikimedia') {
    return getWikimediaUrl(source.file);
  }
  if (source.type === 'flickr') {
    return getFlickrUrl(source.pageUrl);
  }
  if (source.type === 'url') {
    return source.url;
  }
  if (source.type === 'local') {
    return source.path;
  }
  throw new Error(`Unknown source type: ${source.type}`);
}

async function saveRawFromSource(source, destPath) {
  if (source.type === 'local') {
    await sharp(source.path).jpeg({ quality: 95, mozjpeg: true }).toFile(destPath);
    const stat = await fs.stat(destPath);
    return stat.size;
  }

  const sourceUrl = await resolveSourceUrl(source);
  return downloadToFile(sourceUrl, destPath);
}

const HERO_CONTAIN_BG = { r: 16, g: 20, b: 24 };

async function generateVariant(inputPath, slug, variant, peak = {}) {
  const webpFilename = `${slug}-${variant.suffix}.webp`;
  const jpgFilename = `${slug}-${variant.suffix}.jpg`;
  const webpPath = path.join(OPTIMIZED_DIR, webpFilename);
  const jpgPath = path.join(OPTIMIZED_DIR, jpgFilename);

  const height = variant.height ?? Math.round(variant.width * (9 / 16));
  const isHero = variant.variantKey.startsWith('hero-');
  const useContain = isHero && peak.heroFit === 'contain';

  let pipeline;
  if (useContain) {
    const { data, info } = await sharp(inputPath)
      .resize(variant.width, height, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    const padTop = Math.floor((height - info.height) / 2);
    const padLeft = Math.floor((variant.width - info.width) / 2);

    pipeline = sharp(data).extend({
      top: padTop,
      bottom: height - info.height - padTop,
      left: padLeft,
      right: variant.width - info.width - padLeft,
      background: HERO_CONTAIN_BG,
    });
  } else {
    pipeline = sharp(inputPath).resize(variant.width, height, {
      fit: 'cover',
      position: 'centre',
    });
  }

  await pipeline.clone().webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(webpPath);
  await pipeline.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpgPath);

  const [webpStat, jpgStat] = await Promise.all([fs.stat(webpPath), fs.stat(jpgPath)]);

  return {
    variantKey: variant.variantKey,
    manifestKey: variant.manifestKey,
    webp: `/images/peaks/optimized/${webpFilename}`,
    jpg: `/images/peaks/optimized/${jpgFilename}`,
    webpBytes: webpStat.size,
    jpgBytes: jpgStat.size,
  };
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(OPTIMIZED_DIR, { recursive: true });

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const log = { generatedAt: new Date().toISOString(), peaks: {} };

  console.log('\nFetching and optimizing selected peak images\n');

  for (const peak of PEAKS) {
    const { slug } = peak;
    console.log(`=== ${slug} ===`);

    const rawPath = path.join(RAW_DIR, `${slug}.jpg`);
    const sourceUrl =
      peak.source.type === 'local' ? peak.source.path : await resolveSourceUrl(peak.source);
    if (peak.source.requestedUrl) {
      console.log(`  Requested: ${peak.source.requestedUrl}`);
    }
    if (peak.source.type === 'local') {
      console.log(`  Local source: ${sourceUrl}`);
    } else {
      console.log(`  Download: ${sourceUrl}`);
    }

    const rawBytes = await saveRawFromSource(peak.source, rawPath);
    console.log(`  Raw saved: ${rawPath} (${formatBytes(rawBytes)})`);

    const manifestEntry = {
      slug,
      raw: `${slug}.jpg`,
      variants: {},
    };
    const manifestCompat = {};
    const variantLog = [];

    for (const variant of VARIANTS) {
      const result = await generateVariant(rawPath, slug, variant, peak);
      manifestEntry.variants[result.variantKey] = {
        webp: `${slug}-${variant.suffix}.webp`,
        jpg: `${slug}-${variant.suffix}.jpg`,
      };
      manifestCompat[result.manifestKey] = {
        webp: result.webp,
        jpg: result.jpg,
      };

      const variantTotal = result.webpBytes + result.jpgBytes;
      variantLog.push({
        variant: result.variantKey,
        webp: { bytes: result.webpBytes, size: formatBytes(result.webpBytes) },
        jpg: { bytes: result.jpgBytes, size: formatBytes(result.jpgBytes) },
        combined: { bytes: variantTotal, size: formatBytes(variantTotal) },
        compressionRatio: ratio(rawBytes, variantTotal),
      });

      console.log(
        `  ${result.variantKey}: webp ${formatBytes(result.webpBytes)}, jpg ${formatBytes(result.jpgBytes)} (${ratio(rawBytes, variantTotal)} vs raw)`
      );
    }

    const optimizedTotal = variantLog.reduce((sum, v) => sum + v.combined.bytes, 0);
    log.peaks[slug] = {
      requestedUrl: peak.source.requestedUrl ?? peak.source.pageUrl ?? null,
      sourceUrl,
      raw: { bytes: rawBytes, size: formatBytes(rawBytes) },
      optimizedTotal: { bytes: optimizedTotal, size: formatBytes(optimizedTotal) },
      overallCompressionRatio: ratio(rawBytes * VARIANTS.length, optimizedTotal),
      variants: variantLog,
      manifestEntry,
    };

    manifest[slug] = manifestCompat;
    console.log('');
  }

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await fs.writeFile(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`, 'utf8');

  console.log('═══════════════════════════════════════');
  console.log(`Manifest updated: ${MANIFEST_PATH}`);
  console.log(`Optimization log: ${LOG_PATH}`);
  console.log('Done.\n');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
