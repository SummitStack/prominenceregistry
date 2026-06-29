import type { Peak } from '../types/peak';

export const MAX_META_DESCRIPTION_LENGTH = 155;
export const MAX_META_TITLE_LENGTH = 80;

export const HOMEPAGE_META_TITLE =
  '57 Ultra-Prominent Peaks of the Lower 48: Ranked List & Route Guides';

export const ABOUT_META_TITLE = 'About Prominence Registry | Ultra-Prominent Peak Guides';

export const GLOSSARY_META_TITLE =
  'Mountaineering & Topographic Glossary | Prominence Registry';

export const HOMEPAGE_META_DESCRIPTION =
  'A ranked guide to all 57 lower-48 ultra-prominent peaks, with elevation, prominence, routes, permits, difficulty, hazards, and planning notes.';

export const GLOSSARY_META_DESCRIPTION =
  'Definitions of prominence, isolation, key col, YDS class, exposure, glacier travel, and other terms used throughout Prominence Registry.';

export const ABOUT_META_DESCRIPTION =
  'Learn why Prominence Registry publishes carefully sourced route, permit, and planning guides for the 57 ultra-prominent peaks of the lower 48.';

const PEAK_TITLE_OVERRIDES: Record<string, string> = {
  'mount-rainier': 'Mount Rainier Climbing Guide: Permits, Route, Gear & Hazards',
  'mount-whitney': 'Mount Whitney Hiking Guide: Permits, Route, Elevation & Difficulty',
  'mount-shasta': 'Mount Shasta Climbing Guide: Permits, Route, Gear & Hazards',
  'grand-teton': 'Grand Teton Climbing Guide: Route, Permits, Gear & Hazards',
  'mount-olympus': 'Mount Olympus Climbing Guide: Route, Permits, Gear & Hazards',
  'kings-peak': 'Kings Peak Hiking Guide: Route, Permits, Elevation & Difficulty',
  'pikes-peak': 'Pikes Peak Hiking Guide: Route, Elevation & Difficulty',
  'mount-mitchell': 'Mount Mitchell Hiking Guide: Route, Elevation & Difficulty',
  'mount-cleveland': 'Mount Cleveland Climbing Guide: Route, Access, Gear & Hazards',
  'sierra-blanca-peak': 'Sierra Blanca Peak Access Guide: Route, Permits & Planning',
  'mcdonald-peak': 'McDonald Peak Access Guide: Route, Permits & Planning',
  'snowshoe-peak': 'Snowshoe Peak Climbing Guide: Route, Gear & Hazards',
  'south-sister': 'South Sister Hiking Guide: Permits, Route & Difficulty',
};

const PEAK_DESCRIPTION_OVERRIDES: Record<string, string> = {
  'mount-rainier':
    'Plan Mount Rainier via Disappointment Cleaver with permits, camps, glacier gear, hazards, season timing, and summit logistics.',
  'mount-whitney':
    'Plan Mount Whitney with the main trail route, lottery permit rules, camps, mileage, gain, altitude risks, and summit-day logistics.',
  'mount-shasta':
    'Avalanche Gulch guide with summit pass rules, Bunny Flat approach, Helen Lake camping, spring snow gear, hazards, and season timing.',
  'grand-teton':
    'Plan Grand Teton with route options, climbing permits, camping zones, technical gear, exposure, hazards, and season timing.',
  'mount-olympus':
    'Plan Mount Olympus with Blue Glacier access, wilderness permits, camps, glacier travel, summit block climbing, and approach mileage.',
  'kings-peak':
    'Plan Kings Peak with the Henrys Fork route, Uinta access, mileage, gain, camping, altitude, season timing, and summit logistics.',
  'pikes-peak':
    'Plan Pikes Peak with Barr Trail, mileage, elevation gain, altitude, season timing, access, camping options, and summit logistics.',
  'mount-mitchell':
    'Plan Mount Mitchell with standard hiking routes, Blue Ridge access, mileage, gain, elevation, season timing, weather, and summit logistics.',
  'mount-cleveland':
    'Plan Mount Cleveland with Glacier backcountry access, route difficulty, scrambling hazards, mileage, gain, season timing, and planning notes.',
  'south-sister':
    'Plan South Sister with the standard route, Central Cascades permits, mileage, elevation gain, season timing, and volcanic terrain notes.',
  'sierra-blanca-peak':
    'Sierra Blanca Peak guide with access rules, route context, permits, elevation, prominence, terrain notes, and planning cautions.',
  'mcdonald-peak':
    'McDonald Peak guide with Flathead Reservation access, seasonal closure rules, route context, terrain, hazards, and planning notes.',
  'snowshoe-peak':
    'Snowshoe Peak guide with Cabinet Range access, route difficulty, scrambling hazards, mileage, gain, season timing, and planning notes.',
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

function isHikingRoutePeak(peak: Peak): boolean {
  return HIKE_ROUTE_SLUGS.has(peak.slug) || !isTechnicalClimbingPeak(peak);
}

function fitTitle(primary: string, peak: Peak): string {
  if (primary.length <= MAX_META_TITLE_LENGTH) {
    return primary;
  }

  const fallback = isTechnicalClimbingPeak(peak)
    ? `${peak.name} Guide: Route, Gear & Hazards`
    : isAccessSensitivePeak(peak)
      ? `${peak.name} Guide: Access, Route & Planning`
      : isPermitHeavyPeak(peak)
        ? `${peak.name} Guide: Route, Permits & Difficulty`
        : `${peak.name} Hiking Guide: Route & Difficulty`;

  if (fallback.length <= MAX_META_TITLE_LENGTH) {
    return fallback;
  }

  return `${peak.name} Guide | Prominence Registry`;
}

function buildHikingRouteTitle(peak: Peak): string {
  if (isPermitHeavyPeak(peak)) {
    return fitTitle(`${peak.name} Hiking Guide: Route, Permits, Elevation & Difficulty`, peak);
  }
  return fitTitle(`${peak.name} Hiking Guide: Route, Elevation & Difficulty`, peak);
}

export function buildPeakPageTitle(peak: Peak): string {
  const override = PEAK_TITLE_OVERRIDES[peak.slug];
  if (override) {
    return override;
  }

  const { name } = peak;

  if (isAccessSensitivePeak(peak)) {
    return fitTitle(`${name} Access Guide: Route, Permits, Restrictions & Planning`, peak);
  }

  if (isHikingRoutePeak(peak)) {
    return buildHikingRouteTitle(peak);
  }

  if (isTechnicalClimbingPeak(peak)) {
    if (isPermitHeavyPeak(peak)) {
      return fitTitle(`${name} Climbing Guide: Route, Permits, Gear & Hazards`, peak);
    }
    return fitTitle(`${name} Climbing Guide: Route, Gear & Hazards`, peak);
  }

  return buildHikingRouteTitle(peak);
}

function formatRouteForDescription(peak: Peak): string | null {
  if (typeof peak.bestRoute !== 'string' || peak.bestRoute.trim().length === 0) {
    return null;
  }

  return peak.bestRoute
    .trim()
    .replace(/^the\s+/i, '')
    .replace(/\s+/g, ' ');
}

function buildDescriptionCandidates(peak: Peak): string[] {
  const elevation = peak.elevation.toLocaleString('en-US');
  const prominence = peak.prominence.toLocaleString('en-US');
  const ydsClass = typeof peak.ydsClass === 'string' && peak.ydsClass.length > 0 ? peak.ydsClass : null;
  const route = formatRouteForDescription(peak);
  const routePhrase = route ? ` via ${route}` : '';
  const permitPhrase = isPermitHeavyPeak(peak)
    ? 'permits'
    : peak.permitRequired === true
      ? 'permit rules'
      : 'access';
  const routeAndStats = route
    ? `${route} route, ${elevation} ft elevation, ${prominence} ft prominence`
    : `${elevation} ft elevation, ${prominence} ft prominence`;

  if (isAccessSensitivePeak(peak)) {
    return [
      `${peak.name} guide with ${permitPhrase}, restrictions, route context, terrain notes, elevation, prominence, and planning cautions.`,
      `${peak.name}: access, restrictions, route planning, terrain, ${elevation} ft elevation, and ${prominence} ft prominence.`,
    ];
  }

  if (isTechnicalClimbingPeak(peak)) {
    return [
      `Plan ${peak.name}${routePhrase} with ${permitPhrase}, gear, hazards, season timing, route notes, elevation, and prominence.`,
      `${peak.name} climbing guide: ${routeAndStats}, gear, hazards, season timing, and planning notes.`,
    ];
  }

  return [
    `Plan ${peak.name}${routePhrase} with ${permitPhrase}, mileage, gain, difficulty, season timing, elevation, and prominence.`,
    `${peak.name} hiking guide: ${routeAndStats}, difficulty, mileage, gain, season timing, and planning notes.`,
    `${peak.name}: ${elevation} ft elevation, ${prominence} ft prominence, Class ${ydsClass ?? '—'}, route and planning guide.`,
  ];
}

export function buildPeakSeoDescription(peak: Peak): string {
  const override = PEAK_DESCRIPTION_OVERRIDES[peak.slug];
  if (override) {
    return override;
  }

  const candidates = buildDescriptionCandidates(peak);
  const validCandidate = candidates.find(
    (candidate) => candidate.length <= MAX_META_DESCRIPTION_LENGTH,
  );

  if (validCandidate) {
    return validCandidate;
  }

  const elevation = peak.elevation.toLocaleString('en-US');
  const prominence = peak.prominence.toLocaleString('en-US');
  return `${peak.name}: ${elevation} ft elevation, ${prominence} ft prominence, route, difficulty, access, and planning guide.`;
}

export function buildPeakSeoTitle(peak: Peak): string {
  return buildPeakPageTitle(peak);
}

export function getPeakPageTitleBucket(title: string): string {
  if (title.includes('Access Guide')) {
    return 'Access Guide';
  }
  if (title.includes('Climbing Guide')) {
    return 'Climbing Guide';
  }
  if (title.includes('Hiking Guide')) {
    return 'Hiking Guide';
  }
  if (title.includes('Guide: Route, Permits')) {
    return 'Route and Permits Guide';
  }
  return 'Route Guide';
}
