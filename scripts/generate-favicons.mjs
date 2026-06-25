#!/usr/bin/env node
/**
 * Generate raster favicon assets from public/favicon.svg
 *
 * Usage: node scripts/generate-favicons.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function writePng(size, filename) {
  const outputPath = path.join(PUBLIC_DIR, filename);
  await sharp(SVG_PATH)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
  console.log(`Wrote ${filename} (${size}x${size})`);
  return outputPath;
}

/**
 * Build a Windows ICO container embedding PNG image data (Vista+ compatible).
 */
function createIcoFromSizedPngs(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const normalized = entries.map((entry) => {
    const record = { size: entry.size, buffer: entry.buffer, offset };
    offset += entry.buffer.length;
    return record;
  });

  const file = Buffer.alloc(offset);
  let position = 0;

  file.writeUInt16LE(0, position);
  position += 2;
  file.writeUInt16LE(1, position);
  position += 2;
  file.writeUInt16LE(count, position);
  position += 2;

  for (const entry of normalized) {
    const dimension = entry.size >= 256 ? 0 : entry.size;
    file.writeUInt8(dimension, position);
    position += 1;
    file.writeUInt8(dimension, position);
    position += 1;
    file.writeUInt8(0, position);
    position += 1;
    file.writeUInt8(0, position);
    position += 1;
    file.writeUInt16LE(1, position);
    position += 2;
    file.writeUInt16LE(32, position);
    position += 2;
    file.writeUInt32LE(entry.buffer.length, position);
    position += 4;
    file.writeUInt32LE(entry.offset, position);
    position += 4;
  }

  for (const entry of normalized) {
    entry.buffer.copy(file, entry.offset);
  }

  return file;
}

async function writeIcoFromPngFiles(pngPaths) {
  const entries = await Promise.all(
    pngPaths.map(async ({ size, filename }) => {
      const filePath = path.join(PUBLIC_DIR, filename);
      const buffer = await fs.readFile(filePath);
      if (buffer[0] !== 0x89 || buffer.toString('ascii', 1, 4) !== 'PNG') {
        throw new Error(`${filename} is not a PNG file`);
      }
      return { size, buffer };
    }),
  );

  const ico = createIcoFromSizedPngs(entries);
  const outputPath = path.join(PUBLIC_DIR, 'favicon.ico');
  await fs.writeFile(outputPath, ico);
  console.log(`Wrote favicon.ico (${entries.map((entry) => entry.size).join(', ')}px)`);
}

async function main() {
  await writePng(16, 'favicon-16x16.png');
  await writePng(32, 'favicon-32x32.png');
  await writePng(48, 'favicon-48x48.png');
  await writePng(192, 'favicon-192x192.png');
  await writePng(512, 'favicon-512x512.png');
  await writePng(180, 'apple-touch-icon.png');

  await writeIcoFromPngFiles([
    { size: 16, filename: 'favicon-16x16.png' },
    { size: 32, filename: 'favicon-32x32.png' },
    { size: 48, filename: 'favicon-48x48.png' },
  ]);
}

main().catch((error) => {
  console.error('Failed to generate favicons:', error);
  process.exit(1);
});
