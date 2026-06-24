/**
 * Merges structured safety data from peaks-safety-data-full.json into peaks.json.
 * Run: node scripts/merge-safety-data.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/data');
const peaksPath = join(dataDir, 'peaks.json');
const safetyPath = join(dataDir, 'peaks-safety-data-full.json');

const VALID_HAZARDS = new Set([
  'altitude-sickness', 'avalanche', 'bears', 'bergschrund', 'class-4-climbing',
  'crevasse-fall', 'dehydration', 'exposure', 'heat-exhaustion', 'hypothermia',
  'lightning-exposure', 'loose-rock-scree', 'off-trail-navigation', 'rockfall',
  'scrambling-exposed', 'water-crossing', 'whiteout-conditions', 'wind-extreme-weather',
]);

const VALID_TECH = new Set([
  'alpine-start', 'glacier-travel', 'altitude-acclimatization', 'off-trail-nav',
  'rock-scrambling-loose', 'exposed-scrambling', 'snow-travel', 'water-crossings',
  'exposed-rock-climbing',
]);

const VALID_GEAR = new Set([
  'ice-axe', 'crampons', 'microspikes', 'helmet', 'avalanche-gear', 'rope-harness',
  'climbing-protection', 'belay-device', 'sunscreen', 'sunglasses', 'hat',
  'water-capacity', 'high-calorie-food', 'insulating-layer', 'shell-jacket',
  'shell-pants', 'insulating-hat', 'gloves', 'compass', 'emergency-comm',
  'duct-tape', 'gaiters', 'traction-descent', 'climbing-shoes', 'insect-repellent',
]);

function isClass4Plus(classValue) {
  if (!classValue) return false;
  const normalized = String(classValue).replace(/\s/g, '');
  return /^[45]/.test(normalized) || normalized.startsWith('4+') || normalized.startsWith('5+');
}

function validateEntry(entry, peak) {
  const errors = [];
  const { slug, hazards, technicalRequirements, requiredGear } = entry;

  if (hazards.length < 3 || hazards.length > 6) {
    errors.push(`hazards count ${hazards.length} (expected 3-6)`);
  }
  if (technicalRequirements.length < 2 || technicalRequirements.length > 5) {
    errors.push(`technicalRequirements count ${technicalRequirements.length} (expected 2-5)`);
  }
  if (requiredGear.priority.length < 5 || requiredGear.priority.length > 7) {
    errors.push(`priority gear count ${requiredGear.priority.length} (expected 5-7)`);
  }
  if (requiredGear.secondary.length < 3 || requiredGear.secondary.length > 6) {
    errors.push(`secondary gear count ${requiredGear.secondary.length} (expected 3-6)`);
  }

  for (const id of hazards) {
    if (!VALID_HAZARDS.has(id)) errors.push(`invalid hazard ID: ${id}`);
  }
  for (const id of technicalRequirements) {
    if (!VALID_TECH.has(id)) errors.push(`invalid technical requirement ID: ${id}`);
  }
  for (const id of [...requiredGear.priority, ...requiredGear.secondary]) {
    if (!VALID_GEAR.has(id)) errors.push(`invalid gear ID: ${id}`);
  }

  if (peak.elevation >= 12000 && !hazards.includes('altitude-sickness')) {
    const hasAcclimatization = technicalRequirements.includes('altitude-acclimatization');
    if (!hasAcclimatization) {
      errors.push('missing altitude-sickness for elevation >= 12000');
    }
  }
  if (peak.elevation >= 12000 && !technicalRequirements.includes('altitude-acclimatization')) {
    errors.push('missing altitude-acclimatization for elevation >= 12000');
  }

  const desertStates = new Set(['AZ', 'NV', 'NM', 'UT']);
  if (desertStates.has(peak.state)) {
    if (!requiredGear.priority.includes('water-capacity')) {
      errors.push('missing water-capacity for desert state');
    }
  }

  if (slug === 'mount-washington') {
    for (const id of ['hypothermia', 'whiteout-conditions', 'wind-extreme-weather']) {
      if (!hazards.includes(id)) errors.push(`mount-washington missing hazard: ${id}`);
    }
  }

  if (isClass4Plus(peak.ydsClass)) {
    if (!requiredGear.priority.includes('rope-harness')) {
      errors.push('class 4+ peak missing rope-harness in priority gear');
    }
    if (!requiredGear.priority.includes('climbing-protection')) {
      errors.push('class 4+ peak missing climbing-protection in priority gear');
    }
  }

  const glacierPeak =
    peak.difficulty >= 7 &&
    (hazards.includes('crevasse-fall') ||
      hazards.includes('bergschrund') ||
      technicalRequirements.includes('glacier-travel'));

  if (glacierPeak) {
    if (!technicalRequirements.includes('glacier-travel')) {
      errors.push('glacier peak missing glacier-travel');
    }
    if (!requiredGear.priority.includes('ice-axe')) {
      errors.push('glacier peak missing ice-axe in priority gear');
    }
    if (!requiredGear.priority.includes('crampons')) {
      errors.push('glacier peak missing crampons in priority gear');
    }
  }

  return errors;
}

function main() {
  const peaks = JSON.parse(readFileSync(peaksPath, 'utf8'));
  const safetyData = JSON.parse(readFileSync(safetyPath, 'utf8'));

  const safetyBySlug = new Map(safetyData.map((entry) => [entry.slug, entry]));
  const peakSlugs = new Set(peaks.map((p) => p.slug));

  const missingInSafety = peaks.filter((p) => !safetyBySlug.has(p.slug)).map((p) => p.slug);
  const extraInSafety = safetyData.filter((e) => !peakSlugs.has(e.slug)).map((e) => e.slug);

  if (missingInSafety.length > 0) {
    console.error('Missing safety data for peaks:', missingInSafety);
    process.exit(1);
  }
  if (extraInSafety.length > 0) {
    console.error('Extra safety entries not in peaks.json:', extraInSafety);
    process.exit(1);
  }

  let totalErrors = 0;
  for (const peak of peaks) {
    const entry = safetyBySlug.get(peak.slug);
    const errors = validateEntry(entry, peak);
    if (errors.length > 0) {
      console.error(`✗ ${peak.slug}:`);
      for (const err of errors) console.error(`  - ${err}`);
      totalErrors += errors.length;
    } else {
      console.log(`✓ ${peak.slug}`);
    }
  }

  if (totalErrors > 0) {
    console.error(`\nValidation failed with ${totalErrors} error(s).`);
    process.exit(1);
  }

  for (const peak of peaks) {
    const { hazards, technicalRequirements, requiredGear } = safetyBySlug.get(peak.slug);
    peak.hazards = hazards;
    peak.technicalRequirements = technicalRequirements;
    peak.requiredGear = requiredGear;
  }

  writeFileSync(peaksPath, `${JSON.stringify(peaks, null, 2)}\n`);
  console.log(`\nMerged safety data into ${peaks.length} peaks.`);
}

main();
