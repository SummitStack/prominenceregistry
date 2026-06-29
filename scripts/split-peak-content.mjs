#!/usr/bin/env node

/**
 * Split long-form peak article content out of src/data/peaks.json.
 *
 * What it does with --apply:
 * 1. Reads src/data/peaks.json
 * 2. Removes each peak.content object from the main peak records
 * 3. Writes slim records to src/data/peaks/peaks.json
 * 4. Writes extracted content records to src/data/peaks/content.json
 * 5. Writes src/data/peaks.ts as a compatibility join layer
 * 6. Optionally rewrites obvious imports from peaks.json to peaks.ts
 *
 * Dry run by default:
 *   node scripts/split-peak-content.mjs
 *
 * Apply changes:
 *   node scripts/split-peak-content.mjs --apply
 *
 * Apply and rewrite imports:
 *   node scripts/split-peak-content.mjs --apply --rewrite-imports
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const rewriteImports = args.has('--rewrite-imports');

const root = process.cwd();
const sourcePath = path.join(root, 'src/data/peaks.json');
const splitDir = path.join(root, 'src/data/peaks');
const slimPath = path.join(splitDir, 'peaks.json');
const contentPath = path.join(splitDir, 'content.json');
const joinedExportPath = path.join(root, 'src/data/peaks.ts');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walkFiles(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.astro', 'dist', '.git'].includes(entry.name)) continue;
      walkFiles(fullPath, extensions, results);
      continue;
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

function rewritePeakImports() {
  const extensions = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
  const files = walkFiles(path.join(root, 'src'), extensions);
  const changed = [];

  for (const filePath of files) {
    let text = fs.readFileSync(filePath, 'utf8');
    const before = text;

    // Handles imports such as:
    // import peaks from '../data/peaks.json'
    // import peaks from '../../data/peaks.json'
    // import peaks from '@/data/peaks.json'
    // import('../data/peaks.json')
    text = text.replace(/(['"])([^'"]*data\/peaks)\.json\1/g, '$1$2$1');

    if (text !== before) {
      fs.writeFileSync(filePath, text);
      changed.push(path.relative(root, filePath));
    }
  }

  return changed;
}

const peaks = readJson(sourcePath);
assert(Array.isArray(peaks), 'Expected src/data/peaks.json to be a JSON array.');

const seen = new Set();
const duplicateSlugs = [];
for (const peak of peaks) {
  if (!peak?.slug) throw new Error('Every peak must have a slug before splitting content.');
  if (seen.has(peak.slug)) duplicateSlugs.push(peak.slug);
  seen.add(peak.slug);
}
assert(duplicateSlugs.length === 0, `Duplicate slugs found: ${duplicateSlugs.join(', ')}`);

const slimPeaks = [];
const contentRecords = [];
let peaksWithContent = 0;

for (const peak of peaks) {
  const { content, ...slimPeak } = peak;
  slimPeaks.push(slimPeak);

  if (content && typeof content === 'object') {
    peaksWithContent += 1;
    contentRecords.push({
      slug: peak.slug,
      ...content,
    });
  } else {
    contentRecords.push({
      slug: peak.slug,
      overview: [],
      routeDescription: [],
      routeLandmarks: [],
      permitsClimbing: '',
      permitsCamping: '',
      wildlife: '',
      footnote: '',
    });
  }
}

const joinedExport = `import peaksData from './peaks/peaks.json';\nimport contentData from './peaks/content.json';\n\ntype PeakBase = (typeof peaksData)[number];\ntype PeakContent = (typeof contentData)[number];\n\nconst contentBySlug = new Map<string, PeakContent>(\n  contentData.map((content) => [content.slug, content])\n);\n\nexport const peaks = peaksData.map((peak) => ({\n  ...peak,\n  content: contentBySlug.get(peak.slug) ?? null,\n}));\n\nexport type Peak = PeakBase & {\n  content: PeakContent | null;\n};\n\nexport default peaks;\n`;

console.log('Peak content split preview');
console.log('--------------------------');
console.log(`Source peaks:      ${peaks.length}`);
console.log(`With content:      ${peaksWithContent}`);
console.log(`Slim output:       ${path.relative(root, slimPath)}`);
console.log(`Content output:    ${path.relative(root, contentPath)}`);
console.log(`Joined export:     ${path.relative(root, joinedExportPath)}`);
console.log(`Rewrite imports:   ${rewriteImports ? 'yes' : 'no'}`);
console.log(`Mode:              ${apply ? 'apply' : 'dry run'}`);

if (!apply) {
  console.log('\nNo files written. Re-run with --apply to write the split files.');
  process.exit(0);
}

fs.mkdirSync(splitDir, { recursive: true });
writeJson(slimPath, slimPeaks);
writeJson(contentPath, contentRecords);
fs.writeFileSync(joinedExportPath, joinedExport);

let rewritten = [];
if (rewriteImports) {
  rewritten = rewritePeakImports();
}

console.log('\nFiles written:');
console.log(`- ${path.relative(root, slimPath)}`);
console.log(`- ${path.relative(root, contentPath)}`);
console.log(`- ${path.relative(root, joinedExportPath)}`);

if (rewriteImports) {
  console.log('\nImport rewrites:');
  if (rewritten.length === 0) {
    console.log('- none found');
  } else {
    for (const file of rewritten) console.log(`- ${file}`);
  }
}

console.log('\nNext checks:');
console.log('- npm run build');
console.log('- grep -R "peaks.json" src || true');
console.log('- confirm peak pages still render peak.content.* through src/data/peaks.ts');
