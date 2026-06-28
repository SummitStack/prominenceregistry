import type { Peak } from '../types/peak';

export const MAX_META_DESCRIPTION_LENGTH = 155;
export const MAX_META_TITLE_LENGTH = 80;

export const HOMEPAGE_META_TITLE =
  'Ultra-Prominent Peaks of the Lower 48 | Prominence Registry';

export const ABOUT_META_TITLE = 'About Prominence Registry | Ultra-Prominent Peak Guides';

export const GLOSSARY_META_TITLE =
  'Mountaineering & Topographic Glossary | Prominence Registry';

export const HOMEPAGE_META_DESCRIPTION =
  'Explore the 57 ultra-prominent peaks of the lower 48 with elevation, prominence, key col, isolation, route class, permits, and planning notes.';

export const GLOSSARY_META_DESCRIPTION =
  'Definitions of prominence, isolation, key col, YDS class, exposure, glacier travel, and other terms used throughout Prominence Registry.';

export const ABOUT_META_DESCRIPTION =
  'Learn why Prominence Registry publishes carefully sourced route, permit, and planning guides for the 57 ultra-prominent peaks of the lower 48.';

const PEAK_TITLE_OVERRIDES: Record<string, string> = {
  'mount-whitney': 'Mount Whitney – Prominence, Permits, and Hiking Routes',
  'mount-shasta': 'Mount Shasta – Prominence, Permits, and Hiking Routes',
  'grand-teton': 'Grand Teton – Prominence, Permits, and Climbing Routes',
  'mount-olympus': 'Mount Olympus – Prominence and Climbing Routes',
  'sierra-blanca-peak': 'Sierra Blanca Peak – Prominence, Access, and Hiking Routes',
  'mcdonald-peak': 'McDonald Peak – Prominence, Access, and Hiking Routes',
  'snowshoe-peak': 'Snowshoe Peak – Prominence and Climbing Routes',
};

/** Class 1–3 trail/scramble peaks that should not use the Climbing Routes title. */
const HIKE_ROUTE_SLUGS = new Set([
  'borah-peak',
  'cloud-peak',
  'diamond-peak',
  'humphreys-peak',
  'kings-peak',
  'mount-peale',
  'mount-san-antonio',
  'mount-timpanogos',
  'pilot-peak',
  'sacajawea-peak',
]);

const ACCESS_CONTENT_PATTERN =
  /\b(tribal land|tribal wilderness|flathead indian reservation|mescalero apache reservation|private land|private landowner|private ownership|refugium|closed to public|access restricted|special authorization|red squirrel|reservation land)\b/i;

const CLIMBING_TECHNIQUE_REQUIREMENTS = new Set([
  'glacier-travel',
  'exposed-rock-climbing',
  'exposed-scrambling',
  'rock-scrambling-loose',
]);

const CLIMBING_PRIORITY_GEAR = new Set([
  'rope-harness',
  'rope_harness',
  'climbing-protection',
  'ice-axe',
  'ice_axe',
  'crampons',
  'belay-device',
  'mountaineering_boots',
  'mountaineering-boots',
]);

function parseYdsClass(ydsClass: unknown): number | null {
  if (typeof ydsClass !== 'string' || ydsClass.trim().length === 0) {
    return null;
  }

  const normalized = ydsClass.trim().replace('+', '');
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPeakContentText(peak: Peak): string {
  const chunks: string[] = [];

  if (peak.content && typeof peak.content === 'object') {
    for (const value of Object.values(peak.content)) {
      if (Array.isArray(value)) {
        chunks.push(...value.filter((entry): entry is string => typeof entry === 'string'));
      } else if (typeof value === 'string') {
        chunks.push(value);
      }
    }
  }

  for (const field of ['safetyNote', 'callout', 'bestRoute', 'permitSeason', 'dataSource'] as const) {
    const value = peak[field];
    if (typeof value === 'string' && value.length > 0) {
      chunks.push(value);
    }
  }

  return chunks.join(' ');
}

function getRequiredGearPriority(peak: Peak): string[] {
  const requiredGear = peak.requiredGear;
  if (!requiredGear || typeof requiredGear !== 'object' || Array.isArray(requiredGear)) {
    return [];
  }

  const priority = (requiredGear as { priority?: unknown }).priority;
  return Array.isArray(priority)
    ? priority.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function isAccessSensitivePeak(peak: Peak): boolean {
  const content = getPeakContentText(peak);
  if (ACCESS_CONTENT_PATTERN.test(content)) {
    return true;
  }

  if (
    peak.permitStatus === 'limited' &&
    /\b(refugium|closed to public|special authorization|access restrict)\b/i.test(content)
  ) {
    return true;
  }

  return false;
}

function isTechnicalClimbingPeak(peak: Peak): boolean {
  const ydsClass = parseYdsClass(peak.ydsClass);
  if (ydsClass !== null && ydsClass >= 4) {
    return true;
  }

  const technicalRequirements = Array.isArray(peak.technicalRequirements)
    ? peak.technicalRequirements
    : [];
  if (technicalRequirements.some((requirement) => CLIMBING_TECHNIQUE_REQUIREMENTS.has(requirement))) {
    return true;
  }

  const priorityGear = getRequiredGearPriority(peak);
  if (priorityGear.some((item) => CLIMBING_PRIORITY_GEAR.has(item))) {
    return true;
  }

  if (
    Array.isArray(peak.hazards) &&
    peak.hazards.includes('class-4-climbing') &&
    ydsClass !== null &&
    ydsClass >= 3
  ) {
    return true;
  }

  const bestRoute = typeof peak.bestRoute === 'string' ? peak.bestRoute.toLowerCase() : '';
  if (/\b(couloir|glacier|summit block|technical climb)\b/.test(bestRoute)) {
    return true;
  }

  return false;
}

function isPermitHeavyPeak(peak: Peak): boolean {
  const permitStatus = peak.permitStatus;
  if (permitStatus === 'lottery' || permitStatus === 'fee' || permitStatus === 'limited') {
    return true;
  }

  if (peak.permitRequired !== true) {
    return false;
  }

  const content = getPeakContentText(peak).toLowerCase();
  return /\b(lottery|quota|wilderness permit|climbing permit|reservation fee|summit pass)\b/.test(
    content,
  );
}

function buildHikingRouteTitle(peak: Peak): string {
  if (isPermitHeavyPeak(peak)) {
    return `${peak.name} – Prominence, Permits, and Hiking Routes`;
  }
  return `${peak.name} – Prominence and Hiking Routes`;
}

export function buildPeakPageTitle(peak: Peak): string {
  const override = PEAK_TITLE_OVERRIDES[peak.slug];
  if (override) {
    return override;
  }

  const { name } = peak;

  if (isAccessSensitivePeak(peak)) {
    return `${name} – Prominence, Access, and Hiking Routes`;
  }

  if (HIKE_ROUTE_SLUGS.has(peak.slug)) {
    return buildHikingRouteTitle(peak);
  }

  if (isTechnicalClimbingPeak(peak)) {
    if (isPermitHeavyPeak(peak)) {
      return `${name} – Prominence, Permits, and Climbing Routes`;
    }
    return `${name} – Prominence and Climbing Routes`;
  }

  if (isPermitHeavyPeak(peak)) {
    return `${name} – Prominence, Permits, and Hiking Routes`;
  }

  return `${name} – Prominence and Hiking Routes`;
}

export function buildPeakSeoDescription(peak: Peak): string {
  const ydsClass =
    typeof peak.ydsClass === 'string' && peak.ydsClass.length > 0 ? peak.ydsClass : '—';
  const elevation = peak.elevation.toLocaleString('en-US');
  const prominence = peak.prominence.toLocaleString('en-US');
  const accessTail =
    peak.permitRequired === true
      ? 'permits, and planning notes.'
      : 'access, and planning notes.';

  const primary = `${peak.name} guide: ${elevation} ft elevation, ${prominence} ft prominence, Class ${ydsClass}, standard route, ${accessTail}`;

  if (primary.length <= MAX_META_DESCRIPTION_LENGTH) {
    return primary;
  }

  return `${peak.name}: ${elevation} ft elevation, ${prominence} ft prominence, Class ${ydsClass}, route and planning guide.`;
}

export function buildPeakSeoTitle(peak: Peak): string {
  return buildPeakPageTitle(peak);
}

export function getPeakPageTitleBucket(title: string): string {
  if (title.includes('Permits, and Climbing Routes')) {
    return 'Permits and Climbing Routes';
  }
  if (title.includes('Permits, and Hiking Routes')) {
    return 'Permits and Hiking Routes';
  }
  if (title.includes('Access, and Hiking Routes')) {
    return 'Access and Hiking Routes';
  }
  if (title.includes('and Climbing Routes')) {
    return 'Climbing Routes';
  }
  return 'Hiking Routes';
}
