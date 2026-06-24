# Prominence Registry

Static field guides for the most topographically prominent peaks in the contiguous United States. Built with [Astro](https://astro.build).

## Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run prebuild` | Validate peaks and generate schema cache |
| `npm run build` | Prebuild schema + production build to `./dist/` |
| `npm run test` | Run schema unit tests |
| `npm run preview` | Preview production build |

## Schema & SEO

Every peak page includes [schema.org](https://schema.org) **Mountain** and **GeoCoordinates** JSON-LD in the page `<head>`, generated from `src/data/peaks.json`. The homepage includes an **Organization** schema.

### Adding or updating a peak

1. Edit the peak entry in `src/data/peaks.json`.
2. Schema updates automatically on the next dev request or build (hash-based cache invalidation).
3. Run `npm run prebuild` to validate all peaks and refresh the schema cache.

### Required fields for Mountain schema

| Field | Source | Rule |
| :---- | :----- | :--- |
| `name` | `peak.name` | Non-empty string |
| `elevation` | `peak.elevation` | 5,000–21,000 ft |
| `latitude` / `longitude` | `peak.latitude`, `peak.longitude` | Valid WGS84 ranges |
| `state` | `peak.state` | Two-letter US state code |
| `slug` | `peak.slug` | Used for canonical URL |
| `description` | `content.overview[0]` | First 75 words (fallback auto-generated) |

Optional: `mountainRange` → `location`, `alternateName`, hero image from image manifest.

### Validation errors

```text
✗ Mount Example: latitude is required and must be a number
✗ Mount Example: elevation must be > 5000 and < 21000 (got 3000)
```

Peaks missing coordinates or with invalid data are **skipped** for JSON-LD (page still builds). Set `SCHEMA_STRICT=1` on prebuild to fail the build when any peak is invalid:

```sh
SCHEMA_STRICT=1 npm run build
```

### Manual cache invalidation

```ts
import { invalidateSchema, invalidateAllSchemas } from './src/lib/schema-cache';
invalidateSchema('mount-whitney');
invalidateAllSchemas();
```

### Key modules

- `src/types/peak.ts` — Peak type and validation constants
- `src/lib/schema-generator.ts` — `generateMountainSchema`, `validatePeakData`
- `src/lib/schema-cache.ts` — In-memory cache
- `src/lib/peak-loader.ts` — `getPeakData`, `getPeakSchema`, change detection
- `src/components/PeakSchemaHead.astro` — Injects JSON-LD on peak pages
- `scripts/prebuild-schema.ts` — Validates all peaks before build
