# New Peak Entry Checklist

Use this checklist when adding or updating a peak entry.

## Files to update

### 1. Structured peak facts

File: `src/data/peaks/peaks.json`

Use for stable structured fields: slug, name, state, elevation, prominence, coordinates, route stats, permits, season, hazards, gear, hero image, weather URL, and published status.

### 2. Long-form article content

File: `src/data/peaks/content.json`

Use for page prose: overview, routeDescription, routeLandmarks, permitsClimbing, permitsCamping, wildlife or season notes, and footnote.

### 3. Verification and sources

File: `src/data/peaks/verification.json`

Use for research status: dataSource, verification.status, verification.lastChecked, verification.checkedAgainst, and verification.notes.

## Required check

After editing peak data, run `npm run build`.

## Commit pattern

Run:

`git add src/data/peaks/peaks.json src/data/peaks/content.json src/data/peaks/verification.json`

`git commit -m "Update peak content"`

`git push`

## Rule of thumb

Do not put long article prose in `peaks.json`.

Do not put source or fact-check workflow notes in `peaks.json`.

Keep `peaks.json` for structured data only.
