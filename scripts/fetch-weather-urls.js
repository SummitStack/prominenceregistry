/**
 * Resolves mountain-forecast.com forecast URLs for all peaks in peaks.json.
 * Usage: node scripts/fetch-weather-urls.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const peaksPath = join(__dirname, '../src/data/peaks.ts');
const BASE = 'https://www.mountain-forecast.com';

const STATE_NAMES = {
  WA: 'Washington',
  CA: 'California',
  CO: 'Colorado',
  AZ: 'Arizona',
  NV: 'Nevada',
  UT: 'Utah',
  WY: 'Wyoming',
  MT: 'Montana',
  OR: 'Oregon',
  ID: 'Idaho',
  NM: 'New Mexico',
  TX: 'Texas',
  NH: 'New Hampshire',
  NC: 'North Carolina',
  TN: 'Tennessee',
  SD: 'South Dakota',
  ND: 'North Dakota',
};

/** Peaks that need a specific search query or url_part override. */
const OVERRIDES = {
  'mount-jefferson-nv': { query: 'Mount Jefferson Nevada', urlPart: 'Mount-Jefferson-Nevada' },
  'mount-jefferson-or': { query: 'Mount Jefferson Oregon', urlPart: 'Mount-Jefferson-Oregon' },
  'mount-washington': { query: 'Mount Washington New Hampshire' },
  'pilot-peak': { query: 'Pilot Peak Nevada' },
  'star-peak': { query: 'Star Peak Nevada' },
  'she-devil': { query: 'She Devil Idaho' },
  'mount-olympus': { query: 'Mount Olympus Washington' },
  'flat-top-mountain': { query: 'Flat Top Mountain Colorado' },
  'miller-peak': { query: 'Miller Peak Arizona' },
  'mount-eddy': { query: 'Mount Eddy California' },
  'mount-cleveland': { query: 'Mount Cleveland Montana' },
  'mount-stuart': { query: 'Mount Stuart Washington' },
  'arc-dome': { query: 'Arc Dome Nevada' },
  'mount-peale': { query: 'Mount Peale Utah' },
  'mount-graham': { query: 'Mount Graham Arizona' },
  'mount-lemmon': { query: 'Mount Lemmon Arizona' },
  'chiricahua-peak': { query: 'Chiricahua Peak Arizona' },
  'ibapah-peak': { query: 'Ibapah Peak Utah' },
  'deseret-peak': { query: 'Deseret Peak Utah' },
  'mount-nebo': { query: 'Mount Nebo Utah' },
  'mount-timpanogos': { query: 'Mount Timpanogos Utah' },
  'kings-peak': { query: 'Kings Peak Utah' },
  'mount-ellen': { query: 'Mount Ellen Utah' },
  'sierra-blanca-peak': { query: 'Sierra Blanca Peak New Mexico' },
  'mount-san-antonio': { query: 'Mount San Antonio California' },
  'san-jacinto-peak': { query: 'San Jacinto Peak California' },
  'san-gorgonio-mountain': { query: 'San Gorgonio Mountain' },
  'white-mountain-peak': { query: 'White Mountain Peak California' },
  'telescope-peak': { query: 'Telescope Peak California' },
  'hayford-peak': { query: 'Hayford Peak Nevada' },
  'diamond-peak': { query: 'Diamond Peak Nevada' },
  'north-schell-peak': { query: 'North Schell Peak Nevada' },
  'wheeler-peak': { query: 'Wheeler Peak Nevada' },
  'crazy-peak': { query: 'Crazy Peak Montana' },
  'mcdonald-peak': { query: 'McDonald Peak Montana' },
  'snowshoe-peak': { query: 'Snowshoe Peak Montana' },
  'abercrombie-mountain': { query: 'Abercrombie Mountain Washington' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchPeak(query) {
  const res = await fetch(`${BASE}/location_search`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Search failed for "${query}": ${res.status}`);
  return res.json();
}

function pickMountainResult(data, peak) {
  const items = [
    ...(data.main?.items ?? []),
    ...(data.other?.items ?? []),
  ].filter((item) => item.type === 'MountainLocation');

  if (items.length === 0) return null;
  if (items.length === 1) return items[0];

  const stateName = STATE_NAMES[peak.state];
  const byState = items.find(
    (item) =>
      item.country_name?.includes('United States') &&
      (item.region_name?.includes(stateName) ||
        item.name?.includes(stateName) ||
        item.name_en?.includes(stateName))
  );
  if (byState) return byState;

  const byName = items.find(
    (item) =>
      item.name?.toLowerCase().includes(peak.name.toLowerCase()) ||
      item.name_en?.toLowerCase().includes(peak.name.toLowerCase())
  );
  return byName ?? items[0];
}

async function getForecastUrl(urlPart) {
  const res = await fetch(`${BASE}/peaks/${urlPart}`);
  if (!res.ok) throw new Error(`Peak page not found: ${urlPart} (${res.status})`);
  const html = await res.text();

  const matches = [...html.matchAll(/href="(\/peaks\/[^"]+\/forecasts\/(\d+))"/g)];
  if (matches.length === 0) {
    throw new Error(`No forecast links on peak page: ${urlPart}`);
  }

  // Prefer the highest elevation forecast (summit).
  let best = matches[0];
  for (const m of matches) {
    if (Number(m[2]) > Number(best[2])) best = m;
  }

  return `${BASE}${best[1]}`;
}

async function resolvePeak(peak) {
  const override = OVERRIDES[peak.slug];
  let urlPart = override?.urlPart;

  if (!urlPart) {
    const query = override?.query ?? peak.name;
    const data = await searchPeak(query);
    const match = pickMountainResult(data, peak);
    if (!match) throw new Error(`No mountain result for "${query}"`);
    urlPart = match.url_part;
  }

  const url = await getForecastUrl(urlPart);
  return { urlPart, url };
}

async function main() {
  const peaks = JSON.parse(readFileSync(peaksPath, 'utf8'));
  const results = [];
  const failures = [];

  for (const peak of peaks) {
    try {
      const { urlPart, url } = await resolvePeak(peak);
      results.push({ slug: peak.slug, name: peak.name, urlPart, url });
      console.log(`✓ ${peak.name} → ${url}`);
      await sleep(300);
    } catch (err) {
      failures.push({ slug: peak.slug, name: peak.name, error: err.message });
      console.error(`✗ ${peak.name}: ${err.message}`);
    }
  }

  if (failures.length > 0) {
    console.error('\nFailures:', failures);
    process.exitCode = 1;
    return;
  }

  for (const peak of peaks) {
    const match = results.find((r) => r.slug === peak.slug);
    peak.weatherForecastUrl = match.url;
  }

  writeFileSync(peaksPath, `${JSON.stringify(peaks, null, 2)}\n`);
  console.log(`\nUpdated ${peaks.length} peaks in ${peaksPath}`);
}

main();
