/**
 * Merges GNIS coordinates and safety data from user-provided peak list into peaks/peaks.json.
 * Run: node scripts/merge-coordinates-data.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const peaksPath = join(__dirname, '../src/data/peaks/peaks.json');
const safetyPath = join(dataDir, 'peaks-safety-data-full.json');

/** User-provided data keyed by peaks/peaks.json slug */
const MERGE_DATA = {
  'mount-rainier': {
    latitude: 46.8517,
    longitude: -121.7562,
    hazards: ['crevasse-fall', 'bergschrund', 'avalanche', 'hypothermia', 'whiteout-conditions', 'water-crossing'],
    technicalRequirements: ['glacier-travel', 'alpine-start', 'altitude-acclimatization', 'snow-travel'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket', 'sunscreen'],
      secondary: ['microspikes', 'gaiters', 'insulating-hat', 'water-capacity', 'high-calorie-food', 'emergency-comm'],
    },
  },
  'mount-whitney': {
    latitude: 36.5761,
    longitude: -118.292,
    hazards: ['altitude-sickness', 'lightning-exposure', 'exposure', 'scrambling-exposed', 'rockfall', 'dehydration'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start', 'off-trail-nav', 'exposed-scrambling'],
    requiredGear: {
      priority: ['sunscreen', 'sunglasses', 'hat', 'water-capacity', 'high-calorie-food', 'insulating-layer', 'shell-jacket'],
      secondary: ['compass', 'emergency-comm', 'duct-tape', 'gaiters', 'traction-descent'],
    },
  },
  'mount-elbert': {
    latitude: 39.1178,
    longitude: -106.445,
    hazards: ['altitude-sickness', 'hypothermia', 'lightning-exposure', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['high-calorie-food', 'sunscreen', 'compass', 'emergency-comm'],
    },
  },
  'mount-shasta': {
    latitude: 41.3093,
    longitude: -122.3103,
    hazards: ['crevasse-fall', 'avalanche', 'altitude-sickness', 'bergschrund', 'hypothermia', 'rockfall'],
    technicalRequirements: ['glacier-travel', 'snow-travel', 'altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket', 'sunscreen'],
      secondary: ['microspikes', 'gaiters', 'water-capacity', 'high-calorie-food', 'emergency-comm'],
    },
  },
  'mount-hood': {
    latitude: 45.3735,
    longitude: -121.697,
    hazards: ['crevasse-fall', 'bergschrund', 'avalanche', 'hypothermia', 'rockfall', 'exposure'],
    technicalRequirements: ['glacier-travel', 'snow-travel', 'alpine-start', 'exposed-scrambling'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket', 'sunscreen'],
      secondary: ['microspikes', 'gaiters', 'emergency-comm', 'compass'],
    },
  },
  'mount-baker': {
    latitude: 48.7762,
    longitude: -122.3369,
    hazards: ['crevasse-fall', 'avalanche', 'bergschrund', 'hypothermia', 'whiteout-conditions'],
    technicalRequirements: ['glacier-travel', 'snow-travel', 'alpine-start', 'altitude-acclimatization'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket', 'sunscreen'],
      secondary: ['microspikes', 'gaiters', 'water-capacity', 'emergency-comm'],
    },
  },
  'mount-jefferson-or': {
    latitude: 44.6725,
    longitude: -121.8028,
    hazards: ['crevasse-fall', 'avalanche', 'hypothermia', 'rockfall', 'altitude-sickness'],
    technicalRequirements: ['glacier-travel', 'snow-travel', 'alpine-start'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket'],
      secondary: ['microspikes', 'gaiters', 'water-capacity', 'high-calorie-food'],
    },
  },
  'kings-peak': {
    latitude: 40.7756,
    longitude: -110.3778,
    hazards: ['altitude-sickness', 'water-crossing', 'hypothermia', 'wind-extreme-weather', 'bears'],
    technicalRequirements: ['altitude-acclimatization', 'water-crossings', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'water-capacity', 'high-calorie-food'],
      secondary: ['compass', 'emergency-comm', 'duct-tape', 'insulating-hat'],
    },
  },
  'pikes-peak': {
    latitude: 38.8405,
    longitude: -104.8202,
    hazards: ['altitude-sickness', 'lightning-exposure', 'hypothermia', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'sunscreen', 'emergency-comm', 'high-calorie-food'],
    },
  },
  'blanca-peak': {
    latitude: 37.5771,
    longitude: -105.4858,
    hazards: ['altitude-sickness', 'hypothermia', 'lightning-exposure', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'sunscreen', 'high-calorie-food'],
    },
  },
  'mount-cleveland': {
    latitude: 47.6092,
    longitude: -112.3839,
    hazards: ['altitude-sickness', 'hypothermia', 'bears', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'high-calorie-food'],
    },
  },
  'glacier-peak': {
    latitude: 48.11,
    longitude: -121.1047,
    hazards: ['crevasse-fall', 'avalanche', 'altitude-sickness', 'hypothermia', 'bears', 'whiteout-conditions'],
    technicalRequirements: ['glacier-travel', 'snow-travel', 'altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['ice-axe', 'crampons', 'helmet', 'avalanche-gear', 'insulating-layer', 'shell-jacket', 'sunscreen'],
      secondary: ['microspikes', 'gaiters', 'water-capacity', 'emergency-comm'],
    },
  },
  'borah-peak': {
    latitude: 44.1308,
    longitude: -113.7514,
    hazards: ['altitude-sickness', 'class-4-climbing', 'exposure', 'rockfall', 'hypothermia'],
    technicalRequirements: ['exposed-rock-climbing', 'altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['rope-harness', 'climbing-protection', 'helmet', 'insulating-layer', 'shell-jacket'],
      secondary: ['climbing-shoes', 'compass', 'emergency-comm', 'gloves'],
    },
  },
  'gannett-peak': {
    latitude: 43.1825,
    longitude: -109.6272,
    hazards: ['altitude-sickness', 'class-4-climbing', 'exposure', 'crevasse-fall', 'avalanche'],
    technicalRequirements: ['exposed-rock-climbing', 'glacier-travel', 'altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['rope-harness', 'climbing-protection', 'ice-axe', 'crampons', 'helmet', 'avalanche-gear'],
      secondary: ['climbing-shoes', 'compass', 'emergency-comm', 'insulating-layer'],
    },
  },
  'grand-teton': {
    latitude: 43.741,
    longitude: -110.8025,
    hazards: ['altitude-sickness', 'class-4-climbing', 'exposure', 'rockfall', 'hypothermia'],
    technicalRequirements: ['exposed-rock-climbing', 'altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['rope-harness', 'climbing-protection', 'helmet', 'insulating-layer', 'shell-jacket'],
      secondary: ['climbing-shoes', 'compass', 'emergency-comm', 'gloves'],
    },
  },
  'wheeler-peak': {
    latitude: 39.0156,
    longitude: -114.3158,
    hazards: ['altitude-sickness', 'exposure', 'scrambling-exposed', 'off-trail-navigation', 'dehydration'],
    technicalRequirements: ['altitude-acclimatization', 'exposed-scrambling', 'off-trail-nav', 'alpine-start'],
    requiredGear: {
      priority: ['helmet', 'insulating-layer', 'shell-jacket', 'water-capacity', 'sunscreen'],
      secondary: ['compass', 'emergency-comm', 'gloves', 'hat'],
    },
  },
  'san-gorgonio-mountain': {
    latitude: 34.1119,
    longitude: -116.8219,
    hazards: ['altitude-sickness', 'heat-exhaustion', 'dehydration', 'exposure'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['sunscreen', 'sunglasses', 'hat', 'water-capacity', 'high-calorie-food'],
      secondary: ['compass', 'emergency-comm', 'insulating-layer', 'duct-tape'],
    },
  },
  'san-jacinto-peak': {
    latitude: 33.8186,
    longitude: -116.6792,
    hazards: ['altitude-sickness', 'heat-exhaustion', 'dehydration', 'lightning-exposure'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['sunscreen', 'sunglasses', 'hat', 'water-capacity', 'high-calorie-food'],
      secondary: ['compass', 'emergency-comm', 'insulating-layer'],
    },
  },
  'telescope-peak': {
    latitude: 36.2039,
    longitude: -117.0881,
    hazards: ['altitude-sickness', 'dehydration', 'heat-exhaustion', 'exposure'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start', 'off-trail-nav'],
    requiredGear: {
      priority: ['sunscreen', 'sunglasses', 'hat', 'water-capacity', 'high-calorie-food'],
      secondary: ['compass', 'emergency-comm', 'duct-tape'],
    },
  },
  'charleston-peak': {
    latitude: 36.3156,
    longitude: -115.6583,
    hazards: ['altitude-sickness', 'heat-exhaustion', 'dehydration', 'exposure'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['sunscreen', 'sunglasses', 'hat', 'water-capacity', 'high-calorie-food'],
      secondary: ['compass', 'emergency-comm', 'insulating-layer'],
    },
  },
  'star-peak': {
    latitude: 39.2342,
    longitude: -115.3306,
    hazards: ['altitude-sickness', 'exposure', 'scrambling-exposed', 'hypothermia'],
    technicalRequirements: ['altitude-acclimatization', 'exposed-scrambling', 'alpine-start'],
    requiredGear: {
      priority: ['helmet', 'insulating-layer', 'shell-jacket', 'gloves', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'duct-tape'],
    },
  },
  'north-schell-peak': {
    latitude: 39.2506,
    longitude: -115.3394,
    hazards: ['altitude-sickness', 'exposure', 'scrambling-exposed', 'hypothermia'],
    technicalRequirements: ['altitude-acclimatization', 'exposed-scrambling', 'alpine-start'],
    requiredGear: {
      priority: ['helmet', 'insulating-layer', 'shell-jacket', 'gloves', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'duct-tape'],
    },
  },
  'hayford-peak': {
    latitude: 39.0461,
    longitude: -115.4583,
    hazards: ['altitude-sickness', 'exposure', 'hypothermia', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'exposed-scrambling', 'alpine-start'],
    requiredGear: {
      priority: ['helmet', 'insulating-layer', 'shell-jacket', 'gloves', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'duct-tape'],
    },
  },
  'diamond-peak': {
    latitude: 42.6106,
    longitude: -114.1364,
    hazards: ['altitude-sickness', 'hypothermia', 'wind-extreme-weather', 'lightning-exposure'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'sunscreen'],
    },
  },
  'she-devil': {
    latitude: 45.0153,
    longitude: -116.1742,
    hazards: ['altitude-sickness', 'exposure', 'scrambling-exposed', 'hypothermia'],
    technicalRequirements: ['altitude-acclimatization', 'exposed-scrambling', 'alpine-start'],
    requiredGear: {
      priority: ['helmet', 'insulating-layer', 'shell-jacket', 'gloves', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'duct-tape'],
    },
  },
  'mount-nebo': {
    latitude: 39.8161,
    longitude: -111.6558,
    hazards: ['altitude-sickness', 'exposure', 'hypothermia', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'helmet'],
    },
  },
  'abercrombie-mountain': {
    // WA Selkirk prominence peak (user list coords pointed to a different feature)
    latitude: 48.9281,
    longitude: -118.2764,
    hazards: ['altitude-sickness', 'exposure', 'hypothermia', 'wind-extreme-weather'],
    technicalRequirements: ['altitude-acclimatization', 'alpine-start'],
    requiredGear: {
      priority: ['insulating-layer', 'shell-jacket', 'gloves', 'insulating-hat', 'water-capacity'],
      secondary: ['compass', 'emergency-comm', 'helmet'],
    },
  },
};

function main() {
  const peaks = JSON.parse(readFileSync(peaksPath, 'utf8'));
  let safetyData = JSON.parse(readFileSync(safetyPath, 'utf8'));
  const safetyBySlug = new Map(safetyData.map((entry) => [entry.slug, entry]));

  const merged = [];
  const unmatched = [];

  for (const peak of peaks) {
    const data = MERGE_DATA[peak.slug];
    if (!data) {
      unmatched.push(peak.slug);
      continue;
    }

    peak.latitude = data.latitude;
    peak.longitude = data.longitude;
    peak.hazards = data.hazards;
    peak.technicalRequirements = data.technicalRequirements;
    peak.requiredGear = data.requiredGear;

    const safetyEntry = safetyBySlug.get(peak.slug);
    if (safetyEntry) {
      safetyEntry.hazards = data.hazards;
      safetyEntry.technicalRequirements = data.technicalRequirements;
      safetyEntry.requiredGear = data.requiredGear;
    }

    merged.push(peak.slug);
  }

  writeFileSync(peaksPath, `${JSON.stringify(peaks, null, 2)}\n`);
  writeFileSync(safetyPath, `${JSON.stringify(safetyData, null, 2)}\n`);

  console.log(`Merged ${merged.length} peaks with coordinates and safety data.`);
  if (unmatched.length > 0) {
    console.log(`\nNo match in provided list (${unmatched.length} peaks — existing data retained):`);
    for (const slug of unmatched) console.log(`  - ${slug}`);
  }
}

main();
