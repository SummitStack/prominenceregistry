/**
 * Populates weatherForecastUrl for all peaks in peaks.json.
 * Run: node scripts/apply-weather-urls.js
 *
 * URLs verified against mountain-forecast.com (summit elevation forecast).
 * Peaks without a dedicated page use the nearest listed summit in the same range.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const peaksPath = join(__dirname, '../src/data/peaks.json');
const BASE = 'https://www.mountain-forecast.com/peaks';

/** slug → urlPart/elevationMeters (summit forecast) */
const FORECAST_URLS = {
  'mount-rainier': `${BASE}/Mount-Rainier/forecasts/4392`,
  'mount-whitney': `${BASE}/Mount-Whitney/forecasts/4418`,
  'mount-shasta': `${BASE}/Mount-Shasta/forecasts/4317`,
  'mount-elbert': `${BASE}/Mount-Elbert/forecasts/4399`,
  'mount-baker': `${BASE}/Mount-Baker/forecasts/3285`,
  'san-jacinto-peak': `${BASE}/Mount-San-Jacinto-Peak/forecasts/3293`,
  'san-gorgonio-mountain': `${BASE}/San-Gorgonio/forecasts/3505`,
  'charleston-peak': `${BASE}/Mount-Charleston/forecasts/3633`,
  'mount-adams': `${BASE}/Mount-Adams/forecasts/3741`,
  'mount-olympus': `${BASE}/Mount-Olympus-2/forecasts/2427`,
  'mount-hood': `${BASE}/Mount-Hood/forecasts/3426`,
  'wheeler-peak': `${BASE}/Wheeler-Peak/forecasts/3982`,
  'glacier-peak': `${BASE}/Glacier-Peak/forecasts/3213`,
  'white-mountain-peak': `${BASE}/White-Mountain-Peak/forecasts/4342`,
  'gannett-peak': `${BASE}/Gannett-Peak/forecasts/4207`,
  'cloud-peak': `${BASE}/Cloud-Peak/forecasts/4013`,
  'grand-teton': `${BASE}/Grand-Teton/forecasts/4197`,
  'sacajawea-peak': `${BASE}/Sacajawea-Peak/forecasts/2999`,
  'kings-peak': `${BASE}/Kings-Peak/forecasts/4123`,
  'mount-graham': `${BASE}/Mount-Graham/forecasts/3267`,
  'mount-san-antonio': `${BASE}/Mount-San-Antonio/forecasts/3068`,
  'telescope-peak': `${BASE}/Telescope-Peak/forecasts/3368`,
  'mount-peale': `${BASE}/Mount-Peale/forecasts/3877`,
  'mount-washington': `${BASE}/Mount-Washington-2/forecasts/1917`,
  'mount-mitchell': `${BASE}/Mount-Mitchell/forecasts/2037`,
  'humphreys-peak': `${BASE}/Humphreys-Peak/forecasts/3851`,
  'borah-peak': `${BASE}/Borah-Peak-Mount-Borah/forecasts/3859`,
  'mount-jefferson-nv': `${BASE}/Mount-Jefferson-Nevada/forecasts/3642`,
  'mount-ellen': `${BASE}/Mount-Ellen-Utah/forecasts/3512`,
  'deseret-peak': `${BASE}/Deseret-Peak/forecasts/3362`,
  'mount-jefferson-or': `${BASE}/Mount-Jefferson/forecasts/3199`,
  'pilot-peak': `${BASE}/Pilot-Peak-Nevada/forecasts/3267`,
  'crazy-peak': `${BASE}/Crazy-Peak/forecasts/3418`,
  'mcdonald-peak': `${BASE}/McDonald-Peak/forecasts/2993`,
  'south-sister': `${BASE}/South-Sister-Volcano/forecasts/3157`,
  'sierra-blanca-peak': `${BASE}/Sierra-Blanca/forecasts/3659`,
  'pikes-peak': `${BASE}/Pikes-Peak/forecasts/4300`,
  'mount-nebo': `${BASE}/Mount-Nebo/forecasts/3636`,
  'snowshoe-peak': `${BASE}/Snowshoe-Peak/forecasts/2663`,
  'north-schell-peak': `${BASE}/North-Schell-Peak/forecasts/3622`,
  // No dedicated page — nearest listed summit in Humboldt/Schell Creek area
  'star-peak': `${BASE}/North-Schell-Peak/forecasts/3622`,
  // No dedicated page — nearest listed summit in Spring/Sheep Range area
  'hayford-peak': `${BASE}/Griffith-Peak/forecasts/3371`,
  // No dedicated page — nearest listed summit in Lemhi/Lost River Range
  'diamond-peak': `${BASE}/Borah-Peak-Mount-Borah/forecasts/3859`,
  'flat-top-mountain': `${BASE}/Flattop-Mountain/forecasts/3808`,
  'mount-stuart': `${BASE}/Mount-Stuart/forecasts/2869`,
  'blanca-peak': `${BASE}/Blanca-Peak/forecasts/4372`,
  'mount-timpanogos': `${BASE}/Mount-Timpanogos/forecasts/3581`,
  'ibapah-peak': `${BASE}/Ibapah/forecasts/3688`,
  'lassen-peak': `${BASE}/Lassen-Peak/forecasts/3187`,
  'mount-cleveland': `${BASE}/Mount-Cleveland-Montana/forecasts/3190`,
  'arc-dome': `${BASE}/Arc-Dome/forecasts/3589`,
  'she-devil': `${BASE}/Seven-Devils-Mountains/forecasts/2859`,
  'abercrombie-mountain': `${BASE}/Abercrombie-Peak/forecasts/2175`,
  'mount-lemmon': `${BASE}/Mount-Lemmon/forecasts/2791`,
  'chiricahua-peak': `${BASE}/Chiricahua-Peak/forecasts/2974`,
  'mount-eddy': `${BASE}/Mount-Eddy/forecasts/2751`,
  'miller-peak': `${BASE}/Miller-Peak-Arizona/forecasts/2885`,
};

async function verifyUrl(url) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  return res.ok;
}

async function main() {
  const peaks = JSON.parse(readFileSync(peaksPath, 'utf8'));
  const missing = peaks.filter((p) => !FORECAST_URLS[p.slug]);

  if (missing.length > 0) {
    console.error('Missing URL mapping for:', missing.map((p) => p.slug));
    process.exit(1);
  }

  let failed = 0;
  for (const [slug, url] of Object.entries(FORECAST_URLS)) {
    const ok = await verifyUrl(url);
    if (!ok) {
      console.error(`✗ ${slug}: ${url} returned non-200`);
      failed++;
    } else {
      console.log(`✓ ${slug}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }

  for (const peak of peaks) {
    peak.weatherForecastUrl = FORECAST_URLS[peak.slug];
  }

  writeFileSync(peaksPath, `${JSON.stringify(peaks, null, 2)}\n`);
  console.log(`\nUpdated ${peaks.length} peaks.`);
}

main();
