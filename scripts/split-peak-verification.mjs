#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const peaksPath = path.join('src', 'data', 'peaks', 'peaks.json');
const verificationPath = path.join('src', 'data', 'peaks', 'verification.json');

const apply = process.argv.includes('--apply');

const peaks = JSON.parse(fs.readFileSync(peaksPath, 'utf8'));

if (!Array.isArray(peaks)) {
  throw new Error('Expected src/data/peaks/peaks.json to be an array');
}

const verification = peaks.map((peak) => ({
  slug: peak.slug,
  dataSource: peak.dataSource ?? null,
  verification: peak.verification ?? null,
}));

const slimPeaks = peaks.map((peak) => {
  const { dataSource, verification, ...rest } = peak;
  return rest;
});

console.log('Peak verification split preview');
console.log('-------------------------------');
console.log(`Source peaks:        ${peaks.length}`);
console.log(`Verification output: ${verificationPath}`);
console.log(`Mode:                ${apply ? 'apply' : 'dry run'}`);

if (!apply) {
  console.log('\nNo files written. Re-run with --apply to write the split files.');
  process.exit(0);
}

fs.writeFileSync(peaksPath, `${JSON.stringify(slimPeaks, null, 2)}\n`);
fs.writeFileSync(verificationPath, `${JSON.stringify(verification, null, 2)}\n`);

console.log('\nFiles written:');
console.log(`- ${peaksPath}`);
console.log(`- ${verificationPath}`);
