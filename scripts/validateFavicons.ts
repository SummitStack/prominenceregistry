import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const FAVICON_VERSION = 'v=3';

const REQUIRED_PUBLIC_FILES = [
  'favicon.ico',
  'favicon.svg',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'apple-touch-icon.png',
  'site.webmanifest',
];

const REQUIRED_DIST_FILES = [...REQUIRED_PUBLIC_FILES];

const REQUIRED_INDEX_LINKS = [
  `/favicon.ico?${FAVICON_VERSION}`,
  `/favicon-16x16.png?${FAVICON_VERSION}`,
  `/favicon-32x32.png?${FAVICON_VERSION}`,
  `/favicon-48x48.png?${FAVICON_VERSION}`,
  `/favicon.svg?${FAVICON_VERSION}`,
  `/apple-touch-icon.png?${FAVICON_VERSION}`,
  `/site.webmanifest?${FAVICON_VERSION}`,
];

const FORBIDDEN_PATTERNS = [/\/assets\//, /\/_astro\//, /favicon\.[a-f0-9]{8,}\./i];

const errors: string[] = [];

function fileExists(dir: string, filename: string): boolean {
  return fs.existsSync(path.join(dir, filename));
}

for (const filename of REQUIRED_PUBLIC_FILES) {
  if (!fileExists(PUBLIC_DIR, filename)) {
    errors.push(`Missing public/${filename}`);
  }
}

for (const filename of REQUIRED_DIST_FILES) {
  if (!fileExists(DIST_DIR, filename)) {
    errors.push(`Missing dist/${filename}`);
  }
}

const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
if (fs.existsSync(icoPath)) {
  const ico = fs.readFileSync(icoPath);
  const isIco =
    ico.length >= 6 &&
    ico.readUInt16LE(0) === 0 &&
    ico.readUInt16LE(2) === 1 &&
    ico.readUInt16LE(4) >= 1;
  const isPng = ico[0] === 0x89 && ico.toString('ascii', 1, 4) === 'PNG';

  if (!isIco || isPng) {
    errors.push('public/favicon.ico is not a valid ICO container');
  } else {
    const imageCount = ico.readUInt16LE(4);
    const sizes: number[] = [];
    for (let index = 0; index < imageCount; index += 1) {
      const entryOffset = 6 + index * 16;
      const width = ico.readUInt8(entryOffset) || 256;
      const height = ico.readUInt8(entryOffset + 1) || 256;
      sizes.push(width === height ? width : Math.max(width, height));
    }

    for (const requiredSize of [16, 32, 48]) {
      if (!sizes.includes(requiredSize)) {
        errors.push(`public/favicon.ico is missing embedded ${requiredSize}x${requiredSize} image`);
      }
    }
  }
}

const indexHtmlPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  errors.push('Missing dist/index.html');
} else {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  for (const href of REQUIRED_INDEX_LINKS) {
    if (!indexHtml.includes(href)) {
      errors.push(`dist/index.html is missing favicon link: ${href}`);
    }
  }

  const faviconHrefs = [...indexHtml.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g)];
  for (const match of faviconHrefs) {
    const tag = match[0];
    const hrefMatch = tag.match(/href="([^"]+)"/);
    const href = hrefMatch?.[1] ?? '';
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(href)) {
        errors.push(`dist/index.html favicon link uses non-canonical path: ${href}`);
      }
    }
  }

  const faviconLinkCount = (indexHtml.match(/rel="icon"/g) ?? []).length;
  if (faviconLinkCount !== 5) {
    errors.push(`dist/index.html should contain exactly 5 rel="icon" links (found ${faviconLinkCount})`);
  }
}

if (errors.length > 0) {
  console.error('\n❌ Favicon validation failed:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  process.exit(1);
}

console.log(
  `✅ Favicon assets valid — public + dist files present, ICO embeds 16/32/48, homepage links use ?${FAVICON_VERSION}`,
);
