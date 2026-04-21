import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/** GET /api/admin/seo/city-page-overrides
 *  Returns all seo_meta rows whose servicePageId starts with "city:"
 *  as a map: { [pageId]: SeoOverride }
 */
export async function GET() {
  try {
    const rows = await prisma.seo_meta.findMany({
      where: { servicePageId: { startsWith: 'city:' } },
      select: {
        servicePageId: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        pageHeading: true,
        pageDescription: true,
        sectionsConfig: true,
      },
    });

    const overrides: Record<string, typeof rows[number]> = {};
    for (const row of rows) {
      overrides[row.servicePageId] = row;
    }

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('[city-page-overrides GET]', error);
    return NextResponse.json({ overrides: {} });
  }
}
