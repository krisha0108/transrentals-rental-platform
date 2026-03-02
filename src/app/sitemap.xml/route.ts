import { NextResponse } from 'next/server';
import { escapeXml } from '@/lib/sitemap/utils';

// Index rarely changes — cache for 24 hours
export const revalidate = 86400;

const BASE_URL = 'https://transrentals.in';

const SUB_SITEMAPS = [
  { url: `${BASE_URL}/sitemap-static.xml`,   label: 'Static pages' },
  { url: `${BASE_URL}/sitemap-services.xml`, label: 'Service + city pages' },
  { url: `${BASE_URL}/sitemap-states.xml`,   label: 'State hub pages' },
  { url: `${BASE_URL}/sitemap-routes.xml`,   label: 'Route pages (one-way, round-trip, airport)' },
  { url: `${BASE_URL}/sitemap-blog.xml`,     label: 'Blog posts + categories' },
];

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    SUB_SITEMAPS.map(
      (s) =>
        `  <sitemap>\n` +
        `    <loc>${escapeXml(s.url)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `  </sitemap>`
    ).join('\n') +
    `\n</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
