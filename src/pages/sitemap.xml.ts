import peaksData from '../data/peaks';
import { peakListDefinitions } from '../data/peakLists';
import { SITE_URL } from '../lib/constants';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({
  loc,
  lastmod,
  changefreq,
  priority,
}: {
  loc: string;
  lastmod?: string | null;
  changefreq: string;
  priority: string;
}) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const publishedPeaks = peaksData.filter((peak) => peak.published === true);

  const urls = [
    urlEntry({
      loc: `${SITE_URL}/`,
      changefreq: 'weekly',
      priority: '1.0',
    }),
    urlEntry({
      loc: `${SITE_URL}/about/`,
      changefreq: 'monthly',
      priority: '0.6',
    }),
    urlEntry({
      loc: `${SITE_URL}/glossary/`,
      changefreq: 'monthly',
      priority: '0.6',
    }),
    urlEntry({
      loc: `${SITE_URL}/lists/`,
      changefreq: 'weekly',
      priority: '0.8',
    }),
    ...peakListDefinitions.map((list) =>
      urlEntry({
        loc: `${SITE_URL}/lists/${list.slug}/`,
        changefreq: 'weekly',
        priority: '0.7',
      }),
    ),
    ...publishedPeaks.map((peak) =>
      urlEntry({
        loc: `${SITE_URL}/${peak.slug}/`,
        lastmod: peak.verification?.lastChecked ?? null,
        changefreq: 'monthly',
        priority: '0.8',
      }),
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
