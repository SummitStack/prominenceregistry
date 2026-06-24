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
  mountainRange: z.string().min(1),
  ydsClass: z.string().min(1),
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
  published: z.boolean(),
  heroImage: z.string().min(1),
  isolation: z.number().optional().nullable(),
  hazards: z.array(z.string()),
  technicalRequirements: z.array(z.string()),
  verification: z
    .object({
      status: VerificationStatusSchema,
      lastChecked: z.string().optional().nullable(),
      checkedAgainst: z.array(z.string()).optional(),
      notes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type Peak = z.infer<typeof PeakSchema>;
export const PeaksArraySchema = z.array(PeakSchema);
