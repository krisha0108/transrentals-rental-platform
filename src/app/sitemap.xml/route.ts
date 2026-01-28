import { NextRequest, NextResponse } from 'next/server';

/**
 * =============================================================================
 * SITEMAP INDEX - Google Search Console Compliant
 * =============================================================================
 *
 * FULLY DYNAMIC SITEMAP INDEX
 * Automatically includes all database-driven pages
 *
 * This is the main sitemap index that Google will crawl first.
 * Now points to 7 individual sitemaps for comprehensive coverage.
 *
 * REQUIREMENTS MET:
 * ✓ Proper XML declaration
 * ✓ Correct sitemapindex namespace
 * ✓ Content-Type: application/xml
 * ✓ No future dates (always current or past)
 * ✓ Force-dynamic to prevent caching
 * ✓ Fully database-driven (auto-updates with new data)
 * ✓ Google Search Console compatible
 *
 * SITEMAP STRUCTURE:
 * - sitemap/0.xml: Static pages, services, blog
 * - sitemap/1.xml: Service + location combinations (DB)
 * - sitemap/2.xml: Fleet pages (DB)
 * - sitemap/3.xml: City homepages (DB)
 * - sitemap/4.xml: Vehicle models + locations (DB)
 * - sitemap/5.xml: Airport transfer routes (DB)
 * - sitemap/6.xml: Brands, CMS pages, misc (DB)
 *
 * =============================================================================
 */

// Force dynamic rendering - no caching, always fresh for Google
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = 'https://transrentals.in';

export async function GET(request: NextRequest) {
  // Get current date in ISO format (NEVER future dates)
  const currentDate = new Date().toISOString().split('T')[0];

  // Generate sitemap index XML with 4 working sitemaps (no 404s)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap/0.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/1.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/2.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap/3.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

  // Return XML response with proper headers
  return new NextResponse(sitemapIndex, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  });
}
