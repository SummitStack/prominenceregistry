import type { Peak } from '../types/peak';

export const MAX_META_DESCRIPTION_LENGTH = 155;
export const MAX_META_TITLE_LENGTH = 60;

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

const PEAK_TITLE_SUFFIX = ' Route, Prominence & Permit Guide | Prominence Registry';
const PEAK_TITLE_SHORT_SUFFIX = ' Guide | Prominence Registry';

export function buildPeakSeoTitle(peak: Peak): string {
  const fullTitle = `${peak.name}${PEAK_TITLE_SUFFIX}`;
  if (fullTitle.length <= MAX_META_TITLE_LENGTH) {
    return fullTitle;
  }
  return `${peak.name}${PEAK_TITLE_SHORT_SUFFIX}`;
}
