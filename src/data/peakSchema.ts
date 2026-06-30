import { z } from 'zod';

const GearIdSchema = z.enum([
  'crampons',
  'ice_axe',
  'mountaineering_boots',
  'helmet',
  'rope_harness',
  'insulating_layer',
  'waterproof_shell',
  'bear_canister',
  'microspikes',
  'trekking_poles',
  'gaiters',
  'avalanche_kit',
  'insulating_hat',
  'water_capacity',
]);

const PermitStatusSchema = z.enum([
  'none',
  'self-register',
  'fee',
  'limited',
  'lottery',
]);

const YdsClassSchema = z.enum([
  '1',
  '2',
  '2+',
  '3',
  '3+',
  '4',
  '4+',
  '5',
  '5.0',
  '5.1',
  '5.2',
  '5.3',
  '5.4',
  '5.5',
]);

const VerificationStatusSchema = z.enum([
  'draft',
  'needs-review',
  'partially-verified',
  'verified',
  'stale',
]);

export const PeakSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  state: z.string().length(2),
  elevation: z.number().positive(),
  prominence: z.number().min(4921), // ultra-prominent threshold
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isolation: z.number().optional().nullable(),
  mountainRange: z.string().min(1),
  easiestYdsClass: YdsClassSchema,
  published: z.boolean(),
});

export const PeakRouteSchema = z.object({
  slug: z.string().min(1),
  ydsClass: YdsClassSchema,
  difficulty: z.number().min(1).max(10),
  days: z.number().positive(),
  daysMin: z.number().positive(),
  daysMax: z.number().positive(),
  daysDisplay: z.string().min(1),
  distance: z.number().positive(),
  distanceMin: z.number().positive(),
  distanceMax: z.number().positive(),
  distanceDisplay: z.string().min(1),
  gain: z.number().positive(),
  gainMin: z.number().positive(),
  gainMax: z.number().positive(),
  gainDisplay: z.string().min(1),
  bestRoute: z.string().min(1),
  season: z.string().min(1),
  gear: z.array(GearIdSchema),
  permitStatus: PermitStatusSchema.nullable(),
  permitFee: z.string().nullable(),
  permitRequired: z.boolean(),
  permitSeason: z.string().min(1),
  heroImage: z.string().min(1),
  weatherForecastUrl: z.string().optional().nullable(),
  hazards: z.array(z.string()),
  technicalRequirements: z.array(z.string()),
  requiredGear: z
    .object({
      priority: z.array(z.string()).optional(),
      secondary: z.array(z.string()).optional(),
    })
    .optional(),
  hasCallout: z.boolean().optional(),
  callout: z.string().optional(),
  hasSafetyNote: z.boolean().optional(),
  safetyNote: z.string().optional(),
  relatedLinks: z
    .array(
      z.object({
        section: z.enum(['route-details', 'permits-camping']),
        label: z.string().min(1),
        description: z.string().min(1),
        href: z.string().min(1),
      })
    )
    .optional(),
});

export const PeakVerificationSchema = z.object({
  status: VerificationStatusSchema,
  lastChecked: z.string().optional().nullable(),
  checkedAgainst: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

export type Peak = z.infer<typeof PeakSchema>;
export type PeakRoute = z.infer<typeof PeakRouteSchema>;

export const PeaksArraySchema = z.array(PeakSchema);
export const PeakRoutesArraySchema = z.array(PeakRouteSchema);
