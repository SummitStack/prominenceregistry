/**
 * Peak metadata used for page rendering and schema.org JSON-LD generation.
 * Source of truth: src/data/peaks.json
 */

export type PeakContent = {
  overview?: string[];
  routeDescription?: string[];
  routeLandmarks?: string[];
  permitsClimbing?: string;
  permitsCamping?: string | string[];
  wildlife?: string;
  footnote?: string;
};

export type RequiredGear = {
  priority?: string[];
  secondary?: string[];
};

/** Peak record from peaks.json, with fields required for schema generation. */
export type Peak = {
  slug: string;
  name: string;
  state: string;
  elevation: number;
  prominence: number;
  difficulty: number;
  days: number;
  distance: number;
  gain: number;
  latitude?: number;
  longitude?: number;
  mountainRange?: string;
  alternateName?: string;
  bestRoute?: string;
  heroImage?: string;
  content?: PeakContent;
  hazards?: string[];
  technicalRequirements?: string[];
  requiredGear?: RequiredGear;
  [key: string]: unknown;
};

export const VALID_STATE_CODES = [
  'WA', 'CA', 'CO', 'AZ', 'NV', 'UT', 'WY', 'MT', 'OR', 'ID', 'NM', 'TX',
  'NH', 'NC', 'TN', 'SD', 'ND',
] as const;

export type StateCode = (typeof VALID_STATE_CODES)[number];

/** Schema-relevant numeric bounds (elevation in feet). */
export const SCHEMA_VALIDATION = {
  elevationMin: 5000,
  elevationMax: 21000,
  latitudeMin: -90,
  latitudeMax: 90,
  longitudeMin: -180,
  longitudeMax: 180,
  introWordLimit: 75,
} as const;

export function isPeak(value: unknown): value is Peak {
  if (!value || typeof value !== 'object') return false;
  const p = value as Peak;
  return (
    typeof p.slug === 'string' &&
    typeof p.name === 'string' &&
    typeof p.state === 'string' &&
    typeof p.elevation === 'number' &&
    typeof p.prominence === 'number'
  );
}
