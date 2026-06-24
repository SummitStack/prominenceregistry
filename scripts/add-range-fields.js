import fs from 'node:fs';

const path = 'src/data/peaks.json';
const peaks = JSON.parse(fs.readFileSync(path, 'utf8'));

function fmtGain(n) {
  return n.toLocaleString('en-US');
}

function computeRanges(peak) {
  const { distance, gain, days, difficulty } = peak;
  const useRange = days > 1 || difficulty >= 7;

  let distanceMin = distance;
  let distanceMax = distance;
  if (useRange && distance >= 5) {
    distanceMin = Math.max(1, Math.round(distance * 0.88));
    distanceMax = Math.round(distance * 1.12);
    if (distanceMin >= distanceMax) {
      distanceMin = distance;
      distanceMax = distance;
    }
  }

  let gainMin = gain;
  let gainMax = gain;
  if (useRange) {
    gainMin = Math.round((gain * 0.88) / 50) * 50;
    gainMax = Math.round((gain * 1.12) / 50) * 50;
    if (gainMin >= gainMax) {
      gainMin = gain;
      gainMax = gain;
    }
  }

  let daysMin = days;
  let daysMax = days;
  let daysDisplay;
  if (days === 1) {
    daysDisplay = '1 day';
  } else {
    daysMin = days - 1;
    daysMax = days;
    daysDisplay = `${daysMin}–${daysMax} days`;
  }

  const distanceDisplay =
    distanceMin === distanceMax
      ? `${distance} miles round-trip`
      : `~${distanceMin}–${distanceMax} miles round-trip`;

  const gainDisplay =
    gainMin === gainMax
      ? `${fmtGain(gain)} ft`
      : `~${fmtGain(gainMin)}–${fmtGain(gainMax)} ft`;

  return {
    distanceMin,
    distanceMax,
    distanceDisplay,
    gainMin,
    gainMax,
    gainDisplay,
    daysMin,
    daysMax,
    daysDisplay,
  };
}

const updated = peaks.map((peak) => {
  const ranges = computeRanges(peak);
  const ordered = {};

  for (const [key, value] of Object.entries(peak)) {
    if (
      key.startsWith('distance') &&
      key !== 'distance' &&
      key !== 'distanceMin' &&
      key !== 'distanceMax' &&
      key !== 'distanceDisplay'
    ) {
      continue;
    }
    if (
      key.startsWith('gain') &&
      key !== 'gain' &&
      key !== 'gainMin' &&
      key !== 'gainMax' &&
      key !== 'gainDisplay'
    ) {
      continue;
    }
    if (
      key.startsWith('days') &&
      key !== 'days' &&
      key !== 'daysMin' &&
      key !== 'daysMax' &&
      key !== 'daysDisplay'
    ) {
      continue;
    }

    ordered[key] = value;

    if (key === 'days') {
      Object.assign(ordered, ranges);
    }
  }

  if (!('daysDisplay' in ordered)) {
    Object.assign(ordered, ranges);
  }

  return ordered;
});

for (const peak of updated) {
  if (peak.distanceMin > peak.distanceMax) throw new Error(`${peak.slug}: distance range invalid`);
  if (peak.gainMin > peak.gainMax) throw new Error(`${peak.slug}: gain range invalid`);
  if (peak.daysMin > peak.daysMax) throw new Error(`${peak.slug}: days range invalid`);
}

fs.writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`);
console.log(`Updated ${updated.length} peaks with range fields`);
