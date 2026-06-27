import imageManifest from '../data/imageManifest.json';
import peaksData from '../data/peaks.json';
import { SITE_URL } from '../lib/constants';
import { buildPeakImageAlt } from '../utils/imageHelpers';
import { getStateName } from '../utils/stateNames';

export const prerender = true;

type ImageFormatPair = {
  webp: string;
  jpg: string;
};

type PeakImageSet = {
  heroDesktop: ImageFormatPair;
  heroMobile: ImageFormatPair;
  cardDesktop: ImageFormatPair;
  cardMobile: ImageFormatPair;
};

type ImageManifest = Record<string, PeakImageSet>;

type PeakWithImageData = {
  slug: string;
  name: string;
  state: string;
  published?: boolean;
  mountainRange?: string;
};

const manifest = imageManifest as ImageManifest;
const peaks = peaksData as PeakWithImageData[];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function pageUrl(slug: string): string {
  return `${SITE_URL}/${slug}/`;
}

export async function GET() {
  const entries = peaks
    .filter((peak) => peak.published === true && manifest[peak.slug])
    .map((peak) => {
      const images = manifest[peak.slug];
      const stateName = getStateName(peak.state);
      const location = peak.mountainRange
        ? `${peak.mountainRange}, ${stateName}`
        : stateName;

      return `  <url>
    <loc>${escapeXml(pageUrl(peak.slug))}</loc>
    <image:image>
      <image:loc>${escapeXml(absoluteUrl(images.heroDesktop.jpg))}</image:loc>
      <image:title>${escapeXml(`${peak.name} summit image`)}</image:title>
      <image:caption>${escapeXml(buildPeakImageAlt(peak.slug, `${peak.name} summit landscape`))}</image:caption>
      <image:geo_location>${escapeXml(location)}</image:geo_location>
    </image:image>
  </url>`;
    });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
